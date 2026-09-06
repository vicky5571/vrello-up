import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { summarizeReports } from "./analytics.ts";

const rows = [
  { month: "July 2026", summary: { totalActivities: 10, completionRate: 80 } },
  { month: "August 2026", summary: { totalActivities: 20, completionRate: 60 } },
  { month: "September 2026", summary: { totalActivities: 30, completionRate: 60 } },
];

test("summarizeReports totals reports and averages completion", () => {
  assert.deepEqual(summarizeReports(rows), {
    total: 3,
    totalActivities: 60,
    completionRate: 67,
  });
});
