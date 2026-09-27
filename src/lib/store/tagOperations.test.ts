import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { applyCreateTag, applyRenameTag, applyDeleteTag, applyToggleTaskTag } from "./tagOperations.ts";
import type { Tag, Task } from "../../types/index.ts";

const initialTask: Task = {
  id: "task-1",
  listId: "list-1",
  title: "Task with tags",
  description: "",
  statusId: "status-todo",
  priority: "normal",
  assignees: [],
  tags: [],
  subtasks: [],
  orderIndex: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

test("applyCreateTag appends tag to registry", () => {
  const tags: Tag[] = [];
  const result = applyCreateTag(tags, "Frontend", "#3B82F6");
  assert.equal(result.nextTags.length, 1);
  assert.equal(result.newTag.name, "Frontend");
  assert.equal(result.newTag.color, "#3B82F6");
});

test("applyRenameTag updates name in tag registry and attached tasks", () => {
  const tag1: Tag = { id: "tag-1", name: "Old", color: "#000" };
  const taskWithTag: Task = { ...initialTask, tags: [tag1] };

  const result = applyRenameTag([tag1], [taskWithTag], "tag-1", "New Name");
  assert.equal(result.nextTags[0].name, "New Name");
  assert.equal(result.nextTasks[0].tags[0].name, "New Name");
});

test("applyDeleteTag removes tag from registry and attached tasks", () => {
  const tag1: Tag = { id: "tag-1", name: "DeleteMe", color: "#000" };
  const taskWithTag: Task = { ...initialTask, tags: [tag1] };

  const result = applyDeleteTag([tag1], [taskWithTag], "tag-1");
  assert.equal(result.nextTags.length, 0);
  assert.equal(result.nextTasks[0].tags.length, 0);
});

test("applyToggleTaskTag adds tag when not present, removes when present", () => {
  const tag1: Tag = { id: "tag-1", name: "ToggleMe", color: "#000" };
  const result1 = applyToggleTaskTag([initialTask], [tag1], "task-1", "tag-1");
  assert.equal(result1.nextTasks[0].tags.length, 1);

  const result2 = applyToggleTaskTag(result1.nextTasks, [tag1], "task-1", "tag-1");
  assert.equal(result2.nextTasks[0].tags.length, 0);
});
