"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Calendar, Sparkles, CalendarDays, MapPin } from "lucide-react";
import type { MarcomWorkItem } from "@/types";
import { getWorkItemTitle } from "@/lib/marcom/workItems";

interface GanttUnscheduledShelfProps {
  unscheduledItems: MarcomWorkItem[];
  onScheduleItem: (item: MarcomWorkItem, dateStr: string) => Promise<void>;
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function GanttUnscheduledShelf({
  unscheduledItems,
  onScheduleItem,
  onSelectItem,
}: GanttUnscheduledShelfProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [schedulingItem, setSchedulingItem] = useState<MarcomWorkItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  if (unscheduledItems.length === 0) return null;

  const handleConfirm = async () => {
    if (schedulingItem && selectedDate) {
      await onScheduleItem(schedulingItem, selectedDate);
      setSchedulingItem(null);
      setSelectedDate("");
    }
  };

  return (
    <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-b-xl text-xs">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          <span>Unscheduled Shelf</span>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {unscheduledItems.length}
          </span>
        </div>
        <span className="text-[11px] font-normal text-slate-500">
          Click an item to schedule onto timeline
        </span>
      </button>

      {/* Shelf Body */}
      {isOpen && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {unscheduledItems.map((item) => {
              const title = getWorkItemTitle(item);
              return (
                <div
                  key={`${item._type}:${item.id}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer shadow-2xs"
                  onClick={() => {
                    setSchedulingItem(item);
                    setSelectedDate(new Date().toISOString().slice(0, 10));
                  }}
                >
                  {item._type === "content" ? (
                    <Sparkles className="w-3 h-3 text-pink-500" />
                  ) : item._type === "event" ? (
                    <CalendarDays className="w-3 h-3 text-blue-500" />
                  ) : (
                    <MapPin className="w-3 h-3 text-emerald-500" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
                    {title}
                  </span>
                  <Calendar className="w-3 h-3 text-slate-400 ml-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduling mini-dialog */}
      {schedulingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl space-y-2.5">
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
              Schedule: {getWorkItemTitle(schedulingItem)}
            </div>
            <input
              type="date"
              autoFocus
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSchedulingItem(null)}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg font-semibold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

