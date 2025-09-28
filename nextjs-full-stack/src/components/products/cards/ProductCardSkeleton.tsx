"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeCheckIcon } from "lucide-react";

export default function ProductCardSkeleton() {
  return (
    <Card className="w-72 max-w-xs rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-lg animate-pulse relative">
      <Badge
        variant="secondary"
        className="absolute top-2 left-2 bg-gray-300 dark:bg-gray-600 text-white z-10">
        <BadgeCheckIcon />
      </Badge>
      <CardHeader className="p-0 relative border-b">
        <div className="aspect-[7/6] w-[260px] mx-auto overflow-hidden bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-grow space-y-2">
        <div className="h-6 w-7/8 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="h-6 w-2/3 bg-gray-300 dark:bg-gray-600 rounded mt-2" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </CardContent>
      <CardFooter>
        <div className="h-8 w-full bg-gray-300 dark:bg-gray-600 rounded-xl" />
      </CardFooter>
    </Card>
  );
}
