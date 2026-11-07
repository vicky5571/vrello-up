# Execution Handover: Placement Form Selected Outlet GPS and Address Data Propagation

- **Target ADR:** `docs/adr/0074-placement-form-selected-outlet-gps-and-address-propagation.md`
- **Target Spec:** `docs/superpowers/specs/2026-11-07-placement-form-selected-outlet-gps-propagation-design.md`
- **Target Plan:** `docs/superpowers/plans/2026-11-07-placement-form-selected-outlet-gps-propagation.md`
- **Status:** EXECUTION-READY

## 1. File Manifest

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/placementOutletPropagation.test.ts` | Unit regression tests verifying full outlet data propagation and coalescing |
| `src/components/views/PlacementsView/PlacementsView.tsx` | Coordinator component projecting `outletsList` for modals and table views |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Wizard modal coordinating Step 1 to Step 4 placement execution |

---

## 2. Current Code Snippets

### Snippet A: `src/components/views/PlacementsView/PlacementsView.tsx` (Lines 52–54)
```typescript
  const outletsList = useMemo(() => storeOutlets.map((o) => ({ id: o.id, name: o.name, brand: o.brand, picName: o.picName, branchId: o.branchId })), [storeOutlets]);
  const materialsList = useMemo(() => storeMaterials.map((m) => ({ id: m.id, name: m.name, type: m.type, requiresMou: m.requiresMou })), [storeMaterials]);
```

### Snippet B: `src/components/views/PlacementsView/PlacementFormModal.tsx` (Lines 97–130)
```typescript
  const selectedOutletObj = useMemo((): OutletSearchResult | undefined => {
    if (selOutlet) {
      return {
        id: selOutlet.id,
        name: selOutlet.name,
        code: selOutlet.code || "",
        brand: selOutlet.brand,
        address: selOutlet.address,
        latitude: selOutlet.latitude,
        longitude: selOutlet.longitude,
      };
    }
    if (placement.outlet) {
      const pOutlet = placement.outlet as {
        id: string;
        name: string;
        code?: string;
        brand?: string;
        address?: string;
        latitude?: number | null;
        longitude?: number | null;
      };
      return {
        id: pOutlet.id,
        name: pOutlet.name,
        code: pOutlet.code || "",
        brand: pOutlet.brand,
        address: pOutlet.address,
        latitude: pOutlet.latitude,
        longitude: pOutlet.longitude,
      };
    }
    return undefined;
  }, [selOutlet, placement.outlet]);
```

---

## 3. Exact Change Instructions

### Change 1: `src/components/views/PlacementsView/PlacementsView.tsx`

**Line 52 Replacement:**

DELETE:
```typescript
  const outletsList = useMemo(() => storeOutlets.map((o) => ({ id: o.id, name: o.name, brand: o.brand, picName: o.picName, branchId: o.branchId })), [storeOutlets]);
```

REPLACE WITH:
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

### Change 2: `src/components/views/PlacementsView/PlacementFormModal.tsx`

**Lines 97–130 Replacement:**

DELETE:
```typescript
  const selectedOutletObj = useMemo((): OutletSearchResult | undefined => {
    if (selOutlet) {
      return {
        id: selOutlet.id,
        name: selOutlet.name,
        code: selOutlet.code || "",
        brand: selOutlet.brand,
        address: selOutlet.address,
        latitude: selOutlet.latitude,
        longitude: selOutlet.longitude,
      };
    }
    if (placement.outlet) {
      const pOutlet = placement.outlet as {
        id: string;
        name: string;
        code?: string;
        brand?: string;
        address?: string;
        latitude?: number | null;
        longitude?: number | null;
      };
      return {
        id: pOutlet.id,
        name: pOutlet.name,
        code: pOutlet.code || "",
        brand: pOutlet.brand,
        address: pOutlet.address,
        latitude: pOutlet.latitude,
        longitude: pOutlet.longitude,
      };
    }
    return undefined;
  }, [selOutlet, placement.outlet]);
```

REPLACE WITH:
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

---

## 4. Do Not Touch List

| File / Component | Reason |
| :--- | :--- |
| `src/components/views/PlacementsView/wizard/Step1Outlet.tsx` | Pure presenter receiving `selectedOutletObj`; correct as is |
| `src/components/views/PlacementsView/wizard/OutletSearchCombobox.tsx` | Search and selection dispatcher; correctly emits full `OutletItem` |
| `src/components/views/PlacementsView/wizard/OutletSelectedCard.tsx` | View card rendering GPS badges and coordinates; renders correctly when not starved of data |
| `src/components/views/PlacementsView/wizard/Step4FinalCheck.tsx` | Step 4 Geofencing engine; depends on non-null GPS coordinates from `selectedOutletObj` |
| `src/app/api/marcom/outlets/route.ts` | Backend API verified working; returns full GPS coordinates and addresses |

---

## 5. Numbered Execution Order

1. **Create Test File:**
   - Create `src/components/views/PlacementsView/placementOutletPropagation.test.ts`.
   - Implement test assertions reproducing the bug and testing coalescing behavior across all 4 operational states.
   - Run `npx tsx --test src/components/views/PlacementsView/placementOutletPropagation.test.ts` (verify RED / failure mode on baseline).
2. **Apply PlacementsView Projection Fix:**
   - Modify `src/components/views/PlacementsView/PlacementsView.tsx` Line 52 as detailed in Change 1.
3. **Apply PlacementFormModal Coalescing Fix:**
   - Modify `src/components/views/PlacementsView/PlacementFormModal.tsx` Lines 97–130 as detailed in Change 2.
4. **Execute Verification:**
   - Run `npx tsx --test src/components/views/PlacementsView/placementOutletPropagation.test.ts` (verify GREEN / 100% pass).
   - Run `npm run drift:check` (verify 101/101 spec-plan pairs and LOC invariants).
   - Run `npm run build:check` (verify 0 TypeScript build errors).
   - Run `npm test` (verify all placement tests pass).
5. **Update Session Documentation:**
   - Update `CHANGELOG.md` with ADR-0074 entry.
   - Update `docs/SESSION_STATE.md` with completed status.

---

## 6. Acceptance Criteria Checklist

- [ ] Selecting an outlet in Step 1 preserves `latitude` and `longitude` in `selectedOutletObj`.
- [ ] `OutletSelectedCard` displays `• GPS Aktif` and coordinates badge instead of `⚠️ Titik GPS Belum Diatur`.
- [ ] Selecting an outlet preserves physical street address in `selectedOutletObj.address` instead of `"Alamat belum tercatat"`.
- [ ] Existing placements opened in edit mode retain their coordinates and address without data clobbering.
- [ ] Genuine null GPS coordinates (`latitude: null, longitude: null`) correctly maintain `null` status.
- [ ] `PlacementsView.tsx` remains $\le 250$ LOC (currently 214 LOC).
- [ ] `PlacementFormModal.tsx` remains $\le 350$ LOC (currently 318 LOC).



