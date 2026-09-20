"use client";

import { useMemo } from "react";
import {
  Flag,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  Film,
  Users,
  Layers,
  Kanban,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import type { FieldEventItem, Task, Space, User } from "@/types";
import type { EventConflictDetail } from "@/lib/tasks/eventTaskSync";
import { formatEventDateRange, findMemberForPic } from "@/lib/tasks/eventTaskSync";
import { findSpaceByListId } from "@/lib/tasks/targetSpaceList";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import {
  calculateEventUnitEconomics,
  getEfficiencyBadgeClasses,
} from "@/lib/marcom/eventCostAnalytics";
import { STATUS_CONFIG, EVENT_TYPE_STYLES } from "./eventsConstants";

const columnHelper = createMarcomColumnHelper<FieldEventItem>();

interface EventTableViewProps {
  events: FieldEventItem[];
  conflicts: Map<string, EventConflictDetail>;
  tasks: Task[];
  rawSpaces: Space[];
  members: User[];
  isLoading: boolean;
  error: string | null;
  canDelete: boolean;
  onRefresh: () => void;
  onSelectEvent: (event: FieldEventItem) => void;
  onNavigateToTask: (event: FieldEventItem) => void;
  onDeleteEvent: (id: string) => Promise<boolean>;
  onOpenFootageModal: (event: FieldEventItem, clipIdx?: number) => void;
}

export function EventTableView({
  events,
  conflicts,
  tasks,
  rawSpaces,
  members,
  isLoading,
  error,
  canDelete,
  onRefresh,
  onSelectEvent,
  onNavigateToTask,
  onDeleteEvent,
  onOpenFootageModal,
}: EventTableViewProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Event & Activation",
        size: 240,
        cell: ({ row }) => {
          const e = row.original;
          const typeStyle = EVENT_TYPE_STYLES[e.eventType] || {
            label: e.eventType,
            badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
          };
          return (
            <div className="flex flex-col gap-1 py-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-slate-900 dark:text-slate-100 text-xs hover:text-blue-600 transition-colors cursor-pointer truncate"
                  onClick={() => onSelectEvent(e)}
                >
                  {e.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", typeStyle.badge)}>
                  {typeStyle.label}
                </span>
                {e.footage && e.footage.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenFootageModal(e, 0)}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[10px] cursor-pointer font-medium"
                    title="Watch footage & B-roll video"
                  >
                    <Film className="w-3 h-3 text-blue-500" />
                    <span>{e.footage.length} clips ▶</span>
                  </button>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("location", {
        header: "Venue & Branch",
        size: 200,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex flex-col text-xs text-slate-600 dark:text-slate-300 gap-0.5">
              <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200 truncate">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                {e.location || "Venue TBD"}
              </span>
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                {e.branchName || "Main Branch"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.startDate || row.date || "", {
        id: "date",
        header: "Schedule",
        size: 210,
        cell: ({ row }) => {
          const e = row.original;
          const range = formatEventDateRange(e.date || e.startDate, e.endDate);
          const conflict = conflicts.get(e.id);
          return (
            <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {range.formatted}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1 pl-5">
                {range.isMultiDay && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                    {range.durationDays}d duration
                  </span>
                )}
                {conflict?.hasSameBranchConflict && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                    title={conflict.message}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                    Branch Conflict
                  </span>
                )}
                {conflict?.hasCrossBranchConflict && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60"
                    title={conflict.message}
                  >
                    🌐 {conflict.crossBranchCount} Branches Overlap
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("budget", {
        header: "Budget (IDR)",
        size: 140,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatIDR(e.budget)}
            </div>
          );
        },
      }),
      columnHelper.accessor("attendeeCount", {
        header: "Attendees / Footfall",
        size: 150,
        cell: ({ row }) => {
          const e = row.original;
          const pct = e.targetAttendee > 0 ? Math.min(100, Math.round((e.attendeeCount / e.targetAttendee) * 100)) : 0;
          return (
            <div className="flex flex-col gap-1 w-28">
              <div className="flex justify-between text-[10px] font-medium text-slate-600 dark:text-slate-300">
                <span>{e.attendeeCount.toLocaleString()}</span>
                <span className="text-slate-400">/ {e.targetAttendee.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : "bg-amber-500")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "costPerAttendee",
        header: "Cost / Head & ROI",
        size: 155,
        cell: ({ row }) => {
          const e = row.original;
          const unitEcon = calculateEventUnitEconomics(e);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                {unitEcon.costPerAttendee > 0
                  ? `${formatIDR(unitEcon.costPerAttendee)} / org`
                  : "—"}
              </span>
              <span
                className={cn(
                  "text-[9px] font-semibold px-1.5 py-0.2 rounded border w-fit truncate",
                  getEfficiencyBadgeClasses(unitEcon.efficiencyCategory)
                )}
              >
                {unitEcon.efficiencyLabel}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("picName", {
        header: "PIC / Assignee",
        size: 150,
        cell: ({ row }) => {
          const e = row.original;
          const linkedTask = tasks.find((t) => t.relatedMarcomId === e.id);
          const member =
            linkedTask?.assignees?.[0] ||
            findMemberForPic(members, e.picName);

          return (
            <div className="flex items-center gap-2 text-xs">
              {member ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-5 h-5 rounded-full bg-slate-200 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {member?.name || e.picName || "Unassigned"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const s = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.UPCOMING;
          return (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", s.badge)}>
              {s.label}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "destination",
        header: "Task Location (Workspace)",
        size: 190,
        cell: ({ row }) => {
          const e = row.original;
          const linkedTask = tasks.find((t) => t.relatedMarcomId === e.id);
          const linkedSpace = linkedTask
            ? findSpaceByListId(rawSpaces, linkedTask.listId)
            : null;
          const linkedList =
            linkedSpace?.lists.find((l) => l.id === linkedTask?.listId) ||
            linkedSpace?.folders
              .flatMap((f) => f.lists)
              .find((l) => l.id === linkedTask?.listId);

          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">
                {linkedSpace && linkedList
                  ? `${linkedSpace.name} › ${linkedList.name}`
                  : "Not linked"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        size: 140,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-1.5 justify-end">
              <button
                type="button"
                onClick={() => onNavigateToTask(e)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[10px] font-semibold transition-colors cursor-pointer"
                title="View task on Kanban Board"
              >
                <Kanban className="w-3 h-3" />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectEvent(e)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit Event"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this field event?")) {
                    onDeleteEvent(e.id);
                  }
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Delete Event"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      }),
    ],
    [tasks, rawSpaces, members, onSelectEvent, onNavigateToTask, onDeleteEvent, conflicts, onOpenFootageModal]
  );

  return (
    <MarcomTableShell<FieldEventItem>
      data={events}
      columns={columns}
      getRowId={(row) => row.id}
      initialSorting={[{ id: "date", desc: false }]}
      title="Field Events"
      titleIcon={Flag}
      entityName="event"
      entityPlural="events"
      isLoading={isLoading}
      error={error}
      onRefresh={onRefresh}
      canDelete={canDelete}
      deleteRequiresMessage="Delete requires admin or manager role"
      onDeleteOne={onDeleteEvent}
      hideHeader
      noPadding
    />
  );
}
