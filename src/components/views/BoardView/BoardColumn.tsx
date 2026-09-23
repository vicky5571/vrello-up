"use client";

import { Task, Status } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BoardCard } from "./BoardCard";
import { Plus, Check } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useState, memo } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { cn } from "@/lib/utils";

export interface BoardDropIndicator {
  taskId?: string | null;
  position?: "before" | "after" | "bottom";
}

export function DropLineIndicator({
  position = "before",
}: {
  position?: "before" | "after" | "center";
}) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 h-0 z-30 pointer-events-none flex items-center animate-in fade-in duration-100",
        position === "before" && "-top-1 -translate-y-1/2",
        position === "after" && "-bottom-1 translate-y-1/2",
        position === "center" && "top-1/2 -translate-y-1/2"
      )}
    >
      <div className="w-2.5 h-2.5 -ml-1 rounded-full border-2 border-blue-600 bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs shrink-0 z-10">
        <div className="w-0.5 h-0.5 rounded-full bg-blue-600" />
      </div>
      <div className="h-0.5 w-full bg-blue-600 -ml-0.5 rounded-full shadow-xs" />
    </div>
  );
}

interface BoardColumnProps {
  status: Status;
  allStatuses: Status[];
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
  selectedIds: string[];
  onToggleSelect: (taskId: string) => void;
  onToggleSelectAll: (taskIds: string[]) => void;
  dropIndicator?: BoardDropIndicator | null;
}

export const BoardColumn = memo(function BoardColumn({
  status,
  allStatuses,
  tasks,
  onSelectTask,
  onMoveStatus,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  dropIndicator,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: "Column",
      status,
    },
  });

  const activeListId = useWorkspaceStore((s) => s.activeListId);
  const createTask = useWorkspaceStore((s) => s.createTask);
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    createTask({
      listId: activeListId,
      title: quickTitle.trim(),
      description: "",
      statusId: status.id,
      priority: "normal",
      assignees: [],
      tags: [],
      subtasks: [],
      orderIndex: tasks.length,
    });

    setQuickTitle("");
    setIsAddingQuickTask(false);
  };

  const taskIds = tasks.map((t) => t.id);
  const selectedSet = new Set(selectedIds);
  const selectedInColumn = tasks.filter((t) => selectedSet.has(t.id)).length;
  const allColumnSelected = tasks.length > 0 && selectedInColumn === tasks.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-xl border overflow-hidden transition-[background-color,border-color,box-shadow] duration-150 ease-out contain-paint",
        isOver
          ? "bg-slate-200/90 dark:bg-slate-800/90 border-blue-400/80 dark:border-blue-500/80 shadow-md ring-2 ring-blue-500/20 dark:ring-blue-400/20"
          : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 shadow-2xs"
      )}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <button
              type="button"
              role="checkbox"
              aria-checked={allColumnSelected}
              aria-label={`Select all tasks in ${status.name}`}
              onClick={() => onToggleSelectAll(taskIds)}
              title={allColumnSelected ? "Deselect column" : "Select column for batch actions"}
              className={
                allColumnSelected
                  ? "flex w-6 h-6 items-center justify-center rounded-md border border-indigo-500 bg-indigo-500 text-[11px] text-white cursor-pointer"
                  : "flex w-6 h-6 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 text-white cursor-pointer hover:border-indigo-400 transition-colors"
              }
            >
              {allColumnSelected && <Check className="w-3.5 h-3.5" />}
            </button>
          )}
          <StatusBadge status={status} size="sm" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAddingQuickTask(true)}
          title="Add task to column"
          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List (Droppable & Sortable) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[150px]">
        {/* Quick Add Form */}
        {isAddingQuickTask && (
          <form
            onSubmit={handleQuickAdd}
            className="p-2.5 rounded-lg bg-white dark:bg-[#18191B] border border-slate-300 dark:border-slate-700 shadow-xs space-y-2"
          >
            <input
              type="text"
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAddingQuickTask(false)}
                className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] font-medium text-white bg-[#111318] hover:bg-black dark:bg-slate-100 dark:text-slate-950 rounded-md transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task, index) => {
            const isTarget = dropIndicator?.taskId === task.id;
            const isLastTask = index === tasks.length - 1;
            const showBefore = isTarget && dropIndicator?.position === "before";
            const showAfter =
              (isTarget && dropIndicator?.position === "after") ||
              (isLastTask && dropIndicator?.position === "bottom");

            return (
              <div key={task.id} className="relative">
                {showBefore && <DropLineIndicator position="before" />}
                <BoardCard
                  task={task}
                  statuses={allStatuses}
                  onSelect={onSelectTask}
                  onMoveStatus={onMoveStatus}
                  selected={selectedSet.has(task.id)}
                  onToggleSelect={onToggleSelect}
                />
                {showAfter && <DropLineIndicator position="after" />}
              </div>
            );
          })}
        </SortableContext>

        {tasks.length === 0 && !isAddingQuickTask && (
          <div
            className={cn(
              "relative h-20 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-xs font-medium transition-colors duration-150 p-2",
              isOver
                ? "border-blue-400/80 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
            )}
          >
            {isOver ? (
              <div className="relative w-full px-2 h-full flex items-center">
                <DropLineIndicator position="center" />
              </div>
            ) : (
              "No tasks yet"
            )}
          </div>
        )}
      </div>
    </div>
  );
});
