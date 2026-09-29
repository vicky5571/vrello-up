import test from "node:test";
import assert from "node:assert/strict";
import {
  PLACEMENT_STATUS_ORDER,
  comparePlacementStatus,
  comparePlacementDates,
} from "./placementSortingHelpers";
import type { PlacementStatus } from "@/types";

test("PLACEMENT_STATUS_ORDER reflects field operational lifecycle", () => {
  assert.equal(PLACEMENT_STATUS_ORDER["NOT_STARTED"], 1);
  assert.equal(PLACEMENT_STATUS_ORDER["ON_PROGRESS"], 2);
  assert.equal(PLACEMENT_STATUS_ORDER["ISSUE"], 3);
  assert.equal(PLACEMENT_STATUS_ORDER["DONE"], 4);
});

test("comparePlacementStatus orders by workflow stage rather than alphabet", () => {
  const statuses: PlacementStatus[] = ["DONE", "ISSUE", "NOT_STARTED", "ON_PROGRESS"];
  statuses.sort(comparePlacementStatus);
  assert.deepEqual(statuses, ["NOT_STARTED", "ON_PROGRESS", "ISSUE", "DONE"]);
});

test("comparePlacementDates orders timestamps chronologically handling nulls safely", () => {
  const dates = ["2026-09-20", null, "2026-09-28", undefined, "2026-09-15"];
  dates.sort(comparePlacementDates);
  assert.deepEqual(dates, ["2026-09-15", "2026-09-20", "2026-09-28", null, undefined]);
});
