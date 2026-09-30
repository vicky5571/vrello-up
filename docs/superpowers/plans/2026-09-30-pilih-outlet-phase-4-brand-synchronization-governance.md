# Pilih Outlet Phase 4: Brand Synchronization & Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish end-to-end synchronization between the Step 1 Brand Provider toggle (`IM3` vs `3 / Tri`), the outlet remote search query, and the smart defaults applied on outlet selection.

**Architecture:** Extend `OutletSearchFilterOptions` and `/api/marcom/outlets` to support a `brand` query parameter (`IM3` or `TRI`). Update `OutletSearchCombobox` to accept a `brand` prop and transmit it in search requests. Harmonize `applySmartDefaultsOnOutletSelect` and `onSetBrand` so selecting an outlet with a designated brand automatically updates the placement's brand provider, preventing cross-brand attribution errors.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Prisma ORM, Node test runner (`node:test`).

**Spec:** [`docs/audit-add-placement-outlet-selection.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-add-placement-outlet-selection.md)

## Global Constraints

- Domain Separation: In Indosat Ooredoo Hutchison operations, IM3 and Tri are distinct commercial brands with separate promotional collateral, budgets, and retail partner commitments.
- Master Data Compatibility: Outlets in PostgreSQL carry a native `brand Brand @default(IM3)` enum column.
- Single Source of Truth: Import `Brand` enum and types strictly from `@/types`.
- Test Verification: Validate both API query filtering and client smart defaults with targeted unit tests (`npm test`).

---

## File Structure

```text
src/app/api/marcom/outlets/
├── outletsSearchFilter.ts                     # Modified: support brand filter in OutletSearchFilterOptions & where-clause
├── outletsSearch.test.ts                      # Extended: unit tests for brand query parameter filtering
└── route.ts                                   # Modified: extract brand search param

src/components/views/PlacementsView/
├── OutletSearchCombobox.tsx                   # Modified: accept brand prop & forward to query params
├── wizard/
│   ├── Step1Outlet.tsx                        # Modified: pass brand={currentBrand} to combobox
│   ├── placementWizardHelpers.ts              # Modified: prioritize detectedBrand on explicit outlet selection
│   └── placementWizardHelpers.test.ts         # Modified: test brand synchronization upon outlet select
```

---

### Task 1: Add Brand Filtering to `/api/marcom/outlets`

**Files:**
- Modify: `src/app/api/marcom/outlets/outletsSearchFilter.ts:7-13, 80-100`
- Modify: `src/app/api/marcom/outlets/route.ts:25-50`
- Test: `src/app/api/marcom/outlets/outletsSearch.test.ts`

**Interfaces:**
- Produces:
  - `OutletSearchFilterOptions.brand?: string | Brand | null`
  - Prisma where clause filtering on `where.brand = normalizedBrand`

- [ ] **Step 1: Write the failing test for brand query filtering**

```typescript
// Add to src/app/api/marcom/outlets/outletsSearch.test.ts
test("applies brand filter to where clause when provided", () => {
  const whereIM3 = buildOutletSearchWhere({ brand: "IM3" });
  assert.equal(whereIM3.brand, "IM3");

  const whereTRI = buildOutletSearchWhere({ brand: "TRI" });
  assert.equal(whereTRI.brand, "TRI");

  const whereAll = buildOutletSearchWhere({ brand: "ALL" });
  assert.equal(whereAll.brand, undefined);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts
```

- [ ] **Step 3: Implement brand filter in `outletsSearchFilter.ts` & `route.ts`**

In `outletsSearchFilter.ts`:
```typescript
export interface OutletSearchFilterOptions {
  q?: string | null;
  branchId?: string | null;
  type?: string | OutletType | null;
  tier?: string | OutletTier | null;
  status?: string | OutletStatus | null;
  brand?: string | Brand | null;
}
```
And inside `buildOutletSearchWhere`:
```typescript
  if (brand && brand !== "ALL") {
    const normalizedBrand = brand.toUpperCase() === "3" || brand.toUpperCase() === "TRI" ? "TRI" : "IM3";
    where.brand = normalizedBrand as Brand;
  }
```

In `src/app/api/marcom/outlets/route.ts`:
Extract `const brand = searchParams.get("brand");` and pass to `buildOutletSearchWhere`.

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts
```

---

### Task 2: Pass Active Brand to `OutletSearchCombobox`

**Files:**
- Modify: `src/components/views/PlacementsView/OutletSearchCombobox.tsx:37-49, 169-180`
- Modify: `src/components/views/PlacementsView/wizard/Step1Outlet.tsx:83-90`

**Interfaces:**
- Consumes:
  - `brand?: Brand | string` prop on `OutletSearchComboboxProps`

- [ ] **Step 1: Add `brand` prop to `OutletSearchComboboxProps`**

In `OutletSearchCombobox.tsx`:
```typescript
export interface OutletSearchComboboxProps {
  selectedOutletId?: string;
  selectedOutlet?: OutletSearchResult | null;
  onSelectOutlet: (outlet: OutletSelectionPayload) => void;
  onRequestNewOutlet?: (searchQuery: string) => void;
  workspaceId?: string;
  brand?: Brand | string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  id?: string;
}
```

- [ ] **Step 2: Forward `brand` to `URLSearchParams` in search effect**

In `OutletSearchCombobox.tsx` debounced fetch:
```typescript
if (brand && brand !== "ALL") {
  params.set("brand", brand);
}
```
Include `brand` in `useEffect` dependency array (lines 208–214).

- [ ] **Step 3: Connect `currentBrand` in `Step1Outlet.tsx`**

Pass `brand={currentBrand}` to `<OutletSearchCombobox ... />` in `Step1Outlet.tsx:83-90`.

- [ ] **Step 4: Verify search combobox tests pass**

```bash
npm test -- src/components/views/PlacementsView/OutletSearchCombobox.test.ts
```

---

### Task 3: Synchronize Brand in Smart Defaults upon Outlet Selection

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/placementWizardHelpers.ts:70-84`
- Test: `src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts:43-77`

**Interfaces:**
- Produces:
  - Updated `applySmartDefaultsOnOutletSelect` prioritizing outlet's real brand

- [ ] **Step 1: Write test for outlet brand synchronization**

In `placementWizardHelpers.test.ts`:
```typescript
test("updates placement brand to match outlet's explicit brand when selected", () => {
  const triOutlet = {
    id: "out-tri-01",
    name: "Tri Store Express",
    brand: "TRI",
  };

  const initialIM3Placement = {
    brand: "IM3" as Brand,
  };

  const result = applySmartDefaultsOnOutletSelect(triOutlet, initialIM3Placement);
  assert.equal(result.brand, "TRI");
  assert.equal(result.outlet?.brand, "TRI");
});
```

- [ ] **Step 2: Update `applySmartDefaultsOnOutletSelect` in `placementWizardHelpers.ts`**

Replace line 73:
```typescript
// If outlet has an explicit brand, synchronize placement brand to match
brand: outlet.brand ? detectedBrand : prevPlacement.brand || detectedBrand,
```

- [ ] **Step 3: Run full placement test suite to verify 0 failures**

```bash
npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts
```

---

### Task 4: Fix Telemetry & Coordinate Drop on Draft Outlets

**Files:**
- Modify: `src/components/views/PlacementsView/wizard/placementWizardHelpers.ts:78-85`
- Test: `src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts`

**Interfaces:**
- Produces:
  - Preserved `latitude`, `longitude`, and `address` inside `placement.outlet` payload

- [ ] **Step 1: Write failing test for draft outlet telemetry preservation**

```typescript
// Add to src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
test("preserves latitude, longitude, and address in placement.outlet when provided", () => {
  const draftOutlet = {
    id: "draft-999",
    code: "DRAFT-001",
    name: "Toko Baru Draft",
    brand: "IM3",
    address: "Jl. Kaliurang KM 5",
    latitude: -7.7554,
    longitude: 110.3781,
  };

  const result = applySmartDefaultsOnOutletSelect(draftOutlet, {});
  assert.equal(result.outlet?.id, "draft-999");
  assert.equal(result.outlet?.address, "Jl. Kaliurang KM 5");
  assert.equal(result.outlet?.latitude, -7.7554);
  assert.equal(result.outlet?.longitude, 110.3781);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
```

- [ ] **Step 3: Update `applySmartDefaultsOnOutletSelect` in `placementWizardHelpers.ts`**

Update the returned `outlet` object:
```typescript
    outlet: {
      id: outlet.id,
      code: outlet.code || "",
      name: outlet.name,
      brand: detectedBrand,
      address: outlet.address || "",
      latitude: typeof outlet.latitude === "number" ? outlet.latitude : null,
      longitude: typeof outlet.longitude === "number" ? outlet.longitude : null,
    },
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
```

