"use client";

import type { MarcomWorkItem } from "@/types";
import { getWorkItemTitle } from "@/lib/marcom/workItems";
import { cn } from "@/lib/utils";

export interface GanttDragState {
  item: MarcomWorkItem;
  type: "move" | "resize-start" | "resize-end" | "progress";
  startX: number;
  initialLeft: number;
  initialWidth: number;
  initialProgress?: number;
}

interface GanttBarProps {
  item: MarcomWorkItem;
  bar: { left: number; width: number };
  onSelectItem?: (item: MarcomWorkItem) => void;
  onStartDrag: (
    e: React.PointerEvent,
    item: MarcomWorkItem,
    type: GanttDragState["type"],
    left: number,
    width: number,
    progress?: number,
  ) => void;
}

export function GanttBar({
  item,
  bar,
  onSelectItem,
  onStartDrag,
}: GanttBarProps) {
  const title = getWorkItemTitle(item);
  const isEvent = item._type === "event";

  const eventProgress = isEvent ? (item as any).progress ?? 0 : 0;
  const contentProgress = (() => {
    if (item._type === "content" && item.subtasks && item.subtasks.length > 0) {
      const done = item.subtasks.filter((s) => s.completed).length;
      return Math.round((done / item.subtasks.length) * 100);
    }
    return 0;
  })();

  const progress = isEvent ? eventProgress : contentProgress;

  const barColors = {
    content: "bg-pink-500/90 hover:bg-pink-600 text-white border-pink-600",
    event: "bg-blue-500/90 hover:bg-blue-600 text-white border-blue-600",
    placement: "bg-emerald-500/90 hover:bg-emerald-600 text-white border-emerald-600",
  }[item._type];

  return (
    <div
      style={{ left: bar.left, width: bar.width }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        onStartDrag(e, item, "move", bar.left, bar.width, progress);
      }}
      className={cn(
        "group absolute top-1.5 h-5 rounded-md text-[10px] font-semibold flex items-center shadow-2xs select-none cursor-move transition-all overflow-hidden border",
        barColors,
      )}
      title={`${title} (${item.status})`}
    >
      {/* Progress fill */}
      {progress > 0 && (
        <div
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          className="absolute inset-y-0 left-0 bg-black/25 pointer-events-none"
        />
      )}

      {/* Left resize handle (FieldEvent only) */}
      {isEvent && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartDrag(e, item, "resize-start", bar.left, bar.width);
          }}
          className="absolute left-0 inset-y-0 w-2.5 hover:bg-white/40 cursor-ew-resize z-10 transition-colors"
          title="Drag to change start date"
        />
      )}

      {/* Bar Content */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectItem?.(item);
        }}
        className="relative z-0 px-2 truncate flex items-center gap-1.5 w-full cursor-pointer"
      >
        <span className="truncate">{title}</span>
        {progress > 0 && (
          <span className="text-[9px] opacity-80 font-mono">{progress}%</span>
        )}
      </div>

      {/* Progress drag handle (FieldEvent only) */}
      {isEvent && (
        <div
          style={{ left: `${Math.min(95, Math.max(5, progress))}%` }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartDrag(e, item, "progress", bar.left, bar.width, progress);
          }}
          className="opacity-0 group-hover:opacity-100 absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-xs cursor-ew-resize z-20 transition-opacity"
          title="Drag progress"
        />
      )}

      {/* Right resize handle (FieldEvent only) */}
      {isEvent && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartDrag(e, item, "resize-end", bar.left, bar.width);
          }}
          className="absolute right-0 inset-y-0 w-2.5 hover:bg-white/40 cursor-ew-resize z-10 transition-colors"
          title="Drag to change end date"
        />
      )}
    </div>
  );
}

