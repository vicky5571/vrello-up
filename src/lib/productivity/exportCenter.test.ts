import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMousCsv,
  buildPlacementsCsv,
  buildPrintHtml,
  buildReportsCsv,
  buildSingleMonthlyReportPrint,
  buildTasksCsv,
  buildTasksPrint,
  toCsv,
} from "@/lib/productivity/exportCenter";

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

test("buildSingleMonthlyReportPrint renders full executive briefing layout", () => {
  const html = buildSingleMonthlyReportPrint({
    month: "September",
    year: 2026,
    summary: {
      totalActivities: 12,
      completionRate: 85,
      placementsDone: 6,
      placementsTotal: 8,
      placementTotalCost: 7500000,
      mousApproved: 2,
      mouTotalCompensation: 12000000,
      eventsCompleted: 2,
      eventsTotal: 2,
      eventsTotalAttendees: 1500,
      contentPublished: 4,
    },
    achievements: ["Realisasi POSM mencapai 75% target wilayah"],
    keyIssues: ["Kendala perizinan neon box di 2 titik"],
    actionPlans: ["Koordinasi ulang dengan dinas perizinan"],
    activities: [
      {
        type: "PLACEMENT",
        title: "Neon Box Toko Maju",
        status: "DONE",
        date: "2026-09-15",
        detail: "Biaya: Rp 2.500.000",
      },
    ],
  }, { workspaceName: "Indosat Ooredoo Hutchison" });

  assert.match(html, /Laporan Eksekutif Bulanan/);
  assert.match(html, /Periode: September 2026/);
  assert.match(html, /Indosat Ooredoo Hutchison/);
  assert.match(html, /Realisasi POSM mencapai 75%/);
  assert.match(html, /Kendala perizinan neon box/);
  assert.match(html, /Koordinasi ulang dengan dinas perizinan/);
  assert.match(html, /Neon Box Toko Maju/);
  assert.match(html, /Disusun Oleh/);
  assert.match(html, /Disetujui Oleh/);
});

test("buildSingleMonthlyReportPrint handles minimal or empty dataset gracefully with fallbacks", () => {
  const html = buildSingleMonthlyReportPrint({
    month: "Oktober",
    year: 2026,
  });

  assert.match(html, /Laporan Eksekutif Bulanan/);
  assert.match(html, /Periode: Oktober 2026/);
  assert.match(html, /Belum ada pencapaian operasional yang selesai/);
  assert.match(html, /Seluruh kegiatan operasional berjalan lancar/);
  assert.match(html, /Tidak ada rencana tindak lanjut khusus/);
});
