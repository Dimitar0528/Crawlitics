"use client";

import { useRouter, usePathname } from "next/navigation"
import Image from "next/image";
import { X, ArrowRight, Trash2 } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { Button } from "@/components/ui/button";
export default function CompareTray() {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();
  const pathname = usePathname();
  const router = useRouter();
  if (compareProducts.length === 0 || pathname === "/compare") {
    return null;
  }
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      aria-live="polite"
      aria-label="Comparison Tray">
      <div className="bg-slate-800/50 dark:bg-slate-600/50 backdrop-blur-sm text-white shadow-lg_top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg hidden sm:block">Сравни:</span>
              <div className="flex items-center gap-2">
                {compareProducts.map((item) => (
                  <div key={item.id} className="relative group last:mr-4">
                    <Image
                      src={item.image_url}
                      alt={item.slug}
                      width={64}
                      height={64}
                      className="h-10 w-10 rounded-md object-contain border-2 border-slate-600 hover:border-blue-500"
                    />
                    <button
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-125 transition-all"
                      aria-label={`Remove ${item.slug} from comparison`}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCompare}
                className="hidden sm:inline-flex bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-500">
                <Trash2 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                <span className="sr-only">Изчисти всичко</span>
              </Button>
              <Button
                disabled={compareProducts.length < 2}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                onClick={() => {
                  router.push(
                    `/compare?ids=${compareProducts.map(
                      (product) => product.id
                    )}`
                  );
                }}>
                Сравни ({compareProducts.length}/4)
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
