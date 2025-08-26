import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
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
  )?.name_bg;
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-cyan-400/20 dark:from-emerald-500/10 dark:to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/50 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Актуални оферти
            </span>
          </div>

          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-4">
            {displayName}
          </h1>

          <p className="max-w-3xl mx-auto text-xl text-slate-600 dark:text-slate-300 font-light leading-relaxed">
            Всички продукти в категория{" "}
            <span className="font-semibold text-slate-800 dark:text-white">
              {displayName}
            </span>
            , анализирани от CrawleeBot
          </p>
        </header>

        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 ">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <SlidersHorizontal className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Общо продукти:
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-600"></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {productList.length}
              </span>
            </div>

            {productList.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Актуализирано наскоро
                </span>
              </div>
            )}
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-2">
            <ProductSortDropdown />
          </div>
        </div>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-32">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl scale-150"></div>
              <div className="relative p-8 bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-600/50 backdrop-blur-xl">
                <ShoppingCart className="h-20 w-20 text-slate-400 dark:text-slate-500 mx-auto" />
              </div>
            </div>

            <div className="space-y-4 max-w-lg">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Още няма продукти
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                Тази категория все още се попълва с продукти. Проверете отново
                скоро за най-новите добавки.
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Бъдете първи да знаете</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
