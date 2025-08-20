"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/validations/product";
import SelectVariantForCompareModal from "../modals/SelectVariantForCompareModal";

interface ProductHeaderActionsProps {
  product: Product;
}

export default function ProductHeaderActions({
  product,
}: ProductHeaderActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="w-full sm:w-auto bg-blue-700 hover:bg-blue-500 text-white hover:text-white dark:bg-blue-300 dark:text-black dark:hover:bg-blue-400">
        <PlusCircle className="mr-2 h-4 w-4" />
        Избери продукти за сравнение
      </Button>

      <SelectVariantForCompareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variants={product.variants}
      />
    </>
  );
}
