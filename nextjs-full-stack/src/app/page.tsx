import { Metadata } from "next";
import ProductCard from "@/components/products/cards/ProductCard";
import Link from "next/link";
import {
  ScanSearch,
  BrainCircuit,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { getLatestProducts } from "@/lib/data";
import InteractiveHero from "@/components/homepage/InteractiveHero";

export const metadata: Metadata = {
  title: "Начална страница - Crawlitics",
  description: "Начална страница на Crawlitics платформата",
};

export const revalidate = 3600;

const processSteps = [
  {
    icon: <ScanSearch className="h-10 w-10 text-purple-500" />,
    title: "Стъпка 1: Обхождане (Crawling)",
    description:
      "Нашият интелигентен бот, CrawleeBot, систематично обхожда десетки сайтове на онлайн търговци, за да открие всички налични продуктови страници и оферти.",
  },
  {
    icon: <BrainCircuit className="h-10 w-10 text-sky-500" />,
    title: "Стъпка 2: Извличане (Scraping)",
    description:
      "След като намери страниците, нашата система прецизно извлича ключовата информация: цени, спецификации, наличност и изображения, превръщайки хаотичния HTML код в чисти данни.",
  },
  {
    icon: <Trophy className="h-10 w-10 text-amber-500" />,
    title: "Стъпка 3: Структуриране и Показване",
    description:
      "Накрая, събраните данни се анализират, групират и структурират в лесен за разбиране формат. Получавате пълна, ясна и обективна картина на продукта, за да направите най-добрия избор.",
  },
];
export default async function HomePage() {
  const result = await getLatestProducts();
  return (
    <div className=" min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <InteractiveHero />
        <section
          className="w-full grid justify-items-center"
          aria-labelledby="new-products">
            <h2
              id="new-products"
              className="
      text-3xl font-extrabold tracking-tight sm:text-4xl 
      bg-gradient-to-r from-sky-500 to-purple-600 bg-clip-text text-transparent mb-6
    ">
              Последни Находки
            </h2>
          {!result.success ? (
            <div
              className="min-h-100 flex flex-col align-center justify-center text-center bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
              role="alert">
              <h1 className="font-extrabold text-2xl">
                Продуктите не можаха да се заредят. Опитайте отново.
              </h1>
              <p className="mt-4">
                Причина:{" "}
                {result.error === "fetch failed"
                  ? "Неуспешно извличане на данни"
                  : result.error}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {result.data.map((product) => {
                return <ProductCard key={product.id} {...product} />;
              })}
            </div>
          )}
        </section>

        <section className="relative bg-slate-50 dark:bg-slate-800 py-8 mx-auto">
          <div className="absolute inset-0 bg-grid-slate-100/[0.4] [mask-image:radial-gradient(ellipse_at_center,white,transparent_85%)] dark:bg-grid-slate-700/[0.2]"></div>

          <div className="relative container mx-auto px-4 z-10">
            <header className="text-center mb-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                От Хаоса на Данните до Вашето Перфектно Решение
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-700 dark:text-slate-200">
                Нашата платформа предоставя цялата информация, от която се
                нуждаете, на едно централизирано място, чрез тези стъпки:
              </p>
            </header>

            <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-4">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl max-w-sm transition-all duration-300 hover:bg-white dark:hover:bg-slate-500/50 hover:shadow-xl hover:-translate-y-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-300 mb-6">
                  {processSteps[0].icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {processSteps[0].title}
                </h3>
                <p className="mt-2 text-slate-700 dark:text-slate-200">
                  {processSteps[0].description}
                </p>
              </div>

              <ChevronRight className="h-12 w-12 flex-shrink-0 text-slate-300 dark:text-slate-600 hidden md:block" />

              <div className="flex flex-col items-center text-center p-6 rounded-2xl max-w-sm transition-all duration-300 hover:bg-white dark:hover:bg-slate-500/50 hover:shadow-xl hover:-translate-y-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-300 mb-6">
                  {processSteps[1].icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {processSteps[1].title}
                </h3>
                <p className="mt-2 text-slate-700 dark:text-slate-200">
                  {processSteps[1].description}
                </p>
              </div>

              <ChevronRight className="h-12 w-12 flex-shrink-0 text-slate-300 dark:text-slate-600 hidden md:block" />

              <div className="flex flex-col items-center text-center p-6 rounded-2xl max-w-sm transition-all duration-300 hover:bg-white dark:hover:bg-slate-500/50 hover:shadow-xl hover:-translate-y-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-300 mb-6">
                  {processSteps[2].icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {processSteps[2].title}
                </h3>
                <p className="mt-2 text-slate-700 dark:text-slate-200">
                  {processSteps[2].description}
                </p>
              </div>
            </div>

            <div className="text-center mt-16">
              <Link
                href="/how-it-works"
                className="
              inline-block rounded-full bg-gradient-to-r from-sky-500 to-purple-600 
              px-8 py-3 text-base font-semibold text-white shadow-lg
              transition-all duration-300 ease-in-out
              hover:scale-105 hover:shadow-sky-500/30
            ">
                Повече информация за Crawlitics
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
