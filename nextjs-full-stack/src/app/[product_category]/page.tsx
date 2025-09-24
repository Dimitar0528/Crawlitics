import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Sparkles,
} from "lucide-react";
import { getProductsByCategory, getCategories } from "@/lib/data";
import ProductListPage from "@/components/products/ProductListPage";

export const revalidate = 3600;

export async function generateStaticParams() {
  const result = await getCategories();
  if (!result.success) return [];
  return result.data.map((cat) => ({ product_category: cat.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[product_category]">
): Promise<Metadata> {
  const { product_category } = await props.params;
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

export default async function CategoryPage(
  props: PageProps<"/[product_category]">
) {
  const { product_category } = await props.params;
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


  const displayName =
    categoryBG.charAt(0).toUpperCase() + categoryBG.slice(1).replace(/-/g, " ");

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-cyan-400/20 dark:from-emerald-500/10 dark:to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <header className="text-center mb-6 sm:mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/50 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Актуални оферти
            </span>
          </div>

          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {displayName}
          </h1>
        </header>
        <ProductListPage pageType="category" pageValue={product_category} />
      </div>
    </div>
  );
}
