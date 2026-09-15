"use client";

import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  Building2,
  Plus,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { FieldEventItem } from "@/types";
import type { EventConflictDetail } from "@/lib/tasks/eventTaskSync";

const EVENT_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  UPCOMING: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-900/60",
  },
  ON_PROGRESS: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900/60",
  },
  COMPLETED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900/60",
  },
  CANCELLED: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-900/60",
  },
};

interface EventsCalendarViewProps {
  events: FieldEventItem[];
  conflicts: Map<string, EventConflictDetail>;
  onSelectEvent: (event: FieldEventItem) => void;
  onOpenCreateModal?: (defaultDate?: string) => void;
}

export function EventsCalendarView({
  events,
  conflicts,
  onSelectEvent,
  onOpenCreateModal,
}: EventsCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, FieldEventItem[]>();

    for (const event of events) {
      const rawStart = (event.startDate || event.date)?.slice(0, 10);
      if (!rawStart) continue;

      const rawEnd = (event.endDate || event.startDate || event.date)?.slice(0, 10) || rawStart;
      const startMs = new Date(rawStart).getTime();
      const endMs = new Date(rawEnd).getTime();

      if (isNaN(startMs) || isNaN(endMs)) {
        const list = map.get(rawStart) || [];
        list.push(event);
        map.set(rawStart, list);
        continue;
      }

      // Populate every day in the interval
      let curr = new Date(rawStart);
      const endTarget = new Date(rawEnd);

      while (curr <= endTarget) {
        const dateKey = curr.toISOString().slice(0, 10);
        const list = map.get(dateKey) || [];
        if (!list.some((e) => e.id === event.id)) {
          list.push(event);
        }
        map.set(dateKey, list);
        curr.setDate(curr.getDate() + 1);
      }
    }

    return map;
  }, [events]);

  // Total active conflicts in current month
  const activeMonthConflicts = useMemo(() => {
    const conflictItems: { event: FieldEventItem; detail: EventConflictDetail }[] = [];
    for (const event of events) {
      const detail = conflicts.get(event.id);
      if (!detail) continue;
      const start = (event.startDate || event.date)?.slice(0, 10);
      if (start && start.startsWith(format(currentMonth, "yyyy-MM"))) {
        if (!conflictItems.some((ci) => ci.event.id === event.id)) {
          conflictItems.push({ event, detail });
        }
      }
    }
    return conflictItems;
  }, [events, conflicts, currentMonth]);

  const sameBranchMonthConflicts = useMemo(
    () => activeMonthConflicts.filter((c) => c.detail.hasSameBranchConflict),
    [activeMonthConflicts]
  );
  const crossBranchMonthConflicts = useMemo(
    () => activeMonthConflicts.filter((c) => c.detail.hasCrossBranchConflict),
    [activeMonthConflicts]
  );

  const weekDayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>

          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {sameBranchMonthConflicts.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>{sameBranchMonthConflicts.length} Branch Conflicts</span>
            </div>
          )}

          {crossBranchMonthConflicts.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              <span className="text-xs">🌐</span>
              <span>{crossBranchMonthConflicts.length} Cross-Branch Activations</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Warning Alert Banners if clashes exist */}
      {sameBranchMonthConflicts.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Schedule Conflict Alert: Same Branch Venue Clash</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Overlapping activations detected in the same branch. Review field crew and venue allocation:
          </p>
          <ul className="list-disc list-inside space-y-0.5 pt-1 text-[11px]">
            {sameBranchMonthConflicts.slice(0, 3).map(({ event, detail }) => (
              <li key={event.id} className="truncate">
                <strong>{event.name}</strong> ({event.branchName}) — {detail.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {crossBranchMonthConflicts.length > 0 && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-indigo-800 dark:text-indigo-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-base">🌐</span>
            <span>Simultaneous Cross-Branch Activations on Same Date</span>
          </div>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
            Multiple branches holding activations on overlapping dates. Ensure national Marcom coordination and asset logistics are aligned:
          </p>
          <ul className="list-disc list-inside space-y-0.5 pt-1 text-[11px]">
            {crossBranchMonthConflicts.slice(0, 3).map(({ event, detail }) => (
              <li key={event.id} className="truncate">
                <strong>{event.name}</strong> ({event.branchName}) — {detail.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Month Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-center">
          {weekDayLabels.map((lbl, idx) => (
            <div
              key={lbl}
              className={cn(
                "py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400",
                idx >= 5 && "text-rose-500 dark:text-rose-400"
              )}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
          {days.map((day) => {
            const dateKey = day.toISOString().slice(0, 10);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const dayIsToday = isToday(day);
            const dayEvents = eventsByDate.get(dateKey) || [];
            const uniqueBranches = Array.from(
              new Set(dayEvents.map((e) => e.branchName).filter(Boolean))
            );
            const hasSameBranchConflict = dayEvents.some(
              (e) => conflicts.get(e.id)?.hasSameBranchConflict
            );
            const hasCrossBranchConflict = uniqueBranches.length > 1;

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[110px] p-2 transition-colors flex flex-col justify-between group/cell",
                  !isCurrentMonth && "bg-slate-50/40 dark:bg-slate-950/20 text-slate-400",
                  hasSameBranchConflict && "bg-amber-50/40 dark:bg-amber-950/20",
                  !hasSameBranchConflict && hasCrossBranchConflict && "bg-indigo-50/20 dark:bg-indigo-950/10"
                )}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                      dayIsToday
                        ? "bg-blue-600 text-white font-bold"
                        : isCurrentMonth
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-600"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="flex items-center gap-1">
                    {hasSameBranchConflict && (
                      <span title="Venue/schedule clash in the same branch">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      </span>
                    )}

                    {hasCrossBranchConflict && (
                      <span
                        className="text-[9px] font-semibold px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50"
                        title={`${uniqueBranches.length} branches active simultaneously: ${uniqueBranches.join(", ")}`}
                      >
                        🌐 {uniqueBranches.length}
                      </span>
                    )}

                    {onOpenCreateModal && (
                      <button
                        type="button"
                        onClick={() => onOpenCreateModal(dateKey)}
                        className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity cursor-pointer"
                        title={`Add event on ${formatDate(dateKey)}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Day Events Stack */}
                <div className="space-y-1 overflow-y-auto max-h-24 pr-0.5">
                  {dayEvents.map((event) => {
                    const statusColor =
                      EVENT_STATUS_COLORS[event.status] || EVENT_STATUS_COLORS.UPCOMING;
                    const eventConflict = conflicts.get(event.id);
                    const isStart = (event.startDate || event.date)?.slice(0, 10) === dateKey;
                    const isEnd = (event.endDate || event.startDate || event.date)?.slice(0, 10) === dateKey;
                    const isMulti = Boolean(event.endDate && event.endDate !== (event.startDate || event.date));

                    return (
                      <div
                        key={`${event.id}-${dateKey}`}
                        onClick={() => onSelectEvent(event)}
                        className={cn(
                          "px-1.5 py-1 rounded text-[11px] border cursor-pointer transition-all hover:shadow-xs hover:scale-[1.01]",
                          statusColor.bg,
                          statusColor.text,
                          statusColor.border,
                          eventConflict?.hasSameBranchConflict && "ring-1 ring-amber-500/80",
                          eventConflict?.hasCrossBranchConflict && !eventConflict.hasSameBranchConflict && "ring-1 ring-indigo-500/50"
                        )}
                        title={`${event.name} (${event.branchName || "Main Branch"}) - ${eventConflict ? eventConflict.message : event.status}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold truncate leading-tight">
                            {eventConflict?.hasSameBranchConflict
                              ? "⚠️ "
                              : eventConflict?.hasCrossBranchConflict
                              ? "🌐 "
                              : ""}
                            {event.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[9px] opacity-80 mt-0.5 truncate">
                          <Building2 className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{event.branchName || "Branch"}</span>
                          {isMulti && (
                            <span className="font-mono text-[8px] px-1 rounded bg-black/5 dark:bg-white/10">
                              {isStart ? "Start" : isEnd ? "End" : "Day"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
