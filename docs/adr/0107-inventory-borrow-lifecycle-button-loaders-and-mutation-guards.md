# ADR-0107: Localized Async Mutation Feedback and Loading States for Inventory Borrow Lifecycle

- **Date:** 2026-11-12
- **Status:** APPROVED
- **Author:** Senior Software Engineer & Principal Systems Architect
- **Context:** Equipment inventory loan lifecycle action buttons and mutation concurrency.

---

## 1. Context & Business Problem

In equipment inventory tracking ([ADR-0050](../../adr/0050-warehouse-role-and-return-inspection-compensation-workflow.md), [ADR-0100](../../adr/0100-inventory-borrow-server-side-rbac-and-audit-integrity.md), [ADR-0102](../../adr/0102-calendar-based-equipment-booking-and-collision-engine.md), [ADR-0106](../../adr/0106-hybrid-staff-cash-settlement-submission-and-warehouse-verification.md)), warehouse officers and marketing administrators manage equipment borrow requests across key operational states: `PENDING` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `RETURNED`.

Primary interaction surfaces include:
1. The **Borrow Tracking Board** (`BorrowTrackingBoard.tsx`) featuring actionable Kanban columns ("Pending Approval", "Approved / Ready for Pickup", "In Use / Overdue").
2. The **Borrow Detail Modal** (`BorrowDetailModal.tsx`) exposing status advancement buttons in its footer.
3. The **Borrow Records Table** (`BorrowRecordsTable.tsx`) listing transactions in tabular view.

### Operational Problem
When warehouse officers click status progression buttons:
- **"Approve Request"** (`status: "APPROVED"`)
- **"Mark as Picked Up"** (`status: "ACTIVE"`)
- **"Process Return"** / status mutations

the system dispatches asynchronous HTTP network mutations (`PUT /api/marcom/inventory/borrow/[id]`). However, the existing action buttons do not maintain an asynchronous loading state (`isMutating`). During network latency, server cold starts, or high concurrent traffic:
1. **Zero Visual Feedback:** Buttons remain visually static without a spinner, leaving operators uncertain whether their click registered.
2. **Double Submission & Race Conditions:** Frustrated operators repeatedly click the button ("rage clicking"), transmitting multiple concurrent requests for the same borrow record.
3. **Audit Log & Lock Inconsistency:** Rapid duplicate calls can cause redundant notification triggers, duplicate collision checks, or database write conflicts.

---

## 2. Options Considered

### Option 1: Localized Card/Modal Mutation State (`mutatingBorrowId` & `mutatingAction`) (Chosen)
Track localized mutation state `mutatingBorrowId: string | null` and `mutatingAction: BorrowStatus | string | null` in `InventoryView.tsx` and propagate it to `BorrowTrackingBoard`, `BorrowDetailModal`, and `BorrowRecordsTable`.
- When an action is dispatched on a record, only that record's action button renders a `<Loader2 className="w-3.5 h-3.5 animate-spin" />` spinner and transitions to `disabled={true}`.
- All competing action buttons on that specific card or modal are disabled during execution to prevent contradictory actions.
- Other cards on the Kanban board remain interactive for reading or clicking.
- **Pros:** Precise visual feedback at the exact point of operator focus; eliminates duplicate requests; avoids screen-freezing backdrops; zero database schema alterations.
- **Cons:** Requires threading `mutatingBorrowId` / `mutatingAction` through props into board cards and modal footers.

### Option 2: Optimistic UI Updates
Immediately move the Kanban card to the target column in client React/Zustand state before the API response returns, rolling back on failure.
- **Pros:** Instantaneous UI movement.
- **Cons (Critical Operational Hazard):** Physical warehouse assets require strict transactional integrity. If server-side inventory booking collisions ([ADR-0102](../../adr/0102-calendar-based-equipment-booking-and-collision-engine.md)) or approval permission checks fail, optimistic movement falsely signals that equipment has been approved or handed over, leading to physical stock discrepancies and jarring rollbacks.

### Option 3: Global Screen Backdrop / Blocking Overlay
Display a semi-transparent screen overlay with a central spinner blocking the entire viewport during any mutation.
- **Pros:** Low implementation complexity.
- **Cons:** Extremely intrusive UX. Freezes the entire application and prevents warehouse officers from reading other cards, checking item quantities, or scrolling the board while waiting for a single card update.

---

## 3. Deep Trade-Off & Feasibility Matrix

