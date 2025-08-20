"use client";

import { useMemo } from "react";
import type { ProductVariant } from "@/lib/validations/product";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

import { calculate_product_variant_prices, groupVariantsByStore } from "@/lib/utils";

type StorePriceData = {
  store: string;
  minPrice: number;
  averagePrice: number;
  maxPrice: number;
}

const chartConfig = {
  averagePrice: {
    label: "Средна цена",
    color: "oklch(79.5% 0.184 86.047)",
  },
  minPrice: {
    label: "Мин. цена",
    color: "oklch(62.3% 0.214 259.815)",
  },
  maxPrice: {
    label: "Макс. цена",
    color: "oklch(63.7% 0.237 25.331)",
  },
} satisfies ChartConfig;

interface PriceDistributionChartProps {
  variants: ProductVariant[];
}

export default function PriceDistributionByStoreChart({
  variants,
}: PriceDistributionChartProps) {
  const chartData = useMemo(() => {
    const variantsByStore = groupVariantsByStore(variants);

    // process the grouped variants to calculate price statistics for each store.
    const aggregatedData = Object.entries(variantsByStore).reduce(
      (acc, [store, storeVariants]) => {
        const prices = storeVariants
          .map((variant) => variant.price_history[variant.price_history.length - 1].price)
          .filter(
            (price): price is number =>
              typeof price === "number" && isFinite(price)
          );
          const sum = prices.reduce((a, b) => a + b, 0);
          acc.push({
            store,
            minPrice: Math.min(...prices),
            averagePrice: parseFloat((sum / prices.length).toFixed(2)),
            maxPrice: Math.max(...prices),
          });

        return acc;
      },
      [] as StorePriceData[]
    ); 

    return aggregatedData.sort((a, b) => a.averagePrice - b.averagePrice);
  }, [variants]);

  if (chartData.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Разпределение на цените по търговци</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 dark:text-slate-400 p-8">
            Няма налични данни за цени от различни търговци.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle>Разпределение на цените по търговци</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-300">
          Сравнение на ценовите диапазони за този продукт между различните
          търговци. Височината на стълба показва средната цена.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[450px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="store"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              textAnchor="end"
            />
            <YAxis
              tickFormatter={(value: number) => {
                const {price_bgn, price_eur} = calculate_product_variant_prices(value)
                return `${price_bgn} ${price_eur}`;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data: StorePriceData = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-4 text-sm shadow-sm">
                      <div className="mb-2 font-bold">{data.store}</div>
                      <div className="space-y-2">
                        {["minPrice", "averagePrice", "maxPrice"].map((key) => {
                          const priceKey = key as keyof typeof chartConfig;
                          const config = chartConfig[priceKey];
                          const { price_bgn, price_eur } =
                            calculate_product_variant_prices(data[priceKey]);
                          return (
                            <div
                              key={key}
                              className="flex w-full items-center justify-between">
                              <span
                                className="flex items-center gap-2 font-semibold"
                                style={{ color: config.color }}>
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                                {config.label}: &nbsp;
                              </span>
                              <span
                                className="font-bold"
                                style={{ color: config.color }}>
                                {price_bgn} / {price_eur}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              }}
            />
            <Bar
              dataKey="averagePrice"
              fill={chartConfig.averagePrice.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
