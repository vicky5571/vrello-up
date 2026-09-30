/**
 * Layout-preserving skeleton grid for the Analytics Hub.
 *
 * Mirrors the exact geometry of the loaded KPI row and 2×2 chart grid so the
 * page does not shift (0 CLS) when real data arrives.
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      {/* KPI Cards Skeleton (3-up, matches AnalyticsKpiRow) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 bg-slate-100 dark:bg-[#18191B] rounded-xl border border-slate-200/80 dark:border-slate-800 p-4"
          >
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-4 h-7 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton (2×2, matches chart cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-80 min-w-0 bg-slate-100 dark:bg-[#18191B] rounded-xl border border-slate-200/80 dark:border-slate-800 p-4"
          >
            <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-6 h-56 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
