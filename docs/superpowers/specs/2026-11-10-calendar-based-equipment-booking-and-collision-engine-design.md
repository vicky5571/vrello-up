# Design Spec: Calendar-Based Equipment Booking and Collision Detection Engine

- **Date:** 2026-11-10
- **Status:** APPROVED
- **Author:** Senior Software Engineer & Principal Systems Architect
- **Target ADR:** [ADR-0102](../../adr/0102-calendar-based-equipment-booking-and-collision-engine.md)

---

## 1. Executive Summary

This specification defines the architecture, data contracts, and algorithmic collision detection for promotional inventory borrowing in *vrello-up*. 

Previously, stock decrement was deferred until physical pickup (`ACTIVE`), allowing overlapping requests for the same physical unit to be approved concurrently, with conflicts only surfacing at the warehouse pickup counter. Conversely, a naive flat decrement upon approval would lock current inventory for distant future events, causing severe asset underutilization.

This engine introduces temporal collision detection across requested date intervals $[borrowDate, returnDueDate]$, enforcing capacity constraints ($totalUnits$) at both submission and approval time, while delivering human-centric operational safeguards (tight-schedule advisories, post-damage deficit detection, and no-show suggestions).

---

## 2. Mathematical Collision Model & Domain Engine

### 2.1. Interval Math & Capacity Invariants
For any inventory item $k \in \text{Items}$ with total usable capacity $C_k = \text{totalUnits}_k$:
Let active bookings $B = \{ b \mid b.\text{status} \in \{\text{"APPROVED"}, \text{"ACTIVE"}, \text{"OVERDUE"}\} \}$.
For each day $d \in [\text{borrowDate}_{req}, \text{returnDueDate}_{req}]$:
$$\text{Allocated}(k, d) = \sum_{b \in B, k \in b.\text{items}} b.\text{quantity}(k) \quad \text{where } d \in [b.\text{borrowDate}, b.\text{returnDueDate}]$$
$$\text{Remaining}(k, d) = C_k - \text{Allocated}(k, d)$$
$$\text{Condition for Valid Booking: } \forall d \in [\text{borrowDate}_{req}, \text{returnDueDate}_{req}], \quad \text{Allocated}(k, d) + Q_{req}(k) \le C_k$$

### 2.2. Pure Function Signature (`src/lib/marcom/inventoryCollisionEngine.ts`)

```ts
export interface BookingItemRequest {
  inventoryItemId: string;
  quantity: number;
}

export interface ExistingBookingItem {
  inventoryItemId: string;
  quantity: number;
  borrowCode: string;
  borrowDate: string;     // ISO YYYY-MM-DD
  returnDueDate: string;  // ISO YYYY-MM-DD
  status: "APPROVED" | "ACTIVE" | "OVERDUE";
}

export interface ItemMasterCapacity {
  id: string;
  name: string;
  totalUnits: number;
}

export interface CollisionCheckResult {
  hasConflict: boolean;
  conflicts: Array<{
    inventoryItemId: string;
    itemName: string;
    requestedQuantity: number;
    availableCapacity: number;
    conflictingDates: string[];
    conflictingBorrowCodes: string[];
  }>;
  isTightSchedule: boolean;
  tightScheduleDetails: Array<{
    inventoryItemId: string;
    itemName: string;
    conflictingBorrowCode: string;
    precedingReturnDueDate: string;
    gapDays: number; // 0 for same day, 1 for next day
  }>;
}

export function checkBookingCollision(params: {
  requestedItems: BookingItemRequest[];
  borrowDate: string;
  returnDueDate: string;
  existingBookings: ExistingBookingItem[];
  itemCapacities: Map<string, ItemMasterCapacity>;
  excludeBorrowRecordId?: string; // For updates/extensions
}): CollisionCheckResult;
```

---

## 3. API Contracts & State Transition Enforcement

