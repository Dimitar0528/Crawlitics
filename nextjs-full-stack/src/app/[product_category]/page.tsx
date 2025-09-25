import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data";
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
    if (!categories.success) {
      notFound();
    }
  const categoryBG = categories.success
    ? categories.data.find(
        (c) => c.slug.toLowerCase() === product_category.toLowerCase()
      )?.name_bg || product_category
    : product_category;


  const displayName =
    categoryBG.charAt(0).toUpperCase() + categoryBG.slice(1).replace(/-/g, " ");

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-cyan-400/20 dark:from-emerald-500/10 dark:to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

        <ProductListPage pageType="category" pageValue={product_category} category_display_name={displayName} />
      </div>
  );
}
