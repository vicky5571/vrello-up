"use client";

import { Task, Status } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { AvatarGroup } from "@/components/ui/UserAvatar";
import { Calendar, CheckSquare, MoreHorizontal } from "lucide-react";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { useState } from "react";

interface BoardCardProps {
  task: Task;
  statuses: Status[];
  onSelect: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
}

export function BoardCard({
  task,
  statuses,
  onSelect,
  onMoveStatus,
}: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    },
  });

  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
  };

  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const overdue = isOverdue(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task.id)}
      className={cn(
        "group relative rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3.5 shadow-xs hover:shadow-md hover:border-teal-500/40 cursor-grab active:cursor-grabbing select-none transition-[box-shadow,border-color] duration-150",
        isDragging && "opacity-30 border-teal-500 shadow-xl"
      )}
    >
      {/* Top Meta: Priority & Move Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} />

        {/* Accessible Move Menu (WCAG 2.2 AA single-pointer alternative) */}
        <div className="relative">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            title="Move to status..."
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMoveMenu && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 z-30 w-40 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs"
            >
              <div className="px-3 py-1 font-bold text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Move to status:
              </div>
              {statuses.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onMoveStatus(task.id, st.id);
                    setShowMoveMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium flex items-center gap-2 transition-colors cursor-pointer",
                    task.statusId === st.id &&
                      "text-teal-600 dark:text-teal-400 font-bold"
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: st.color }}
                  />
                  {st.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-3 leading-snug">
        {task.title}
      </h3>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                border: `1px solid ${tag.color}30`,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer Info: Subtasks, Due Date & Assignees */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {/* Subtasks Count */}
          {task.subtasks.length > 0 && (
            <span className="flex items-center gap-1 text-slate-500">
              <CheckSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>
                {completedSubtasks}/{task.subtasks.length}
              </span>
            </span>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                overdue && "text-red-500 dark:text-red-400 font-semibold"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(task.dueDate)}</span>
            </span>
          )}
        </div>

        {/* Assignees */}
        <AvatarGroup users={task.assignees} max={2} size="xs" />
      </div>
    </div>
  );
}
