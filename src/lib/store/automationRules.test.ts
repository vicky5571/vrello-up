import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { runOverdueEscalation } from "../automations/scheduler.ts";
import type { Task } from "../../types/index.ts";

const api = () => useWorkspaceStore.getState();
const today = new Date().toISOString().slice(0, 10);

type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt">;

function makeTask(title: string, overrides: Partial<NewTask> = {}) {
  return api().createTask({
    listId: "list-sprint-tasks",
    title,
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
    ...overrides,
  });
}

function automationActivities(taskId: string): string[] {
  return (api().tasks.find((t) => t.id === taskId)?.activities ?? []).map(
    (a) => a.action,
  );
}

test("rule-3 advances to review when all subtasks complete", () => {
  const task = makeTask("rule3-fire", { statusId: "status-in-progress" });
  api().addSubtask(task.id, "s1");
  api().addSubtask(task.id, "s2");
  const ids = (api().tasks.find((t) => t.id === task.id)?.subtasks ?? []).map(
    (s) => s.id,
  );
  api().toggleSubtask(task.id, ids[0]);
  assert.equal(
    api().tasks.find((t) => t.id === task.id)?.statusId,
    "status-in-progress",
  );
  api().toggleSubtask(task.id, ids[1]);
  const stored = api().tasks.find((t) => t.id === task.id);
  assert.equal(stored?.statusId, "status-review");
  assert.ok(
    automationActivities(task.id).some((a) => a.includes("all subtasks completed")),
  );
  assert.ok((api().automationRuns["rule-3"] || 0) >= 1);
  api().deleteTask(task.id);
});

test("rule-3 stays quiet when disabled", () => {
  api().setAutomationEnabled("rule-3", false);
  const task = makeTask("rule3-off", { statusId: "status-in-progress" });
  api().addSubtask(task.id, "s1");
  const id = api().tasks.find((t) => t.id === task.id)?.subtasks[0]?.id;
  api().toggleSubtask(task.id, id!);
  assert.equal(
    api().tasks.find((t) => t.id === task.id)?.statusId,
    "status-in-progress",
  );
  api().deleteTask(task.id);
  api().setAutomationEnabled("rule-3", true);
});

test("rule-1 assigns the lead and due date when priority becomes urgent", () => {
  const task = makeTask("rule1-fire");
  api().updateTask(task.id, { priority: "urgent" });
  const stored = api().tasks.find((t) => t.id === task.id);
  assert.ok(stored?.assignees.some((a) => a.id === "user-1"));
  assert.equal(stored?.dueDate, today);
  assert.ok(automationActivities(task.id).some((a) => a.includes("Automation assigned")));
  assert.ok((api().automationRuns["rule-1"] || 0) >= 1);
  api().deleteTask(task.id);
});

test("rule-1 stays quiet when disabled", () => {
  api().setAutomationEnabled("rule-1", false);
  const task = makeTask("rule1-off");
  api().updateTask(task.id, { priority: "urgent" });
  const stored = api().tasks.find((t) => t.id === task.id);
  assert.deepEqual(stored?.assignees ?? [], []);
  assert.equal(stored?.dueDate, undefined);
  api().deleteTask(task.id);
  api().setAutomationEnabled("rule-1", true);
});

test("rule-2 logs completion when status moves to done", () => {
  const task = makeTask("rule2-fire");
  const before = automationActivities(task.id).length;
  api().moveTaskStatus(task.id, "status-done");
  const after = automationActivities(task.id);
  assert.equal(after.length, before + 1);
  assert.match(after[0], /Automation logged completion/);
  assert.ok((api().automationRuns["rule-2"] || 0) >= 1);
  api().moveTaskStatus(task.id, "status-done");
  assert.equal(automationActivities(task.id).length, after.length);
  api().deleteTask(task.id);
});

test("rule-4 escalates overdue tasks once and skips completed ones", () => {
  api().setAutomationEnabled("rule-4", true);
  const open = makeTask("rule4-fire", { dueDate: "2000-01-01" });
  const closed = makeTask("rule4-done", {
    dueDate: "2000-01-01",
    statusId: "status-done",
  });
  assert.ok(runOverdueEscalation() >= 1);
  assert.equal(api().tasks.find((t) => t.id === open.id)?.priority, "urgent");
  assert.equal(api().tasks.find((t) => t.id === closed.id)?.priority, "normal");
  assert.ok(
    automationActivities(open.id).some((a) => a.includes("escalated priority")),
  );
  const logged = automationActivities(open.id).length;
  runOverdueEscalation();
  assert.equal(automationActivities(open.id).length, logged);
  api().deleteTask(open.id);
  api().deleteTask(closed.id);
  api().setAutomationEnabled("rule-4", false);
});

test("rule-4 returns zero when disabled", () => {
  api().setAutomationEnabled("rule-4", false);
  const task = makeTask("rule4-off", { dueDate: "2000-01-01" });
  assert.equal(runOverdueEscalation(), 0);
  assert.equal(api().tasks.find((t) => t.id === task.id)?.priority, "normal");
  api().deleteTask(task.id);
  api().setAutomationEnabled("rule-4", true);
});
