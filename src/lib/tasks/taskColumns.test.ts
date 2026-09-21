import test from "node:test";
import assert from "node:assert/strict";
import { buildTaskGridTemplate } from "@/lib/tasks/taskColumns";
import type { VisibleFields } from "@/types";

function fields(overrides: Partial<VisibleFields> = {}): VisibleFields {
  return {
    assignees: true,
    priority: true,
    dueDate: true,
    tags: true,
    subtasks: true,
    ...overrides,
  };
}

test("buildTaskGridTemplate - full 8-track template when all columns visible", () => {
  const { gridTemplateColumns, minWidth } = buildTaskGridTemplate(fields());
  assert.equal(
    gridTemplateColumns,
    "28px 1fr 110px 110px 90px 130px 90px 60px",
  );
  assert.equal(minWidth, 28 + 110 + 110 + 90 + 130 + 90 + 60 + 32);
});

test("buildTaskGridTemplate - collapses hidden column tracks and shrinks minWidth", () => {
  const { gridTemplateColumns, minWidth } = buildTaskGridTemplate(
    fields({ assignees: false, priority: false, dueDate: false }),
  );
  assert.equal(gridTemplateColumns, "28px 1fr 130px 90px 60px");
  assert.equal(minWidth, 28 + 130 + 90 + 60 + 32);
});

test("buildTaskGridTemplate - subtasks/tags toggles do not affect tracks", () => {
  const base = buildTaskGridTemplate(fields());
  const toggled = buildTaskGridTemplate(
    fields({ subtasks: false, tags: false }),
  );
  assert.deepEqual(toggled, base);
});
