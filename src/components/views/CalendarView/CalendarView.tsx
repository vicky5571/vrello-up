"use client";

import { useState, useEffect } from "react";
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
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { matchesFilters } from "@/lib/tasks/filterTasks";

export function CalendarView() {
  const {
    tasks,
    activeListId,
    activeSpaceId,
    workspaces,
    activeWorkspaceId,
    filters,
    setSelectedTaskId,
    setActiveView,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = currentSpace?.statuses || [];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMarketing, setShowMarketing] = useState(true);
  const [marketingItems, setMarketingItems] = useState<
    { id: string; title: string; date: string; icon: string; view: "events" | "mous" }[]
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/marcom/events").then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/marcom/mous").then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([eventsRes, mousRes]) => {
        const items: { id: string; title: string; date: string; icon: string; view: "events" | "mous" }[] = [];
        (eventsRes.data || []).forEach((e: { id: string; name: string; date?: string; endDate?: string; postPlatform?: string }) => {
          const d = e.date ? format(new Date(e.date), "yyyy-MM-dd") : null;
          const endD = e.endDate ? format(new Date(e.endDate), "yyyy-MM-dd") : null;
          const icon = e.postPlatform
            ? e.postPlatform === "instagram" ? "📸"
            : e.postPlatform === "tiktok" ? "🎵"
            : e.postPlatform === "youtube" ? "▶️"
            : "📱"
            : "🎪";
          if (d) items.push({ id: e.id, title: e.name, date: d, icon, view: "events" });
          if (endD && endD !== d) items.push({ id: `${e.id}-end`, title: `End: ${e.name}`, date: endD, icon, view: "events" });
        });
        (mousRes.data || []).forEach((m: { id: string; partnerName: string; endDate?: string }) => {
          const d = m.endDate ? format(new Date(m.endDate), "yyyy-MM-dd") : null;
          if (d) items.push({ id: m.id, title: `MOU: ${m.partnerName}`, date: d, icon: "📜", view: "mous" });
        });
        setMarketingItems(items);
      })
      .catch(() => {});
  }, []);

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

    return matchesFilters(task, filters, statuses);
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => setShowMarketing(!showMarketing)}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 border",
              showMarketing
                ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 hover:bg-pink-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
            )}
            title="Toggle marketing campaigns, events & MOU deadlines"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Marketing Dates</span>
            {marketingItems.length > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-pink-500/20 text-pink-700 dark:text-pink-300">
                {marketingItems.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 pb-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
        className="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800/80 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 min-h-0"
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

          const dayMarketing = showMarketing
            ? marketingItems.filter((item) => item.date === dayDateStr)
            : [];
          const totalItems = dayTasks.length + dayMarketing.length;

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
                      ? "bg-[#0073ea] text-white font-bold"
                      : "text-slate-700 dark:text-slate-300",
                  )}
                >
                  {format(day, "d")}
                </span>
                {totalItems > 0 && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </span>
                )}
              </div>

              {/* Tasks & Marketing for the Day */}
              <div className="space-y-1 mt-1 overflow-y-auto flex-1 min-h-0">
                {dayMarketing.map((item) => (
                  <div
                    key={`${item.view}-${item.id}`}
                    onClick={() => setActiveView(item.view)}
                    className="p-1 rounded-md text-[11px] font-semibold truncate cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-2xs bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/30"
                    title={`${item.title} (Open in ${item.view === "events" ? "Campaigns & Content" : "MOUs"})`}
                  >
                    <span className="text-[10px] shrink-0">{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
                {dayTasks.map((task) => {
                  const status = statuses.find((s) => s.id === task.statusId);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-1 rounded-md text-[11px] font-semibold truncate cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-2xs"
                      style={{
                        backgroundColor: `${status?.color || "#0073ea"}15`,
                        color: status?.color || "#0073ea",
                        border: `1px solid ${status?.color || "#0073ea"}30`,
                      }}
                      title={task.title}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: status?.color || "#0073ea" }}
                      />
                      {task.postPlatform && (
                        <span
                          className="text-[10px] shrink-0"
                          title={`Scheduled on ${task.postPlatform}`}
                        >
                          {task.postPlatform === "instagram" && "📸"}
                          {task.postPlatform === "tiktok" && "🎵"}
                          {task.postPlatform === "youtube" && "▶️"}
                          {task.postPlatform === "linkedin" && "💼"}
                          {task.postPlatform === "facebook" && "👥"}
                          {task.postPlatform === "press" && "📰"}
                        </span>
                      )}
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
