"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/products/cards/ProductCard";
import type { ProductPreview } from "@/lib/validations/product";
import { getSearchProducts } from "@/lib/data";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCardSkeleton from "@/components/products/cards/ProductCardSkeleton";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react"; 
import { Button } from "@/components/ui/button"; 

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
  DrawerDescription,
} from "@/components/ui/drawer";

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageComponent />
    </Suspense>
  );
}

const FiltersSidebarContent = ({
  availableSpecs,
  selectedFilters,
  toggleFilterValue,
  clearAllFilters,
}: {
  availableSpecs: Record<string, string[]>;
  selectedFilters: Record<string, string[]>;
  toggleFilterValue: (key: string, value: string) => void;
  clearAllFilters: () => void;
}) => (
  <>
    <div className="flex items-center justify-between mb-3 px-4 pt-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Филтри
      </h3>
      <button
        onClick={clearAllFilters}
        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
        Изчисти
      </button>
    </div>
    <div className="overflow-auto px-4">
      {Object.keys(availableSpecs).length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
          Няма налични филтри
        </p>
      ) : (
        Object.entries(availableSpecs).map(([key, values]) => (
          <div
            key={key}
            className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4 last:border-b-0 last:pb-0">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              {key}
            </h4>
            <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
              {values.map((val) => {
                const checked = (selectedFilters[key] || []).includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilterValue(key, val)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="truncate">{val}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  </>
);

function SearchPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const [sort, setSort] = useState(searchParams.get("sort") || "name-asc");
  const [page, setPage] = useState<number>(
    parseInt(searchParams.get("page") || "1")
  );
  const [limit, setLimit] = useState<number>(
    parseInt(searchParams.get("limit") || "12")
  );

  const [results, setResults] = useState<ProductPreview[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [availableSpecs, setAvailableSpecs] = useState<
    Record<string, string[]>
  >({});
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    if (!query) {
      router.replace("/");
      return;
    }

    fetchResults();

    const params = new URLSearchParams();
    params.set("q", query);
    params.set("sort", sort);
    params.set("limit", String(limit));
    if (page > 1) params.set("page", String(page));

    router.replace(`/search?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, page, limit]);

  async function fetchResults() {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("sort", sort);
      params.set("offset", String(offset));
      params.set("limit", String(limit));

      const res = await getSearchProducts(params);
      if (!res.success) {
        console.error(res.error);
        setResults([]);
        setTotal(0);
        return;
      }

      setResults(res.data || []);
      setTotal(res.total || 0);
      const specsMap: Record<string, Set<string>> = {};
      (res.data || []).forEach((product) => {
        const specs = product.common_specs || {};
        Object.entries(specs).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (!specsMap[key]) specsMap[key] = new Set();
            specsMap[key].add(String(value));
          }
        });
        product.variants?.forEach((variant) => {
          const vSpecs = variant.variant_specs || {};
          Object.entries(vSpecs).forEach(([k, v]) => {
            const str = v == null ? "" : String(v);
            specsMap[k] = specsMap[k] || new Set<string>();
            specsMap[k].add(str);
          });
        });
      });
      const normalized: Record<string, string[]> = {};
      Object.entries(specsMap).forEach(([k, set]) => {
        normalized[k] = Array.from(set)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
      });
      setAvailableSpecs(normalized);
    } catch (e) {
      console.error("Unexpected error fetching results:", e);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const filteredResults = useMemo(() => {
    if (!results) return [] as ProductPreview[];
    const filtersKeys = Object.keys(selectedFilters).filter(
      (k) => selectedFilters[k]?.length > 0
    );
    if (filtersKeys.length === 0) return results;
    return results.filter((product) => {
      return filtersKeys.every((key) => {
        const selectedVals = selectedFilters[key] || [];
        const commonVal = product.common_specs?.[key];
        const commonMatches = selectedVals.some(
          (sv) => String(commonVal) === sv
        );
        const variantMatches = product.variants?.some((variant) => {
          const v = variant.variant_specs?.[key];
          return selectedVals.some((sv) => String(v) === sv);
        });
        return commonMatches || Boolean(variantMatches);
      });
    });
  }, [results, selectedFilters]);

  const displayedTotal = results === null ? total : filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(displayedTotal / limit));

  function getPageNumbers() {
    const pages: (number | "ellipsis")[] = [];
    const delta = 2;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page - delta > 2) pages.push("ellipsis");
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      pages.push(i);
    }
    if (page + delta < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }

  const pages = getPageNumbers();
  const isInitialLoad = results === null;

  const selectedFiltersKey = useMemo(
    () => JSON.stringify(selectedFilters),
    [selectedFilters]
  );
  useEffect(() => {
    setPage(1);
  }, [selectedFiltersKey, limit]);

  function toggleFilterValue(key: string, value: string) {
    setSelectedFilters((prev) => {
      const prevVals = prev[key] || [];
      const exists = prevVals.includes(value);
      const nextVals = exists
        ? prevVals.filter((v) => v !== value)
        : [...prevVals, value];
      return { ...prev, [key]: nextVals };
    });
  }

  function clearAllFilters() {
    setSelectedFilters({});
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl text-gray-900 dark:text-white text-center sm:text-left animate-fade-in">
            <div
              key={total}
              className="relative inline-block mx-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
              <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                {total}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-600/20 rounded-full blur-md opacity-75 animate-in fade-in-0 zoom-in-50 duration-700" />
            </div>
            {total === 1 ? "резултат, открит" : "резултата, открити"} за:{" "}
            <span className="text-2xl sm:text-3xl bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text font-bold">
              &quot;{query}&quot;
            </span>
          </h1>
          <div className="flex items-center flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-select">Подреди:</Label>
              <Select
                value={sort}
                onValueChange={(val) => {
                  setPage(1);
                  setSort(val);
                }}>
                <SelectTrigger id="sort-select" className="w-48">
                  <SelectValue placeholder="Сортиране" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Име (A→Я)</SelectItem>
                  <SelectItem value="name-desc">Име (Я→A)</SelectItem>
                  <SelectItem value="price-asc">Цена (ниска→висока)</SelectItem>
                  <SelectItem value="price-desc">
                    Цена (висока→ниска)
                  </SelectItem>
                  <SelectItem value="created-desc">Най-нови</SelectItem>
                  <SelectItem value="created-asc">Най-стари</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="limit-select">Продукти на страница:</Label>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setPage(1);
                  setLimit(Number(val));
                }}>
                <SelectTrigger id="limit-select" className="w-24">
                  <SelectValue placeholder="Брой" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="xl:hidden w-full">
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Покажи филтри ({Object.values(selectedFilters).flat().length})
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh]">
              <div className="overflow-y-auto">
                <DrawerHeader className="text-left">
                  <DrawerTitle className="text-2xl">
                    Пълни спецификации
                  </DrawerTitle>
                  <DrawerDescription className="text-lg">
                    Всички характеристики на този специфичен продукт.
                  </DrawerDescription>
                </DrawerHeader>
                <FiltersSidebarContent
                  availableSpecs={availableSpecs}
                  selectedFilters={selectedFilters}
                  toggleFilterValue={toggleFilterValue}
                  clearAllFilters={clearAllFilters}
                />
              </div>
              <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                  <Button>Приложи</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <aside className="xl:col-span-3 hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md border border-slate-100 dark:border-slate-700">
              <div className="max-h-[65vh] flex flex-col">
                <FiltersSidebarContent
                  availableSpecs={availableSpecs}
                  selectedFilters={selectedFilters}
                  toggleFilterValue={toggleFilterValue}
                  clearAllFilters={clearAllFilters}
                />
              </div>
            </div>
            <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
              Подредете и филтрирайте за по-точни резултати.
            </div>
          </div>
        </aside>

        <section className="xl:col-span-9">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 transition-opacity duration-300 ${
              loading && !isInitialLoad ? "opacity-50 pointer-events-none" : ""
            }`}>
            {isInitialLoad
              ? Array.from({ length: limit }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))
              : filteredResults.length > 0
              ? filteredResults
                  .slice((page - 1) * limit, page * limit)
                  .map((product: ProductPreview) => (
                    <ProductCard key={product.id} {...product} />
                  ))
              : !loading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-slate-400 mb-4 animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 14l2-2 4 4m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Няма резултати
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                      За съжаление, не можахме да намерим продукти, съвпадащи с
                      вашето търсене. Опитайте с различни ключови думи или
                      филтри.
                    </p>
                  </div>
                )}
          </div>
        </section>
      </div>

      {!isInitialLoad && totalPages > 1 && (
        <Pagination
          className={`mt-8 transition-opacity duration-300 ${
            loading ? "opacity-50" : ""
          }`}>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page === 1 || loading}
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1 && !loading) setPage(page - 1);
                }}
              />
            </PaginationItem>
            {pages.map((p, idx) =>
              p === "ellipsis" ? (
                <PaginationItem key={idx}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={page === p}
                    aria-disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p as number);
                    }}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={page === totalPages || loading}
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages && !loading) setPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
