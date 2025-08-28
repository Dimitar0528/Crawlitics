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

export default function SearchPage() {
  return (
    <Suspense>
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

  const [results, setResults] = useState<ProductPreview[]>([]);
  const [total, setTotal] = useState<number>(0);
  const limit = 12;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResults();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort) params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    router.replace(`/search?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, page]);

  async function fetchResults() {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (sort) params.set("sort", sort);
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
      setTotal(res.data?.length ? res.data.length : 0);
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

    if (page - delta > 2) {
      pages.push("ellipsis");
    }

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      pages.push(i);
    }

    if (page + delta < totalPages - 1) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);
    return pages;
  }

  const pages = getPageNumbers();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Резултати от търсенето</h1>

        <Select value={sort} onValueChange={(val) => setSort(val)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Сортиране" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Име (A→Z)</SelectItem>
            <SelectItem value="name-desc">Име (Z→A)</SelectItem>
            <SelectItem value="created-desc">Най-нови</SelectItem>
            <SelectItem value="created-asc">Най-стари</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div>Зареждане...</div>
        ) : results.length > 0 ? (
          results.map((p: ProductPreview) => <ProductCard key={p.id} {...p} />)
        ) : (
          <div className="col-span-full text-center text-slate-500">
            Няма резултати
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page === 1}
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
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
                aria-disabled={page === totalPages}
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
