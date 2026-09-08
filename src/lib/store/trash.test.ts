import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { TRASH_LIMIT, TRASH_RETENTION_MS, useWorkspaceStore } from "./useWorkspaceStore.ts";

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

/** Fully removes test tasks (trash + live) so later tests see a clean bin. */
function destroy(ids: string[]) {
  for (const id of ids) {
    api().restoreTasks([id]);
    api().deleteTask(id);
    api().permanentlyDeleteTask(id);
  }
}

test("deleteTask soft-deletes into trash and restoreTasks revives", () => {
  const created = makeTask("trash-roundtrip");
  api().deleteTask(created.id);
  assert.equal(api().tasks.some((t) => t.id === created.id), false);
  assert.equal(api().trash.some((e) => e.task.id === created.id), true);

  assert.equal(api().restoreTasks([created.id]), 1);
  assert.equal(api().tasks.some((t) => t.id === created.id), true);
  assert.equal(api().trash.some((e) => e.task.id === created.id), false);
  destroy([created.id]);
});

test("restoreTasks ignores unknown ids and returns the revived count", () => {
  const a = makeTask("trash-unknown-a");
  const b = makeTask("trash-unknown-b");
  api().deleteTask(a.id);
  api().deleteTask(b.id);
  assert.equal(api().restoreTasks([a.id, "nope-missing"]), 1);
  assert.equal(api().tasks.some((t) => t.id === a.id), true);
  assert.equal(api().trash.some((e) => e.task.id === b.id), true);
  destroy([a.id, b.id]);
});

test("permanentlyDeleteTask and emptyTrash drop trash entries", () => {
  const a = makeTask("trash-perm-a");
  const b = makeTask("trash-perm-b");
  api().deleteTask(a.id);
  api().deleteTask(b.id);
  api().permanentlyDeleteTask(a.id);
  assert.equal(api().trash.some((e) => e.task.id === a.id), false);
  assert.equal(api().trash.some((e) => e.task.id === b.id), true);
  api().emptyTrash();
  assert.equal(api().trash.length, 0);
  // Live tasks were already trashed; nothing left to clean beyond the bin.
  assert.equal(api().tasks.some((t) => t.id === a.id), false);
  assert.equal(api().tasks.some((t) => t.id === b.id), false);
});

test("purgeExpiredTrash drops entries past the retention window", () => {
  const created = makeTask("trash-expired");
  api().deleteTask(created.id);
  const ancient = new Date(Date.now() - TRASH_RETENTION_MS - 1000).toISOString();
  useWorkspaceStore.setState((s) => ({
    trash: s.trash.map((e) =>
      e.task.id === created.id ? { ...e, deletedAt: ancient } : e,
    ),
  }));
  api().purgeExpiredTrash();
  assert.equal(api().trash.some((e) => e.task.id === created.id), false);
});

test("trash is capped at TRASH_LIMIT entries", () => {
  const ids: string[] = [];
  for (let i = 0; i < TRASH_LIMIT + 5; i++) {
    const t = makeTask(`trash-cap-${i}`);
    ids.push(t.id);
    api().deleteTask(t.id);
  }
  assert.ok(api().trash.length <= TRASH_LIMIT);
  api().emptyTrash();
});

test("isTrashOpen defaults to false and setTrashOpen toggles state", () => {
  api().setTrashOpen(false);
  assert.equal(api().isTrashOpen, false);
  api().setTrashOpen(true);
  assert.equal(api().isTrashOpen, true);
  api().setTrashOpen(false);
  assert.equal(api().isTrashOpen, false);
});
