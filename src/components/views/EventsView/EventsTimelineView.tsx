"use client";

import { useState, useMemo } from "react";
import {
  format,
  addDays,
  subDays,
  isToday,
  startOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Building2,
  Tag,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { FieldEventItem } from "@/types";
import {
  type EventConflictDetail,
  calculateTimelineBarMetrics,
} from "@/lib/tasks/eventTaskSync";

const STATUS_BAR_COLORS: Record<string, { bar: string; text: string; border: string }> = {
  UPCOMING: {
    bar: "bg-blue-500/80 hover:bg-blue-600",
    text: "text-white",
    border: "border-blue-600",
  },
  ON_PROGRESS: {
    bar: "bg-amber-500/80 hover:bg-amber-600",
    text: "text-white",
    border: "border-amber-600",
  },
  COMPLETED: {
    bar: "bg-emerald-500/80 hover:bg-emerald-600",
    text: "text-white",
    border: "border-emerald-600",
  },
  CANCELLED: {
    bar: "bg-rose-500/80 hover:bg-rose-600",
    text: "text-white",
    border: "border-rose-600",
  },
};

interface EventsTimelineViewProps {
  events: FieldEventItem[];
  conflicts: Map<string, EventConflictDetail>;
  onSelectEvent: (event: FieldEventItem) => void;
}

export function EventsTimelineView({
  events,
  conflicts,
  onSelectEvent,
}: EventsTimelineViewProps) {
  // Start window: beginning of current week - 3 days
  const [windowStart, setWindowStart] = useState<Date>(() =>
    subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 2)
  );
  const [groupBy, setGroupBy] = useState<"branch" | "type">("branch");
  const [daysCount, setDaysCount] = useState<number>(21); // 3 weeks view

  const dayColumns = useMemo(() => {
    return Array.from({ length: daysCount }).map((_, idx) => addDays(windowStart, idx));
  }, [windowStart, daysCount]);

  const windowEnd = dayColumns[dayColumns.length - 1];

  const prevRange = () => setWindowStart((prev) => subDays(prev, 7));
  const nextRange = () => setWindowStart((prev) => addDays(prev, 7));
  const goToToday = () => setWindowStart(subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 2));

  // Group events by branch or type
  const groups = useMemo(() => {
    const map = new Map<string, FieldEventItem[]>();

    for (const e of events) {
      const key =
        groupBy === "branch"
          ? e.branchName?.trim() || "Main Branch"
          : e.eventType?.trim() || "General Event";

      const list = map.get(key) || [];
      list.push(e);
      map.set(key, list);
    }

    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      events: items.sort((a, b) => {
        const da = (a.startDate || a.date) || "";
        const db = (b.startDate || b.date) || "";
        return da.localeCompare(db);
      }),
    }));
  }, [events, groupBy]);

  // Viewport conflict counters
  const viewportConflicts = useMemo(() => {
    let sameBranch = 0;
    let crossBranch = 0;
    for (const e of events) {
      const detail = conflicts.get(e.id);
      if (!detail) continue;
      const rawStart = (e.startDate || e.date)?.slice(0, 10);
      const rawEnd = (e.endDate || e.startDate || e.date)?.slice(0, 10) || rawStart;
      if (!rawStart || !rawEnd) continue;
      const sObj = new Date(`${rawStart}T00:00:00`);
      const eObj = new Date(`${rawEnd}T00:00:00`);
      if (eObj >= windowStart && sObj <= windowEnd) {
        if (detail.hasSameBranchConflict) sameBranch++;
        if (detail.hasCrossBranchConflict) crossBranch++;
      }
    }
    return { sameBranch, crossBranch };
  }, [events, conflicts, windowStart, windowEnd]);

  const colWidth = 44; // px per day column

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {format(windowStart, "d MMM yyyy")} – {format(windowEnd, "d MMM yyyy")}
            </h2>
          </div>

          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Today
          </button>

          {viewportConflicts.sameBranch > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{viewportConflicts.sameBranch} Branch Conflicts</span>
            </span>
          )}

          {viewportConflicts.crossBranch > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <span className="text-xs">🌐</span>
              <span>{viewportConflicts.crossBranch} Overlapping Activations</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Grouping Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
            <button
              type="button"
              onClick={() => setGroupBy("branch")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                groupBy === "branch"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Building2 className="w-3 h-3" />
              By Branch
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("type")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                groupBy === "type"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Tag className="w-3 h-3" />
              By Type
            </button>
          </div>

          {/* Days count range selector */}
          <select
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value))}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value={14}>2 Weeks (14 Days)</option>
            <option value={21}>3 Weeks (21 Days)</option>
            <option value={35}>5 Weeks (35 Days)</option>
          </select>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevRange}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="1 week earlier"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextRange}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="1 week later"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Timeline Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Timeline Header Row */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-20">
              {/* Group Name Column Header */}
              <div className="w-56 p-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/90 dark:bg-slate-900/90 sticky left-0 z-30">
                {groupBy === "branch" ? "Branch / City" : "Activation Type"}
              </div>

              {/* Day Headers */}
              <div className="flex">
                {dayColumns.map((day) => {
                  const today = isToday(day);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={day.toISOString()}
                      style={{ width: colWidth }}
                      className={cn(
                        "py-2 flex flex-col items-center justify-center text-center border-r border-slate-100 dark:border-slate-800 shrink-0 transition-colors",
                        today
                          ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                          : isWeekend
                          ? "bg-slate-100/40 dark:bg-slate-950/20 text-slate-400"
                          : "text-slate-600 dark:text-slate-300"
                      )}
                    >
                      <span className="text-[10px] uppercase font-semibold">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold mt-0.5",
                          today &&
                            "w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body Rows */}
            {groups.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                Tidak ada event yang dapat ditampilkan di timeline.
              </div>
            ) : (
              groups.map((group) => {
                return (
                  <div
                    key={group.name}
                    className="flex border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors relative"
                  >
                    {/* Left Sticky Group Label */}
                    <div className="w-56 p-3 border-r border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky left-0 z-10 flex flex-col justify-center">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {group.name}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {group.events.length} aktivasi
                      </span>
                    </div>

                    {/* Timeline Canvas for this row */}
                    <div
                      className="relative flex shrink-0 py-2.5 items-center"
                      style={{ width: colWidth * dayColumns.length }}
                    >
                      {/* Grid background lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {dayColumns.map((day) => {
                          const today = isToday(day);
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                          return (
                            <div
                              key={day.toISOString()}
                              style={{ width: colWidth }}
                              className={cn(
                                "h-full border-r border-slate-100 dark:border-slate-800/60 shrink-0",
                                today
                                  ? "bg-blue-500/5 dark:bg-blue-500/10"
                                  : isWeekend
                                  ? "bg-slate-50/50 dark:bg-slate-950/20"
                                  : ""
                              )}
                            />
                          );
                        })}
                      </div>

                      {/* Event Duration Bars */}
                      {group.events.map((event) => {
                        const rawStart = (event.startDate || event.date)?.slice(0, 10);
                        if (!rawStart) return null;

                        const rawEnd =
                          (event.endDate || event.startDate || event.date)?.slice(0, 10) || rawStart;

                        const metrics = calculateTimelineBarMetrics({
                          startDate: rawStart,
                          endDate: rawEnd,
                          windowStart,
                          windowEnd,
                          colWidth,
                        });

                        if (!metrics.isVisible) {
                          return null;
                        }

                        const color =
                          STATUS_BAR_COLORS[event.status] || STATUS_BAR_COLORS.UPCOMING;
                        const eventConflict = conflicts.get(event.id);

                        return (
                          <div
                            key={event.id}
                            onClick={() => onSelectEvent(event)}
                            style={{
                              left: `${metrics.leftPx}px`,
                              width: `${metrics.barWidthPx}px`,
                            }}
                            className={cn(
                              "absolute h-8 rounded-lg px-2 flex items-center justify-between text-xs cursor-pointer shadow-xs transition-all hover:shadow-md hover:scale-[1.01] z-10 select-none",
                              metrics.startsBeforeWindow && "rounded-l-none border-l-2 border-l-white/70",
                              metrics.endsAfterWindow && "rounded-r-none border-r-2 border-r-white/70",
                              color.bar,
                              color.text,
                              eventConflict?.hasSameBranchConflict && "ring-2 ring-amber-400 animate-pulse",
                              eventConflict?.hasCrossBranchConflict && !eventConflict.hasSameBranchConflict && "ring-2 ring-indigo-300"
                            )}
                            title={`${event.name} (${formatDate(rawStart)} – ${formatDate(rawEnd)}) [${metrics.totalDurationDays}d duration${metrics.startsBeforeWindow || metrics.endsAfterWindow ? `, ${metrics.visibleDays}d visible` : ""}]${eventConflict ? ' | ' + eventConflict.message : ''}`}
                          >
                            <div className="flex items-center gap-1.5 truncate pr-1">
                              {metrics.startsBeforeWindow && (
                                <span className="text-[10px] font-bold opacity-80 shrink-0" title="Activation started before current visible window">◀</span>
                              )}
                              {eventConflict?.hasSameBranchConflict && (
                                <span title="Venue clash in this branch">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                                </span>
                              )}
                              {eventConflict?.hasCrossBranchConflict && !eventConflict.hasSameBranchConflict && (
                                <span className="text-[10px] shrink-0" title="Simultaneous cross-branch activation">🌐</span>
                              )}
                              <span className="font-semibold truncate text-[11px] leading-tight">
                                {event.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-mono px-1 rounded bg-black/20 text-white/90">
                                {metrics.totalDurationDays}d
                              </span>
                              {metrics.endsAfterWindow && (
                                <span className="text-[10px] font-bold opacity-80 shrink-0" title="Activation extends past current visible window">▶</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
