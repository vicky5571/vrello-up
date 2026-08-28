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
import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

interface BoardColumnProps {
  status: Status;
  allStatuses: Status[];
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
}

export function BoardColumn({
  status,
  allStatuses,
  tasks,
  onSelectTask,
  onMoveStatus,
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

  return (
    <div
      ref={setNodeRef}
      className="w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden"
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} size="sm" />
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAddingQuickTask(true)}
          title="Add task to column"
          className="p-1 rounded-md text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List (Droppable & Sortable) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[150px]">
        {/* Quick Add Form */}
        {isAddingQuickTask && (
          <form
            onSubmit={handleQuickAdd}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-teal-500 shadow-sm space-y-2"
          >
            <input
              type="text"
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAddingQuickTask(false)}
                className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 rounded-md hover:bg-teal-700"
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
}
