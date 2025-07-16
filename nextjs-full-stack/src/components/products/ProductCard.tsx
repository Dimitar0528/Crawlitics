"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Product } from "@/types/product";
import Image from "next/image";

export default function ProductCard(product: Product) {
  return (
    <Card
      className="cursor-pointer
        max-w-xs rounded-2xl border border-gray-200 dark:border-gray-700 
        overflow-hidden
        bg-white dark:bg-gray-900
        shadow-lg 
        transition-transform duration-500 ease-in-out
        hover:shadow-2xl 
        hover:scale-[1.03] 
        hover:-translate-y-2
        relative
      ">
      <CardHeader className="p-0 overflow-hidden rounded-t-2xl">
        <Image
          src={product.image_url!}
          width={200}
          height={200}
          alt={product.name}
          className="
              mx-auto object-cover 
              transition-transform duration-700 ease-in-out
              hover:scale-105 
              hover:rotate-1
            "
          draggable={false}
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

        <div className="flex items-center space-x-3">
          <span
            className="
            bg-yellow-400 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full
            shadow-md
          ">
            Намаление 8%
          </span>

          <span className="text-sm text-gray-600 dark:text-gray-300 italic my-2">
            Спестете до 12,62 лв.
          </span>
        </div>

        <div className="flex flex-col mt-4">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Най-ниска цена: 
          </span>
          <div className="flex items-baseline space-x-2 justify-between">
            <span
              className="
        text-2xl font-extrabold text-blue-700 dark:text-blue-400 
      ">
              {product.price_history && product.price_history.length > 0
                && `${product.price_history[0].price} лв.`}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-300">
              1 от 3 магазина
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <CardAction className="w-full">
          <a
            href="#"
            className="
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
          </a>
        </CardAction>
      </CardFooter>
    </Card>
  );
}
