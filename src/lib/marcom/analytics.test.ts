import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { compareReportPeriodAsc, summarizeReports } from "./analytics.ts";

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

test("report periods sort in calendar order, not alphabetical", () => {
  // Alphabetical (localeCompare) would yield April, December, February,
  // September; calendar order must place September after April and keep
  // December 2025 (older year) first.
  const rows = [
    { month: "September 2026", year: 2026 },
    { month: "April 2026", year: 2026 },
    { month: "December 2025", year: 2025 },
    { month: "February 2026", year: 2026 },
  ];
  const sorted = [...rows].sort(compareReportPeriodAsc).map((r) => r.month);
  assert.deepEqual(sorted, [
    "December 2025",
    "February 2026",
    "April 2026",
    "September 2026",
  ]);
});
