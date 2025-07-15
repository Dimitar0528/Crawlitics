export interface Product {
  id: number;
  source_url: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  availability: string;
  description: string | null;
  specs: Record<string, string>; 
  image_url: string | null;
  created_at: string;
  last_scraped_at: string;

  price_history: PriceHistory[];
}


export interface PriceHistory {
  id: number;
  price: number;
  recorded_at: string;
  product_id: number;
}
