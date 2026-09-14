import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { prisma } from "../marcom/db.ts";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { buildTaskTenantWhere, fetchTasksForWorkspace } from "./taskQuery.ts";

test("Task tenant boundary filtering in PostgreSQL via Prisma", async (t) => {
  const ws1Id = "ws-tenant-alpha";
  const ws2Id = "ws-tenant-beta";

  // Clean up any stale test fixtures
  await prisma.workspaceItem.deleteMany({
    where: { id: { in: [ws1Id, ws2Id] } },
  });

  // Create Workspace Alpha with space, list, and task
  await prisma.workspaceItem.create({
    data: {
      id: ws1Id,
      name: "Tenant Alpha",
      spaces: {
        create: [
          {
            id: "space-alpha",
            name: "Space Alpha",
            lists: {
              create: [
                {
                  id: "list-alpha",
                  name: "List Alpha",
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.taskItem.create({
    data: {
      id: "task-alpha-1",
      listId: "list-alpha",
      title: "Alpha Secret Task",
      statusId: "status-todo",
    },
  });

  // Create Workspace Beta with space, list, and task
  await prisma.workspaceItem.create({
    data: {
      id: ws2Id,
      name: "Tenant Beta",
      spaces: {
        create: [
          {
            id: "space-beta",
            name: "Space Beta",
            lists: {
              create: [
                {
                  id: "list-beta",
                  name: "List Beta",
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.taskItem.create({
    data: {
      id: "task-beta-1",
      listId: "list-beta",
      title: "Beta Confidential Task",
      statusId: "status-todo",
    },
  });

  try {
    await t.test("buildTaskTenantWhere constructs correct relational path", () => {
      const where = buildTaskTenantWhere("ws-sample");
      assert.deepEqual(where, {
        list: {
          space: {
            workspaceId: "ws-sample",
          },
        },
      });

      assert.equal(buildTaskTenantWhere(null), undefined);
      assert.equal(buildTaskTenantWhere(undefined), undefined);
    });

    await t.test("fetchTasksForWorkspace isolates tasks strictly by workspaceId", async () => {
      const alphaTasks = await fetchTasksForWorkspace(ws1Id);
      assert.equal(alphaTasks.length, 1);
      assert.equal(alphaTasks[0].id, "task-alpha-1");
      assert.equal(alphaTasks[0].title, "Alpha Secret Task");

      const betaTasks = await fetchTasksForWorkspace(ws2Id);
      assert.equal(betaTasks.length, 1);
      assert.equal(betaTasks[0].id, "task-beta-1");
      assert.equal(betaTasks[0].title, "Beta Confidential Task");

      const nonExistentTasks = await fetchTasksForWorkspace("ws-not-found");
      assert.equal(nonExistentTasks.length, 0);
    });
  } finally {
    // Cleanup cascade
    await prisma.workspaceItem.deleteMany({
      where: { id: { in: [ws1Id, ws2Id] } },
    });
  }
});
