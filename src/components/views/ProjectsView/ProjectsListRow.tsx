"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  CalendarDays,
  MapPin,
  Check,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import type {
  MarcomWorkItem,
  VisibleFields,
  PostStatus,
  EventStatus,
  PlacementStatus,
} from "@/types";
import {
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
  getWorkItemSubStatus,
} from "@/lib/marcom/workItems";
import { cn } from "@/lib/utils";

interface ProjectsListRowProps {
  item: MarcomWorkItem;
  visibleFields: VisibleFields;
  isSelected: boolean;
  onToggleSelect: (key: string) => void;
  onSelect?: (item: MarcomWorkItem) => void;
  onUpdateTitle: (item: MarcomWorkItem, newTitle: string) => Promise<void>;
  onUpdateStatus: (item: MarcomWorkItem, newStatus: string) => Promise<void>;
  onUpdateDate: (item: MarcomWorkItem, newDate: string) => Promise<void>;
  onUpdatePic: (item: MarcomWorkItem, newPic: string) => Promise<void>;
}

const POST_STATUSES: PostStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "REVISION",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

const EVENT_STATUSES: EventStatus[] = [
  "UPCOMING",
  "ON_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const PLACEMENT_STATUSES: PlacementStatus[] = [
  "NOT_STARTED",
  "ON_PROGRESS",
  "DONE",
  "ISSUE",
];

