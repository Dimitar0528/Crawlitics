import { Product } from "@/types/product";

export async function getLatestProducts(){
    const response = await fetch("http://localhost:8000/api/latest-products");
    const newest_products: Product[] | null = await response.json();
    return newest_products;
}

export async function getProduct(slug: string) {
  const response = await fetch(`http://localhost:8000/api/product/${slug}`);
  const product: Product | null = await response.json();
  return product;
}
