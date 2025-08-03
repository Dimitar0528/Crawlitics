// components/products/PriceAlertForm.tsx

"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

import {
  BASE_EMAIL_FORM_SCHEMA,
  extendedPriceAlertFormSchema,
  ExtendedPriceAlertForm,
} from "@/lib/validations/form";

export default function PriceAlertForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [showTargetPrice, setShowTargetPrice] = useState(false);

  const form = useForm<ExtendedPriceAlertForm>({
    resolver: zodResolver(
      showTargetPrice ? extendedPriceAlertFormSchema : BASE_EMAIL_FORM_SCHEMA
    ),
    defaultValues: {
      email: "",
      targetPrice: "",
    },
  });

  const onSubmit = async (values: ExtendedPriceAlertForm) => {
    console.log(values);
    setIsSuccess(true);
    if (isSuccess)
      toast.success("Готово! Ще ви уведомим при промяна в цената.");
  };

  return (
    <div className="rounded-lg border bg-slate-50 p-6 dark:bg-slate-800/50 dark:border-slate-700">
      <h4 className="flex items-center gap-2 font-semibold text-foreground">
        <Mail className="h-5 w-5 text-purple-500" />
        Получаване на известие при спад на цената
      </h4>
      <p className="mt-2 text-sm text-muted-foreground">
        Ще ви изпратим известие при всяка промяна или когато цената падне под
        определена от вас стойност.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="your@email.com"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto shrink-0">
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Уведоми ме
            </Button>
          </div>

          {showTargetPrice && (
            <FormField
              control={form.control}
              name="targetPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">
                    Желана цена (лв):
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="e.g., 950.00"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          )}

          <div>
            <Button
              type="button"
              variant="link"
              className="p-0 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
              onClick={() => setShowTargetPrice(!showTargetPrice)}>
              {showTargetPrice
                ? "- Премахни желаната цена"
                : "+ Задай желана цена"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
