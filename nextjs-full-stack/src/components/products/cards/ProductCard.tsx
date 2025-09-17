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
import { BadgeCheckIcon, CircleCheckBig } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductPreview } from "@/lib/validations/product";
import { slugifyString } from "@/lib/utils";
import { Route } from "next";

export default function ProductCard(product: ProductPreview) {
  const heroImageUrl = product.variants.find(
    (variant) => variant.image_url
  )!.image_url;

  const latest_lowest_available_price = product.variants
    ?.filter((variant) => variant.availability === "В наличност")
    .reduce((min, variant) => {
      const priceNum = variant.latest_lowest_price_record.price;
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
  const slug_category = slugifyString(product.category.toLowerCase());
  const prooduct_href = product.CRAWLEEBOT_matchingVariantUrls
    ? `/${slug_category}/${product.slug}?mV=${product.CRAWLEEBOT_matchingVariantUrls.map((url) =>
        encodeURIComponent(url)).join(",")}`
    : `/${slug_category}/${product.slug}`;
  return (
    <Link
      className="block group"
      href={prooduct_href as Route}
      target={`${product.CRAWLEEBOT_matchingVariantUrls && "_blank"}`}>
      <Card
        className="cursor-pointer w-72 max-w-xs
        max-w-xs rounded-2xl border border-gray-200 dark:border-gray-700 
        overflow-hidden
        bg-white dark:bg-gray-900
        shadow-lg 
        transition-all duration-500 ease-in-out
        hover:shadow-2xl
        hover:border-blue-500
        hover:dark:border-blue-500
        group-hover:shadow-xl group-hover:border-primary group-hover:scale-[1.02]
        relative
      ">
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-blue-500 text-white dark:bg-blue-600">
          <BadgeCheckIcon />
          {product.category}
        </Badge>
        {!isAvailable && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2 bg-red-500 text-white dark:bg-red-600">
            <BadgeCheckIcon />
            Изчерпан
          </Badge>
        )}
        <CardHeader className="p-0 relative border-b relative">
          <div className="aspect-square w-full overflow-hidden">
            <Image
              src={heroImageUrl}
              width={300}
              height={300}
              alt={product.name}
              className="
                h-full w-full object-contain p-4 
                transition-transform duration-500 ease-in-out
                group-hover:scale-103
              "
              draggable={false}
              priority
            />
          </div>
          {product.CRAWLEEBOT_matchingVariantCount &&
            product.CRAWLEEBOT_matchingVariantCount > 0 && (
              <div className="absolute bottom-2 right-2">
                <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-800/40 dark:text-green-300">
                  <CircleCheckBig width={16} height={16} />
                  {product.CRAWLEEBOT_matchingVariantCount}{" "}
                  {product.CRAWLEEBOT_matchingVariantCount === 1
                    ? "продукт съвпада"
                    : "продукта съвпадат"}{" "}
                  с критериите ви
                </span>
              </div>
            )}
        </CardHeader>

        <CardContent className="p-4 flex flex-col flex-grow">
          {/* This title will truncate if it's too long, preventing card stretching. */}
          <CardTitle
            className="
              text-lg font-bold capitalize line-clamp-1 h-[1.625rem] 
              group-hover:text-primary transition-colors
            "
            title={product.name}>
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
                Налични оферти
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
              bg-gradient-to-r from-blue-800 to-purple-800 
              hover:from-purple-600 hover:to-pink-700
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
