import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { canTransitionMou } from "./mouMachine.ts";

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
