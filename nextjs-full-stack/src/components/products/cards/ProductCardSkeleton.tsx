"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function ProductCardSkeleton() {
  return (
    <Card className="w-72 max-w-xs rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-lg animate-pulse">
      <CardHeader className="p-0 relative border-b">
        <div className="aspect-square mx-4 bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-grow space-y-4">
        <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <div className="h-10 ml-7 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
      </CardFooter>
    </Card>
  );
}
