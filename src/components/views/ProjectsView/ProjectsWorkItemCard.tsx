"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User, MapPin, Sparkles, CalendarDays } from "lucide-react";
import type { MarcomWorkItem } from "@/types";
import {
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
} from "@/lib/marcom/workItems";
import { cn } from "@/lib/utils";

interface ProjectsWorkItemCardProps {
  item: MarcomWorkItem;
  onSelect?: (item: MarcomWorkItem) => void;
  isOverlay?: boolean;
}

export function ProjectsWorkItemCard({
  item,
  onSelect,
  isOverlay = false,
}: ProjectsWorkItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${item._type}:${item.id}`,
    data: { item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const title = getWorkItemTitle(item);
  const date = getWorkItemDate(item);
  const pic = getWorkItemPic(item);

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
        "group select-none bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing border-l-4",
        typeConfig.accent,
        isDragging && "opacity-40",
        isOverlay && "shadow-xl ring-2 ring-blue-500/40 rotate-1 cursor-grabbing",
      )}
    >
      {/* Top line: Type Badge + Status */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
            typeConfig.badge,
          )}
        >
          <TypeIcon className="w-3 h-3" />
          <span>{typeConfig.label}</span>
        </span>

        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
          {item.status}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h4>

      {/* Subtitle / Context */}
      <div className="mb-2.5 truncate">{renderSubtitle()}</div>

      {/* Footer: Date & PIC */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {date ? (
          <span className="inline-flex items-center gap-1 font-mono text-[10px]">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{date.slice(0, 10)}</span>
          </span>
        ) : (
          <span />
        )}

        {pic && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
            <User className="w-2.5 h-2.5" />
            <span className="truncate max-w-[80px]">{pic}</span>
          </span>
        )}
      </div>
    </div>
  );
}
