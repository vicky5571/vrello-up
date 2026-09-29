import test from "node:test";
import assert from "node:assert/strict";
import { buildPlacementKpiItems } from "./placementKpi";
import type { MarcomPlacement } from "@/types";

test("buildPlacementKpiItems computes formatted card metrics", () => {
  const placements: Partial<MarcomPlacement>[] = [
    { status: "DONE", cost: 1500000, brand: "IM3" },
    { status: "ON_PROGRESS", cost: 500000, brand: "TRI" },
  ];

  const cards = buildPlacementKpiItems(placements as MarcomPlacement[]);
  assert.equal(cards.length, 4);
  assert.equal(cards[0].label, "Total Budget Terpakai");
  assert.ok(String(cards[0].value).includes("2.000.000"));
  assert.equal(cards[1].label, "Tingkat Penyelesaian");
  assert.equal(cards[1].value, "50%");
});
