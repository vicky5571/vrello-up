# Implementation Plan: Mobile Outlet Form GPS Layout & Toast Touch Resilience

- **Status:** COMPLETED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-outlet-form-gps-layout-and-toast-resilience-design.md`
- **ADR:** `docs/adr/0071-mobile-outlet-form-gps-layout-and-toast-resilience.md`

## 1. Executive Summary & File Manifest

Eliminate mobile header text wrapping and touch-blocking toast locks in `OutletFormModal.tsx` by introducing a dedicated 2-row GPS link layout and pointer pass-through rules.

### File Manifest

| Action | File Path | Description |
|---|---|---|
| Verified | `src/components/views/OutletsView/OutletFormModal.tsx` | 2-row GPS link layout, whitespace-nowrap, GPS_TOAST_ID with pointer-events: none, unmount dismissal. |
| Verified | `src/app/globals.css` | Toaster pointer-events pass-through rules. |
| Verified | `src/components/views/OutletsView/outletFormModalMobileUx.test.ts` | 7 automated unit tests for GPS layout and toast resilience. |
| Created | `docs/handover-mobile-outlet-form-gps-layout-and-toast-resilience.md` | Execution handover reference. |

## 2. Phased Implementation Steps

### Phase 1: GPS Header Layout Restructuring
- [x] In `src/components/views/OutletsView/OutletFormModal.tsx`:
  - Added `whitespace-nowrap` to `GPS Coordinates` title.
  - Isolated desktop link with `hidden sm:inline-flex`.
  - Added mobile dedicated link row with `sm:hidden pt-1`.
- [x] Verified via `outletFormModalMobileUx.test.ts` (GPS layout tests pass).

### Phase 2: Toast Touch Resilience & Cleanup
- [x] In `src/components/views/OutletsView/OutletFormModal.tsx`:
  - Assigned stable `GPS_TOAST_ID = "outlet-gps-toast"`.
  - Dispatched detection toast with `style: { pointerEvents: "none" }`.
  - Added `useEffect` cleanup calling `toast.dismiss(GPS_TOAST_ID)`.
- [x] In `src/app/globals.css`:
  - Configured `[data-sonner-toaster]` with `pointer-events: none`.
  - Configured `[data-sonner-toast]` with `pointer-events: auto`.
- [x] Verified via `outletFormModalMobileUx.test.ts` (toast resilience tests pass).

### Phase 3: Quality Gates & Verification
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm run test:smoke` passes with 150/150 tests.
- [x] `npm test` passes with 966/966 tests.


