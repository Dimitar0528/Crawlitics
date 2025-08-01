import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info, Store, BadgeEuro, Cpu, Tag, TrendingUp, Loader2 } from "lucide-react";

import BackButton from "@/components/products/BackButton";
import ReadMore from "@/components/products/ReadMore";

import { getLatestProducts, getProduct } from "@/lib/data";
import {
  calculate_product_variant_prices,
  groupVariantsByStore,
  getVariantSummary,
} from "@/lib/utils";
import VariantCard from "@/components/products/cards/VariantCard";
import { SpecList } from "@/components/products/SpecList";
import ProductImage from "@/components/products/images/ProductImage";
import PriceHistoryChart from "@/components/products/charts/PriceHistoryChart";
import { Suspense } from "react";
export const revalidate = 3600;


export async function generateStaticParams() {
  const newest_products = await getLatestProducts();
  return newest_products.map((product) => ({
    parent_slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ parent_slug: string }>;
}): Promise<Metadata> {
  const { parent_slug } = await params;
  const product = await getProduct(parent_slug);
  if (!product) {
    notFound();
  }
  return {
    title: product.name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    description: product.description.split(".").slice(0, 1).join("").trim(),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ parent_slug: string }>;
}) {
  const { parent_slug } = await params;
  const product = await getProduct(parent_slug);

  if (!product) {
    notFound();
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 mb-12">
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          }>
          <ProductImage name={product.name} variants={product.variants} />
        </Suspense>
        <section
          aria-labelledby="product-name"
          className="flex flex-col justify-center space-y-6">
          <header>
            <p className="text-base font-bold text-blue-600 dark:text-blue-300 uppercase">
              {product.brand}
            </p>
            <h1
              id="product-name"
              className="mt-1 text-2xl lg:text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white capitalize">
              {product.name}
            </h1>
          </header>

          <section aria-labelledby="product-description">
            <h3
              id="product-description"
              className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              <Info className="w-5 h-5 text-purple-500" /> Описание
            </h3>
            <ReadMore text={product.description} collapsedLines={4} />
          </section>

          <section aria-labelledby="product-characteristics">
            <h3
              id="product-characteristics"
              className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              <Cpu className="w-5 h-5 text-purple-500" /> Общи характеристики
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <SpecList specs={product.common_specs} />
            </div>
          </section>
        </section>
      </div>

      <section aria-labelledby="available-offers">
        <div className="w-full mx-auto">
          <h2
            id="available-offers"
            className="flex items-center justify-center gap-3 text-3xl font-bold text-slate-800 dark:text-white mb-6">
            <BadgeEuro className="w-8 h-8 text-purple-500" /> Налични оферти
          </h2>

          <div className="mb-4 flex items-start gap-4 rounded-lg bg-amber-100 p-4 text-sm dark:bg-amber-900/30">
            <Info className="w-5 h-5 text-amber-900 dark:text-amber-100" />
            <p className="text-amber-900 dark:text-amber-100">
              За най-точна и подробна информация за съответния продукт, моля,
              посетете страницата на продукта, като използвате бутона{" "}
              <span className="font-bold">&quot;Към магазина&quot;</span>.
            </p>
          </div>

          <div className="space-y-6 max-h-[40rem] overflow-y-auto">
            {Object.entries(groupVariantsByStore(product.variants || []))
              .length > 0 ? (
              Object.entries(groupVariantsByStore(product.variants || [])).map(
                ([storeName, variants]) => {
                  const summary = getVariantSummary(variants);
                  const minPrices = calculate_product_variant_prices(
                    summary.minPrice
                  );
                  const maxPrices = calculate_product_variant_prices(
                    summary.maxPrice
                  );
                  return (
                    <div
                      key={storeName}
                      className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-around gap-4 mb-5 pb-5 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                          <Store className="w-7 h-7 text-blue-500 dark:text-blue-300" />
                          {storeName}
                        </h3>
                        <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
                          <div className="flex items-center gap-2 text-sm">
                            <span
                              className={`w-3 h-3 rounded-full ${
                                summary.availableCount > 0
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}></span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {summary.availableCount}/{summary.totalCount}{" "}
                              налични
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="w-4 h-4 text-blue-500 dark:text-blue-300" />
                            <div className="font-semibold text-slate-700 dark:text-slate-200">
                              <span>{minPrices.price_bgn}</span>
                              {summary.minPrice !== summary.maxPrice && (
                                <span> - {maxPrices.price_bgn}</span>
                              )}
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {" "}
                                ({minPrices.price_eur}
                                {summary.minPrice !== summary.maxPrice &&
                                  ` - ${maxPrices.price_eur}`}
                                )
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <VariantCard variants={variants} />
                    </div>
                  );
                }
              )
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 p-8 bg-slate-100 dark:bg-slate-800 rounded-lg">
                Няма налични варианти за този продукт.
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="price-history-chart" className="mt-16">
        <h2
          id="price-history-chart"
          className="flex items-center justify-center gap-3 text-3xl font-bold text-slate-800 dark:text-gray-200 mb-6">
          <TrendingUp className="w-8 h-8 text-purple-500" /> Ценова история
        </h2>
        <PriceHistoryChart variants={product.variants} />
      </section>
    </div>
  );
}
