import {
  findSpaceForListId,
  useWorkspaceStore,
} from "@/lib/store/useWorkspaceStore";
import { isOverdue } from "@/lib/utils";
import { toast } from "sonner";
import {
  evaluateMouSla,
  evaluateContentSla,
  evaluateUpcomingEvents,
  isAlertNotified,
  markAlertNotified,
  pruneAlertCache,
  type EventSlaCandidate,
} from "@/lib/automations/slaRules";
import {
  buildEventTaskPayload,
  getEventChecklistTemplate,
} from "@/lib/tasks/eventTaskSync";
import { getDefaultDestinationForChannel } from "@/lib/tasks/targetSpaceList";
import type { Subtask } from "@/types";

function isTaskDoneCategory(category: string | undefined): boolean {
  return category === "done" || category === "closed";
}

/**
 * rule-4 "Overdue Escalation": any open, non-urgent task past its due date
 * is escalated to Urgent with a feed entry. Idempotent — reruns only pick
 * up newly overdue tasks. Returns the number of escalated tasks.
 */
export function runOverdueEscalation(): number {
  const state = useWorkspaceStore.getState();
  if (!state.automationEnabled["rule-4"]) return 0;

  let escalated = 0;
  for (const task of state.tasks) {
    if (task.priority === "urgent" || !isOverdue(task.dueDate)) continue;
    const space = findSpaceForListId(state.workspaces, task.listId);
    const category = space?.statuses.find(
      (s) => s.id === task.statusId,
    )?.category;
    if (isTaskDoneCategory(category)) continue;

    state.updateTask(task.id, { priority: "urgent" });
    state.logActivity(
      task.id,
      "Automation escalated priority to Urgent — task is overdue",
    );
    escalated++;
  }

  if (escalated > 0) {
    useWorkspaceStore.setState((s) => ({
      automationRuns: {
        ...s.automationRuns,
        "rule-4": (s.automationRuns["rule-4"] || 0) + escalated,
      },
    }));
  }
  return escalated;
}

/**
 * SLA Watchdog: Evaluates Field Events within H-3 lead time.
 * Automatically injects an operational preparation Task into the target Space/List.
 */
export async function checkUpcomingEvents(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const state = useWorkspaceStore.getState();
  const currentWorkspace = state.workspaces.find(
    (w) => w.id === state.activeWorkspaceId,
  );

  try {
    const res = await fetch("/api/marcom/events?status=UPCOMING");
    if (!res.ok) return 0;
    const events: EventSlaCandidate[] = await res.json();
    if (!Array.isArray(events)) return 0;

    // Build existing task lookup for idempotency
    const existingTaskMarcomIdsOrTitles = new Set<string>();
    for (const task of state.tasks) {
      if (task.relatedMarcomId) {
        existingTaskMarcomIdsOrTitles.add(task.relatedMarcomId);
      }
      existingTaskMarcomIdsOrTitles.add(task.title.toLowerCase());
    }

    const eligibleEvents = evaluateUpcomingEvents(
      events,
      existingTaskMarcomIdsOrTitles,
    );
    let createdCount = 0;

    for (const ev of eligibleEvents) {
      const alertKey = `sla:event:task:${ev.id}`;
      if (isAlertNotified(alertKey)) continue;

      // Determine target space and list
      const spaces = currentWorkspace?.spaces || [];
      const destination = getDefaultDestinationForChannel(spaces, "on_ground");
      if (!destination.listId || !destination.spaceId) continue;

      const targetSpace = spaces.find((s) => s.id === destination.spaceId);
      const defaultStatusId = targetSpace?.statuses[0]?.id || "status-todo";

      // Template checklist items
      const nowIso = new Date().toISOString();
      const rawChecklist = getEventChecklistTemplate(ev.eventType || "default");
      const subtasks: Subtask[] = rawChecklist.map((title, idx) => ({
        id: `subtask-auto-${ev.id}-${idx}`,
        title,
        completed: false,
        createdAt: nowIso,
      }));

      const payload = buildEventTaskPayload({
        event: {
          ...ev,
          eventType: ev.eventType || "default",
        },
        listId: destination.listId,
        statusId: defaultStatusId,
        members: currentWorkspace?.members || [],
        picIdOrName: ev.picName,
        subtasks,
        priority: "high",
      });

      state.createTask(payload);
      markAlertNotified(alertKey);
      createdCount++;

      toast.info(`Auto-created preparation task for Event: "${ev.name}" (H-3)`, {
        id: alertKey,
        duration: 5000,
      });

      // Also trigger any custom automation configured for event:in_3_days
      await state.runAutomationsForTrigger("event:in_3_days", {
        eventId: ev.id,
        eventTitle: ev.name,
      });
    }

    return createdCount;
  } catch {
    return 0;
  }
}

