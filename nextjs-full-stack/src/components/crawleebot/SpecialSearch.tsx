"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import { Loader2, Plus, X, CheckCircle, Bot } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  SpecialSearchFormValues,
  SpecialSearchFormSchema,
} from "@/lib/validations/form";
import { startCrawleeBot } from "@/lib/data";
import { ProductPreview } from "@/lib/validations/product";

type TaskUpdate = {
  status: string;
  message?: string;
  data?: ProductPreview[];
}
export default function SpecialSearch(){
  return (
    <Suspense>
      <SpecialSearchComponent />
    </Suspense>
  )
}
 function SpecialSearchComponent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);

  const [componentState, setComponentState] = useState<
    "form" | "analyzing" | "results"
  >("form");
  const [statusHistory, setStatusHistory] = useState<TaskUpdate[]>([]);
  const [results, setResults] = useState<ProductPreview[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SpecialSearchFormValues>({
    resolver: zodResolver(SpecialSearchFormSchema),
    defaultValues: {
      product_name: "",
      product_category: "",
      filters: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "filters",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const rawQuery = searchParams.get("q") || "";
    if (typeof window !== "undefined") {
      const cleanQuery = DOMPurify.sanitize(rawQuery);
      if (cleanQuery) {
        form.setValue("product_name", cleanQuery);
      }
    }
  }, [searchParams, form]);

  const onSubmit = async (values: SpecialSearchFormValues) => {
    setServerError(null);
    setStatusHistory([]);
    setResults([]);
    setComponentState("analyzing");

    try {
      const startResult = await startCrawleeBot(values);
      if (!startResult.success) {
        setServerError(startResult.error);
        setComponentState("form");
        return;
      }

      const task_id  = startResult.data.task_id;
      toast.success("Анализът започна успешно! Моля изчакайте.");

      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}/ws/analysis/${task_id}`
      );

      ws.onopen = () => console.log("WebSocket connection established.");

      ws.onmessage = (event) => {
        const update: TaskUpdate = JSON.parse(event.data);
        setStatusHistory((prevHistory) => {
          const lastMessage =
            prevHistory.length > 0
              ? prevHistory[prevHistory.length - 1].message
              : null;

          // only add the new update if its message is different from the last one.
          if (update.message && update.message !== lastMessage) {
            return [update];
          }

          return prevHistory;
        });

        if (update.status === "COMPLETE") {
          setResults(update.data || []);
          setComponentState("results");
          ws.close();
        } else if (update.status === "ERROR") {
          setServerError(
            update.message || "Възникна грешка по време на анализа."
          );
          setComponentState("form");
          ws.close();
        }
      };

      ws.onerror = () => {
        setServerError("Връзката със сървъра за анализ беше прекъсната.");
        setComponentState("form");
      };

      ws.onclose = () => console.log("WebSocket connection closed.");
    } catch (err) {
      console.error(err);
      setServerError(
        "Неуспешно свързване със сървъра за стартиране на анализ."
      );
      setComponentState("form");
    }
  };
  if (!isMounted) {
    return null;
  }

  if (componentState === "analyzing") {
    return (
      <div className="mt-12 max-w-2xl mx-auto p-6 border rounded-lg bg-card shadow-sm text-left">
        <h2 className="font-semibold mb-4 text-center text-lg flex items-center justify-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          CrawleeBot Анализ в реално време
        </h2>
        <div className="space-y-4">
          {statusHistory.map((update, index) => (
            <div
              key={index}
              className="flex items-center gap-4 animate-in fade-in duration-500">
              {update.status === "COMPLETE" ? (
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              ) : (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin flex-shrink-0" />
              )}
              <span className="text-card-foreground shimmer-text ">{update.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (componentState === "results") {
    return (
      <div className="mt-12 text-left w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Резултати от анализа</h2>
          <Button onClick={() => setComponentState("form")}>
            Ново търсене
          </Button>
        </div>
        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((product) => (
              <div key={product.id}>
                <div>{product.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>Няма намерени резултати за вашата заявка.</p>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 mt-8">
        <div className="flex flex-col justify-between md:flex-row gap-4">
          <FormField
            control={form.control}
            name="product_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-800 dark:text-slate-200">
                  Име на продукта
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Напр. Apple Iphone 16..."
                    className=" text-lg w-full md:w-md"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="product_category"
            render={({ field }) => (
              <FormItem className="h-12">
                <FormLabel>Категория на продукта</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl className="w-full lg:w-md">
                    <SelectTrigger>
                      <SelectValue placeholder="Избери категорията на продукта" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Смартфон">Смартфон</SelectItem>
                    <SelectItem value="Лаптоп">Лаптоп</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Допълнителни филтри (препоръчително)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Натиснете бутона (+), за да добавите филтър. Посочете име (напр.
              &quot;RAM памет&quot;) и стойност (напр. &quot;16 GB&quot;).
            </p>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`filters.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Име на филтър (напр. Цена)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`filters.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Стойност (напр. 1669-2420)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-slate-500"
                title="Изтрий филтър">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: "", value: "" })} // add field
            className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Добави нов филтър
          </Button>
        </div>

        <div className="text-center">
          <Button
            disabled={form.formState.isSubmitting}
            type="submit"
            size="lg"
            className="w-full max-w-xs h-14 text-lg font-semibold bg-gradient-to-r from-sky-500 to-purple-600 hover:scale-105 transition-transform duration-300">
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Анализирай пазара с {2 + (form.watch("filters")?.length || 0)}{" "}
            Критерия
          </Button>
        </div>
        {serverError && (
          <p className="text-sm text-red-500 text-center">{serverError}</p>
        )}
      </form>
    </Form>
  );
}
