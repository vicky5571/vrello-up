# Spec: Wizard Step Transition Submission Guard and Placement Date Sanitization Design

- **Status:** Approved
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0080-wizard-step-transition-guard-and-date-sanitization.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-wizard-step-transition-guard-and-date-sanitization.md`

---

## 1. Executive Summary

During field POSM placement execution, advancing from Step 3 (Bukti Foto Fisik) to Step 4 (Verifikasi Lokasi & GPS) via the `"Lanjut"` button inadvertently triggers an immediate automatic submission of the placement form. The modal transitions prematurely to `"Menyimpan..."` and issues `POST /api/marcom/placements` before the operator has inspected or calibrated Step 4.

Simultaneously, the API call crashes with an HTTP 500 error:
`PrismaClientValidationError: Invalid prisma.placement.create() invocation: data: { date: "2026-11-07" }`.

This specification designs a robust, two-tier resolution:
1. **Client-Side Event & DOM Isolation**:
   - Force React to tear down and reconstruct the action button across step changes in `WizardFooter.tsx` using explicit, distinct `key` attributes (`key="wizard-btn-next"` and `key="wizard-btn-submit"`).
   - Guard `<form onSubmit>` in `PlacementFormModal.tsx` so that submission is strictly rejected unless `currentStep === 4`.
2. **Server-Side Date Normalization**:
   - Safely parse incoming `date` strings (`"YYYY-MM-DD"`, ISO strings, or nullish values) in `POST /api/marcom/placements/route.ts` and `PATCH /api/marcom/placements/[id]/route.ts` into valid JavaScript `Date` instances before executing Prisma queries.

---

## 2. Technical Anatomy & Design Solution

### 2.1 UI Layer: DOM Element Reconciliation & Synthetic Click Bleed

#### Problem
In `WizardFooter.tsx`, the primary right-hand button is conditionally rendered in a ternary:
```tsx
{!isFinalStep ? (
  <button type="button" onClick={onNextStep}>...</button>
) : (
  <button type="submit">...</button>
)}
```
When no `key` attribute is specified, React's diffing algorithm preserves the underlying HTML `<button>` DOM element and mutates its attributes (`type="button"` -> `type="submit"`). In touch screen environments (e.g. mobile Chrome emulation on Samsung Galaxy A55), synthetic click events dispatched following `touchend` resolve after state updates have committed, delivering the click to a button that is now `type="submit"`. The browser dispatches a form `submit` event that triggers `onSave` immediately.

#### Solution
1. Assign distinct `key` props to each button:
   - Next Button: `key="wizard-btn-next"`
   - Submit Button: `key="wizard-btn-submit"`
   When `isFinalStep` toggles, React destroys the previous DOM node and instantiates a new one. The synthetic click event from the previous node is dropped.
2. In `PlacementFormModal.tsx`, introduce a defensive submission handler:
   ```tsx
   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (currentStep !== 4) {
       return;
     }
     onSave(e);
   };
   ```
   Attach `<form onSubmit={handleFormSubmit}>`. Any rogue submit events generated while on steps 1, 2, or 3 are completely blocked.

---

### 2.2 API Layer: Prisma DateTime Coercion

#### Problem
Prisma's `Placement.date` field is typed as `DateTime?`. Prisma Client rejects string dates lacking time components (`"2026-11-07"`), throwing a runtime `PrismaClientValidationError`.

#### Solution
In `src/app/api/marcom/placements/route.ts` and `src/app/api/marcom/placements/[id]/route.ts`:
```ts
// Safe date parsing helper
function parsePlacementDate(rawDate: unknown): Date | null {
  if (!rawDate) return null;
  const parsed = new Date(rawDate as string);
  return !isNaN(parsed.getTime()) ? parsed : null;
}
```
Apply `parsePlacementDate(date)` before constructing the `prisma.placement.create` and `prisma.placement.update` payloads:
```ts
const validDate = parsePlacementDate(date);

const placement = await prisma.placement.create({
  data: {
    ...
    date: validDate,
    ...
  }
});
```

---

## 3. Data Contracts & Invariants

1. **Date Contract Flexibility**: The API accepts ISO strings (e.g. `"2026-11-07T15:27:00.000Z"`), date-only strings (e.g. `"2026-11-07"`), or null/undefined, and normalizes them into PostgreSQL/SQLite `DateTime` values or `null`.
2. **Step Completion Invariant**: Advancing to Step 4 must NEVER persist data to the server until the operator explicitly clicks `"Simpan Eksekusi POSM"` on Step 4.
3. **Coordinator File Budgets**: `PlacementFormModal.tsx` must remain $\le 350$ LOC (currently 310 LOC).

---

## 4. Acceptance Criteria

- [ ] Transitioning from Step 3 to Step 4 via the `"Lanjut"` button advances the wizard to Step 4 (Verifikasi Lokasi) WITHOUT initiating network requests to `/api/marcom/placements`.
- [ ] Modal displays Step 4 interactive map and location summary cleanly, with the button reading `"Simpan Eksekusi POSM"` (or `"Perbarui Eksekusi"` in edit mode), NOT `"Menyimpan..."`.
- [ ] Clicking `"Simpan Eksekusi POSM"` on Step 4 submits the form with HTTP 201 status and 0 Prisma validation errors.
- [ ] `POST /api/marcom/placements` and `PATCH /api/marcom/placements/[id]` successfully accept `"YYYY-MM-DD"` date strings and convert them to valid Prisma `DateTime` objects.
- [ ] Unit tests in `placementDateSanitization.test.ts` pass 100%.
- [ ] Unit tests in `placementStepTransitionGuard.test.ts` pass 100%.
- [ ] Invariants: `npm run drift:check` passes with 0 drift (107/107 spec-plan pairs).
- [ ] Build & smoke tests pass with 0 errors.

---

## 5. Non-Goals

- Modifying the Prisma database schema or altering `date DateTime?`.
- Altering the map layout or Leaflet pin behaviors in `Step4LocationVerification.tsx`.

