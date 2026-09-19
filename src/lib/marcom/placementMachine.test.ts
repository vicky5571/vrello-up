import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionPlacement, validatePlacementUpdate } from "@/lib/marcom/placementMachine";

test("placement lifecycle", () => {
  assert.equal(canTransitionPlacement("NOT_STARTED", "ON_PROGRESS"), true);
  assert.equal(canTransitionPlacement("NOT_STARTED", "DONE"), false);
  assert.equal(canTransitionPlacement("ON_PROGRESS", "ISSUE"), true);
  assert.equal(canTransitionPlacement("DONE", "ON_PROGRESS"), false);
  assert.equal(canTransitionPlacement("DONE", "ISSUE"), false);
});

test("validatePlacementUpdate enforces photo proof and physical location for DONE status", () => {
  // Reject DONE if photoUrl is missing or empty even with valid coords
  const withoutPhoto = validatePlacementUpdate("ON_PROGRESS", "DONE", {
    photoUrl: "",
    latitude: -6.2088,
    longitude: 106.8456,
  });
  assert.equal(withoutPhoto.valid, false);
  assert.ok(withoutPhoto.error?.includes("photoUrl"));

  const withNullPhoto = validatePlacementUpdate("ON_PROGRESS", "DONE", {
    photoUrl: null,
    latitude: -6.2088,
    longitude: 106.8456,
  });
  assert.equal(withNullPhoto.valid, false);

  // Reject DONE if photoUrl is present but location is completely missing
  const withoutLocation = validatePlacementUpdate("ON_PROGRESS", "DONE", {
    photoUrl: "https://example.com/photos/placement-123.jpg",
  });
  assert.equal(withoutLocation.valid, false);
  assert.ok(withoutLocation.error?.includes("lokasi"));

  // Reject DONE if coordinates are invalid out of bounds
  const withInvalidCoords = validatePlacementUpdate("ON_PROGRESS", "DONE", {
    photoUrl: "https://example.com/photos/placement-123.jpg",
    latitude: 999,
    longitude: 999,
  });
  assert.equal(withInvalidCoords.valid, false);
  assert.ok(withInvalidCoords.error?.includes("lokasi"));

  // Accept DONE if photoUrl and valid GPS coordinates are present
  const withCoords = validatePlacementUpdate("ON_PROGRESS", "DONE", {
    photoUrl: "https://example.com/photos/placement-123.jpg",
    latitude: -6.2088,
    longitude: 106.8456,
  });
  assert.equal(withCoords.valid, true);

  // Accept DONE if photoUrl and shareLocationUrl are present
  const withShareUrl = validatePlacementUpdate("ON_PROGRESS", "DONE", {
    photoUrl: "https://example.com/photos/placement-123.jpg",
    shareLocationUrl: "https://maps.app.goo.gl/example",
  });
  assert.equal(withShareUrl.valid, true);
});

test("validatePlacementUpdate enforces notes for ISSUE status", () => {
  // Reject ISSUE if notes is missing or empty
  const withoutNotes = validatePlacementUpdate("ON_PROGRESS", "ISSUE", {
    notes: "",
  });
  assert.equal(withoutNotes.valid, false);
  assert.ok(withoutNotes.error?.includes("notes"));

  const withNullNotes = validatePlacementUpdate("ON_PROGRESS", "ISSUE", {
    notes: null,
  });
  assert.equal(withNullNotes.valid, false);

  // Accept ISSUE if notes is provided
  const withNotes = validatePlacementUpdate("ON_PROGRESS", "ISSUE", {
    notes: "Toko sedang renovasi, pemilik meminta tunda 2 minggu",
  });
  assert.equal(withNotes.valid, true);
});

test("validatePlacementUpdate rejects illegal state transitions", () => {
  const illegal = validatePlacementUpdate("NOT_STARTED", "DONE", {
    photoUrl: "https://example.com/photo.jpg",
  });
  assert.equal(illegal.valid, false);
  assert.ok(illegal.error?.includes("Illegal status transition"));
});
