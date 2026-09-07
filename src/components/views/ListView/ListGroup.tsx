"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { Task, Status, User } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  CircleDashed,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { toggleAssigneeId } from "@/lib/tasks/inlineEditing";
import { ListTaskRow } from "./ListTaskRow";

interface ListGroupProps {
  status: Status;
  allStatuses: Status[];
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
  selectedIds: string[];
  onToggleSelect: (taskId: string) => void;
  onToggleSelectAll: (taskIds: string[]) => void;
  customHeader?: {
    title: string;
    icon?: React.ReactNode;
    color?: string;
    bgClass?: string;
  };
}

export const ListGroup = memo(function ListGroup({
  status,
  allStatuses,
  tasks,
  onSelectTask,
  onMoveStatus,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  customHeader,
}: ListGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    activeListId,
    activeWorkspaceId,
    workspaces,
    createTask,
    updateTask,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const members = useMemo(
    () => currentWorkspace?.members || [],
    [currentWorkspace?.members],
  );

  useEffect(() => {
    if (isAddingTask) {
      inputRef.current?.focus();
    }
  }, [isAddingTask]);

  const handleAssigneeToggle = useCallback(
    (task: Task, userId: string) => {
      const selectedIds = toggleAssigneeId(
        task.assignees.map((user) => user.id),
        userId,
      );
      updateTask(task.id, {
        assignees: members.filter((user: User) => selectedIds.includes(user.id)),
      });
    },
    [members, updateTask],
  );

  const handleUpdateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      updateTask(taskId, updates);
    },
    [updateTask],
  );

  const handleCreateTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) {
      setIsAddingTask(false);
      return;
    }

    createTask({
      listId: activeListId,
      title: newTaskTitle.trim(),
      description: "",
      statusId: status.id,
      priority: "normal",
      assignees: [],
      tags: [],
      subtasks: [],
      orderIndex: tasks.length,
    });

    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  // Status icon based on category
  const getStatusIcon = (category: string) => {
    switch (category) {
      case "in_progress":
        return <Play className="w-2.5 h-2.5 fill-current" />;
      case "done":
      case "closed":
        return <Check className="w-2.5 h-2.5" />;
      case "review":
        return <Clock className="w-2.5 h-2.5" />;
      default:
        return <CircleDashed className="w-2.5 h-2.5" />;
    }
  };

  const isProgress = status.category === "in_progress";
  const isDone = status.category === "done" || status.category === "closed";

  const groupIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allGroupSelected =
    groupIds.length > 0 && groupIds.every((id) => selectedSet.has(id));

  return (
    <div className="mb-6 select-none">
      {/* Group Header */}
      <div className="flex items-center gap-2 py-1.5 px-2 group/header">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {customHeader ? (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all shadow-2xs",
              customHeader.bgClass ||
                "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700",
            )}
            style={
              customHeader.color
                ? {
                    borderLeftColor: customHeader.color,
                    borderLeftWidth: "3px",
                  }
                : undefined
            }
          >
            {customHeader.icon}
            <span>{customHeader.title}</span>
          </div>
        ) : (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all shadow-2xs",
              isProgress
                ? "bg-[#0073ea] text-white"
                : isDone
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700",
            )}
          >
            {getStatusIcon(status.category)}
            <span>{status.name}</span>
          </div>
        )}

        {/* Task count */}
        <span className="text-xs text-slate-400 font-medium ml-1">
          {tasks.length}
        </span>

        {/* Group batch select-all */}
        {tasks.length > 0 && (
          <button
            type="button"
            role="checkbox"
            aria-checked={allGroupSelected}
            aria-label={`Select all tasks in ${customHeader?.title ?? status.name}`}
            onClick={() => onToggleSelectAll(groupIds)}
            title={allGroupSelected ? "Deselect group" : "Select group for batch actions"}
            className={cn(
              "flex w-6 h-6 items-center justify-center rounded-md border text-[11px] text-white transition-all cursor-pointer ml-1",
              allGroupSelected
                ? "border-indigo-500 bg-indigo-500 opacity-100"
                : "border-slate-300 dark:border-slate-600 opacity-0 group-hover/header:opacity-100 max-md:opacity-100 focus-visible:opacity-100 hover:border-indigo-400",
            )}
          >
            {allGroupSelected && "✓"}
          </button>
        )}

        {/* Quick Add icon in group header */}
        <button
          onClick={() => {
            setIsExpanded(true);
            setIsAddingTask(true);
          }}
          title="Add task to status"
          className="opacity-0 group-hover/header:opacity-100 max-md:opacity-100 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity ml-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-1 border-t border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 rounded-lg overflow-hidden border">
          {/* Column Titles Bar */}
          <div className="grid grid-cols-[28px_1fr_110px_110px_90px_130px_90px_60px] items-center px-4 py-2 border-b border-slate-200/70 dark:border-slate-800/80 text-[11px] font-medium text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
            <div />
            <div>Name</div>
            <div>Assignee</div>
            <div>Due date</div>
            <div>Priority</div>
            <div>Status</div>
            <div>Comments</div>
            <div className="flex items-center gap-1 text-slate-400 cursor-pointer hover:text-slate-600">
              <Plus className="w-3 h-3" /> Add
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {tasks.map((task) => (
              <ListTaskRow
                key={task.id}
                task={task}
                status={status}
                allStatuses={allStatuses}
                members={members}
                onSelectTask={onSelectTask}
                onMoveStatus={onMoveStatus}
                onAssigneeToggle={handleAssigneeToggle}
                onUpdateTask={handleUpdateTask}
                selected={selectedSet.has(task.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}

            {/* Inline Add Task Input or Button */}
            {isAddingTask ? (
              <form
                onSubmit={handleCreateTask}
                className="flex items-center gap-2.5 px-4 py-2 bg-slate-50/70 dark:bg-slate-800/40"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAddingTask(false);
                      setNewTaskTitle("");
                    }
                  }}
                  onBlur={() => handleCreateTask()}
                  placeholder="Task name or type '/' for commands..."
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer text-left"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add task</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
