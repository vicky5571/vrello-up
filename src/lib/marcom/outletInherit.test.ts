import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { findOutletCoordinates } from "./outletInherit.ts";

test("findOutletCoordinates returns null for empty or invalid outletId", () => {
  assert.equal(findOutletCoordinates("", []), null);
  assert.equal(findOutletCoordinates("out-1", []), null);
});

test("findOutletCoordinates finds existing valid coordinates from previous placements", () => {
  const placements = [
    {
      id: "p1",
      outletId: "outlet-101",
      latitude: -6.2088,
      longitude: 106.8456,
      shareLocationUrl: "https://maps.google.com/?q=-6.2088,106.8456",
      locationNotes: "Sebelah Alfamart",
    },
    {
      id: "p2",
      outletId: "outlet-102",
      latitude: null,
      longitude: null,
    },
  ];

  const found = findOutletCoordinates("outlet-101", placements);
  assert.ok(found);
  assert.equal(found.latitude, -6.2088);
  assert.equal(found.longitude, 106.8456);
  assert.equal(found.shareLocationUrl, "https://maps.google.com/?q=-6.2088,106.8456");
  assert.equal(found.locationNotes, "Sebelah Alfamart");
});

test("findOutletCoordinates ignores placements with invalid coordinates", () => {
  const placements = [
    {
      id: "p1",
      outletId: "outlet-101",
      latitude: null,
      longitude: null,
    },
    {
      id: "p2",
      outletId: "outlet-101",
      latitude: 999, // invalid latitude
      longitude: 106.8456,
    },
  ];

  const found = findOutletCoordinates("outlet-101", placements);
  assert.equal(found, null);
});
