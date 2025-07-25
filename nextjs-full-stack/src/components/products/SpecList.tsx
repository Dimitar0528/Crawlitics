"use client";

import { useState } from "react";

interface SpecListProps {
  specs: Record<string, string | number | null>; 
  initial_limit?: number;
}

export const SpecList = ({ specs, initial_limit = 10 }: SpecListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const specEntries = Object.entries(specs).filter(
    ([, value]) => value !== null && value !== ""
  );

  const displayedSpecs = isExpanded
    ? specEntries
    : specEntries.slice(0, initial_limit);
  return (
    <div className="w-full">
      <div className="space-y-1">
        {displayedSpecs.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center gap-2 text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-medium text-slate-600 dark:text-slate-300 capitalize">
              {key.replace(/_/g, " ")}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
              {String(value)}
            </span>
          </div>
        ))}
      </div>

      {specEntries.length > initial_limit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-sm text-blue-700 dark:text-blue-300 font-semibold hover:underline cursor-pointer">
          {isExpanded
            ? "Show Less"
            : `Show ${specEntries.length - initial_limit} More...`}
        </button>
      )}
    </div>
  );
};
