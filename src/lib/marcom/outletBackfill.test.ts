import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires explicit .ts extension
import { extractValidCoordinates, shouldBackfillOutlet, autoBackfillOutletGps } from "./outletBackfill.ts";

test("extractValidCoordinates returns coordinates when valid numeric latitude and longitude provided", () => {
  const coords = extractValidCoordinates({ latitude: -6.2088, longitude: 106.8456 });
  assert.deepEqual(coords, { latitude: -6.2088, longitude: 106.8456 });
});

test("extractValidCoordinates extracts coordinates from shareLocationUrl if numbers are null", () => {
  const coords = extractValidCoordinates({
    latitude: null,
    longitude: null,
    shareLocationUrl: "https://maps.google.com/?q=-6.9175,107.6191",
  });
  assert.deepEqual(coords, { latitude: -6.9175, longitude: 107.6191 });
});

test("extractValidCoordinates returns null when coordinates are invalid or out of bounds", () => {
  assert.equal(extractValidCoordinates({ latitude: 120, longitude: 106.8 }), null);
  assert.equal(extractValidCoordinates({ latitude: null, longitude: null, shareLocationUrl: "" }), null);
  assert.equal(extractValidCoordinates({ latitude: 0, longitude: 0 }), null);
});

test("shouldBackfillOutlet returns true only when status is DONE, coords are valid, and outlet coords are null", () => {
  const validCoords = { latitude: -6.2, longitude: 106.8 };

  // Should backfill when outlet has null coords and status is DONE
  assert.equal(shouldBackfillOutlet({ latitude: null, longitude: null }, "DONE", validCoords), true);
  assert.equal(shouldBackfillOutlet({ latitude: -6.2, longitude: null }, "DONE", validCoords), true);

  // Should NOT backfill if status is not DONE
  assert.equal(shouldBackfillOutlet({ latitude: null, longitude: null }, "NOT_STARTED", validCoords), false);
  assert.equal(shouldBackfillOutlet({ latitude: null, longitude: null }, "ON_PROGRESS", validCoords), false);
  assert.equal(shouldBackfillOutlet({ latitude: null, longitude: null }, "ISSUE", validCoords), false);

  // Should NOT backfill if outlet already has complete coordinates
  assert.equal(shouldBackfillOutlet({ latitude: -7.25, longitude: 112.75 }, "DONE", validCoords), false);

  // Should NOT backfill if coords are null
  assert.equal(shouldBackfillOutlet({ latitude: null, longitude: null }, "DONE", null), false);
});

test("autoBackfillOutletGps updates outlet when eligible", async () => {
  let updatedData: any = null;
  const mockPrisma = {
    outlet: {
      findUnique: async () => ({ id: "out-123", latitude: null, longitude: null }),
      update: async ({ where, data }: any) => {
        updatedData = { where, data };
        return { id: where.id, ...data };
      },
    },
  };

  const result = await autoBackfillOutletGps(mockPrisma as any, {
    outletId: "out-123",
    status: "DONE",
    latitude: -6.2088,
    longitude: 106.8456,
  });

  assert.equal(result.backfilled, true);
  assert.equal(result.outletId, "out-123");
  assert.equal(result.latitude, -6.2088);
  assert.equal(result.longitude, 106.8456);
  assert.deepEqual(updatedData, {
    where: { id: "out-123" },
    data: { latitude: -6.2088, longitude: 106.8456 },
  });
});

test("autoBackfillOutletGps skips update when outlet already has coordinates", async () => {
  let updateCalled = false;
  const mockPrisma = {
    outlet: {
      findUnique: async () => ({ id: "out-123", latitude: -6.1, longitude: 106.7 }),
      update: async () => {
        updateCalled = true;
      },
    },
  };

  const result = await autoBackfillOutletGps(mockPrisma as any, {
    outletId: "out-123",
    status: "DONE",
    latitude: -6.2088,
    longitude: 106.8456,
  });

  assert.equal(result.backfilled, false);
  assert.equal(updateCalled, false);
});

test("equator coordinates (latitude: 0) are extracted as valid and do not trigger backfill if outlet already has them", () => {
  const pontianakCoords = { latitude: 0, longitude: 109.3333 };
  const extracted = extractValidCoordinates(pontianakCoords);
  assert.deepEqual(extracted, { latitude: 0, longitude: 109.3333 });

  const shouldBackfill = shouldBackfillOutlet(
    { latitude: 0, longitude: 109.3333 },
    "DONE",
    extracted
  );
  assert.equal(shouldBackfill, false);
});

