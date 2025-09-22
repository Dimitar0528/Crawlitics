export default function SideFilter({
  availableSpecs,
  selectedFilters,
  toggleFilterValue,
  clearAllFilters,
  loading, 
}: {
  availableSpecs: Record<string, string[]>;
  selectedFilters: Record<string, string[]>;
  toggleFilterValue: (key: string, value: string) => void;
  clearAllFilters: () => void;
  loading: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-3 px-4 pt-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Филтри
        </h3>
        <button
          onClick={clearAllFilters}
          disabled={loading}
          className="relative inline-flex items-center justify-center px-3 py-1 text-sm cursor-pointer text-white bg-gradient-to-r from-purple-600 to-sky-600 rounded-full shadow-md hover:from-purple-500 hover:to-sky-500 active:scale-95 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
          Изчисти
        </button>
      </div>
      <div className="overflow-auto px-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 border-b border-slate-200 dark:border-slate-700 pb-4 last:border-b-0">
                <div className="h-4 w-1/2 rounded-md bg-slate-200 dark:bg-slate-700"></div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700"></div>
                      <div className="h-4 w-3/4 rounded-md bg-slate-200 dark:bg-slate-700"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(availableSpecs).length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
            Няма налични филтри
          </p>
        ) : (
          Object.entries(availableSpecs).map(([key, values]) => (
            <div
              key={key}
              className="mb-4 border-b border-slate-200 dark:border-slate-700 pb-4 last:border-b-0 last:pb-0 capitalize">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                {key.replace(/_/g, " ")}
              </h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
                {values.map((val) => {
                  const checked = (selectedFilters[key] || []).includes(val);
                  return (
                    <label
                      key={val}
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFilterValue(key, val)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="truncate">{val}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
