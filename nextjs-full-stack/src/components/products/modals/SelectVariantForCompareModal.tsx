// components/products/modals/SelectVariantForCompareModal.tsx

"use client";

import Image from "next/image";
import { useCompare } from "@/context/CompareContext";
import { ProductVariant } from "@/lib/validations/product";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle, ShoppingBag } from "lucide-react";
import { calculate_product_variant_prices } from "@/lib/utils";

interface SelectVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  variants: ProductVariant[];
}

export default function SelectVariantForCompareModal({
  isOpen,
  onClose,
  variants,
}: SelectVariantModalProps) {
  const { addToCompare } = useCompare();

  const handleSelectVariant = (variant: ProductVariant) => {
    addToCompare(variant);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-500" />
            Избери продукти за сравнение
          </DialogTitle>
          <DialogDescription className="text-slate-700 dark:text-slate-300">
            Избери кой от продуктите искаш да добавиш към списъка
            за сравнение.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {variants.length > 0 ? (
            variants.map((variant) => {
              const latestPrice =
                variant.price_history[variant.price_history.length - 1]?.price;
              const { price_bgn, price_eur } =
                calculate_product_variant_prices(latestPrice);
                
              return (
                <div
                  key={variant.id}
                  className="w-full flex flex-col md:flex-row items-center text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  aria-label={`Add ${variant.slug} to comparison`}>
                  <div className="relative h-20 w-20 shrink-0 mr-4">
                    <Image
                      src={variant.image_url}
                      alt={variant.slug}
                      fill
                      className="rounded-md object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                      {variant.slug}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {Object.entries(variant.variant_specs)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="flex mt-2 md:mt-0 flex-col text-center">
                      <span className="font-bold text-sm md:text-base text-blue-600 dark:text-blue-300 whitespace-nowrap">
                        {price_bgn}
                      </span>
                      <span className="font-bold text-sm md:text-base text-blue-600 dark:text-blue-300 whitespace-nowrap">
                        {price_eur}
                      </span>
                    </div>
                    <PlusCircle
                      onClick={() => handleSelectVariant(variant)}
                      className="h-7 w-7 text-slate-400 hover:text-purple-500 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No specific variants to choose from.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
