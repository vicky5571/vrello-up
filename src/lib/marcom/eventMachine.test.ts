import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionEvent, EVENT_STATUSES } from "@/lib/marcom/eventMachine";

test("event lifecycle happy paths and reactivation loops", () => {
  assert.equal(canTransitionEvent("UPCOMING", "ON_PROGRESS"), true);
  assert.equal(canTransitionEvent("ON_PROGRESS", "COMPLETED"), true);
  assert.equal(canTransitionEvent("UPCOMING", "CANCELLED"), true);
  assert.equal(canTransitionEvent("ON_PROGRESS", "CANCELLED"), true);
  assert.equal(canTransitionEvent("CANCELLED", "UPCOMING"), true);
});

test("event self-transitions (no-op) are always permitted", () => {
  assert.equal(canTransitionEvent("UPCOMING", "UPCOMING"), true);
  assert.equal(canTransitionEvent("ON_PROGRESS", "ON_PROGRESS"), true);
  assert.equal(canTransitionEvent("COMPLETED", "COMPLETED"), true);
  assert.equal(canTransitionEvent("CANCELLED", "CANCELLED"), true);
});

test("event illegal skips and terminal states are blocked", () => {
  // Cannot skip directly from UPCOMING to COMPLETED without being in progress
  assert.equal(canTransitionEvent("UPCOMING", "COMPLETED"), false);

  // COMPLETED is terminal
  assert.equal(canTransitionEvent("COMPLETED", "UPCOMING"), false);
  assert.equal(canTransitionEvent("COMPLETED", "ON_PROGRESS"), false);
  assert.equal(canTransitionEvent("COMPLETED", "CANCELLED"), false);

  // CANCELLED cannot jump directly to COMPLETED or ON_PROGRESS
  assert.equal(canTransitionEvent("CANCELLED", "COMPLETED"), false);
  assert.equal(canTransitionEvent("CANCELLED", "ON_PROGRESS"), false);
});

test("EVENT_STATUSES contains all 4 standard event statuses", () => {
  assert.deepEqual([...EVENT_STATUSES].sort(), [
    "CANCELLED",
    "COMPLETED",
    "ON_PROGRESS",
    "UPCOMING",
  ]);
});

