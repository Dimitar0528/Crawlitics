"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import { Plus, X } from "lucide-react";
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
  specialSearchFormSchema,
} from "@/lib/validations/form";

export default function SpecialSearchForm() {
  const searchParams = useSearchParams();

  const form = useForm<SpecialSearchFormValues>({
    resolver: zodResolver(specialSearchFormSchema),
    defaultValues: {
      product_name: "",
      filters: [],
    },
  });
  // used for dynamic filter inputs
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "filters",
  });

  useEffect(() => {
    const rawQuery = searchParams.get("q") || "";
    const cleanQuery = DOMPurify.sanitize(rawQuery);
    if (cleanQuery) {
      form.setValue("product_name", cleanQuery);
    }
  }, [searchParams, form]);

  const onSubmit = (values: SpecialSearchFormValues) => {
    console.log("Form submitted with valid data:", values);

    const searchPayload = {
      category: values.product_category,
      query: values.product_name,
      filters: values.filters?.reduce((acc, filter) => {
        acc[filter.name] = filter.value;
        return acc;
      }, {} as Record<string, string>),
    };

    toast.success("Започване на анализ...");
    console.log("Starting analysis with payload:", searchPayload);
  };

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
                onClick={() => remove(index)} // remove field
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
            type="submit"
            size="lg"
            className="w-full max-w-xs h-14 text-lg font-semibold bg-gradient-to-r from-sky-500 to-purple-600 hover:scale-105 transition-transform duration-300">
            Анализирай пазара с {2 + (form.watch("filters")?.length || 0)}{" "}
            Критерия
          </Button>
        </div>
      </form>
    </Form>
  );
}
