"use client";

import { Flag, Plus, RefreshCw, LayoutGrid, TableProperties, Calendar, GanttChart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ActivityViewMode } from "./eventsConstants";

export interface EventsHeaderProps {
  totalEvents: number;
  viewMode: ActivityViewMode;
  onViewModeChange: (mode: ActivityViewMode) => void;
  isLoading: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAddEvent: () => void;
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
}: EventsHeaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
            <Flag className="w-4 h-4" />
          </div>
          <span>Field Events</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {totalEvents} {totalEvents === 1 ? "event" : "events"}
          </span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage on-ground activations, mall roadshows, venue logistics, budgets in IDR, and event footage.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        {/* View Switcher with Sliding Active Pill */}
        <div
          role="tablist"
          aria-label="Field event view modes"
          className="relative flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900 select-none"
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
                  "relative p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                  isActive
                    ? "text-slate-900 dark:text-slate-100 font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
                title={opt.title}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFieldEventsViewPill"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-md shadow-xs border border-slate-200/80 dark:border-slate-700/80"
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

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Field Events"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-blue-600")} />
        </button>

        {/* Primary Action Button */}
        {canManage && (
          <button
            type="button"
            onClick={onAddEvent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Field Event</span>
          </button>
        )}
      </div>
    </div>
  );
}
