"use client";

import { useState, useRef, useEffect, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  User,
  MapPin,
  Sparkles,
  CalendarDays,
  MoreHorizontal,
  CheckSquare,
  Check,
  Play,
  AlertCircle,
} from "lucide-react";
import type { MarcomWorkItem, ProjectsColumn } from "@/types";
import {
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
  getWorkItemColumn,
  getWorkItemSubStatus,
  VALID_COLUMNS_BY_TYPE,
} from "@/lib/marcom/workItems";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/ui/AppImage";

interface ProjectsWorkItemCardProps {
  item: MarcomWorkItem;
  onSelect?: (item: MarcomWorkItem) => void;
  isOverlay?: boolean;
  selected?: boolean;
  onToggleSelect?: (key: string) => void;
  onMoveToColumn?: (item: MarcomWorkItem, column: ProjectsColumn) => void;
  density?: "compact" | "default" | "relaxed";
}

export const ProjectsWorkItemCard = memo(function ProjectsWorkItemCard({
  item,
  onSelect,
  isOverlay = false,
  selected = false,
  onToggleSelect,
  onMoveToColumn,
  density = "default",
}: ProjectsWorkItemCardProps) {
  const itemKey = `${item._type}:${item.id}`;
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemKey,
    disabled: isOverlay,
    data: { item },
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
      };

  useEffect(() => {
    if (!showMoveMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showMoveMenu]);

  const title = getWorkItemTitle(item);
  const date = getWorkItemDate(item);
  const pic = getWorkItemPic(item);
  const currentColumn = getWorkItemColumn(item);

  const isOverdue = Boolean(
    date &&
      date.slice(0, 10) < new Date().toISOString().slice(0, 10) &&
      !["Done", "Cancelled", "Archived"].includes(currentColumn),
  );

  const checklistTotal =
    item._type === "content"
      ? item.subtasks?.length ?? 0
      : item._type === "event"
      ? item.checklist?.length ?? 0
      : 0;

  const checklistDone =
    item._type === "content"
      ? item.subtasks?.filter((s) => s.completed).length ?? 0
      : item._type === "event"
      ? item.checklist?.filter((c) => c.completed).length ?? 0
      : 0;

  const typeConfig = {
    content: {
      label: "Content",
      icon: Sparkles,
      badge:
        "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 border-pink-200/60 dark:border-pink-900/40",
      accent: "border-l-pink-500",
    },
    event: {
      label: "Event",
      icon: CalendarDays,
      badge:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40",
      accent: "border-l-blue-500",
    },
    placement: {
      label: "Placement",
      icon: MapPin,
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
      accent: "border-l-emerald-500",
    },
  }[item._type];

  const TypeIcon = typeConfig.icon;
  const validColumns = VALID_COLUMNS_BY_TYPE[item._type] || [];

  const padClass =
    density === "compact" ? "p-2" : density === "relaxed" ? "p-4" : "p-3";
  const titleClass =
    density === "compact"
      ? "text-[11px]"
      : density === "relaxed"
      ? "text-sm"
      : "text-xs";

  const renderSubtitle = () => {
    if (item._type === "content") {
      return (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
          {item.platform} • {item.format}
        </span>
      );
    }
    if (item._type === "event") {
      return (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {item.eventType} {item.branchName ? `• ${item.branchName}` : ""}
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        {item.dimensions || "Physical"} {item.outlet?.name ? `• ${item.outlet.name}` : ""}
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect?.(item)}
      className={cn(
        "group select-none bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing border-l-4 relative",
        typeConfig.accent,
        padClass,
        selected && "ring-2 ring-indigo-500 dark:ring-indigo-400",
        isDragging && "opacity-40",
        isOverlay && "shadow-xl ring-2 ring-blue-500/40 rotate-1 cursor-grabbing",
      )}
    >
      {/* Top line: Selection Checkbox + Type Badge + Status + Move Menu */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          {/* Per-card Checkbox */}
          {onToggleSelect && (
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(itemKey);
              }}
              className={cn(
                "w-4 h-4 rounded border transition-opacity flex items-center justify-center cursor-pointer shrink-0",
                selected
                  ? "bg-indigo-600 border-indigo-600 opacity-100 text-white"
                  : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800",
              )}
            >
              {selected && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
              typeConfig.badge,
            )}
          >
            <TypeIcon className="w-3 h-3" />
            <span>{typeConfig.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {density === "compact" && (
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[80px]">
              {item.status}
            </span>
          )}

          {/* Context Menu Button */}
          {onMoveToColumn && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveMenu(!showMoveMenu);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                title="Move to column"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {showMoveMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-6 z-30 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 text-xs"
                >
                  <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Move to
                  </div>
                  {validColumns.map((col) => (
                    <button
                      key={col}
                      type="button"
                      disabled={col === currentColumn}
                      onClick={() => {
                        setShowMoveMenu(false);
                        onMoveToColumn(item, col);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 transition-colors cursor-pointer",
                        col === currentColumn
                          ? "text-slate-300 dark:text-slate-600 cursor-default"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media thumbnail on content cards */}
      {item._type === "content" && item.mediaUrl && (
        <div className="mb-2 overflow-hidden rounded-lg aspect-video max-h-24 relative bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
          {item.mediaUrl.endsWith(".mp4") ||
          item.mediaUrl.endsWith(".mov") ||
          item.mediaUrl.endsWith(".webm") ? (
            <>
              <video
                src={item.mediaUrl}
                preload="metadata"
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="w-4 h-4 fill-white text-white" />
              </div>
            </>
          ) : (
            <AppImage
              src={item.mediaUrl}
              alt={title}
              fill
              sizes="card"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Title */}
      <h4
        className={cn(
          "font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",
          titleClass,
        )}
      >
        {title}
      </h4>

      {/* Sub-status badge */}
      {density !== "compact" && (() => {
        const sub = getWorkItemSubStatus(item);
        return (
          <div className="mb-1.5">
            <span
              style={{
                backgroundColor: `${sub.color}26`,
                borderColor: `${sub.color}4D`,
                color: sub.color,
              }}
              className={cn(
                "inline-flex items-center gap-1 font-medium px-1.5 py-0.5 rounded-full border w-fit",
                density === "relaxed" ? "text-[11px]" : "text-[10px]",
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: sub.color }}
              />
              {sub.label}
            </span>
          </div>
        );
      })()}

      {/* Subtitle / Context */}
      <div className="mb-2 truncate">{renderSubtitle()}</div>

      {/* Footer: Date & PIC & Checklist */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-mono text-[10px]",
                isOverdue
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              <Calendar className="w-3 h-3" />
              <span>{date.slice(0, 10)}</span>
              {isOverdue && (
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
              )}
            </span>
          )}

          {checklistTotal > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              <CheckSquare className="w-2.5 h-2.5 text-blue-500" />
              <span>
                {checklistDone}/{checklistTotal}
              </span>
            </span>
          )}
        </div>

        {pic && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
            <User className="w-2.5 h-2.5" />
            <span className="truncate max-w-[80px]">{pic}</span>
          </span>
        )}
      </div>
    </div>
  );
});
