import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { matchesFilters } from "./filterTasks.ts";
import type { FilterOptions, Status, Task } from "../../types/index.ts";

const open: Status = { id: "s-open", name: "To Do", color: "#000", category: "open", order: 0 };
const progress: Status = { id: "s-prog", name: "In Progress", color: "#000", category: "in_progress", order: 1 };
const done: Status = { id: "s-done", name: "Done", color: "#000", category: "done", order: 2 };
const closed: Status = { id: "s-closed", name: "Closed", color: "#000", category: "closed", order: 3 };
const statuses = [open, progress, done, closed];

const alice = { id: "u-1", name: "Alice", email: "a@x.test", avatar: "" };
const tagFe = { id: "tag-fe", name: "Frontend", color: "#000" };

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t-1",
    listId: "l-1",
    title: "Fix login bug",
    description: "Users cannot log in",
    statusId: "s-open",
    priority: "high",
    assignees: [alice],
    tags: [tagFe],
    subtasks: [],
    orderIndex: 0,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function filters(overrides: Partial<FilterOptions> = {}): FilterOptions {
  return {
    search: "",
    statusIds: [],
    priorities: [],
    assigneeIds: [],
    tagIds: [],
    showClosed: true,
    groupBy: "status",
    ...overrides,
  };
}

test("matchesFilters passes open and closed tasks when showClosed is true", () => {
  assert.equal(matchesFilters(task(), filters(), statuses), true);
  assert.equal(
    matchesFilters(task({ statusId: "s-done" }), filters(), statuses),
    true,
  );
});

test("matchesFilters hides done and closed tasks when showClosed is false", () => {
  const f = filters({ showClosed: false });
  assert.equal(matchesFilters(task({ statusId: "s-done" }), f, statuses), false);
  assert.equal(
    matchesFilters(task({ statusId: "s-closed" }), f, statuses),
    false,
  );
  assert.equal(matchesFilters(task({ statusId: "s-prog" }), f, statuses), true);
});

test("matchesFilters applies the search query to title and description", () => {
  assert.equal(matchesFilters(task(), filters({ search: "login" }), statuses), true);
  assert.equal(
    matchesFilters(task(), filters({ search: "cannot log" }), statuses),
    true,
  );
  assert.equal(
    matchesFilters(task(), filters({ search: "checkout" }), statuses),
    false,
  );
});

test("matchesFilters applies priority, status, and tag filters", () => {
  assert.equal(
    matchesFilters(task(), filters({ priorities: ["high"] }), statuses),
    true,
  );
  assert.equal(
    matchesFilters(task(), filters({ priorities: ["urgent"] }), statuses),
    false,
  );
  assert.equal(
    matchesFilters(task(), filters({ statusIds: ["s-open"] }), statuses),
    true,
  );
  assert.equal(
    matchesFilters(task(), filters({ statusIds: ["s-done"] }), statuses),
    false,
  );
  assert.equal(
    matchesFilters(task(), filters({ tagIds: ["tag-fe"] }), statuses),
    true,
  );
  assert.equal(
    matchesFilters(task(), filters({ tagIds: ["tag-missing"] }), statuses),
    false,
  );
});

test("matchesFilters applies assignee filters including unassigned", () => {
  assert.equal(
    matchesFilters(task(), filters({ assigneeIds: ["u-1"] }), statuses),
    true,
  );
  assert.equal(
    matchesFilters(task(), filters({ assigneeIds: ["u-2"] }), statuses),
    false,
  );
  assert.equal(
    matchesFilters(task({ assignees: [] }), filters({ assigneeIds: ["u-1"] }), statuses),
    false,
  );
  assert.equal(
    matchesFilters(
      task({ assignees: [] }),
      filters({ assigneeIds: ["unassigned"] }),
      statuses,
    ),
    true,
  );
  assert.equal(
    matchesFilters(task(), filters({ assigneeIds: ["unassigned"] }), statuses),
    false,
  );
});
