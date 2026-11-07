# Handover: Mobile View Switcher Track & Pill Height Equalization (Outlets & Placements)

- **Status:** IMPLEMENTED & VERIFIED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization.md`
- **ADR:** `docs/adr/0070-mobile-view-switcher-track-and-pill-height-equalization.md`

## 1. Target Files & Purpose

1. `src/components/views/OutletsView/OutletsHeader.tsx` — Track container uses `items-stretch sm:items-center`, buttons use `min-h-[40px] sm:min-h-0`.
2. `src/components/views/PlacementsView/PlacementFilterControls.tsx` — Track container uses `items-stretch sm:items-center`, buttons use `min-h-[40px] sm:min-h-0`.
3. Test suites in `outletsHeaderResponsiveness.test.ts` and `placementsHeaderResponsiveness.test.ts`.

---

## 2. Exact Implementation Snippets

### File: `src/components/views/OutletsView/OutletsHeader.tsx` (Lines 117–134)
```tsx
<div
  role="tablist"
  aria-label="View Mode Switcher"
  className="w-full sm:w-auto flex items-stretch sm:items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
>
  <motion.button
    type="button"
    role="tab"
    aria-selected={viewMode === "table"}
    whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
    onClick={() => onViewModeChange("table")}
    className={cn(
      "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 min-h-[40px] sm:min-h-0 rounded-md text-xs font-semibold transition-colors cursor-pointer",
      viewMode === "table"
        ? "text-orange-600 dark:text-orange-400 font-bold"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
    )}
  >
```

### File: `src/components/views/PlacementsView/PlacementFilterControls.tsx` (Lines 121–143)
```tsx
<div
  role="tablist"
  aria-label="Placements View Switcher"
  className="relative w-full sm:w-auto flex items-stretch sm:items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0"
>
  {VIEW_SWITCHER_OPTIONS.map((opt) => {
    const Icon = opt.icon;
    const isActive = viewMode === opt.id;
    return (
      <motion.button
        key={opt.id}
        type="button"
        role="tab"
        aria-selected={isActive}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        onClick={() => onViewModeChange(opt.id)}
        className={cn(
          "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 min-h-[40px] sm:min-h-0 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer",
          isActive
            ? "text-slate-900 dark:text-slate-100"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
```

---

## 3. Explicit "Do Not Touch" List

- **Desktop Invariants:** Do NOT remove `sm:items-center` or `sm:min-h-0`. Desktop switcher must remain compact and centered.
- **Content Centering:** Buttons must retain `inline-flex items-center justify-center` so stretched buttons vertically center their inner content.
- **Coordinator LOC:** Keep both files strictly <= 250 LOC.

---

## 4. Verification & Regression Checklist

- [x] Outlets view switcher track uses `items-stretch sm:items-center`.
- [x] Outlets tab buttons use `min-h-[40px] sm:min-h-0`.
- [x] Placements view switcher track uses `items-stretch sm:items-center`.
- [x] Placements tab buttons use `min-h-[40px] sm:min-h-0`.
- [x] `outletsHeaderResponsiveness.test.ts` passes (11/11).
- [x] `placementsHeaderResponsiveness.test.ts` passes (5/5).
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm run test:smoke` passes with 150/150 tests.
- [x] `npm test` passes with 966/966 tests.


