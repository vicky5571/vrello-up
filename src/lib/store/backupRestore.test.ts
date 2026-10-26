import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("importBackup rejects garbage without touching state", () => {
  const tasksBefore = api().tasks.length;
  assert.equal(api().importBackup(null), false);
  assert.equal(api().importBackup({}), false);
  assert.equal(api().importBackup({ spaces: "not-an-array" }), false);
  assert.equal(api().tasks.length, tasksBefore);
});

test("importBackup restores spaces and replaces tasks and tags", () => {
  const snap = api();
  const customSpace = { ...snap.spaces[0], id: "space-backup-test", name: "Backup Test" };
  assert.equal(
    api().importBackup({ spaces: [customSpace], tasks: [], tags: [] }),
    true,
  );
  const restored = api();
  assert.equal(restored.activeSpaceId, "space-backup-test");
  assert.deepEqual(restored.tasks, []);
  assert.deepEqual(restored.tags, []);

  assert.equal(
    api().importBackup({
      spaces: [{ ...customSpace, name: "Backup Test v2" }],
      tasks: [],
      tags: [],
    }),
    true,
  );
  assert.equal(
    api().spaces.filter((s) => s.id === "space-backup-test").length,
    1,
  );
  assert.equal(
    api().spaces.find((s) => s.id === "space-backup-test")?.name,
    "Backup Test v2",
  );

  assert.equal(
    api().importBackup({
      spaces: snap.spaces,
      tasks: snap.tasks,
      tags: snap.tags,
    }),
    true,
  );
  assert.equal(api().activeSpaceId, snap.activeSpaceId);
  assert.equal(api().tasks.length, snap.tasks.length);
});
