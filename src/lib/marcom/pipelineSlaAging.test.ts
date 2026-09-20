import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types runner requires explicit ts extension.
import { buildOutletPipelineRows, filterPipelineRows } from "./pipelineEngine.ts";

test("pipelineEngine computes critical SLA for expired and near-expiry MOUs", () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const expiredDate = new Date(now - 2 * dayMs).toISOString();
  const criticalDate = new Date(now + 5 * dayMs).toISOString(); // H-5
  const warningDate = new Date(now + 20 * dayMs).toISOString(); // H-20
  const safeDate = new Date(now + 60 * dayMs).toISOString(); // H-60

  const outlets = [
    {
      id: "out-expired",
      name: "Toko Expired",
      mous: [{ id: "m1", status: "APPROVED", endDate: expiredDate }],
      placements: [],
    },
    {
      id: "out-critical",
      name: "Toko Critical MoU",
      mous: [{ id: "m2", status: "APPROVED", endDate: criticalDate }],
      placements: [],
    },
    {
      id: "out-warning",
      name: "Toko Warning MoU",
      mous: [{ id: "m3", status: "APPROVED", endDate: warningDate }],
      placements: [],
    },
    {
      id: "out-safe",
      name: "Toko Safe",
      mous: [{ id: "m4", status: "APPROVED", endDate: safeDate }],
      placements: [],
    },
  ];

  const rows = buildOutletPipelineRows(outlets);

  const rowExpired = rows.find((r) => r.id === "out-expired")!;
  assert.equal(rowExpired.mouSummary.isExpired, true);
  assert.equal(rowExpired.urgencyLevel, "CRITICAL");
  assert.ok(rowExpired.urgencyReasons?.includes("MoU Kadaluwarsa"));

  const rowCritical = rows.find((r) => r.id === "out-critical")!;
  assert.equal(rowCritical.mouSummary.isExpiringSoon, true);
  assert.equal(rowCritical.urgencyLevel, "CRITICAL");
  assert.ok(rowCritical.mouSummary.daysLeft !== undefined && rowCritical.mouSummary.daysLeft <= 7);
  assert.match(rowCritical.urgencyReasons?.[0] || "", /MoU Berakhir H-/);

  const rowWarning = rows.find((r) => r.id === "out-warning")!;
  assert.equal(rowWarning.mouSummary.isExpiringSoon, true);
  assert.equal(rowWarning.urgencyLevel, "WARNING");
  assert.ok(rowWarning.mouSummary.daysLeft !== undefined && rowWarning.mouSummary.daysLeft > 7);

  const rowSafe = rows.find((r) => r.id === "out-safe")!;
  assert.equal(rowSafe.mouSummary.isExpiringSoon, false);
  assert.equal(rowSafe.urgencyLevel, "NORMAL");
});

test("pipelineEngine computes SLA aging for blocked placements", () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const tenDaysAgo = new Date(now - 10 * dayMs).toISOString();
  const fourDaysAgo = new Date(now - 4 * dayMs).toISOString();

  const outlets = [
    {
      id: "out-stuck-critical",
      name: "Toko Stuck Critical",
      mous: [],
      placements: [
        { id: "p1", status: "ISSUE", updatedAt: tenDaysAgo },
      ],
    },
    {
      id: "out-stuck-warning",
      name: "Toko Stuck Warning",
      mous: [],
      placements: [
        { id: "p2", status: "ISSUE", updatedAt: fourDaysAgo },
      ],
    },
  ];

  const rows = buildOutletPipelineRows(outlets);

  const rowCrit = rows.find((r) => r.id === "out-stuck-critical")!;
  assert.equal(rowCrit.placementSummary.hasBlockedItems, true);
  assert.ok(rowCrit.placementSummary.maxAgingDays !== undefined && rowCrit.placementSummary.maxAgingDays >= 10);
  assert.equal(rowCrit.urgencyLevel, "CRITICAL");
  assert.match(rowCrit.urgencyReasons?.[0] || "", /POSM Tertahan/);

  const rowWarn = rows.find((r) => r.id === "out-stuck-warning")!;
  assert.equal(rowWarn.placementSummary.hasBlockedItems, true);
  assert.ok(rowWarn.placementSummary.maxAgingDays !== undefined && rowWarn.placementSummary.maxAgingDays >= 4);
  assert.equal(rowWarn.urgencyLevel, "WARNING");
});

test("filterPipelineRows filters accurately by urgencyLevel", () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const rows = buildOutletPipelineRows([
    {
      id: "o1",
      name: "Critical Shop",
      mous: [{ id: "m1", status: "APPROVED", endDate: new Date(now + 2 * dayMs).toISOString() }],
      placements: [],
    },
    {
      id: "o2",
      name: "Warning Shop",
      mous: [{ id: "m2", status: "APPROVED", endDate: new Date(now + 20 * dayMs).toISOString() }],
      placements: [],
    },
    {
      id: "o3",
      name: "Normal Shop",
      mous: [{ id: "m3", status: "APPROVED", endDate: new Date(now + 90 * dayMs).toISOString() }],
      placements: [],
    },
  ]);

  const criticalOnly = filterPipelineRows(rows, { urgencyLevel: "CRITICAL" });
  assert.equal(criticalOnly.length, 1);
  assert.equal(criticalOnly[0].id, "o1");

  const warningOnly = filterPipelineRows(rows, { urgencyLevel: "WARNING" });
  assert.equal(warningOnly.length, 1);
  assert.equal(warningOnly[0].id, "o2");

  const all = filterPipelineRows(rows, { urgencyLevel: "ALL" });
  assert.equal(all.length, 3);
});

test("pipelineEngine safely handles malformed or null dates without crashing", () => {
  const rows = buildOutletPipelineRows([
    {
      id: "o-null",
      name: "Null Date Shop",
      mous: [{ id: "m-null", status: "APPROVED", endDate: "invalid-date-string" }],
      placements: [{ id: "p-null", status: "ISSUE", updatedAt: null as unknown as string }],
    },
  ]);

  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.placementSummary.hasBlockedItems, true);
  assert.equal(row.placementSummary.maxAgingDays, 0);
  assert.equal(row.urgencyLevel, "WARNING");
  assert.ok(row.urgencyReasons?.includes("POSM Terkendala"));
});
