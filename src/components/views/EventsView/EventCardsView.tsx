"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  Film,
  Play,
  Folder,
  Layers,
  CheckSquare,
  Users,
  Kanban,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import type { FieldEventItem, Task, Space, User } from "@/types";
import type { EventConflictDetail } from "@/lib/tasks/eventTaskSync";
import { formatEventDateRange, findMemberForPic } from "@/lib/tasks/eventTaskSync";
import { findSpaceByListId } from "@/lib/tasks/targetSpaceList";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import { STATUS_CONFIG, EVENT_TYPE_STYLES } from "./eventsConstants";

interface EventCardsViewProps {
  events: FieldEventItem[];
  conflicts: Map<string, EventConflictDetail>;
  tasks: Task[];
  rawSpaces: Space[];
  members: User[];
  onSelectEvent: (event: FieldEventItem) => void;
  onNavigateToTask: (event: FieldEventItem) => void;
  onDeleteEvent: (id: string) => void;
  onOpenFootageModal: (event: FieldEventItem, clipIdx?: number) => void;
}

export function EventCardsView({
  events,
  conflicts,
  tasks,
  rawSpaces,
  members,
  onSelectEvent,
  onNavigateToTask,
  onDeleteEvent,
  onOpenFootageModal,
}: EventCardsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => {
        const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.UPCOMING;
        const typeStyle = EVENT_TYPE_STYLES[event.eventType] || {
          label: event.eventType,
          badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
        };
        const linkedTask = tasks.find((t) => t.relatedMarcomId === event.id);
        const attendancePct =
          event.targetAttendee > 0
            ? Math.min(100, Math.round((event.attendeeCount / event.targetAttendee) * 100))
            : 0;

        const linkedSpace = linkedTask
          ? findSpaceByListId(rawSpaces, linkedTask.listId)
          : null;
        const linkedList =
          linkedSpace?.lists.find((l) => l.id === linkedTask?.listId) ||
          linkedSpace?.folders
            .flatMap((f) => f.lists)
            .find((l) => l.id === linkedTask?.listId);

        const subtasks = linkedTask?.subtasks || [];
        const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

        const picMember =
          linkedTask?.assignees?.[0] ||
          findMemberForPic(members, event.picName);

        const range = formatEventDateRange(event.startDate || event.date, event.endDate);
        const conflict = conflicts.get(event.id);

        const primaryClip = event.footage?.[0];
        const clipUrl = primaryClip?.filePath || event.mediaUrl;
        const hasMedia = Boolean((event.footage && event.footage.length > 0) || event.mediaUrl);
        const driveInfo = clipUrl ? parseGoogleDriveUrl(clipUrl) : null;
        const isVideo =
          clipUrl &&
          (clipUrl.endsWith(".mp4") ||
            clipUrl.endsWith(".mov") ||
            clipUrl.endsWith(".webm") ||
            clipUrl.includes("mixkit.co"));

        return (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all",
              event.status === "ON_PROGRESS" && "ring-1 ring-amber-500/30"
            )}
          >
            <div>
              {/* Top Tags & Status */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-semibold border",
                    typeStyle.badge
                  )}
                >
                  {typeStyle.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                    statusConfig.badge
                  )}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Title & Location */}
              <h3
                onClick={() => onSelectEvent(event)}
                className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-1"
              >
                {event.name}
              </h3>

              <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{event.location || "Venue TBD"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{event.branchName || "Main Branch"}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{range.formatted}</span>
                    </div>
                    {range.isMultiDay && (
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                        {range.durationDays}d duration
                      </span>
                    )}
                  </div>
                  {conflict?.hasSameBranchConflict && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">Branch venue conflict</span>
                    </div>
                  )}
                  {conflict?.hasCrossBranchConflict && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      <span className="shrink-0">🌐</span>
                      <span className="truncate">{conflict.crossBranchCount} branches active simultaneously</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics: Budget & Attendance */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Budget
                  </span>
                  <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(event.budget)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Footfall / Target
                  </span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {event.attendeeCount.toLocaleString()} /{" "}
                    <span className="text-slate-400 font-normal">
                      {event.targetAttendee.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${attendancePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Video Footage Showcase (Optimized Lightweight Poster) */}
              {hasMedia && (
                <div className="mt-3 space-y-2">
                  <div
                    onClick={() => onOpenFootageModal(event, 0)}
                    className="group/player relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200/80 dark:border-slate-800 cursor-pointer shadow-xs hover:border-blue-500/50 transition-all"
                    title="Click to watch documentation video"
                  >
                    {isVideo ? (
                      <video
                        src={clipUrl}
                        preload="metadata"
                        className="w-full h-full object-cover opacity-80 group-hover/player:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 p-3 text-center">
                        <Film className="w-8 h-8 text-blue-400 mb-1 opacity-80 group-hover/player:scale-110 transition-transform" />
                        <span className="text-[11px] text-slate-300 font-medium truncate max-w-full">
                          {primaryClip?.title || "Field Documentation"}
                        </span>
                        {driveInfo?.isValid && (
                          <span className="text-[9px] text-blue-400/80 mt-0.5 font-medium">
                            Google Drive Media
                          </span>
                        )}
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/35 group-hover/player:bg-black/15 flex items-center justify-center transition-colors">
                      <div className="w-10 h-10 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover/player:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Clip Duration Pill */}
                    {primaryClip?.duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
                        {primaryClip.duration}
                      </div>
                    )}
                  </div>

                  {/* Interactive Button & Links Bar */}
                  <div className="flex items-center justify-between text-[11px]">
                    {event.footage && event.footage.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenFootageModal(event, 0)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-semibold transition-colors cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Watch B-roll ({event.footage.length} clips) ▶</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    {event.mediaUrl && (
                      <a
                        href={event.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                        title="Open field documentation archive folder"
                      >
                        <Folder className="w-3 h-3" />
                        <span>Archive Folder ↗</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Destination Breadcrumb */}
              <div className="mt-3 flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 min-w-0 text-slate-600 dark:text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold truncate">
                    {linkedSpace && linkedList
                      ? `${linkedSpace.name} › ${linkedList.name}`
                      : "Workspace Task"}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                  Workspace Task
                </span>
              </div>

              {/* Checklist summary */}
              {subtasks.length > 0 && (
                <div className="mt-2 flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/40 dark:border-blue-900/30">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Preparation Checklist:</span>
                  </div>
                  <span className="font-semibold font-mono text-[10px]">
                    {completedSubtasksCount}/{subtasks.length} Completed
                  </span>
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate min-w-0">
                {picMember ? (
                  <img
                    src={picMember.avatar}
                    alt={picMember.name}
                    className="w-4 h-4 rounded-full bg-slate-200 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {picMember?.name || event.picName || "Unassigned"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onNavigateToTask(event)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                  title="View task on Kanban Board"
                >
                  <Kanban className="w-3 h-3" />
                  <span>View on Board</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Event"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this field event?")) {
                      onDeleteEvent(event.id);
                    }
                  }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Delete Event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
