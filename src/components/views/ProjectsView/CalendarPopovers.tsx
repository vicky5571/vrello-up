"use client";

import { useEffect, useRef } from "react";
import { Sparkles, CalendarDays, MapPin, X } from "lucide-react";
import type { MarcomWorkItem, MarcomWorkItemType } from "@/types";
import { getWorkItemTitle } from "@/lib/marcom/workItems";

export const STATUS_HEX_COLORS: Record<string, string> = {
  // Content
  DRAFT: "#64748B",
  IN_REVIEW: "#F59E0B",
  REVISION: "#EF4444",
  APPROVED: "#10B981",
  SCHEDULED: "#3B82F6",
  PUBLISHED: "#7B68EE",
  ARCHIVED: "#64748B",
  // Event
  UPCOMING: "#3B82F6",
  ON_PROGRESS: "#F59E0B",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  // Placement
  NOT_STARTED: "#64748B",
  DONE: "#10B981",
  ISSUE: "#EF4444",
};

export function getStatusChipStyle(status: string) {
  const hex = STATUS_HEX_COLORS[status] || "#64748B";
  return {
    backgroundColor: `${hex}26`, // 15% opacity (~26 in hex)
    borderColor: `${hex}4D`, // 30% opacity (~4D in hex)
    color: hex,
  };
}

interface CalendarOverflowPopoverProps {
  dateStr: string;
  items: Array<{ item: MarcomWorkItem; isContinuation?: boolean }>;
  onClose: () => void;
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function CalendarOverflowPopover({
  dateStr,
  items,
  onClose,
  onSelectItem,
}: CalendarOverflowPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4">
      <div
        ref={popoverRef}
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Work Items on {dateStr}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {items.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {items.map(({ item, isContinuation }) => {
            const title = getWorkItemTitle(item);
            const style = getStatusChipStyle(item.status);
            return (
              <div
                key={`${item._type}:${item.id}`}
                onClick={() => {
                  onClose();
                  onSelectItem?.(item);
                }}
                style={style}
                className="p-2 rounded-xl border text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {item._type === "content" ? (
                    <Sparkles className="w-3 h-3 shrink-0" />
                  ) : item._type === "event" ? (
                    <CalendarDays className="w-3 h-3 shrink-0" />
                  ) : (
                    <MapPin className="w-3 h-3 shrink-0" />
                  )}
                  <span className="truncate">
                    {isContinuation ? `↳ ${title}` : title}
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase shrink-0 font-bold">
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CalendarCreatePopoverProps {
  dateStr: string;
  onClose: () => void;
  onCreateType: (type: MarcomWorkItemType, dateStr: string) => void;
}

export function CalendarCreatePopover({
  dateStr,
  onClose,
  onCreateType,
}: CalendarCreatePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-2xs p-4">
      <div
        ref={popoverRef}
        className="w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 space-y-2.5 text-xs"
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Create for {dateStr}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateType("content", dateStr);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-semibold cursor-pointer text-left transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ New Content Post</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateType("event", dateStr);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer text-left transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>+ New Field Event</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateType("placement", dateStr);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold cursor-pointer text-left transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>+ New Placement</span>
          </button>
        </div>
      </div>
    </div>
  );
}

