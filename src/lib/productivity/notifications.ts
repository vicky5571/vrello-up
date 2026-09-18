/**
 * Notification & Activity Center derivation (pure, UI-agnostic).
 *
 * The TopNav bell aggregates four signals into one feed:
 *  - task assignments  (open tasks assigned to the current user)
 *  - MOU approvals     (MOUs sitting in SUBMITTED, derived separately)
 *  - status transitions (recent activity-log entries mentioning status moves)
 *  - overdue warnings  (open tasks past their due date)
 *
 * `deriveTaskNotifications` is pure and takes an injectable `now` so it is
 * trivially testable. Read/unread is tracked by comparing `createdAt`
 * against the persisted `lastSeenNotificationsAt` timestamp.
 */
import type { Task } from "@/types";

export type NotificationKind =
  | "assignment"
  | "mou_approval"
  | "mou_expiry"
  | "status"
  | "overdue";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  taskId?: string;
  createdAt: string;
}

export interface MouLike {
  id: string;
  partnerName: string;
  status: string;
  submissionDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt?: string | null;
}

const LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PER_KIND = 20;

function isOpenTask(task: Task, doneStatusIds: Set<string>): boolean {
  return !doneStatusIds.has(task.statusId);
}

function startOfToday(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function looksLikeStatusTransition(action: string): boolean {
  const a = action.toLowerCase();
  return (
    a.includes("status") ||
    a.includes("moved") ||
    a.includes("advanced") ||
    a.includes("completion") ||
    a.includes("completed") ||
    a.includes("review") ||
    a.includes("done") ||
    a.includes("complete")
  );
}

export interface DeriveOptions {
  currentUserId?: string;
  /** Status ids considered closed (done/closed categories). Falls back to name heuristics. */
  doneStatusIds?: string[];
  now?: Date | string;
  lookbackMs?: number;
}

/**
 * Derives assignment / status / overdue notifications from workspace tasks.
 * MOU approvals come from {@link deriveMouNotifications} (server data).
 */
export function deriveTaskNotifications(
  tasks: Task[],
  options: DeriveOptions = {},
): AppNotification[] {
  const now = new Date(options.now ?? Date.now());
  const lookbackMs = options.lookbackMs ?? LOOKBACK_MS;
  const cutoff = now.getTime() - lookbackMs;
  const today = startOfToday(now);

  const doneIds = new Set(options.doneStatusIds ?? []);
  const notifs: AppNotification[] = [];
  let assignments = 0;
  let statuses = 0;
  let overdues = 0;

  const sorted = [...tasks].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  for (const task of sorted) {
    const updated = new Date(task.updatedAt).getTime();

    // Overdue warnings: open tasks with a due date before today.
    if (overdues < MAX_PER_KIND && task.dueDate && isOpenTask(task, doneIds)) {
      const due = new Date(task.dueDate);
      if (!isNaN(due.getTime()) && due < today) {
        overdues += 1;
        notifs.push({
          id: `overdue-${task.id}`,
          kind: "overdue",
          title: `Overdue: ${task.title}`,
          body: task.dueDate,
          taskId: task.id,
          createdAt: task.updatedAt,
        });
      }
    }

    // Assignments: open tasks assigned to me, recently touched first.
    if (
      assignments < MAX_PER_KIND &&
      options.currentUserId &&
      updated >= cutoff &&
      isOpenTask(task, doneIds) &&
      task.assignees.some((a) => a.id === options.currentUserId)
    ) {
      assignments += 1;
      notifs.push({
        id: `assign-${task.id}`,
        kind: "assignment",
        title: `Assigned to you: ${task.title}`,
        taskId: task.id,
        createdAt: task.updatedAt,
      });
    }

    // Status transitions: recent activity entries about status moves.
    if (statuses < MAX_PER_KIND * 2 && Array.isArray(task.activities)) {
      for (const act of task.activities) {
        if (statuses >= MAX_PER_KIND * 2) break;
        const at = new Date(act.createdAt).getTime();
        if (isNaN(at) || at < cutoff) continue;
        if (!looksLikeStatusTransition(act.action)) continue;
        statuses += 1;
        notifs.push({
          id: `status-${act.id}`,
          kind: "status",
          title: act.action,
          body: task.title,
          taskId: task.id,
          createdAt: act.createdAt,
        });
      }
    }
  }

  return notifs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** MOUs awaiting approval (SUBMITTED) or near expiry (APPROVED/DONE with endDate) become notifications. */
export function deriveMouNotifications(
  mous: MouLike[],
  now = new Date(),
): AppNotification[] {
  const notifs: AppNotification[] = [];

  // 1. Approvals: sitting in SUBMITTED
  const approvals = mous
    .filter((m) => m.status === "SUBMITTED")
    .slice(0, MAX_PER_KIND)
    .map((m) => ({
      id: `mou-${m.id}`,
      kind: "mou_approval" as const,
      title: `MOU awaiting approval: ${m.partnerName}`,
      body: m.submissionDate ?? undefined,
      createdAt:
        m.updatedAt ?? m.submissionDate ?? now.toISOString(),
    }));
  notifs.push(...approvals);

  // 2. Expiry watchdog: APPROVED or DONE MOUs approaching endDate or already expired
  const nowMs = now.getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (const m of mous) {
    if ((m.status !== "APPROVED" && m.status !== "DONE") || !m.endDate) continue;
    const endMs = new Date(m.endDate).getTime();
    if (isNaN(endMs)) continue;
    const diffMs = endMs - nowMs;
    const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    if (daysLeft <= 0) {
      notifs.push({
        id: `mou-exp-${m.id}`,
        kind: "mou_expiry" as const,
        title: `MOU Expired: ${m.partnerName}`,
        body: `Masa berlaku MOU berakhir pada ${m.endDate.slice(0, 10)}.`,
        createdAt: m.endDate,
      });
    } else if (diffMs <= thirtyDaysMs) {
      notifs.push({
        id: `mou-exp-${m.id}`,
        kind: "mou_expiry" as const,
        title: `MOU Expiring Soon (${daysLeft}d): ${m.partnerName}`,
        body: `Masa berlaku MOU akan berakhir pada ${m.endDate.slice(0, 10)}.`,
        createdAt: now.toISOString(),
      });
    }
  }

  return notifs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_PER_KIND * 2);
}

/** Items newer than the last-seen timestamp count as unread. */
export function countUnread(
  notifs: AppNotification[],
  lastSeenAt: string | null | undefined,
): number {
  if (!lastSeenAt) return notifs.length;
  const seen = new Date(lastSeenAt).getTime();
  if (isNaN(seen)) return notifs.length;
  return notifs.filter(
    (n) => new Date(n.createdAt).getTime() > seen,
  ).length;
}