### 3.1. `POST /api/marcom/inventory/borrow`
- **Validation Sequence:**
  1. Input parameter validation (dates, borrower, non-empty items).
  2. RBAC check: caller role has `REQUEST_BORROW`.
  3. Fetch active bookings overlapping $[borrowDate, returnDueDate]$ where $status \in \{\text{"APPROVED"}, \text{"ACTIVE"}, \text{"OVERDUE"}\}$.
  4. Run `checkBookingCollision()`.
  5. If `hasConflict === true`:
     - Return `422 Unprocessable Entity`:
       ```json
       {
         "error": "Permintaan peminjaman bentrok dengan jadwal booking lain.",
         "conflicts": [
           {
             "itemName": "Tenda Lipat 3x3",
             "requestedQuantity": 2,
             "availableCapacity": 1,
             "conflictingDates": ["2026-11-15", "2026-11-16"]
           }
         ]
       }
       ```
  6. If clean, proceed to create `BorrowRecord` with `status: PENDING`.

### 3.2. `PUT /api/marcom/inventory/borrow/[id]`
- **On `status === "APPROVED"` (Approval Gate):**
  - Execute within a Prisma transaction (`$transaction`).
  - Query current overlapping bookings (excluding current record).
  - Run `checkBookingCollision()`.
  - If conflicting: Reject with `422`: `"Tidak dapat menyetujui: unit telah dialokasikan untuk peminjaman lain pada jadwal tersebut."`
  - If non-conflicting: Set `status = "APPROVED"`, `approvedBy = session.user.name`, `approvedAt = new Date()`.
- **On Extension of `returnDueDate`:**
  - If caller updates `returnDueDate` to a later date:
  - Run collision check against existing bookings in the extension window $[\text{oldDueDate} + 1, \text{newDueDate}]$.
  - If conflict detected, reject update with `422` referencing the conflicting borrow code.

### 3.3. `POST /api/marcom/inventory/borrow/[id]/return` (Post-Inspection Deficit Detection)
- If return inspection records `majorDamageUnits > 0` or `lostUnits > 0`:
  - Identify future `APPROVED` bookings that rely on this item's total capacity.
  - If any future booking's window now exceeds updated capacity, append an advisory string to the affected record's `notes`:
    `"[DEFICIT_WARNING]: 1 unit rusak/hilang pada return ${borrowCode}. Verifikasi kesiapan fisik."`

---

## 4. UI & Operational Experience Specifications

### 4.1. `BorrowRequestModal.tsx` Instant Availability Feedback
- When borrower completes Step 2 (Date Selection: `borrowDate`, `returnDueDate`) and moves to Step 3 (Catalog Selection):
  - The modal computes or queries daily remaining capacity for each item during the chosen date interval.
  - If an item has 0 units available across any day in the range:
    - Display badge: `"Stok Habis di Tanggal Terpilih"`.
    - Disable the item's `+` increment button.
  - If remaining capacity is less than current cart quantity: cap the selectable quantity.
- If the selected date window is $T+0$ or $T+1$ relative to an existing booking:
  - Show warning banner: *"Peringatan Jadwal Mepet: Alat ini baru kembali pada ${date}. Ada risiko keterlambatan jika event sebelumnya molor."*

### 4.2. `BorrowDetailModal.tsx` Action Banners
- **Approver Advisory:** When an approver views a `PENDING` request that has `isTightSchedule === true`, display an amber callout above the footer:
  > ⚠️ **Jadwal Mepet:** Peminjaman ini dijadwalkan tepat setelah pengembalian `${priorBorrowCode}` (${date}). Pastikan koordinasi dengan peminjam sebelumnya.
- **Unclaimed Booking Suggestion:** When viewing an `APPROVED` record where `borrowDate < today` and $status \neq \text{"ACTIVE"}$:
  - Surface a badge for `canManage`:
    > 💡 **Unclaimed Booking:** Tanggal peminjaman telah terlewati dan barang belum diambil secara fisik. Pertimbangkan untuk membatalkan tiket ini agar kuota kalender terlepas.

