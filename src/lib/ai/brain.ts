import type { Status, Task } from "@/types";
import { formatDate, isOverdue } from "@/lib/utils";

export interface BrainContext {
  tasks: Task[];
  statuses: Status[];
  selectedTask?: Task | null;
}

export type BrainAction =
  | { kind: "add-subtasks"; subtasks: string[] }
  | { kind: "apply-description"; description: string };

export interface BrainReply {
  text: string;
  action?: BrainAction;
}

const DONE_CATEGORIES = new Set(["done", "closed"]);

function statusOf(task: Task, statuses: Status[]): Status | undefined {
  return statuses.find((s) => s.id === task.statusId);
}

export function isTaskDone(task: Task, statuses: Status[]): boolean {
  const category = statusOf(task, statuses)?.category;
  return category !== undefined && DONE_CATEGORIES.has(category);
}

/** Sprint-wide numbers used by the summary reply. */
export function getSprintSummary(tasks: Task[], statuses: Status[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => isTaskDone(t, statuses)).length;
  const overdue = tasks.filter(
    (t) => !isTaskDone(t, statuses) && isOverdue(t.dueDate),
  ).length;
  const byStatus = statuses.map((s) => ({
    name: s.name,
    count: tasks.filter((t) => t.statusId === s.id).length,
  }));
  return {
    total,
    done,
    active: total - done,
    overdue,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    byStatus,
  };
}

export function formatSprintSummary(tasks: Task[], statuses: Status[]): string {
  const s = getSprintSummary(tasks, statuses);
  if (s.total === 0) return "No tasks in this sprint yet. Create one to get started.";
  const lines = [
    `Sprint progress: ${s.done}/${s.total} done (${s.pct}%) — ${s.active} active.`,
    ...s.byStatus.map((b) => `• ${b.name}: ${b.count}`),
  ];
  if (s.overdue > 0) lines.push(`${s.overdue} overdue — ask me to "show blockers".`);
  return lines.join("\n");
}

export interface BlockerItem {
  task: Task;
  reason: string;
}

const MAX_BLOCKERS = 8;

/** Overdue work, unfinished dependencies, and unassigned urgent/high tasks. */
export function getBlockers(tasks: Task[], statuses: Status[]): BlockerItem[] {
  const open = tasks.filter((t) => !isTaskDone(t, statuses));
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const found: BlockerItem[] = [];

  for (const t of open) {
    if (isOverdue(t.dueDate)) {
      found.push({ task: t, reason: `overdue since ${formatDate(t.dueDate)}` });
    }
  }
  for (const t of open) {
    const waiting = (t.dependencies ?? []).filter(
      (depId) => byId.get(depId) && !isTaskDone(byId.get(depId)!, statuses),
    );
    if (waiting.length > 0) {
      const names = waiting
        .map((depId) => `"${byId.get(depId)!.title}"`)
        .join(", ");
      found.push({ task: t, reason: `waiting on ${names}` });
    }
  }
  for (const t of open) {
    if (
      (t.priority === "urgent" || t.priority === "high") &&
      t.assignees.length === 0
    ) {
      found.push({ task: t, reason: `${t.priority} priority with no assignee` });
    }
  }
  return found.slice(0, MAX_BLOCKERS);
}

