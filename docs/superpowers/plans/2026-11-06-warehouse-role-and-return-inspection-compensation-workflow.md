# Implementation Plan: Warehouse Role and Return Inspection Compensation Workflow

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-warehouse-role-and-return-inspection-compensation-workflow-design.md`
- **ADR Reference:** `docs/adr/0050-warehouse-role-and-return-inspection-compensation-workflow.md`

---

## 1. Executive Summary & File Manifest

This plan implements a dedicated `WAREHOUSE` role and a comprehensive physical asset inspection and compensation workflow. It strictly restricts `warehouse` to CUD in Equipment Inventory (with read-only elsewhere), revokes return self-approval from `staff` (Four-Eyes Principle), introduces multi-unit condition breakdown, eliminates ghost inventory by decommissioning damaged/lost assets immediately, and tracks damage proof photos and compensation settlement.

### File Manifest with Estimated LOC

| Action | File Path | Estimated LOC Diff | Responsibility |
| :--- | :--- | :---: | :--- |
| **Modify** | `prisma/schema.prisma` | ~15 | Add `WAREHOUSE` enum, breakdown columns on `BorrowItem`, compensation columns on `BorrowRecord` |
| **Modify** | `src/types/index.ts` | ~15 | SSOT domain updates: `UserRole`, `MarcomRole`, `BorrowRecord`, `BorrowItem` |
| **Modify** | `src/lib/marcom/guards.ts` | ~20 | Define `rolePermissions.warehouse`, revoke return/manage permissions from `staff` |
| **Modify** | `src/lib/marcom/guards.test.ts` | ~25 | Add unit tests verifying `warehouse` and `staff` permissions |
| **Modify** | `src/app/api/marcom/inventory/borrow/[id]/return/route.ts` | ~60 | Enforce guard, validate sum of units, execute stock math, set compensation status |
| **Modify** | `src/app/api/marcom/inventory/inventoryApi.test.ts` | ~50 | Add integration tests for return arithmetic and validation errors |
| **Modify** | `src/components/views/InventoryView/ReturnProcessModal.tsx` | ~120 | Add 4-condition breakdown, photo dropzone, and compensation fields |
| **Modify** | `src/components/views/InventoryView/BorrowDetailModal.tsx` | ~30 | Render compensation liability badge and photo gallery |
| **Modify** | `src/components/views/UsersView/UserRoleSelect.tsx` | ~10 | Add `WAREHOUSE` option to role dropdown |
| **Create** | `src/components/views/InventoryView/returnProcessModal.test.ts` | ~55 | UI invariant and calculation tests |

---

## 2. Phased Implementation Roadmap

### Phase 1: Database Migration & SSOT Domain Types
- [ ] **Step 1.1: Update Prisma Schema (`prisma/schema.prisma`)**
  - Add `WAREHOUSE` to `enum DbUserRole`.
  - Add `goodUnits Int @default(0)`, `minorDamageUnits Int @default(0)`, `majorDamageUnits Int @default(0)`, `lostUnits Int @default(0)` to `model BorrowItem`.
  - Add `compensationAmount Float @default(0)`, `compensationStatus String @default("NONE")`, `compensationNotes String @default("")`, `damagePhotos String[] @default([])` to `model BorrowRecord`.
- [ ] **Step 1.2: Run Prisma Database Synchronization**
  - Execute `npx prisma db push` to synchronize local database schema without data loss.
- [ ] **Step 1.3: Update SSOT Domain Types (`src/types/index.ts`)**
  - Add `"warehouse"` to `UserRole` and `MarcomRole`.
  - Update `BorrowItem` interface to include `goodUnits`, `minorDamageUnits`, `majorDamageUnits`, `lostUnits`.
  - Update `BorrowRecord` interface to include `compensationAmount`, `compensationStatus`, `compensationNotes`, `damagePhotos`.
- [ ] **Verification Gate Phase 1**: Run `npm run build:check` to verify zero type mismatches across all consumers.

---

### Phase 2: RBAC Guards Terpusat & Four-Eyes Principle Hardening
- [ ] **Step 2.1: Update Permission Matrix (`src/lib/marcom/guards.ts`)**
  - Define `rolePermissions.warehouse` containing:
    - `"VIEW_INVENTORY"`, `"MANAGE_INVENTORY"`, `"REQUEST_BORROW"`, `"APPROVE_BORROW"`, `"PROCESS_RETURN"`.
  - Update `rolePermissions.staff`:
    - Remove `"PROCESS_RETURN"` and `"MANAGE_INVENTORY"`.
    - Keep `"REQUEST_BORROW"`.
  - In `hasScopedPermission`, ensure `warehouse` is blocked from non-inventory operations.
- [ ] **Step 2.2: Automated Unit Tests (`src/lib/marcom/guards.test.ts`)**
  - Test `hasPermission("warehouse", "PROCESS_RETURN") === true`.
  - Test `hasPermission("warehouse", "CREATE_MOU") === false`.
  - Test `hasPermission("warehouse", "CREATE_PLACEMENT") === false`.
  - Test `hasPermission("warehouse", "CREATE_EVENT") === false`.
  - Test `hasPermission("staff", "PROCESS_RETURN") === false`.
  - Test `hasPermission("staff", "MANAGE_INVENTORY") === false`.
- [ ] **Verification Gate Phase 2**: Run `node --test src/lib/marcom/guards.test.ts` (100% passing).

---

### Phase 3: Backend Return Endpoint & Stock Balancing Arithmetic
- [ ] **Step 3.1: Enforce Authorization in Return Route (`src/app/api/marcom/inventory/borrow/[id]/return/route.ts`)**
  - Check session using `getServerSession(authOptions)`.
  - Validate role permissions using `can("PROCESS_RETURN")`. Reject unauthorized roles (`staff`, `viewer`) with HTTP 403 Forbidden.
- [ ] **Step 3.2: Implement Validation & Stock Arithmetic**
  - For each item in payload, validate:
    - `goodUnits + minorDamageUnits + majorDamageUnits + lostUnits === bi.quantity`.
    - If sum differs, return HTTP 422 with descriptive error.
  - Update `BorrowItem`: save breakdown counts and dominant `conditionIn`.
  - Update `InventoryItem`:
    - Calculate `restored = goodUnits + minorDamageUnits`.
    - Calculate `writeOff = majorDamageUnits + lostUnits`.
    - Set `availableUnits = Math.min(inv.totalUnits - writeOff, inv.availableUnits + restored)`.
    - Set `totalUnits = Math.max(0, inv.totalUnits - writeOff)`.
    - Update `status` dynamically (`AVAILABLE`, `BORROWED`, `RETIRED`).
  - Update `BorrowRecord`:
    - Set `status = "RETURNED"`.
    - Set `returnDate = parsedReturnDate`.
    - Set `returnNotes = returnNotes.trim()`.
    - Set `compensationAmount = Number(compensationAmount || 0)`.
    - Set `compensationNotes = String(compensationNotes || "").trim()`.
    - Set `damagePhotos = Array.isArray(damagePhotos) ? damagePhotos : []`.
    - Set `compensationStatus = writeOff > 0 ? (compensationStatus || "PENDING_SETTLEMENT") : "NONE"`.
- [ ] **Step 3.3: Automated Integration Tests (`src/app/api/marcom/inventory/inventoryApi.test.ts`)**
  - Test return request by `staff` is rejected with HTTP 403.
  - Test return request with mismatched unit sum is rejected with HTTP 422.
  - Test return request with 10 borrowed = 8 good, 1 major damage, 1 lost:
    - Asserts `availableUnits` increments by 8.
    - Asserts `totalUnits` decrements by 2.
    - Asserts `compensationStatus === "PENDING_SETTLEMENT"`.
- [ ] **Verification Gate Phase 3**: Run `node --test src/app/api/marcom/inventory/inventoryApi.test.ts`.

---

### Phase 4: UI Elevation (`ReturnProcessModal.tsx` & `BorrowDetailModal.tsx`)
- [ ] **Step 4.1: Multi-Unit Condition Breakdown Grid (`ReturnProcessModal.tsx`)**
  - Replace flat condition select with 4 numeric stepper inputs per line item (`goodUnits`, `minorDamageUnits`, `majorDamageUnits`, `lostUnits`).
  - Add instant client-side sum validator: show badge `Dialokasikan: N / Total: M`.
  - Disable submit button if any item has $N \ne M$.
- [ ] **Step 4.2: Damage Proof Photo Dropzone (`ReturnProcessModal.tsx`)**
  - Mount file input dropzone when any item has $\text{minorDamageUnits} + \text{majorDamageUnits} + \text{lostUnits} > 0$.
  - Call `/api/marcom/uploads?kind=inventory-damages` to upload image files.
  - Render preview thumbnails with single-click delete.
- [ ] **Step 4.3: Financial Liability & Ganti Rugi Card (`ReturnProcessModal.tsx`)**
  - Automatically expand when $\text{majorDamageUnits} > 0$ or $\text{lostUnits} > 0$.
  - Inputs:
    - `compensationAmount` (Rp numeric input with formatting).
    - `compensationNotes` (Textarea for Berita Acara agreement notes).
    - `compensationStatus` toggle (`PENDING_SETTLEMENT` vs `RESOLVED`).
- [ ] **Step 4.4: Liability Badge & Photo Gallery in Detail Modal (`BorrowDetailModal.tsx`)**
  - Render Ganti Rugi status badge (`PENDING_SETTLEMENT` amber badge vs `RESOLVED` emerald badge).
  - Render damage photo thumbnail gallery with full preview.
  - Add action button *"Tandai Ganti Rugi Selesai"* calling `PATCH /api/marcom/inventory/borrow/[id]`.

---

### Phase 5: User Management Role Selection & Verification Gates
- [ ] **Step 5.1: Update Role Selection Dropdown (`src/components/views/UsersView/UserRoleSelect.tsx`)**
  - Add `WAREHOUSE` to options list with label `"Warehouse / Logistik"`.
- [ ] **Step 5.2: Create UI Invariant Test (`src/components/views/InventoryView/returnProcessModal.test.ts`)**
  - Assert `ReturnProcessModal` contains quantity breakdown steppers for Good, Minor, Major, Lost.
  - Assert submit button is disabled when sum is incomplete.
  - Assert photo upload and compensation sections are present.
- [ ] **Step 5.3: Non-Negotiable Gates Execution**
  - Run `npm run drift:check` (must pass 77/77 pairs, 0 drift).
  - Run `npm run build:check` (must compile with 0 TypeScript errors).
  - Run `npm test` (full test suite, 0 failures).


