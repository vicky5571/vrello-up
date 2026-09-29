import test from "node:test";
import assert from "node:assert/strict";
import { compareMouStatus, MOU_STATUS_ORDER, MOU_SEARCH_KEYS } from "./mouSortingHelpers";
import type { MouStatus } from "@/types";

test("MOU_STATUS_ORDER prioritizes workflow lifecycle", () => {
  assert.equal(MOU_STATUS_ORDER["DRAFT"], 1);
  assert.equal(MOU_STATUS_ORDER["SUBMITTED"], 2);
  assert.equal(MOU_STATUS_ORDER["APPROVED"], 3);
  assert.equal(MOU_STATUS_ORDER["DONE"], 4);
  assert.equal(MOU_STATUS_ORDER["REJECTED"], 5);
});

test("compareMouStatus sorts statuses by operational lifecycle, not alphabetically", () => {
  const statuses: MouStatus[] = ["REJECTED", "APPROVED", "DRAFT", "DONE", "SUBMITTED"];
  statuses.sort(compareMouStatus);
  assert.deepEqual(statuses, ["DRAFT", "SUBMITTED", "APPROVED", "DONE", "REJECTED"]);
});

test("MOU_SEARCH_KEYS includes critical operational search fields", () => {
  assert.ok(MOU_SEARCH_KEYS.includes("partnerName"));
  assert.ok(MOU_SEARCH_KEYS.includes("outletName"));
  assert.ok(MOU_SEARCH_KEYS.includes("mouType"));
  assert.ok(MOU_SEARCH_KEYS.includes("picName"));
});
