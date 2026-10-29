"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { MarcomWorkItem } from "@/types";
import { useProjectsCalendar } from "./useProjectsCalendar";
import { CalendarDayCell } from "./CalendarDayCell";
import {
  CalendarOverflowPopover,
  CalendarCreatePopover,
} from "./CalendarPopovers";

interface ProjectsCalendarViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsCalendarView({ onSelectItem }: ProjectsCalendarViewProps) {
  const {
    currentMonth,
    setCurrentMonth,
    days,
    itemsByDate,
    handleCreateType,
  } = useProjectsCalendar();

  const [overflowDate, setOverflowDate] = useState<string | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-4 space-y-3 select-none">
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
          return (
            <CalendarDayCell
              key={dateStr}
              day={day}
              currentMonth={currentMonth}
              dayItems={itemsByDate.get(dateStr) || []}
              onSelectItem={onSelectItem}
              onOpenCreate={setCreateDate}
              onOpenOverflow={setOverflowDate}
            />
          );
        })}
      </div>

      {/* Overflow Modal Popover */}
      {overflowDate && (
        <CalendarOverflowPopover
          dateStr={overflowDate}
          items={itemsByDate.get(overflowDate) || []}
          onClose={() => setOverflowDate(null)}
          onSelectItem={onSelectItem}
        />
      )}

      {/* Quick Create Popover */}
      {createDate && (
        <CalendarCreatePopover
          dateStr={createDate}
          onClose={() => setCreateDate(null)}
          onCreateType={handleCreateType}
        />
      )}
    </div>
  );
}
