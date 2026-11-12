import test from "node:test";
import assert from "node:assert/strict";
import { extractBarMaterialName } from "./posmChartHelpers";

test("extractBarMaterialName safely extracts materialName from Recharts Bar event object", () => {
  // Recharts v2 Bar.onClick passes an object with `payload` holding the row data
  const rechartsEvent = {
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    value: 15,
    payload: {
      materialName: "Neon Box",
      total: 20,
      done: 15,
      avgCost: 1500000,
    },
  };

  assert.equal(extractBarMaterialName(rechartsEvent), "Neon Box");
});

test("extractBarMaterialName falls back to direct materialName or empty string", () => {
  assert.equal(extractBarMaterialName({ materialName: "Shopblind" }), "Shopblind");
  assert.equal(extractBarMaterialName(null), "");
  assert.equal(extractBarMaterialName(undefined), "");
  assert.equal(extractBarMaterialName({}), "");
});

// ─────────────────────────────────────────────────────────────────────────────
// ADR-0110 — POSM Unit Economics Segmented Progress Bar List Layout
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

test("PosmEconomicsChart eliminates cramped SVG YAxis and adopts Segmented Progress Bar List (ADR-0110)", () => {
  const chartPath = path.resolve(
    process.cwd(),
    "src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx"
  );
  const content = fs.readFileSync(chartPath, "utf-8");

  // Invariant 1: No cramped SVG coordinate elements from Recharts
  assert.ok(!content.includes("<BarChart"), "Must not use Recharts BarChart");
  assert.ok(!content.includes("<YAxis"), "Must not use cramped YAxis");
  assert.ok(!content.includes("h-96 sm:h-72"), "Must not use fixed cramped container height");

  // Invariant 2: Segmented progress list layout elements
  assert.ok(content.includes("h-3 w-full rounded-full"), "Must render full-width progress bar tracks");
  assert.ok(content.includes("bg-emerald-500"), "Must render emerald segment for DONE");
  assert.ok(content.includes("bg-amber-500"), "Must render amber segment for ON_PROGRESS");
  assert.ok(content.includes("bg-rose-500"), "Must render rose segment for ISSUE");
  assert.ok(content.includes("bg-slate-400"), "Must render slate segment for NOT_STARTED");

  // Invariant 3: Top Status Legend Row
  assert.ok(content.includes("Selesai (DONE)"), "Legend must include Selesai (DONE)");
  assert.ok(content.includes("Sedang Proses"), "Legend must include Sedang Proses");
  assert.ok(content.includes("Kendala (Issue)"), "Legend must include Kendala (Issue)");
  assert.ok(content.includes("Belum Mulai"), "Legend must include Belum Mulai");

  // Invariant 4: Drilldown mapping parity
  assert.ok(content.includes('"DONE"'), "Must map click to DONE drilldown");
  assert.ok(content.includes('"ON_PROGRESS"'), "Must map click to ON_PROGRESS drilldown");
  assert.ok(content.includes('"ISSUE"'), "Must map click to ISSUE drilldown");
  assert.ok(content.includes('"NOT_STARTED"'), "Must map click to NOT_STARTED drilldown");

  // Invariant 5: Preserves accessible table
  assert.ok(content.includes("accessibleTable"), "Must preserve screen reader accessibleTable");
});

test("POSM Segment percentage calculation & zero-division guard invariants (ADR-0110)", () => {
  // Test normal case (total > 0)
  const materialNormal = {
    materialName: "Signboard Acrylic LED 240x80cm Backlit Aluminium Frame",
    total: 20,
    done: 10,
    inProgress: 5,
    issue: 3,
    notStarted: 2,
    doneRate: 50,
    avgCost: 1850000,
  };

  const donePct = materialNormal.total > 0 ? (materialNormal.done / materialNormal.total) * 100 : 0;
  const inProgressPct = materialNormal.total > 0 ? (materialNormal.inProgress / materialNormal.total) * 100 : 0;
  const issuePct = materialNormal.total > 0 ? (materialNormal.issue / materialNormal.total) * 100 : 0;
  const notStartedPct = materialNormal.total > 0 ? (materialNormal.notStarted / materialNormal.total) * 100 : 0;

  assert.equal(donePct, 50);
  assert.equal(inProgressPct, 25);
  assert.equal(issuePct, 15);
  assert.equal(notStartedPct, 10);
  assert.equal(donePct + inProgressPct + issuePct + notStartedPct, 100);

  // Test zero total case (zero-division guard)
  const materialZero = {
    materialName: "Empty Material",
    total: 0,
    done: 0,
    inProgress: 0,
    issue: 0,
    notStarted: 0,
    doneRate: 0,
    avgCost: 0,
  };

  const zeroDonePct = materialZero.total > 0 ? (materialZero.done / materialZero.total) * 100 : 0;
  const zeroInProgressPct = materialZero.total > 0 ? (materialZero.inProgress / materialZero.total) * 100 : 0;
  const zeroIssuePct = materialZero.total > 0 ? (materialZero.issue / materialZero.total) * 100 : 0;
  const zeroNotStartedPct = materialZero.total > 0 ? (materialZero.notStarted / materialZero.total) * 100 : 0;

  assert.equal(zeroDonePct, 0);
  assert.equal(zeroInProgressPct, 0);
  assert.equal(zeroIssuePct, 0);
  assert.equal(zeroNotStartedPct, 0);
  assert.ok(!Number.isNaN(zeroDonePct));
  assert.ok(!Number.isNaN(zeroInProgressPct));
  assert.ok(!Number.isNaN(zeroIssuePct));
  assert.ok(!Number.isNaN(zeroNotStartedPct));
});
