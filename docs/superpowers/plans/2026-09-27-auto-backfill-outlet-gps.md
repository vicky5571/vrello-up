# Automatic Outlet GPS Backfill from Placements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate GPS coordinate asymmetry between `Placement` and `Outlet` by automatically persisting valid GPS coordinates to the associated `Outlet` record whenever a placement is completed (`status === "DONE"`) and the outlet's master coordinates are currently `null`.

**Architecture:** Create a dedicated helper module (`src/lib/marcom/outletBackfill.ts`) with pure coordinate extraction and transactional database backfill logic. Integrate the backfill handler into `PATCH /api/marcom/placements/[id]`, `POST /api/marcom/placements`, and bulk `PATCH /api/marcom/placements`. Extend `useMarcomDataStore` with `updateCachedOutlet` so client-side outlet lists and map views immediately reflect backfilled GPS coordinates without requiring full manual reloads.

**Tech Stack:** Next.js 15 App Router, TypeScript 5, Prisma ORM (PostgreSQL), Zustand 5, Node native test runner (`node --test`).

**Spec:** Problem #4: Asymmetry of GPS Coordinates (Outlet vs Placement - Missing Auto-Backfill).

---

## Global Constraints

- Source code, type definitions, inline comments, technical plans, and commit messages MUST strictly be in English.
- Single source of truth for domain types must remain in `src/types/index.ts`.
- Never mutate state objects in-place in Zustand actions (always use immutable object spreads).
- Preserve existing master coordinates: Never overwrite an outlet's coordinates if `outlet.latitude` and `outlet.longitude` are already populated.
- All 510+ existing unit tests must continue to pass with 0 regressions.

---

### Task 1: Core Backfill Logic & Unit Tests in `outletBackfill.ts`

**Files:**
- Create: `src/lib/marcom/outletBackfill.ts`
- Create: `src/lib/marcom/outletBackfill.test.ts`

**Interfaces:**
- Produces: `extractValidCoordinates: (source: { latitude?: number | null; longitude?: number | null; shareLocationUrl?: string | null }) => { latitude: number; longitude: number } | null`
- Produces: `shouldBackfillOutlet: (outlet: { latitude?: number | null; longitude?: number | null }, status: string, coords: { latitude: number; longitude: number } | null) => boolean`
- Produces: `autoBackfillOutletGps: (prismaClient: any, placement: { outletId: string; status: string; latitude?: number | null; longitude?: number | null; shareLocationUrl?: string | null }) => Promise<{ backfilled: boolean; outletId?: string; latitude?: number; longitude?: number }>`

- [ ] **Step 1: Write the failing tests in `src/lib/marcom/outletBackfill.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marcom/outletBackfill.test.ts`
Expected: FAIL with `Cannot find module './outletBackfill.ts'`

- [ ] **Step 3: Implement `src/lib/marcom/outletBackfill.ts`**

```ts
// @ts-expect-error Node strip-types requires explicit .ts extension
import { isValidCoordinate, parseGoogleMapsUrl } from "./locationUtils.ts";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Extracts and validates GPS coordinates from numeric values or Google Maps share URLs.
 * Rejects Null Island (0, 0) and out-of-bounds coordinates.
 */
export function extractValidCoordinates(source: {
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string | null;
}): Coordinates | null {
  if (
    typeof source.latitude === "number" &&
    typeof source.longitude === "number" &&
    isValidCoordinate(source.latitude, source.longitude) &&
    !(source.latitude === 0 && source.longitude === 0)
  ) {
    return {
      latitude: source.latitude,
      longitude: source.longitude,
    };
  }

  if (source.shareLocationUrl && typeof source.shareLocationUrl === "string") {
    const parsed = parseGoogleMapsUrl(source.shareLocationUrl);
    if (parsed && isValidCoordinate(parsed.latitude, parsed.longitude) && !(parsed.latitude === 0 && parsed.longitude === 0)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Determines whether an outlet requires coordinate backfill from a placement.
 * Returns true only when:
 * 1. Placement status is terminal DONE
 * 2. Valid coordinates are present
 * 3. Outlet latitude or longitude is null
 */
export function shouldBackfillOutlet(
  outlet: { latitude?: number | null; longitude?: number | null },
  status: string,
  coords: Coordinates | null
): boolean {
  if (status !== "DONE" || !coords) {
    return false;
  }
  return outlet.latitude == null || outlet.longitude == null;
}

export interface BackfillResult {
  backfilled: boolean;
  outletId?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Automatically backfills outlet master coordinates from a completed placement if the outlet lacks GPS.
 */
export async function autoBackfillOutletGps(
  prismaClient: any,
  placement: {
    outletId: string;
    status: string;
    latitude?: number | null;
    longitude?: number | null;
    shareLocationUrl?: string | null;
  }
): Promise<BackfillResult> {
  if (placement.status !== "DONE" || !placement.outletId) {
    return { backfilled: false };
  }

  const coords = extractValidCoordinates(placement);
  if (!coords) {
    return { backfilled: false };
  }

  try {
    const outlet = await prismaClient.outlet.findUnique({
      where: { id: placement.outletId },
      select: { id: true, latitude: true, longitude: true },
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

    return {
      backfilled: true,
      outletId: outlet.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  } catch (err) {
    console.error("[outletBackfill] Failed to backfill outlet GPS:", err);
    return { backfilled: false };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/marcom/outletBackfill.test.ts`
