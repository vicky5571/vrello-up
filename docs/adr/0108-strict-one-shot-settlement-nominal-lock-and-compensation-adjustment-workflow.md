# ADR 0108: Strict One-Shot Settlement Nominal Lock and Compensation Adjustment Workflow

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In equipment inventory tracking ([ADR-0050](0050-warehouse-role-and-return-inspection-compensation-workflow.md), [ADR-0052](0052-inventory-compensation-settlement-and-restoration-workflow.md), and [ADR-0106](0106-hybrid-staff-cash-settlement-submission-and-warehouse-verification.md)), when equipment is returned damaged or lost, the system initiates a financial compensation liability (`compensationAmount`, `compensationStatus: "PENDING_SETTLEMENT"`). The compensation settlement lifecycle is architecturally governed by a **one-shot (single full settlement)** invariant: once confirmed by warehouse or admin officers, `compensationStatus` transitions to `RESOLVED` (terminal), closing the liability.

### The Vulnerability & Operational Conflict
1. **Moral Hazard & Financial Leakage via Editable Settlement Input:**
   In `BorrowSettlementModal.tsx`, the settlement amount was implemented as an editable numeric input (`<input type="number" value={settledAmount} />`) with the helper note *"Nilai di atas dapat disesuaikan sesuai nominal transfer aktual"*. Because the lifecycle is one-shot, this created a critical financial loophole:
   - A borrower (`staff`) or operator could arbitrarily reduce the amount (e.g. from Rp 1.000.000 to Rp 100.000 or Rp 1).
   - Upon verification (`CONFIRM` or `DIRECT_RESOLVE`), the transaction permanently marked the liability as `RESOLVED`, erasing the remaining balance from the company's ledger without full repayment.
2. **Legitimate Operational Need for Cost Adjustment Before Settlement:**
   In real-world field operations, the initial damage assessment during return inspection (`ReturnProcessModal`) is often an initial estimate based on standard rate sheets or catalog costs. Later, when the item is inspected by an official repair shop or authorized service center, the actual invoice may differ (e.g., Rp 850.000 instead of Rp 1.000.000), or regional management may grant a partial corporate subsidy/waiver.
3. **The Architectural Conflict:**
   Treating the settlement execution form (`BorrowSettlementModal`) as an ad-hoc negotiation screen corrupts the transactional integrity of the payment submission. Execution of payment must be strictly separated from administrative adjustment of the liability amount.

---

## 2. Options Considered

### Option 1: Dedicated Adjustment Modal with Strict Audit Trail & Read-Only Settlement Form (Chosen)
- **Form Pelunasan (`BorrowSettlementModal`):**
  - Replace editable `<input type="number">` with a **Read-Only / Fixed Metric Card** displaying `record.compensationAmount` formatted in Rupiah with a `"Tagihan Penuh (One-Shot)"` badge.
  - Backend API (`/api/marcom/inventory/borrow/[id]/settle`) strictly enforces `settledAmount: existing.compensationAmount` for `CASH_TRANSFER`, discarding client-injected amounts.
- **Adjustment Workflow in `BorrowDetailModal`:**
  - Introduce an `"Adjust Nilai Ganti Rugi"` button inside the compensation liability card in `BorrowDetailModal.tsx`.
  - Restricted strictly to authorized roles (`hasPermission(role, "PROCESS_RETURN")` — warehouse, supervisor, admin). Borrowers (`staff`) cannot see or access this button.
  - Only active when `compensationStatus === "PENDING_SETTLEMENT"`.
  - Opens a dedicated `CompensationAdjustmentModal.tsx`:
    - Shows current liability amount.
    - Requires new liability amount (`newCompensationAmount >= 0`).
    - Requires mandatory adjustment justification note (`adjustmentReason.trim().length >= 5`).
  - Backend API: `PATCH /api/marcom/inventory/borrow/[id]/adjust-compensation` (or action handler):
    - Validates `PROCESS_RETURN` RBAC permission.
    - Appends timestamped audit log to `compensationNotes`:  
      `[PENYESUAIAN Rp X -> Rp Y oleh Nama (Role) - DD/MM/YYYY]: <Alasan>`
    - Atomically updates `compensationAmount` in `BorrowRecord`.
- **Pros:** Airtight separation of concerns; zero moral hazard during settlement; full auditability for financial review; preserves single-shot settlement invariant.
- **Cons:** Introduces one small focused modal and route handler for adjustment.

### Option 2: Inline Editable in `BorrowDetailModal` (No Dedicated Modal)
- Modify the liability card in `BorrowDetailModal` to show an inline input when an admin views it, with a "Simpan" button.
- **Pros:** No modal needed.
- **Cons:** Prone to accidental clicks; cramped space for mandatory audit justification; degrades UI clarity.

