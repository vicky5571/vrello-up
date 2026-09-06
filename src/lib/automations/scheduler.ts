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

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Polls rule-4 on an interval (plus once immediately). Call once from the
 * page level; the returned function stops the loop.
 */
export function startAutomationScheduler(
  intervalMs = 60_000,
): () => void {
  runOverdueEscalation();
  if (timer === null) {
    timer = setInterval(runOverdueEscalation, intervalMs);
  }
  return stopAutomationScheduler;
}

export function stopAutomationScheduler(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}
