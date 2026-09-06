import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

function makeTask(title: string) {
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
  });
}

test("createTask stores a new task with a generated id", () => {
  const created = makeTask("crud-create");
  assert.ok(created.id);
  assert.equal(api().tasks.find((t) => t.id === created.id)?.title, "crud-create");
  api().deleteTask(created.id);
  assert.equal(api().tasks.some((t) => t.id === created.id), false);
});

test("updateTask patches fields on the existing task", () => {
  const created = makeTask("crud-update");
  api().updateTask(created.id, { priority: "urgent", title: "crud-updated" });
  const updated = api().tasks.find((t) => t.id === created.id);
  assert.equal(updated?.priority, "urgent");
  assert.equal(updated?.title, "crud-updated");
  api().deleteTask(created.id);
});

test("moveTaskStatus transitions status and order index", () => {
  const created = makeTask("crud-move");
  api().moveTaskStatus(created.id, "status-in-progress", 3);
  const moved = api().tasks.find((t) => t.id === created.id);
  assert.equal(moved?.statusId, "status-in-progress");
  assert.equal(moved?.orderIndex, 3);
  api().deleteTask(created.id);
});

test("deleteTask clears selection and dependency references", () => {
  const a = makeTask("crud-dep-a");
  const b = makeTask("crud-dep-b");
  assert.equal(api().addDependency(b.id, a.id), true);
  api().setSelectedTaskId(a.id);
  api().deleteTask(a.id);
  assert.equal(api().tasks.some((t) => t.id === a.id), false);
  assert.equal(api().selectedTaskId, null);
  assert.deepEqual(api().tasks.find((t) => t.id === b.id)?.dependencies ?? [], []);
  api().deleteTask(b.id);
});
