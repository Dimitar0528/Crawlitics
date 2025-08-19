import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShoppingCart, SlidersHorizontal } from "lucide-react";

import { getProductsByCategory } from "@/lib/data";
import ProductCard from "@/components/products/cards/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const revalidate = 3600;

const CATEGORIES = [
  { slug: "Laptop", name_bg: "Лаптоп" },
  { slug: "Smartfon", name_bg: "Смартфон" },
];

function getBgCategory(slug: string): string {
  const found = CATEGORIES.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase()
  );
  return found?.name_bg ?? slug;
}
export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    product_category: cat.name_bg,
  }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ product_category: string }>;
}): Promise<Metadata> {
  const { product_category } = await params;
 const categoryBG = getBgCategory(product_category);
  return {
    title: `${categoryBG}и`,
    description: `Разгледайте най-новите продукти в категория ${categoryBG}и.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ product_category: string }>;
}) {
  const { product_category } = await params;
  const categoryBG = getBgCategory(product_category);

  const res = await getProductsByCategory(categoryBG);

  if (!res.success) {
    notFound();
  }

  const productList = res.data || [];

  const displayName = 
    `${categoryBG.charAt(0).toUpperCase() + categoryBG.slice(1).replace(/-/g, " ")}и`

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-slate-900 dark:text-white mb-4">
            {displayName}
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600 dark:text-slate-300">
            {`Всички налични продукти в категория ${displayName}, анализирани от CrawleeBot.`}
          </p>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 p-4 bg-white/50 dark:bg-slate-700/100 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="h-5 w-5 text-blue-500 dark:text-blue-300" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {productList.length}
            </span>{" "}
            продукта
          </div>
          <div className="flex items-center gap-4">
            <label
              htmlFor="sort-select"
              className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Сортирай по:
            </label>
            <Select>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-400">
                <SelectValue placeholder="Препоръчано" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Име (А-Я)</SelectItem>
                <SelectItem value="name-desc">Име (Я-А)</SelectItem>
                <SelectItem value="price-asc">
                  Цена (ниска към висока)
                </SelectItem>
                <SelectItem value="price-desc">
                  Цена (висока към ниска)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {productList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {productList.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="p-6 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-6">
              <ShoppingCart className="h-16 w-16 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Няма намерени продукти
            </h2>
            <p className="max-w-md text-slate-500 dark:text-slate-400">
              Все още няма анализирани продукти в тази категория. Моля,
              проверете отново по-късно.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}