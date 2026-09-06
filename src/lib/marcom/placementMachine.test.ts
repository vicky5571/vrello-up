import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { canTransitionPlacement } from "./placementMachine.ts";

test("placement lifecycle", () => {
  assert.equal(canTransitionPlacement("NOT_STARTED", "ON_PROGRESS"), true);
  assert.equal(canTransitionPlacement("NOT_STARTED", "DONE"), false);
  assert.equal(canTransitionPlacement("ON_PROGRESS", "ISSUE"), true);
  assert.equal(canTransitionPlacement("DONE", "ON_PROGRESS"), false);
  assert.equal(canTransitionPlacement("DONE", "ISSUE"), false);
});
