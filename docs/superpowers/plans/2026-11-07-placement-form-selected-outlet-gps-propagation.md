# Implementation Plan: Placement Form Selected Outlet GPS and Address Data Propagation

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-placement-form-selected-outlet-gps-propagation-design.md`
- **Refs:** `docs/adr/0074-placement-form-selected-outlet-gps-and-address-propagation.md`

## 1. Overview & File Manifest

Preserve complete outlet properties (`latitude`, `longitude`, `address`, `code`, `city`, `picPhone`) in the POSM Placement workflow by:
1. Maintaining all outlet attributes when projecting `outletsList` in `PlacementsView.tsx`.
2. Implementing fail-safe coalescing in `PlacementFormModal.tsx` (`selectedOutletObj`) so that non-null coordinates and valid address strings from `placement.outlet` or `selOutlet` are never overwritten with `undefined` or `null`.

### File Manifest

| File Path | Responsibility | Estimated Diff |
| :--- | :--- | :--- |
| `src/components/views/PlacementsView/placementOutletPropagation.test.ts` | Unit regression tests for projection and coalescing logic | ~70 LOC (New) |
| `src/components/views/PlacementsView/PlacementsView.tsx` | Enrich `outletsList` mapping with `code`, `address`, `city`, `latitude`, `longitude`, `picPhone` | ~10 LOC modified |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Rewrite `selectedOutletObj` with fail-safe coalescing | ~20 LOC modified |
| `CHANGELOG.md` | Document bug fix and ADR-0074 reference | ~10 LOC |
| `docs/SESSION_STATE.md` | Track progress and session handoff | ~15 LOC |

## 2. Phased Implementation Plan

### Phase 1: Test-Driven Development (TDD)
- [ ] Create `src/components/views/PlacementsView/placementOutletPropagation.test.ts`.
- [ ] Write unit tests verifying:
  - Fresh selection scenario: when `placement.outlet` contains coordinates and address, `selectedOutletObj` preserves them regardless of `selOutlet`.
  - Upstream projection scenario: `outletsList` mapping includes `code`, `address`, `city`, `latitude`, `longitude`, `picPhone`.
  - Edit mode scenario: when `placement.outlet` is partial or absent, `selOutlet` provides coordinates and address.
  - Legitimate missing GPS: when both sources have null/undefined coordinates, `selectedOutletObj.latitude` and `longitude` are `null`.
- [ ] Run test suite (`npx tsx --test src/components/views/PlacementsView/placementOutletPropagation.test.ts`) and observe RED.

### Phase 2: Implementation
- [ ] In `src/components/views/PlacementsView/PlacementsView.tsx` (line 52):
  - Expand `storeOutlets.map` to preserve `code: o.code`, `address: o.address`, `city: o.city`, `latitude: o.latitude`, `longitude: o.longitude`, `picPhone: o.picPhone`.
- [ ] In `src/components/views/PlacementsView/PlacementFormModal.tsx` (lines 97-130):
  - Rewrite `selectedOutletObj` using defensive coalescing across `pOutlet` and `selOutlet`.
- [ ] Run unit test suite and confirm GREEN.

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 0 drift and 101/101 spec-plan pairing).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm test` (verify all placement tests pass).
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| `PlacementsView.tsx` exceeding 250 LOC | High | Current LOC is 214. The change adds ~5 LOC (total ~219 LOC), safely under the 250 LOC ceiling. |
| Inadvertent type mismatches between `OutletItem` and `OutletSearchResult` | Medium | `OutletSearchResult` accepts optional `latitude?: number | null`, matching `OutletItem` types. `build:check` enforces type compliance. |
| Overwriting legitimate null coordinates with fallback values | Low | Fail-safe logic explicitly checks `!== undefined ? lat : null` so `null` remains `null`. |