---

## 5. Acceptance Criteria (Gherkin Scenarios)

### AC-1: Concurrent Non-Overlapping Bookings Allowed
- **Given** an inventory item with `totalUnits: 1`
- **And** an existing `APPROVED` loan for Date Window `[2026-11-10, 2026-11-12]`
- **When** a user submits a borrow request for the same item for Date Window `[2026-11-15, 2026-11-18]`
- **Then** the collision check passes
- **And** the record is created with `status: PENDING`
- **And** an approver can approve it without conflict.

### AC-2: Hard Overlap Collision Rejection at Creation
- **Given** an inventory item with `totalUnits: 1`
- **And** an existing `APPROVED` loan for Date Window `[2026-11-10, 2026-11-14]`
- **When** a user submits a borrow request for Date Window `[2026-11-12, 2026-11-16]`
- **Then** `POST /api/marcom/inventory/borrow` rejects with HTTP 422
- **And** returns the conflicting dates and item details.

### AC-3: Double-Approval Race Condition Prevention
- **Given** an inventory item with `totalUnits: 1`
- **And** two pending requests `Req-A` and `Req-B` for the same date window
- **When** an approver approves `Req-A` (transition to `APPROVED`)
- **And** another approver attempts to approve `Req-B`
- **Then** the second approval is rejected with HTTP 422 indicating capacity is exhausted for that window.

### AC-4: Tight Schedule Advisory Warning ($T+0$ and $T+1$)
- **Given** an existing `APPROVED` loan returning on `2026-11-13`
- **When** a user requests the same item starting on `2026-11-13` or `2026-11-14`
- **Then** the request is permitted (no hard block)
- **And** `isTightSchedule` evaluates to `true`
- **And** `BorrowDetailModal` surfaces the tight schedule warning callout.

### AC-5: Return Deficit Warning Propagation
- **Given** an item with `totalUnits: 2`
- **And** a future `APPROVED` loan for 2 units on `2026-11-20`
- **When** an active loan is returned on `2026-11-15` with `majorDamageUnits: 1` (reducing active capacity to 1)
- **Then** the future approved loan is flagged with a capacity deficit advisory note.

### AC-6: Schedule Extension Collision Block
- **Given** an active loan `Loan-A` with `returnDueDate: 2026-11-13`
- **And** an approved future loan `Loan-B` starting on `2026-11-14`
- **When** `Loan-A` attempts to update `returnDueDate` to `2026-11-16`
- **Then** the update is rejected with HTTP 422 citing collision with `Loan-B`.

### AC-7: Unclaimed Booking Suggestion Rendering
- **Given** a borrow record with `status: APPROVED`
- **And** `borrowDate` is in the past ($< \text{today}$)
- **When** a user with `canManage` opens `BorrowDetailModal`
- **Then** the "Unclaimed Booking" suggestion badge is displayed with a shortcut to cancel.

---

## 6. Non-Goals

1. **Schema Migrations:** No alterations to table definitions in `prisma/schema.prisma`.
2. **Hard Automatic Cancellations:** No automated background jobs terminating uncollected bookings without human review.
3. **Hourly Time-Slot Partitioning:** Operations remain anchored to full calendar days (`YYYY-MM-DD`).

---

## 7. Verification Checklist

- [ ] `npm run drift:check` passes with zero violations.
- [ ] Unit tests for `inventoryCollisionEngine.ts` pass 100% of interval math scenarios.
- [ ] Integration tests in `inventoryApi.test.ts` verify AC-1, AC-2, AC-3, AC-4, AC-5, and AC-6.
- [ ] UI component tests verify tight-schedule banners and unclaimed suggestions.
- [ ] `npm test` passes with 0 failures across the entire test suite.
- [ ] `npm run build:check` compiles with 0 errors.


```

