"use client";

import { Task, Status } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BoardCard } from "./BoardCard";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useState, memo } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

interface BoardColumnProps {
  status: Status;
  allStatuses: Status[];
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
  selectedIds: string[];
  onToggleSelect: (taskId: string) => void;
  onToggleSelectAll: (taskIds: string[]) => void;
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
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status.id,
    data: {
      type: "Column",
      status,
    },
  });

  const { activeListId, createTask } = useWorkspaceStore();
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
      className="w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-lg bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 overflow-hidden"
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
              {allColumnSelected && "✓"}
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
          {tasks.map((task) => (
            <BoardCard
              key={task.id}
              task={task}
              statuses={allStatuses}
              onSelect={onSelectTask}
              onMoveStatus={onMoveStatus}
              selected={selectedSet.has(task.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAddingQuickTask && (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-medium">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
});
