"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  RefreshCw,
  Download,
  Sparkles,
  Layers,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

interface ReportsHeaderProps {
  reportTab: "monthly" | "posm_quarterly";
  setReportTab: (tab: "monthly" | "posm_quarterly") => void;
  kpiCards: KpiCardItem[];
  isLoading: boolean;
  fetchReports: () => void;
  onOpenRangeExport: () => void;
  canManage: boolean;
  showCreateForm: boolean;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ReportsHeader({
  reportTab,
  setReportTab,
  kpiCards,
  isLoading,
  fetchReports,
  onOpenRangeExport,
  canManage,
  showCreateForm,
  setShowCreateForm,
}: ReportsHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  return (
    <div className="relative z-30 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* 1. Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Reports & Exports
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 rounded-md border border-orange-200/60 dark:border-orange-800/60">
              Executive Archive
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rekap eksekutif bulanan, evaluasi pencapaian aktivitas lapangan, dan ekspor data operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            title="Refresh reports"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          <button
            type="button"
            onClick={onOpenRangeExport}
            title="Ekspor Laporan PDF dalam rentang bulan"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Controls Row: Tab Switcher & Create Form Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div
          role="tablist"
          aria-label="Report Category Tabs"
          className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium"
        >
          <motion.button
            type="button"
            role="tab"
            aria-selected={reportTab === "monthly"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => setReportTab("monthly")}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer",
              reportTab === "monthly"
                ? "text-slate-900 dark:text-slate-100 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {reportTab === "monthly" && (
              <motion.div
                layoutId="activeReportsTabPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Laporan Bulanan</span>
            </span>
          </motion.button>
          <motion.button
            type="button"
            role="tab"
            aria-selected={reportTab === "posm_quarterly"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => setReportTab("posm_quarterly")}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer",
              reportTab === "posm_quarterly"
                ? "text-slate-900 dark:text-slate-100 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {reportTab === "posm_quarterly" && (
              <motion.div
                layoutId="activeReportsTabPill"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Rekap POSM Kuartalan</span>
            </span>
          </motion.button>
        </div>

        {canManage && reportTab === "monthly" && (
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer self-end sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreateForm ? "Tutup Form Laporan" : "Buat Laporan Bulanan"}</span>
          </button>
        )}
      </div>

      {/* 3. Embedded 4 KPI Cards (When on monthly tab) */}
      {reportTab === "monthly" && (
        <KpiSummaryCards
          items={kpiCards}
          isLoading={isLoading}
          skeletonCount={4}
        />
      )}
    </div>
  );
}
