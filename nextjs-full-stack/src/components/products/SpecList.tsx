"use client"

export const SpecList = ({ specs }: { specs: Record<string, string> }) => (
  <div className="space-y-2">
    {Object.entries(specs).map(([key, value]) => (
      <div
        key={key}
        className="flex justify-between items-center gap-2 text-sm border-b-1 pb-1">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {key.toUpperCase()}
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
          {String(value)}
        </span>
      </div>
    ))}
  </div>
);