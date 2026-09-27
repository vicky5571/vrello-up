import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires explicit .ts extension
import { extractValidCoordinates, shouldBackfillOutlet, autoBackfillOutletGps, type OutletBackfillPrismaClient } from "./outletBackfill.ts";

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
  let updatedData: unknown = null;
  // A Prisma delegate cannot be implemented structurally by a test double, so the
  // mock is bridged with a single `as unknown as`. The call site below is NOT cast,
  // which is the point: autoBackfillOutletGps now type-checks its client argument.
  const mockPrisma: OutletBackfillPrismaClient = {
    outlet: {
      findUnique: async () => ({ id: "out-123", latitude: null, longitude: null, status: "APPROVED" }),
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        updatedData = { where, data };
        return { id: where.id, ...data };
      },
    } as unknown as OutletBackfillPrismaClient["outlet"],
  };

  const result = await autoBackfillOutletGps(mockPrisma, {
    id: "plc-001",
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
  const mockPrisma: OutletBackfillPrismaClient = {
    outlet: {
      findUnique: async () => ({ id: "out-123", latitude: -6.1, longitude: 106.7, status: "APPROVED" }),
      update: async () => {
        updateCalled = true;
      },
    } as unknown as OutletBackfillPrismaClient["outlet"],
  };

  const result = await autoBackfillOutletGps(mockPrisma, {
    outletId: "out-123",
    status: "DONE",
    latitude: -6.2088,
    longitude: 106.8456,
  });

  assert.equal(result.backfilled, false);
  assert.equal(updateCalled, false);
});

test("shouldBackfillOutlet accepts only APPROVED outlet status within Indonesia bounds", () => {
  const indonesiaCoords = { latitude: -6.2088, longitude: 106.8456 };
  const usaCoords = { latitude: 37.422, longitude: -122.084 };
  const nullIsland = { latitude: 0, longitude: 0 };

  // APPROVED + inside Indonesia bounds -> true
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "APPROVED" }, "DONE", indonesiaCoords),
    true
  );

  // Non-APPROVED statuses -> false
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "DRAFT" }, "DONE", indonesiaCoords),
    false
  );
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "PENDING_APPROVAL" }, "DONE", indonesiaCoords),
    false
  );
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "REJECTED" }, "DONE", indonesiaCoords),
    false
  );

  // APPROVED but out of bounds coordinates -> false
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "APPROVED" }, "DONE", usaCoords),
    false
  );
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "APPROVED" }, "DONE", nullIsland),
    false
  );
});

test("autoBackfillOutletGps rejects backfill when outlet status is not APPROVED", async () => {
  let updateCalled = false;
  const mockPrisma: OutletBackfillPrismaClient = {
    outlet: {
      findUnique: async () => ({ id: "out-draft", latitude: null, longitude: null, status: "DRAFT" }),
      update: async () => {
        updateCalled = true;
      },
    } as unknown as OutletBackfillPrismaClient["outlet"],
  };

  const result = await autoBackfillOutletGps(mockPrisma, {
    outletId: "out-draft",
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


