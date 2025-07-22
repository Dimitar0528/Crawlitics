import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Info, ShoppingCart, Store, Cpu, Tag } from "lucide-react";

import { Product } from "@/types/product";
import BackButton from "@/components/products/BackButton";
import ReadMore from "@/components/products/ReadMore"; 

import { getLatestProducts, getProduct } from "@/lib/data";
import {
  calculate_product_variant_prices,
  groupVariantsByStore,
  getVariantSummary
} from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export async function generateStaticParams() {
  const newest_products = await getLatestProducts();
  return newest_products.map((product: Product) => ({
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
    title: `${product.brand} ${product.name} | Crawlitics`,
    description: `Страница, показваща информация за продукта ${product.name}`,
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
  const heroImageUrl =
    product.variants?.find((v) => v.image_url)?.image_url ??
    "";

  const SpecList = ({ specs }: { specs: Record<string, string> }) => (
    <div className="space-y-2">
      {Object.entries(specs).map(([key, value]) => (
        <div
          key={key}
          className="flex justify-between items-center gap-2 text-sm border-b-1 pb-1">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {key.toUpperCase()}
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <main className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 mb-12">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-3xl shadow-lg shadow-slate-200 dark:shadow-black/20 flex sm:items-center justify-center mb-4 lg:mb-0">
            <div className="relative w-75 h-75 lg:w-125 lg:h-125">
              <Image
                src={heroImageUrl}
                alt={`Image of ${product.name}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <header>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-300">
                {product.brand}
              </p>
              <h1 className="mt-1 text-2xl lg:text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                {product.name}
              </h1>
            </header>

              <section>
                <h3 className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  <Info className="w-5 h-5 text-purple-500" /> Описание
                </h3>
                <ReadMore text={product.description} collapsedLines={4} />
              </section>

                <section>
                  <h3 className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    <Cpu className="w-5 h-5 text-purple-500" /> Общи
                    характеристики
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <SpecList specs={product.common_specs} />
                  </div>
                </section>
                
          </div>
        </div>

        <section>
          <div className="w-full mx-auto">
            <h2 className="flex items-center justify-center gap-3 text-3xl font-bold text-slate-800 dark:text-white mb-6">
              <Store className="w-8 h-8 text-purple-500" /> Налични оферти
            </h2>
            <div className="space-y-6">
              {Object.entries(groupVariantsByStore(product.variants || []))
                .length > 0 ? (
                Object.entries(
                  groupVariantsByStore(product.variants || [])
                ).map(([storeName, variants]) => {
                  const summary =
                    getVariantSummary(variants);
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
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 pb-5 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
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
                            <Tag className="w-4 h-4 text-purple-500 dark:text-purple-400" />
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

                      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar">
                        {variants.map((variant) => {
                          const isAvailable =
                            variant.availability === "В наличност";
                          const latestPriceRecord =
                            variant.price_history[
                              variant.price_history.length - 1
                            ];
                          const { price_bgn, price_eur } =
                            calculate_product_variant_prices(
                              latestPriceRecord.price
                            );
                          return (
                            <div
                              key={variant.id}
                              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:border-purple-500 dark:hover:border-purple-400">
                              <div className="md:col-span-1">
                                <SpecList specs={variant.variant_specs} />
                              </div>
                              <div className="md:col-span-1 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2">
                                <div>
                                  <p className="text-xl text-center font-bold text-blue-700 dark:text-blue-300 leading-none">
                                    {price_bgn}
                                  </p>
                                  <p className="text-xl text-center font-bold text-blue-700 dark:text-blue-300 leading-none my-2">
                                    {price_eur}
                                  </p>
                                </div>
                                <div
                                  className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                                    isAvailable
                                      ? "bg-green-100 text-green-900 dark:bg-green-700/50 dark:text-green-200"
                                      : "bg-red-100 text-red-900 dark:bg-red-700/50 dark:text-red-200"
                                  }`}>
                                  {variant.availability}
                                </div>
                              </div>
                              <div className="md:col-span-1 flex justify-center">
                                <Link
                                  href={variant.source_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full md:w-auto">
                                  <Button className="w-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-blue-600 dark:hover:bg-blue-400">
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>Към магазина</span>
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );})
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400 p-8 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  Няма налични варианти за този продукт.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}