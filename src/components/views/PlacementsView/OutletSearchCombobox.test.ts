import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCoordinates,
  extractRecentPlacementMaterials,
  getBrandBadgeMeta,
} from "@/components/views/PlacementsView/outletSearchComboboxHelpers";

test("formatCoordinates formats valid GPS coordinates with 5 decimals", () => {
  const res = formatCoordinates(-6.99, 110.42);
  assert.equal(res.isSet, true);
  assert.equal(res.text, "-6.99000, 110.42000");
});

test("formatCoordinates flags missing or invalid coordinates", () => {
  const missingBoth = formatCoordinates(null, null);
  assert.equal(missingBoth.isSet, false);
  assert.equal(missingBoth.text, "Titik GPS belum diatur");

  const missingLat = formatCoordinates(undefined, 110.42);
  assert.equal(missingLat.isSet, false);

  const missingLng = formatCoordinates(-6.99, undefined);
  assert.equal(missingLng.isSet, false);

  // Out of latitude range (-90 to 90)
  const outOfRangeLat = formatCoordinates(95.0, 110.42);
  assert.equal(outOfRangeLat.isSet, false);
  assert.equal(outOfRangeLat.text, "Titik GPS belum diatur");

  // Out of longitude range (-180 to 180)
  const outOfRangeLng = formatCoordinates(-6.99, 195.0);
  assert.equal(outOfRangeLng.isSet, false);
  assert.equal(outOfRangeLng.text, "Titik GPS belum diatur");
});

test("extractRecentPlacementMaterials deduplicates and extracts names and types", () => {
  const placements = [
    { id: "p1", material: { name: "Poster", type: "POSTER" } },
    { id: "p2", material: { name: "Shopblind", type: "SHOP_BLIND" } },
    { id: "p3", material: { name: "Poster", type: "POSTER" } }, // Duplicate
    { id: "p4", material: { type: "STICKER" } }, // Fallback to type
    { id: "p5", material: null },
    { id: "p6" },
  ];

  const tags = extractRecentPlacementMaterials(placements);
  assert.deepEqual(tags, ["Poster", "Shopblind", "STICKER"]);
});

test("extractRecentPlacementMaterials handles empty or undefined placements gracefully", () => {
  assert.deepEqual(extractRecentPlacementMaterials(null), []);
  assert.deepEqual(extractRecentPlacementMaterials(undefined), []);
  assert.deepEqual(extractRecentPlacementMaterials([]), []);
});

test("getBrandBadgeMeta parses and classifies brands accurately", () => {
  assert.equal(getBrandBadgeMeta(null), null);
  assert.equal(getBrandBadgeMeta(""), null);
  assert.equal(getBrandBadgeMeta("   "), null);

  const im3 = getBrandBadgeMeta("IM3");
  assert.notEqual(im3, null);
  assert.equal(im3?.isIM3, true);
  assert.equal(im3?.is3, false);
  assert.equal(im3?.normalizedBrand, "IM3");

  const tri1 = getBrandBadgeMeta("3");
  assert.notEqual(tri1, null);
  assert.equal(tri1?.is3, true);
  assert.equal(tri1?.isIM3, false);

  const tri2 = getBrandBadgeMeta("TRI");
  assert.notEqual(tri2, null);
  assert.equal(tri2?.is3, true);
  assert.equal(tri2?.isIM3, false);

  const custom = getBrandBadgeMeta("Indosat Ooredoo");
  assert.notEqual(custom, null);
  assert.equal(custom?.isIM3, false);
  assert.equal(custom?.is3, false);
  assert.equal(custom?.normalizedBrand, "Indosat Ooredoo");
});
