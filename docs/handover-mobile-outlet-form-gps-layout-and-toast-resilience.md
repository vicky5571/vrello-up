# Handover: Mobile Outlet Form GPS Layout & Toast Touch Resilience

- **Status:** IMPLEMENTED & VERIFIED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-outlet-form-gps-layout-and-toast-resilience-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-07-mobile-outlet-form-gps-layout-and-toast-resilience.md`
- **ADR:** `docs/adr/0071-mobile-outlet-form-gps-layout-and-toast-resilience.md`

## 1. Target Files & Purpose

1. `src/components/views/OutletsView/OutletFormModal.tsx` — Restructures GPS picker layout with 2 rows on mobile and implements pass-through toast resilience with unmount cleanup.
2. `src/app/globals.css` — Configures toaster container pointer-events pass-through.
3. Test suite in `src/components/views/OutletsView/outletFormModalMobileUx.test.ts`.

---

## 2. Exact Implementation Snippets

### File: `src/components/views/OutletsView/OutletFormModal.tsx` (GPS Layout Lines)
```tsx
<div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-1.5 min-w-0">
    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
      GPS Coordinates
    </span>
  </div>
  {hasCoords && (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
    >
      <span>View on Maps</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  )}
</div>

{hasCoords && (
  <div className="sm:hidden pt-1">
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
    >
      <span>View on Maps</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  </div>
)}
```

### File: `src/components/views/OutletsView/OutletFormModal.tsx` (Toast Resilience)
```tsx
const GPS_TOAST_ID = "outlet-gps-toast";

// Inside detection handler:
toast.success("Koordinat GPS berhasil disematkan", {
  id: GPS_TOAST_ID,
  style: { pointerEvents: "none" },
});

// Inside component body:
useEffect(() => {
  return () => {
    toast.dismiss(GPS_TOAST_ID);
  };
}, []);
```

### File: `src/app/globals.css`
```css
[data-sonner-toaster] {
  pointer-events: none;
}
[data-sonner-toast] {
  pointer-events: auto;
}
```

---

## 3. Explicit "Do Not Touch" List

- **`[data-sonner-toast] pointer-events: auto`:** Do NOT remove; toasts must remain individually clickable if interactive.
- **`whitespace-nowrap` on GPS title:** Do NOT remove; prevents multi-line wrapping on narrow phones.
- **Unmount Cleanup:** `toast.dismiss(GPS_TOAST_ID)` must remain inside `useEffect` cleanup.

---

## 4. Verification & Regression Checklist

- [x] GPS title uses `whitespace-nowrap`.
- [x] Desktop link uses `hidden sm:inline-flex`.
- [x] Mobile link uses `sm:hidden`.
- [x] Detection toast uses `pointerEvents: "none"`.
- [x] Detection toast is dismissed on unmount.
- [x] `[data-sonner-toaster]` has `pointer-events: none` in `globals.css`.
- [x] `outletFormModalMobileUx.test.ts` passes (7/7).
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm run test:smoke` passes with 150/150 tests.
- [x] `npm test` passes with 966/966 tests.


