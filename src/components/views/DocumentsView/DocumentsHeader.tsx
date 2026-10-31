"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Files,
  RefreshCw,
  Plus,
  Search,
  X,
  LayoutGrid,
  TableProperties,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

interface DocumentsHeaderProps {
  documentCount: number;
  kpiCards: KpiCardItem[];
  isLoading: boolean;
  onRefresh: () => void;
  canUpload: boolean;
  onAddDocument: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryChips: { name: string; count: number }[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: "cards" | "table";
  onViewModeChange: (mode: "cards" | "table") => void;
}

export function DocumentsHeader({
  documentCount,
  kpiCards,
  isLoading,
  onRefresh,
  canUpload,
  onAddDocument,
  selectedCategory,
  onSelectCategory,
  categoryChips,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: DocumentsHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  return (
    <div className="relative z-20 p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* 1. Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Files className="w-5 h-5 text-teal-500" />
            Documents & Asset Library
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 rounded-md border border-teal-200/60 dark:border-teal-800/60">
              {documentCount} dokumen
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat repositori brand guidelines, SOP, materi master kreatif, dan kontrak Marcom.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh documents"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          {canUpload && (
            <button
              type="button"
              onClick={onAddDocument}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dokumen</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Controls Row: Category Filter Chips, Search, & View Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <motion.button
            type="button"
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            onClick={() => onSelectCategory("ALL")}
            className={cn(
              "relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5",
              selectedCategory === "ALL"
                ? "text-white"
                : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {selectedCategory === "ALL" && (
              <motion.div
                layoutId="activeDocumentsCategoryPill"
                className="absolute inset-0 bg-teal-600 rounded-lg shadow-2xs"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10">Semua Dokumen</span>
            <span
              className={cn(
                "relative z-10 px-1.5 py-0.2 rounded-full text-[10px]",
                selectedCategory === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}
            >
              {documentCount}
            </span>
          </motion.button>

          {categoryChips.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <motion.button
                key={cat.name}
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                onClick={() => onSelectCategory(cat.name)}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "text-white"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeDocumentsCategoryPill"
                    className="absolute inset-0 bg-teal-600 rounded-lg shadow-2xs"
                    transition={pillTransition}
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
                <span
                  className={cn(
                    "relative z-10 px-1.5 py-0.2 rounded-full text-[10px]",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  )}
                >
                  {cat.count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Right side: Search & View Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari dokumen, PIC, branch..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="View Mode Switcher"
            className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
          >
            <motion.button
              type="button"
              role="tab"
              aria-selected={viewMode === "cards"}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => onViewModeChange("cards")}
              className={cn(
                "relative px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold",
                viewMode === "cards"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Cards Grid View"
            >
              {viewMode === "cards" && (
                <motion.div
                  layoutId="activeDocumentsViewPill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                  transition={pillTransition}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cards</span>
              </span>
            </motion.button>
            <motion.button
              type="button"
              role="tab"
              aria-selected={viewMode === "table"}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => onViewModeChange("table")}
              className={cn(
                "relative px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold",
                viewMode === "table"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Table View"
            >
              {viewMode === "table" && (
                <motion.div
                  layoutId="activeDocumentsViewPill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                  transition={pillTransition}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <TableProperties className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3. Embedded 4 KPI Cards */}
      <KpiSummaryCards
        items={kpiCards}
        isLoading={isLoading}
        skeletonCount={4}
      />
    </div>
  );
}
