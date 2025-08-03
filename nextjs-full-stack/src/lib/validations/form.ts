import { z } from "zod";

  export const BASE_EMAIL_FORM_SCHEMA = z.object({
    email: z.email({ message: "Моля, въведете валиден имейл адрес." }),
  });

  export const searchQueryFormSchema = z.object({
    search_query: z
      .string()
      .min(3, "Полето за търсене трябва да съдържа поне 3 символа."),
  });

  export const specialSearchFormSchema = z.object({
    product_name: z
      .string()
      .trim()
      .min(3, "Името на продукта трябва да бъде поне 3 символа."),
    product_category: z.string("Моля изберете категория на продукта"),
    filters: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Името на филтъра е задължително."),
          value: z
            .string()
            .trim()
            .min(1, "Стойността на филтъра е задължителна."),
        })
      )
      .optional(),
  });

  export const extendedPriceAlertFormSchema = BASE_EMAIL_FORM_SCHEMA.extend({
    targetPrice: z.coerce
      .number({ error: "Моля, въведете число." })
      .positive({ error: "Цената трябва да е положително число." })
      .optional()
      .or(z.literal("")),
  });

  export type BaseEmailForm = z.infer<typeof BASE_EMAIL_FORM_SCHEMA>;
  export type SearchQueryForm = z.infer<typeof searchQueryFormSchema>;
  export type SpecialSearchFormValues = z.infer<typeof specialSearchFormSchema>;
  export type ExtendedPriceAlertForm = z.infer<typeof extendedPriceAlertFormSchema>;
 
