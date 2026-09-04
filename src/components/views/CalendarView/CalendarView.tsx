"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarView() {
  const {
    tasks,
    activeListId,
    activeSpaceId,
    workspaces,
    activeWorkspaceId,
    filters,
    setSelectedTaskId,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = currentSpace?.statuses || [];

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekCount = Math.ceil(days.length / 7);

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    if (activeListId && task.listId !== activeListId) return false;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(q);
      const matchesDesc = task.description.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc) return false;
    }

    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(task.priority)
    ) {
      return false;
    }

    if (
      filters.statusIds.length > 0 &&
      !filters.statusIds.includes(task.statusId)
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 pb-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid (dynamically sized to match actual number of weeks: 4, 5, or 6) */}
      <div
        style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
        className="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-0"
      >
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);
          const dayDateStr = format(day, "yyyy-MM-dd");

          const dayTasks = filteredTasks.filter((task) => {
            if (!task.dueDate) return false;
            const taskDateStr = task.dueDate.includes("T")
              ? format(new Date(task.dueDate), "yyyy-MM-dd")
              : task.dueDate;
            return taskDateStr === dayDateStr;
          });

          return (
            <div
              key={idx}
              className={cn(
                "bg-white dark:bg-slate-900 p-2 flex flex-col justify-between overflow-hidden transition-colors min-h-0",
                !isCurrentMonth &&
                  "bg-slate-50/50 dark:bg-slate-950/40 text-slate-400",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full",
                    isCurrentDay
                      ? "bg-teal-600 text-white font-bold"
                      : "text-slate-700 dark:text-slate-300",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                  </span>
                )}
              </div>

              {/* Tasks for the Day */}
              <div className="space-y-1 mt-1 overflow-y-auto flex-1 min-h-0">
                {dayTasks.map((task) => {
                  const status = statuses.find((s) => s.id === task.statusId);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-1 rounded-md text-[11px] font-semibold truncate cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-2xs"
                      style={{
                        backgroundColor: `${status?.color || "#0D9488"}20`,
                        color: status?.color || "#0D9488",
                        border: `1px solid ${status?.color || "#0D9488"}40`,
                      }}
                      title={task.title}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: status?.color || "#0D9488" }}
                      />
                      <span className="truncate">{task.title}</span>
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
