
import { Suspense } from "react";
import {  Info } from "lucide-react";
import SpecialSearchForm from "@/components/crawleebot/SpecialSearchForm";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Интелигентно търсене",
};

export default function SpecialSearchPageWrapper() {
  return (
    <Suspense fallback={<div>Loading....</div>}>
      <SpecialSearchPage />
    </Suspense>
  );
}

function SpecialSearchPage() {

  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto max-w-4xl p-8 text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200 mb-4">
            Преди да намерите перфектните продукти...
          </h1>
        </div>

        <div
          className="
        relative max-w-5xl mx-auto rounded-2xl 
        border border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-700/40 
        p-4 
        shadow-lg
      ">
          {/* The SVG background */}
          <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="c"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)">
                  <path
                    d="M0,10L10,0M10,40L40,10M30,0L40,10"
                    strokeWidth="0.5"
                    stroke="#a855f7"
                    fill="none"
                  />
                  <path
                    d="M0,30L30,0M-10,20L20,-10"
                    strokeWidth="0.5"
                    stroke="#38bdf8"
                    fill="none"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#c)" />
            </svg>
          </div>

          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <div
              className="
            flex h-12 w-12 items-center justify-center 
            rounded-full bg-gradient-to-br from-sky-100 to-purple-100
            dark:from-sky-900/50 dark:to-purple-900/50
            mb-4
          ">
              <Info className="h-6 w-6 text-purple-600 dark:text-sky-400" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Прецизирайте мисията на CrawleeBot
            </h3>

            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              За да открие перфектните продукти за вас, CrawleeBot се нуждае от
              вашата експертиза. Мислете за него като за изключително умен, но
              леко разсеян асистент. Посоченото име на продукта му дава основна
              посока, но допълнителните филтри са това, което наистина фокусира
              неговия <strong>&quot;поглед&quot;</strong> върху специфични продукти.
            </p>

            <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              Като добавите филтри като{" "}
              <strong className="font-semibold text-purple-600 dark:text-purple-400">
                оперативна (RAM) памет, интегрирана (SSD) памет, цвят, ценови
                диапазон
              </strong>{" "}
              или{" "}
              <strong className="font-semibold text-purple-600 dark:text-purple-400">
                други специфични за продукта характеристики
              </strong>
              , вие му помагате да елиминира хиляди неподходящи оферти и да се
              концентрира само върху най-добрите.
            </p>

            <p className="mt-4 font-bold text-slate-800 dark:text-slate-100">
              Резултатът? Много по-бърз, по-точен и несравнимо по-полезен подбор
              на продукти, създаден и пригоден специално за вашите нужди.
            </p>
          </div>
        </div>

        <SpecialSearchForm />

      </div>
    </div>
  );
}