| Evaluation Dimension | Option 1 (Localized State) | Option 2 (Optimistic UI) | Option 3 (Global Overlay) |
| :--- | :--- | :--- | :--- |
| **Operator Visual Feedback** | **High (Direct feedback on clicked button)** | Immediate (no button loader) | High (blunt screen freeze) |
| **Physical Stock Discrepancy Risk** | **Zero (Reflects verified server state only)** | High (false approval on server reject) | Zero |
| **Concurrency & Double Click Guard** | **Airtight (Button disabled during fetch)** | Medium (rollback latency) | Airtight (whole screen blocked) |
| **UI Fluidity & Non-Blocking Workflow** | **High (Other cards remain readable)** | High | Low (freezes entire page) |
| **Architectural Simplicity** | **High (Scoped to component props/helpers)** | Medium-Low (requires rollback logic) | High |

---

## 4. Decision & Technical Architecture

We adopt **Option 1: Localized Card/Modal Mutation State (`mutatingBorrowId` & `mutatingAction`)**.

### 4.1. Mutation State Architecture in `InventoryView.tsx`
`InventoryView` introduces a dedicated mutation state pair:
```ts
const [mutatingBorrowId, setMutatingBorrowId] = useState<string | null>(null);
const [mutatingAction, setMutatingAction] = useState<string | null>(null);
```
During `handleStatusChange(id, newStatus)`:
1. `setMutatingBorrowId(id)` and `setMutatingAction(newStatus)` are called immediately before dispatching `fetch()`.
2. The `fetch()` request executes.
3. In the `finally` block, `setMutatingBorrowId(null)` and `setMutatingAction(null)` are guaranteed to execute, restoring interactive states regardless of success or failure.

### 4.2. Action Button Loading & Disabled States

#### A. In `BorrowTrackingBoard.tsx`
Each Kanban card receives `mutatingBorrowId` and `mutatingAction`:
- **"Approve Request" Button:**
  - When `isCurrentMutating`: Renders `<Loader2 className="w-3.5 h-3.5 animate-spin" />` alongside `"Menyetujui..."` (or `"Approve Request"` with spinner).
  - Disabled when `Boolean(mutatingBorrowId)` (any card mutating on board locks competing actions).
- **"Mark as Picked Up" Button:**
  - When `isCurrentMutating`: Renders `<Loader2 className="w-3.5 h-3.5 animate-spin" />` alongside `"Memproses..."`.
  - Disabled when `Boolean(mutatingBorrowId)`.
- **"Process Return" Button:**
  - Disabled when `Boolean(mutatingBorrowId)`.
  - On click, opens `ReturnProcessModal` (which already possesses submission loaders).

#### B. In `BorrowDetailModal.tsx`
The modal footer receives `mutatingBorrowId` and `mutatingAction`:
- **"Approve Request" Button:** Displays `<Loader2 className="w-3.5 h-3.5 animate-spin" />` and disabled when `mutatingBorrowId === record.id`.
- **"Mark as Picked Up" Button:** Displays `<Loader2 className="w-3.5 h-3.5 animate-spin" />` and disabled when `mutatingBorrowId === record.id`.
- **"Process Return" Button:** Disabled when `mutatingBorrowId === record.id`.
- **"Cancel Request" / "Cancel Loan" Button:** Disabled during active mutation.

#### C. In `BorrowRecordsTable.tsx`
In the table row action column, action buttons show micro spinners or become disabled during active mutation for that row.

---

## 5. Consequences & Trade-offs

### Positive Consequences
- **Elimination of Rage Clicking:** Disabling the button on first click prevents redundant network calls.
- **Clear Operator Confirmation:** Visual spinner reassures warehouse staff that the command is in-flight.
- **Physical Accuracy:** No false optimism; the UI only updates columns after PostgreSQL transactions succeed.
- **Zero Database Migration:** Pure UI/UX state synchronization, zero schema risk.

### Accepted Trade-offs
- Action buttons are disabled for the ~300-800ms duration of the server request. This is the desired operational invariant.

---

## 6. Verification & Invariants

1. **Button Disabled Invariant:** Clicking `Approve Request` or `Mark as Picked Up` immediately disables the button and mounts `Loader2`.
2. **Competing Action Lock Invariant:** While a record is undergoing status change, other mutation controls on that card/modal are disabled.
3. **Recovery Invariant:** On network error or server rejection, `mutatingBorrowId` is reset in `finally` and buttons return to active state.
4. **Non-Negotiable Gates:** `npm run drift:check`, `npm run build:check`, and `npm test` must pass with 0 failures and 0 errors.


