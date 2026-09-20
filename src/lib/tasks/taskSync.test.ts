import test from "node:test";
import assert from "node:assert/strict";
import { type Task } from "@/types";
import { reconcileTasks } from "@/lib/tasks/taskSync";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "task-1",
    listId: "list-1",
    title: "Sample Task",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    orderIndex: 0,
    assignees: [],
    tags: [],
    subtasks: [],
    dependencies: [],
    attachments: [],
    comments: [],
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

test("reconcileTasks preserves client task when client.updatedAt is newer than server", () => {
  const clientTask = makeTask({
    id: "task-1",
    title: "Client Edited Title",
    updatedAt: "2026-09-01T12:00:00.000Z",
  });
  const serverTask = makeTask({
    id: "task-1",
    title: "Older Server Title",
    updatedAt: "2026-09-01T11:00:00.000Z",
  });

  const targetListIds = new Set(["list-1"]);
  const result = reconcileTasks([clientTask], [serverTask], targetListIds);

  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].title, "Client Edited Title");
  assert.equal(result.tasksToPushToServer.length, 1);
  assert.equal(result.tasksToPushToServer[0].id, "task-1");
});

test("reconcileTasks accepts server task when server.updatedAt is newer than client", () => {
  const clientTask = makeTask({
    id: "task-1",
    title: "Old Client Title",
    updatedAt: "2026-09-01T10:00:00.000Z",
  });
  const serverTask = makeTask({
    id: "task-1",
    title: "Newer Remote Server Title",
    updatedAt: "2026-09-01T13:00:00.000Z",
  });

  const targetListIds = new Set(["list-1"]);
  const result = reconcileTasks([clientTask], [serverTask], targetListIds);

  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].title, "Newer Remote Server Title");
  assert.equal(result.tasksToPushToServer.length, 0);
});

test("reconcileTasks preserves offline-created client tasks not yet on server", () => {
  const clientTask = makeTask({
    id: "task-offline",
    title: "Created Offline",
    updatedAt: "2026-09-01T14:00:00.000Z",
  });
  const serverTask = makeTask({
    id: "task-existing",
    title: "Server Task",
  });

  const targetListIds = new Set(["list-1"]);
  const result = reconcileTasks([clientTask], [serverTask], targetListIds);

  assert.equal(result.tasks.length, 2);
  const offlineTask = result.tasks.find((t) => t.id === "task-offline");
  assert.ok(offlineTask);
  assert.equal(offlineTask.title, "Created Offline");
  assert.equal(result.tasksToPushToServer.length, 1);
  assert.equal(result.tasksToPushToServer[0].id, "task-offline");
});

test("reconcileTasks integrates newly added remote server tasks", () => {
  const clientTasks: Task[] = [];
  const serverTask = makeTask({
    id: "task-remote",
    title: "Remote Colleague Task",
  });

  const targetListIds = new Set(["list-1"]);
  const result = reconcileTasks(clientTasks, [serverTask], targetListIds);

  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].id, "task-remote");
  assert.equal(result.tasksToPushToServer.length, 0);
});

test("reconcileTasks retains tasks belonging to other workspace lists untouched", () => {
  const otherWsTask = makeTask({
    id: "task-other",
    listId: "list-other-ws",
    title: "Untouched Other Task",
  });
  const clientTask = makeTask({ id: "task-1", listId: "list-1" });
  const serverTask = makeTask({ id: "task-1", listId: "list-1", title: "Updated Server" });

  const targetListIds = new Set(["list-1"]);
  const result = reconcileTasks([otherWsTask, clientTask], [serverTask], targetListIds);

  assert.equal(result.tasks.length, 2);
  const retainedOther = result.tasks.find((t) => t.id === "task-other");
  assert.ok(retainedOther);
  assert.equal(retainedOther.title, "Untouched Other Task");
});
