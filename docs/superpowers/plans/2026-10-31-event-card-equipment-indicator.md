# Implementation Plan: Event Card Equipment Logistics Indicator Chip

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`  
**ADR:** `docs/adr/0006-event-card-equipment-indicator.md`  
**Status:** Planned  

---

## 1. Overview & Strategy

Implement an equipment indicator chip in `EventCardsView.tsx` to display physical equipment counts and overdue alerts on field event cards without opening the detail drawer. The implementation uses pure helper functions, TDD unit testing, and reactive store caching via `useMarcomDataStore`.

---

## 2. File Manifest & LOC Estimates

| File | Action | Purpose | LOC Est. |
|---|---|---|---|
| `src/lib/marcom/eventEquipmentHelpers.ts` | Create | Pure helper function `getEventEquipmentSummary` | ~45 LOC |
| `src/lib/marcom/eventEquipmentHelpers.test.ts` | Create | Unit test suite covering counts, overdue states, and edge cases | ~85 LOC |
| `src/components/views/EventsView/EventCardsView.tsx` | Modify | Integrate `getEventEquipmentSummary` and render the responsive chip | +20 LOC |
| `src/components/views/EventsView/EventsView.tsx` | Modify | Ensure `fetchBorrowRecords()` is invoked on mount alongside `fetchEvents()` | +4 LOC |
| `CHANGELOG.md` | Modify | Document feature additions with spec/plan references | +10 LOC |
| `docs/SESSION_STATE.md` | Modify | Update session state & verification gates | +15 LOC |

---

## 3. Phased Implementation Steps

### Phase 1: Pure Logic & Test-Driven Development (TDD)
- [x] Create test file `src/lib/marcom/eventEquipmentHelpers.test.ts` with assertions for:
  - Empty or undefined borrow records return `null`.
  - Non-matching `eventId` returns `null`.
  - Accurately sums item quantities across multiple borrow records for the same event.
  - Correctly detects active loans (`hasActive`).
  - Correctly flags overdue loans (`hasOverdue = true`) when status is `OVERDUE`.
- [x] Implement `src/lib/marcom/eventEquipmentHelpers.ts` with TypeScript types and pure logic.
- [x] Verify test execution via `node --test --import ./test/register-alias.mjs src/lib/marcom/eventEquipmentHelpers.test.ts`.

### Phase 2: UI Integration in Event Cards View
- [x] In `src/components/views/EventsView/EventsView.tsx`, ensure `fetchBorrowRecords()` is called during initial mount so data is pre-cached.
- [x] In `src/components/views/EventsView/EventCardsView.tsx`:
  - Subscribe to `borrowRecords` from `useMarcomDataStore`.
  - Compute `equipmentSummary = getEventEquipmentSummary(borrowRecords, event.id)`.
  - Render the equipment chip alongside the checklist section with appropriate color tokens:
    - Normal: Teal badge (`bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200/60`).
    - Overdue: Rose badge (`bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300`).
  - Wire `onClick` handler to trigger `onSelectEvent(event)`.

### Phase 3: Non-Regression & Verification Gates
- [x] Run drift check: `npm run drift:check` (verify spec-plan pairing and coordinator file limits).
- [x] Run build check: `npm run build:check` (verify 0 TypeScript compilation errors).
- [x] Run full test suite: `npm test` (verify 0 failures).

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Initial cache miss before borrow records fetch completes | Low | `getEventEquipmentSummary` gracefully returns `null` if array is empty; once SWR store populates, component reactively renders chip without layout distortion. |
| Extreme equipment quantities overflow small card widths | Low | Text truncated cleanly with `truncate` class; icon and total units formatted as `"N Unit Alat"` to remain concise. |
| Duplication across views | Low | Isolated in `eventEquipmentHelpers.ts` so `EventTableView` or other sub-views can reuse the exact same helper in the future if needed. |

---

## 5. Dependencies

- Node.js `node:test` runner
- `lucide-react` icons (`Package`, `AlertTriangle`)
- Existing `BorrowRecord` and `FieldEventItem` domain types from `src/types/index.ts`
- Global Zustand store `useMarcomDataStore`
