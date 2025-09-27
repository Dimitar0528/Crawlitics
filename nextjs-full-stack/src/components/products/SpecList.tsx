"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type SpecListProps = {
  specs: Record<string, string | number | null>;
  initial_limit?: number;
}
const SpecItem = ({
  specKey,
  specValue,
}: {
  specKey: string;
  specValue: unknown;
}) => (
  <div
    key={specKey}
    className="flex justify-between items-center gap-2 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
    <span className="font-medium text-slate-600 dark:text-slate-300 capitalize">
      {specKey.replace(/_/g, " ")}
    </span>
    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
      {String(specValue)}
    </span>
  </div>
);

export function SpecList({ specs, initial_limit = 10 }: SpecListProps) {
  const specEntries = Object.entries(specs).filter(
    ([, value]) => value !== null && value !== ""
  );

  if (specEntries.length <= initial_limit) {
    return (
      <dl className="w-full space-y-1">
        {specEntries.map(([key, value]) => (
          <SpecItem key={key} specKey={key} specValue={value} />
        ))}
      </dl>
    );
  }
  const initiallyDisplayedSpecs = specEntries.slice(0, initial_limit);

  return (
    <Drawer>
      <div>
        <dl>
          {initiallyDisplayedSpecs.map(([key, value]) => (
            <SpecItem key={key} specKey={key} specValue={value} />
          ))}
        </dl>

        <DrawerTrigger asChild>
          <Button
            variant="link"
            className="group inline-flex items-center gap-1 px-0 text-sm font-medium text-purple-600 dark:text-purple-400 transition-colors  hover:text-purple-700 dark:hover:text-purple-300"
            onClick={(e) => e.stopPropagation()}>
            Виж всички {specEntries.length} характеристики
            <span
              className=" transition-transform duration-300 ease-in-out group-hover:translate-x-1">
              →
            </span>
          </Button>
        </DrawerTrigger>
      </div>

      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-2xl">Пълни спецификации</DrawerTitle>
            <DrawerDescription className="text-lg">
              Всички характеристики на този специфичен продукт.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4">
            <div className="max-h-[40vh] overflow-y-auto pr-6">
              <dl className="w-full space-y-1">
                {specEntries.map(([key, value]) => (
                  <SpecItem key={key} specKey={key} specValue={value} />
                ))}
              </dl>
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