/**
 * SLA Watchdog: Evaluates MOUs for:
 * 1. SUBMITTED > 3 days auto-escalation alert.
 * 2. H-30 days expiration toast warning.
 */
export async function checkExpiringMous(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const state = useWorkspaceStore.getState();
  const activeWorkspaceId = state.activeWorkspaceId || "ws-main";

  try {
    const res = await fetch(
      `/api/marcom/mous?workspaceId=${encodeURIComponent(activeWorkspaceId)}`,
    );
    if (!res.ok) return 0;
    const json = await res.json();
    const mous = Array.isArray(json.data) ? json.data : [];

    const evaluation = evaluateMouSla(mous);
    let alertedCount = 0;

    // 1. Escalate MOUs waiting > 3 days
    for (const item of evaluation.escalatedMous) {
      const alertKey = `sla:mou:escalate:${item.mou.id}`;
      if (!isAlertNotified(alertKey)) {
        markAlertNotified(alertKey);
        toast.error(
          `SLA Breach: MOU with "${item.mou.partnerName}" has been pending approval for ${item.daysPending} days!`,
          { id: alertKey, duration: 6000 },
        );
        alertedCount++;
      }
    }

    // 2. Warn on MOUs expiring within 30 days
    for (const item of evaluation.expiringMous) {
      const alertKey = `sla:mou:expire:${item.mou.id}`;
      if (!isAlertNotified(alertKey)) {
        markAlertNotified(alertKey);
        toast.warning(
          `MOU Expiring Soon: "${item.mou.partnerName}" (${item.daysLeft} days remaining). Please prepare renewal.`,
          { id: alertKey, duration: 5000 },
        );
        alertedCount++;
      }
    }

    // 3. Alert on MOUs that are already Expired (endDate < now and not DONE)
    for (const item of evaluation.expiredMous) {
      const alertKey = `sla:mou:expired:${item.mou.id}`;
      if (!isAlertNotified(alertKey)) {
        markAlertNotified(alertKey);
        toast.error(
          `MOU Expired: Kerjasama dengan "${item.mou.partnerName}" telah kadaluwarsa (${item.daysExpired} hari lalu). Silakan ambil tindakan manual: perpanjang (Renew) atau tandai selesai (Mark Done).`,
          { id: alertKey, duration: 7000 },
        );
        alertedCount++;
      }
    }

    return alertedCount;
  } catch {
    return 0;
  }
}

/**
 * SLA Watchdog: Evaluates Content Posts in IN_REVIEW for > 2 days.
 */
export async function checkContentReviewSla(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const state = useWorkspaceStore.getState();
  const activeWorkspaceId = state.activeWorkspaceId || "ws-main";

  try {
    const res = await fetch(
      `/api/marcom/content?workspaceId=${encodeURIComponent(
        activeWorkspaceId,
      )}&status=IN_REVIEW`,
    );
    if (!res.ok) return 0;
    const json = await res.json();
    const contents = Array.isArray(json.data) ? json.data : [];

    const evaluation = evaluateContentSla(contents);
    let alertedCount = 0;

    for (const item of evaluation.overdueReviewContents) {
      const alertKey = `sla:content:review:${item.content.id}`;
      if (!isAlertNotified(alertKey)) {
        markAlertNotified(alertKey);
        toast.warning(
          `Content Review SLA: "${item.content.title}" has been waiting in review for ${item.daysInReview} days.`,
          { id: alertKey, duration: 5000 },
        );
        alertedCount++;
      }
    }

    return alertedCount;
  } catch {
    return 0;
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Polls automations (rule-4 overdue, SLA monitors, upcoming events, and MOU expiry) on an interval.
 */
export function startAutomationScheduler(
  intervalMs = 60_000,
): () => void {
  pruneAlertCache();
  runOverdueEscalation();
  checkUpcomingEvents();
  checkExpiringMous();
  checkContentReviewSla();

  if (timer === null) {
    timer = setInterval(() => {
      runOverdueEscalation();
      checkUpcomingEvents();
      checkExpiringMous();
      checkContentReviewSla();
    }, intervalMs);
  }
  return stopAutomationScheduler;
}

export function stopAutomationScheduler(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}
