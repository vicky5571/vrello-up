"use client";

import { useState, useMemo } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentPostItem, PostPlatform } from "@/types";
import { PlatformIcon } from "@/components/ui/BrandIcons";
import { CONTENT_STATUS_CONFIG } from "@/lib/marcom/contentWorkflow";
import { PLATFORM_CONFIG } from "./contentConstants";
import { cn } from "@/lib/utils";

const COLUMN_WIDTH = 42; // px per day

interface ContentGanttViewProps {
  posts: ContentPostItem[];
  onSelectPost: (post: ContentPostItem) => void;
}

export function ContentGanttView({ posts, onSelectPost }: ContentGanttViewProps) {
  const [baseDate, setBaseDate] = useState(() => startOfWeek(new Date()));
  const totalDays = 35; // 5 weeks view

  const startDate = baseDate;
  const endDate = useMemo(() => addDays(startDate, totalDays - 1), [startDate, totalDays]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  const prevPeriod = () => setBaseDate((prev) => subDays(prev, 14));
  const nextPeriod = () => setBaseDate((prev) => addDays(prev, 14));
  const goToToday = () => setBaseDate(startOfWeek(new Date()));

  // Group posts by platform
  const groupedPosts = useMemo(() => {
    const map = new Map<PostPlatform, ContentPostItem[]>();
    for (const post of posts) {
      const list = map.get(post.platform) || [];
      list.push(post);
      map.set(post.platform, list);
    }
    return Array.from(map.entries());
  }, [posts]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121315] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Content Timeline ({format(startDate, "d MMM")} – {format(endDate, "d MMM yyyy")})
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
            onClick={prevPeriod}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Previous 2 Weeks"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextPeriod}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Next 2 Weeks"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Post Info */}
        <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
          <div className="h-10 px-3 flex items-center border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Content Post
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {groupedPosts.map(([platform, platformPosts]) => (
              <div key={platform}>
                {/* Platform Section Header */}
                <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-slate-800/60 flex items-center gap-2">
                  <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                    {PLATFORM_CONFIG[platform]?.label || platform} ({platformPosts.length})
                  </span>
                </div>

                {platformPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className="h-11 px-3 flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {post.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-500 shrink-0">
                      {post.format}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Timeline Grid */}
        <div className="flex-1 overflow-x-auto flex flex-col">
          {/* Day Headers */}
          <div className="flex h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            {days.map((day) => {
              const current = isToday(day);
              const weekend = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  style={{ width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
                  className={cn(
                    "flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 text-[10px]",
                    current && "bg-blue-50 dark:bg-blue-950/40 font-bold text-blue-600 dark:text-blue-400",
                    weekend && !current && "bg-slate-100/40 dark:bg-slate-800/30 text-slate-400"
                  )}
                >
                  <span className="text-[9px] uppercase">{format(day, "EEE")}</span>
                  <span>{format(day, "d")}</span>
                </div>
              );
            })}
          </div>

          {/* Timeline Rows */}
          <div className="flex-1 overflow-y-auto">
            {groupedPosts.map(([platform, platformPosts]) => (
              <div key={platform}>
                {/* Platform Spacer Bar */}
                <div
                  className="h-7 bg-slate-100/30 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/60"
                  style={{ width: `${days.length * COLUMN_WIDTH}px` }}
                />

                {platformPosts.map((post) => {
                  const meta = CONTENT_STATUS_CONFIG[post.status] || {
                    color: "#64748B",
                  };

                  let offsetDays = -1;
                  if (post.publishDate) {
                    try {
                      const postDate = parseISO(post.publishDate.slice(0, 10));
                      offsetDays = differenceInDays(postDate, startDate);
                    } catch {
                      offsetDays = -1;
                    }
                  }

                  const isVisible = offsetDays >= 0 && offsetDays < totalDays;

                  return (
                    <div
                      key={post.id}
                      className="h-11 relative border-b border-slate-100 dark:border-slate-800/60 flex items-center"
                      style={{ width: `${days.length * COLUMN_WIDTH}px` }}
                    >
                      {/* Grid Vertical Lines */}
                      {days.map((day, i) => (
                        <div
                          key={day.toISOString()}
                          style={{
                            left: `${i * COLUMN_WIDTH}px`,
                            width: `${COLUMN_WIDTH}px`,
                          }}
                          className={cn(
                            "absolute top-0 bottom-0 border-r border-slate-100 dark:border-slate-800/50 pointer-events-none",
                            isToday(day) && "bg-blue-50/20 dark:bg-blue-950/10",
                            isWeekend(day) && "bg-slate-50/40 dark:bg-slate-900/10"
                          )}
                        />
                      ))}

                      {/* Post Bar */}
                      {isVisible && (
                        <div
                          onClick={() => onSelectPost(post)}
                          style={{
                            left: `${offsetDays * COLUMN_WIDTH + 3}px`,
                            width: `${COLUMN_WIDTH * 2 - 6}px`,
                            backgroundColor: meta.color,
                          }}
                          className="absolute z-10 h-7 rounded-lg text-white px-2 flex items-center gap-1 cursor-pointer hover:brightness-110 shadow-xs transition-transform hover:scale-[1.02]"
                          title={`${post.title} — ${post.status}`}
                        >
                          <span className="text-[10px] font-bold truncate">
                            {post.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

