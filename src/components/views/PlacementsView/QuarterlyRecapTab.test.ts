import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatTargetKey,
  getProgressBarColorClass,
  sanitizeDrillDownFilter,
} from "@/components/views/PlacementsView/quarterlyRecapHelpers";

describe("quarterlyRecapHelpers", () => {
  it("formats target storage key consistently", () => {
    assert.equal(formatTargetKey("ws-main", "Q3 2026"), "vrello_posm_targets_ws-main_Q3 2026");
    assert.equal(formatTargetKey("ws-1", "q2 2026"), "vrello_posm_targets_ws-1_q2 2026");
  });

  it("assigns accurate progress bar colors based on completion percentage", () => {
    assert.equal(getProgressBarColorClass(100), "bg-emerald-500");
    assert.equal(getProgressBarColorClass(85), "bg-emerald-500");
    assert.equal(getProgressBarColorClass(65), "bg-amber-500");
    assert.equal(getProgressBarColorClass(40), "bg-rose-500");
    assert.equal(getProgressBarColorClass(0), "bg-slate-300 dark:bg-slate-700");
  });

  it("sanitizes drill-down parameters cleanly", () => {
    const filter = sanitizeDrillDownFilter({
      quarter: " Q3 2026 ",
      campaignTheme: "Product Hero",
      materialId: "mat-poster",
      materialName: "Poster",
    });

    assert.equal(filter.quarter, "Q3 2026");
    assert.equal(filter.campaignTheme, "Product Hero");
    assert.equal(filter.materialId, "mat-poster");
    assert.equal(filter.materialName, "Poster");
  });

  it("handles fallback theme when campaignTheme is empty or default", () => {
    const filter = sanitizeDrillDownFilter({
      quarter: "Q3 2026",
      campaignTheme: "Reguler / Tanpa Tema",
    });

    assert.equal(filter.quarter, "Q3 2026");
    assert.equal(filter.campaignTheme, ""); // empty string allows matching empty theme in table search
  });
});
