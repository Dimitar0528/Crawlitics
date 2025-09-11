import { ProductVariant } from "@/lib/validations/product";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugify from "slugify";
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
  }).format(price != Infinity ? price : 0);
  const priceInEUR = (price != Infinity ? price : 0) / EUR_TO_BGN_RATE;
  const price_eur = new Intl.NumberFormat("de-DE", {
    // using German locale for standard Euro formatting
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceInEUR);
  return { price_bgn, price_eur };
}

export function getStoreNameFromUrl(url: string): string {
  const hostname = new URL(url).hostname;
  const formattedName = hostname.replace(/^www\./, "");
  return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
}

export function groupVariantsByStore(
  variants: ProductVariant[]
): Record<string, ProductVariant[]> {
  return variants.reduce((acc, variant) => {
    const storeName = getStoreNameFromUrl(variant.source_url);
    if (!acc[storeName]) {
      acc[storeName] = [];
    }
    acc[storeName].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);
}

export function getVariantSummary(variants: ProductVariant[]) {
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
  if (!variants || variants.length === 0) {
    return [];
  }

  // collect all price points into a single array and find the earliest date.
  let minDate = new Date();
  const allPricePoints = variants.flatMap((variant) =>
    variant.price_history.map((p) => ({
      ...p,
      recorded_at: new Date(p.recorded_at),
    }))
  );

  minDate = new Date(
    Math.min(...allPricePoints.map((p) => p.recorded_at.getTime()))
  );
  const maxDate = new Date();
  maxDate.setHours(23, 59, 59, 999);

  const variantPriceHistories = variants.map((variant) => ({
    ...variant,
    price_history: variant.price_history.sort(
      (a, b) => a.recorded_at.getTime() - b.recorded_at.getTime()
    ),
  }));

  const dailySnapshots = new Map<string, number[]>();
  for (
    let day = new Date(minDate);
    day <= maxDate;
    day.setDate(day.getDate() + 1)
  ) {
    const dayKey = day.toISOString().split("T")[0];
    const pricesForThisDay: number[] = [];

    // for each variant, find its active price on this specific day and add daily snapshot only if necessary
    variantPriceHistories.forEach((variant) => {
      const lastKnownPricePoint = variant.price_history.findLast(
        (p) => p.recorded_at <= day
      );
      if (lastKnownPricePoint) {
        pricesForThisDay.push(lastKnownPricePoint.price);
      }
    });

    if (pricesForThisDay.length > 0) {
      dailySnapshots.set(dayKey, pricesForThisDay);
    }
  }

  //  calculate stats from the complete snapshots and format the final chart
  const fullChartData = Array.from(dailySnapshots.entries()).map(
    ([date, prices]) => {
      const minPriceBgn = Math.min(...prices);
      const maxPriceBgn = Math.max(...prices);
      const averagePriceBgn = prices.reduce((a, b) => a + b, 0) / prices.length;

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
    }
  );

  if (fullChartData.length < 2) {
    return fullChartData;
  }

  const filteredChartData = fullChartData.filter((currentDay, index, array) => {
    if (index === 0) {
      return true;
    }
    const previousDay = array[index - 1];

    const minPriceChanged =
      currentDay.minPrice.bgn !== previousDay.minPrice.bgn;
    const avgPriceChanged =
      currentDay.averagePrice.bgn !== previousDay.averagePrice.bgn;
    const maxPriceChanged =
      currentDay.maxPrice.bgn !== previousDay.maxPrice.bgn;

    return minPriceChanged || avgPriceChanged || maxPriceChanged;
  });

  return filteredChartData;
};

export function slugifyString(category: string) {
  return slugify(category);
}

const segmentLabels: Record<string, string> = {
  "compare": "Сравнение",
  "crawleebot": "CrawleeBot",
  "search": "Търсене",
  "how-it-works": "Как работи",
  "sign-in": "Вход",
  "sign-up": "Регистрация",
  "user-profile": "Профил",
  "pricing": "Цени и абонаменти",
  "why-choose-us": "Защо да избереш нас"
};

export function generateBreadcrumbs(
  pathname: string
): Array<{ label: string; href: string; isCurrentPage: boolean }> {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Начало", href: "/", isCurrentPage: true }];
  }

  const breadcrumbs: Array<{
    label: string;
    href: string;
    isCurrentPage: boolean;
  }> = [{ label: "Начало", href: "/", isCurrentPage: false }];

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // use mapping if exists, else fallback to "Title Case"
    const label =
      segmentLabels[segment] ??
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    breadcrumbs.push({
      label,
      href: currentPath,
      isCurrentPage: index === segments.length - 1,
    });
  });

  return breadcrumbs;
}