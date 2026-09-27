# Master Data Boundary & Status Guards for Outlet Backfill (Issue #8b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement pragmatic master data governance guards in `outletBackfill.ts` and `locationUtils.ts` by enforcing that opportunistic GPS backfills only apply to approved master outlets (`status === "APPROVED"`), validate that coordinates fall within the geographic bounds of Indonesia, and emit structured audit logs upon enrichment.

**Architecture:** 
1. Add `INDONESIA_BOUNDS` and pure validator `isWithinIndonesiaBounds(lat, lng)` to `src/lib/marcom/locationUtils.ts`.
2. Update `shouldBackfillOutlet` in `src/lib/marcom/outletBackfill.ts` to enforce `isWithinIndonesiaBounds(coords)` and require `outlet.status === "APPROVED"`.
3. Update `autoBackfillOutletGps` to query `status: true` on `outlet.findUnique`, pass `outlet.status` into `shouldBackfillOutlet`, and emit a structured `console.info` audit log when an outlet's GPS is updated.

**Tech Stack:** TypeScript 5, Prisma 6 (`@prisma/client`), Node native test runner (`node --test`)

**Spec:** Audit Issue #8b in `vrello-up-confusion-audit.md` — Master Data Sanity & Status Boundary Guards.

**Status:** ✅ Implemented 2026-09-28. Commits `02ba9bf` → `2f95ce0`.
Verification: `npm test` → **576 pass / 0 fail** across 75 test suites; `npx tsc --noEmit` → clean (0 errors).

## Global Constraints

- All source code, types, comments, variable names, and commit messages MUST be in English.
- Import domain types from `@/types` (SSoT) and helper functions from `@/lib/marcom/locationUtils`.
- DO NOT introduce new third-party dependencies.
- Zero breaking changes to existing callers in `/api/marcom/placements`.
- Every task ends with passing tests: `npm test -- <test-file>` and clean typecheck `npx tsc --noEmit`.
- Commit after each task with conventional commit messages in English.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/marcom/locationUtils.ts` | **Modify** | Export `INDONESIA_BOUNDS` constant and `isWithinIndonesiaBounds(lat, lng)` validator |
| `src/lib/marcom/locationUtils.test.ts` | **Modify** | Add unit tests for `isWithinIndonesiaBounds` boundary conditions |
| `src/lib/marcom/outletBackfill.ts` | **Modify** | Update `shouldBackfillOutlet` with geobox & status check; update `autoBackfillOutletGps` with `status` selection and audit log |
| `src/lib/marcom/outletBackfill.test.ts` | **Modify** | Add test cases for non-APPROVED statuses, out-of-bounds coordinates, and structured logging |

---

### Task 1: Add Indonesia Geobox Validator to `locationUtils.ts` & Tests

**Files:**
- Modify: `src/lib/marcom/locationUtils.ts:22`
- Modify: `src/lib/marcom/locationUtils.test.ts:60`

**Interfaces:**
- Produces:
  - `export const INDONESIA_BOUNDS: { minLat: number; maxLat: number; minLng: number; maxLng: number }`
  - `export function isWithinIndonesiaBounds(lat: number, lng: number): boolean`

- [x] **Step 1: Write failing unit tests for `isWithinIndonesiaBounds`**

In `src/lib/marcom/locationUtils.test.ts`, add imports for `isWithinIndonesiaBounds` and `INDONESIA_BOUNDS` from `./locationUtils.ts`:

```typescript
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { parseCoordinatesFromText, parseGoogleMapsUrl, isValidCoordinate, buildGoogleMapsUrl, calculateHaversineDistanceMeters, evaluateGeofenceStatus, GEOFENCE_TOLERANCE_METERS, isWithinIndonesiaBounds, INDONESIA_BOUNDS } from "./locationUtils.ts";
```

Add tests to `locationUtils.test.ts`:

```typescript
describe("isWithinIndonesiaBounds", () => {
  it("validates coordinates inside major Indonesian regions", () => {
    // Jakarta
    assert.equal(isWithinIndonesiaBounds(-6.2088, 106.8456), true);
    // Sabang (Aceh - Northwest tip)
    assert.equal(isWithinIndonesiaBounds(5.8943, 95.3182), true);
    // Merauke (Papua - Southeast tip)
    assert.equal(isWithinIndonesiaBounds(-8.4991, 140.4011), true);
    // Rote Island (East Nusa Tenggara - Southernmost)
    assert.equal(isWithinIndonesiaBounds(-10.7326, 123.1232), true);
    // Pontianak (Equator line)
    assert.equal(isWithinIndonesiaBounds(0, 109.3333), true);
  });

  it("rejects coordinates outside Indonesia territory", () => {
    // Null Island (0, 0)
    assert.equal(isWithinIndonesiaBounds(0, 0), false);
    // Tokyo, Japan
    assert.equal(isWithinIndonesiaBounds(35.6762, 139.6503), false);
    // Sydney, Australia
    assert.equal(isWithinIndonesiaBounds(-33.8688, 151.2093), false);
    // Mountain View, USA
    assert.equal(isWithinIndonesiaBounds(37.422, -122.084), false);
    // Inverted/swapped Lat-Lng (106.8, -6.2)
    assert.equal(isWithinIndonesiaBounds(106.8456, -6.2088), false);
  });

  it("rejects non-numeric and NaN coordinates", () => {
    assert.equal(isWithinIndonesiaBounds(Number.NaN, 106.8), false);
    assert.equal(isWithinIndonesiaBounds(-6.2, Number.NaN), false);
  });
});
```

- [x] **Step 2: Run test to observe failure**

Run: `npm test -- src/lib/marcom/locationUtils.test.ts`
Expected: FAIL with `isWithinIndonesiaBounds is not a function`.

- [x] **Step 3: Implement `INDONESIA_BOUNDS` and `isWithinIndonesiaBounds` in `locationUtils.ts`**

Add to `src/lib/marcom/locationUtils.ts` right below `isValidCoordinate`:

```typescript
/**
 * Geographic bounding box encompassing the territory of Indonesia:
 * - South: ~11.0°S (Rote Island)
 * - North: ~6.0°N (Weh Island / Miangas)
 * - West: ~95.0°E (Sabang)
 * - East: ~141.0°E (Merauke)
 */
