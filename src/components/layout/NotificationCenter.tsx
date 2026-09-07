"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  UserPlus,
  FileCheck,
  ArrowLeftRight,
  AlarmClock,
  CheckCheck,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  countUnread,
  deriveMouNotifications,
  deriveTaskNotifications,
  type AppNotification,
  type NotificationKind,
} from "@/lib/productivity/notifications";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  NotificationKind,
  { label: string; icon: typeof Bell; className: string }
> = {
  assignment: {
    label: "Assignments",
    icon: UserPlus,
    className: "bg-blue-500/10 text-blue-500",
  },
  mou_approval: {
    label: "MOU approvals",
    icon: FileCheck,
    className: "bg-violet-500/10 text-violet-500",
  },
  status: {
    label: "Status changes",
    icon: ArrowLeftRight,
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  overdue: {
    label: "Overdue",
    icon: AlarmClock,
    className: "bg-rose-500/10 text-rose-500",
  },
};

const KIND_ORDER: NotificationKind[] = [
  "overdue",
  "mou_approval",
  "assignment",
  "status",
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export function NotificationCenter() {
  const {
    tasks,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    currentUserId,
    lastSeenNotificationsAt,
    setLastSeenNotificationsAt,
    setSelectedTaskId,
    setActiveView,
  } = useWorkspaceStore();

  const [isOpen, setIsOpen] = useState(false);
  const [mouRows, setMouRows] = useState<{ id: string; partnerName: string; status: string }[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const doneStatusIds = useMemo(() => {
    const space = workspaces
      .find((w) => w.id === activeWorkspaceId)
      ?.spaces.find((s) => s.id === activeSpaceId);
    return (space?.statuses ?? [])
      .filter((s) => s.category === "done" || s.category === "closed")
      .map((s) => s.id);
  }, [workspaces, activeWorkspaceId, activeSpaceId]);

  const taskNotifs = useMemo(
    () => deriveTaskNotifications(tasks, { currentUserId, doneStatusIds }),
    [tasks, currentUserId, doneStatusIds],
  );
  const mouNotifs = useMemo(() => deriveMouNotifications(mouRows), [mouRows]);
  const allNotifs = useMemo<AppNotification[]>(
    () =>
      [...taskNotifs, ...mouNotifs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [taskNotifs, mouNotifs],
  );
  const unread = countUnread(allNotifs, lastSeenNotificationsAt);
  const isUnread = (n: AppNotification) =>
    !lastSeenNotificationsAt ||
    new Date(n.createdAt).getTime() > new Date(lastSeenNotificationsAt).getTime();

  // MOU approvals need server data: fetch lazily when the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/marcom/mous")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        if (!cancelled && Array.isArray(json.data)) setMouRows(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const handleOpenTask = (n: AppNotification) => {
    if (n.taskId) setSelectedTaskId(n.taskId);
    setIsOpen(false);
  };

  const handleOpenMous = () => {
    setActiveView("mous");
    setIsOpen(false);
  };

  const grouped = useMemo(() => {
    const map = new Map<NotificationKind, AppNotification[]>();
    for (const n of allNotifs) {
      const list = map.get(n.kind) ?? [];
      list.push(n);
      map.set(n.kind, list);
    }
    return KIND_ORDER.filter((k) => (map.get(k)?.length ?? 0) > 0).map(
      (k) => ({ kind: k, items: map.get(k)! }),
    );
  }, [allNotifs]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        title="Notifications & activity"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={isOpen}
        className="relative p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#141721]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-86 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Activity Center
              {unread > 0 && (
                <span className="ml-1.5 text-[10px] font-semibold text-rose-500">
                  {unread} new
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setLastSeenNotificationsAt(new Date().toISOString())}
              disabled={allNotifs.length === 0}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer disabled:opacity-40"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-3">
            {grouped.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="font-medium">You&apos;re all caught up</p>
                <p className="text-[11px] mt-0.5">
                  Assignments, MOU approvals, status changes, and overdue tasks land here.
                </p>
              </div>
            ) : (
              grouped.map(({ kind, items }) => {
                const meta = KIND_META[kind];
                const Icon = meta.icon;
                return (
                  <div key={kind}>
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {meta.label} ({items.length})
                    </div>
                    <div className="space-y-0.5">
                      {items.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() =>
                            n.kind === "mou_approval" ? handleOpenMous() : handleOpenTask(n)
                          }
                          className={cn(
                            "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer",
                            isUnread(n)
                              ? "bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              : "hover:bg-slate-100/70 dark:hover:bg-white/5",
                          )}
                        >
                          <span
                            className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                              meta.className,
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
                              {n.title}
                            </span>
                            {n.body && (
                              <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                                {n.body}
                              </span>
                            )}
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {timeAgo(n.createdAt)}
                            </span>
                          </span>
                          {isUnread(n) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
