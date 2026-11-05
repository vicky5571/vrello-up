# Implementation Plan: Inventory Compensation Settlement and Stock Restoration Workflow

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-inventory-compensation-settlement-and-restoration-workflow-design.md`
- **ADR Reference:** `docs/adr/0052-inventory-compensation-settlement-and-restoration-workflow.md`

---

## 1. Executive Summary & File Manifest

This implementation plan delivers the complete settlement workflow for equipment loss and damage liabilities (`ADR-0052`). It closes the operational loop from ADR-0050 by allowing authorized warehouse coordinators and administrators to resolve pending compensation liabilities (`compensationStatus: "PENDING_SETTLEMENT" -> "RESOLVED"`). It supports dual-mode settlement (full cash reimbursement vs physical item replacement with automatic atomic master stock restoration), multi-file proof ingestion, and strict Four-Eyes governance.

### File Manifest with Estimated LOC

| Action | File Path | Estimated LOC Diff | Responsibility |
| :--- | :--- | :---: | :--- |
| **Modify** | `prisma/schema.prisma` | ~10 | Add settlement fields to `BorrowRecord` model |
| **Modify** | `src/types/index.ts` | ~15 | Add `CompensationSettlementType` and update `BorrowRecord` domain interface |
| **Create** | `src/app/api/marcom/inventory/borrow/[id]/settle/route.ts` | ~110 | Backend mutation endpoint with RBAC, status guards, proof check, and `$transaction` |
| **Modify** | `src/app/api/marcom/inventory/inventoryApi.test.ts` | ~50 | Integration tests for RBAC 403, validation 422, cash mode, and item replacement stock math |
| **Create** | `src/components/views/InventoryView/BorrowSettlementModal.tsx` | ~160 | Settlement modal with cash/item switch, multi-file attachment deck, and live breakdown |
| **Modify** | `src/components/views/InventoryView/BorrowDetailModal.tsx` | ~45 | Add *"Selesaikan Ganti Rugi"* button and detailed resolved summary card |
| **Create** | `src/components/views/InventoryView/borrowSettlementModal.test.ts` | ~40 | Structural invariant test for settlement modal components |
| **Modify** | `prisma/seed.ts` | ~25 | Seed representative pending and resolved compensation records |
| **Modify** | `docs/SESSION_STATE.md` | ~20 | Update active feature status to ADR-0052 |
| **Modify** | `CHANGELOG.md` | ~15 | Chronological changelog entry for ADR-0052 |

---

## 2. Phased Implementation Roadmap

### Phase 1: Database Schema & SSOT Domain Types
- [ ] **Step 1.1: Update Prisma Schema (`prisma/schema.prisma`)**
  - Add settlement fields to `BorrowRecord`:
    - `settlementType String @default("NONE")`
    - `settledAmount Float @default(0)`
    - `settledAt DateTime?`
    - `settledBy String @default("")`
    - `settlementNotes String @default("")`
    - `settlementProofUrls String[] @default([])`
  - Add index `@@index([compensationStatus])`.
- [ ] **Step 1.2: Synchronize Local Database**
  - Execute `npx prisma db push` to push schema changes cleanly to Postgres.
- [ ] **Step 1.3: Update SSOT Domain Types (`src/types/index.ts`)**
  - Export `CompensationSettlementType = "NONE" | "CASH_TRANSFER" | "ITEM_REPLACEMENT"`.
  - Update `BorrowRecord` interface with the 6 new fields.
- [ ] **Verification Gate Phase 1**: Run `npm run build:check` (must pass with 0 errors).

---

### Phase 2: Backend Settlement Endpoint & Automated Test Suite
- [ ] **Step 2.1: Implement Settlement Mutation Endpoint (`src/app/api/marcom/inventory/borrow/[id]/settle/route.ts`)**
  - Resolve session via `auth()`.
  - Check authorization: `hasPermission(role, "PROCESS_RETURN")`. If `staff` or `viewer`, reject with `HTTP 403 Forbidden`.
  - Check record existence: if not found, return `HTTP 404 Not Found`.
  - Validate state: `existing.compensationStatus === "PENDING_SETTLEMENT"`. If not, return `HTTP 400 Bad Request`.
  - Validate proof files: `Array.isArray(body.settlementProofUrls) && body.settlementProofUrls.length > 0`. If not, return `HTTP 422 Unprocessable Entity`.
  - Validate notes: `body.settlementNotes?.trim()`. If empty, return `HTTP 400 Bad Request`.
  - Execute atomic `$transaction`:
    - If `CASH_TRANSFER`: update `BorrowRecord`, master stock untouched.
    - If `ITEM_REPLACEMENT`: update `BorrowRecord`, and for each replaced item, increment `totalUnits` and `availableUnits` on `InventoryItem`.
- [ ] **Step 2.2: Add Integration Test Suite (`src/app/api/marcom/inventory/inventoryApi.test.ts`)**
  - Test 1: Reject unauthorized request from `staff` with 403.
  - Test 2: Reject request without proof file with 422.
  - Test 3: Settle via `CASH_TRANSFER` updates status to `RESOLVED` and preserves stock counts.
  - Test 4: Settle via `ITEM_REPLACEMENT` updates status and increments `totalUnits` & `availableUnits`.
- [ ] **Verification Gate Phase 2**: Run `node --test src/app/api/marcom/inventory/inventoryApi.test.ts`.

---

### Phase 3: Frontend UI Components (`BorrowDetailModal` & `BorrowSettlementModal`)
- [ ] **Step 3.1: Create Settlement Modal Component (`src/components/views/InventoryView/BorrowSettlementModal.tsx`)**
  - Mode switch toggle: 💵 *"Kas / Transfer"* vs 📦 *"Penggantian Barang Baru"*.
  - Mode `CASH_TRANSFER`: pre-filled editable `settledAmount` and required `settlementNotes`.
  - Mode `ITEM_REPLACEMENT`: list of damaged/lost units with informational notice on stock restoration.
  - Multi-file attachment deck with parallel upload to `/api/marcom/uploads` (kind: `inventory-proofs`) and per-file delete button.
  - Submit button disabled when proof is empty or submitting.
- [ ] **Step 3.2: Elevate Borrow Detail Modal (`src/components/views/InventoryView/BorrowDetailModal.tsx`)**
  - Add *"Selesaikan Ganti Rugi"* button in compensation section / footer when `canManage && compensationStatus === "PENDING_SETTLEMENT"`.
  - When `compensationStatus === "RESOLVED"`, render enhanced green card displaying settlement method, settled amount, timestamp, verifier, notes, and interactive proof attachments gallery.
- [ ] **Step 3.3: Add Structural Invariant Unit Test (`src/components/views/InventoryView/borrowSettlementModal.test.ts`)**
  - Assert mode toggle, attachment deck, and disabled state on empty proof.
- [ ] **Verification Gate Phase 3**: Run `npm run build:check`.

---

### Phase 4: Database Seed Fixtures & Non-Negotiable Gates
- [ ] **Step 4.1: Update Database Seed (`prisma/seed.ts`)**
  - Update `seedBorrowRecords()` to include:
    - Pending liability fixture: `borrow-dmg-002` (`compensationStatus: "PENDING_SETTLEMENT"`).
    - Resolved liability fixture: `borrow-res-005` (`compensationStatus: "RESOLVED"`, `settlementType: "ITEM_REPLACEMENT"`).
- [ ] **Step 4.2: Execute Re-Seed**
  - Run `npx prisma db seed` to refresh local test fixtures.
- [ ] **Step 4.3: Execute Non-Negotiable Verification Gates**
  - `npm run drift:check` (79/79 spec-plan pairs valid, 0 drift).
  - `npm run build:check` (0 TypeScript errors).
  - `npm test` (100% tests pass, 0 failures).
  - `npm run test:smoke` (100% tests pass).


