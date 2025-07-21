import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculate_product_variant_prices(price: number) {
  const price_bgn = new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "BGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  const EUR_TO_BGN_RATE = 1.95583;
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
