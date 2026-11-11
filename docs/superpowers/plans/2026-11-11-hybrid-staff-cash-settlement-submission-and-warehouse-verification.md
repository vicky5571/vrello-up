# Implementation Plan: Hybrid Staff Cash Settlement Submission and Warehouse Verification

- **Date:** 2026-11-11
- **Status:** APPROVED
- **Spec:** [2026-11-11-hybrid-staff-cash-settlement-submission-and-warehouse-verification-design.md](../specs/2026-11-11-hybrid-staff-cash-settlement-submission-and-warehouse-verification-design.md)
- **ADR:** [ADR-0106](../../adr/0106-hybrid-staff-cash-settlement-submission-and-warehouse-verification.md)

---

## 1. Executive Summary & File Manifest

This plan implements the hybrid staff settlement submission and two-step verification workflow ([ADR-0106](../../adr/0106-hybrid-staff-cash-settlement-submission-and-warehouse-verification.md)). It allows borrower `staff` to asynchronously submit cash transfer receipts (`CASH_TRANSFER`) for equipment damage compensation liabilities, moving the status to `"PENDING_VERIFICATION"`. Officers with `PROCESS_RETURN` (`warehouse`/`admin`) can confirm or reject submitted receipts, while retaining the existing on-the-spot 1-step resolution fast path. Physical unit replacements (`ITEM_REPLACEMENT`) remain strictly guarded against virtual staff submission to eliminate phantom stock.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/types/index.ts` | Edit | Extend `BorrowRecord.compensationStatus` union with `"PENDING_VERIFICATION"` in SSOT. | ~2 lines edited |
| `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts` | Edit | Add support for actions (`SUBMIT`, `CONFIRM`, `REJECT`, `DIRECT_RESOLVE`), RBAC/ownership checks, and rejection notes. | ~45 lines edited |
| `src/app/api/marcom/inventory/inventoryApi.test.ts` | Edit | Add tests covering `SUBMIT`, `CONFIRM`, `REJECT`, staff role guards, and `ITEM_REPLACEMENT` prohibition. | ~60 lines added |
| `src/components/views/InventoryView/BorrowSettlementModal.tsx` | Edit | Lock mode to `CASH_TRANSFER` for staff, disable `ITEM_REPLACEMENT`, and dispatch `action: "SUBMIT"`. | ~30 lines edited |
| `src/components/views/InventoryView/borrowSettlementModal.test.ts` | Edit | Assert modal role differentiation, helper text, and submit action. | ~35 lines added |
| `src/components/views/InventoryView/BorrowDetailModal.tsx` | Edit | Display amber `"Menunggu Konfirmasi"` badge, review cards, and officer Confirm / Reject action controls. | ~50 lines edited |
| `src/components/views/InventoryView/borrowDetailModal.test.ts` | Edit | Assert `PENDING_VERIFICATION` badge, officer confirmation/rejection buttons, and staff alert banner. | ~35 lines added |
| `docs/SESSION_STATE.md` | Edit | Record ADR-0106 completion and verification gate results. | ~20 lines edited |

### Prerequisites & Dependencies
- Zero database migrations (Prisma schema already stores `compensationStatus` and `settlementNotes` as `String`).
- Existing Supabase Storage bucket `inventory-damage` and upload kind `inventory-proofs` are already functional and verified.

---

## 2. Phase 1: SSOT Domain Types & Server-Side Settle Endpoint

- [ ] **Task 1.1: Extend `compensationStatus` in SSOT**
  - File: `src/types/index.ts`
  - Update `BorrowRecord.compensationStatus` union to `"NONE" | "PENDING_SETTLEMENT" | "PENDING_VERIFICATION" | "RESOLVED"`.
- [ ] **Task 1.2: Refactor `POST /api/marcom/inventory/borrow/[id]/settle/route.ts`**
  - File: `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts`
  - Accept `action: "SUBMIT" | "CONFIRM" | "REJECT" | "DIRECT_RESOLVE"`. Default to `"DIRECT_RESOLVE"` if caller has `PROCESS_RETURN` and `action` is omitted.
  - For `action === "SUBMIT"`:
    - Check caller is borrower (`userName === record.borrowerName`) or has `PROCESS_RETURN`.
    - Validate `record.compensationStatus === "PENDING_SETTLEMENT"`.
    - Require `settlementType === "CASH_TRANSFER"`. If `ITEM_REPLACEMENT`, return `HTTP 403 Forbidden`.
    - Validate non-empty notes and `proofs.length >= 1`.
    - Update `compensationStatus = "PENDING_VERIFICATION"`, record `settledAmount`, `settlementNotes`, `settlementProofUrls`, and `settledBy: userName`.
  - For `action === "CONFIRM"`:
    - Strictly guard with `hasPermission(role, "PROCESS_RETURN")`.
    - Validate `record.compensationStatus === "PENDING_VERIFICATION"`.
    - Update `compensationStatus = "RESOLVED"`, set `settledAt = new Date()`, `settledBy: userName`.
  - For `action === "REJECT"`:
    - Strictly guard with `hasPermission(role, "PROCESS_RETURN")`.
    - Validate `record.compensationStatus === "PENDING_VERIFICATION"`.
    - Require non-empty `rejectionReason`.
    - Update `compensationStatus = "PENDING_SETTLEMENT"`, append rejection message to `settlementNotes`.
  - For `action === "DIRECT_RESOLVE"`:
    - Strictly guard with `hasPermission(role, "PROCESS_RETURN")`.
    - Preserve existing 1-step direct resolution (supports both `CASH_TRANSFER` and atomic stock increment for `ITEM_REPLACEMENT`).
- [ ] **Task 1.3: Add Automated Backend Tests**
  - File: `src/app/api/marcom/inventory/inventoryApi.test.ts`
  - Add tests:
    - Staff submits cash transfer proof -> status becomes `PENDING_VERIFICATION`.
    - Staff attempts `ITEM_REPLACEMENT` -> rejected with 403.
    - Staff attempts `CONFIRM` -> rejected with 403.
    - Officer confirms -> status becomes `RESOLVED`.
    - Officer rejects -> status reverts to `PENDING_SETTLEMENT` with rejection note.
    - Unauthenticated callers rejected with 401.
- [ ] **Task 1.4: Verify Phase 1**
  - Run: `node --test --import ./test/register-alias.mjs src/app/api/marcom/inventory/inventoryApi.test.ts`

---

## 3. Phase 2: Staff-Aware Settlement Modal (`BorrowSettlementModal.tsx`)

- [ ] **Task 2.1: Implement Role Differentiation in Modal**
  - File: `src/components/views/InventoryView/BorrowSettlementModal.tsx`
  - Read user session role.
  - If `role === "staff"`:
    - Lock active mode to `CASH_TRANSFER`.
    - Disable `ITEM_REPLACEMENT` button with warning badge: *"Penggantian unit fisik wajib diserahkan langsung di meja gudang"*.
    - Set submit button label: `"Kirim Pengajuan Pelunasan"`.
    - Payload passes `action: "SUBMIT"`.
  - If `role !== "staff"` (officers with `PROCESS_RETURN`):
    - Retain dual-mode toggle.
    - Set submit button label: `"Selesaikan & Verifikasi Pelunasan"`.
    - Payload passes `action: "DIRECT_RESOLVE"`.
- [ ] **Task 2.2: Add Modal Invariant Tests**
  - File: `src/components/views/InventoryView/borrowSettlementModal.test.ts`
  - Verify staff mode locks `CASH_TRANSFER` and disables `ITEM_REPLACEMENT`.
  - Verify submit payload contains `action`.
- [ ] **Task 2.3: Verify Phase 2**
  - Run: `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowSettlementModal.test.ts`

---

## 4. Phase 3: Detail Modal Review & Verification Deck (`BorrowDetailModal.tsx`)

- [ ] **Task 3.1: Render `PENDING_VERIFICATION` State in `BorrowDetailModal.tsx`**
  - File: `src/components/views/InventoryView/BorrowDetailModal.tsx`
  - When `compensationStatus === "PENDING_VERIFICATION"`:
    - Render amber warning pill: `"Menunggu Konfirmasi Gudang/Admin"`.
    - Display submitted nominal, notes, and proof links with preview.
    - If user has `PROCESS_RETURN`:
      - Render `"Konfirmasi Pelunasan"` button triggering `POST /settle` with `action: "CONFIRM"`.
      - Render `"Tolak Bukti"` button prompting for `rejectionReason` and triggering `POST /settle` with `action: "REJECT"`.
    - If user is `staff`:
      - Render alert banner informing that proof has been submitted and is under review.
  - When `compensationStatus === "PENDING_SETTLEMENT"`:
    - If user is `staff` (and is borrower):
      - Render CTA button: `"Kirim Bukti Pelunasan Transfer"` opening `BorrowSettlementModal`.
- [ ] **Task 3.2: Add Detail Modal Invariant Tests**
  - File: `src/components/views/InventoryView/borrowDetailModal.test.ts`
  - Assert `PENDING_VERIFICATION` badge and review deck rendering.
  - Assert officer action buttons (`Konfirmasi Pelunasan` / `Tolak Bukti`) exist for warehouse/admin and are hidden for staff.
- [ ] **Task 3.3: Verify Phase 3**
  - Run: `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowDetailModal.test.ts`

---

## 5. Phase 4: Non-Negotiable Verification & Session Handoff

- [ ] **Task 4.1: Drift Check**
  - Run: `npm run drift:check` (must pass with 133/133 spec-plan pairs, 0 drift).
- [ ] **Task 4.2: Build Check**
  - Run: `npm run build:check` (0 TypeScript / Next.js compilation errors).
- [ ] **Task 4.3: Full Test Suite**
  - Run: `npm test` (0 failures across all suites).
- [ ] **Task 4.4: Update Documentation Handoff**
  - File: `docs/SESSION_STATE.md`
  - Record ADR-0106 completion and verification gate results.



