# Implementation Plan: Calendar-Based Equipment Booking and Collision Engine

- **Date:** 2026-11-10
- **Status:** IMPLEMENTATION COMPLETE
- **Spec:** [2026-11-10-calendar-based-equipment-booking-and-collision-engine-design.md](../specs/2026-11-10-calendar-based-equipment-booking-and-collision-engine-design.md)
- **ADR:** [ADR-0102](../../adr/0102-calendar-based-equipment-booking-and-collision-engine.md)

---

## 1. Executive Summary & File Manifest

This plan implements dynamic calendar-based equipment booking and collision detection across requested date windows $[borrowDate, returnDueDate]$, eliminating counter-pickup overbooking races while maximizing forward asset productivity.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/lib/marcom/inventoryCollisionEngine.ts` | Create | Pure interval math engine for daily capacity tracking and collision checks. | ~110 lines created |
| `src/lib/marcom/inventoryCollisionEngine.test.ts` | Create | Unit test suite for interval math, tight schedules, and multi-item baskets. | ~90 lines created |
| `src/app/api/marcom/inventory/borrow/route.ts` | Edit | Integrate collision check on creation (`POST`) to reject overbooked windows. | ~35 lines added |
| `src/app/api/marcom/inventory/borrow/[id]/route.ts` | Edit | Re-validate collision on `APPROVED` transition and on schedule extensions. | ~40 lines added |
| `src/app/api/marcom/inventory/borrow/[id]/return/route.ts` | Edit | Add post-inspection capacity deficit detection on damage/loss. | ~25 lines added |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | Edit | Visual indicator for exhausted items during selected dates; tight schedule banner. | ~35 lines edited |
| `src/components/views/InventoryView/BorrowDetailModal.tsx` | Edit | Approver tight-schedule warning banner & manager unclaimed-booking suggestion badge. | ~30 lines edited |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | Edit | Automated integration tests for collision prevention, double-approval block, and deficit warnings. | ~95 lines added |
| `docs/SESSION_STATE.md` | Edit | Update active feature status. | ~10 lines edited |

### Prerequisites & Dependencies
- Zero database migrations required.
- Relies on pure date-string handling (`YYYY-MM-DD`) to avoid UTC time shifts.

---

## 2. Phase 1: Core Collision Engine & Pure Math Unit Tests

- [x] **Task 1.1: Create `src/lib/marcom/inventoryCollisionEngine.ts`**
  - Implement day-generator from start to end date: `getDatesInRange(startDate, endDate)`.
  - Calculate daily allocation map: $\text{dailyMap}[itemId][date] += quantity$.
  - Evaluate max concurrent load vs `itemCapacities.get(itemId).totalUnits`.
  - Calculate tight-schedule flag ($T+0$ or $T+1$ relative to prior booking's `returnDueDate`).
- [x] **Task 1.2: Create `src/lib/marcom/inventoryCollisionEngine.test.ts`**
  - Test 1: Non-overlapping bookings on same item evaluate `hasConflict: false`.
  - Test 2: Overlapping bookings exceeding capacity evaluate `hasConflict: true` with conflicting dates.
  - Test 3: Tight schedule detection flags $T+0$ and $T+1$ with `isTightSchedule: true`.
  - Test 4: Multi-item basket isolates specific bottleneck item.
- [x] **Task 1.3: Verify Phase 1**
  - Run: `node --test --import ./test/register-alias.mjs src/lib/marcom/inventoryCollisionEngine.test.ts`

---

## 3. Phase 2: Backend API Guard & Concurrency Protection

- [x] **Task 2.1: Pre-Submission Collision Check in `POST /borrow`**
  - File: `src/app/api/marcom/inventory/borrow/route.ts`
  - Query existing overlapping records where `status IN ['APPROVED', 'ACTIVE', 'OVERDUE']`.
  - Invoke `checkBookingCollision()`.
  - If `hasConflict === true`, reject with HTTP 422 containing item conflict breakdown.
- [x] **Task 2.2: Re-validation at Approval in `PUT /borrow/[id]`**
  - File: `src/app/api/marcom/inventory/borrow/[id]/route.ts`
  - Inside Prisma `$transaction`, query current active/approved records.
  - Re-run `checkBookingCollision()` excluding current record ID.
  - Reject with 422 if capacity was claimed by a concurrent approval.
- [x] **Task 2.3: Collision Guard on `returnDueDate` Extension**
  - In `PUT /borrow/[id]`, when `returnDueDate` is extended, validate that extension days do not collide with future approved bookings.
- [x] **Task 2.4: Post-Inspection Deficit Detection in `POST /borrow/[id]/return`**
  - File: `src/app/api/marcom/inventory/borrow/[id]/return/route.ts`
  - If `majorDamageUnits > 0` or `lostUnits > 0`:
    - Scan future `APPROVED` bookings relying on that item.
    - Append warning note `[DEFICIT_WARNING]` to affected future bookings.

---

## 4. Phase 3: Visual Indicators & UI Feedback on Modals

- [x] **Task 3.1: Catalog Availability Feedback in `BorrowRequestModal.tsx`**
  - Compute availability per item for selected dates.
  - Disable increment button and show badge `"Stok Habis di Tanggal Terpilih"` when capacity is 0.
  - Show tight-schedule banner in Step 4 review if applicable.
- [x] **Task 3.2: Approver Advisory & Unclaimed Badge in `BorrowDetailModal.tsx`**
  - Render amber tight-schedule advisory for approver when reviewing `PENDING` request.
  - Render unclaimed booking suggestion badge for `canManage` when `status === "APPROVED"` and `borrowDate < today`.

---

## 5. Phase 4: Integration Testing, Verification Gates & Handoff

- [x] **Task 4.1: Extend `src/app/api/marcom/inventory/inventoryApi.test.ts`**
  - Add test scenarios for AC-1 (non-overlapping allowed), AC-2 (hard collision rejected), AC-3 (double-approval rejected), AC-5 (deficit warning propagation), AC-6 (schedule extension collision).
- [x] **Task 4.2: Execute Verification Gates**
  - Run: `npm run drift:check`
  - Run: `npm test` (0 failures across full suite)
  - Run: `npm run build:check` (0 compilation errors)
- [x] **Task 4.3: Session Handoff Documentation**
  - Update `docs/SESSION_STATE.md` with completed planning status.



