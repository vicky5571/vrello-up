"use client";

import { format, isSameMonth, isToday } from "date-fns";
import { Sparkles, CalendarDays, MapPin } from "lucide-react";
import type { MarcomWorkItem } from "@/types";
import { getWorkItemTitle } from "@/lib/marcom/workItems";
import { getStatusChipStyle } from "./CalendarPopovers";
import { cn } from "@/lib/utils";

interface CalendarDayCellProps {
  day: Date;
  currentMonth: Date;
  dayItems: Array<{ item: MarcomWorkItem; isContinuation?: boolean }>;
  onSelectItem?: (item: MarcomWorkItem) => void;
  onOpenCreate: (dateStr: string) => void;
  onOpenOverflow: (dateStr: string) => void;
}

export function CalendarDayCell({
  day,
  currentMonth,
  dayItems,
  onSelectItem,
  onOpenCreate,
  onOpenOverflow,
}: CalendarDayCellProps) {
  const dateStr = format(day, "yyyy-MM-dd");
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isCurrentDay = isToday(day);
  const displayedItems = dayItems.slice(0, 3);
  const overflowCount = dayItems.length - 3;

  return (
    <div
      onDoubleClick={() => onOpenCreate(dateStr)}
      className={cn(
        "bg-white dark:bg-[#151823] p-1.5 flex flex-col min-h-0 overflow-hidden group cursor-pointer",
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

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreate(dateStr);
          }}
          className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer font-bold px-1"
          title={`Add to ${dateStr}`}
        >
          + Add
        </button>
      </div>

      {/* Chips (max 3) */}
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none pr-0.5">
        {displayedItems.map(({ item, isContinuation }) => {
          const title = getWorkItemTitle(item);
          const style = getStatusChipStyle(item.status);

          return (
            <div
              key={`${item._type}:${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem?.(item);
              }}
              style={style}
              title={`${title} • ${item.status}`}
              className="text-[10px] px-1.5 py-0.5 rounded-md border truncate cursor-pointer hover:opacity-85 transition-opacity font-medium flex items-center gap-1 leading-tight"
            >
              {item._type === "content" ? (
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
              ) : item._type === "event" ? (
                <CalendarDays className="w-2.5 h-2.5 shrink-0" />
              ) : (
                <MapPin className="w-2.5 h-2.5 shrink-0" />
              )}
              <span className="truncate">
                {isContinuation ? `↳ ${title}` : title}
              </span>
            </div>
          );
        })}

        {/* +N More Overflow Pill */}
        {overflowCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenOverflow(dateStr);
            }}
            className="w-full text-center py-0.5 text-[9px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer"
          >
            +{overflowCount} more
          </button>
        )}
      </div>
    </div>
  );
}

