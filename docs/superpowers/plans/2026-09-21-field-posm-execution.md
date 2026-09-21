# Field POSM Execution & Geofencing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun alur eksekusi POSM lapangan yang cepat, hemat biaya ($0 Maps via OpenStreetMap), dengan validasi geofencing 100m dan pencarian server-side debounced untuk 25.000 outlet.

**Architecture:** Prisma model `Placement` diperkaya dengan kuartal, tema kampanye, dan metrik deviasi lokasi. Logika geofencing menggunakan rumus Haversine murni di `locationUtils.ts`. Endpoint `/api/marcom/outlets` dioptimasi dengan query `ILIKE` debounced. UI modal lapangan direstrukturisasi menjadi 4 langkah mobile-friendly.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Prisma (PostgreSQL), Leaflet / OpenStreetMap, Node test runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-21-field-posm-execution-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-21-field-posm-execution-design.md)

## Global Constraints
- Single Source of Truth: All domain entities must align with `src/types/index.ts`.
- Zero External GIS Libs: Haversine distance must be implemented purely using JavaScript `Math`.
- Free Maps: No Google Maps API tokens or dynamic billing ($0 OpenStreetMap / Leaflet only).
- Test Verification: Every task must be verified with `npm test -- <test-file>` with 0 failures.

---

### Task 1: Domain Models & Prisma Schema Extension

**Files:**
- Modify: `prisma/schema.prisma:130-157`
- Modify: `src/types/index.ts:258-311`

**Interfaces:**
- Consumes: Existing `Placement` and `MarcomPlacement` definitions.
- Produces: `quarter`, `campaignTheme`, `isLocationValid`, `locationDeviation` fields on `Placement` and `MarcomPlacement`.

- [ ] **Step 1: Update `prisma/schema.prisma`**
Tambahkan field `quarter`, `campaignTheme`, `isLocationValid`, dan `locationDeviation` pada model `Placement`.
```prisma
  quarter          String          @default("Q3 2026")
  campaignTheme    String          @default("")
  isLocationValid  Boolean         @default(true)
  locationDeviation Float?

  @@index([quarter])
  @@index([campaignTheme])
```

- [ ] **Step 2: Update `src/types/index.ts`**
Perbarui interface `Placement` dan `MarcomPlacement` dengan tipe baru tersebut.

- [ ] **Step 3: Run Prisma Client Generation**
Run: `npx prisma generate`
Expected: "Generated Prisma Client"

- [ ] **Step 4: Commit**
```bash
git add prisma/schema.prisma src/types/index.ts
git commit -m "feat(domain): extend placement schema with quarter, campaign theme, and geofence deviation"
```

---

### Task 2: Pure Haversine Geofencing Utilities

**Files:**
- Modify: `src/lib/marcom/locationUtils.ts`
- Test: `src/lib/marcom/locationUtils.test.ts`

**Interfaces:**
- Consumes: `Coordinates` from `src/lib/marcom/locationUtils.ts`.
- Produces: `calculateHaversineDistanceMeters(coord1, coord2): number` dan `evaluateGeofenceStatus(outlet, sales, tolerance?): GeofenceEvaluationResult`.

- [ ] **Step 1: Write failing unit test in `src/lib/marcom/locationUtils.test.ts`**
```typescript
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateHaversineDistanceMeters,
  evaluateGeofenceStatus,
  GEOFENCE_TOLERANCE_METERS,
} from "./locationUtils.js";

describe("Geofencing & Haversine Distance", () => {
  const semarangSimpangLima = { latitude: -6.9904, longitude: 110.4229 };
  const semarangTuguMuda = { latitude: -6.9840, longitude: 110.4093 };

  test("calculates distance between Simpang Lima and Tugu Muda (~1.6km)", () => {
    const dist = calculateHaversineDistanceMeters(semarangSimpangLima, semarangTuguMuda);
    assert.ok(dist >= 1600 && dist <= 1700, `Expected ~1650m, got ${dist}`);
  });

  test("calculates distance of identical points as 0m", () => {
    const dist = calculateHaversineDistanceMeters(semarangSimpangLima, semarangSimpangLima);
    assert.equal(dist, 0);
  });

  test("evaluates geofence status within 100m tolerance as valid", () => {
    // Offset by ~40 meters
    const salesNearby = { latitude: -6.9901, longitude: 110.4229 };
    const status = evaluateGeofenceStatus(semarangSimpangLima, salesNearby);
    assert.equal(status.isValid, true);
    assert.ok(status.deviationMeters !== null && status.deviationMeters < 100);
  });

  test("evaluates geofence status outside 100m tolerance as invalid", () => {
    const status = evaluateGeofenceStatus(semarangSimpangLima, semarangTuguMuda);
    assert.equal(status.isValid, false);
    assert.ok(status.deviationMeters !== null && status.deviationMeters > 100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- src/lib/marcom/locationUtils.test.ts`
