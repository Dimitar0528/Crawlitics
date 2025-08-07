import { z } from "zod";

const ID_SCHEMA = z.number().int().positive();
const SLUG_SCHEMA = z.string().min(1, "Slug cannot be empty.");
const REQUIRED_STRING_SCHEMA = z.string().min(1);
const URL_SCHEMA = z.url({
    protocol: /^https?$/,
    hostname: z.regexes.domain
    })
const CURRENCY_SCHEMA = z.string().length(3)

export const PriceHistorySchema = z.object({
  id: ID_SCHEMA,
  variant_id: ID_SCHEMA,
  price: z.number().positive("Price must be a positive number."),
  currency: CURRENCY_SCHEMA,
  recorded_at: z.coerce.date(),
});

export const ProductVariantSchema = z.object({
  id: ID_SCHEMA,
  product_id: ID_SCHEMA,
  source_url: URL_SCHEMA,
  slug: SLUG_SCHEMA,
  availability: z.enum(["В наличност", "Изчерпан", "Неясен"]),
  image_url: URL_SCHEMA, 
  variant_specs: z.record(z.string(), z.any()), 
  created_at: z.coerce.date(),
  last_scraped_at: z.coerce.date(),
  price_history: z.array(PriceHistorySchema),
});

export const ProductSchema = z.object({
  id: ID_SCHEMA,
  name: REQUIRED_STRING_SCHEMA,
  slug: SLUG_SCHEMA,
  brand: REQUIRED_STRING_SCHEMA,
  category: REQUIRED_STRING_SCHEMA,
  description: z.string(), 
  common_specs: z.record(z.string(), z.any()),
  created_at: z.coerce.date(),
  variants: z.array(ProductVariantSchema),
});
// latest product card schemas 
const ProductBaseSchema = ProductSchema.pick({
  id: true,
  name: true,
  slug: true,
  category: true,
});

 const LatestProductCardPriceRecordSchema = PriceHistorySchema.pick({
  price: true,
  currency: true,
});

 const LatestProductCardVariantSchema = ProductVariantSchema.pick({
  id: true,
  product_id: true,
  image_url: true,
  availability: true,
}).extend({
  latest_lowest_price_record:
    LatestProductCardPriceRecordSchema
});

export const LatestProductCardSchema = ProductBaseSchema.extend({
  variants: z.array(LatestProductCardVariantSchema),
});

export const LatestProductsResponseSchema = z.array(LatestProductCardSchema);
// comparasion product schemas
const ComparisonParentProductSchema = ProductSchema.pick({
  id: true,
  name: true,
  slug: true,
  common_specs:true,
});

export const ComparisonProductSchema = ProductVariantSchema.pick({
  id: true,
  slug: true,
  image_url: true,
  availability: true,
  variant_specs: true,
}).extend({
  parent_product: ComparisonParentProductSchema,
  latest_lowest_price_record: LatestProductCardPriceRecordSchema,
});

export const ComparisonResponseSchema = z.array(ComparisonProductSchema);

export type PriceHistory = z.infer<typeof PriceHistorySchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type Product = z.infer<typeof ProductSchema>;

export type LatestProduct = z.infer<typeof LatestProductCardSchema>;

export type ComparisonProduct = z.infer<typeof ComparisonProductSchema>;