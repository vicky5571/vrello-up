import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { canTransitionMou, MOU_STATUSES } from "./mouMachine.ts";

test("mou approval lifecycle", () => {
  assert.equal(canTransitionMou("DRAFT", "SUBMITTED"), true);
  assert.equal(canTransitionMou("SUBMITTED", "APPROVED"), true);
  assert.equal(canTransitionMou("SUBMITTED", "REJECTED"), true);
  assert.equal(canTransitionMou("APPROVED", "DONE"), true);
});

test("mou illegal jumps are rejected", () => {
  assert.equal(canTransitionMou("DRAFT", "APPROVED"), false);
  assert.equal(canTransitionMou("DRAFT", "DONE"), false);
  assert.equal(canTransitionMou("SUBMITTED", "DONE"), false);
  assert.equal(canTransitionMou("APPROVED", "REJECTED"), false);
  assert.equal(canTransitionMou("REJECTED", "APPROVED"), false);
  assert.equal(canTransitionMou("REJECTED", "DRAFT"), false);
  assert.equal(canTransitionMou("DONE", "DRAFT"), false);
  assert.equal(canTransitionMou("DONE", "APPROVED"), false);
});

test("mou status allowlist excludes ON_PROGRESS", () => {
  // Both mous routes validate POST/PATCH status against MOU_STATUSES and
  // return 400 for anything outside it, so ON_PROGRESS (which the machine
  // has no edges to/from) can never be written. Route handlers themselves
  // aren't unit-testable under the repo's node --test setup (they need a
  // live DB + Next runtime), so the allowlist membership is asserted here
  // at the narrowest testable seam.
  assert.ok(!MOU_STATUSES.includes("ON_PROGRESS" as never));
  assert.deepEqual([...MOU_STATUSES].sort(), ["APPROVED", "DONE", "DRAFT", "REJECTED", "SUBMITTED"]);
});