export const INDONESIA_BOUNDS = {
  minLat: -11.0,
  maxLat: 6.0,
  minLng: 95.0,
  maxLng: 141.0,
} as const;

/**
 * Validates whether numeric latitude and longitude fall within Indonesia's territory.
 * Prevents invalid coordinates, inverted lat/lng, and Null Island (0, 0).
 */
export function isWithinIndonesiaBounds(lat: number, lng: number): boolean {
  if (!isValidCoordinate(lat, lng)) return false;
  return (
    lat >= INDONESIA_BOUNDS.minLat &&
    lat <= INDONESIA_BOUNDS.maxLat &&
    lng >= INDONESIA_BOUNDS.minLng &&
    lng <= INDONESIA_BOUNDS.maxLng
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/marcom/locationUtils.test.ts`
Expected: All tests in suite PASS.

- [x] **Step 5: Commit**

```bash
git add src/lib/marcom/locationUtils.ts src/lib/marcom/locationUtils.test.ts
git commit -m "feat: add isWithinIndonesiaBounds geographic boundary validator to locationUtils"
```

---

### Task 2: Implement Boundary & Status Guards in `outletBackfill.ts`

**Files:**
- Modify: `src/lib/marcom/outletBackfill.ts:18,64-125`
- Modify: `src/lib/marcom/outletBackfill.test.ts:25-110`

**Interfaces:**
- Consumes: `isWithinIndonesiaBounds` from `./locationUtils.ts`
- Produces:
  - `shouldBackfillOutlet(outlet: { latitude?: number | null; longitude?: number | null; status?: string | null }, status: string, coords: Coordinates | null): boolean`
  - `autoBackfillOutletGps(prismaClient: OutletBackfillPrismaClient, placement: AutoBackfillPlacementInput): Promise<BackfillResult>`

- [x] **Step 1: Write failing unit tests for status guard and out-of-bounds rejection**

In `src/lib/marcom/outletBackfill.test.ts`, update tests to verify status and geographic boundaries:

```typescript
test("shouldBackfillOutlet accepts only APPROVED outlet status within Indonesia bounds", () => {
  const validCoords = { latitude: -6.2, longitude: 106.8 };

  // APPROVED outlet without coordinates -> backfill allowed
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "APPROVED" }, "DONE", validCoords),
    true
  );

  // Non-APPROVED outlets -> backfill rejected
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "DRAFT" }, "DONE", validCoords),
    false
  );
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "PENDING_APPROVAL" }, "DONE", validCoords),
    false
  );
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "REJECTED" }, "DONE", validCoords),
    false
  );

  // Out of bounds coordinates (USA, Null Island) -> backfill rejected
  const usaCoords = { latitude: 37.422, longitude: -122.084 };
  assert.equal(
    shouldBackfillOutlet({ latitude: null, longitude: null, status: "APPROVED" }, "DONE", usaCoords),
    false
  );

  const nullIsland = { latitude: 0, longitude: 0 };
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
```

Also update existing test fixtures in `outletBackfill.test.ts` where `findUnique` returns an outlet so they specify `status: "APPROVED"`:

```typescript
// Line 52
findUnique: async () => ({ id: "out-123", latitude: null, longitude: null, status: "APPROVED" }),
// Line 80
findUnique: async () => ({ id: "out-123", latitude: -6.1, longitude: 106.7, status: "APPROVED" }),
```

- [x] **Step 2: Run test to observe failure**

Run: `npm test -- src/lib/marcom/outletBackfill.test.ts`
Expected: FAIL because `shouldBackfillOutlet` does not check `outlet.status` or `isWithinIndonesiaBounds`.

- [x] **Step 3: Update `outletBackfill.ts` implementation**

In `src/lib/marcom/outletBackfill.ts`:
1. Import `isWithinIndonesiaBounds`:
```typescript
// @ts-expect-error Node strip-types requires explicit .ts extension
import { isValidCoordinate, parseGoogleMapsUrl, isWithinIndonesiaBounds, type Coordinates } from "./locationUtils.ts";
```

2. Add optional `id?: string` to `AutoBackfillPlacementInput`:
```typescript
export interface AutoBackfillPlacementInput {
  id?: string;
  outletId: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string | null;
}
```

3. Update `shouldBackfillOutlet`:
```typescript
/**
 * Determines whether an outlet requires coordinate backfill from a placement.
 * Returns true only when:
 * 1. Placement status is terminal DONE
 * 2. Valid coordinates are present and located within Indonesia territory
 * 3. Outlet status is APPROVED (active master data)
 * 4. Outlet latitude or longitude is null
 */
