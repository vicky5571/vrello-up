import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import {
  applyAddComment,
  applyDeleteComment,
  applyAddChannelMessage,
  applyLogActivity,
  resolveActor,
} from "./commentOperations.ts";
import type { Task, User, Workspace, ChannelMessage } from "../../types/index.ts";

const dummyActor: User = {
  id: "u-1",
  name: "Alice",
  email: "alice@test.com",
  role: "admin",
};

const initialTask: Task = {
  id: "task-1",
  listId: "list-1",
  title: "Test Task",
  description: "",
  statusId: "status-todo",
  priority: "normal",
  assignees: [],
  tags: [],
  subtasks: [],
  comments: [],
  activities: [],
  orderIndex: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

test("resolveActor returns explicit user if provided", () => {
  const explicit: User = { id: "u-2", name: "Bob", email: "bob@test.com", role: "member" };
  const resolved = resolveActor([], "ws-1", "u-1", [dummyActor], explicit);
  assert.equal(resolved.id, "u-2");
});

test("resolveActor finds member matching currentUserId in active workspace", () => {
  const ws: Workspace = {
    id: "ws-1",
    name: "Main",
    spaces: [],
    members: [{ id: "u-member", name: "Member", email: "m@test.com", role: "member" }],
    createdAt: "",
  };
  const resolved = resolveActor([ws], "ws-1", "u-member", [dummyActor]);
  assert.equal(resolved.id, "u-member");
});

test("resolveActor falls back to fallbackUser if currentUserId not in workspace", () => {
  const resolved = resolveActor([], "ws-1", "ghost", [dummyActor]);
  assert.equal(resolved.id, "u-1");
});

test("applyAddComment appends comment and activity log", () => {
  const result = applyAddComment([initialTask], "task-1", "Great job!", dummyActor);
  const updated = result.nextTasks.find((t) => t.id === "task-1");
  assert.equal(updated?.comments?.length, 1);
  assert.equal(updated?.comments?.[0].content, "Great job!");
  assert.equal(updated?.comments?.[0].userId, "u-1");
  assert.equal(updated?.activities?.length, 1);
  assert.equal(result.newComment?.content, "Great job!");
});

test("applyAddComment ignores empty comments without attachments", () => {
  const tasks = [initialTask];
  const result = applyAddComment(tasks, "task-1", "   ", dummyActor);
  assert.equal(result.nextTasks, tasks);
  assert.equal(result.newComment, undefined);
});

test("applyDeleteComment removes comment by id", () => {
  const withComment = applyAddComment([initialTask], "task-1", "Remove me", dummyActor);
  const commentId = withComment.newComment!.id;
  const deleted = applyDeleteComment(withComment.nextTasks, "task-1", commentId);
  const updated = deleted.nextTasks.find((t) => t.id === "task-1");
  assert.equal(updated?.comments?.length, 0);
});

test("applyAddChannelMessage appends new channel message", () => {
  const messages: ChannelMessage[] = [];
  const result = applyAddChannelMessage(messages, "general", "Hello team", dummyActor);
  assert.equal(result.nextMessages.length, 1);
  assert.equal(result.nextMessages[0].channelId, "general");
  assert.equal(result.nextMessages[0].content, "Hello team");
});

test("applyLogActivity prepends activity to task", () => {
  const result = applyLogActivity([initialTask], "task-1", "moved status", dummyActor);
  const updated = result.nextTasks.find((t) => t.id === "task-1");
  assert.equal(updated?.activities?.length, 1);
  assert.equal(updated?.activities?.[0].action, "moved status");
  assert.equal(updated?.activities?.[0].userName, "Alice");
});
