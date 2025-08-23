"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories } from "@/lib/data";
import { Category } from "@/lib/validations/product";
import { generateBreadcrumbs } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ label: string; href: string; isCurrentPage: boolean }>
  >([]);

  useEffect(() => {
    // fetch categories for dynamic category labels
    const fetchCategories = async () => {
      const result = await getCategories();
      if (result.success) {
        setCategories(result.data);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const baseBreadcrumbs = generateBreadcrumbs(pathname);

      const enhancedBreadcrumbs = baseBreadcrumbs.map((breadcrumb, index) => {
        // check if this breadcrumb represents a product category
        if (breadcrumb.href.includes("/") && breadcrumb.href !== "/") {
          const segment = breadcrumb.href.split("/").pop();
          if (segment) {
            const category = categories.find(
              (cat) => cat.slug.toLowerCase() === segment.toLowerCase()
            );
            if (category) {
              return {
                ...breadcrumb,
                label: category.name_bg,
              };
            }
            if (
              index === baseBreadcrumbs.length - 1 &&
              baseBreadcrumbs.length > 2
            ) {
              const productLabelSegment = pathname.split("/").filter(Boolean).at(-1) as string
              const productLabel = productLabelSegment
                .split("-")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");         
              return {
                ...breadcrumb,
                label: productLabel,
              };
            }
          }
        }
        return breadcrumb;
      });

      setBreadcrumbs(enhancedBreadcrumbs);
    } else {
      setBreadcrumbs(generateBreadcrumbs(pathname));
    }
  }, [pathname, categories]);

  if (pathname === "/") {
    return null;
  }

  return (
    <Breadcrumb className="bg-slate-50 dark:bg-gray-900 py-2 px-4 sm:px-6 lg:px-8 mx-auto border-b-1">
      <BreadcrumbList className="text-sm sm:text-base">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            <BreadcrumbItem>
              {breadcrumb.isCurrentPage ? (
                <BreadcrumbPage className="font-medium text-slate-900 dark:text-white">
                  {breadcrumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={breadcrumb.href}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {breadcrumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator className="text-slate-400 dark:text-slate-600" />
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
