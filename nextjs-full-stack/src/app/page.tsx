import { Metadata } from "next";
import { Product } from "@/types/product";

import ProductCard from "@/components/products/ProductCard";

export const metadata: Metadata = {
  title: "Home Page | Crawlitics",
  description: "Crawlitics home page",
};

const response = await fetch("http://localhost:8000/api/products");
if (!response.ok) {
  throw new Error("Failed to fetch products");
}
const newest_products: Product[] = await response.json();

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <section className="w-full">
          <h2 className="text-xl font-semibold mb-4">
            New Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {newest_products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
