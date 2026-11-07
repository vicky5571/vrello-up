# Design Spec: Mobile Outlet Form GPS Layout & Toast Touch Resilience

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0071-mobile-outlet-form-gps-layout-and-toast-resilience.md`

## 1. Executive Summary & Problem Context

In `OutletFormModal.tsx`, mobile operators (< 640px) encountered:
1. Multi-line wrapping of the GPS coordinates header title and external map link on 360px–390px screens.
2. Inadvertent touch-pause locks on Sonner toasts that blocked user taps on the modal's top-right `Close` (X) button.

This specification details a 2-row responsive header layout, stable toast identifier scoping with pointer-event pass-through, and global toaster stacking rules.

## 2. Component Specifications & Code Contracts

### 2.1 File: `src/components/views/OutletsView/OutletFormModal.tsx`

#### GPS Picker Header Layout
```tsx
<div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-1.5 min-w-0">
    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
      GPS Coordinates
    </span>
  </div>
  {/* Desktop inline link */}
  {hasCoords && (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-600 ..."
    >
      <span>View on Maps</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  )}
</div>

{/* Dedicated Mobile link row */}
{hasCoords && (
  <div className="sm:hidden pt-1">
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-blue-600 ..."
    >
      <span>View on Maps</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  </div>
)}
```

#### Toast Resilience & Cleanup
```tsx
const GPS_TOAST_ID = "outlet-gps-toast";

// Toast dispatch with pass-through pointer events
toast.success("Koordinat GPS berhasil disematkan", {
  id: GPS_TOAST_ID,
  style: { pointerEvents: "none" },
});

// Unmount cleanup
useEffect(() => {
  return () => {
    toast.dismiss(GPS_TOAST_ID);
  };
}, []);
```

### 2.2 File: `src/app/globals.css`
```css
[data-sonner-toaster] {
  pointer-events: none;
}
[data-sonner-toast] {
  pointer-events: auto;
}
```

## 3. Invariants & Guardrails

1. **Dismissal Accessibility:** Taps anywhere near modal close triggers must never be absorbed by invisible toast containers.
2. **Whitespace Protection:** Section title `GPS Coordinates` must never wrap.
3. **Coordinator Safety:** Modal component remains strictly bounded in complexity.

## 4. Non-Goals

- No modification to GPS geocoding accuracy or reverse lookup APIs.

## 5. Test & Verification Plan

### 5.1 Unit Tests (`src/components/views/OutletsView/outletFormModalMobileUx.test.ts`)
- Asserts `hidden sm:inline-flex` for desktop link.
- Asserts `sm:hidden` for mobile link.
- Asserts `whitespace-nowrap` on GPS header.
- Asserts `pointerEvents: "none"` on detection toast.
- Asserts `toast.dismiss(GPS_TOAST_ID)` on unmount.
- Asserts global CSS rules for `[data-sonner-toaster]`.

### 5.2 Verification Gates
- `npm run drift:check`: 0 drift, 100% spec-plan pairing.
- `npm run build:check`: `tsc --noEmit` 0 errors.
- `npm run test:smoke`: 150/150 smoke tests passing.
- `npm test`: 100% test suite passing.



