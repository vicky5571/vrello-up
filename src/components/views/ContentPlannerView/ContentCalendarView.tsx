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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ContentPostItem } from "@/types";
import { PlatformIcon } from "@/components/ui/BrandIcons";
import { CONTENT_STATUS_CONFIG } from "@/lib/marcom/contentWorkflow";
import { cn } from "@/lib/utils";

interface ContentCalendarViewProps {
  posts: ContentPostItem[];
  onSelectPost: (post: ContentPostItem) => void;
  onAddPostAtDate?: (dateStr: string) => void;
}

export function ContentCalendarView({
  posts,
  onSelectPost,
  onAddPostAtDate,
}: ContentCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map posts by "yyyy-MM-dd"
  const postsByDate = useMemo(() => {
    const map = new Map<string, ContentPostItem[]>();
    for (const post of posts) {
      if (!post.publishDate) continue;
      const dateKey = post.publishDate.slice(0, 10);
      const list = map.get(dateKey) || [];
      list.push(post);
      map.set(dateKey, list);
    }
    return map;
  }, [posts]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121315] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-center py-2 text-xs font-semibold text-slate-500">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Month Days Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[110px] p-2 flex flex-col group relative transition-colors",
                !isCurrentMonth && "bg-slate-50/40 dark:bg-slate-900/20 text-slate-400 opacity-60",
                isCurrentDay && "bg-blue-50/20 dark:bg-blue-950/10"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isCurrentDay
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {format(day, "d")}
                </span>

                {onAddPostAtDate && (
                  <button
                    type="button"
                    onClick={() => onAddPostAtDate(dateKey)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title={`Schedule post for ${dateKey}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Chips */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[120px] scrollbar-none">
                {dayPosts.map((post) => {
                  const meta = CONTENT_STATUS_CONFIG[post.status] || {
                    color: "#64748B",
                  };
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => onSelectPost(post)}
                      className="w-full text-left px-1.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <PlatformIcon
                        platform={post.platform}
                        className="w-3 h-3 shrink-0"
                      />
                      <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                        {post.title}
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                        title={post.status}
                      />
                    </button>
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