export function shouldBackfillOutlet(
  outlet: { latitude?: number | null; longitude?: number | null; status?: string | null },
  status: string,
  coords: Coordinates | null
): boolean {
  if (status !== "DONE" || !coords) {
    return false;
  }
  // Master data governance: only enrich verified, approved master data
  if (outlet.status && outlet.status !== "APPROVED") {
    return false;
  }
  // Sanity check: must be inside Indonesian territory
  if (!isWithinIndonesiaBounds(coords.latitude, coords.longitude)) {
    return false;
  }
  return outlet.latitude == null || outlet.longitude == null;
}
```

4. In `autoBackfillOutletGps`, select `status` and emit audit log:
```typescript
    const outlet = await prismaClient.outlet.findUnique({
      where: { id: placement.outletId },
      select: { id: true, latitude: true, longitude: true, status: true },
    });

    if (!outlet || !shouldBackfillOutlet(outlet, placement.status, coords)) {
      return { backfilled: false };
    }

    await prismaClient.outlet.update({
      where: { id: outlet.id },
      data: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    console.info(
      `[outletBackfill] Enriched Outlet GPS: outletId=${outlet.id}, coords=(${coords.latitude}, ${coords.longitude})` +
        (placement.id ? `, placementId=${placement.id}` : "")
    );

    return {
      backfilled: true,
      outletId: outlet.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/marcom/outletBackfill.test.ts`
Expected: All tests PASS.

Run: `npx tsc --noEmit`
Expected: 0 errors across the codebase.

- [x] **Step 5: Commit**

```bash
git add src/lib/marcom/outletBackfill.ts src/lib/marcom/outletBackfill.test.ts
git commit -m "feat: enforce APPROVED status and Indonesia geobox boundary guards on outlet backfill"
```

---

### Task 3: Full Test Suite & Verification

**Files:**
- Verification only.

- [x] **Step 1: Run full test suite**

Run: `npm test`
Expected: All 570+ tests PASS, 0 failures.

- [x] **Step 2: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean exit (0 errors).

- [x] **Step 3: Update `vrello-up-confusion-audit.md` status table**

Mark issue 8b as `✅ Fixed` in `/Users/mac/.gemini/antigravity/brain/1fc8ac43-8140-4e53-9b55-40afcfe9ea6f/vrello-up-confusion-audit.md`.

- [x] **Step 4: Final commit**

```bash
git add docs/superpowers/plans/2026-09-28-master-data-boundary-guards-outlet-backfill.md
git commit -m "docs(plans): mark master-data-boundary-guards plan complete"
```
