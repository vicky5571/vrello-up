# Plan: Wizard Step Transition Submission Guard and Placement Date Sanitization

- **Status:** In Progress
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0080-wizard-step-transition-guard-and-date-sanitization.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-wizard-step-transition-guard-and-date-sanitization-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/app/api/marcom/placements/placementDateSanitization.test.ts` | Create | Unit test suite for API POST/PATCH accepting `"YYYY-MM-DD"` dates | +65 LOC |
| `src/components/views/PlacementsView/placementStepTransitionGuard.test.ts` | Create | Unit test suite verifying button keys and modal form step guard | +60 LOC |
| `src/app/api/marcom/placements/route.ts` | Modify | Add `parsePlacementDate` helper and coerce `date` before `prisma.placement.create` | +12 LOC |
| `src/app/api/marcom/placements/[id]/route.ts` | Modify | Add `parsePlacementDate` helper and coerce `data.date` before `prisma.placement.update` | +10 LOC |
| `src/components/views/PlacementsView/wizard/WizardFooter.tsx` | Modify | Add `key="wizard-btn-next"` and `key="wizard-btn-submit"` to isolate DOM buttons | +4 LOC |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Modify | Add `handleFormSubmit` guard ensuring submission only occurs when `currentStep === 4` | +10 LOC |
| `docs/handover-wizard-step-transition-guard-and-date-sanitization.md` | Create | Execution-ready handover guide with exact code diffs and boundaries | +90 LOC |
| `docs/SESSION_STATE.md` | Modify | Track active feature planning completion | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness & Baseline Verification (TDD First)
- [ ] Create `src/app/api/marcom/placements/placementDateSanitization.test.ts`:
  - [ ] Test 1: POST `/api/marcom/placements` with date `"2026-11-07"` returns 201 without Prisma error.
  - [ ] Test 2: POST `/api/marcom/placements` with ISO date string returns 201.
  - [ ] Test 3: POST `/api/marcom/placements` with null/omitted date returns 201.
- [ ] Create `src/components/views/PlacementsView/placementStepTransitionGuard.test.ts`:
  - [ ] Test 1: `WizardFooter.tsx` renders `key="wizard-btn-next"` on the next button and `key="wizard-btn-submit"` on submit button.
  - [ ] Test 2: `PlacementFormModal.tsx` attaches `handleFormSubmit` guard requiring `currentStep === 4`.
- [ ] Run test suites to verify RED baseline.

### Phase 2: API Date Sanitization Implementation
- [ ] Update `src/app/api/marcom/placements/route.ts`:
  - [ ] Add `parsePlacementDate(rawDate: unknown): Date | null`.
  - [ ] Pass `date: parsePlacementDate(date)` into `prisma.placement.create`.
- [ ] Update `src/app/api/marcom/placements/[id]/route.ts`:
  - [ ] Add `parsePlacementDate(rawDate: unknown): Date | null`.
  - [ ] Normalize `data.date` via `parsePlacementDate(data.date)` if provided.
- [ ] Run `node --import tsx --test src/app/api/marcom/placements/placementDateSanitization.test.ts` to verify GREEN.

### Phase 3: UI DOM Button Isolation & Form Step Guard
- [ ] Update `src/components/views/PlacementsView/wizard/WizardFooter.tsx`:
  - [ ] Add `key="wizard-btn-next"` to `<button type="button" onClick={onNextStep}>`.
  - [ ] Add `key="wizard-btn-submit"` to `<button type="submit">`.
- [ ] Update `src/components/views/PlacementsView/PlacementFormModal.tsx`:
  - [ ] Define `handleFormSubmit`:
    ```tsx
    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (currentStep !== 4) return;
      onSave(e);
    };
    ```
  - [ ] Bind `<form onSubmit={handleFormSubmit}>`.
  - [ ] Verify coordinator file size $\le 350$ LOC.
- [ ] Run `node --import tsx --test src/components/views/PlacementsView/placementStepTransitionGuard.test.ts` to verify GREEN.

### Phase 4: Full Invariant Verification & Session Handoff
- [ ] Run `npm run drift:check` (verify 107/107 spec-plan pairs).
- [ ] Run `npm run build:check` (verify 0 TypeScript compilation errors).
- [ ] Run `npm run test:smoke` (verify all smoke tests pass).
- [ ] Run full `npm test` (verify 0 regressions).
- [ ] Update `CHANGELOG.md` with ADR-0080 entry.
- [ ] Update `docs/SESSION_STATE.md`.
- [ ] Git commit planning artifacts.

