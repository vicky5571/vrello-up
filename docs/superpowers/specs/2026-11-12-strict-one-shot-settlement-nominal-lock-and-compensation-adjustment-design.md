# Specification: Strict One-Shot Settlement Nominal Lock and Compensation Adjustment Workflow

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Author:** Senior Software Engineer & Principal Systems Architect
- **References:** ADR-0050, ADR-0052, ADR-0106, ADR-0108

---

## 1. Executive Summary & Business Flow

This specification establishes strict financial integrity controls and administrative liability adjustment mechanisms for marketing equipment borrowing compensation in Vrello Up.

### 1.1 The Dual Imperative
1. **Financial Integrity via One-Shot Nominal Locking:**  
   The payment settlement form (`BorrowSettlementModal.tsx`) is transformed into a strict execution surface. The settlement nominal cannot be edited by the user; it is bound immutably to the outstanding `compensationAmount`. The server route `/api/marcom/inventory/borrow/[id]/settle` unconditionally enforces `settledAmount = existing.compensationAmount` for cash reimbursement, preventing moral hazard where borrowers or operators arbitrarily reduce liabilities before marking loans as resolved.
2. **Administrative Liability Adjustment (`Adjust Nilai Ganti Rugi`):**  
   Initial damage assessments made at the warehouse return desk (`ReturnProcessModal`) are frequently subject to revision after formal inspection by authorized service technicians or when management grants official corporate subsidies. To support legitimate adjustments without compromising settlement execution, authorized officers (`warehouse`, `supervisor`, `admin`) are provided an explicit `"Adjust Nilai Ganti Rugi"` action in `BorrowDetailModal.tsx`. Every adjustment requires a mandatory explanation note and is immutably logged into `compensationNotes` with officer identity and timestamps.

### 1.2 End-to-End User Journeys

#### Flow A: Staff Borrower Cash Settlement (Locked Nominal)
1. Staff member opens `BorrowDetailModal` for a damaged equipment return (`compensationStatus: "PENDING_SETTLEMENT"`, e.g. Rp 1.000.000).
2. Staff clicks `"Kirim Bukti Pelunasan Transfer"`, opening `BorrowSettlementModal`.
3. The settlement modal renders a **Read-Only Metric Card** displaying `Rp 1.000.000` with badge `"Tagihan Penuh (One-Shot)"`. There is no numeric input field.
4. Staff uploads the bank transfer receipt, enters mandatory transfer notes, and submits.
5. Transaction transitions to `PENDING_VERIFICATION` awaiting warehouse/admin review.

#### Flow B: Authorized Officer Liability Adjustment
1. Warehouse officer or admin views `BorrowDetailModal` with outstanding liability `Rp 1.000.000`.
2. Authorized officer notices an official repair invoice from vendor totaling `Rp 850.000`.
3. Officer clicks the secondary button `"Adjust Nilai Ganti Rugi"`. (This button is completely hidden from `staff` roles).
4. `CompensationAdjustmentModal` opens:
   - Displays current liability (`Rp 1.000.000`).
   - Requires input for new amount (`Rp 850.000`).
   - Requires mandatory justification (e.g. `"Nota servis resmi Canon Service Center #INV-8829"`).
5. On submit, `POST /api/marcom/inventory/borrow/[id]/adjust-compensation` validates permissions, updates `compensationAmount` to `850000`, and appends the audit log to `compensationNotes`.
6. `BorrowDetailModal` refreshes: displaying new liability `Rp 850.000` and updated notes.
7. Subsequent settlement submissions by staff are locked to `Rp 850.000`.

#### Flow C: Complete Liability Waiver (Adjustment to Rp 0)
1. Executive management waives the penalty due to equipment age or operational circumstances.
2. Admin opens `"Adjust Nilai Ganti Rugi"` and enters new amount `0` with justification `"Pembebasan ganti rugi disetujui Head of Marketing (Ref: Memo-04)"`.
3. The server sets `compensationAmount: 0`, updates `compensationNotes`, and immediately transitions `compensationStatus` to `"RESOLVED"` with `settledAt: new Date()`, `settledBy: userName`.
4. The loan record is cleanly closed with an immutable audit trail.

---

## 2. State Machine & Transition Invariants

