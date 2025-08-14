import type { Metadata } from "next";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CookieBanner } from "@/components/cookies/CookieBanner";
import { CompareProvider } from "@/context/CompareContext";
import CompareTray from "@/components/products/CompareTray";
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
    <ClerkProvider>
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
              <main>{children}</main>
            </CompareProvider>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
