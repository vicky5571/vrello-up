"use client";

import { useId } from "react";
import {
  Search,
  X,
  Building2,
  Layers,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineFilterBarProps } from "./pipelineTypes";
import { DEFAULT_PIPELINE_FILTERS } from "./pipelineTypes";

const TIER_OPTIONS = [
  { value: "ALL", label: "Semua Tier" },
  { value: "TIER_1", label: "Tier 1 (Prioritas)" },
  { value: "TIER_2", label: "Tier 2 (Reguler)" },
  { value: "TIER_3", label: "Tier 3 (Basic)" },
];

export function PipelineFilterBar({
  filters,
  onChange,
  branches,
  totalCount,
  filteredCount,
  bottleneckCount,
  isLoading = false,
  onReset,
}: PipelineFilterBarProps) {
  const searchId = useId();
  const branchId = useId();
  const tierId = useId();

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.branchId !== "ALL" ||
    filters.tier !== "ALL" ||
    filters.bottleneckOnly;

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onChange(DEFAULT_PIPELINE_FILTERS);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <label htmlFor={searchId} className="sr-only">
            Cari outlet, kode, kota, atau PIC
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id={searchId}
            type="text"
            value={filters.search}
            onChange={(e) =>
              onChange({
                ...filters,
                search: e.target.value,
              })
            }
            placeholder="Cari outlet, kode, kota, atau nama PIC..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  search: "",
                })
              }
              aria-label="Hapus kata kunci pencarian"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center & Right: Dropdowns + Bottleneck Quick Chip */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Branch Dropdown */}
          <div className="relative flex-1 sm:flex-none min-w-[140px]">
            <label htmlFor={branchId} className="sr-only">
              Filter Branch
            </label>
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <select
              id={branchId}
              value={filters.branchId}
              onChange={(e) =>
                onChange({
                  ...filters,
                  branchId: e.target.value,
                })
              }
              className="w-full pl-8 pr-7 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.code ? `(${b.code})` : ""}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Tier Dropdown */}
          <div className="relative flex-1 sm:flex-none min-w-[130px]">
            <label htmlFor={tierId} className="sr-only">
              Filter Tier
            </label>
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <select
              id={tierId}
              value={filters.tier}
              onChange={(e) =>
                onChange({
                  ...filters,
                  tier: e.target.value,
                })
              }
              className="w-full pl-8 pr-7 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors appearance-none cursor-pointer"
            >
              {TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Bottleneck Quick Toggle Chip */}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...filters,
                bottleneckOnly: !filters.bottleneckOnly,
              })
            }
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none",
              filters.bottleneckOnly
                ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-xs dark:bg-rose-600 dark:hover:bg-rose-700"
                : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            )}
            title="Tampilkan hanya outlet yang mengalami bottleneck pemasangan POSM"
          >
            <AlertTriangle
              className={cn(
                "w-3.5 h-3.5",
                filters.bottleneckOnly ? "text-white" : "text-rose-500 dark:text-rose-400"
              )}
            />
            <span className="whitespace-nowrap">Bottleneck</span>
            {bottleneckCount > 0 && (
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  filters.bottleneckOnly
                    ? "bg-white text-rose-600"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                )}
              >
                {bottleneckCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Sub-bar: Status and Reset */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Menampilkan{" "}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {isLoading ? "..." : filteredCount}
            </strong>{" "}
            dari {totalCount} outlet
          </span>
          {filters.bottleneckOnly && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              Filter: Hanya Bottleneck POSM
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>
    </div>
  );
}
