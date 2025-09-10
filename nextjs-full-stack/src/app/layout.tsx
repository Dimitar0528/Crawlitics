import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CookieBanner } from "@/components/cookies/CookieBanner";
import { CompareProvider } from "@/context/CompareContext";
import CompareTray from "@/components/products/comparisons/CompareTray";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";
import { shadcn } from "@clerk/themes";
import { bgBG } from "@clerk/localizations";
import { buttonVariants } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s - Crawlitics",
    default: "Crawlitics Страница",
  },
  description:
    "Crawlitics е платформа за интелигентно сравнение на цени, проследяване на продукти и откриване на най-добрите оферти онлайн.",
  generator: "Next.js",
  applicationName: "Crawlitics",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: shadcn,
        layout: {
          socialButtonsVariant: "blockButton",
        },
        cssLayerName: "vendor",
        variables: {
          colorBackground: "var(--color-background)",
          borderRadius: "var(--radius-md)",
          colorBorder: "var(--color-secondary-foreground)",
          colorDanger: "var(--color-destructive)",
          colorForeground: "var(--color-foreground)",
          colorPrimary: "var(--color-primary)",
          colorPrimaryForeground: "var(--color-primary-foreground)",
          colorInput: "var(--color-input)",
          colorInputForeground: "var(--color-text)",
          colorMuted: "var(--color-muted)",
          colorMutedForeground: "var(--color-muted-foreground)",
          colorNeutral: "var(--color-secondary-foreground)",
          colorRing: "var(--color-ring)",
          colorShadow: "var(--color-shadow-color)",
          colorSuccess: "var(--color-primary)",
          colorWarning: "var(--color-warning)",
        },
        elements: {
          pricingTableCard:
            "custom-pricing-table bg-none bg-[unset] border p-6 my-4 mx-4 shadow-xl",
          pricingTableCardHeader: "p-0 pb-12",
          pricingTableCardTitle: "text-2xl dark:text-white",
          pricingTableCardBody:
            "flex flex-col justify-end bg-none bg-[unset] *:bg-none *:bg-[unset] [&>.cl-pricingTableCardFeatures]:justify-items-end",
          pricingTableCardDescription:
            "text-slate-700 dark:text-slate-300 text-sm ",
          pricingTableCardFeeContainer: "items-baseline gap-0.5",
          pricingTableCardFee: "text-4xl",
          pricingTableCardFeePeriodNotice: "hidden",
          pricingTableCardFeePeriod: "text-base text-foreground",
          pricingTableCardFeatures: "p-0 border-none",
          pricingTableCardFeaturesListItem: "[&>svg]:text-primary",
          pricingTableCardFeaturesListItemTitle: "text-sm",
          pricingTableCardFooter: "p-0 pt-8 border-none",
          pricingTableCardFooterButton: buttonVariants(),
        },
      }}
      localization={bgBG}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Toaster position="top-center" richColors closeButton />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme>
            <CookieBanner />
            <Navigation />
            <CompareProvider>
              <CompareTray />
              <DynamicBreadcrumb />
              <main>{children}</main>
            </CompareProvider>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
