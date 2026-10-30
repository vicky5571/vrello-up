"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  LayoutGrid,
  TableProperties,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/components/ui/BrandIcons";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { PLATFORM_CONFIG } from "./contentConstants";
import type { PostPlatform } from "@/types";

export interface ContentPlannerHeaderProps {
  totalPosts: number;
  kpiItems: KpiCardItem[];
  selectedPlatform: PostPlatform | "all";
  onSelectPlatform: (platform: PostPlatform | "all") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: "cards" | "table";
  onViewModeChange: (mode: "cards" | "table") => void;
  isLoading: boolean;
  onRefresh: () => void;
  onSchedulePost: () => void;
}

export function ContentPlannerHeader({
  totalPosts,
  kpiItems,
  selectedPlatform,
  onSelectPlatform,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isLoading,
  onRefresh,
  onSchedulePost,
}: ContentPlannerHeaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* Row 1: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <span>Content Planner</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {totalPosts} {totalPosts === 1 ? "post" : "posts"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Social media calendar, video formats, copywriting, and digital asset pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Data"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={cn("w-4 h-4", isLoading && "animate-spin text-pink-500")}
            />
          </button>

          <button
            type="button"
            onClick={onSchedulePost}
            className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Row 2: KPI Summary Cards */}
      <KpiSummaryCards items={kpiItems} />

      {/* Row 3: Platform Pills, Search & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        {/* Platform Pills */}
        <div
          role="tablist"
          aria-label="Filter by platform"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
        >
          <motion.button
            type="button"
            role="tab"
            aria-selected={selectedPlatform === "all"}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => onSelectPlatform("all")}
            className={cn(
              "relative px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              selectedPlatform === "all"
                ? "text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {selectedPlatform === "all" && (
              <motion.div
                layoutId="activeContentPlannerPlatformPill"
                className="absolute inset-0 bg-slate-900 dark:bg-white rounded-xl shadow-xs"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 450, damping: 35 }
                }
              />
            )}
            <span className="relative z-10">All Platforms</span>
          </motion.button>
          {(Object.keys(PLATFORM_CONFIG) as PostPlatform[]).map((p) => {
            const isSelected = selectedPlatform === p;
            return (
              <motion.button
                type="button"
                role="tab"
                aria-selected={isSelected}
                key={p}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => onSelectPlatform(p)}
                className={cn(
                  "relative px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeContentPlannerPlatformPill"
                    className="absolute inset-0 bg-pink-500 rounded-xl shadow-xs shadow-pink-500/20"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 450, damping: 35 }
                    }
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                  <span>{PLATFORM_CONFIG[p].label}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-pink-500 w-36 sm:w-48"
            />
          </div>

          {/* View Modes Switcher */}
          <div
            role="tablist"
            aria-label="View Mode Switcher"
            className="relative flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 select-none"
          >
            <motion.button
              type="button"
              role="tab"
              aria-selected={viewMode === "cards"}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => onViewModeChange("cards")}
              className={cn(
                "relative p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold",
                viewMode === "cards"
                  ? "text-pink-600 dark:text-pink-400"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Box / Cards View"
            >
              {viewMode === "cards" && (
                <motion.div
                  layoutId="activeContentPlannerViewPill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 450, damping: 35 }
                  }
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
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
                "relative p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold",
                viewMode === "table"
                  ? "text-pink-600 dark:text-pink-400"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Row / Table View"
            >
              {viewMode === "table" && (
                <motion.div
                  layoutId="activeContentPlannerViewPill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 450, damping: 35 }
                  }
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <TableProperties className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
