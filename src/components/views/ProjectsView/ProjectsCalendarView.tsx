"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, CalendarDays, MapPin } from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { MarcomWorkItem } from "@/types";
import { getWorkItemTitle, getWorkItemDate } from "@/lib/marcom/workItems";
import { cn } from "@/lib/utils";

interface ProjectsCalendarViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsCalendarView({ onSelectItem }: ProjectsCalendarViewProps) {
  const { posts, events, placements, fetchPosts, fetchEvents, fetchPlacements } = useMarcomDataStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      fetchPosts();
      fetchEvents();
      fetchPlacements();
    }
  }, [posts.length, events.length, placements.length, fetchPosts, fetchEvents, fetchPlacements]);

  const allItems = useMemo<MarcomWorkItem[]>(() => [
    ...posts.map((p) => ({ ...p, _type: "content" as const })),
    ...events.map((e) => ({ ...e, _type: "event" as const })),
    ...placements.map((p) => ({ ...p, _type: "placement" as const })),
  ], [posts, events, placements]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd],
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, MarcomWorkItem[]>();
    for (const item of allItems) {
      const d = getWorkItemDate(item);
      if (!d) continue;
      const dateKey = d.slice(0, 10);
      const list = map.get(dateKey) || [];
      list.push(item);
      map.set(dateKey, list);
    }
    return map;
  }, [allItems]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-4 space-y-3">
      {/* Calendar Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 text-center text-xs font-semibold py-1.5 rounded-t-xl shrink-0">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} className="text-slate-500 dark:text-slate-400">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-b-xl overflow-hidden min-h-0">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDate.get(dateStr) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateStr}
              className={cn(
                "bg-white dark:bg-[#151823] p-1.5 flex flex-col min-h-0 overflow-hidden",
                !isCurrentMonth && "bg-slate-50/60 dark:bg-[#12141c]/50 text-slate-300 dark:text-slate-600",
              )}
            >
              <div className="flex items-center justify-between mb-1 shrink-0">
                <span
                  className={cn(
                    "text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono",
                    isCurrentDay
                      ? "bg-blue-600 text-white"
                      : isCurrentMonth
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-300 dark:text-slate-600",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[9px] font-bold px-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                    {dayItems.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none pr-0.5">
                {dayItems.map((item) => {
                  const title = getWorkItemTitle(item);
                  const badgeMap = {
                    content: "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-300/60",
                    event: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300/60",
                    placement: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60",
                  };
                  return (
                    <div
                      key={`${item._type}:${item.id}`}
                      onClick={() => onSelectItem?.(item)}
                      title={title}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity font-medium flex items-center gap-1",
                        badgeMap[item._type],
                      )}
                    >
                      <span className="truncate">{title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

