"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Task, Status, Priority, User } from "@/types";
import {
  Check,
  Circle,
  Calendar,
  Flag,
  User as UserIcon,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { toast } from "sonner";


export interface ListTaskRowProps {
  task: Task;
  allStatuses: Status[];
  status: Status;
  members: User[];
  onSelectTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
  onAssigneeToggle: (task: Task, userId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  selected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

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

export const ListTaskRow = memo(function ListTaskRow({
  task,
  allStatuses,
  status,
  members,
  onSelectTask,
  onMoveStatus,
  onAssigneeToggle,
  onUpdateTask,
  selected = false,
  onToggleSelect,
}: ListTaskRowProps) {
  const [openEditor, setOpenEditor] = useState<"priority" | "assignees" | null>(
    null,
  );
  const editorRef = useRef<HTMLDivElement>(null);
  const { viewPreferences } = useWorkspaceStore();
  const { visibleFields } = viewPreferences;

  useEffect(() => {
    if (!openEditor) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (editorRef.current && !editorRef.current.contains(target)) {
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

  const isTaskDone =
    status.category === "done" || status.category === "closed";
  const taskStatus =
    allStatuses.find((candidate) => candidate.id === task.statusId) || status;
  const taskIsProgress = taskStatus.category === "in_progress";
  const taskIsDone =
    taskStatus.category === "done" || taskStatus.category === "closed";

  return (
    <div
      onClick={() => onSelectTask(task.id)}
      className={cn(
        "grid grid-cols-[28px_1fr_110px_110px_90px_130px_90px_60px] items-center px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs text-slate-700 dark:text-slate-300 cursor-pointer group/row",
        selected && "bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
        viewPreferences.density === "compact"
          ? "py-1"
          : viewPreferences.density === "relaxed"
            ? "py-4"
            : "py-2",
      )}
    >
      {/* Batch Select Checkbox */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        {onToggleSelect && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select task ${task.title}`}
            onClick={() => onToggleSelect(task.id)}
            title="Select for batch actions"
            className={cn(
              "flex w-6 h-6 items-center justify-center rounded-md border text-[11px] text-white transition-all cursor-pointer",
              selected
                ? "border-indigo-500 bg-indigo-500 opacity-100"
                : "border-slate-300 dark:border-slate-600 opacity-0 group-hover/row:opacity-100 max-md:opacity-100 focus-visible:opacity-100 hover:border-indigo-400",
            )}
          >
            {selected && "✓"}
          </button>
        )}
      </div>
      {/* Name Column */}
      <div className="flex items-center gap-2.5 min-w-0 pr-4">
        {/* Status Toggle Dot */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const currentIndex = allStatuses.findIndex(
              (s) => s.id === task.statusId,
            );
            const nextStatus =
              allStatuses[(currentIndex + 1) % allStatuses.length];
            if (nextStatus) {
              onMoveStatus(task.id, nextStatus.id);
            }
          }}
          aria-label={`Status for ${task.title}: ${taskStatus.name}. Activate to advance.`}
          title={`Status: ${taskStatus.name} — click to advance`}
          className="shrink-0 p-0.5 rounded-full hover:scale-110 transition-transform cursor-pointer"
        >
          {isTaskDone ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : taskIsProgress ? (
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
            isTaskDone && "line-through text-slate-400 dark:text-slate-500",
          )}
        >
          {task.title}
        </span>

        {task.postPlatform && (
          <PlatformBadge platform={task.postPlatform} format={task.postFormat} />
        )}


        {visibleFields.subtasks && task.subtasks.length > 0 && (
          <span className="shrink-0 text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
            {task.subtasks.filter((s) => s.completed).length}/
            {task.subtasks.length}
          </span>
        )}
      </div>

      {/* Assignee Column */}
      <div
        ref={openEditor === "assignees" ? editorRef : undefined}
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center"
      >
        {visibleFields.assignees && (
          <>
            <button
          type="button"
          aria-label={`Edit assignees for ${task.title}`}
          aria-haspopup="menu"
          aria-expanded={openEditor === "assignees"}
          onClick={() =>
            setOpenEditor((current) =>
              current === "assignees" ? null : "assignees",
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

        {openEditor === "assignees" && (
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
                  onClick={() => onAssigneeToggle(task, user.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <UserAvatar user={user} size="xs" />
                  <span className="min-w-0 flex-1 truncate">{user.name}</span>
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
          </>
        )}
      </div>

      {/* Due Date Column */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center text-slate-500 dark:text-slate-400"
      >
        {visibleFields.dueDate && (
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
              onUpdateTask(task.id, {
                dueDate: e.target.value || undefined,
              })
            }
            className="w-23 cursor-pointer rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[11px] text-slate-500 transition-colors hover:border-slate-200 focus:border-[#0073ea] focus:outline-hidden dark:text-slate-400 dark:hover:border-slate-700"
          />
        </label>
        )}
      </div>

      {/* Priority Column */}
      <div
        ref={openEditor === "priority" ? editorRef : undefined}
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center"
      >
        {visibleFields.priority && (
          <>
            <button
          type="button"
          aria-label={`Priority for ${task.title}: ${task.priority}. Activate to change.`}
          title={`Priority: ${task.priority}`}
          aria-haspopup="menu"
          aria-expanded={openEditor === "priority"}
          onClick={() =>
            setOpenEditor((current) =>
              current === "priority" ? null : "priority",
            )
          }
          className="rounded-md p-1 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0073ea] dark:hover:bg-slate-800 cursor-pointer"
        >
          <Flag
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              getPriorityColor(task.priority),
            )}
            aria-hidden="true"
          />
        </button>

        {openEditor === "priority" && (
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
                  onUpdateTask(task.id, { priority: option.value });
                  setOpenEditor(null);
                  toast.success("Priority updated");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
          </>
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
            onUpdateTask(task.id, { statusId: e.target.value });
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
              taskIsProgress || taskIsDone ? "white" : taskStatus.color,
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
          className="opacity-0 group-hover/row:opacity-100 max-md:opacity-100 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity cursor-pointer"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
