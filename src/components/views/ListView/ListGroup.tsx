"use client";

import { useState, useRef, useEffect } from "react";
import { Task, Status, Priority } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  CircleDashed,
  Check,
  Clock,
  Circle,
  Calendar,
  Flag,
  User as UserIcon,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { toggleAssigneeId } from "@/lib/tasks/inlineEditing";
import { toast } from "sonner";

interface ListGroupProps {
  status: Status;
  allStatuses: Status[];
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
  customHeader?: {
    title: string;
    icon?: React.ReactNode;
    color?: string;
    bgClass?: string;
  };
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

export function ListGroup({
  status,
  allStatuses,
  tasks,
  onSelectTask,
  onMoveStatus,
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
  const [openEditor, setOpenEditor] = useState<{
    type: "priority" | "assignees";
    taskId: string;
  } | null>(null);

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const members = currentWorkspace?.members || [];

  useEffect(() => {
    if (isAddingTask) {
      inputRef.current?.focus();
    }
  }, [isAddingTask]);

  useEffect(() => {
    if (!openEditor) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const editor = target.closest("[data-inline-editor]");
      if (
        !editor ||
        editor.getAttribute("data-inline-editor") !== openEditor.taskId
      ) {
        setOpenEditor(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenEditor(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openEditor]);

  const handleAssigneeToggle = (task: Task, userId: string) => {
    const selectedIds = toggleAssigneeId(
      task.assignees.map((user) => user.id),
      userId,
    );
    updateTask(task.id, {
      assignees: members.filter((user) => selectedIds.includes(user.id)),
    });
  };

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

  // Priority color config
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-500 fill-red-500";
      case "high":
        return "text-amber-500 fill-amber-500";
      case "normal":
        return "text-blue-500 fill-blue-500";
      case "low":
        return "text-slate-400 fill-slate-400";
      default:
        return "text-slate-300";
    }
  };

  const isProgress = status.category === "in_progress";
  const isDone = status.category === "done" || status.category === "closed";

  return (
    <div className="mb-6 select-none">
      {/* Group Header */}
      <div className="flex items-center gap-2 py-1.5 px-2 group/header">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Pill (Status or Custom Group Header) */}
        {customHeader ? (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all shadow-2xs text-white",
              customHeader.bgClass || "bg-slate-700"
            )}
            style={customHeader.color ? { backgroundColor: customHeader.color } : undefined}
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

        {/* Quick Add icon in group header */}
        <button
          onClick={() => {
            setIsExpanded(true);
            setIsAddingTask(true);
          }}
          title="Add task to status"
          className="opacity-0 group-hover/header:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity ml-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-1 border-t border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 rounded-lg overflow-hidden border">
          {/* Column Titles Bar */}
          <div className="grid grid-cols-[1fr_110px_110px_90px_130px_90px_60px] items-center px-4 py-2 border-b border-slate-200/70 dark:border-slate-800/80 text-[11px] font-medium text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
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
            {tasks.map((task) => {
              const isTaskDone =
                status.category === "done" || status.category === "closed";

              const taskStatus =
                allStatuses.find(
                  (candidate) => candidate.id === task.statusId,
                ) || status;
              const taskIsProgress = taskStatus.category === "in_progress";
              const taskIsDone =
                taskStatus.category === "done" ||
                taskStatus.category === "closed";

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="grid grid-cols-[1fr_110px_110px_90px_130px_90px_60px] items-center px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs text-slate-700 dark:text-slate-300 cursor-pointer group/row"
                >
                  {/* Name Column */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-4">
                    {/* Status Toggle Dot */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Cycle to next status
                        const currentIndex = allStatuses.findIndex(
                          (s) => s.id === task.statusId,
                        );
                        const nextStatus =
                          allStatuses[(currentIndex + 1) % allStatuses.length];
                        if (nextStatus) {
                          onMoveStatus(task.id, nextStatus.id);
                        }
                      }}
                      title="Click to advance status"
                      className="shrink-0 p-0.5 rounded-full hover:scale-110 transition-transform cursor-pointer"
                    >
                      {isTaskDone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isProgress ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0073ea] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0073ea]" />
                        </div>
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                      )}
                    </button>

                    <span
                      className={cn(
                        "font-medium text-slate-800 dark:text-slate-200 truncate group-hover/row:text-[#0073ea] transition-colors",
                        isTaskDone &&
                          "line-through text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {task.title}
                    </span>

                    {task.subtasks.length > 0 && (
                      <span className="shrink-0 text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {task.subtasks.filter((s) => s.completed).length}/
                        {task.subtasks.length}
                      </span>
                    )}
                  </div>

                  {/* Assignee Column */}
                  <div
                    data-inline-editor={task.id}
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex items-center"
                  >
                    <button
                      type="button"
                      aria-label={`Edit assignees for ${task.title}`}
                      aria-haspopup="menu"
                      aria-expanded={
                        openEditor?.type === "assignees" &&
                        openEditor.taskId === task.id
                      }
                      onClick={() =>
                        setOpenEditor((current) =>
                          current?.type === "assignees" &&
                          current.taskId === task.id
                            ? null
                            : { type: "assignees", taskId: task.id },
                        )
                      }
                      className="flex items-center gap-1.5 rounded-md p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0073ea]"
                    >
                      {task.assignees.length > 0 ? (
                        <>
                          <div className="flex -space-x-1">
                            {task.assignees.slice(0, 2).map((user) => (
                              <UserAvatar key={user.id} user={user} size="sm" />
                            ))}
                          </div>
                          <span className="truncate text-slate-600 dark:text-slate-400 text-[11px]">
                            {task.assignees.length > 1
                              ? `+${task.assignees.length - 1}`
                              : task.assignees[0].name.split(" ")[0]}
                          </span>
                        </>
                      ) : (
                        <span className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors">
                          <UserIcon className="w-3 h-3" aria-hidden="true" />
                        </span>
                      )}
                    </button>

                    {openEditor?.type === "assignees" &&
                      openEditor.taskId === task.id && (
                        <div
                          role="menu"
                          aria-label={`Assignees for ${task.title}`}
                          className="absolute left-0 top-full z-30 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Assign members
                          </div>
                          {members.map((user) => {
                            const isAssigned = task.assignees.some(
                              (assignee) => assignee.id === user.id,
                            );
                            return (
                              <button
                                key={user.id}
                                type="button"
                                role="menuitemcheckbox"
                                aria-checked={isAssigned}
                                onClick={() =>
                                  handleAssigneeToggle(task, user.id)
                                }
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <UserAvatar user={user} size="xs" />
                                <span className="min-w-0 flex-1 truncate">
                                  {user.name}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "flex h-3.5 w-3.5 items-center justify-center rounded border text-[10px] text-white",
                                    isAssigned
                                      ? "border-[#0073ea] bg-[#0073ea]"
                                      : "border-slate-300 dark:border-slate-600",
                                  )}
                                >
                                  {isAssigned && "✓"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>

                  {/* Due Date Column */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center text-slate-500 dark:text-slate-400"
                  >
                    <label className="group/date flex cursor-pointer items-center gap-1 text-[11px]">
                      <Calendar
                        className="h-3.5 w-3.5 text-slate-400"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Due date for {task.title}</span>
                      <input
                        type="date"
                        aria-label={`Due date for ${task.title}`}
                        value={task.dueDate || ""}
                        onChange={(e) =>
                          updateTask(task.id, {
                            dueDate: e.target.value || undefined,
                          })
                        }
                        className="w-23 cursor-pointer rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[11px] text-slate-500 transition-colors hover:border-slate-200 focus:border-[#0073ea] focus:outline-hidden dark:text-slate-400 dark:hover:border-slate-700"
                      />
                    </label>
                  </div>

                  {/* Priority Column */}
                  <div
                    data-inline-editor={task.id}
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex items-center"
                  >
                    <button
                      type="button"
                      aria-label={`Change priority for ${task.title}`}
                      aria-haspopup="menu"
                      aria-expanded={
                        openEditor?.type === "priority" &&
                        openEditor.taskId === task.id
                      }
                      onClick={() =>
                        setOpenEditor((current) =>
                          current?.type === "priority" &&
                          current.taskId === task.id
                            ? null
                            : { type: "priority", taskId: task.id },
                        )
                      }
                      className="rounded-md p-1 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0073ea] dark:hover:bg-slate-800"
                    >
                      <Flag
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          getPriorityColor(task.priority),
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {openEditor?.type === "priority" &&
                      openEditor.taskId === task.id && (
                        <div
                          role="menu"
                          aria-label={`Priority for ${task.title}`}
                          className="absolute left-0 top-full z-30 mt-1 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                        >
                          {PRIORITY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              role="menuitemradio"
                              aria-checked={task.priority === option.value}
                              onClick={() => {
                                updateTask(task.id, { priority: option.value });
                                setOpenEditor(null);
                                toast.success("Priority updated");
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Flag
                                className={cn(
                                  "h-3.5 w-3.5",
                                  getPriorityColor(option.value),
                                )}
                                aria-hidden="true"
                              />
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Status Pill Dropdown */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center"
                  >
                    <select
                      value={task.statusId}
                      aria-label={`Status for ${task.title}`}
                      onChange={(e) => {
                        updateTask(task.id, { statusId: e.target.value });
                        toast.success("Status updated");
                      }}
                      className={cn(
                        "max-w-30 cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0073ea]",
                        taskIsProgress
                          ? "bg-[#0073ea] text-white"
                          : taskIsDone
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-300/80 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      )}
                      style={{
                        color:
                          taskIsProgress || taskIsDone
                            ? "white"
                            : taskStatus.color,
                      }}
                    >
                      {allStatuses.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Comments Column */}
                  <div className="flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>

                  {/* More Row Action */}
                  <div className="flex items-center justify-end pr-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task.id);
                      }}
                      className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

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
}
