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
import { ProjectsDetailDrawerHost } from "./ProjectsDetailDrawerHost";

interface ProjectsCalendarViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsCalendarView({ onSelectItem }: ProjectsCalendarViewProps) {
  const [internalSelectedItem, setInternalSelectedItem] =
    useState<MarcomWorkItem | null>(null);
  const handleSelect = onSelectItem || setInternalSelectedItem;
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

  const numWeeks = Math.max(1, Math.ceil(days.length / 7));

  return (
    <div className="flex flex-col h-full min-h-0 p-4 space-y-3 select-none overflow-hidden">
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

      {/* Unified Calendar Card: Weekdays Header + Days Grid */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#151823] shadow-2xs overflow-hidden">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-white/10 text-center text-xs font-semibold py-2 shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
            <div key={w} className="text-slate-600 dark:text-slate-400">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div
          style={{ gridTemplateRows: `repeat(${numWeeks}, minmax(0, 1fr))` }}
          className="flex-1 grid grid-cols-7 gap-px bg-slate-200/70 dark:bg-slate-800/80 min-h-0 overflow-hidden"
        >
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            return (
              <CalendarDayCell
                key={dateStr}
                day={day}
                currentMonth={currentMonth}
                dayItems={itemsByDate.get(dateStr) || []}
                onSelectItem={handleSelect}
                onOpenCreate={setCreateDate}
                onOpenOverflow={setOverflowDate}
              />
            );
          })}
        </div>
      </div>

      {/* Overflow Modal Popover */}
      {overflowDate && (
        <CalendarOverflowPopover
          dateStr={overflowDate}
          items={itemsByDate.get(overflowDate) || []}
          onClose={() => setOverflowDate(null)}
          onSelectItem={handleSelect}
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

      {/* Domain Detail Drawer Host */}
      {!onSelectItem && (
        <ProjectsDetailDrawerHost
          selectedItem={internalSelectedItem}
          onClose={() => setInternalSelectedItem(null)}
        />
      )}
    </div>
  );
}
