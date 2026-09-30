"use client";

import { cn } from "@/lib/utils";

export interface AccessibleTableData {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
  /** WCAG 1.1.1 semantic fallback describing the chart data. */
  accessibleTable?: AccessibleTableData;
  children: React.ReactNode;
}

/**
 * Accessible chart container.
 *
 * `min-w-0` is mandatory for every CSS grid child that hosts an SVG chart:
 * without it the grid column refuses to shrink below the SVG's intrinsic
 * width, blowing out the document and triggering Recharts `width(-1)`
 * warnings. The hidden `<table>` provides a screen-reader data alternative.
 */
export function ChartCard({
  title,
  subtitle,
  action,
  className,
  accessibleTable,
  children,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs p-4 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="flex-1 min-h-0 w-full relative">{children}</div>

      {/* WCAG 1.1.1 Accessible Table Fallback for Screen Readers */}
      {accessibleTable && (
        <table className="sr-only">
          <caption>{accessibleTable.caption}</caption>
          <thead>
            <tr>
              {accessibleTable.headers.map((h, i) => (
                <th key={i} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accessibleTable.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
