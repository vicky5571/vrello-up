"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Check, Sparkles, CalendarDays, MapPin } from "lucide-react";
import type { MarcomWorkItem, ProjectsColumn, MarcomWorkItemType } from "@/types";
import { ProjectsWorkItemCard } from "./ProjectsWorkItemCard";
import { DropLineIndicator } from "./DropLineIndicator";
import { cn } from "@/lib/utils";

interface ProjectsBoardColumnProps {
  column: ProjectsColumn;
  items: MarcomWorkItem[];
  onSelect?: (item: MarcomWorkItem) => void;
  dropIndicator?: {
    itemKey: string | null;
    position: "before" | "after" | "bottom";
  } | null;
  selectedKeys?: Set<string>;
  onToggleSelect?: (key: string) => void;
  onToggleSelectAll?: (column: ProjectsColumn) => void;
  onMoveToColumn?: (item: MarcomWorkItem, column: ProjectsColumn) => void;
  onQuickCreate?: (
    type: MarcomWorkItemType,
    column: ProjectsColumn,
    title: string,
  ) => Promise<void> | void;
  density?: "compact" | "default" | "relaxed";
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
  dropIndicator,
  selectedKeys = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  onMoveToColumn,
  onQuickCreate,
  density = "default",
}: ProjectsBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedType, setSelectedType] = useState<MarcomWorkItemType>(() => {
    if (column === "Upcoming") return "event";
    if (column === "To Do") return "placement";
    return "content";
  });

  const colors = COLUMN_COLORS[column] || COLUMN_COLORS["To Do"];
  const allInColumnSelected =
    items.length > 0 && items.every((i) => selectedKeys.has(`${i._type}:${i.id}`));

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !onQuickCreate) return;
    await onQuickCreate(selectedType, column, newTitle.trim());
    setNewTitle("");
    setIsAdding(false);
  };

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
          {/* Select All Checkbox for Column */}
          {items.length > 0 && onToggleSelectAll && (
            <button
              type="button"
              role="checkbox"
              aria-checked={allInColumnSelected}
              onClick={() => onToggleSelectAll(column)}
              className={cn(
                "w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center cursor-pointer",
                allInColumnSelected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-800",
              )}
              title={allInColumnSelected ? "Deselect column" : "Select column"}
            >
              {allInColumnSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </button>
          )}

          <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {column}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono",
              colors.countBadge,
            )}
          >
            {items.length}
          </span>

          {/* Quick Add Button */}
          {onQuickCreate && (
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Quick-add card"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Quick Create Form */}
      {isAdding && (
        <form onSubmit={handleQuickSubmit} className="mb-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
          {/* Type Picker */}
          <div className="flex items-center gap-1">
            {(["content", "event", "placement"] as const).map((t) => {
              const Icon = t === "content" ? Sparkles : t === "event" ? CalendarDays : MapPin;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold capitalize border cursor-pointer",
                    selectedType === t
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <Icon className="w-2.5 h-2.5" />
                  <span>{t}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            autoFocus
            placeholder={`Enter ${selectedType} title...`}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          />

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewTitle("");
              }}
              className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-2.5 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-semibold cursor-pointer"
            >
              Add Card
            </button>
          </div>
        </form>
      )}

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
        <SortableContext
          items={items.map((i) => `${i._type}:${i.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => {
            const key = `${item._type}:${item.id}`;
            const isIndicatorTarget = dropIndicator?.itemKey === key;

            return (
              <div key={key}>
                {isIndicatorTarget && dropIndicator.position === "before" && (
                  <DropLineIndicator position="before" />
                )}
                <ProjectsWorkItemCard
                  item={item}
                  onSelect={onSelect}
                  selected={selectedKeys.has(key)}
                  onToggleSelect={onToggleSelect}
                  onMoveToColumn={onMoveToColumn}
                  density={density}
                />
                {isIndicatorTarget && dropIndicator.position === "after" && (
                  <DropLineIndicator position="after" />
                )}
              </div>
            );
          })}
        </SortableContext>

        {dropIndicator?.position === "bottom" && (
          <DropLineIndicator position="bottom" />
        )}

        {items.length === 0 && !isAdding && (
          <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}
