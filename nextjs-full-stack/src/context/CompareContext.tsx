
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { ProductVariant } from "@/lib/validations/product"

type CompareContextType = {
  compareProducts: ProductVariant[];
  addToCompare: (variant: ProductVariant) => void;
  removeFromCompare: (variantId: number) => void;
  clearCompare: () => void;
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;
const LOCAL_STORAGE_KEY = "compare"; 

export function CompareProvider({ children }: { children: ReactNode }) {
    const [compareProducts, setCompareProducts] = useState<ProductVariant[]>(
      []
    );

    useEffect(() => {
      try {
        const products = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (products) {
          setCompareProducts(JSON.parse(products));
        }
      } catch (error) {
        console.error("Error reading from localStorage", error);
      }
    }, []);

    useEffect(() => {
      try {
        window.localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(compareProducts.map((product)=>{
            const productStorage = {
              id: product.id,
              image_url: product.image_url,
              slug: product.slug,
            }
          return productStorage
          }))
        );
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    }, [compareProducts]);
    
  const addToCompare = (variant: ProductVariant) => {
    setCompareProducts((prevItems) => {
      if (prevItems.some((item) => item.id === variant.id)) {
        toast.info("Този продукт вече е във вашия списък за сравнение.");
        return prevItems;
      }
      if (prevItems.length >= MAX_COMPARE_ITEMS) {
        toast.warning(
          `Може да сравняваш максимално до ${MAX_COMPARE_ITEMS} продукта.`
        );
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
    setCompareProducts((prevItems) =>
      prevItems.filter((item) => item.id !== variantId)
    );
    toast.success("Продуктът е премахнат от списъка за сравнение.");
  };

  const clearCompare = () => {
    setCompareProducts([]);
    toast.success("Списъкът със сравнения е изчистен.");
  };

  const value = {
    compareProducts,
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
