import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("importBackup rejects garbage without touching state", () => {
  const tasksBefore = api().tasks.length;
  assert.equal(api().importBackup(null), false);
  assert.equal(api().importBackup({}), false);
  assert.equal(api().importBackup({ workspace: { id: 42 } }), false);
  assert.equal(api().tasks.length, tasksBefore);
});

test("importBackup restores a new workspace and replaces tasks and tags", () => {
  const snap = api();
  const ws = { ...snap.workspaces[0], id: "ws-backup-test", name: "Backup Test" };
  assert.equal(
    api().importBackup({ workspace: ws, tasks: [], tags: [] }),
    true,
  );
  const restored = api();
  assert.equal(restored.activeWorkspaceId, "ws-backup-test");
  assert.deepEqual(restored.tasks, []);
  assert.deepEqual(restored.tags, []);

  assert.equal(
    api().importBackup({
      workspace: { ...ws, name: "Backup Test v2" },
      tasks: [],
      tags: [],
    }),
    true,
  );
  assert.equal(
    api().workspaces.filter((w) => w.id === "ws-backup-test").length,
    1,
  );
  assert.equal(
    api().workspaces.find((w) => w.id === "ws-backup-test")?.name,
    "Backup Test v2",
  );

  assert.equal(
    api().importBackup({
      workspace: snap.workspaces[0],
      tasks: snap.tasks,
      tags: snap.tags,
    }),
    true,
  );
  assert.equal(api().activeWorkspaceId, snap.activeWorkspaceId);
  assert.equal(api().tasks.length, snap.tasks.length);
});