Expected: FAIL with `calculateHaversineDistanceMeters is not a function`

- [ ] **Step 3: Implement minimal functions in `src/lib/marcom/locationUtils.ts`**
Tambahkan konstanta `GEOFENCE_TOLERANCE_METERS = 100`, fungsi `calculateHaversineDistanceMeters`, dan `evaluateGeofenceStatus`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test -- src/lib/marcom/locationUtils.test.ts`
Expected: PASS with 0 failures

- [ ] **Step 5: Commit**
```bash
git add src/lib/marcom/locationUtils.ts src/lib/marcom/locationUtils.test.ts
git commit -m "feat(geo): implement pure haversine distance and 100m geofence evaluation"
```

---

### Task 3: Dynamic MOU Business Rules Enforcement (Cost & High-Value Assets)

**Files:**
- Modify: `src/lib/marcom/placementMouBridge.ts`
- Modify: `src/lib/marcom/placementMouBridge.test.ts`

**Interfaces:**
- Consumes: `validatePlacementMouRequirement(params: { cost, materialName, selectedMou, ... })`.
- Produces: Updated validation result honoring:
  1. `cost > 0` => Mandatory MOU (`requiresMou = true`).
  2. High-value asset (`Shop Sign`) => Asset protection MOU (`requiresMou = true`).
  3. Lightweight POSM & `cost == 0` => Free (`requiresMou = false`).

- [ ] **Step 1: Write failing tests in `src/lib/marcom/placementMouBridge.test.ts`**
Tambahkan skenario pengujian:
```typescript
test("enforces mandatory MOU when cost > 0 even for poster", () => {
  const result = validatePlacementMouRequirement({
    materialName: "Poster",
    materialType: "POSTER",
    cost: 500_000,
    selectedMou: null,
  });
  assert.equal(result.requiresMou, true);
  assert.equal(result.severity, "warning");
});

