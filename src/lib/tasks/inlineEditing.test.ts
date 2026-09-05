import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { toggleAssigneeId } from "./inlineEditing.ts";

test("toggleAssigneeId adds and removes one assignee without duplicates", () => {
  assert.deepEqual(toggleAssigneeId([], "user-1"), ["user-1"]);
  assert.deepEqual(toggleAssigneeId(["user-1"], "user-1"), []);
  assert.deepEqual(toggleAssigneeId(["user-1", "user-2"], "user-1"), [
    "user-2",
  ]);
});
