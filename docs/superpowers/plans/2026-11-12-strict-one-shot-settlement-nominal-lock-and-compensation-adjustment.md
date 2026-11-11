# Implementation Plan: Strict One-Shot Settlement Nominal Lock and Compensation Adjustment Workflow

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Spec Reference:** `docs/superpowers/specs/2026-11-12-strict-one-shot-settlement-nominal-lock-and-compensation-adjustment-design.md`
- **ADR Reference:** `docs/adr/0108-strict-one-shot-settlement-nominal-lock-and-compensation-adjustment-workflow.md`

---

## 1. File Manifest & Responsibilities

| File Path | Responsibility | Estimated Changes |
| :--- | :--- | :--- |
| `src/types/index.ts` | SSOT domain definition for `AdjustCompensationPayload` | ~5 LOC addition |
| `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts` | Backend route: unconditionally force `settledAmount = existing.compensationAmount` for `CASH_TRANSFER` | ~10 LOC modified |
| `src/app/api/marcom/inventory/borrow/[id]/adjust-compensation/route.ts` | New endpoint: handles `POST` liability adjustment with RBAC guard, validation, waiver to 0, and audit notes | ~95 LOC (New file) |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | Automated backend tests for adjustment API, RBAC guards, validation, and settlement enforcement | ~120 LOC addition |
| `src/components/views/InventoryView/BorrowSettlementModal.tsx` | Eliminate editable numeric input; render Read-Only Metric Card with One-Shot badge | ~25 LOC modified |
| `src/components/views/InventoryView/CompensationAdjustmentModal.tsx` | New modal component: adjustment input, justification textarea, validation, submission | ~130 LOC (New file) |
| `src/components/views/InventoryView/BorrowDetailModal.tsx` | Render `"Adjust Nilai Ganti Rugi"` action button for officers on `PENDING_SETTLEMENT`, mount adjustment modal | ~35 LOC modified |
| `src/components/views/InventoryView/borrowSettlementModal.test.ts` | Invariant tests for read-only settlement card | ~20 LOC addition |
| `src/components/views/InventoryView/borrowDetailModal.test.ts` | Invariant tests for adjustment button RBAC visibility and modal integration | ~30 LOC addition |
| `docs/SESSION_STATE.md` | Session tracking and verification gates | Status update |

---

## 2. Phased Implementation Roadmap

### Phase 1: SSOT Domain Types & Settle Route Server Enforcement
- [ ] **Task 1.1:** Add `AdjustCompensationPayload` interface in `src/types/index.ts`:
  ```ts
  export interface AdjustCompensationPayload {
    newAmount: number;
    reason: string;
  }
  ```
- [ ] **Task 1.2:** In `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts`:
  - In `SUBMIT` action: replace `settledAmountNum` derivation with `const settledAmountNum = existing.compensationAmount || 0;`.
  - In `DIRECT_RESOLVE` action: force `settledAmount: settlementType === "CASH_TRANSFER" ? (existing.compensationAmount || 0) : 0`.
- [ ] **Verification 1:** Run `npm run build:check` to ensure type integrity.

### Phase 2: Compensation Adjustment API Route & Comprehensive Tests
- [ ] **Task 2.1:** Create route handler `src/app/api/marcom/inventory/borrow/[id]/adjust-compensation/route.ts`:
  - Session authentication & `hasPermission(role, "PROCESS_RETURN")` guard (HTTP 403 for unauthorized users).
  - Validate `newAmount`: must be non-negative finite number (`newAmount >= 0`).
  - Validate `reason`: must be string with trimmed length $\ge 5$ characters.
  - Check record exists and `existing.compensationStatus === "PENDING_SETTLEMENT"` (HTTP 400 if not pending settlement).
  - Verify `newAmount !== existing.compensationAmount` (HTTP 400 if amount unchanged).
  - Append audit string to `compensationNotes`:
    ```ts
    const auditLog = `\n\n[PENYESUAIAN Rp ${(existing.compensationAmount || 0).toLocaleString("id-ID")} -> Rp ${newAmount.toLocaleString("id-ID")} oleh ${userName} (${role}) - ${new Date().toLocaleDateString("id-ID")}]: ${reason.trim()}`;
    const updatedNotes = ((existing.compensationNotes || "") + auditLog).trim();
    ```
  - If `newAmount === 0`:
    - Set `compensationAmount: 0`, `compensationNotes: updatedNotes`, `compensationStatus: "RESOLVED"`, `settledAt: new Date()`, `settledBy: userName`, `settlementNotes: "Ganti rugi dibebaskan/dihapus: " + reason.trim()`.
  - Else:
    - Set `compensationAmount: newAmount`, `compensationNotes: updatedNotes`.
  - Return updated `BorrowRecord` with items and event included.