test("passes without MOU when cost is 0 for poster", () => {
  const result = validatePlacementMouRequirement({
    materialName: "Poster",
    materialType: "POSTER",
    cost: 0,
    selectedMou: null,
  });
  assert.equal(result.requiresMou, false);
  assert.equal(result.severity, "none");
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- src/lib/marcom/placementMouBridge.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `validatePlacementMouRequirement` in `src/lib/marcom/placementMouBridge.ts`**
Implementasikan penegakan aturan biaya `cost > 0`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test -- src/lib/marcom/placementMouBridge.test.ts`
Expected: PASS with 0 failures

- [ ] **Step 5: Commit**
```bash
git add src/lib/marcom/placementMouBridge.ts src/lib/marcom/placementMouBridge.test.ts
git commit -m "feat(mou): enforce mandatory mou on paid placements and asset protection for shop sign"
```

---

### Task 4: Server-Side Debounced Outlet Search API

**Files:**
- Modify: `src/app/api/marcom/outlets/route.ts`
- Create: `src/app/api/marcom/outlets/outletsSearch.test.ts`

**Interfaces:**
- Consumes: Query parameters `?q=`, `?limit=`, `?branchId=`.
- Produces: Filtered array of outlets with code, name, coordinates, address, and recent placement history.

- [ ] **Step 1: Write test for outlet search query logic in `src/app/api/marcom/outlets/outletsSearch.test.ts`**
Uji fungsi pembuat kueri filter Prisma:
```typescript
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildOutletSearchWhere } from "./outletsSearchFilter.js";

describe("Outlet Search Where Builder", () => {
  test("builds OR condition for search query", () => {
    const where = buildOutletSearchWhere("agus", "ws-main");
    assert.deepEqual(where.OR, [
      { code: { contains: "agus", mode: "insensitive" } },
      { name: { contains: "agus", mode: "insensitive" } },
    ]);
  });

  test("handles empty search query without OR condition", () => {
    const where = buildOutletSearchWhere("", "ws-main");
    assert.equal(where.OR, undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement helper `buildOutletSearchWhere` & update `src/app/api/marcom/outlets/route.ts`**
Ekstrak fungsi filter ke `src/app/api/marcom/outlets/outletsSearchFilter.ts` dan gunakan di route `GET /api/marcom/outlets`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/api/marcom/outlets/route.ts src/app/api/marcom/outlets/outletsSearchFilter.ts src/app/api/marcom/outlets/outletsSearch.test.ts
git commit -m "feat(api): optimize server-side debounced outlet search for 25k outlets"
```

---

### Task 5: UI Component: `OutletSearchCombobox` with History Preview

**Files:**
- Create: `src/components/views/PlacementsView/OutletSearchCombobox.tsx`

**Interfaces:**
- Consumes: `selectedOutletId?: string`, `onSelectOutlet: (outlet: OutletSelectionPayload) => void`.
- Produces: Debounced autocompletion UI with outlet code, name, coordinates, address, and recent placement tags.

- [ ] **Step 1: Implement `OutletSearchCombobox.tsx`**
  - Input teks dengan ikon pencarian.
  - Custom debounce timer 300ms memanggil `/api/marcom/outlets?q=...`.
  - Dropdown daftar hasil dengan keyboard accessibility (Enter/Escape).
  - Tampilan kartu outlet terpilih dengan tombol ganti/hapus.

- [ ] **Step 2: Commit**
```bash
git add src/components/views/PlacementsView/OutletSearchCombobox.tsx
git commit -m "feat(ui): add debounced OutletSearchCombobox with recent placement history"
```

---

### Task 6: Mobile Field Execution Flow in `PlacementFormModal` & OpenStreetMap Leaflet

**Files:**
- Modify: `src/components/views/PlacementsView/PlacementFormModal.tsx`
- Modify: `src/components/views/PlacementsView/LocationPicker.tsx`

**Interfaces:**
- Consumes: `OutletSearchCombobox`, `evaluateGeofenceStatus`, OpenStreetMap tile rendering.
- Produces: Responsive 4-step mobile execution flow (`Pilih Outlet` ➔ `Pasang Material & Kuartal` ➔ `Foto Bukti` ➔ `Validasi GPS 100m`).

- [ ] **Step 1: Integrate `OutletSearchCombobox` into `PlacementFormModal.tsx`**
Ganti `<select>` outlet statis dengan `OutletSearchCombobox`.

- [ ] **Step 2: Add 2-Dimensional Classification Pickers**
Tambahkan pilihan material POSM (Poster, Shop Blind, Stiker Etalase, Bottom Etalase, Shop Sign, Banner) dan pilihan Kuartal/Tema Kampanye.

- [ ] **Step 3: Integrate Geofencing 100m & OpenStreetMap Preview in `LocationPicker.tsx`**
Gunakan OpenStreetMap tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) dengan visualisasi marker outlet, titik GPS sales, dan lingkaran toleransi 100m. Tampilkan badge status validasi hijau/merah.

- [ ] **Step 4: Commit**
```bash
git add src/components/views/PlacementsView/PlacementFormModal.tsx src/components/views/PlacementsView/LocationPicker.tsx
git commit -m "feat(ui): integrate streamlined field execution flow with 100m geofence openstreetmap preview"
```

---

### Task 7: Full Regression Test Suite Verification

**Files:**
- Run full test runner.

- [ ] **Step 1: Run complete unit test suite**
Run: `npm test`
Expected: 330+ tests passing, 0 failures.

- [ ] **Step 2: Final commit**
```bash
git commit --allow-empty -m "chore: verify full test suite passes with posm field execution modules"
```

