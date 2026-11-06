# Implementation Plan: Mobile View Switcher Full-Width & Action Row Right Alignment

- **Date:** 2026-11-06
- **Status:** IMPLEMENTED
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-view-switcher-and-action-alignment-design.md
- **Refs:** ADR-0061, ADR-0060, ADR-0059

---

## 1. Overview & File Manifest

This plan implements right-aligned action buttons and full-width segmented view mode switchers across `PlacementsHeader.tsx`, `PlacementFilterControls.tsx`, `OutletsHeader.tsx`, and `EventsHeader.tsx` on mobile smartphones (< 640px), while strictly preserving 100% byte-for-byte desktop fidelity.

### File Manifest:
1. `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` (Unit test for right-aligned actions and full-width switcher)
2. `src/components/views/PlacementsView/PlacementsHeader.tsx` (Action row right-alignment)
3. `src/components/views/PlacementsView/PlacementFilterControls.tsx` (Full-width segmented view switcher)
4. `src/components/views/OutletsView/OutletsHeader.tsx` (Matching right-alignment and full-width switcher)
5. `src/components/views/EventsView/EventsHeader.tsx` (Matching right-alignment and full-width switcher)
6. `docs/handover-mobile-view-switcher-and-action-alignment.md` (Execution-ready handover document)
7. `docs/SESSION_STATE.md` (Session state tracking)

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Development (Red Phase)
- [x] Task 1.1: Create `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts`.
- [x] Task 1.2: Add assertions for `PlacementsHeader.tsx` action row: `justify-end sm:justify-start w-full sm:w-auto`.
- [x] Task 1.3: Add assertions for `PlacementFilterControls.tsx` switcher: `w-full sm:w-auto`, tabs `flex-1 sm:flex-initial justify-center`.
- [x] Task 1.4: Update `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` with matching assertions for `OutletsHeader.tsx`.
- [x] Task 1.5: Run `npx tsx --test src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` to establish failing state (Red Phase).

### Phase 2: Layout Implementation across View Headers (Green Phase)
- [x] Task 2.1: In `src/components/views/PlacementsView/PlacementsHeader.tsx`:
  Update action buttons container to:
  `className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto"`
- [x] Task 2.2: In `src/components/views/PlacementsView/PlacementFilterControls.tsx`:
  Update `PlacementViewSwitcher` outer wrapper to `className="relative w-full sm:w-auto flex items-center ..."`
  and tab button to `className="relative flex-1 sm:flex-initial inline-flex items-center justify-center ..."`
- [x] Task 2.3: In `src/components/views/OutletsView/OutletsHeader.tsx`:
  Update action row to `className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto"`
  and view mode switcher to `className="w-full sm:w-auto flex items-center ..."` with tabs `flex-1 sm:flex-initial justify-center`.
- [x] Task 2.4: In `src/components/views/EventsView/EventsHeader.tsx`:
  Update action row to `className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto"`
  and view switcher to `className="w-full sm:w-auto flex items-center ..."` with tabs `flex-1 sm:flex-initial justify-center`.
- [x] Task 2.5: Run targeted unit tests to verify passing state (Green Phase).

### Phase 3: Verification Gates & Quality Assurance
- [x] Task 3.1: Run `npm run drift:check` (88/88 pairs valid, coordinator sizes $\le 250$ LOC).
- [x] Task 3.2: Run `npm run build:check` (0 TypeScript compilation errors).
- [x] Task 3.3: Run `npm run test:smoke` (0 failures).
- [x] Task 3.4: Complete and verify `docs/handover-mobile-view-switcher-and-action-alignment.md`.
- [x] Task 3.5: Update `docs/SESSION_STATE.md` with ADR-0061 completion.

---

## 3. Verification Commands

```bash
# 1. Targeted Unit Tests
npx tsx --test src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts
npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts

# 2. Drift & Architecture Guard
npm run drift:check

# 3. TypeScript Typecheck
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke
```

---

## 4. Rollback Strategy

If regressions occur:
1. Revert modified headers via `git checkout src/components/views/PlacementsView/ src/components/views/OutletsView/ src/components/views/EventsView/`.
2. Confirm with `npm run drift:check` and `npm run build:check`.



