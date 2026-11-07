# Placement Form Selected Outlet GPS and Address Propagation Design Spec

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0074-placement-form-selected-outlet-gps-and-address-propagation.md`

## 1. Executive Summary & Problem Diagnosis

In the POSM Placement workflow (`PlacementFormModal.tsx`), field marketing teams and agency installers register new POSM executions across retail partner outlets.

In Step 1 (`Step1Outlet.tsx`), the user selects an outlet using `OutletSearchCombobox.tsx`. When querying the search API (`GET /api/marcom/outlets?q=...`), the server returns full outlet records with coordinates (`latitude`, `longitude`) and physical address (`address`, `city`). The search combobox accurately displays `• GPS Ada`.

However, once an outlet is selected, the preview card in `OutletSelectedCard.tsx` immediately regresses to:
- `"Alamat: Alamat belum tercatat"`
- `"⚠️ Titik GPS Belum Diatur"`

### 1.1 Technical Root Cause Analysis
1. **Projection Truncation in Parent (`PlacementsView.tsx` Line 52):**
   ```typescript
   const outletsList = useMemo(
     () => storeOutlets.map((o) => ({ id: o.id, name: o.name, brand: o.brand, picName: o.picName, branchId: o.branchId })),
     [storeOutlets]
   );
   ```
   `PlacementsView.tsx` only extracts `id`, `name`, `brand`, `picName`, and `branchId`. Crucial location fields (`code`, `address`, `city`, `latitude`, `longitude`, `picPhone`) are stripped out.
2. **Inverted Priority and Null Overwrite in Modal (`PlacementFormModal.tsx` Line 97):**
   ```typescript
   const selOutlet = outletsList.find((o) => o.id === placement.outletId);
   const selectedOutletObj = useMemo((): OutletSearchResult | undefined => {
     if (selOutlet) {
       return {
         id: selOutlet.id,
         name: selOutlet.name,
         code: selOutlet.code || "",
         brand: selOutlet.brand,
         address: selOutlet.address,
         latitude: selOutlet.latitude,   // undefined!
         longitude: selOutlet.longitude, // undefined!
       };
     }
     ...
   ```
   When `onSelect(outlet)` fires, the full outlet object is stored in `placement.outlet`. But because `selOutlet` matches `outletsList.find()`, `if (selOutlet)` executes first, overriding `placement.outlet` with the stripped properties (`undefined` coordinates and address).
3. **Step 4 Geofencing Invalidation:**
   `Step4FinalCheck.tsx` uses `outletCoordinates` and `selectedOutletObj` to validate whether the installer's live device location matches the venue coordinates. When coordinates are stripped, geofencing verification fails or falls back to unpinned states.

## 2. Component Architecture & Data Contracts

The fix adopts a defense-in-depth model across two layers:

### 2.1 Layer 1: Parent View Full Object Projection (`src/components/views/PlacementsView/PlacementsView.tsx`)
In `PlacementsView.tsx` (line 52), enrich the `outletsList` mapping to preserve all location, contact, and code identifiers from `storeOutlets`:

```typescript
const outletsList = useMemo(
  () =>
    storeOutlets.map((o) => ({
      id: o.id,
      name: o.name,
      code: o.code,
      brand: o.brand,
      address: o.address,
      city: o.city,
      latitude: o.latitude,
      longitude: o.longitude,
      picName: o.picName,
      picPhone: o.picPhone,
      branchId: o.branchId,
    })),
  [storeOutlets]
);
```

### 2.2 Layer 2: Modal Fail-Safe Coalescing (`src/components/views/PlacementsView/PlacementFormModal.tsx`)
In `PlacementFormModal.tsx`, rewrite `selectedOutletObj` to defensively merge `placement.outlet` and `selOutlet`. Non-null GPS coordinates and non-empty strings are prioritized, ensuring that whichever source contains data will be preserved:

```typescript
const selectedOutletObj = useMemo((): OutletSearchResult | undefined => {
  const pOutlet = placement.outlet as {
    id: string;
    name: string;
    code?: string;
    brand?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  } | undefined;

  if (!selOutlet && !pOutlet) return undefined;

  const lat = pOutlet?.latitude ?? selOutlet?.latitude ?? null;
  const lng = pOutlet?.longitude ?? selOutlet?.longitude ?? null;

  return {
    id: pOutlet?.id || selOutlet?.id || "",
    name: pOutlet?.name || selOutlet?.name || "",
    code: pOutlet?.code || selOutlet?.code || "",
    brand: pOutlet?.brand || selOutlet?.brand || "IM3",
    address: pOutlet?.address || selOutlet?.address || "",
    latitude: lat !== undefined ? lat : null,
    longitude: lng !== undefined ? lng : null,
  };
}, [selOutlet, placement.outlet]);
```

### 2.3 Single Source of Truth (SSOT) Compatibility
The `OutletSearchResult` contract in `src/components/views/PlacementsView/types.ts` is preserved exactly:
```typescript
export interface OutletSearchResult {
  id: string;
  name: string;
  code: string;
  brand: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}
```
No schema migrations, database changes, or type mutations are needed.

## 3. Acceptance Criteria & Invariants

1. **AC-1 (Step 1 GPS Propagation):** When an outlet with existing coordinates is selected from `OutletSearchCombobox`, `selectedOutletObj` retains `latitude` and `longitude`, and `OutletSelectedCard` displays `• GPS Aktif` with the coordinate pill instead of `⚠️ Titik GPS Belum Diatur`.
2. **AC-2 (Step 1 Address Propagation):** When an outlet with an address is selected, `selectedOutletObj.address` contains the actual address string and displays it instead of `"Alamat belum tercatat"`.
3. **AC-3 (Edit Mode Resilience):** When opening an existing placement where `placement.outlet` is populated or where only `placement.outletId` is populated with a match in `outletsList`, `selectedOutletObj` correctly resolves the outlet data without loss of coordinates or address.
4. **AC-4 (Missing GPS Integrity):** If an outlet genuinely has `latitude: null, longitude: null` in the database, `selectedOutletObj` retains `null` and the card legitimately renders `"Titik GPS Belum Diatur"`.
5. **AC-5 (LOC Budget Compliance):** All changes in `PlacementsView.tsx` (< 225 LOC) and `PlacementFormModal.tsx` (< 325 LOC) remain strictly within architectural file size budgets.

## 4. Explicit Non-Goals
- No backend endpoint alterations (`GET /api/marcom/outlets` already returns GPS & address).
- No changes to UI styling or markup structure in `OutletSearchCombobox.tsx`, `Step1Outlet.tsx`, or `OutletSelectedCard.tsx`.
- No modifications to geofencing calculation logic in `Step4FinalCheck.tsx`.

## 5. Verification Checklist
- [ ] Create targeted unit test `src/components/views/PlacementsView/placementOutletPropagation.test.ts` verifying:
  - `PlacementsView` projection retains full outlet fields (`latitude`, `longitude`, `address`, `code`).
  - `selectedOutletObj` coalesces `placement.outlet` and `selOutlet` correctly in all combinations (fresh selection, edit mode with pre-existing outlet, legacy placement with only outletId).
- [ ] Verify test suite passes (`npm test`).
- [ ] Run architectural drift verification (`npm run drift:check`).
- [ ] Run full build check (`npm run build:check`).



