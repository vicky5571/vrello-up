import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore, wouldCreateCycle } from "./useWorkspaceStore.ts";
import type { Task } from "../../types/index.ts";

const api = () => useWorkspaceStore.getState();

function stubTask(id: string, dependencies: string[] = []): Task {
  return {
    id,
    listId: "l-1",
    title: id,
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    dependencies,
    orderIndex: 0,
    createdAt: "",
    updatedAt: "",
  };
}

function makeTask(title: string) {
  return api().createTask({
    listId: "list-design-system",
    title,
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
  });
}

test("wouldCreateCycle detects direct, chained, and self cycles", () => {
  const a = stubTask("a", ["b"]);
  const b = stubTask("b");
  assert.equal(wouldCreateCycle("b", "a", [a, b]), true);

  const chain = [stubTask("a", ["b"]), stubTask("b", ["c"]), stubTask("c")];
  assert.equal(wouldCreateCycle("c", "a", chain), true);
  assert.equal(wouldCreateCycle("a", "a", chain), true);

  const clean = [stubTask("a", ["b"]), stubTask("b"), stubTask("c")];
  assert.equal(wouldCreateCycle("c", "a", clean), false);
  assert.equal(wouldCreateCycle("a", "c", clean), false);
});

test("addDependency blocks A → B → A while allowing the first link", () => {
  const a = makeTask("cycle-a");
  const b = makeTask("cycle-b");
  assert.equal(api().addDependency(b.id, a.id), true);
  assert.deepEqual(api().tasks.find((t) => t.id === b.id)?.dependencies, [a.id]);
  assert.equal(api().addDependency(a.id, b.id), false);
  assert.deepEqual(api().tasks.find((t) => t.id === a.id)?.dependencies ?? [], []);
  assert.equal(api().addDependency(a.id, a.id), false);
  api().deleteTask(a.id);
  api().deleteTask(b.id);
});
