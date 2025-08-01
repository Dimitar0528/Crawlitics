
"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { calculate_product_variant_prices, getPriceHistoryChartData } from "@/lib/utils";
import { ProductVariant } from "@/lib/validations/product"; 
const chartConfig = {
  minPrice: {
    label: "Мин. цена",
    color: "oklch(62.3% 0.214 259.815)",
  },
  averagePrice: {
    label: "Средна цена",
    color: "oklch(79.5% 0.184 86.047)",
  },
  maxPrice: {
    label: "Макс. цена",
    color: "oklch(63.7% 0.237 25.331)",
  },
} satisfies ChartConfig;

interface PriceHistoryChartProps {
  variants: ProductVariant[];
}

export default function PriceHistoryChart({ variants }: PriceHistoryChartProps) {
  const chartData = useMemo(
    () => getPriceHistoryChartData(variants),
    [variants]
  );
   const yAxisTicks = useMemo(() => {
     if (chartData.length < 2) return [];
     const min_price_value = Math.min(...chartData.map((d) => d.minPrice.bgn));
     const max_price_value = Math.max(...chartData.map((d) => d.maxPrice.bgn));
     const tickCount = 6;
     const tickArray: number[] = [];
     // calculate the interval between each tick mark to create a uniform scale.
     const interval = (max_price_value - min_price_value) / (tickCount - 1);
     for (let i = 0; i < tickCount; i++) {
       // calculate the tick value and round it to the nearest 10
       tickArray.push(Math.round((min_price_value + i * interval) / 10) * 10);
     }
     return [...new Set(tickArray)];
   }, [chartData]);

  if (chartData.length < 2) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 p-8 bg-slate-100 dark:bg-slate-800 rounded-lg">
        Няма достатъчно данни за показване на графика на цените.
      </div>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle>История на цените</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-300">
          Тази графика комбинира цените от всички варианти. Проследете как се
          изменят най-ниската, средната и най-високата цена на продукта с
          течение на времето.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[450px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 15,
              left: 12,
              right: 12,
              bottom: 10,
            }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={20}
              tickFormatter={(value: Date) => {
                const date = new Date(value);
                return date.toLocaleDateString("bg-BG", {
                  year: "2-digit",
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              domain={["dataMin - 10", "dataMax + 10"]}
              ticks={yAxisTicks}
              tickFormatter={(value: number) => {
                const { price_bgn, price_eur } =
                  calculate_product_variant_prices(value);
                return ` ${price_bgn} ${price_eur}`;
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label: Date) => {
                    return new Date(label).toLocaleDateString("bg-BG", {
                      year: "2-digit",
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  // the formatter handles each individual line in the tooltip
                  formatter={(_, name, item) => {
                    const priceData = item.payload[name];
                    if (!priceData || typeof priceData.bgn === "undefined") {
                      return null;
                    }
                    return (
                      <div className="flex w-full items-center justify-between gap-x-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label}
                        </span>

                        <span className="">
                          {priceData.bgn.toLocaleString("bg-BG", {
                            style: "currency",
                            currency: "BGN",
                          })}{" "}
                          /
                          <span className="ml-1.5">
                            {priceData.eur.toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </span>
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Line
              dataKey="maxPrice.bgn"
              type="monotone"
              stroke={chartConfig.maxPrice.color}
              strokeWidth={2}
              name="maxPrice"
            />
            <Line
              dataKey="averagePrice.bgn"
              type="monotone"
              stroke="oklch(79.5% 0.184 86.047)"
              strokeWidth={2}
              name="averagePrice"
            />
            <Line
              dataKey="minPrice.bgn"
              type="monotone"
              stroke="oklch(62.3% 0.214 259.815)"
              strokeWidth={2}
              name="minPrice"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}