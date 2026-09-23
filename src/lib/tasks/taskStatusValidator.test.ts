import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { validateTaskStatus, cascadeOrphanedTasksOnStatusRemoval, resolveSpaceStatusesForList } from "./taskStatusValidator.ts";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { prisma } from "../marcom/db.ts";

test("validateTaskStatus", async (t) => {
  const sampleStatuses = [
    { id: "status-todo", name: "TO DO", category: "open", order: 0 },
    { id: "status-in-progress", name: "IN PROGRESS", category: "in_progress", order: 1 },
    { id: "status-done", name: "DONE", category: "done", order: 2 },
  ];

  await t.test("returns true for existing statusId", () => {
    assert.equal(validateTaskStatus(sampleStatuses, "status-todo"), true);
    assert.equal(validateTaskStatus(sampleStatuses, "status-done"), true);
  });

  await t.test("returns false for non-existent statusId", () => {
    assert.equal(validateTaskStatus(sampleStatuses, "status-invalid"), false);
    assert.equal(validateTaskStatus(sampleStatuses, ""), false);
  });

  await t.test("permissively returns true if spaceStatuses is empty or not an array", () => {
    assert.equal(validateTaskStatus([], "status-anything"), true);
    assert.equal(validateTaskStatus(null, "status-anything"), true);
    assert.equal(validateTaskStatus(undefined, "status-anything"), true);
  });
});

test("resolveSpaceStatusesForList & cascadeOrphanedTasksOnStatusRemoval with PostgreSQL", async (t) => {
  const list = await prisma.listItem.findFirst();
  assert.ok(list, "Expected at least 1 list in database");

  await t.test("resolveSpaceStatusesForList resolves parent space and its statuses", async () => {
    const resolved = await resolveSpaceStatusesForList(prisma, list.id);
    assert.ok(resolved, "Expected to resolve space for list");
    assert.ok(resolved.spaceId, "Expected spaceId");
    assert.ok(Array.isArray(resolved.statuses), "Expected statuses array");
    assert.ok(resolved.statuses.length > 0, "Expected at least 1 status in space");
  });

  await t.test("cascadeOrphanedTasksOnStatusRemoval handles empty arrays safely", async () => {
    const count1 = await cascadeOrphanedTasksOnStatusRemoval(prisma, [], ["status-old"], "status-todo");
    assert.equal(count1, 0);

    const count2 = await cascadeOrphanedTasksOnStatusRemoval(prisma, [list.id], [], "status-todo");
    assert.equal(count2, 0);
  });

  await t.test("cascadeOrphanedTasksOnStatusRemoval reassigns tasks with removed status", async () => {
    const tempTaskId = `test-cascade-${Date.now()}`;
    const dummyRemovedStatus = `status-removed-${Date.now()}`;
    const fallbackStatus = "status-todo";

    await prisma.taskItem.create({
      data: {
        id: tempTaskId,
        listId: list.id,
        title: "Test Task for Status Cascade",
        statusId: dummyRemovedStatus,
        priority: "normal",
      },
    });

    try {
      const updatedCount = await cascadeOrphanedTasksOnStatusRemoval(
        prisma,
        [list.id],
        [dummyRemovedStatus],
        fallbackStatus,
      );

      assert.equal(updatedCount, 1, "Expected 1 task to be updated");

      const refreshed = await prisma.taskItem.findUnique({
        where: { id: tempTaskId },
      });
      assert.equal(refreshed?.statusId, fallbackStatus);
    } finally {
      await prisma.taskItem.delete({ where: { id: tempTaskId } }).catch(() => {});
    }
  });
});
