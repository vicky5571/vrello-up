# Implementation Plan: Mobile View Switcher Track & Pill Height Equalization (Outlets & Placements)

- **Status:** COMPLETED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization-design.md`
- **ADR:** `docs/adr/0070-mobile-view-switcher-track-and-pill-height-equalization.md`

## 1. Executive Summary & File Manifest

Equalize segmented view switcher tab heights and active pill coverage across single-line and multi-line tabs using cross-axis flex stretching (`items-stretch sm:items-center`) and minimum touch height constraints (`min-h-[40px] sm:min-h-0`) in Outlets and Placements headers.

### File Manifest

| Action | File Path | Description |
|---|---|---|
| Verified | `src/components/views/OutletsView/OutletsHeader.tsx` | Applies items-stretch on mobile track and min-h-[40px] on tab buttons. |
| Verified | `src/components/views/PlacementsView/PlacementFilterControls.tsx` | Applies items-stretch on mobile track and min-h-[40px] on tab buttons. |
| Verified | `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` | Unit tests for Outlets view switcher stretching and min-h-[40px]. |
| Verified | `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` | Unit tests for Placements view switcher stretching and min-h-[40px]. |
| Created | `docs/handover-mobile-view-switcher-track-and-pill-height-equalization.md` | Execution handover reference. |

## 2. Phased Implementation Steps

### Phase 1: Outlets Header Track & Pill Height Equalization
- [x] In `src/components/views/OutletsView/OutletsHeader.tsx`:
  - Track container: changed from `flex items-center` to `flex items-stretch sm:items-center`.
  - Tab buttons: added `min-h-[40px] sm:min-h-0`.
- [x] Verified via `outletsHeaderResponsiveness.test.ts` (11/11 pass).

### Phase 2: Placements Header Track & Pill Height Equalization
- [x] In `src/components/views/PlacementsView/PlacementFilterControls.tsx`:
  - Track container: changed from `flex items-center` to `flex items-stretch sm:items-center`.
  - Tab buttons: added `min-h-[40px] sm:min-h-0`.
- [x] Verified via `placementsHeaderResponsiveness.test.ts` (5/5 pass).

### Phase 3: Quality Gates & Verification
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm run test:smoke` passes with 150/150 tests.
- [x] `npm test` passes with 966/966 tests.


