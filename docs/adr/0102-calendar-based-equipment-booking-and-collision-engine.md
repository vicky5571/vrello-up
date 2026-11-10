# ADR-0102: Calendar-Based Equipment Booking Engine and Collision Detection

- **Status:** APPROVED
- **Date:** 2026-11-10
- **Deciders:** Senior Software Engineer, Lead Architect

---

## 1. Context & Business Problem

In *vrello-up*, promotional equipment (such as folding tents, sound systems, wireless walkie-talkies, and generator sets) is borrowed for marketing activations and events planned days or weeks in advance.

Under the current inventory implementation:
1. **Deferred Stock Decrement Flaw:**  
   In `src/app/api/marcom/inventory/borrow/[id]/route.ts`, physical unit decrement (`availableUnits -= quantity`) only happens when a record transitions to `ACTIVE` (physical pickup). When a request is approved (`APPROVED`), stock is not deducted or locked. Consequently, two concurrent requests for the same date window can both be approved, and the conflict is only discovered when the second borrower arrives at the warehouse counter and receives an `Insufficient units` error.
2. **Failure of Flat Stock Deduction for Future Events:**  
   If the system simply decrements `availableUnits` upon approval (flat deduction), approving a loan for an event happening next month immediately reduces current warehouse stock today. Physical gear in the warehouse sits idle and cannot be borrowed for any events occurring in the interim.
3. **Absence of Collision Detection Across Time Windows:**  
   The system currently lacks an algorithmic mechanism to evaluate date overlaps ($[borrowDate, returnDueDate]$) against total usable equipment units ($totalUnits$).

To maximize asset utilization while completely eliminating physical counter-pickup race conditions, the system requires a **Calendar-Based Booking and Collision Detection Engine**.

---

## 2. Options Considered

### Option 1: Static Flat Stock Decrement upon Approval
- Decrement `availableUnits` immediately when moving from `PENDING` to `APPROVED`.
- *Trade-offs:*
  - Pros: Simplest math; zero complex queries.
  - Cons: Cripples asset utilization. A future loan scheduled 3 weeks away blocks immediate loans today.

### Option 2: Explicit Three-Tier Inventory Columns (`total`, `reserved`, `available`)
- Add `reservedUnits` column to `InventoryItem` in database schema.
- *Trade-offs:*
  - Pros: Metric visibility on master table.
  - Cons: Requires database migration; still suffers from the time-insensitivity of flat deductions unless accompanied by date logic.

### Option 3: Calendar-Based Booking Collision Engine (Time-Window Overlap) (Chosen)
- Evaluate availability dynamically as a function of the requested time interval $[Start_{req}, End_{req}]$:
  $$\text{AllocatedUnits}(t) = \sum \{ Q_i \mid t \in [borrowDate_i, returnDueDate_i] \text{ and } status_i \in \{APPROVED, ACTIVE, OVERDUE\} \}$$
  $$\text{MaxConcurrentLoad} = \max_{t \in [Start_{req}, End_{req}]} (\text{AllocatedUnits}(t) + Q_{req})$$
  $$\text{Validation Condition: } \text{MaxConcurrentLoad} \le totalUnits$$
- *Trade-offs:*
  - Pros: Maximum asset productivity; allows future bookings without starving current warehouse inventory; fail-fast validation before approval.
  - Cons: Requires operational guardrails for real-world uncertainties (delays, damages, no-shows).

---

## 3. Decision & Operational Policies

Adopt **Option 3** with the following 5 operational policies agreed upon with stakeholders:

1. **Tight Schedule Risk Advisory (No Hard Buffer):**
   - No hard artificial buffer days are enforced in code, preserving scheduling flexibility.
   - When a requested start date begins on the exact return date or day immediately following an existing booking ($T+0$ or $T+1$), the UI displays a **"Tight Schedule Risk"** warning to the borrower and approver.
2. **Post-Inspection Capacity Deficit Detection:**
   - When `/return` processes an item with `MAJOR_DAMAGE` or `LOST`, reducing usable inventory, an automated impact query checks all future `APPROVED` or `PENDING` bookings for that item.
   - If a future date window now suffers a deficit, the affected booking is flagged with an **"Asset Shortage - Action Required"** advisory for managers to arrange cross-branch transfers or equipment substitutes.
3. **No-Show Suggestion for Managers (Non-Automated Expiry):**
   - No automated cron cancellation of bookings without human oversight.
   - If a record is `APPROVED` but remains uncollected ($status \neq ACTIVE$) after `borrowDate` has elapsed, a visual suggestion badge is surfaced to users with `canManage`: *"Unclaimed Booking: Pickup date has passed. Consider cancelling to release calendar reservation."*
4. **Collision Guard on Schedule Extension:**
   - Any attempt to extend `returnDueDate` on an active loan must run the collision query against all future approved bookings. Extensions that overlap with existing commitments are blocked with a clear reference to the conflicting borrow code.
5. **Item-Level Collision Visibility:**
   - In multi-item requests, collision checks evaluate each item independently. If one item in the basket is overbooked, the server returns granular conflict details identifying the exact bottleneck item and remaining capacity.

---

## 4. Consequences & Mitigations

### Positive Consequences
- **Elimination of Counter Pickup Surprises:** Conflicting requests cannot be co-approved. Overbooking is caught at submission and approval time.
- **Maximized Asset Productivity:** Equipment can be actively used today while being reserved for separate events next month.
- **Human-Centric Flexibility:** Soft advisories and non-automated expiry prevent rigid edge-cases from interrupting field teams while keeping managers informed.

### Accepted Trade-offs & Mitigations
- **Computational Overhead:** Checking daily overlaps requires interval queries against `BorrowItem` and `BorrowRecord`.
- *Mitigation:* Queries filter indexed columns (`status IN ['APPROVED', 'ACTIVE', 'OVERDUE']`, `borrowDate`, `returnDueDate`) and only calculate collision within the bounded range $[Start_{req}, End_{req}]$.