### Option 3: Role-Based Editable Input inside `BorrowSettlementModal`
- Allow admins/warehouse to edit the amount inside `BorrowSettlementModal` while locking it for staff.
- **Pros:** Keeps all editing inside the settlement modal.
- **Cons:** Violates separation of concerns; conflates submission of bank transfer receipt with negotiation of liability; borrower may have transferred Rp 1.000.000 based on previous notice while admin settled Rp 800.000, creating reconcilation chaos.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1 (Dedicated Adjustment Modal) | Option 2 (Inline Edit) | Option 3 (Role-Based in Settlement) |
| :--- | :--- | :--- | :--- |
| **Separation of Concerns** | **Airtight (Settlement = Execution, Adjustment = Governance)** | Moderate | Low (Conflated in one modal) |
| **Moral Hazard Protection** | **100% Locked on both Client & Server** | 100% Locked in Settlement | Partial (Admin can miskey in settlement) |
| **Audit Trail Integrity** | **High (Mandatory reason logged in notes)** | Low (Hard to force verbose reason) | Low (Overwrites note or mixes with payment note) |
| **Accidental Edit Risk** | **Zero (Explicit modal confirmation)** | High (Inline click) | Medium |
| **Four-Eyes Enforcement** | **Airtight (Staff blocked on both UI & API)** | Airtight | Airtight |

---

## 4. Decision & Explicit Consequences

We adopt **Option 1: Dedicated Adjustment Modal with Strict Audit Trail & Read-Only Settlement Form**.

### 4.1. Strict Settlement Form Locking (`BorrowSettlementModal.tsx`)
1. Remove numeric `<input type="number" value={settledAmount} />`.
2. Render formatted, styled read-only card showing `formatIDR(record.compensationAmount || 0)` with a prominent badge `"Tagihan Penuh (One-Shot)"` and explanatory subtitle.
3. Automatically bind `settledAmount` payload to `record.compensationAmount || 0`.

### 4.2. Backend Enforcement in `/api/marcom/inventory/borrow/[id]/settle/route.ts`
1. For `SUBMIT` (staff cash transfer submission) and `DIRECT_RESOLVE` (officer direct resolution), the server forces:
   ```ts
   settledAmount: existing.compensationAmount || 0
   ```
2. Any client-sent `settledAmount` that differs from `existing.compensationAmount` is either rejected or strictly overwritten with `existing.compensationAmount`.

### 4.3. Liability Adjustment Workflow (`BorrowDetailModal.tsx` & `CompensationAdjustmentModal.tsx`)
1. In `BorrowDetailModal.tsx`, inside the `Kewajiban Ganti Rugi Kerusakan / Kehilangan` card:
   - When user has permission `PROCESS_RETURN` and `record.compensationStatus === "PENDING_SETTLEMENT"`, render a secondary button:  
     `"Adjust Nilai Ganti Rugi"` (styled with neutral/amber outline styling alongside `"Selesaikan Ganti Rugi"`).
2. Clicking the button opens `CompensationAdjustmentModal.tsx` passing `record` and callback `onSuccess(updatedRecord)`.
3. Modal validates:
   - `newAmount >= 0` and is a valid finite number.
   - `reason.trim().length >= 5` (mandatory justification).
   - `newAmount !== record.compensationAmount` (must represent a real adjustment).
4. Submitting dispatches `POST /api/marcom/inventory/borrow/[id]/adjust-compensation`:
   - Validates session and `hasPermission(role, "PROCESS_RETURN")`.
   - Confirms `compensationStatus === "PENDING_SETTLEMENT"`.
   - Appends audit trail string:
     ```ts
     const auditLog = `\n\n[PENYESUAIAN Rp ${(existing.compensationAmount || 0).toLocaleString("id-ID")} -> Rp ${newAmount.toLocaleString("id-ID")} oleh ${userName} (${role}) - ${new Date().toLocaleDateString("id-ID")}]: ${reason.trim()}`;
     const updatedNotes = ((existing.compensationNotes || "") + auditLog).trim();
     ```
   - Updates `compensationAmount: newAmount` and `compensationNotes: updatedNotes`.
   - If `newAmount === 0`, transitions `compensationStatus` to `"RESOLVED"` with `settledAt: new Date()`, `settledBy: userName`, `settlementNotes: "Ganti rugi dibebaskan/dihapus: " + reason.trim()`.

---

## 5. Consequences & Trade-offs

### Positive Consequences
- **Zero Moral Hazard:** Staff cannot change the penalty amount during payment submission.
- **Auditable Pricing Changes:** All liability changes are permanently stamped with the officer's name, role, previous amount, new amount, date, and reason in `compensationNotes`.
- **Waiver Handling:** If management waives the penalty to Rp 0, the system safely transitions to `RESOLVED` with an auditable justification without breaking stock invariants.
- **Clean Separation:** Settlement form stays focused on uploading proof; adjustment stays focused on cost governance.

### Accepted Trade-offs
- An additional component `CompensationAdjustmentModal.tsx` and API route `/api/marcom/inventory/borrow/[id]/adjust-compensation/route.ts` are created. Both are atomic, single-responsibility modules.

---

## 6. Verification & Invariants

1. **Settlement Form Read-Only Invariant:** `BorrowSettlementModal.tsx` contains NO editable input for `settledAmount`.
2. **Server-Enforced Settled Amount Invariant:** `/api/marcom/inventory/borrow/[id]/settle` saves `existing.compensationAmount` as `settledAmount`.
3. **RBAC Guard Invariant:** Staff attempting to call `/adjust-compensation` receives HTTP 403 Forbidden.
4. **Mandatory Audit Invariant:** Updating compensation without a reason receives HTTP 400 Bad Request.
5. **Non-Negotiable Gates:** `npm run drift:check`, `npm run build:check`, and `npm test` must pass with 0 failures and 0 errors.