export function formatBlockers(tasks: Task[], statuses: Status[]): string {
  const blockers = getBlockers(tasks, statuses);
  if (blockers.length === 0)
    return "No blockers found. Nothing overdue, no stuck dependencies, and all urgent work is assigned.";
  return [
    `Found ${blockers.length} item${blockers.length > 1 ? "s" : ""} needing attention:`,
    ...blockers.map((b) => `• "${b.task.title}" — ${b.reason}.`),
  ].join("\n");
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Open tasks due today (calendar-day compare, format-agnostic). */
export function getDueToday(tasks: Task[], statuses: Status[]): Task[] {
  const today = new Date();
  return tasks.filter((t) => {
    if (!t.dueDate || isTaskDone(t, statuses)) return false;
    const d = new Date(t.dueDate);
    return !isNaN(d.getTime()) && isSameDay(d, today);
  });
}

/** Open tasks assigned to the user, soonest due first (undated last). */
export function getAssignedTo(
  tasks: Task[],
  statuses: Status[],
  userId: string,
): Task[] {
  const time = (t: Task) => {
    const d = t.dueDate ? new Date(t.dueDate).getTime() : NaN;
    return isNaN(d) ? Number.MAX_SAFE_INTEGER : d;
  };
  return tasks
    .filter((t) => !isTaskDone(t, statuses) && t.assignees.some((u) => u.id === userId))
    .sort((a, b) => time(a) - time(b));
}

const SUBTASK_TEMPLATES: { match: RegExp; steps: string[] }[] = [
  {
    match: /design|ui|ux|mockup|figma/i,
    steps: ["Gather requirements & references", "Draft wireframes", "Review with team", "Finalize & hand off specs"],
  },
  {
    match: /api|backend|server|endpoint|database/i,
    steps: ["Design request/response schema", "Implement endpoint", "Add validation & error handling", "Write integration tests"],
  },
  {
    match: /test|qa|bug|fix/i,
    steps: ["Reproduce the issue", "Identify root cause", "Implement fix", "Verify with regression check"],
  },
  {
    match: /deploy|release|launch|ci|pipeline/i,
    steps: ["Verify build passes", "Run migration plan", "Deploy to staging & smoke-test", "Roll out & monitor"],
  },
  {
    match: /doc|readme|guide|onboard/i,
    steps: ["Outline sections", "Write draft", "Add examples/screenshots", "Review & publish"],
  },
  {
    match: /meet|plan|research|investigat|spike|audit|review/i,
    steps: ["Define questions to answer", "Gather inputs", "Summarize findings", "Propose next steps"],
  },
];

/** Keyword-template subtask breakdown, minus steps that already exist. */
export function suggestSubtasks(task: Task): string[] {
  const template = SUBTASK_TEMPLATES.find((t) => t.match.test(task.title));
  const steps = template?.steps ?? [
    "Clarify scope & acceptance criteria",
    "Implement the change",
    "Verify it works",
    "Update docs if needed",
  ];
  const existing = new Set(task.subtasks.map((s) => s.title.toLowerCase().trim()));
  return steps.filter((s) => !existing.has(s.toLowerCase()));
}

/** Drafted ticket body from the task's own fields. */
export function draftDescription(task: Task, statusName?: string): string {
  const parts = [`## Goal`, task.title];
  if (statusName) parts.push("", `Current status: ${statusName}`);
  if (task.priority !== "none") parts.push(`Priority: ${task.priority}`);
  if (task.dueDate) parts.push(`Due: ${formatDate(task.dueDate)}`);
  if (task.assignees.length > 0)
    parts.push(`Owners: ${task.assignees.map((a) => a.name).join(", ")}`);
  parts.push("", `## Acceptance criteria`, `- [ ] Scope agreed`, `- [ ] Implemented`, `- [ ] Verified`);
  return parts.join("\n");
}

/** Keyword router: maps free text to one of the four capabilities. */
export function answerQuery(rawQuery: string, ctx: BrainContext): BrainReply {
  const q = rawQuery.toLowerCase();
  const { tasks, statuses, selectedTask } = ctx;

  if (/summar|progress|sprint|report|overview|how.*(going|doing)/.test(q)) {
    return { text: formatSprintSummary(tasks, statuses) };
  }
  if (/block|stuck|overdue|late|risk|attention/.test(q)) {
    return { text: formatBlockers(tasks, statuses) };
  }
  if (/subtask|break ?down|split|steps|checklist/.test(q)) {
    if (!selectedTask)
      return { text: "Open a task first (click any task), then I'll break it into subtasks." };
    const suggestions = suggestSubtasks(selectedTask);
    if (suggestions.length === 0)
      return { text: `Nothing new to suggest — "${selectedTask.title}" already covers the usual steps.` };
    return {
      text: [
        `Suggested subtasks for "${selectedTask.title}":`,
        ...suggestions.map((s) => `• ${s}`),
      ].join("\n"),
      action: { kind: "add-subtasks", subtasks: suggestions },
    };
  }
  if (/descri|write.*(ticket|story|task)|draft/.test(q)) {
    if (!selectedTask)
      return { text: "Open a task first (click any task), then I'll draft its description." };
    if (selectedTask.description.trim())
      return { text: `"${selectedTask.title}" already has a description. Clear it if you want a fresh draft.` };
    const description = draftDescription(
      selectedTask,
      statusOf(selectedTask, statuses)?.name,
    );
    return {
      text: `Drafted a description for "${selectedTask.title}" — review it below, then apply.`,
      action: { kind: "apply-description", description },
    };
  }
  return {
    text: [
      "I can help with this workspace:",
      `• "Summarize sprint" — progress overview`,
      `• "Show blockers" — overdue & stuck work`,
      `• Open a task, then "suggest subtasks" or "draft description"`,
    ].join("\n"),
  };
}
