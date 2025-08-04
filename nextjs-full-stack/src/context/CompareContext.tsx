
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";
import { ProductVariant } from "@/lib/validations/product"

type CompareContextType = {
  compareItems: ProductVariant[];
  addToCompare: (variant: ProductVariant) => void;
  removeFromCompare: (variantId: number) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<ProductVariant[]>([]);

  const addToCompare = (variant: ProductVariant) => {
    setCompareItems((prevItems) => {
      if (prevItems.length >= MAX_COMPARE_ITEMS) {
        toast.warning(
          `Може да сравняваш максимално до ${MAX_COMPARE_ITEMS} продукта.`
        );
        return prevItems;
      }
      if (prevItems.some((item) => item.id === variant.id)) {
        toast.info("Този продукт вече е във вашия списък за сравнение.");
        return prevItems;
      }
      toast("Продукта е добавен за сравнение", {
        action: {
          label: "Отмяна",
          onClick: () => removeFromCompare(variant.id),
        },
      });
      return [...prevItems, variant];
    });
  };

  const removeFromCompare = (variantId: number) => {
    setCompareItems((prevItems) =>
      prevItems.filter((item) => item.id !== variantId)
    );
    toast.success("Продуктът е премахнат от списъка за сравнение.");
  };

  const clearCompare = () => {
    setCompareItems([]);
    toast.success("Списъкът със сравнения е изчистен.");
  };

  const value = {
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
  };

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
