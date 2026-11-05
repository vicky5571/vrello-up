# Implementation Plan: Outlet Soft-Delete Architecture and Database Restrict Protection

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-outlet-soft-delete-and-database-restrict-protection-design.md`
- **ADR Reference:** `docs/adr/0053-outlet-soft-delete-and-database-restrict-protection.md`

---

## 1. Executive Summary & File Manifest

This plan implements enterprise-grade soft-delete architecture for partner retail outlets (`Outlet`) and hardens database-level foreign key relations (`ADR-0053`). It physically blocks cascade deletion of marketing expenditure and installation photos by converting `Placement.outlet` to `onDelete: Restrict`, replaces physical delete queries with `deletedAt: new Date()` and `active: false`, and automates query exclusion so deleted stores vanish from daily view while preserving historical financial reports with zero distortion.

### File Manifest with Estimated LOC

| Action | File Path | Estimated LOC Diff | Responsibility |
| :--- | :--- | :---: | :--- |
| **Modify** | `prisma/schema.prisma` | ~10 | Add `deletedAt` to `Outlet`, change `Placement.outlet` to `onDelete: Restrict` |
| **Modify** | `src/types/index.ts` | ~5 | Add `deletedAt?: string \| null` to `Outlet` SSOT domain type |
| **Modify** | `src/app/api/marcom/outlets/[id]/route.ts` | ~25 | Replace physical delete with soft-delete `update` |
| **Modify** | `src/app/api/marcom/outlets/route.ts` | ~20 | Replace batch `deleteMany` with `updateMany` |
| **Modify** | `src/app/api/marcom/outlets/outletsSearchFilter.ts` | ~15 | Filter `where.deletedAt = null`, enforce `active: true` when `status=APPROVED` |
| **Create** | `src/app/api/marcom/outlets/outletSoftDelete.test.ts` | ~60 | Automated tests asserting soft-delete, placement preservation, and query exclusion |
| **Modify** | `prisma/seed.ts` | ~25 | Add soft-deleted outlet fixture with linked historical placement |
| **Modify** | `docs/SESSION_STATE.md` | ~20 | Update active feature status to ADR-0053 |
| **Modify** | `CHANGELOG.md` | ~15 | Chronological changelog entry for ADR-0053 |

---

## 2. Phased Implementation Roadmap

### Phase 1: Database Schema & Foreign Key Hardening
- [ ] **Step 1.1: Update Prisma Schema (`prisma/schema.prisma`)**
  - Add `deletedAt DateTime?` to `model Outlet`.
  - Add `@@index([deletedAt])` to `model Outlet`.
  - Update `model Placement`: change `outlet Outlet @relation(..., onDelete: Restrict)`.
- [ ] **Step 1.2: Synchronize PostgreSQL Schema**
  - Execute `npx prisma db push` to push schema changes and update foreign key constraints in PostgreSQL.
- [ ] **Step 1.3: Update SSOT Domain Types (`src/types/index.ts`)**
  - Add `deletedAt?: string | null` to `Outlet` interface.
- [ ] **Verification Gate Phase 1**: Run `npm run build:check` (must pass with 0 errors).

---

### Phase 2: Backend Mutation Handlers & Query Filter Invariants
- [ ] **Step 2.1: Update Single-Delete Route (`src/app/api/marcom/outlets/[id]/route.ts`)**
  - Check existence: if outlet not found or `deletedAt !== null`, return `HTTP 404 Not Found`.
  - Perform soft-delete: `prisma.outlet.update({ where: { id }, data: { deletedAt: new Date(), active: false } })`.
- [ ] **Step 2.2: Update Batch-Delete Route (`src/app/api/marcom/outlets/route.ts`)**
  - Perform batch soft-delete: `prisma.outlet.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { deletedAt: new Date(), active: false } })`.
- [ ] **Step 2.3: Update Search Filter Helper (`src/app/api/marcom/outlets/outletsSearchFilter.ts`)**
  - In `buildOutletSearchWhere`:
    - Default `where.deletedAt = null`.
    - If `status === "APPROVED"` (operational forms), enforce `where.active = true` and `where.deletedAt = null`.
- [ ] **Step 2.4: Add Automated Integration Test Suite (`src/app/api/marcom/outlets/outletSoftDelete.test.ts`)**
  - Test 1: Single delete marks `deletedAt` and sets `active: false`.
  - Test 2: Linked `Placement` records remain physically present and unaffected.
  - Test 3: Normal search queries automatically omit soft-deleted stores.
  - Test 4: Operational form query with `status=APPROVED` omits inactive and soft-deleted stores.
- [ ] **Verification Gate Phase 2**: Run `node --test src/app/api/marcom/outlets/outletSoftDelete.test.ts`.

---

### Phase 3: Database Seed Fixtures & Non-Negotiable Gates
- [ ] **Step 3.1: Update Database Seed (`prisma/seed.ts`)**
  - In `seedOutlets()`: ensure all active seed outlets have `deletedAt: null`.
  - Add soft-deleted outlet fixture: `outlet-del-999` (`name: "Toko Almarhum (Soft-Deleted)"`, `active: false`, `deletedAt: daysAgo(30)`).
  - Attach historical placement: `plc-hist-999` (`cost: 750000`, `status: "DONE"`) to demonstrate historical cost preservation.
- [ ] **Step 3.2: Execute Re-Seed**
  - Run `npx prisma db seed`.
- [ ] **Step 3.3: Execute Non-Negotiable Verification Gates**
  - Run `npm run drift:check` (80/80 spec-plan pairs valid, 0 drift).
  - Run `npm run build:check` (0 errors).
  - Run `npm test` (100% tests pass).
  - Run `npm run test:smoke` (100% tests pass).


