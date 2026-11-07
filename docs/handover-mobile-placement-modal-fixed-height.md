# Execution Handover: Mobile Placement Modal Viewport Height Stabilization and Search Results Expansion

- **Target ADR:** `docs/adr/0076-mobile-placement-modal-fixed-height-and-search-expansion.md`
- **Target Spec:** `docs/superpowers/specs/2026-11-07-mobile-placement-modal-fixed-height-design.md`
- **Target Plan:** `docs/superpowers/plans/2026-11-07-mobile-placement-modal-fixed-height.md`
- **Status:** EXECUTION-READY

## 1. File Manifest

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/placementModalResponsiveness.test.ts` | Unit & responsiveness regression test suite verifying modal height and search expansion |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Wizard modal coordinating POSM placement steps with pinned footer |
| `src/components/views/PlacementsView/OutletSearchCombobox.tsx` | Search combobox rendering expanded search results dropdown |

---

## 2. Current Code Snippets

### Snippet A: Modal Container in `PlacementFormModal.tsx` (Lines 208–213)
```tsx
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
```

### Snippet B: Search Results List Container in `OutletSearchCombobox.tsx` (Lines 670–676)
```tsx
                <ul
                  ref={listRef}
                  id={`${id}-listbox`}
                  role="listbox"
                  className="overflow-y-auto max-h-60 sm:max-h-72 divide-y divide-slate-100 dark:divide-slate-700/50 p-1.5"
                >
```

---

## 3. Exact Change Instructions

### Change 1: `src/components/views/PlacementsView/PlacementFormModal.tsx`

**Line 210 Replacement:**

DELETE:
```tsx
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
```

REPLACE WITH:
```tsx
      <div className="w-full max-w-xl h-[88dvh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
```

**Line 239 Replacement (Form Scroll Body):**

DELETE:
```tsx
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[340px] space-y-4">
```

REPLACE WITH:
```tsx
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
```

### Change 2: `src/components/views/PlacementsView/OutletSearchCombobox.tsx`

**Line 674 Replacement:**

DELETE:
```tsx
                  className="overflow-y-auto max-h-60 sm:max-h-72 divide-y divide-slate-100 dark:divide-slate-700/50 p-1.5"
```

REPLACE WITH:
```tsx
                  className="overflow-y-auto max-h-80 sm:max-h-72 divide-y divide-slate-100 dark:divide-slate-700/50 p-1.5"
```

---

## 4. Do Not Touch List

| File / Component | Reason |
| :--- | :--- |
| `src/components/views/PlacementsView/wizard/WizardFooter.tsx` | Footer button action and state logic; intact |
| `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx` | Progress bar and stepper; intact |
| Desktop CSS breakpoints (`sm:`, `md:`, `lg:`) | Desktop modal height must remain auto bounded by `sm:max-h-[92vh]` |

---

## 5. Numbered Execution Order

1. **Create Test File:**
   - Create `src/components/views/PlacementsView/placementModalResponsiveness.test.ts`.
   - Implement test assertions verifying `h-[88dvh] sm:h-auto sm:max-h-[92vh]` on modal dialog container, `min-h-0` on scroll body, and `max-h-80 sm:max-h-72` on search results list.
   - Run `npx tsx --test src/components/views/PlacementsView/placementModalResponsiveness.test.ts` (verify RED / baseline failure).
2. **Apply PlacementFormModal & OutletSearchCombobox Refactors:**
   - In `src/components/views/PlacementsView/PlacementFormModal.tsx`:
     - Apply Change 1 (Line 210 `h-[88dvh] sm:h-auto sm:max-h-[92vh]` and Line 239 `min-h-0`).
   - In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:
     - Apply Change 2 (Line 674 `max-h-80 sm:max-h-72`).
3. **Verify Tests & Build:**
   - Run `npx tsx --test src/components/views/PlacementsView/placementModalResponsiveness.test.ts` (verify GREEN).
   - Run `npm run drift:check` (verify 103/103 spec-plan pairs).
   - Run `npm run build:check` (verify 0 TypeScript errors).
   - Run `npm test` (verify all placement tests pass).
4. **Update Session Documentation:**
   - Update `CHANGELOG.md` with ADR-0076 entry.
   - Update `docs/SESSION_STATE.md`.

---

## 6. Acceptance Criteria Checklist

- [ ] Mobile placement modal maintains a stable `88dvh` height across all search states.
- [ ] Wizard footer containing `"Batal"` and `"Lanjut"` stays permanently pinned at bottom on mobile without jumping.
- [ ] Mobile search results list expands from `max-h-60` (240px) to `max-h-80` (320px).
- [ ] Internal form body scrolls smoothly via `min-h-0 flex-1 overflow-y-auto`.
- [ ] Desktop viewport ($\ge 640\text{px}$) maintains auto-height behavior bounded by `sm:max-h-[92vh]` and `sm:max-h-72`.



