"use client";

import { useMemo } from "react";
import { Filter, RotateCcw, MapPin, Calendar } from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn } from "@/lib/utils";
import type { AnalyticsFilterState } from "@/lib/marcom/analyticsFilterHelpers";

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  onFilterChange: (next: AnalyticsFilterState) => void;
  onReset: () => void;
}

const QUARTERS = [
  { label: "Semua Kuartal", value: "ALL" },
  { label: "Q1 (Jan–Mar)", value: "Q1" },
  { label: "Q2 (Apr–Jun)", value: "Q2" },
  { label: "Q3 (Jul–Sep)", value: "Q3" },
  { label: "Q4 (Okt–Des)", value: "Q4" },
];

const BRANDS = [
  { label: "Semua Brand", value: "ALL", color: "" },
  { label: "IM3", value: "IM3", color: "bg-amber-500" },
  { label: "3 (Tri)", value: "TRI", color: "bg-rose-500" },
];

export function AnalyticsFilterBar({
  filters,
  onFilterChange,
  onReset,
}: AnalyticsFilterBarProps) {
  const branches = useMarcomDataStore((state) => state.branches);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.branchId !== "ALL") count++;
    if (filters.brand !== "ALL") count++;
    if (filters.quarter !== "ALL") count++;
    return count;
  }, [filters]);

  const selectClass =
    "text-xs font-medium pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#18191B] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>Filter:</span>
        </div>

        {/* 1. Branch Selector */}
        <div className="relative inline-flex items-center">
          <MapPin className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.branchId}
            onChange={(e) =>
              onFilterChange({ ...filters, branchId: e.target.value })
            }
            aria-label="Filter Wilayah Branch"
            className={selectClass}
          >
            <option value="ALL">Semua Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Quarter Selector */}
        <div className="relative inline-flex items-center">
          <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.quarter}
            onChange={(e) =>
              onFilterChange({ ...filters, quarter: e.target.value })
            }
            aria-label="Filter Periode Kuartal"
            className={selectClass}
          >
            {QUARTERS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Brand Toggle Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          {BRANDS.map((b) => {
            const isSelected = filters.brand === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => onFilterChange({ ...filters, brand: b.value })}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {b.color && (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      b.color,
                      !isSelected && "opacity-60"
                    )}
                  />
                )}
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
}
