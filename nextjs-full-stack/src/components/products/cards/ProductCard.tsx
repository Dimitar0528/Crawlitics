"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculate_product_variant_prices } from "@/lib/utils";
import { BadgeCheckIcon } from "lucide-react";
import { Product } from "@/types/product";
import Image from "next/image";
import Link from "next/link";

export default function ProductCard(product: Product) {
  const heroImageUrl = product.variants.find(
    (variant) => variant.image_url
  )!.image_url;

  const latest_lowest_available_price = product.variants
    ?.filter((variant) => variant.availability === "В наличност")
    .reduce((min, variant) => {
      const priceNum = variant.latest_lowest_price_record!.price;
      return priceNum < min ? priceNum : min;
    }, Infinity);
  const { price_bgn, price_eur } = calculate_product_variant_prices(
    latest_lowest_available_price
  );
  const totalCount = product.variants?.length ?? 0;
  const availableCount =
    product.variants?.filter(
      (variant) => variant.availability === "В наличност"
    ).length ?? 0;
    const percentage = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;
    const isAvailable = availableCount > 0;

  return (
    <Link href={`/product/${product.slug}`}>
      <Card
        className="cursor-pointer w-72
        max-w-xs rounded-2xl border border-gray-200 dark:border-gray-700 
        overflow-hidden
        bg-white dark:bg-gray-900
        shadow-lg 
        transition-all duration-500 ease-in-out
        hover:shadow-2xl
        hover:border-blue-500
        hover:dark:border-blue-500
        hover:scale-[1.02] 
        hover:-translate-y-2
        relative
      ">
        <Badge
          variant="secondary"
          className="absolute top-0 bg-blue-500 text-white dark:bg-blue-600">
          <BadgeCheckIcon />
          {product.category}
        </Badge>
        <CardHeader className="p-0 overflow-hidden rounded-t-2xl">
          <Image
            src={heroImageUrl}
            width={200}
            height={200}
            alt={product.name}
            className="h-50
              mx-auto object-cover 
              transition-transform duration-700 ease-in-out
              hover:scale-105 
              hover:rotate-1
            "
            draggable={false}
            priority
          />
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          <CardTitle
            className="
          text-lg font-extrabold text-gray-900 dark:text-gray-100 
          transition-colors duration-400 
          hover:text-purple-600 dark:hover:text-purple-400
        ">
            {product.name}
          </CardTitle>

          <div className="flex flex-col mt-4">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Най-ниска налична цена
            </span>
            <div className="flex items-end space-x-2 justify-between">
              <div>
                <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300 leading-none">
                  {price_bgn}
                </div>
                <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300 leading-none mt-2">
                  {price_eur}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Налични варианти
              </span>
              <span
                className={`text-sm font-bold mb-1 ${
                  isAvailable
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {availableCount} / {totalCount}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAvailable ? "bg-green-500" : "bg-red-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0">
          <CardAction className="w-full">
            <button
              className="cursor-pointer
              inline-block w-full text-center 
              bg-gradient-to-r from-blue-500 to-purple-600 
              hover:from-purple-600 hover:to-pink-600
              text-white font-semibold 
              py-3 rounded-xl 
              shadow-lg
              transform transition-all duration-400
              hover:scale-102 hover:shadow-2xl
            ">
              Виж продукта
            </button>
          </CardAction>
        </CardFooter>
      </Card>
    </Link>
  );
}
