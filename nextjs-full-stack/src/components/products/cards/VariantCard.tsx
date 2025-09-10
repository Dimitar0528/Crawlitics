"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BellRing, LinkIcon, PlusCircle, MinusCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SpecList } from "../SpecList";
import { ProductVariant } from "@/lib/validations/product";
import { calculate_product_variant_prices } from "@/lib/utils";
import AvailabilityAlertModal from "../forms/AvailabilityAlertForm";
import { useCompare } from "@/context/CompareContext";
import { Route } from "next";
export default function VariantCard({
  variants,
}: {
  variants: ProductVariant[];
}) {
  const { compareProducts, addToCompare, removeFromCompare} = useCompare()
  const searchParams = useSearchParams();

  const [selectedVariantSlug, setSelectedVariantSlug] = useState<string | null>(
    null
  );
  const variantRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const isInitialLoad = useRef(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariantForAlert, setSelectedVariantForAlert] =
    useState<ProductVariant | null>(null);

  useEffect(() => {
    if (isInitialLoad.current) {
      const variantSlugFromUrl = searchParams.get("variant");
      if (
        variantSlugFromUrl &&
        variants.some((v) => v.slug === variantSlugFromUrl)
      ) {
        setSelectedVariantSlug(variantSlugFromUrl);
        const node = variantRefs.current.get(variantSlugFromUrl);
        setTimeout(() => {
          if (node) {
            node.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
        setTimeout(() => {
          setSelectedVariantSlug(null);
        }, 4000);
      }
      isInitialLoad.current = false;
    }
  }, [searchParams, variants]);

  const handleShareVariant = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation(); 
    setSelectedVariantSlug(slug);

    const newUrl = `${window.location.origin}${window.location.pathname}?variant=${slug}`;
    navigator.clipboard
      .writeText(newUrl)
      .then(() => {
        toast.success("Линкът е копиран в клипборда!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        toast.error("Имаше проблем с копирането на линка!");
      });
      setTimeout(() => {
        setSelectedVariantSlug(null)
      }, 4000);
  };

  const handleNotifyClick = (e: React.MouseEvent, variant: ProductVariant) => {
    e.stopPropagation();
    setSelectedVariantForAlert(variant);
    setModalOpen(true);
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-4 ">
        {variants.map((variant) => {
          const isSelected = selectedVariantSlug === variant.slug;
          const isAvailable = variant.availability === "В наличност";
          const latestPriceRecord =
            variant.price_history[variant.price_history.length - 1];
          const { price_bgn, price_eur } = calculate_product_variant_prices(
            latestPriceRecord?.price
          );
          const compareItemIds = new Set(
            compareProducts.map((item) => item.id)
          );
          const isInCompareList = compareItemIds.has(variant.id);
          return (
            <div
              key={variant.id}
              ref={(node) => {
                if (node) variantRefs.current.set(variant.slug, node);
                else variantRefs.current.delete(variant.slug);
              }}
              className={`
                relative grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white dark:bg-slate-800 
                border rounded-xl p-5 shadow-md 
                transition-all duration-300 ease-in-out hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                ${
                  isSelected && "border-blue-500 dark:border-blue-400 shadow-lg"
                }
                ${
                  isInCompareList &&
                  !isSelected &&
                  "border-purple-500 dark:border-purple-400"
                }
              `}>
              <div className="absolute top-0 left-0.5 z-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-8 h-8 bg-slate-300 dark:bg-slate-400/50 hover:bg-slate-200 dark:hover:bg-slate-600"
                      onClick={(e) => handleShareVariant(e, variant.slug)}>
                      <LinkIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Копирай линка на клипборда</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="absolute top-0 right-0.5 z-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-25 h-8 bg-slate-300 dark:bg-slate-400/50 hover:bg-slate-400 dark:hover:bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isInCompareList) return removeFromCompare(variant.id);
                        addToCompare(variant);
                      }}>
                      {isInCompareList ? (
                        <MinusCircle className="h-4 w-4" />
                      ) : (
                        <PlusCircle className="h-4 w-4" />
                      )}
                      {isInCompareList ? "Премахни" : "Сравни"}
                      <span className="sr-only">
                        {isInCompareList ? "Премахни" : "Сравни"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isInCompareList ? "Премахни от списъка за сравнение" : "Сравни продукта"}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="md:col-span-1 mt-4 md:mt-2">
                {Object.keys(variants).length === 0 ? (
                  <p className="text-center text-gray-700 italic bg-gray-200 px-4 py-2 rounded-md">
                    Всички характеристики за този вариант съвпадат с общите
                    характеристики.
                  </p>
                ) : (
                  <SpecList specs={variant.variant_specs} initial_limit={3} />
                )}
              </div>

              <div className="md:col-span-1 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2">
                <div>
                  <p className="text-lg sm:text-xl text-center font-bold text-blue-700 dark:text-blue-300 leading-none">
                    {price_bgn}
                  </p>
                  <p className="text-lg sm:text-xl text-center font-bold text-blue-700 dark:text-blue-300 leading-none my-2">
                    {price_eur}
                  </p>
                </div>
                <div
                  className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                    isAvailable
                      ? "bg-green-100 text-green-900 dark:bg-green-700/50 dark:text-green-200"
                      : "bg-red-100 text-red-900 dark:bg-red-700/50 dark:text-red-200"
                  }`}>
                  {variant.availability}
                </div>
              </div>

              <div className="md:col-span-1 flex flex-col gap-4 justify-center">
                <Link
                  href={(variant.source_url) as Route || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto"
                  onClick={(e) => e.stopPropagation()}>
                  <Button className="w-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-blue-600 dark:hover:bg-blue-400">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Към магазина</span>
                  </Button>
                </Link>
                {!isAvailable && (
                  <Button
                    onClick={(e) => handleNotifyClick(e, variant)}
                    className="w-full bg-amber-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-amber-700">
                    <BellRing className="w-5 h-5" />
                    <span>Уведоми при наличност</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedVariantForAlert && (
        <AvailabilityAlertModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          variant={selectedVariantForAlert}
        />
      )}
    </TooltipProvider>
  );
}
