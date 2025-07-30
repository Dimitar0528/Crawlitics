import { LatestProductsResponseSchema, LatestProduct, Product, ProductSchema } from "@/lib/validations/product";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getLatestProducts(): Promise<LatestProduct[]> {
  try {
    const response = await fetch(`${API_BASE}/api/latest-products`);
    if (!response.ok) {
      console.error("Failed to fetch latest products:", response.statusText);
      return [];
    }
    const rawData = await response.json()
    const result = LatestProductsResponseSchema.safeParse(rawData);
    if (!result.success) {
      console.error(
        "Validation Error: The latest products data is malformed.",
        result.error
      );
      return [];
    }

    return result.data;
  } catch (err) {
    console.error("Error fetching latest products:", err);
    return [];
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE}/api/product/${slug}`);
    if (!response.ok) {
      console.error(`Failed to fetch product ${slug}:`, response.statusText);
      return null;
    }
    const rawData = await response.json()
    const result = ProductSchema.safeParse(rawData);
    if (!result.success) {
      console.error(
        "Validation Error: The product data is malformed.",
        result.error
      );
      return null;
    }
    return result.data;
  } catch(err){
    console.log(err);
    return null
  }
}
