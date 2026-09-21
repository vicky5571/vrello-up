import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { MarcomPlacement, Branch } from "@/types";
import {
  getAvailableQuarters,
  calculateQuarterKpis,
  buildQuarterlyMatrix,
  calculateBranchBreakdown,
} from "@/lib/marcom/posmQuarterlyAnalytics";

const mockMaterials = [
  { id: "mat-poster", name: "Poster" },
  { id: "mat-blind", name: "Shop Blind" },
  { id: "mat-sign", name: "Shop Sign" },
];

const mockBranches: Branch[] = [
  { id: "br-smg", name: "Semarang", code: "SMG", city: "Semarang", region: "Jateng", picName: "Budi", picPhone: "0812", address: "Jl. Pemuda" },
  { id: "br-slo", name: "Solo", code: "SLO", city: "Surakarta", region: "Jateng", picName: "Siti", picPhone: "0813", address: "Jl. Slamet Riyadi" },
];

const mockPlacements: MarcomPlacement[] = [
  {
    id: "p1",
    outletId: "out-1",
    materialId: "mat-poster",
    status: "DONE",
    date: "2026-08-01",
    picName: "Sales 1",
    photoUrl: "",
    dimensions: "",
    quarter: "Q3 2026",
    campaignTheme: "Product Hero",
    isLocationValid: true,
    locationDeviation: 20,
    cost: 0,
    notes: "",
    outlet: { id: "out-1", code: "O-01", name: "Toko 1", branchId: "br-smg" },
  },
  {
    id: "p2",
    outletId: "out-2",
    materialId: "mat-poster",
    status: "DONE",
    date: "2026-08-05",
    picName: "Sales 2",
    photoUrl: "",
    dimensions: "",
    quarter: "Q3 2026",
    campaignTheme: "Product Hero",
    isLocationValid: true,
    locationDeviation: 40,
    cost: 0,
    notes: "",
    outlet: { id: "out-2", code: "O-02", name: "Toko 2", branchId: "br-smg" },
  },
  {
    id: "p3",
    outletId: "out-3",
    materialId: "mat-blind",
    status: "DONE",
    date: "2026-08-10",
    picName: "Sales 3",
    photoUrl: "",
    dimensions: "",
    quarter: "Q3 2026",
    campaignTheme: "Gemini",
    isLocationValid: false,
    locationDeviation: 150,
    cost: 500000,
    notes: "",
    outlet: { id: "out-3", code: "O-03", name: "Toko 3", branchId: "br-slo" },
  },
  {
    id: "p4",
    outletId: "out-1",
    materialId: "mat-sign",
    status: "NOT_STARTED",
    date: "2026-08-15",
    picName: "Sales 1",
    photoUrl: "",
    dimensions: "",
    quarter: "Q3 2026",
    campaignTheme: "", // empty theme -> should fall back to "Reguler / Tanpa Tema"
    isLocationValid: true,
    locationDeviation: 10,
    cost: 0,
    notes: "",
    outlet: { id: "out-1", code: "O-01", name: "Toko 1", branchId: "br-smg" },
  },
  {
    id: "p5",
    outletId: "out-4",
    materialId: "mat-poster",
    status: "DONE",
    date: "2026-05-10",
    picName: "Sales 4",
    photoUrl: "",
    dimensions: "",
    quarter: "Q2 2026",
    campaignTheme: "Ramadhan Berkah",
    isLocationValid: true,
    locationDeviation: 15,
    cost: 0,
    notes: "",
    outlet: { id: "out-4", code: "O-04", name: "Toko 4", branchId: "br-smg" },
  },
];

