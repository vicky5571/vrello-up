import test from "node:test";
import assert from "node:assert/strict";
import { sortTasks } from "@/lib/tasks/taskSort";
import type { Task, Status } from "@/types";

function makeMockTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id || "task-1",
    listId: "list-1",
    title: overrides.title || "Sample Task",
    description: "",
    statusId: overrides.statusId || "status-todo",
    priority: overrides.priority || "normal",
    assignees: overrides.assignees || [],
    tags: [],
    subtasks: [],
    orderIndex: overrides.orderIndex ?? 0,
    dueDate: overrides.dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const mockStatuses: Status[] = [
  { id: "status-todo", name: "To Do", color: "#64748B", category: "open", order: 0 },
  { id: "status-inprogress", name: "In Progress", color: "#3B82F6", category: "in_progress", order: 1 },
  { id: "status-done", name: "Done", color: "#10B981", category: "done", order: 2 },
];

test("sortTasks - defaults to orderIndex when sortField is null", () => {
  const t1 = makeMockTask({ id: "t1", orderIndex: 2 });
  const t2 = makeMockTask({ id: "t2", orderIndex: 0 });
  const t3 = makeMockTask({ id: "t3", orderIndex: 1 });

  const sorted = sortTasks([t1, t2, t3], null);
  assert.deepEqual(sorted.map((t) => t.id), ["t2", "t3", "t1"]);
});

test("sortTasks - sorts by title A-Z and Z-A", () => {
  const tA = makeMockTask({ id: "tA", title: "Apple", orderIndex: 0 });
  const tB = makeMockTask({ id: "tB", title: "Banana", orderIndex: 1 });
  const tC = makeMockTask({ id: "tC", title: "Cherry", orderIndex: 2 });

  const asc = sortTasks([tC, tA, tB], "title", "asc");
  assert.deepEqual(asc.map((t) => t.id), ["tA", "tB", "tC"]);

  const desc = sortTasks([tC, tA, tB], "title", "desc");
  assert.deepEqual(desc.map((t) => t.id), ["tC", "tB", "tA"]);
});

test("sortTasks - sorts by dueDate (earliest first, missing dates at end)", () => {
  const tEarly = makeMockTask({ id: "tEarly", dueDate: "2026-09-01" });
  const tLate = makeMockTask({ id: "tLate", dueDate: "2026-10-15" });
  const tNoDate = makeMockTask({ id: "tNoDate", dueDate: undefined });

  const asc = sortTasks([tLate, tNoDate, tEarly], "dueDate", "asc");
  assert.deepEqual(asc.map((t) => t.id), ["tEarly", "tLate", "tNoDate"]);

  const desc = sortTasks([tLate, tNoDate, tEarly], "dueDate", "desc");
  assert.deepEqual(desc.map((t) => t.id), ["tLate", "tEarly", "tNoDate"]);
});

test("sortTasks - sorts by priority (Urgent -> High -> Normal -> Low -> None)", () => {
  const tUrgent = makeMockTask({ id: "tUrgent", priority: "urgent" });
  const tNormal = makeMockTask({ id: "tNormal", priority: "normal" });
  const tLow = makeMockTask({ id: "tLow", priority: "low" });
  const tHigh = makeMockTask({ id: "tHigh", priority: "high" });

  const asc = sortTasks([tLow, tNormal, tUrgent, tHigh], "priority", "asc");
  assert.deepEqual(asc.map((t) => t.id), ["tUrgent", "tHigh", "tNormal", "tLow"]);

  const desc = sortTasks([tLow, tNormal, tUrgent, tHigh], "priority", "desc");
  assert.deepEqual(desc.map((t) => t.id), ["tLow", "tNormal", "tHigh", "tUrgent"]);
});

test("sortTasks - sorts by status sequence order", () => {
  const tTodo = makeMockTask({ id: "tTodo", statusId: "status-todo" });
  const tDone = makeMockTask({ id: "tDone", statusId: "status-done" });
  const tProgress = makeMockTask({ id: "tProgress", statusId: "status-inprogress" });

  const asc = sortTasks([tDone, tTodo, tProgress], "status", "asc", mockStatuses);
  assert.deepEqual(asc.map((t) => t.id), ["tTodo", "tProgress", "tDone"]);
});

test("sortTasks - sorts by primary assignee name", () => {
  const tBudi = makeMockTask({
    id: "tBudi",
    assignees: [{ id: "u1", name: "Budi Santoso", email: "budi@example.com", avatar: "https://avatar.vercel.sh/budi" }],
  });
  const tAndi = makeMockTask({
    id: "tAndi",
    assignees: [{ id: "u2", name: "Andi Wijaya", email: "andi@example.com", avatar: "https://avatar.vercel.sh/andi" }],
  });
  const tUnassigned = makeMockTask({ id: "tUnassigned", assignees: [] });

  const asc = sortTasks([tBudi, tUnassigned, tAndi], "assignee", "asc");
  assert.deepEqual(asc.map((t) => t.id), ["tAndi", "tBudi", "tUnassigned"]);
});
