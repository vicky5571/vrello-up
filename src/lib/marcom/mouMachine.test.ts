import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionMou, MOU_STATUSES } from "@/lib/marcom/mouMachine";

test("mou approval lifecycle and revision loops", () => {
  assert.equal(canTransitionMou("DRAFT", "SUBMITTED"), true);
  assert.equal(canTransitionMou("SUBMITTED", "APPROVED"), true);
  assert.equal(canTransitionMou("SUBMITTED", "REJECTED"), true);
  assert.equal(canTransitionMou("SUBMITTED", "DRAFT"), true);
  assert.equal(canTransitionMou("REJECTED", "DRAFT"), true);
  assert.equal(canTransitionMou("APPROVED", "DONE"), true);
});

test("mou illegal jumps are rejected", () => {
  assert.equal(canTransitionMou("DRAFT", "APPROVED"), false);
  assert.equal(canTransitionMou("DRAFT", "DONE"), false);
  assert.equal(canTransitionMou("SUBMITTED", "DONE"), false);
  assert.equal(canTransitionMou("APPROVED", "REJECTED"), false);
  assert.equal(canTransitionMou("REJECTED", "APPROVED"), false);
  assert.equal(canTransitionMou("DONE", "DRAFT"), false);
  assert.equal(canTransitionMou("DONE", "APPROVED"), false);
});

test("mou status allowlist excludes ON_PROGRESS", () => {
  assert.ok(!MOU_STATUSES.includes("ON_PROGRESS" as never));
  assert.deepEqual([...MOU_STATUSES].sort(), ["APPROVED", "DONE", "DRAFT", "REJECTED", "SUBMITTED"]);
});
