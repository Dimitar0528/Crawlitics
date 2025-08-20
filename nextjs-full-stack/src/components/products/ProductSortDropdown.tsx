"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductSortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "name-asc";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    router.replace(`${pathname}?${params.toString()}`, {scroll: false});
  };

  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor="sort-select"
        className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Сортирай по:
      </label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger
          id="sort-select"
          className="w-[200px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600">
          <SelectValue placeholder="Препоръчано" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Име (А-Я)</SelectItem>
          <SelectItem value="name-desc">Име (Я-А)</SelectItem>
          <SelectItem value="price-asc">Цена (ниска към висока)</SelectItem>
          <SelectItem value="price-desc">Цена (висока към ниска)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