- [ ] **Task 2.2:** Add test suite in `src/app/api/marcom/inventory/inventoryApi.test.ts`:
  - Unauthorized staff cannot adjust compensation (HTTP 403).
  - Reject negative amount, empty reason, or identical amount (HTTP 400).
  - Reject adjustment when status is not `PENDING_SETTLEMENT` (HTTP 400).
  - Successful adjustment updates `compensationAmount` and appends audit note to `compensationNotes`.
  - Waiver to 0 transitions status to `RESOLVED` with `settledBy` and `settledAt`.
  - Settlement route unconditionally forces `settledAmount` to equal `compensationAmount`.
- [ ] **Verification 2:** Run targeted test:  
  `node --test --import ./test/register-alias.mjs src/app/api/marcom/inventory/inventoryApi.test.ts`

### Phase 3: Client UI — Read-Only Form in `BorrowSettlementModal.tsx`
- [ ] **Task 3.1:** In `src/components/views/InventoryView/BorrowSettlementModal.tsx`:
  - Remove numeric input `<input type="number" min="0" value={settledAmount} ... />` and helper text *"Nilai di atas dapat disesuaikan"*.
  - Render Read-Only Metric Card showing `formatIDR(record.compensationAmount || 0)`, badge `"Tagihan Penuh (One-Shot)"`, and helper subtitle.
  - Set `settledAmount` payload directly to `record.compensationAmount || 0`.
- [ ] **Task 3.2:** Update `borrowSettlementModal.test.ts` to assert read-only nominal card and absence of editable `<input type="number">`.
- [ ] **Verification 3:** Run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowSettlementModal.test.ts`.

### Phase 4: Client UI — `CompensationAdjustmentModal.tsx` & `BorrowDetailModal.tsx` Integration
- [ ] **Task 4.1:** Create component `src/components/views/InventoryView/CompensationAdjustmentModal.tsx`:
  - Props: `isOpen`, `onClose`, `record`, `onSuccess(updatedRecord)`.
  - State: `newAmount` (number), `reason` (string), `isSubmitting` (boolean), `error` (string | null).
  - Validation: `newAmount >= 0`, `newAmount !== record.compensationAmount`, `reason.trim().length >= 5`.
  - Visuals: Current amount badge, new amount input, reason textarea, explanatory callout for waiver (if `newAmount === 0`).
  - Action buttons: "Batal" and "Simpan Penyesuaian" (with spinner).
- [ ] **Task 4.2:** In `src/components/views/InventoryView/BorrowDetailModal.tsx`:
  - Add state `const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)`.
  - In `Kewajiban Ganti Rugi Kerusakan / Kehilangan` banner:
    - If `canProcessReturn && record.compensationStatus === "PENDING_SETTLEMENT"`:
      - Render secondary button `"Adjust Nilai Ganti Rugi"` (`SlidersHorizontal` icon, amber border/text styling) next to `"Selesaikan Ganti Rugi"`.
  - Mount `<CompensationAdjustmentModal />` at bottom of modal.
  - When `onSuccess` fires: update local record and call parent `onRecordUpdated` or `onStatusChange`.
- [ ] **Task 4.3:** Add unit tests in `src/components/views/InventoryView/borrowDetailModal.test.ts` verifying button visibility rules and modal mounting.
- [ ] **Verification 4:** Run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowDetailModal.test.ts`.

### Phase 5: Verification & Non-Negotiable Quality Gates
- [ ] **Task 5.1:** Run invariant drift check:
  ```bash
  npm run drift:check
  ```
  Must report `✅ No drift detected. All invariants pass.` with all 134 spec-plan pairs valid.
- [ ] **Task 5.2:** Run TypeScript & build verification:
  ```bash
  npm run build:check
  ```
  Must compile with 0 errors.
- [ ] **Task 5.3:** Run full test suite:
  ```bash
  npm test
  ```
  Must pass all tests (1122+ passing, 0 failures).
- [ ] **Task 5.4:** Update `docs/SESSION_STATE.md` with ADR-0108 progress.
- [ ] **Task 5.5:** Git commit all documentation and implementation changes.



