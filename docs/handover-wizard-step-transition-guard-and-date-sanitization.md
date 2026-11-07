# Handover: Wizard Step Transition Submission Guard and Placement Date Sanitization

- **Status:** Execution-Ready
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0080-wizard-step-transition-guard-and-date-sanitization.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-wizard-step-transition-guard-and-date-sanitization-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-wizard-step-transition-guard-and-date-sanitization.md`

---

## 1. Target Files & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/app/api/marcom/placements/route.ts` | Normalize incoming `date` string to `Date | null` before `prisma.placement.create` |
| `src/app/api/marcom/placements/[id]/route.ts` | Normalize incoming `date` string to `Date | null` before `prisma.placement.update` |
| `src/components/views/PlacementsView/wizard/WizardFooter.tsx` | Add explicit `key` props to separate next and submit buttons in React DOM reconciliation |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Add `handleFormSubmit` guard to reject form submissions when `currentStep !== 4` |
| `src/app/api/marcom/placements/placementDateSanitization.test.ts` | TDD test verifying API accepts `"YYYY-MM-DD"` without Prisma validation errors |
| `src/components/views/PlacementsView/placementStepTransitionGuard.test.ts` | TDD test verifying button keys and modal form step guard |

---

## 2. Exact Code Changes

### A. In `src/app/api/marcom/placements/route.ts`:
Add helper near top or before `POST`:
```ts
function parsePlacementDate(rawDate: unknown): Date | null {
  if (!rawDate) return null;
  const parsed = new Date(rawDate as string);
  return !isNaN(parsed.getTime()) ? parsed : null;
}
```
In `POST`:
Change line 135:
```ts
// FROM:
        date,
// TO:
        date: parsePlacementDate(date),
```

### B. In `src/app/api/marcom/placements/[id]/route.ts`:
Add helper:
```ts
function parsePlacementDate(rawDate: unknown): Date | null {
  if (!rawDate) return null;
  const parsed = new Date(rawDate as string);
  return !isNaN(parsed.getTime()) ? parsed : null;
}
```
In `PATCH` handler before calling `prisma.placement.update`:
```ts
  if (data.date !== undefined) {
    data.date = parsePlacementDate(data.date) as unknown as string;
  }
```

### C. In `src/components/views/PlacementsView/wizard/WizardFooter.tsx`:
Add `key` attributes to the right-hand action buttons:
```tsx
        {!isFinalStep ? (
          <button
            key="wizard-btn-next"
            type="button"
            onClick={onNextStep}
            disabled={!canAdvance || isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-lime-600 hover:bg-lime-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Lanjut</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            key="wizard-btn-submit"
            type="submit"
            disabled={!canAdvance || isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-lime-600 hover:bg-lime-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
```

### D. In `src/components/views/PlacementsView/PlacementFormModal.tsx`:
Before `return`:
```tsx
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 4) {
      return;
    }
    onSave(e);
  };
```
Change line 238:
```tsx
// FROM:
<form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
// TO:
<form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
```

---

## 3. Explicit "Do Not Touch" List

1. **`prisma/schema.prisma`**: Do NOT modify database models or run migrations. `date DateTime?` is already standard.
2. **`usePlacementMutations.ts`**: Do NOT alter query mutation logic or notification handling.
3. **`Step4LocationVerification.tsx` & `LocationPicker.tsx`**: Do NOT modify map initialization or coordinate sync logic.
4. **Coordinator Budgets**: `PlacementFormModal.tsx` must stay $\le 350$ LOC (currently 310 LOC, addition is only 7 LOC).

---

## 4. Numbered Execution Order

1. **Step 1**: Write test suites `placementDateSanitization.test.ts` and `placementStepTransitionGuard.test.ts`. Run to verify RED.
2. **Step 2**: Implement date parsing in `src/app/api/marcom/placements/route.ts` and `[id]/route.ts`. Verify API tests turn GREEN.
3. **Step 3**: Implement button keys in `WizardFooter.tsx` and submit guard in `PlacementFormModal.tsx`. Verify UI tests turn GREEN.
4. **Step 4**: Run `npm run build:check` (0 errors).
5. **Step 5**: Run `npm run drift:check` (107/107 pairs, 0 drift).
6. **Step 6**: Run `npm run test:smoke` and full `npm test`.
7. **Step 7**: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
8. **Step 8**: Commit git changes.

---

## 5. Acceptance Criteria Checklist

- [ ] Advancing to Step 4 from Step 3 does NOT trigger a network save or display "Menyimpan...".
- [ ] Button on Step 4 displays "Simpan Eksekusi POSM" and requires an explicit click to save.
- [ ] Dates formatted as `"YYYY-MM-DD"` or ISO strings save successfully with HTTP 201 and 0 Prisma errors.
- [ ] Full quality gates pass (`drift:check`, `build:check`, `test:smoke`, `npm test`).

