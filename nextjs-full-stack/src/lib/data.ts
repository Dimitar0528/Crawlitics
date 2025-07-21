import { Product } from "@/types/product";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getLatestProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/latest-products`);
    if (!response.ok) {
      console.error("Failed to fetch latest products:", response.statusText);
      return [];
    }
    const newest_products = (await response.json()) as Product[];
    return newest_products;
  } catch (err) {
    console.error("Error fetching latest products:", err);
    return [];
  }
}

export async function getProduct(slug: string) {
  try {
    const response = await fetch(`${API_BASE}/api/product/${slug}`);
    if (!response.ok) {
      console.error(`Failed to fetch product ${slug}:`, response.statusText);
      return null;
    }
    const product = (await response.json()) as Product;
    return product;
  } catch(err){
    console.log(err);
    return null
  }
}
