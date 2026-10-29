"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  addDays,
  subDays,
  differenceInDays,
  isToday,
  isWeekend,
  startOfWeek,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Sparkles, CalendarDays, MapPin } from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { MarcomWorkItem } from "@/types";
import { getWorkItemTitle, getWorkItemDate } from "@/lib/marcom/workItems";
import { cn } from "@/lib/utils";

const COLUMN_WIDTH = 40; // px per day

interface ProjectsGanttViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsGanttView({ onSelectItem }: ProjectsGanttViewProps) {
  const { posts, events, placements, fetchPosts, fetchEvents, fetchPlacements } = useMarcomDataStore();
  const [baseDate, setBaseDate] = useState(() => startOfWeek(new Date()));
  const totalDays = 35; // 5 weeks view

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      fetchPosts();
      fetchEvents();
      fetchPlacements();
    }
  }, [posts.length, events.length, placements.length, fetchPosts, fetchEvents, fetchPlacements]);

  const startDate = baseDate;
  const endDate = useMemo(() => addDays(startDate, totalDays - 1), [startDate, totalDays]);
  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const prevPeriod = () => setBaseDate((prev) => subDays(prev, 14));
  const nextPeriod = () => setBaseDate((prev) => addDays(prev, 14));
  const goToToday = () => setBaseDate(startOfWeek(new Date()));

  const groups = useMemo(() => [
    {
      type: "event" as const,
      title: "Field Events & Activations",
      icon: CalendarDays,
      iconColor: "text-blue-500",
      items: events
        .filter((e) => e.startDate || e.date)
        .map((e) => ({ ...e, _type: "event" as const })),
    },
    {
      type: "content" as const,
      title: "Social & Digital Content",
      icon: Sparkles,
      iconColor: "text-pink-500",
      items: posts
        .filter((p) => p.publishDate)
        .map((p) => ({ ...p, _type: "content" as const })),
    },
    {
      type: "placement" as const,
      title: "Physical Placements",
      icon: MapPin,
      iconColor: "text-emerald-500",
      items: placements
        .filter((p) => p.date)
        .map((p) => ({ ...p, _type: "placement" as const })),
    },
  ], [events, posts, placements]);

  const getItemBar = (item: MarcomWorkItem) => {
    try {
      let itemStart: Date;
      let durationDays = 1;

      if (item._type === "event") {
        const startStr = item.startDate || item.date;
        if (!startStr) return null;
        itemStart = parseISO(startStr);
        if (item.endDate) {
          const itemEnd = parseISO(item.endDate);
          durationDays = Math.max(1, differenceInDays(itemEnd, itemStart) + 1);
        }
      } else {
        const dateStr = getWorkItemDate(item);
        if (!dateStr) return null;
        itemStart = parseISO(dateStr);
      }

      const offsetDays = differenceInDays(itemStart, startDate);
      if (offsetDays + durationDays < 0 || offsetDays >= totalDays) return null;

      const left = Math.max(0, offsetDays) * COLUMN_WIDTH;
      const width = Math.max(COLUMN_WIDTH, durationDays * COLUMN_WIDTH - 4);

      return { left, width };
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-4 space-y-3">
      {/* Gantt Header */}
      <div className="flex items-center justify-between shrink-0">
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#151823]">
        <div style={{ minWidth: 260 + totalDays * COLUMN_WIDTH }}>
          {/* Days Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
            <div className="w-64 shrink-0 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
              Work Item
            </div>
            <div className="flex">
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  style={{ width: COLUMN_WIDTH }}
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
                  const barColors = {
                    content: "bg-pink-500/90 hover:bg-pink-600 text-white",
                    event: "bg-blue-500/90 hover:bg-blue-600 text-white",
                    placement: "bg-emerald-500/90 hover:bg-emerald-600 text-white",
                  }[item._type];

                  return (
                    <div
                      key={`${item._type}:${item.id}`}
                      className="flex border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group h-8 items-center"
                    >
                      <div className="w-64 shrink-0 px-3 text-xs text-slate-800 dark:text-slate-200 truncate border-r border-slate-200 dark:border-slate-800">
                        {title}
                      </div>
                      <div className="relative flex-1 h-full">
                        {bar && (
                          <div
                            onClick={() => onSelectItem?.(item)}
                            style={{ left: bar.left, width: bar.width }}
                            className={cn(
                              "absolute top-1.5 h-5 rounded-md px-2 text-[10px] font-semibold truncate flex items-center shadow-2xs cursor-pointer transition-all",
                              barColors,
                            )}
                            title={title}
                          >
                            <span className="truncate">{title}</span>
                          </div>
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
    </div>
  );
}

