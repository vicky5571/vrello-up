import test from "node:test";
import assert from "node:assert/strict";
import {
  extractPlacementSearchText,
  PLACEMENT_SEARCH_KEYS,
} from "./placementSearchHelpers.ts";
import type { MarcomPlacement } from "@/types";

test("extractPlacementSearchText indexes essential operational fields without technical IDs", () => {
  const sample: Partial<MarcomPlacement> = {
    id: "plc-9999",
    workspaceId: "ws-main",
    outletId: "out-1234",
    materialId: "mat-5678",
    picName: "Budi Santoso",
    dimensions: "200x100 cm",
    notes: "Dekat pintu masuk utama",
    locationNotes: "Di samping tiang listrik",
    brand: "IM3",
    status: "ON_PROGRESS",
    outlet: { id: "out-1234", name: "Toko Berkah Cellular", code: "SBY-042", brand: "IM3" },
    material: { id: "mat-5678", name: "Shopblind Outdoor", type: "TEMPORARY", requiresMou: false },
  };

  const text = extractPlacementSearchText(sample as MarcomPlacement);
  assert.ok(text.includes("budi santoso"));
  assert.ok(text.includes("toko berkah cellular"));
  assert.ok(text.includes("sby-042"));
  assert.ok(text.includes("shopblind outdoor"));
  assert.ok(text.includes("dekat pintu masuk utama"));
  assert.ok(!text.includes("plc-9999"));
  assert.ok(!text.includes("ws-main"));
});

test("PLACEMENT_SEARCH_KEYS contains expected key fields", () => {
  assert.deepEqual(PLACEMENT_SEARCH_KEYS, [
    "picName",
    "dimensions",
    "notes",
    "locationNotes",
  ]);
});
