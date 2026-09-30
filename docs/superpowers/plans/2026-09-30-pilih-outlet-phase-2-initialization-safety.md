# Pilih Outlet Phase 2: Initialization Safety & Navigation Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the dangerous default pre-selection of `outletsList[0]` upon modal open, and remove the disorienting automatic jump to Step 2 so the user retains conscious control over the selection.

**Architecture:** Initialize `modalPlacement.outletId` as an empty string (`""`) in `usePlacementMutations.ts`, ensuring the wizard starts with a blank search state. Remove the forced `setCurrentStep(2)` invocation in `PlacementFormModal.tsx` when an outlet is picked, allowing the field officer to review the selected outlet profile, brand, and GPS status before consciously clicking "Lanjut".

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Zustand 5, Node test runner (`node:test`).

**Spec:** [`docs/audit-add-placement-outlet-selection.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-add-placement-outlet-selection.md)

## Global Constraints

- Field Safety Invariant: Creating a new placement MUST NEVER pre-populate an arbitrary store ID. The user must explicitly search or pick the outlet.
- Wizard Contract: `canAdvanceFromStep(1, placement)` must strictly guard progression until `outletId` is non-empty.
- Zero Regressions: Editing an existing placement (`placement.id` present) must continue to hydrate the existing outlet correctly.
- Test Coverage: Verify step advancement gates with unit tests.

---

## File Structure

```text
src/components/views/PlacementsView/
├── usePlacementMutations.ts                   # Modified: initialize clean empty outlet state in handleOpenAddPlacement
├── PlacementFormModal.tsx                     # Modified: remove forced step 2 auto-advance on store selection
└── wizard/
    └── placementWizardHelpers.test.ts         # Extended: verify empty initial state safety and step advance gating
```

---

### Task 1: Enforce Safe Blank Initialization on Modal Open

**Files:**
- Modify: `src/components/views/PlacementsView/usePlacementMutations.ts:54-85`
- Test: `src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts`

**Interfaces:**
- Produces:
  - Clean initial state object for `modalPlacement` with `outletId: ""`

- [ ] **Step 1: Write test for initial state validity and advance gating**

```typescript
// Add to src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
test("initial new placement state with empty outletId cannot advance from Step 1", () => {
  const initialNewPlacement: Partial<MarcomPlacement> = {
    outletId: "",
    status: "NOT_STARTED",
    brand: "IM3",
    date: new Date().toISOString().slice(0, 10),
  };

  assert.equal(canAdvanceFromStep(1, initialNewPlacement), false);

  const populatedPlacement = {
    ...initialNewPlacement,
    outletId: "outlet-123",
  };

  assert.equal(canAdvanceFromStep(1, populatedPlacement), true);
});
```

- [ ] **Step 2: Run test to confirm baseline passes**

```bash
npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
```

- [ ] **Step 3: Refactor `handleOpenAddPlacement` in `usePlacementMutations.ts`**

In `src/components/views/PlacementsView/usePlacementMutations.ts:54-85`, replace the pre-selection of `outletsList[0]` with an empty, safe initial state:

```typescript
  const handleOpenAddPlacement = useCallback(() => {
    setModalPlacement({
      outletId: "",
      materialId: "",
      mouId: "",
      status: "NOT_STARTED",
      brand: "IM3",
      dimensions: "",
      cost: undefined,
      picName: "",
      notes: "",
      photoUrl: "",
      date: new Date().toISOString().slice(0, 10),
      latitude: null,
      longitude: null,
      shareLocationUrl: "",
      locationNotes: "",
    });
  }, [setModalPlacement]);
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
```

---

### Task 2: Remove Disorienting Auto-Advance to Step 2

**Files:**
- Modify: `src/components/views/PlacementsView/PlacementFormModal.tsx:180-184`

**Interfaces:**
- Consumes:
  - `handleSelectOutlet` callback in `PlacementFormModalContent`

- [ ] **Step 1: Remove forced `setCurrentStep(2)` in `PlacementFormModal.tsx`**

In `src/components/views/PlacementsView/PlacementFormModal.tsx`:
Delete lines 180–183:
```typescript
// Fast auto-advance to step 2 upon selecting store (if on step 1)
if (currentStep === 1) {
  setCurrentStep(2);
}
```

- [ ] **Step 2: Verify user flow and step navigation controls**

Verify that when `handleSelectOutlet` is triggered:
1. `setPlacement` updates the state with smart defaults.
2. The user remains on Step 1, viewing the selected store card in `OutletSearchCombobox`.
3. The wizard navigation button `"Lanjut"` becomes active and enabled (via `canAdvance = canAdvanceFromStep(1, placement)`).
4. The user clicks `"Lanjut"` to proceed to Step 2 when ready.

- [ ] **Step 3: Run full placement test suite to verify no regressions**

```bash
npm test -- src/components/views/PlacementsView/wizard/placementWizardHelpers.test.ts
```
