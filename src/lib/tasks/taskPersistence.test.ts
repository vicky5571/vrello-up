import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { prisma } from "../marcom/db.ts";

test("TaskItem persistence in PostgreSQL via Prisma", async (t) => {
  await t.test("can query tasks from PostgreSQL", async () => {
    const tasks = await prisma.taskItem.findMany();
    assert.ok(Array.isArray(tasks));
    assert.ok(tasks.length > 0, "Expected at least 1 task in database");
  });

  await t.test("can create, update, and delete a TaskItem in PostgreSQL", async () => {
    const list = await prisma.listItem.findFirst();
    assert.ok(list, "Expected at least 1 list to attach task to");

    const created = await prisma.taskItem.create({
      data: {
        id: `test-task-${Date.now()}`,
        listId: list.id,
        title: "Test PostgreSQL Task Persistence",
        description: "Verify Prisma persists tasks correctly",
        statusId: "status-todo",
        priority: "urgent",
        postPlatform: "instagram",
        postFormat: "reel",
        assignees: [{ id: "user-1", name: "Alex Rivera" }],
        subtasks: [{ id: "st-1", title: "Subtask 1", completed: false, createdAt: new Date().toISOString() }],
      },
    });

    assert.ok(created.id);
    assert.equal(created.title, "Test PostgreSQL Task Persistence");
    assert.equal(created.priority, "urgent");
    assert.equal(created.postPlatform, "instagram");

    // Update
    const updated = await prisma.taskItem.update({
      where: { id: created.id },
      data: {
        statusId: "status-done",
        title: "Updated PostgreSQL Task",
      },
    });
    assert.equal(updated.statusId, "status-done");
    assert.equal(updated.title, "Updated PostgreSQL Task");

    // Delete
    await prisma.taskItem.delete({
      where: { id: created.id },
    });

    const deleted = await prisma.taskItem.findUnique({
      where: { id: created.id },
    });
    assert.equal(deleted, null);
  });
});

