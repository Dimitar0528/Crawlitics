import { ProductVariant } from "@/lib/validations/product";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
const EUR_TO_BGN_RATE = 1.95583;

export function calculate_product_variant_prices(price: number) {
  const price_bgn = new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "BGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  const priceInEUR = price / EUR_TO_BGN_RATE;
  const price_eur = new Intl.NumberFormat("de-DE", {
    // using German locale for standard Euro formatting
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceInEUR);
  return { price_bgn, price_eur };
}

function getStoreNameFromUrl(url: string): string {
    const hostname = new URL(url).hostname;
    const formattedName = hostname.replace(/^www\./, '');
    return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
}

export function groupVariantsByStore(variants: ProductVariant[]): Record<string, ProductVariant[]> {

  return variants.reduce((acc, variant) => {
    const storeName = getStoreNameFromUrl(variant.source_url);
    if (!acc[storeName]) {
      acc[storeName] = [];
    }
    acc[storeName].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);
}

export function getVariantSummary(
  variants: ProductVariant[]
) {
  const summary = variants.reduce(
    (acc, variant) => {
      if (variant.availability === "В наличност") {
        acc.availableCount++;
      }
      // find min/max price
      const latest_price_record =
        variant.price_history[variant.price_history.length - 1];
      if (latest_price_record) {
        const priceNum = latest_price_record.price;
        if (!isNaN(priceNum)) {
          if (acc.minPrice === 0 || priceNum < acc.minPrice) {
            acc.minPrice = priceNum;
          }
          if (acc.maxPrice === 0 || priceNum > acc.maxPrice) {
            acc.maxPrice = priceNum;
          }
        }
      }
      return acc;
    },
    {
      availableCount: 0,
      minPrice: 0 as number,
      maxPrice: 0 as number,
    }
  );

  return { ...summary, totalCount: variants.length };
}


export const getPriceHistoryChartData = (variants: ProductVariant[]) => {
  const priceHistoryByDate: { [date: string]: number[] } = {};

  //  aggregate all prices for each date
  variants.forEach((variant) => {
    variant.price_history.forEach((pricePoint) => {
      const date = new Date(pricePoint.recorded_at).toISOString().split("T")[0];
      if (!priceHistoryByDate[date]) {
        priceHistoryByDate[date] = [];
      }
      priceHistoryByDate[date].push(pricePoint.price);
    });
  });

  const chartData = Object.entries(priceHistoryByDate).map(([date, prices]) => {

    const minPriceBgn = Math.min(...prices);
    const maxPriceBgn = Math.max(...prices);
    const averagePriceBgn =
      prices.reduce((acc, price) => acc + price, 0) / prices.length;

    return {
      date,
      minPrice: {
        bgn: parseFloat(minPriceBgn.toFixed(2)),
        eur: parseFloat((minPriceBgn / EUR_TO_BGN_RATE).toFixed(2)),
      },
      averagePrice: {
        bgn: parseFloat(averagePriceBgn.toFixed(2)),
        eur: parseFloat((averagePriceBgn / EUR_TO_BGN_RATE).toFixed(2)),
      },
      maxPrice: {
        bgn: parseFloat(maxPriceBgn.toFixed(2)),
        eur: parseFloat((maxPriceBgn / EUR_TO_BGN_RATE).toFixed(2)),
      },
    };
  });

  return chartData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};