"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, LinkIcon, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SpecList } from "../SpecList";
import { ProductVariant } from "@/types/product";
import { calculate_product_variant_prices } from "@/lib/utils";

export default function VariantCard({
  variants,
}: {
  variants: ProductVariant[];
}) {
  const searchParams = useSearchParams();

  const [selectedVariantSlug, setSelectedVariantSlug] = useState<string | null>(
    null
  );
  const variantRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const isInitialLoad = useRef(true);

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
        toast.success("Shareable link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        toast.error("Could not copy link.");
      });
      setTimeout(() => {
        setSelectedVariantSlug(null)
      }, 4000);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 pr-4">
        {variants.map((variant) => {
          const isSelected = selectedVariantSlug === variant.slug;
          const isAvailable = variant.availability === "В наличност";
          const latestPriceRecord =
            variant.price_history[variant.price_history.length - 1];
          const { price_bgn, price_eur } = calculate_product_variant_prices(
            latestPriceRecord?.price
          );

          return (
            <div
              key={variant.id}
              ref={(node) => {
                if (node) variantRefs.current.set(variant.slug, node);
                else variantRefs.current.delete(variant.slug);
              }}
              className={`
                relative grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white dark:bg-slate-800 
                border-1 rounded-xl p-5 shadow-md 
                transition-all duration-300 ease-in-out
                ${
                  isSelected
                    ? "border-blue-500 dark:border-blue-400 shadow-lg"
                    : "border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-purple-500 dark:hover:border-purple-400"
                }
              `}>
              {isSelected && (
                <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1.5 shadow-md z-10">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
              <div className="absolute top-0 left-0 z-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-6 h-6 bg-slate-300 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600"
                      onClick={(e) => handleShareVariant(e, variant.slug)}>
                      <LinkIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy shareable link</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="md:col-span-1">
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
                  <p className="text-xl text-center font-bold text-blue-700 dark:text-blue-300 leading-none">
                    {price_bgn}
                  </p>
                  <p className="text-xl text-center font-bold text-blue-700 dark:text-blue-300 leading-none my-2">
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

              <div className="md:col-span-1 flex justify-center">
                <Link
                  href={variant.source_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto"
                  onClick={(e) => e.stopPropagation()}>
                  <Button className="w-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-blue-600 dark:hover:bg-blue-400">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Към магазина</span>
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
