"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/products/cards/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductPreview } from "@/lib/validations/product";
import { getSearchProducts } from "@/lib/data";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState<string>(searchParams.get("q") || "");
  const [sort, setSort] = useState<string>(
    searchParams.get("sort") || "name-asc"
  );
  const [page, setPage] = useState<number>(
    parseInt(searchParams.get("page") || "1")
  );

  const [results, setResults] = useState<ProductPreview[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [limit] = useState<number>(12);
  const [loading, setLoading] = useState<boolean>(false);


  useEffect(() => {
    fetchResults();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort) params.set("sort", sort);
    if (page) params.set("page", String(page));
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row items-center gap-4">
        <Input
          placeholder="Търси продукти..."
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
        />

        <Select onValueChange={(val) => setSort(val)}>
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

        <Button
          onClick={() => {
            setPage(1);
            fetchResults();
          }}
          className="ml-auto">
          Търси
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div>Зареждане...</div>
        ) : results.length > 0 ? (
          results.map((p: ProductPreview) => <ProductCard key={p.id} {...p} />)
        ) : (
          <div>Няма резултати</div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => setPage((s) => Math.max(1, s - 1))}>
          Назад
        </Button>
        <div className="px-4">
          {page} / {totalPages}
        </div>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((s) => Math.min(totalPages, s + 1))}>
          Напред
        </Button>
      </div>
    </div>
  );
}
