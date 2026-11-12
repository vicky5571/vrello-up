"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  CheckCheck,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import {
  countUnread,
  deriveMouNotifications,
  deriveTaskNotifications,
  deriveBorrowOverdueNotifications,
  deriveBorrowCompensationNotifications,
  type AppNotification,
  type NotificationKind,
} from "@/lib/productivity/notifications";
import { useNotificationFeed } from "@/lib/productivity/useNotificationFeed";
import { cn } from "@/lib/utils";
import { KIND_META, KIND_ORDER } from "./notificationCenterConfig";
import { NotificationItem } from "./NotificationItem";

export function NotificationCenter() {
  const { tasks, spaces, activeSpaceId, currentUserId, lastSeenNotificationsAt } =
    useWorkspaceStore(
      useShallow((s) => ({
        tasks: s.tasks,
        spaces: s.spaces,
        activeSpaceId: s.activeSpaceId,
        currentUserId: s.currentUserId,
        lastSeenNotificationsAt: s.lastSeenNotificationsAt,
      })),
    );

  const setLastSeenNotificationsAt = useWorkspaceStore((s) => s.setLastSeenNotificationsAt);
  const setSelectedTaskId = useWorkspaceStore((s) => s.setSelectedTaskId);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);

  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const { mouRows, borrowRows } = useNotificationFeed({ isOpen });
  const panelRef = useRef<HTMLDivElement>(null);

  const doneStatusIds = useMemo(() => {
    const space = spaces.find((s) => s.id === activeSpaceId);
    return (space?.statuses ?? [])
      .filter((s) => s.category === "done" || s.category === "closed")
      .map((s) => s.id);
  }, [spaces, activeSpaceId]);

  const taskNotifs = useMemo(
    () => deriveTaskNotifications(tasks, { currentUserId, doneStatusIds }),
    [tasks, currentUserId, doneStatusIds],
  );
  const mouNotifs = useMemo(() => deriveMouNotifications(mouRows), [mouRows]);
  const borrowNotifs = useMemo(
    () =>
      deriveBorrowOverdueNotifications({
        records: borrowRows,
        currentUserName: session?.user?.name || "",
        userRole: (session?.user?.role as "admin" | "supervisor" | "warehouse" | "staff" | "viewer") || "staff",
      }),
    [borrowRows, session?.user?.name, session?.user?.role],
  );
  const compensationNotifs = useMemo(
    () =>
      deriveBorrowCompensationNotifications({
        records: borrowRows,
        currentUserName: session?.user?.name || "",
        userRole: (session?.user?.role as "admin" | "supervisor" | "warehouse" | "staff" | "viewer") || "staff",
        lastSeenNotificationsAt,
      }),
    [borrowRows, session?.user?.name, session?.user?.role, lastSeenNotificationsAt],
  );
  const allNotifs = useMemo<AppNotification[]>(
    () =>
      [...taskNotifs, ...mouNotifs, ...borrowNotifs, ...compensationNotifs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [taskNotifs, mouNotifs, borrowNotifs, compensationNotifs],
  );
  const unread = countUnread(allNotifs, lastSeenNotificationsAt);
  const isUnread = (n: AppNotification) =>
    !lastSeenNotificationsAt || new Date(n.createdAt).getTime() > new Date(lastSeenNotificationsAt).getTime();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
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
  const handleOpenBorrowing = () => {
    setActiveView("inventory");
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
        className="relative p-2.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#141721]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay for easy tap-dismissal */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Responsive Popover Panel */}
          <div
            className={cn(
              "fixed inset-x-3 top-13 z-50 max-h-[82vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100",
              "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86 sm:max-w-[calc(100vw-2rem)] sm:max-h-none sm:block",
            )}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
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
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer disabled:opacity-40"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            <div className="flex-1 max-h-96 sm:max-h-96 overflow-y-auto p-2 space-y-3">
            {grouped.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="font-medium">You&apos;re all caught up</p>
                <p className="text-[11px] mt-0.5">
                  Assignments, MOU approvals, equipment overdues, status changes, and overdue tasks land here.
                </p>
              </div>
            ) : (
              grouped.map(({ kind, items }) => {
                const meta = KIND_META[kind];
                return (
                  <div key={kind}>
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {meta.label} ({items.length})
                    </div>
                    <div className="space-y-0.5">
                      {items.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          isUnread={isUnread(n)}
                          onSelect={(item) => {
                            if (item.kind === "borrow_overdue" || item.kind === "borrow_compensation") {
                              handleOpenBorrowing();
                            } else if (item.kind === "mou_approval" || item.kind === "mou_expiry") {
                              handleOpenMous();
                            } else {
                              handleOpenTask(item);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
