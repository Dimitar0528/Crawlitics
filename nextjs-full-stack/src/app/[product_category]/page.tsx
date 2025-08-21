import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShoppingCart, SlidersHorizontal } from "lucide-react";
import type { ProductPreview } from "@/lib/validations/product";
import { getProductsByCategory, getCategories } from "@/lib/data";
import ProductCard from "@/components/products/cards/ProductCard";
import { ProductSortDropdown } from "@/components/products/ProductSortDropdown";

export const revalidate = 3600;

export async function generateStaticParams() {
  const result = await getCategories();
  if (!result.success) return [];
  return result.data.map((cat) => ({ product_category: cat.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ product_category: string }>;
}): Promise<Metadata> {
  const { product_category } = await params;
  const result = await getCategories();
  if (!result.success) {
    notFound();
  }
  const categoryBG = result.data.find(
        (c) => c.slug.toLowerCase() === product_category.toLowerCase()
      )?.name_bg
  return {
    title: `${categoryBG}`,
    description: `Разгледайте най-новите продукти в категория ${categoryBG}.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ product_category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { product_category } = await params;
  const categories = await getCategories();
  const categoryBG = categories.success
    ? categories.data.find(
        (c) => c.slug.toLowerCase() === product_category.toLowerCase()
      )?.name_bg || product_category
    : product_category;

  const res = await getProductsByCategory(categoryBG);

  if (!res.success) {
    notFound();
  }

  const productList = res.data || [];

  const displayName =
    categoryBG.charAt(0).toUpperCase() + categoryBG.slice(1).replace(/-/g, " ");
  const sortBy =
    typeof (await searchParams).sort === "string"
      ? (await searchParams).sort
      : "name-asc";

  const getLowestPrice = (product: ProductPreview): number => {
    if (!product.variants || product.variants.length === 0) {
      return Infinity;
    }
    const prices = product.variants
      .map((variant) => variant.latest_lowest_price_record.price)
      .filter(
        (price): price is number => typeof price === "number" && isFinite(price)
      );

    return Math.min(...prices);
  };
  const sortedProducts = [...productList].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return getLowestPrice(a) - getLowestPrice(b);
      case "price-desc":
        return getLowestPrice(b) - getLowestPrice(a);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "name-asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });
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
          <ProductSortDropdown />
        </div>

        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedProducts.map((product) => (
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
