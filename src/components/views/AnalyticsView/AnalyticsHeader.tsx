"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  RefreshCw,
  Clock,
  Store,
  Users,
  Sparkles,
  Filter,
  MapPin,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { AnalyticsDashboardData } from "@/lib/marcom/analyticsEngine";
import type { AnalyticsFilterState } from "@/lib/marcom/analyticsFilterHelpers";
import type { ViewMode } from "@/types";

interface AnalyticsHeaderProps {
  filters: AnalyticsFilterState;
  onFilterChange: (next: AnalyticsFilterState) => void;
  onResetFilters: () => void;
  data: AnalyticsDashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (view: ViewMode) => void;
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

export function AnalyticsHeader({
  filters,
  onFilterChange,
  onResetFilters,
  data,
  isLoading,
  isRefreshing,
  onRefresh,
  onNavigate,
}: AnalyticsHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  const branches = useMarcomDataStore((state) => state.branches);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.branchId !== "ALL") count++;
    if (filters.brand !== "ALL") count++;
    if (filters.quarter !== "ALL") count++;
    return count;
  }, [filters]);


  const hasMouSampleData =
    data &&
    (data.mouSlaAndAging.submittedCount > 0 ||
      data.mouSlaAndAging.approvedOrDoneCount > 0);

  return (
    <div className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* 1. Title Row & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Operational Intelligence & ROI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Metrik operasional riil: SLA perizinan, unit economics POSM, reliabilitas konten & efisiensi event.
          </p>
        </div>

        <div className="flex items-center gap-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Segarkan Data Analitik"
          >
            <RefreshCw
              className={cn("w-4 h-4", (isLoading || isRefreshing) && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* 2. Integrated Filter Toolbar Row */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Row 1 on mobile: Symmetrical 50/50 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Filter:</span>
            </div>

            {/* Branch Selector */}
            <CustomDropdown
              value={filters.branchId}
              onChange={(val) => onFilterChange({ ...filters, branchId: val })}
              options={[
                { value: "ALL", label: "Semua Branch" },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
              ariaLabel="Filter Wilayah Branch"
              icon={MapPin}
              searchPlaceholder="Cari branch..."
              className="w-full sm:w-44 text-xs"
            />

            {/* Quarter Selector */}
            <CustomDropdown
              value={filters.quarter}
              onChange={(val) => onFilterChange({ ...filters, quarter: val })}
              options={QUARTERS}
              ariaLabel="Filter Periode Kuartal"
              icon={Calendar}
              className="w-full sm:w-36 text-xs"
            />
          </div>

          {/* Row 2 on mobile: Brand Toggle Pills + Reset Filters */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            {/* Brand Toggle Pills */}
            <div
              role="radiogroup"
              aria-label="Filter Brand"
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
            >
              {BRANDS.map((b) => {
                const isSelected = filters.brand === b.value;
                return (
                  <motion.button
                    key={b.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                    onClick={() => onFilterChange({ ...filters, brand: b.value })}
                    className={cn(
                      "relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "text-slate-900 dark:text-slate-100 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeAnalyticsBrandPill"
                        className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                        transition={pillTransition}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {b.color && (
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            b.color,
                            !isSelected && "opacity-60"
                          )}
                        />
                      )}
                      <span>{b.label}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Reset Button (Mobile right-aligned) */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer sm:hidden"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ({activeFilterCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Reset Button (Desktop) */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* 3. Embedded 4 KPI Cards (Responsive Horizontal Strip on Mobile) */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 scrollbar-none">
        {!data || isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs animate-pulse min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-2 h-6 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-2 h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))
        ) : (
          <>
            {/* Card 1: MOU SLA */}
            <button
              type="button"
              onClick={() => onNavigate("mous")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-left cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>SLA Persetujuan MOU</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {hasMouSampleData ? `${data.kpis.mouSla.avgSlaDays} Hari` : "—"}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span className="truncate">Rata-rata SLA aktif</span>
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  {data.kpis.mouSla.label}
                </span>
              </div>
            </button>

            {/* Card 2: POSM Deployment */}
            <button
              type="button"
              onClick={() => onNavigate("placements")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-left cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>POSM Deployment Rate</span>
                <Store className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {data.kpis.posmDeployment.rate}%
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span className="truncate">{data.kpis.posmDeployment.done}/{data.kpis.posmDeployment.total} terpasang</span>
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  {formatCompactIDR(data.kpis.posmDeployment.totalInvestment)}
                </span>
              </div>
            </button>

            {/* Card 3: Event Efficiency */}
            <button
              type="button"
              onClick={() => onNavigate("events")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-left cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 transition-colors min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Efisiensi Event</span>
                <Users className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                {data.kpis.eventEfficiency.totalAttendees > 0
                  ? `${formatCompactIDR(data.kpis.eventEfficiency.costPerAttendee)}/Org`
                  : "—"}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span className="truncate">Biaya per kepala</span>
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  {data.kpis.eventEfficiency.totalAttendees.toLocaleString("id-ID")} org
                </span>
              </div>
            </button>

            {/* Card 4: Content Cadence */}
            <button
              type="button"
              onClick={() => onNavigate("content-planner")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-left cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Reliabilitas Konten</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {data.contentMetrics.overallPublishedRate}%
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span className="truncate">{data.contentMetrics.publishedPosts}/{data.contentMetrics.totalPosts} tayang</span>
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  Cadence
                </span>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