Expected: PASS (all 6 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/lib/marcom/outletBackfill.ts src/lib/marcom/outletBackfill.test.ts
git commit -m "feat(marcom): implement autoBackfillOutletGps helper with unit tests"
```

---

### Task 2: API Integration in `PATCH /api/marcom/placements/[id]` & `POST /api/marcom/placements`

**Files:**
- Modify: `src/app/api/marcom/placements/[id]/route.ts`
- Modify: `src/app/api/marcom/placements/route.ts`

**Interfaces:**
- Consumes: `autoBackfillOutletGps` from `@/lib/marcom/outletBackfill`

- [ ] **Step 1: Wire `autoBackfillOutletGps` in `PATCH /api/marcom/placements/[id]/route.ts`**

Import `autoBackfillOutletGps` and invoke after placement update:

```ts
import { autoBackfillOutletGps } from "@/lib/marcom/outletBackfill";

// Inside PATCH handler, after `const placement = await prisma.placement.update(...)`:
let backfilledOutlet: { id: string; latitude: number; longitude: number } | undefined;
if (placement.status === "DONE") {
  const backfill = await autoBackfillOutletGps(prisma, placement);
  if (backfill.backfilled && backfill.outletId && backfill.latitude && backfill.longitude) {
    backfilledOutlet = {
      id: backfill.outletId,
      latitude: backfill.latitude,
      longitude: backfill.longitude,
    };
  }
}

return NextResponse.json({
  ...placement,
  backfilledOutlet,
});
```

- [ ] **Step 2: Wire `autoBackfillOutletGps` in `POST /api/marcom/placements/route.ts`**

Import `autoBackfillOutletGps` and invoke after placement creation:

```ts
import { autoBackfillOutletGps } from "@/lib/marcom/outletBackfill";

// Inside POST handler, after `const placement = await prisma.placement.create(...)`:
let backfilledOutlet: { id: string; latitude: number; longitude: number } | undefined;
if (placement.status === "DONE") {
  const backfill = await autoBackfillOutletGps(prisma, placement);
  if (backfill.backfilled && backfill.outletId && backfill.latitude && backfill.longitude) {
    backfilledOutlet = {
      id: backfill.outletId,
      latitude: backfill.latitude,
      longitude: backfill.longitude,
    };
  }
}

return NextResponse.json(
  {
    ...placement,
    backfilledOutlet,
  },
  { status: 201 }
);
```

- [ ] **Step 3: Run typecheck and tests to verify no regressions**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/marcom/outletBackfill.test.ts`
Expected: 0 type errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/marcom/placements/[id]/route.ts src/app/api/marcom/placements/route.ts
git commit -m "feat(api): trigger autoBackfillOutletGps on placement completion in POST and PATCH endpoints"
```

---

### Task 3: Bulk Placement Status Backfill in `PATCH /api/marcom/placements`

**Files:**
- Modify: `src/app/api/marcom/placements/route.ts:150-192`

**Interfaces:**
- Consumes: `autoBackfillOutletGps` from `@/lib/marcom/outletBackfill`

- [ ] **Step 1: Add bulk outlet GPS backfill when bulk status changes to DONE**

In `PATCH` handler of `src/app/api/marcom/placements/route.ts`:

```ts
    const result = await prisma.placement.updateMany({
      where: {
        id: { in: ids },
        workspaceId,
      },
      data: dataToUpdate,
    });

    let backfilledCount = 0;
    if (updates.status === "DONE") {
      const completedPlacements = await prisma.placement.findMany({
        where: { id: { in: ids }, workspaceId, status: "DONE" },
        select: { outletId: true, status: true, latitude: true, longitude: true, shareLocationUrl: true },
      });

      for (const p of completedPlacements) {
        const backfill = await autoBackfillOutletGps(prisma, p);
        if (backfill.backfilled) {
          backfilledCount++;
        }
      }
    }

    return NextResponse.json({ updatedCount: result.count, backfilledOutletsCount: backfilledCount });
```

- [ ] **Step 2: Run typecheck and tests to verify no regressions**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/marcom/outletBackfill.test.ts`
Expected: 0 type errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/marcom/placements/route.ts
git commit -m "feat(api): add outlet GPS backfill support to bulk placement PATCH endpoint"
```

---

### Task 4: Client-Side Cache Synchronization (`marcomDataStore.ts` & `PlacementsView.tsx`)

**Files:**
- Modify: `src/lib/marcom/marcomDataStore.ts:40-48, 185-203`
- Modify: `src/lib/marcom/marcomDataStore.test.ts`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx:550-610`

**Interfaces:**
- Produces: `updateCachedOutlet: (outlet: Partial<OutletItem> & { id: string }) => void`

- [ ] **Step 1: Write failing test for `updateCachedOutlet` in `marcomDataStore.test.ts`**

```ts
    it("updates cached outlet master data immutably", () => {
      const store = useMarcomDataStore.getState();
      store.setOutlets([
        {
          id: "out-gps-1",
          code: "OUT-01",
          name: "Warung Berkah",
          type: "TRADITIONAL",
          address: "Jl. Sudirman",
          city: "Jakarta",
          picName: "Budi",
          picPhone: "0812345678",
          active: true,
          branchId: "b1",
          latitude: null,
          longitude: null,
        },
      ]);

      store.updateCachedOutlet({
        id: "out-gps-1",
        latitude: -6.2088,
        longitude: 106.8456,
      });

      const updated = useMarcomDataStore.getState().outlets.find((o) => o.id === "out-gps-1");
      assert.equal(updated?.latitude, -6.2088);
      assert.equal(updated?.longitude, 106.8456);
    });
```

- [ ] **Step 2: Implement `updateCachedOutlet` in `src/lib/marcom/marcomDataStore.ts`**

Add to `MarcomDataState`:
```ts
updateCachedOutlet: (outlet: Partial<OutletItem> & { id: string }) => void;
```

Implementation in `useMarcomDataStore`:
```ts
updateCachedOutlet: (outlet: Partial<OutletItem> & { id: string }) => {
  set((s) => ({
    outlets: s.outlets.map((o) =>
      o.id === outlet.id ? ({ ...o, ...outlet } as OutletItem) : o
    ),
  }));
},
```

- [ ] **Step 3: Update `PlacementsView.tsx` to synchronize backfilled outlet GPS on save**

In `PlacementsView.tsx`:
```ts
const invalidateOutlets = useMarcomDataStore((s) => s.invalidateOutlets);
const updateCachedOutlet = useMarcomDataStore((s) => s.updateCachedOutlet);

// Inside handleSavePlacement, after successful response:
const jsonRes = await res.json().catch(() => ({}));
const savedPlacement: MarcomPlacement = jsonRes.data || jsonRes;
const backfilledOutlet = jsonRes.backfilledOutlet;

if (backfilledOutlet) {
  updateCachedOutlet(backfilledOutlet);
  invalidateOutlets();
} else if (status === "DONE" && (latitude || longitude)) {
  invalidateOutlets();
}
```

- [ ] **Step 4: Run typecheck and tests**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/marcom/marcomDataStore.test.ts`
Expected: 0 type errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marcom/marcomDataStore.ts src/lib/marcom/marcomDataStore.test.ts src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "feat(marcom): add updateCachedOutlet to store and sync backfilled GPS in PlacementsView"
```

---

### Task 5: Full Verification Suite

**Files:**
- Entire repository

- [ ] **Step 1: Run TypeScript compiler check**

Run: `npx tsc --noEmit`
Expected: Exit code 0, 0 type errors.

- [ ] **Step 2: Run full unit test suite**

Run: `npm test`
Expected: All 517+ tests passing across all 71 test suites with 0 failures.

- [ ] **Step 3: Verify git working tree status**

Run: `git status`
Expected: Working tree clean, everything committed with structured messages.
