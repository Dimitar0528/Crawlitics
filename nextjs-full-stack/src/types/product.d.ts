export type Product = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  common_specs: Record<string, string>; 
  created_at: string
  variants: ProductVariant[];
}

export type ProductVariant = {
  id: number;
  product_id: number;
  source_url: string;
  slug: string;
  availability: string;
  image_url: string;
  variant_specs: Record<string, string>;
  created_at: string;
  last_scraped_at: string;
  price_history: PriceHistory[];
  latest_lowest_price_record?: { price: number; currency: string };
  parent_product?: Product;
};


export type PriceHistory = {
  id: number;
  variant_id: number;
  price: number;
  currency: string
  recorded_at: string;
}
