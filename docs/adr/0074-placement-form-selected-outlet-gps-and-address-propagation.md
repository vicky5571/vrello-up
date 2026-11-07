# ADR-0074: Placement Form Selected Outlet GPS and Address Data Propagation

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). Field operators and agency installers execute Point-of-Sale Materials (POSM) deployments across retail outlets via the 4-step placement wizard in `PlacementFormModal.tsx`.

In Step 1 (`Step1Outlet.tsx`), the operator searches for and selects an outlet via `OutletSearchCombobox.tsx`. The search combobox queries `GET /api/marcom/outlets?q=...`, which returns full `OutletItem` records containing `code`, `name`, `address`, `city`, `latitude`, and `longitude`. The dropdown result successfully detects coordinates and displays `• GPS Ada`.

However, as soon as the user selects the outlet, the preview card in `OutletSelectedCard.tsx` displays:
- `"Alamat: Alamat belum tercatat"`
- `"⚠️ Titik GPS Belum Diatur"`

### Root Cause Analysis (Data Stripping & Premature Override)
1. **Parent-Level Projection Stripping (`PlacementsView.tsx` Line 52):**
   ```typescript
   const outletsList = useMemo(() => storeOutlets.map((o) => ({
     id: o.id, name: o.name, brand: o.brand, picName: o.picName, branchId: o.branchId
   })), [storeOutlets]);
   ```
   `PlacementsView.tsx` strips `code`, `address`, `city`, `latitude`, `longitude`, and `picPhone` before forwarding `outletsList` to `PlacementFormModal`.
2. **Modal Incomplete Object Priority Override (`PlacementFormModal.tsx` Line 97):**
   ```typescript
   const selOutlet = outletsList.find((o) => o.id === placement.outletId);
   const selectedOutletObj = selOutlet ? {
     id: selOutlet.id,
     name: selOutlet.name,
     code: placement.outlet?.code || "",
     address: selOutlet.address || placement.outlet?.address || "",
     latitude: selOutlet.latitude ?? null, // selOutlet.latitude is undefined -> null!
     longitude: selOutlet.longitude ?? null, // selOutlet.longitude is undefined -> null!
     ...
   } : placement.outlet;
   ```
   Because `selOutlet` was found in `outletsList`, `selectedOutletObj` prioritized `selOutlet.latitude` and `selOutlet.longitude`. Since `selOutlet` was stripped of coordinates, `selectedOutletObj` assigned `null`, completely overwriting the valid GPS coordinates already attached to `placement.outlet` by `onSelect(outlet)`.
3. **Downstream Blast Radius:**
   In Step 4 (`Step4FinalCheck.tsx`), geofencing radius checks require non-null outlet GPS coordinates. When stripped, GPS validation breaks, preventing field installers from executing accurate location-based verification.

## Options Considered

### Option 1: Full Object Propagation & Fail-Safe Merging (Chosen)
- **Layer 1 (`PlacementsView.tsx`):** Preserve full `OutletItem` fields (`code`, `address`, `city`, `latitude`, `longitude`, `picPhone`) when projecting `outletsList` from `storeOutlets`.
- **Layer 2 (`PlacementFormModal.tsx`):** Implement fail-safe merging in `selectedOutletObj`:
  ```typescript
  const pOutlet = placement.outlet;
  const selOutlet = outletsList.find((o) => o.id === placement.outletId);
  const selectedOutletObj = (pOutlet || selOutlet) ? {
    id: pOutlet?.id || selOutlet?.id || "",
    name: pOutlet?.name || selOutlet?.name || "",
    code: pOutlet?.code || selOutlet?.code || "",
    address: pOutlet?.address || selOutlet?.address || "",
    city: pOutlet?.city || selOutlet?.city || "",
    latitude: pOutlet?.latitude ?? selOutlet?.latitude ?? null,
    longitude: pOutlet?.longitude ?? selOutlet?.longitude ?? null,
    brand: pOutlet?.brand || selOutlet?.brand || "IM3",
    picName: pOutlet?.picName || selOutlet?.picName,
    picPhone: pOutlet?.picPhone || selOutlet?.picPhone,
    branchId: pOutlet?.branchId || selOutlet?.branchId,
  } : undefined;
  ```
- *Trade-Offs:*
  - *Pros:* Defense-in-depth architecture. Solves the upstream data leakage while ensuring the modal remains resilient even if `outletsList` or `placement.outlet` contains partial data (e.g., when editing an existing placement where `placement.outlet` is populated or when creating a new placement where `outletsList` matches).
  - *Cons:* None. Zero runtime dependencies and ~15 lines changed.

### Option 2: Pure Direct Binding to `placement.outlet` Only
- Remove lookup `outletsList.find()` in `PlacementFormModal.tsx` entirely and rely strictly on `placement.outlet`.
- *Trade-Offs:*
  - *Pros:* Removes redundant lookup in modal state.
  - *Cons:* Fragile in edit mode if legacy placement records in storage only contain `outletId` foreign key without an expanded `outlet` relation. If `placement.outlet` is undefined, the modal would render nothing until a separate fetch completes.

## Decision

We adopt **Option 1: Full Object Propagation & Fail-Safe Merging**.

Specifically:
1. In `PlacementsView.tsx`, update the `outletsList` projection to retain `code`, `address`, `city`, `latitude`, `longitude`, and `picPhone`.
2. In `PlacementFormModal.tsx`, rewrite `selectedOutletObj` computation to defensively coalesce fields between `placement.outlet` and `selOutlet`, prioritizing non-empty values and valid coordinate numbers.

## Consequences

### Positive Consequences
1. **Accurate Outlet Preview:** Step 1 preview card immediately displays real outlet address and GPS coordinates (`• GPS Aktif` with coordinate tags) upon selection.
2. **Reliable Geofencing in Step 4:** `Step4FinalCheck.tsx` receives authentic outlet GPS coordinates, enabling field installers to validate on-site proximity accurately.
3. **Resilient Edit & Creation Modes:** Both freshly selected outlets and pre-existing placements being edited retain their outlet data without clobbering.
4. **Zero Overhead:** No additional network calls or API payload changes needed.

### Negative Consequences / Accepted Technical Debt
1. None. All mutations occur within existing client state memoization and local data flow.

## Verification Strategy
- **Unit Test:** `src/components/views/PlacementsView/placementOutletPropagation.test.ts` to assert that:
  - `PlacementsView` projection retains `latitude`, `longitude`, `address`, and `code`.
  - `selectedOutletObj` computation resolves valid latitude, longitude, and address when either `placement.outlet` or `selOutlet` contains them.
- **Regression Suite:** `npm run drift:check`, `npm run build:check`, and `npm test`.



