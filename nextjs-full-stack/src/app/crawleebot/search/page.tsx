"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import { Plus, X, Bot, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Filter {
  id: number;
  name: string;
  value: string;
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div>Loading....</div>}>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const searchParams = useSearchParams();

  const [mainQuery, setMainQuery] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const rawQuery = searchParams.get("q") || "";
    const cleanQuery = DOMPurify.sanitize(rawQuery);
    setMainQuery(cleanQuery);

  }, [searchParams]);

  const handleAddFilter = () => {
    setFilters([...filters, { id: nextId, name: "", value: "" }]);
    setNextId(nextId + 1);
  };

  const handleRemoveFilter = (id: number) => {
    setFilters(filters.filter((filter) => filter.id !== id));
  };

  const handleFilterChange = (
    id: number,
    field: "name" | "value",
    text: string
  ) => {
    setFilters(
      filters.map((filter) =>
        filter.id === id ? { ...filter, [field]: text } : filter
      )
    );
  };

  const handleFinalSearch = () => {
    const searchPayload = {
      query: mainQuery,
      filters: filters.reduce((acc, filter) => {
        if (filter.name && filter.value) {
          acc[filter.name] = filter.value;
        }
        return acc;
      }, {} as Record<string, string>),
    };

    console.log("Starting analysis with payload:", searchPayload);
  };

  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto max-w-4xl p-8 text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
          <Bot className="h-10 w-10 text-purple-500" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200 mb-4">
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
              неговия &quot;поглед&quot; върху специфични продукти.
            </p>

            <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              Като добавите филтри като{" "}
              <strong className="font-semibold text-purple-600 dark:text-purple-400">
                оперативна (RAM) памет, интегрирана (SSD) памет, цвят, ценови
                диапазон
              </strong>{" "}
              или{" "}
              <strong className="font-semibold text-purple-600 dark:text-purple-400">
                други специфични за продукта характерсиктики
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

        <div className="mt-10">
          <Label
            htmlFor="mainQuery"
            className="font-semibold text-slate-800 dark:text-slate-200">
            Име на продукта
          </Label>
          <Input
            id="mainQuery"
            type="text"
            value={mainQuery}
            onChange={(e) => setMainQuery(e.target.value)}
            placeholder="Напр. геймърски лаптоп..."
            className="mt-2 h-12 text-lg"
          />
        </div>

        <div className="mt-8 text-left">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">
            Допълнителни филтри (препоръчително)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Натиснете бутона (+), за да добавите филтър. Посочете име (напр.
            &quot;RAM памет&quot;) и стойност (напр. &quot;16 GB&quot;).
          </p>

          <div className="mt-4 space-y-4">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center gap-2 animate-in fade-in-50 duration-300">
                <Input
                  type="text"
                  placeholder="Име на филтър (напр. Цена)"
                  value={filter.name}
                  onChange={(e) =>
                    handleFilterChange(filter.id, "name", e.target.value)
                  }
                  className="h-11"
                />
                <Input
                  type="text"
                  placeholder="Стойност (напр. 1669-2420)"
                  value={filter.value}
                  onChange={(e) =>
                    handleFilterChange(filter.id, "value", e.target.value)
                  }
                  className="h-11"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFilter(filter.id)}
                  className="text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                  title="Изтрий филтър">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleAddFilter}
            className="mt-4 w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Добави нов филтър
          </Button>
        </div>

        <div className="mt-12">
          <Button
            size="lg"
            onClick={handleFinalSearch}
            className="w-full max-w-xs h-14 text-lg font-bold bg-gradient-to-r from-sky-500 to-purple-600 hover:scale-105 transition-transform duration-300">
            Анализирай с {filters.length + 1} критерия
          </Button>
        </div>
      </div>
    </div>
  );
}
