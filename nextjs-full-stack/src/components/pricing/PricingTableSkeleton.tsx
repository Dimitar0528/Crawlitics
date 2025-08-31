export default function PricingTableSkeleton(){
    return (
      <section id="pricing" className="w-full py-4 animate-pulse">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Plan Skeleton */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6">
              <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-14 w-1/3 bg-slate-300 dark:bg-slate-600 rounded-md"></div>
              <div className="space-y-3 pt-4">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              </div>
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg mt-6"></div>
            </div>

            {/* Pro Plan Skeleton */}
            <div className="rounded-2xl border-2 border-purple-500 dark:border-purple-600 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6 relative">
              <div className="absolute -top-4 right-40 h-8 w-28 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
              <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-14 w-1/3 bg-slate-300 dark:bg-slate-600 rounded-md"></div>
              <div className="space-y-3 pt-4">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              </div>
              <div className="h-12 w-full bg-purple-500/80 dark:bg-purple-600/80 rounded-lg mt-6"></div>
            </div>
          </div>
        </div>
      </section>
    );
}