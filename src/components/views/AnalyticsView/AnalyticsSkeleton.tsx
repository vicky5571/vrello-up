/**
 * Layout-preserving skeleton grid for the Analytics Hub stage content.
 *
 * Mirrors the exact geometry of the actionable telemetry strip and 2×2 chart grid
 * so the stage does not shift (0 CLS) when real data arrives.
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      {/* Actionable Telemetry Strip Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-36 rounded bg-slate-100 dark:bg-slate-800/70" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton (2×2, matches chart cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-80 min-w-0 bg-white dark:bg-[#18191B] rounded-xl border border-slate-200/80 dark:border-slate-800 p-4"
          >
            <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-6 h-56 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
