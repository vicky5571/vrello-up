"use client";

import { format, isToday, isWeekend } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { MarcomWorkItem } from "@/types";
import { getWorkItemTitle } from "@/lib/marcom/workItems";
import { useProjectsGantt, type GanttZoomLevel } from "./useProjectsGantt";
import { GanttBar } from "./GanttBar";
import { GanttUnscheduledShelf } from "./GanttUnscheduledShelf";
import { cn } from "@/lib/utils";

interface ProjectsGanttViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsGanttView({ onSelectItem }: ProjectsGanttViewProps) {
  const {
    zoom,
    setZoom,
    isSidebarOpen,
    setIsSidebarOpen,
    startDate,
    endDate,
    days,
    columnWidth,
    totalDays,
    groups,
    unscheduledItems,
    announcement,
    prevPeriod,
    nextPeriod,
    goToToday,
    getItemBar,
    handleStartDrag,
    handlePointerUp,
    handleScheduleItem,
  } = useProjectsGantt();

  const sidebarWidth = isSidebarOpen ? 280 : 0;

  return (
    <div
      onPointerUp={handlePointerUp}
      className="flex flex-col h-[calc(100vh-3.5rem)] p-4 space-y-3 select-none"
    >
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Gantt Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Zoom controls */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            {(["day", "week", "month"] as GanttZoomLevel[]).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize text-[11px]",
                  zoom === z
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Toggle sidebar */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer text-xs"
            title={isSidebarOpen ? "Hide tasks list" : "Show tasks list"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            )}
            <span>{isSidebarOpen ? "Hide Tasks" : "Show Tasks"}</span>
          </button>

          {/* Nav arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div className="flex-1 flex flex-col min-h-0 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#151823] overflow-hidden shadow-2xs">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div style={{ minWidth: sidebarWidth + totalDays * columnWidth }}>
            {/* Days Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
              {isSidebarOpen && (
                <div
                  style={{ width: sidebarWidth }}
                  className="shrink-0 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800"
                >
                  Work Item
                </div>
              )}
              <div className="flex">
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    style={{ width: columnWidth }}
                    className={cn(
                      "text-center py-1 text-[10px] shrink-0 border-r border-slate-100 dark:border-slate-800/60 font-mono",
                      isToday(d) && "bg-blue-500/10 text-blue-600 font-bold",
                      isWeekend(d) && "bg-slate-100/50 dark:bg-slate-800/30",
                    )}
                  >
                    <div className="text-[9px] text-slate-400">{format(d, "EEE")[0]}</div>
                    <div>{format(d, "d")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Groups and Rows */}
            {groups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.type}>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                    <GroupIcon className={cn("w-3.5 h-3.5", group.iconColor)} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {group.title} ({group.items.length})
                    </span>
                  </div>

                  {group.items.map((item) => {
                    const bar = getItemBar(item);
                    const title = getWorkItemTitle(item);

                    return (
                      <div
                        key={`${item._type}:${item.id}`}
                        className="flex border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group h-8 items-center"
                      >
                        {isSidebarOpen && (
                          <div
                            style={{ width: sidebarWidth }}
                            className="shrink-0 px-3 text-xs text-slate-800 dark:text-slate-200 truncate border-r border-slate-200 dark:border-slate-800"
                          >
                            {title}
                          </div>
                        )}
                        <div className="relative flex-1 h-full">
                          {bar && (
                            <GanttBar
                              item={item}
                              bar={bar}
                              onSelectItem={onSelectItem}
                              onStartDrag={handleStartDrag}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Unscheduled Shelf at bottom */}
        <GanttUnscheduledShelf
          unscheduledItems={unscheduledItems}
          onScheduleItem={handleScheduleItem}
          onSelectItem={onSelectItem}
        />
      </div>
    </div>
  );
}
