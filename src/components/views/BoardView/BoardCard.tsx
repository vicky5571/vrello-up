"use client";

import { Task, Status } from "@/types";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { TagBadge } from "@/components/ui/TagBadge";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { AvatarGroup } from "@/components/ui/UserAvatar";
import { Calendar, CheckSquare, MoreHorizontal, Play, Paperclip } from "lucide-react";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { useState, useRef, useEffect, memo } from "react";

interface BoardCardProps {
  task: Task;
  statuses: Status[];
  onSelect: (taskId: string) => void;
  onMoveStatus: (taskId: string, statusId: string) => void;
  selected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

export const BoardCard = memo(function BoardCard({
  task,
  statuses,
  onSelect,
  onMoveStatus,
  selected = false,
  onToggleSelect,
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
  const { viewPreferences, presenceByTaskId, currentUserId } = useWorkspaceStore();
  const { visibleFields } = viewPreferences;
  const viewers = (presenceByTaskId[task.id] || []).filter((u) => u.id !== currentUserId);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showMoveMenu) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowMoveMenu(false);
        buttonRef.current?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoveMenu]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
  };

  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const overdue = isOverdue(task.dueDate);
  const currentStatusName =
    statuses.find((s) => s.id === task.statusId)?.name ?? "unknown status";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task.id)}
      className={cn(
        "group relative rounded-lg bg-white dark:bg-[#18191B] border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-grab active:cursor-grabbing select-none transition-all duration-150",
        viewPreferences.density === "compact"
          ? "p-2"
          : viewPreferences.density === "relaxed"
            ? "p-4"
            : "p-3",
        isDragging && "opacity-30 border-blue-500 shadow-lg",
        selected && "border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-400/60"
      )}
    >
      {/* Top Meta: Priority, Platform & Move Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {onToggleSelect && (
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label={`Select task ${task.title}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(task.id);
              }}
              title="Select for batch actions"
              className={cn(
                "flex w-6 h-6 items-center justify-center rounded-md border text-[11px] text-white transition-all cursor-pointer shrink-0",
                selected
                  ? "border-indigo-500 bg-indigo-500 opacity-100"
                  : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100 max-md:opacity-100 focus-visible:opacity-100 hover:border-indigo-400",
              )}
            >
              {selected && "✓"}
            </button>
          )}
          {visibleFields.priority ? <PriorityBadge priority={task.priority} /> : null}
          {task.postPlatform && (
            <PlatformBadge
              platform={task.postPlatform}
              format={task.postFormat}
              compact
            />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {viewers.length > 0 && (
            <div
              title={`Viewing now: ${viewers.map((u) => u.name).join(", ")}`}
              className="flex items-center -space-x-1.5 mr-0.5"
            >
              {viewers.slice(0, 3).map((v) => (
                <img
                  key={v.id}
                  src={v.avatar}
                  alt={v.name}
                  className="w-4 h-4 rounded-full ring-2 ring-emerald-500 animate-pulse object-cover"
                />
              ))}
              {viewers.length > 3 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-emerald-500">
                  +{viewers.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Accessible Move Menu (WCAG 2.2 AA single-pointer alternative) */}
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
            type="button"
            aria-label={`Move ${task.title} to another status (currently ${currentStatusName})`}
            aria-expanded={showMoveMenu}
            aria-haspopup="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            title="Move to status..."
            className={cn(
              "opacity-0 group-hover:opacity-100 max-md:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
              showMoveMenu && "opacity-100"
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMoveMenu && (
            <div
              role="menu"
              aria-label="Status choices"
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
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onMoveStatus(task.id, st.id);
                    setShowMoveMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-hidden font-medium flex items-center gap-2 transition-colors cursor-pointer",
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
    </div>

      {/* Media Thumbnail (if content post) */}
      {task.mediaUrl && (
        <div className="mb-2.5 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-850 aspect-video max-h-28 relative">
          {task.mediaUrl.endsWith(".mp4") ? (
            <>
              <video
                src={task.mediaUrl}
                preload="metadata"
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="p-1 rounded-full bg-black/60 text-white shadow-xs">
                  <Play className="w-3 h-3 fill-white" />
                </span>
              </div>
            </>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={task.mediaUrl}
              alt={task.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Task Title */}
      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-3 leading-snug">
        {task.title}
      </h3>

      {/* Tags */}
      {visibleFields.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      {/* Footer Info: Subtasks, Due Date & Assignees */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {/* Subtasks Count */}
          {visibleFields.subtasks && task.subtasks.length > 0 && (
            <span className="flex items-center gap-1 text-slate-500">
              <CheckSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>
                {completedSubtasks}/{task.subtasks.length}
              </span>
            </span>
          )}

          {/* Attachments / Footage Count */}
          {task.attachments && task.attachments.length > 0 && (
            <span
              className="flex items-center gap-1 text-slate-500"
              title={`${task.attachments.length} footage/file attachment(s)`}
            >
              <Paperclip className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{task.attachments.length}</span>
            </span>
          )}

          {/* Due Date */}
          {visibleFields.dueDate && task.dueDate && (
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
        {visibleFields.assignees && (
          <AvatarGroup users={task.assignees} max={2} size="xs" />
        )}
      </div>
    </div>
  );
});
