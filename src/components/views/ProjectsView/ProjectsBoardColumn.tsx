"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { MarcomWorkItem, ProjectsColumn } from "@/types";
import { ProjectsWorkItemCard } from "./ProjectsWorkItemCard";
import { cn } from "@/lib/utils";

interface ProjectsBoardColumnProps {
  column: ProjectsColumn;
  items: MarcomWorkItem[];
  onSelect?: (item: MarcomWorkItem) => void;
}

const COLUMN_COLORS: Record<ProjectsColumn, { dot: string; countBadge: string }> = {
  Upcoming: {
    dot: "bg-blue-500",
    countBadge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  "To Do": {
    dot: "bg-slate-400",
    countBadge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  "In Progress": {
    dot: "bg-amber-500",
    countBadge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  Ready: {
    dot: "bg-purple-500",
    countBadge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
  Done: {
    dot: "bg-emerald-500",
    countBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  Blocked: {
    dot: "bg-rose-500",
    countBadge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  Cancelled: {
    dot: "bg-slate-500",
    countBadge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  Archived: {
    dot: "bg-zinc-400",
    countBadge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

export function ProjectsBoardColumn({
  column,
  items,
  onSelect,
}: ProjectsBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  });

  const colors = COLUMN_COLORS[column] || COLUMN_COLORS["To Do"];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col shrink-0 w-72 rounded-2xl bg-slate-50/60 dark:bg-[#151823]/70 border border-slate-200/70 dark:border-slate-800/80 p-2.5 transition-colors max-h-full",
        isOver && "ring-2 ring-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 py-1 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {column}
          </h3>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono",
            colors.countBadge,
          )}
        >
          {items.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
        <SortableContext
          items={items.map((i) => `${i._type}:${i.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <ProjectsWorkItemCard
              key={`${item._type}:${item.id}`}
              item={item}
              onSelect={onSelect}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}

