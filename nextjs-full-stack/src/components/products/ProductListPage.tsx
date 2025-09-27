"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/products/cards/ProductCard";
import type { ProductPreview } from "@/lib/validations/product";
import { getSearchProducts, getProductsByCategory, getCategories } from "@/lib/data";
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
import SideFilter from "@/components/search/SideFilter";
import { Route } from "next";

type ProductListPageProps = {
  pageType: "search" | "category";
  // the 'value' is either the search query or the category slug
  pageValue: string;
  category_display_name?: string;
};

export default function ProductListPage({
  pageType,
  pageValue,
  category_display_name,
}: ProductListPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

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
    if (!pageValue) {
      router.replace("/");
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * limit;
        const apiParams = new URLSearchParams({
          sort,
          offset: String(offset),
          limit: String(limit),
        });

        let res;
        if (pageType === "search") {
          apiParams.set("q", pageValue);
          res = await getSearchProducts(apiParams);
        } else {
          const categories = await getCategories();
          const categoryBG = categories.success
            ? categories.data.find(
                (c) => c.slug.toLowerCase() === pageValue.toLowerCase()
              )?.name_bg || pageValue
            : pageValue;

          res = await getProductsByCategory(categoryBG, apiParams);
        }

        if (!res.success) {
          console.error(res.error);
          setResults([]);
          setTotal(0);
          return;
        }

        const products: ProductPreview[] = res.data || [];
        setResults(products);
        setTotal(res.total || 0);

        const specsMap: Record<string, Set<string>> = {};
        products.forEach((product) => {
          const specs = product.common_specs || {};
          Object.entries(specs).forEach(([key, value]) => {
            if (value !== null && value !== undefined && key !== "features") {
              if (!specsMap[key]) specsMap[key] = new Set();
              specsMap[key].add(String(value));
            }
          });
          product.variants?.forEach((variant) => {
            const vSpecs = variant.variant_specs || {};
            Object.entries(vSpecs).forEach(([k, v]) => {
              const str =
                v == null ? "" : String(v).replace(/(\d+)([A-Za-z]+)/, "$1 $2");
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
    };

    fetchResults();

    const urlParams = new URLSearchParams();
    urlParams.set("sort", sort);
    urlParams.set("limit", String(limit));
    if (page > 1) urlParams.set("page", String(page));

    const path =
      pageType === "search" ? `/search?q=${pageValue}` : `/${pageValue}`;
    if (pageType === "search") {
      router.replace(`${path}&${urlParams.toString()}` as Route);
    } else {
      router.replace(`${path}?${urlParams.toString()}` as Route);
    }
  }, [pageValue, sort, page, limit, pageType, router]);

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
          return selectedVals.some(
            (sv) => String(v).replace(/(\d+)([A-Za-z]+)/, "$1 $2") === sv
          );
        });
        return commonMatches || Boolean(variantMatches);
      });
    });
  }, [results, selectedFilters]);

  const filtersApplied = Object.keys(selectedFilters).some(
    (k) => selectedFilters[k]?.length > 0
  );

  const displayedTotal =
    results === null ? total : filtersApplied ? filteredResults.length : total;

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

  const pageTitle =
    pageType === "search" ? (
      <>
        {total === 1 ? "резултат, открит" : "резултата, открити"} за:{" "}
        <span className="text-2xl sm:text-3xl bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text font-bold">
          &quot;{pageValue}&quot;
        </span>
      </>
    ) : (
      <>
        {total === 1 ? "продукт, намерен" : "продукта, намерени"} за категория:{" "}
        <span className="text-2xl sm:text-3xl bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text font-bold">
          &quot;{category_display_name}&quot;
        </span>
      </>
    );

  return (
    <div
      className={`container mx-auto px-4 sm:px-6 py-8`}>
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl max-w-4xl text-gray-900 dark:text-white text-center sm:text-left animate-fade-in">
            <div
              key={total}
              className="relative inline-block mx-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
              <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                {total}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-600/20 rounded-full blur-md opacity-75 animate-in fade-in-0 zoom-in-50 duration-700" />
            </div>
            {pageTitle}
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
            <DrawerContent className="h-[75vh] px-4">
              <div className="overflow-y-auto">
                <DrawerHeader className="text-left">
                  <DrawerTitle className="text-2xl">Филтри</DrawerTitle>
                  <DrawerDescription className="text-lg">
                    Филтрирай продуктите, базирайки се на посочените критерии.
                  </DrawerDescription>
                </DrawerHeader>
                <SideFilter
                  availableSpecs={availableSpecs}
                  selectedFilters={selectedFilters}
                  toggleFilterValue={toggleFilterValue}
                  clearAllFilters={clearAllFilters}
                  loading={loading}
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

      <div className="flex gap-6">
        <aside className="hidden xl:block w-65 flex-shrink-0 sticky top-24">
          <div className="space-y-4 sticky top-24 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
              <div className="max-h-[37rem] flex flex-col overflow-y-auto">
                <SideFilter
                  availableSpecs={availableSpecs}
                  selectedFilters={selectedFilters}
                  toggleFilterValue={toggleFilterValue}
                  clearAllFilters={clearAllFilters}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 justify-items-center transition-opacity duration-300 w-full ${
              loading && !isInitialLoad ? "opacity-50 pointer-events-none" : ""
            }`}>
            {isInitialLoad
              ? Array.from({ length: limit }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))
              : filteredResults.length > 0
              ? filteredResults.map((product: ProductPreview) => (
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
