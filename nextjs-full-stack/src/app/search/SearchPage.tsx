"use client";
import { Suspense, useEffect, useState } from "react";
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageComponent />
    </Suspense>
  );
}

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
    } catch (e) {
      console.error("Unexpected error fetching results:", e);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Резултати от търсенето</h1>
        <div className="flex items-center gap-4">
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
                <SelectItem value="name-asc">Име (A→Z)</SelectItem>
                <SelectItem value="name-desc">Име (Z→A)</SelectItem>
                <SelectItem value="price-asc">Цена (ниска→висока)</SelectItem>
                <SelectItem value="price-desc">Цена (висока→ниска)</SelectItem>
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

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${
          loading && !isInitialLoad ? "opacity-50 pointer-events-none" : ""
        }`}>
        {isInitialLoad
          ? Array.from({ length: limit }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))
          : results.length > 0
          ? results.map((product: ProductPreview) => (
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
                  вашето търсене. Опитайте с различни ключови думи или филтри.
                </p>
              </div>
            )}
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
                      setPage(p);
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
