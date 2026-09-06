import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore, SEED_USERS } from "./useWorkspaceStore.ts";

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

test("comment, activity, and channel message default to the active member", () => {
  api().setCurrentUserId("user-2");
  const task = makeTask("actor-default");
  api().addComment(task.id, "hello");
  api().logActivity(task.id, "did a thing");
  api().addChannelMessage("general", "hi all");

  const stored = api().tasks.find((t) => t.id === task.id);
  assert.equal(stored?.comments?.[0]?.userId, "user-2");
  assert.equal(stored?.activities?.[0]?.userName, "Sarah Chen");
  const messages = api().channelMessages;
  assert.equal(messages[messages.length - 1]?.userId, "user-2");

  api().deleteTask(task.id);
  api().setCurrentUserId("user-1");
});

test("explicit user argument still wins over the active member", () => {
  api().setCurrentUserId("user-2");
  const task = makeTask("actor-explicit");
  api().addComment(task.id, "hello", SEED_USERS[2]);
  const stored = api().tasks.find((t) => t.id === task.id);
  assert.equal(stored?.comments?.[0]?.userId, "user-3");

  api().deleteTask(task.id);
  api().setCurrentUserId("user-1");
});

test("unknown currentUserId falls back to the seed user", () => {
  api().setCurrentUserId("ghost");
  api().addChannelMessage("general", "fallback check");
  const messages = api().channelMessages;
  assert.equal(messages[messages.length - 1]?.userId, "user-1");
  api().setCurrentUserId("user-1");
});