export function ProjectsListRow({
  item,
  visibleFields,
  isSelected,
  onToggleSelect,
  onSelect,
  onUpdateTitle,
  onUpdateStatus,
  onUpdateDate,
  onUpdatePic,
}: ProjectsListRowProps) {
  const itemKey = `${item._type}:${item.id}`;
  const title = getWorkItemTitle(item);
  const dateStr = getWorkItemDate(item);
  const pic = getWorkItemPic(item);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDate, setEditDate] = useState(dateStr?.slice(0, 10) || "");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [editPic, setEditPic] = useState(pic || "");

  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isStatusDropdownOpen]);

  // Check overdue
  const isOverdue = (() => {
    if (!dateStr) return false;
    const isTerminal =
      item._type === "content"
        ? item.status === "PUBLISHED" || item.status === "ARCHIVED"
        : item._type === "event"
        ? item.status === "COMPLETED" || item.status === "CANCELLED"
        : item.status === "DONE";
    if (isTerminal) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return new Date(dateStr) < now;
  })();

  // Checklist pill calculations
  const checklistText = (() => {
    if (item._type === "content" && item.subtasks && item.subtasks.length > 0) {
      const done = item.subtasks.filter((s) => s.completed).length;
      return `${done}/${item.subtasks.length}`;
    }
    if (item._type === "event" && item.checklist && item.checklist.length > 0) {
      const done = item.checklist.filter((c) => c.completed).length;
      return `${done}/${item.checklist.length}`;
    }
    return null;
  })();

  const branchDisplay =
    item._type === "placement"
      ? item.outlet?.brand || item.outlet?.branchId || "—"
      : item.branchName || "—";

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    if (editTitle.trim() && editTitle !== title) {
      await onUpdateTitle(item, editTitle.trim());
    }
  };

  const handleDateSubmit = async () => {
    setIsEditingDate(false);
    if (editDate && editDate !== dateStr?.slice(0, 10)) {
      await onUpdateDate(item, editDate);
    }
  };

  const handlePicSubmit = async () => {
    setIsEditingPic(false);
    if (editPic.trim() !== (pic || "")) {
      await onUpdatePic(item, editPic.trim());
    }
  };

  const validStatuses: string[] =
    item._type === "content"
      ? POST_STATUSES
      : item._type === "event"
      ? EVENT_STATUSES
      : PLACEMENT_STATUSES;

  return (
    <tr
      onClick={() => onSelect?.(item)}
      className={cn(
        "group border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 text-xs transition-colors cursor-pointer",
        isSelected && "bg-blue-50/40 dark:bg-blue-950/20",
        isOverdue && "opacity-90",
      )}
    >
      {/* Checkbox */}
      <td
        className="w-10 px-3 py-2 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(itemKey);
          }}
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
            isSelected
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-900",
          )}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
      </td>

      {/* Type badge */}
      <td className="w-24 px-3 py-2 whitespace-nowrap">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize",
            item._type === "content" &&
              "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200/60",
            item._type === "event" &&
              "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60",
            item._type === "placement" &&
              "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60",
          )}
        >
          {item._type === "content" ? (
            <Sparkles className="w-2.5 h-2.5" />
          ) : item._type === "event" ? (
            <CalendarDays className="w-2.5 h-2.5" />
          ) : (
            <MapPin className="w-2.5 h-2.5" />
          )}
          <span>{item._type}</span>
        </span>
      </td>

      {/* Title / Name (inline editable on double-click) */}
      <td className="px-3 py-2 min-w-[200px]">
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={editTitle}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSubmit();
              if (e.key === "Escape") {
                setEditTitle(title);
                setIsEditingTitle(false);
              }
            }}
            className="w-full px-2 py-0.5 text-xs rounded border border-blue-500 bg-white dark:bg-slate-900 focus:outline-hidden"
          />
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="group/title"
          >
            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover/title:text-blue-600 transition-colors line-clamp-1">
              {title}
            </span>
          </div>
        )}
      </td>

      {/* Status (click to change dropdown) */}
      <td
        className="w-36 px-3 py-2 whitespace-nowrap relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={statusDropdownRef} className="relative inline-block text-left">
          {(() => {
            const sub = getWorkItemSubStatus(item);
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                }}
                style={{
                  backgroundColor: `${sub.color}26`,
                  borderColor: `${sub.color}4D`,
                  color: sub.color,
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-medium rounded-full border transition-opacity hover:opacity-80 cursor-pointer"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: sub.color }}
                />
                <span>{sub.label}</span>
              </button>
            );
          })()}

          {isStatusDropdownOpen && (
            <div className="absolute left-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30">
              {validStatuses.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsStatusDropdownOpen(false);
                    await onUpdateStatus(item, st);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-[11px] font-mono hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                    item.status === st && "text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-950/30",
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Date */}
      {visibleFields.dueDate && (
        <td
          className="w-28 px-3 py-2 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditingDate ? (
            <input
              type="date"
              autoFocus
              value={editDate}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditDate(e.target.value)}
              onBlur={handleDateSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDateSubmit();
                if (e.key === "Escape") setIsEditingDate(false);
              }}
              className="px-1 py-0.5 text-[11px] rounded border border-blue-500 bg-white dark:bg-slate-900 focus:outline-hidden"
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingDate(true);
              }}
              className={cn(
                "inline-flex items-center gap-1 font-mono text-[11px] hover:underline cursor-pointer",
                isOverdue
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-600 dark:text-slate-400",
              )}
            >
              {isOverdue && <AlertCircle className="w-3 h-3 text-rose-500" />}
              <span>{dateStr ? dateStr.slice(0, 10) : "—"}</span>
            </button>
          )}
        </td>
      )}

      {/* Branch */}
      {visibleFields.tags && (
        <td className="w-28 px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {branchDisplay}
        </td>
      )}

      {/* PIC */}
      {visibleFields.assignees && (
        <td
          className="w-32 px-3 py-2 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditingPic ? (
            <input
              type="text"
              autoFocus
              value={editPic}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditPic(e.target.value)}
              onBlur={handlePicSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePicSubmit();
                if (e.key === "Escape") setIsEditingPic(false);
              }}
              placeholder="Assign PIC..."
              className="w-full px-1.5 py-0.5 text-[11px] rounded border border-blue-500 bg-white dark:bg-slate-900 focus:outline-hidden"
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPic(true);
              }}
              className="text-slate-700 dark:text-slate-300 hover:underline cursor-pointer truncate max-w-[120px] text-left"
            >
              {pic || <span className="text-slate-400 italic">Unassigned</span>}
            </button>
          )}
        </td>
      )}

      {/* Checklist */}
      {visibleFields.subtasks && (
        <td className="w-24 px-3 py-2 whitespace-nowrap text-center">
          {checklistText ? (
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              ✓ {checklistText}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
          )}
        </td>
      )}

      {/* Actions */}
      <td
        className="w-12 px-3 py-2 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(item);
          }}
          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Details"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

