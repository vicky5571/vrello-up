import {
  findSpaceForListId,
  useWorkspaceStore,
} from "@/lib/store/useWorkspaceStore";
import { isOverdue } from "@/lib/utils";

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
    // Nested updateTask may cascade into rule-1 (urgent → assign lead);
    // that is intended rules-engine behavior.
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

const notifiedEvents = new Set<string>();

export async function checkUpcomingEvents(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const state = useWorkspaceStore.getState();
  const hasEventRule = state.customAutomations.some(
    (r) => r.enabled && r.trigger === "event:in_3_days",
  );
  if (!hasEventRule) return 0;

  try {
    const res = await fetch("/api/marcom/events?status=UPCOMING");
    if (!res.ok) return 0;
    const events = await res.json();
    if (!Array.isArray(events)) return 0;

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    let triggered = 0;

    for (const ev of events) {
      if (!ev.startDate || notifiedEvents.has(ev.id)) continue;
      const eventTime = new Date(ev.startDate).getTime();
      const diff = eventTime - now;
      if (diff > 0 && diff <= threeDaysMs) {
        notifiedEvents.add(ev.id);
        await state.runAutomationsForTrigger("event:in_3_days", {
          eventId: ev.id,
          eventTitle: ev.name,
        });
        triggered++;
      }
    }
    return triggered;
  } catch {
    return 0;
  }
}

const notifiedExpiringMous = new Set<string>();

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

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    let warned = 0;

    for (const mou of mous) {
      if ((mou.status === "APPROVED" || mou.status === "DONE") && mou.endDate) {
        if (notifiedExpiringMous.has(mou.id)) continue;
        const endMs = new Date(mou.endDate).getTime();
        if (isNaN(endMs)) continue;
        const diff = endMs - now;
        if (diff <= thirtyDaysMs) {
          notifiedExpiringMous.add(mou.id);
          warned++;
        }
      }
    }
    return warned;
  } catch {
    return 0;
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Polls automations (rule-4 overdue, custom event triggers, and MOU expiry) on an interval.
 */
export function startAutomationScheduler(
  intervalMs = 60_000,
): () => void {
  runOverdueEscalation();
  checkUpcomingEvents();
  checkExpiringMous();
  if (timer === null) {
    timer = setInterval(() => {
      runOverdueEscalation();
      checkUpcomingEvents();
      checkExpiringMous();
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
