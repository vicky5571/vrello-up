import {
  type CustomAutomationRule,
  type AutomationTrigger,
  type Task,
  type User,
  type Workspace,
  type Space,
  type Status,
} from "@/types";
import { generateId } from "@/lib/utils";
import {
  DESIGN_SYSTEM_LIST_ID,
  OPS_TAG,
  ALERT_TAG,
} from "@/lib/marcom/marcomIds";

export interface AutomationExecutionContext {
  createTask: (
    data: Omit<Task, "id" | "createdAt" | "updatedAt" | "listId"> & {
      listId?: string | null;
    },
  ) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  logActivity: (taskId: string, action: string) => void;
  tasks: Task[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeListId: string | null;
  actor: User;
  findSpaceForListId: (workspaces: Workspace[], listId: string) => Space | undefined;
}

/**
 * Pure function to add a custom automation rule.
 */
export function applyAddCustomAutomation(
  rules: CustomAutomationRule[],
  ruleData: Omit<CustomAutomationRule, "id" | "runCount" | "createdAt">,
  nowIso: string = new Date().toISOString(),
): { nextRules: CustomAutomationRule[]; newRule: CustomAutomationRule } {
  const id = generateId("rule");
  const newRule: CustomAutomationRule = {
    ...ruleData,
    id,
    runCount: 0,
    createdAt: nowIso,
  };
  return {
    nextRules: [...rules, newRule],
    newRule,
  };
}

/**
 * Pure function to remove a custom automation rule.
 */
export function applyRemoveCustomAutomation(
  rules: CustomAutomationRule[],
  id: string,
): { nextRules: CustomAutomationRule[] } {
  return {
    nextRules: rules.filter((r) => r.id !== id),
  };
}

/**
 * Pure function to toggle a custom automation rule's enabled state.
 */
export function applyToggleCustomAutomation(
  rules: CustomAutomationRule[],
  id: string,
  enabled?: boolean,
): { nextRules: CustomAutomationRule[] } {
  return {
    nextRules: rules.map((r) =>
      r.id === id ? { ...r, enabled: enabled ?? !r.enabled } : r,
    ),
  };
}

/**
 * Pure function to bump the execution count of an automation rule.
 */
export function applyIncrementAutomationRun(
  automationRuns: Record<string, number>,
  id: string,
): Record<string, number> {
  return {
    ...automationRuns,
    [id]: (automationRuns[id] || 0) + 1,
  };
}

/**
 * Executes active custom automation rules for a given trigger.
 */
export async function executeAutomationsForTrigger(
  customAutomations: CustomAutomationRule[],
  trigger: AutomationTrigger,
  payload: Record<string, unknown> = {},
  context: AutomationExecutionContext,
): Promise<{ executedCount: number; nextAutomations: CustomAutomationRule[] }> {
  const activeRules = customAutomations.filter(
    (r) => r.enabled && r.trigger === trigger,
  );
  if (activeRules.length === 0) {
    return { executedCount: 0, nextAutomations: customAutomations };
  }

  let executedCount = 0;
  const currentWorkspace =
    context.workspaces.find((w) => w.id === context.activeWorkspaceId) ||
    context.workspaces[0];
  const defaultSpace = currentWorkspace?.spaces[0];
  const defaultListId =
    defaultSpace?.lists[0]?.id || context.activeListId || DESIGN_SYSTEM_LIST_ID;
  const defaultStatusId = defaultSpace?.statuses[0]?.id || "status-todo";
  const actor = context.actor;

  const executedRuleIds = new Set<string>();

  for (const rule of activeRules) {
    switch (rule.action) {
      case "create_field_ops_task": {
        const partner = (payload.partnerName as string) || "Partner";
        const mouId = (payload.mouId as string) || "";
        const taskTitle = `Setup & Execution: MOU ${partner}`;
        const newTask = context.createTask({
          listId: defaultListId,
          title: taskTitle,
          description: `Automated setup task generated from approved MOU #${mouId || "N/A"}. Automatically assigned to Field Operations PIC.`,
          statusId: defaultStatusId,
          priority: "high",
          orderIndex: 0,
          relatedMarcomId: mouId || undefined,
          relatedMarcomType: "MOU",
          assignees: [actor],
          subtasks: [
            {
              id: generateId("st"),
              title: "Branch outreach & venue confirmation",
              completed: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: generateId("st"),
              title: "Field operations equipment verification",
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
          tags: [{ ...OPS_TAG }],
        });
        context.logActivity(
          newTask.id,
          "Automation created setup task in Field Operations assigned to branch PIC",
        );
        executedCount++;
        executedRuleIds.add(rule.id);
        break;
      }

      case "notify_marcom_lead_high": {
        const taskId = payload.taskId as string | undefined;
        const eventTitle =
          (payload.eventTitle as string) ||
          (payload.title as string) ||
          "Upcoming Event";
        if (taskId) {
          context.updateTask(taskId, { priority: "urgent" });
          context.logActivity(
            taskId,
            "Automation notified Marcom Lead & flagged priority to High",
          );
        } else {
          const alertTask = context.createTask({
            listId: defaultListId,
            title: `URGENT: Event in 3 Days - ${eventTitle}`,
            description: `Automated notice: Event date is within 3 days. Marcom Lead notified and flagged to High/Urgent priority.`,
            statusId: defaultStatusId,
            priority: "urgent",
            orderIndex: 0,
            assignees: [actor],
            subtasks: [],
            tags: [{ ...ALERT_TAG }],
          });
          context.logActivity(
            alertTask.id,
            "Automation notified Marcom Lead & flagged priority to High",
          );
        }
        executedCount++;
        executedRuleIds.add(rule.id);
        break;
      }

      case "assign_lead_architect_today": {
        const taskId = payload.taskId as string | undefined;
        if (taskId) {
          const today = new Date().toISOString().slice(0, 10);
          context.updateTask(taskId, {
            assignees: [actor],
            dueDate: today,
          });
          context.logActivity(
            taskId,
            "Automation assigned Lead Architect & set due date to today",
          );
          executedCount++;
          executedRuleIds.add(rule.id);
        }
        break;
      }

      case "advance_status_review": {
        const taskId = payload.taskId as string | undefined;
        if (taskId) {
          const targetTask = context.tasks.find((t) => t.id === taskId);
          const space = targetTask
            ? context.findSpaceForListId(context.workspaces, targetTask.listId)
            : defaultSpace;
          const reviewStatus =
            space?.statuses.find(
              (s: Status) =>
                s.category === "review" ||
                s.name.toLowerCase().includes("review"),
            ) || space?.statuses[0];
          if (reviewStatus) {
            context.updateTask(taskId, { statusId: reviewStatus.id });
            context.logActivity(
              taskId,
              `Automation advanced status to ${reviewStatus.name}`,
            );
            executedCount++;
            executedRuleIds.add(rule.id);
          }
        }
        break;
      }
    }
  }

  const nextAutomations = customAutomations.map((r) =>
    executedRuleIds.has(r.id) ? { ...r, runCount: (r.runCount || 0) + 1 } : r,
  );

  return { executedCount, nextAutomations };
}
