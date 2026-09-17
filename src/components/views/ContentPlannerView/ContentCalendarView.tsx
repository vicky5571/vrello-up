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
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Sparkles,
  Layers,
  Play,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentPostItem, PostPlatform } from "@/types";
import { PlatformIcon } from "@/components/ui/BrandIcons";
import { getContentStatusMeta } from "@/lib/marcom/contentWorkflow";

interface ContentCalendarViewProps {
  posts: ContentPostItem[];
  onSelectPost: (post: ContentPostItem) => void;
  onAddPostForDate: (dateString: string) => void;
  canManage?: boolean;
}

export function ContentCalendarView({
  posts,
  onSelectPost,
  onAddPostForDate,
  canManage = false,
}: ContentCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (!post.publishDate) return false;
      if (platformFilter !== "all" && post.platform !== platformFilter) return false;
      if (statusFilter !== "all" && post.status !== statusFilter) return false;
      return true;
    });
  }, [posts, platformFilter, statusFilter]);

  // Group posts by YYYY-MM-DD
  const postsByDate = useMemo(() => {
    const map = new Map<string, ContentPostItem[]>();
    for (const post of filteredPosts) {
      if (!post.publishDate) continue;
      const dStr = post.publishDate.slice(0, 10);
      const list = map.get(dStr) || [];
      list.push(post);
      map.set(dStr, list);
    }
    return map;
  }, [filteredPosts]);

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-purple-600" />
            <span>{format(currentMonth, "MMMM yyyy")}</span>
          </h2>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            aria-label="Filter Platform"
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">Semua Platform</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">X (Twitter)</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter Status Approval"
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="REVISION">Perlu Revisi</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Month Days Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-850/50 py-2.5">
          <div>Senin</div>
          <div>Selasa</div>
          <div>Rabu</div>
          <div>Kamis</div>
          <div>Jumat</div>
          <div className="text-pink-600 dark:text-pink-400">Sabtu</div>
          <div className="text-red-600 dark:text-red-400">Minggu</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDate.get(dateStr) || [];
            const isCurrMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={dateStr}
                className={cn(
                  "group relative min-h-[120px] p-2 transition-colors flex flex-col justify-between",
                  !isCurrMonth && "bg-slate-50/40 dark:bg-slate-950/40 opacity-45",
                  isCurrentDay && "bg-purple-50/30 dark:bg-purple-950/20",
                )}
              >
                {/* Date Number & Quick Add Button */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center",
                      isCurrentDay
                        ? "bg-purple-600 text-white font-bold shadow-xs"
                        : "text-slate-700 dark:text-slate-300",
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Add button on hover */}
                  <button
                    type="button"
                    onClick={() => onAddPostForDate(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all cursor-pointer"
                    title={`Jadwalkan postingan pada ${format(day, "d MMMM yyyy")}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Posts List */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[140px] pr-0.5 scrollbar-none">
                  {dayPosts.slice(0, 3).map((post) => {
                    const statusMeta = getContentStatusMeta(post.status);
                    return (
                      <button
                        type="button"
                        key={post.id}
                        onClick={() => onSelectPost(post)}
                        className="w-full text-left p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-750 bg-white/95 dark:bg-slate-800/90 hover:border-purple-400 dark:hover:border-purple-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="shrink-0">
                          <PlatformIcon
                            platform={post.platform as PostPlatform}
                            className="w-3 h-3"
                          />
                        </span>
                        <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate flex-1 leading-tight">
                          {post.title}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: statusMeta.color }}
                          title={`Status: ${statusMeta.label}`}
                        />
                      </button>
                    );
                  })}

                  {dayPosts.length > 3 && (
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold px-1.5 py-0.5">
                      +{dayPosts.length - 3} lainnya
                    </div>
                  )}
                </div>

                {/* Bottom Day Indicator */}
                <div className="text-right">
                  {dayPosts.length > 0 && (
                    <span className="text-[9px] font-bold text-slate-400">
                      {dayPosts.length} post
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
          Status Approval & Tayang:
        </div>
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">Draft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">In Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Revisi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Published</span>
          </div>
        </div>
      </div>
    </div>
  );
}
