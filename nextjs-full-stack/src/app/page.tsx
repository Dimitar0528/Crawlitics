import { Metadata } from "next";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Button } from '@/components/ui/button';
import { getLatestProducts } from "@/lib/data";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Home Page | Crawlitics",
  description: "Начална страница на Crawlitics платформата",
};

export const revalidate = 3600;

export default async function Home() {
  const newest_products = await getLatestProducts();
  if(!newest_products) {
    notFound()
  } 

  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 gap-4 sm:p-4 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        <section className="w-full bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 border-3 border-dashed border-gray-300 dark:border-white/70">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="hidden sm:block bg-white dark:bg-gray-800 p-3 rounded-full shadow-md border border-gray-200/80 dark:border-gray-700/60">
                <Info className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Пазарувай разумно и намери най-добрите оферти с лекота
                </h2>
                <p className="text-white mt-1">
                  Виж как нашата платформа ти помага да спестиш време и пари
                  ефикасно.
                </p>
              </div>
            </div>
            <Link href="/how-it-works">
              <Button
                variant="outline"
                className="w-full md:w-auto bg-white dark:bg-gray-900 backdrop-blur-sm border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-white/85 dark:hover:border-blue-400 dark:hover:bg-gray-900/60 transition-all duration-300 group">
                Научи повече
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="w-full">
          <h2 className="text-xl font-semibold mb-4">New Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 justify-items-center">
            {newest_products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