```
┌────────────────────────────────────────────────────────────────────────┐
│                      BORROW RECORD COMPENSATION STATE                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                       [PENDING_SETTLEMENT]                             │
│                         (Amount > 0)                                   │
│                               │                                        │
│          ┌────────────────────┼────────────────────────┐               │
│          │                    │                        │               │
│          │ Action:            │ Action:                │ Action:       │
│          │ SUBMIT (Staff)     │ DIRECT_RESOLVE         │ ADJUST        │
│          │ Proof uploaded     │ (In-Person Officer)    │ (Officer)     │
│          │ Locked Amount      │ Locked Amount          │ Updates Amt   │
│          │                    │                        │ & Notes       │
│          ▼                    ▼                        ▼               │
│ [PENDING_VERIFICATION]    [RESOLVED]             [PENDING_SETTLEMENT]  │
│          │                (Terminal)             (New Amount > 0)      │
│          │                                             │               │
│          │ Action: CONFIRM                             │ If New Amt=0  │
│          │ (Officer approval)                          │ (Waiver)      │
│          └─────────────────────────────────────────────┘               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Transition Guard Table

| Initial State | Action | Role | Guard Conditions | Target State & Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| `PENDING_SETTLEMENT` | `SUBMIT` | `staff` (borrower) or officer | • Proof files $\ge 1$<br>• Mode `CASH_TRANSFER`<br>• `settledAmount` forced to `compensationAmount` | `PENDING_VERIFICATION`. Awaits officer review. |
| `PENDING_SETTLEMENT` | `DIRECT_RESOLVE` | `warehouse`, `supervisor`, `admin` | • Proof files $\ge 1$<br>• `settledAmount` forced to `compensationAmount` | `RESOLVED`. Atomic stock restoration if `ITEM_REPLACEMENT`. |
| `PENDING_SETTLEMENT` | `ADJUST_COMPENSATION` | `warehouse`, `supervisor`, `admin` | • `newAmount >= 0`<br>• `newAmount !== currentAmount`<br>• `reason.trim().length >= 5` | • If `newAmount > 0`: `PENDING_SETTLEMENT` with new amount and appended audit log.<br>• If `newAmount === 0`: `RESOLVED` (waiver) with audit log. |
| `PENDING_VERIFICATION` | `ADJUST_COMPENSATION` | `warehouse`, `supervisor`, `admin` | *(Blocked)* | Rejected (HTTP 400). Must `REJECT` or `CONFIRM` pending proof first. |
| `RESOLVED` | *(Any)* | *(None)* | *(Blocked)* | Terminal state. No further mutations permitted. |

---

## 3. Data Contracts & API Schema

### 3.1 SSOT Domain Types (`src/types/index.ts`)

```ts
export interface AdjustCompensationPayload {
  newAmount: number;
  reason: string;
}
```

### 3.2 Endpoint: `POST /api/marcom/inventory/borrow/[id]/adjust-compensation`

- **Authorization:** `session.user` must have permission `PROCESS_RETURN` (`warehouse`, `supervisor`, `admin`).
- **Request Headers:** Standard NextAuth cookie or `x-marcom-role` test mock header.
- **Request Body (JSON):**
  ```json
  {
    "newAmount": 850000,
    "reason": "Nota servis resmi Canon Service Center #INV-8829"
  }
  ```
- **Validation Rules:**
  - `typeof newAmount === "number" && !Number.isNaN(newAmount) && newAmount >= 0` $\rightarrow$ otherwise 400 Bad Request.
  - `typeof reason === "string" && reason.trim().length >= 5` $\rightarrow$ otherwise 400 Bad Request.
  - `existing.compensationStatus === "PENDING_SETTLEMENT"` $\rightarrow$ otherwise 400 Bad Request.
  - `newAmount !== existing.compensationAmount` $\rightarrow$ otherwise 400 Bad Request ("Nominal baru harus berbeda dari nominal saat ini").
- **Success Response (200 OK):** Updated `BorrowRecord` domain object with items and event included.

### 3.3 Endpoint: `POST /api/marcom/inventory/borrow/[id]/settle` Modifications

- In `SUBMIT` handler:
  ```ts
  // Unconditionally force exact outstanding liability
  const settledAmountNum = existing.compensationAmount || 0;
  ```
- In `DIRECT_RESOLVE` handler:
  ```ts
  // Unconditionally force exact outstanding liability for CASH_TRANSFER
  const settledAmountNum =
    settlementType === "CASH_TRANSFER" ? (existing.compensationAmount || 0) : 0;
  ```

---

## 4. UI Component Architecture

### 4.1 `BorrowSettlementModal.tsx` Refactoring
- **Removal:** Delete numeric input and `onChange={(e) => setSettledAmount(...)}`.
- **Addition:** Render a read-only metric card:
  ```tsx
  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Nominal Pelunasan Wajib (One-Shot)
      </span>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        Tagihan Penuh
      </span>
    </div>
    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
      {formatIDR(record.compensationAmount || 0)}
    </div>
    <p className="text-[11px] text-slate-400 mt-1">
      Nominal transfer wajib sesuai dengan total nilai ganti rugi yang telah ditetapkan.
    </p>
  </div>
  ```
- **Payload:** Binds `settledAmount: record.compensationAmount || 0` directly.

### 4.2 `BorrowDetailModal.tsx` Action Deck Extension
- Inside the `Kewajiban Ganti Rugi Kerusakan / Kehilangan` banner:
  - Add action button row:
    - Primary Button: `"Selesaikan Ganti Rugi"` (or `"Kirim Bukti Pelunasan Transfer"` for staff).
    - Secondary Button (Officer Only): `"Adjust Nilai Ganti Rugi"` (`SlidersHorizontal` or `Edit3` icon, amber border).
    - Condition: `canProcessReturn && record.compensationStatus === "PENDING_SETTLEMENT"`.
- Clicking the button sets `isAdjustModalOpen: true`.
- Embeds `<CompensationAdjustmentModal />` at bottom of component.

### 4.3 `CompensationAdjustmentModal.tsx` (New Component)
- **Props:**
  ```ts
  interface CompensationAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: BorrowRecord;
    onSuccess: (updatedRecord: BorrowRecord) => void;
  }
  ```
- **UI Structure:**
  - Header with title `"Penyesuaian Nilai Ganti Rugi"` and subtitle `record.borrowCode`.
  - Current liability display: `formatIDR(record.compensationAmount || 0)`.
  - Input `Nominal Ganti Rugi Baru (Rp)`: `<input type="number" min="0" step="1000" />`.
  - Textarea `Alasan Penyesuaian *`: `<textarea rows={3} placeholder="Contoh: Nota resmi bengkel servis lebih murah dari estimasi..." />`.
  - Helper note explaining that setting nominal to 0 will mark the liability as waived/resolved.
  - Buttons: `"Batal"` and `"Simpan Penyesuaian"` (with loading spinner).

---

## 5. Acceptance Criteria

- **AC-1 (Read-Only Settlement Form):** When `BorrowSettlementModal` is rendered, there is no editable input for the settlement amount. The modal prominently displays `record.compensationAmount` as a read-only metric.
- **AC-2 (Server-Side Nominal Enforcement):** Any `SUBMIT` or `DIRECT_RESOLVE` request to `/api/marcom/inventory/borrow/[id]/settle` saves `settledAmount = existing.compensationAmount` for `CASH_TRANSFER`, ignoring any client-sent payload deviations.
- **AC-3 (Officer-Only Adjustment Button):** The `"Adjust Nilai Ganti Rugi"` button is visible only to users with `PROCESS_RETURN` permissions (`warehouse`, `supervisor`, `admin`) when `compensationStatus === "PENDING_SETTLEMENT"`. Staff borrowers do not see this button.
- **AC-4 (Mandatory Justification):** Submitting an adjustment without a reason ($\ge 5$ chars) or with an identical amount is rejected on both client and server with HTTP 400.
- **AC-5 (Audit Trail Stamping):** When an adjustment succeeds, `compensationNotes` contains an appended, timestamped log stating the previous amount, new amount, officer identity, and justification.
- **AC-6 (Waiver to Zero):** If the new amount is set to `0`, `compensationStatus` immediately transitions to `"RESOLVED"` with `settledBy` and `settledAt` populated, cleanly terminating the liability.
- **AC-7 (Pending Verification Lock):** While `compensationStatus === "PENDING_VERIFICATION"`, the adjustment button is disabled / hidden, and direct API calls are rejected with HTTP 400.

---

## 6. Verification Checklist

- [ ] `npm run drift:check` passes with matching spec-plan pair.
- [ ] Automated tests in `inventoryApi.test.ts` verify:
  - Unauthorized staff cannot call `/adjust-compensation` (HTTP 403).
  - Validation failures on empty reason, negative amount, or unchanged amount (HTTP 400).
  - Successful adjustment updates `compensationAmount` and appends audit note.
  - Waiver to 0 transitions status to `RESOLVED`.
  - `/settle` route forces `settledAmount` to match `compensationAmount`.
- [ ] Component invariant tests in `borrowSettlementModal.test.ts` verify read-only nominal card.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` runs full suite with 0 failures.



