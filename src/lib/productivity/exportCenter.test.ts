import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { buildMousCsv, buildPlacementsCsv, buildPrintHtml, buildReportsCsv, buildTasksCsv, buildTasksPrint, toCsv } from "./exportCenter.ts";

test("toCsv quotes commas, quotes, and newlines (RFC-4180)", () => {
  const csv = toCsv([
    ["a", "b,c", 'd"e', "f\ng"],
    ["1", "2", "3", "4"],
  ]);
  assert.ok(csv.includes('"b,c"'));
  assert.ok(csv.includes('"d""e"'));
  assert.ok(csv.includes('"f\ng"'));
});

test("report / placement / MOU / task CSV builders emit header + rows", () => {
  const reports = buildReportsCsv([
    {
      id: "r1",
      month: "September",
      year: 2026,
      summary: { totalActivities: 5, completionRate: 80 },
      achievements: ["Launched X"],
      keyIssues: [],
      actionPlans: [],
    },
  ]);
  assert.equal(reports[0][0], "Period");
  assert.equal(reports[1][0], "September 2026");

  const placements = buildPlacementsCsv([
    { id: "p1", status: "DONE", outlet: { name: "Toko A" }, cost: 100 },
  ]);
  assert.equal(placements[0][0], "Outlet");
  assert.equal(placements[1][0], "Toko A");

  const mous = buildMousCsv([
    { id: "m1", partnerName: "Acme", status: "APPROVED" },
  ]);
  assert.equal(mous[0][0], "Partner");
  assert.equal(mous[1][0], "Acme");

  const tasks = buildTasksCsv([
    { id: "t1", title: "Fix login", statusId: "s1", priority: "high" },
  ]);
  assert.equal(tasks[0][0], "Title");
  assert.equal(tasks[1][0], "Fix login");
});

test("buildPrintHtml escapes content and renders a full document", () => {
  const html = buildPrintHtml({
    title: "MOUs <Summary>",
    tables: [{ heading: "Rows", columns: ["A"], rows: [["<x>"]] }],
  });
  assert.match(html, /<!DOCTYPE html>/);
  assert.ok(!html.includes("MOUs <Summary>"));
  assert.ok(html.includes("&lt;x&gt;"));
});

test("buildTasksPrint summarizes the batch selection", () => {
  const html = buildTasksPrint([
    { id: "t1", title: "Fix login", statusId: "s1", priority: "high" },
  ]);
  assert.match(html, /Selected Tasks/);
  assert.ok(html.includes("Fix login"));
});
