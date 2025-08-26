"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCompare } from "@/context/CompareContext";
import getComparisonProductData from "@/lib/data";
import { ComparisonProduct } from "@/lib/validations/product";
import { calculate_product_variant_prices } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ClipboardX, ArrowLeft, Info, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function ComparePage(){
  return (
    <Suspense>
      <Compare />
    </Suspense>
  );
}

 function Compare() {
  const router = useRouter();
  const params = useSearchParams();
  const { removeFromCompare } = useCompare();

  const variantIdStrings = (params.get("ids") || "").toString();
  const [variantIds, setVariantIds] = useState<number[]>(
    variantIdStrings ? variantIdStrings.split(",").map(Number) : []
  );

  const [comparisonData, setComparisonData] = useState<ComparisonProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // fetch comparison data
  useEffect(() => {
    if (variantIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const response = await getComparisonProductData(variantIds);

      if (response.success) {
        setComparisonData(response.data);
      } else {
        setError(response.error);
      }
      setIsLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = (id: number) => {
    removeFromCompare(id);

    setComparisonData((prev) => prev.filter((p) => p.id !== id));
    setVariantIds((prev) => prev.filter((vid) => vid !== id));

    const newIds = variantIds.filter((vid) => vid !== id);
    const newParams = new URLSearchParams(params.toString());
    if (newIds.length > 0) {
      newParams.set("ids", newIds.join(","));
    } else {
      newParams.delete("ids");
    }
    router.replace(`?${decodeURIComponent(newParams.toString())}`);
  };
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Линкът е копиран в клипборда!");
    } catch (error) {
      toast.error(
        `Имаше проблем с копирането на линка!. Опитайте пак. ${error}`
      );
    }
  };

   const { specRows, getSpecValue, doesSpecDiffer } = useMemo(() => {
     const allSpecKeys = new Set<string>();
     comparisonData.forEach((product) => {
       Object.keys(product.parent_product.common_specs || {}).forEach((key) =>
         allSpecKeys.add(key)
       );
       Object.keys(product.variant_specs || {}).forEach((key) =>
         allSpecKeys.add(key)
       );
     });

     const specRows = Array.from(allSpecKeys).sort();

     const getSpecValue = (product: ComparisonProduct, key: string): string => {
       const value =
         product.variant_specs?.[key] ??
         product.parent_product.common_specs?.[key];
       if (value === null || value === undefined) return "N/A";
       if (typeof value === "boolean") return value ? "Да" : "Не";
       return String(value);
     };

     const doesSpecDiffer = (key: string): boolean => {
       if (comparisonData.length < 2) return false;
       const firstValue = JSON.stringify(getSpecValue(comparisonData[0], key));
       return comparisonData
         .slice(1)
         .some(
           (item) => JSON.stringify(getSpecValue(item, key)) !== firstValue
         );
     };

     return { specRows, getSpecValue, doesSpecDiffer };
   }, [comparisonData]);

   // --- Filtered specs based on the toggle state ---
   const filteredSpecRows = showOnlyDifferences
     ? specRows.filter((key) => doesSpecDiffer(key))
     : specRows;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Зареждане на продуктите за сравнение...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
          Зареждането на продуктите за сравнение не бе успешно
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{error}</p>
      </div>
    );
  }

  if (!isLoading && comparisonData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <ClipboardX className="h-16 w-16 text-purple-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Вашият списък за сравнение е празен
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Добавете някои продукти, за да видите сравнение един до друг.
        </p>
        <Link href="/" passHref>
          <Button className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Обратно към пазаруването
          </Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex-1 text-center sm:text-left">
          Сравни продукти ({comparisonData.length})
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 border-slate-200 dark:border-slate-700 p-2 mb-4">
        <Button
          variant="outline"
          onClick={handleCopyUrl}
          className="bg-white dark:bg-slate-800">
          <Share2 className="mr-2 h-4 w-4" />
          Копирай линк за сравнение
        </Button>

        <div className="bg-white dark:bg-slate-800 p-2 flex items-center justify-center space-x-3">
          <Label
            htmlFor="show-differences"
            className="font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
            Покажи само разликите
          </Label>
          <Switch
            className="cursor-pointer"
            id="show-differences"
            checked={showOnlyDifferences}
            onCheckedChange={setShowOnlyDifferences}
            aria-label="Show only differences"
          />
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2 text-sm text-blue-800 dark:text-blue-200 text-center">
        <Info className="h-5 w-5 flex-shrink-0 mt-1" />
        <p className="leading-relaxed">
          Характеристиките, които са оцветени, се различават поне при един от
          сравняваните продукти.
        </p>
      </div>
      <div className="overflow-x-auto">
        <div
          className="hidden lg:grid gap-x-4"
          style={{
            gridTemplateColumns: `minmax(150px, 1fr) repeat(${comparisonData.length}, minmax(120px, 1fr))`,
          }}>
          <div className="font-bold text-slate-700 dark:text-slate-300 p-3 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm z-10">
            Характеристики
          </div>

          {comparisonData.map((product) => {
            const priceRecord = product.latest_lowest_price_record;
            const { price_bgn, price_eur } = calculate_product_variant_prices(
              priceRecord?.price
            );
            return (
              <div
                key={product.id}
                className="border hover:border-blue-500 p-3 text-center border-b-2 border-slate-200 dark:border-slate-700 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm z-10 transition">
                <Link href={`/product/${product.parent_product.slug}`}>
                  <div className="relative w-full h-32 mb-4">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.slug}
                      fill
                      className="object-contain drop-shadow-md"
                    />
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {product.parent_product.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                    {product.slug}
                  </p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400 my-2">
                    {priceRecord ? `От ${price_bgn} / ${price_eur}` : "N/A"}
                  </p>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(product.id)}
                  className="hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                  <X className="mr-2 h-4 w-4" /> Премахни
                </Button>
              </div>
            );
          })}

          {filteredSpecRows.map((key) => {
            const isDifferent = doesSpecDiffer(key);
            return (
              <div key={key} className="contents">
                <div
                  className={`p-3 font-semibold border-t border-slate-200 dark:border-slate-700 ${
                    isDifferent ? "bg-purple-50 dark:bg-purple-900/30" : ""
                  }`}>
                  {key}
                </div>
                {comparisonData.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 text-center border-t border-slate-200 dark:border-slate-700 ${
                      isDifferent ? "bg-purple-50 dark:bg-purple-900/30" : ""
                    }`}>
                    {getSpecValue(product, key)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:hidden">
          {comparisonData.map((product) => {
            const priceRecord = product.latest_lowest_price_record;
            const { price_bgn, price_eur } = calculate_product_variant_prices(
              priceRecord?.price
            );
            return (
              <div
                key={product.id}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-md">
                <div className="text-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative w-full h-40 mb-4">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.slug}
                      fill
                      className="object-contain drop-shadow-md"
                    />
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {product.slug}
                  </p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400 my-2">
                    {priceRecord ? `От ${price_bgn} / ${price_eur}` : "N/A"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromCompare(product.id)}>
                    <X className="mr-2 h-4 w-4" /> Изтрий
                  </Button>
                </div>
                <div className="space-y-2 pt-4">
                  <h4 className="font-bold text-lg mb-2">Характеристики:</h4>
                  {filteredSpecRows.map((key) => {
                    const isDifferent = doesSpecDiffer(key);
                    return (
                      <div
                        key={key}
                        className={`flex justify-between text-sm p-2 rounded-md ${
                          isDifferent
                            ? "bg-purple-50 dark:bg-purple-900/30"
                            : ""
                        }`}>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {key}:
                        </span>
                        <span className="text-right text-slate-800 dark:text-slate-100">
                          {getSpecValue(product, key)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