describe("posmQuarterlyAnalytics", () => {
  describe("getAvailableQuarters", () => {
    it("extracts unique quarters chronologically and includes fallback", () => {
      const quarters = getAvailableQuarters(mockPlacements, "Q4 2026");
      assert.ok(quarters.includes("Q2 2026"));
      assert.ok(quarters.includes("Q3 2026"));
      assert.ok(quarters.includes("Q4 2026"));
      // No duplicates
      const unique = new Set(quarters);
      assert.equal(quarters.length, unique.size);
    });

    it("handles empty placements gracefully with fallback", () => {
      const quarters = getAvailableQuarters([], "Q3 2026");
      assert.deepEqual(quarters, ["Q3 2026"]);
    });
  });

  describe("calculateQuarterKpis", () => {
    it("computes accurate KPIs for a given quarter", () => {
      const targets = {
        "Product Hero": { "mat-poster": 10 },
        "Gemini": { "mat-blind": 5 },
      };
      const kpis = calculateQuarterKpis(mockPlacements, "Q3 2026", targets);

      // p1, p2, p3, p4 are in Q3 2026
      assert.equal(kpis.totalActual, 4);
      assert.equal(kpis.totalTarget, 15);
      assert.equal(kpis.completionRate, Math.round((4 / 15) * 100)); // 27%
      assert.equal(kpis.validLocationCount, 3); // p1, p2, p4 are valid
      assert.equal(kpis.validLocationPercentage, 75); // 3/4 = 75%
      assert.equal(kpis.averageDeviationMeters, Math.round((20 + 40 + 150 + 10) / 4)); // 55m
      assert.equal(kpis.activeOutletsCount, 3); // out-1 (twice), out-2, out-3 -> 3 unique outlets
    });

    it("safely handles zero targets and empty quarter without NaN", () => {
      const kpis = calculateQuarterKpis(mockPlacements, "Q1 2025");
      assert.equal(kpis.totalActual, 0);
      assert.equal(kpis.totalTarget, 0);
      assert.equal(kpis.completionRate, 0);
      assert.equal(kpis.validLocationPercentage, 0);
      assert.equal(kpis.averageDeviationMeters, 0);
      assert.equal(kpis.activeOutletsCount, 0);
    });

    it("filters by branch when branchId is provided", () => {
      const kpisSemarang = calculateQuarterKpis(mockPlacements, "Q3 2026", undefined, "br-smg");
      assert.equal(kpisSemarang.totalActual, 3); // p1, p2, p4
      assert.equal(kpisSemarang.validLocationCount, 3);
      assert.equal(kpisSemarang.validLocationPercentage, 100);
    });
  });

  describe("buildQuarterlyMatrix", () => {
    it("builds 2D matrix with themes as rows and materials as columns", () => {
      const targets = {
        "Product Hero": { "mat-poster": 2 },
        "Gemini": { "mat-blind": 2 },
      };

      const matrix = buildQuarterlyMatrix(mockPlacements, mockMaterials, "Q3 2026", targets);
      assert.equal(matrix.quarter, "Q3 2026");
      assert.equal(matrix.materials.length, 3);

      // Rows check
      const themes = matrix.rows.map((r) => r.theme);
      assert.ok(themes.includes("Product Hero"));
      assert.ok(themes.includes("Gemini"));
      assert.ok(themes.includes("Reguler / Tanpa Tema"));

      const heroRow = matrix.rows.find((r) => r.theme === "Product Hero");
      assert.ok(heroRow);
      assert.equal(heroRow.cells["mat-poster"]?.actual, 2);
      assert.equal(heroRow.cells["mat-poster"]?.target, 2);
      assert.equal(heroRow.cells["mat-poster"]?.percentage, 100);
      assert.equal(heroRow.cells["mat-blind"]?.actual, 0);

      // Column totals check
      assert.equal(matrix.columnTotals["mat-poster"]?.actual, 2);
      assert.equal(matrix.columnTotals["mat-blind"]?.actual, 1);
      assert.equal(matrix.columnTotals["mat-sign"]?.actual, 1);

      // Grand totals check
      assert.equal(matrix.grandTotalActual, 4);
      assert.equal(matrix.grandTotalTarget, 4);
      assert.equal(matrix.grandTotalPercentage, 100);
    });
  });

  describe("calculateBranchBreakdown", () => {
    it("aggregates placements, targets, and GPS integrity per branch", () => {
      const branchTargets = { "br-smg": 5, "br-slo": 2 };
      const breakdown = calculateBranchBreakdown(mockPlacements, mockBranches, "Q3 2026", branchTargets);

      assert.equal(breakdown.length, 2);

      const smg = breakdown.find((b) => b.branchId === "br-smg");
      assert.ok(smg);
      assert.equal(smg.totalPlacements, 3);
      assert.equal(smg.targetPlacements, 5);
      assert.equal(smg.percentage, 60); // 3/5
      assert.equal(smg.validGpsCount, 3);
      assert.equal(smg.gpsIntegrityRate, 100);
      assert.equal(smg.topTheme, "Product Hero");

      const slo = breakdown.find((b) => b.branchId === "br-slo");
      assert.ok(slo);
      assert.equal(slo.totalPlacements, 1);
      assert.equal(slo.validGpsCount, 0);
      assert.equal(slo.gpsIntegrityRate, 0);
      assert.equal(slo.topTheme, "Gemini");
    });
  });
});
