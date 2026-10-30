# Spec: Event Card Equipment Logistics Indicator Chip

**Spec ID:** `2026-10-31-event-card-equipment-indicator`  
**Status:** Draft  
**Date:** 2026-10-31  
**ADR:** [ADR 06](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0006-event-card-equipment-indicator.md)  
**Plan:** [docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md)  

---

## 1. Executive Summary

Provides instant operational visibility into physical equipment logistics on the Field Events overview grid (`EventCardsView.tsx`).
Events that have borrowed physical assets (tents, sound systems, staging, cables) will render a compact, responsive chip displaying total borrowed units and loan counts. If any borrowed asset has passed its scheduled return date (`returnDueDate`) while still unreturned, the chip dynamically upgrades to an **Overdue Alert Badge**.

---

## 2. UX Flow & Visual States

The indicator chip is positioned next to the checklist progress pill in each event card:

1. **State A — Active / Scheduled Borrowing (`totalUnits > 0 && !hasOverdue`):**
   - **Visual:** Teal pill (`bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/50`).
   - **Content:** `<Package className="w-3.5 h-3.5 text-teal-500" />` + `"N Unit Alat"` (e.g. `📦 4 Unit Alat`).
   - **Tooltip / Title:** Detailed breakdown (e.g. `"4 unit equipment across 2 borrow records"`).
   - **Interaction:** Clicking opens the event detail modal (`onSelectEvent(event)`), allowing instant navigation to the `EventBorrowedEquipmentSection`.

2. **State B — Overdue Asset Alert (`totalUnits > 0 && hasOverdue`):**
   - **Visual:** High-contrast rose pill (`bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900/40 font-bold`).
   - **Content:** `<AlertTriangle className="w-3.5 h-3.5 text-rose-500" />` + `"N Unit (Overdue)"` (e.g. `⚠️ 2 Unit (Overdue)`).
   - **Interaction:** Clicking alerts field coordinators and opens the modal to inspect overdue items.

3. **State C — No Equipment (`totalUnits === 0`):**
   - **Visual:** Not rendered (`null`). Zero DOM footprint, zero layout shift.

---

## 3. SSOT Schema (`src/types/index.ts`)

No domain entity changes required. Reuses canonical SSOT interfaces:
- `BorrowRecord` (from `src/types/index.ts`)
- `FieldEventItem` (from `src/types/index.ts`)
- `BorrowStatus` (from `src/types/index.ts`)

---

## 4. SQL Schema & Migrations

**Unchanged.**  
No new database columns or migrations needed. Physical equipment relations (`BorrowRecord.eventId -> FieldEvent.id`) are already present in Prisma schema.

---

## 5. Pure Logic Signatures

Helper function in `src/lib/marcom/eventEquipmentHelpers.ts`:

```ts
export interface EventEquipmentSummary {
  recordCount: number;
  totalUnits: number;
  hasOverdue: boolean;
  hasActive: boolean;
  hasPending: boolean;
  statusText: string;
}

/**
 * Computes an aggregated equipment summary for a given event from the borrow records cache.
 * Returns null if no equipment is associated with this event.
 */
export function getEventEquipmentSummary(
  borrowRecords: BorrowRecord[] | undefined,
  eventId: string
): EventEquipmentSummary | null;
```

---

## 6. API Contracts

**Unchanged.**  
No new HTTP routes. Data is sourced reactively from `useMarcomDataStore((s) => s.borrowRecords)`.
On initial mount of `EventsView`, `useMarcomDataStore.getState().fetchBorrowRecords()` ensures the local cache is populated.

---

## 7. Acceptance Criteria

1. **Card Rendering:** An event card with associated borrow records renders the equipment chip next to or in the checklist/progress section.
2. **Correct Count:** Total unit count accurately sums `quantity` across all items in all borrow records linked to that `eventId`.
3. **Overdue Detection:** If any linked `BorrowRecord` has `status === "OVERDUE"` (or `status === "ACTIVE"` with `returnDueDate < now`), the chip displays the overdue styling and warning icon.
4. **Zero Layout Shift:** Events with 0 borrow records do not render any empty or placeholder element.
5. **Responsiveness & Dark Mode:** Chip renders cleanly in mobile, tablet, and desktop viewports across both light and dark themes.
6. **Interaction:** Clicking the chip triggers `onSelectEvent(event)` to view the full equipment drawer section.

---

## 8. Non-Goals

1. **No Equipment Column in Pipeline 360°:**  
   As established in ADR 06, `PipelineView` remains strictly focused on Outlet-centric commercial health (`Outlet -> MOU, Placement, Event, Content`). Equipment is warehouse logistics, not an outlet attribute.
2. **No Backend Database Schema Alterations:**  
   We will not add denormalized equipment count columns to the `FieldEvent` table.

---

## 9. Verification Checklist

- [ ] Unit tests for `getEventEquipmentSummary` pass with 100% branch coverage (`src/lib/marcom/eventEquipmentHelpers.test.ts`).
- [ ] `npm run drift:check` passes with zero violations (SSOT, LOC, spec-plan pairing).
- [ ] `npm run build:check` passes with 0 TypeScript compilation errors.
- [ ] `npm test` passes with 0 failures across the full test suite.
