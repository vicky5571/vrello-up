"use client";

import { CalendarDays, Plus, RefreshCw, LayoutGrid, TableProperties, Calendar, GanttChart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import type { ActivityViewMode } from "./eventsConstants";

export interface EventsHeaderProps {
  totalEvents: number;
  viewMode: ActivityViewMode;
  onViewModeChange: (mode: ActivityViewMode) => void;
  isLoading: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAddEvent: () => void;
  kpiItems?: KpiCardItem[];
}

const VIEW_OPTIONS: Array<{
  id: ActivityViewMode;
  label: string;
  icon: typeof LayoutGrid;
  title: string;
}> = [
  { id: "cards", label: "Cards", icon: LayoutGrid, title: "Cards Grid View" },
  { id: "table", label: "Table", icon: TableProperties, title: "Table View" },
  { id: "calendar", label: "Calendar", icon: Calendar, title: "Calendar Month View" },
  { id: "timeline", label: "Timeline", icon: GanttChart, title: "Timeline (Gantt) View" },
];

export function EventsHeader({
  totalEvents,
  viewMode,
  onViewModeChange,
  isLoading,
  onRefresh,
  canManage,
  onAddEvent,
  kpiItems,
}: EventsHeaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
      {/* Row 1: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <span>Field Events</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {totalEvents} {totalEvents === 1 ? "event" : "events"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage on-ground activations, mall roadshows, venue logistics, budgets in IDR, and event footage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Field Events"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-blue-600")} />
          </button>

          {/* Primary Action Button */}
          {canManage && (
            <button
              type="button"
              onClick={onAddEvent}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Field Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: KPI Summary Cards */}
      {kpiItems && kpiItems.length > 0 && (
        <KpiSummaryCards items={kpiItems} />
      )}

      {/* Row 3: View Switcher */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div
          role="tablist"
          aria-label="Field event view modes"
          className="relative flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800 select-none"
        >
          {VIEW_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = viewMode === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewModeChange(opt.id)}
                className={cn(
                  "relative px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                  isActive
                    ? "text-slate-900 dark:text-slate-100 font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
                title={opt.title}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFieldEventsViewPill"
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 450, damping: 35 }
                    }
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
