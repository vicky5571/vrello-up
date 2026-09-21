# Alur Pengajuan Toko Baru (Draft Outlet & Approval Atasan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun alur pengajuan toko baru oleh sales lapangan (*Draft Outlet*) dan antarmuka persetujuan (*ACC / Approval*) oleh PIC Bisnis / Admin Regional untuk melindungi integritas 25.000 master database outlet Jateng.

**Architecture:** Memperluas skema `Outlet` dengan status siklus hidup (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`), state machine transisi murni (`outletApprovalMachine.ts`), penegakan hak akses Four-Eyes Principle (`guards.ts`), endpoint API terisolasi (`/api/marcom/outlets/draft` & `/api/marcom/outlets/[id]/approval`), serta antarmuka tab antrean review di `OutletsView` dan tombol pintasan di `OutletSearchCombobox`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Prisma (PostgreSQL), Zustand 5, Node Native Test Runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-21-draft-outlet-approval-flow-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-21-draft-outlet-approval-flow-design.md)

---

## Global Constraints

- **Strangler Pattern on God Files**: Jangan menumpuk logika approval dan state di dalam file monolitik. Ekstrak helper ke `src/lib/marcom/` dan komponen UI ke direktori modular `src/components/views/OutletsView/`.
- **Single Source of Truth**: Semua tipe domain harus berasal dari `@/types` ([`src/types/index.ts`](file:///Users/mac/Web%20Development/vrello-up/src/types/index.ts)).
- **Dual-Persistence Discipline**: Update Zustand cache segera (`invalidateOutlets`) saat ada perubahan data toko.
- **Node Test Runner Path Specifier**: Selalu gunakan path alias `@/...` pada import modul pengujian agar kompatibel dengan hook `test/register-alias.mjs`.
- **Zero Regression**: Seluruh 371 pengujian yang sudah ada harus tetap lulus 100%.

---

## File Structure

```text
src/
├── types/
│   └── index.ts                                # Extended OutletItem & OutletStatus types
├── lib/marcom/
│   ├── outletApprovalMachine.ts                # Pure state machine for outlet lifecycle transitions
│   ├── outletApprovalMachine.test.ts           # Unit tests for state machine
│   ├── outletCodeGenerator.ts                  # Helper to format draft codes and suggest official codes
│   ├── outletCodeGenerator.test.ts             # Unit tests for code generator
│   ├── guards.ts                               # Add SUBMIT_DRAFT_OUTLET & APPROVE_OUTLET
│   └── guards.test.ts                          # Unit tests for new permission actions
├── app/api/marcom/outlets/
│   ├── outletsSearchFilter.ts                  # Extend where-clause builder with status filtering
│   ├── route.ts                                # GET/POST outlets with status awareness
│   ├── draft/
│   │   ├── route.ts                            # POST /api/marcom/outlets/draft
│   │   ├── draftOutletHelpers.ts               # Pure validation and payload preparation
│   │   └── draftOutletHelpers.test.ts          # Unit tests for draft submission validation
│   └── [id]/approval/
│       ├── route.ts                            # PATCH /api/marcom/outlets/[id]/approval (ACC / Reject)
│       ├── approvalHelpers.ts                  # Pure state transition & payload logic
│       └── approvalHelpers.test.ts             # Unit tests for approval/reject transitions
└── components/views/
    ├── OutletsView/
    │   ├── SubmitDraftOutletModal.tsx          # Mobile-friendly form to submit new draft outlet
    │   ├── SubmitDraftOutletModal.test.ts      # Unit tests for draft modal helpers
    │   ├── OutletApprovalQueueTab.tsx          # Tab for Admin/Manager to review, ACC, and reject
    │   ├── OutletApprovalQueueTab.test.ts      # Unit tests for approval tab helpers
    │   └── OutletsView.tsx                     # Add tab switcher [ Master Outlet ] [ Antrean Approval ]
    └── PlacementsView/
        └── OutletSearchCombobox.tsx            # Add "Ajukan Toko Baru" trigger when outlet not found
```

---

## Implementation Tasks

### Task 1: Domain Types & Schema Extension

- [ ] **Step 1: Extend Domain Types in `src/types/index.ts`**
  - Add `export type OutletStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";`
  - Extend `OutletItem` interface with `status?: OutletStatus; photoUrl?: string; submittedBy?: string; rejectionReason?: string; approvedBy?: string; approvedAt?: string | null;`
- [ ] **Step 2: Extend Prisma Schema in `prisma/schema.prisma`**
  - Add `enum OutletStatus { DRAFT PENDING_APPROVAL APPROVED REJECTED }`
  - In `model Outlet`, add `status OutletStatus @default(APPROVED)`, `photoUrl String @default("")`, `submittedBy String @default("")`, `rejectionReason String @default("")`, `approvedBy String @default("")`, `approvedAt DateTime?`
  - Add index `@@index([status])`
- [ ] **Step 3: Run `npx prisma generate` & Type Check**
  - Run `npx prisma generate`
  - Verify with `npx tsc --noEmit`
- [ ] **Step 4: Commit Domain Types and Schema**
  - Git commit: `feat(domain): add outlet approval status and submission metadata`

---

### Task 2: Pure State Machine & Permission Guards

- [ ] **Step 1: Write failing tests for `outletApprovalMachine.test.ts`**
  - Test valid transitions (`DRAFT -> PENDING_APPROVAL`, `PENDING_APPROVAL -> APPROVED`, `PENDING_APPROVAL -> REJECTED`, `REJECTED -> DRAFT`).
  - Test invalid transitions (`APPROVED -> DRAFT`, `DRAFT -> APPROVED`, `REJECTED -> APPROVED` directly).
- [ ] **Step 2: Implement `src/lib/marcom/outletApprovalMachine.ts`**
  - Implement `canTransitionOutletStatus(from: OutletStatus, to: OutletStatus): boolean` and constants `OUTLET_STATUSES`.
- [ ] **Step 3: Run `npm test -- src/lib/marcom/outletApprovalMachine.test.ts`**
  - Verify all tests pass.
- [ ] **Step 4: Update Permission Guards in `src/lib/marcom/guards.ts`**
  - Add `SUBMIT_DRAFT_OUTLET` and `APPROVE_OUTLET` to `PermissionAction`.
  - Add `SUBMIT_DRAFT_OUTLET` to `rolePermissions.staff` and `rolePermissions.admin`.
  - Add `APPROVE_OUTLET` to `rolePermissions.admin`.
  - In `hasScopedPermission`: allow `APPROVE_OUTLET` for `admin`, and for `staff` only if `userBranchIds.includes(targetBranchId)` (Four-Eyes Principle).
- [ ] **Step 5: Write unit tests in `src/lib/marcom/guards.test.ts`**
  - Test staff can submit draft.
  - Test staff without branch assignment cannot approve.
  - Test staff with branch assignment can approve within their branch.
  - Test admin can approve any branch.
- [ ] **Step 6: Commit State Machine & Guards**
  - Git commit: `feat(marcom): implement outlet approval state machine and permission guards`

---

### Task 3: Code Generator & Search Filter Status Support

- [ ] **Step 1: Write failing tests in `src/lib/marcom/outletCodeGenerator.test.ts`**
  - Test generating draft code: `generateDraftOutletCode(branchCode, timestamp)`.
  - Test formatting suggested official code: `suggestOfficialOutletCode(branchCode, sequence)`.
- [ ] **Step 2: Implement `src/lib/marcom/outletCodeGenerator.ts`**
  - Implement pure code generation helpers.
- [ ] **Step 3: Run `npm test -- src/lib/marcom/outletCodeGenerator.test.ts`**
  - Verify all tests pass.
- [ ] **Step 4: Update `outletsSearchFilter.ts`**
  - Add `status?: OutletStatus | "ALL" | null` to `OutletSearchFilterOptions`.
  - Support filtering by status (default to omitting status filter or filtering by specified status).
  - Update `outletsSearch.test.ts` to verify status filtering.
- [ ] **Step 5: Commit Code Generator & Search Filter**
  - Git commit: `feat(marcom): add outlet code generator and status-aware search filtering`

---

### Task 4: Backend API Endpoints (Draft Submission & ACC/Reject)

- [ ] **Step 1: Implement Draft Submission Helpers & Tests**
  - File: `src/app/api/marcom/outlets/draft/draftOutletHelpers.ts`
  - File: `src/app/api/marcom/outlets/draft/draftOutletHelpers.test.ts`
  - Validates required fields: `name`, `type`, `branchId`, `latitude`, `longitude`, `photoUrl`.
  - Prepares draft payload with `status: "PENDING_APPROVAL"`, `active: false`.
- [ ] **Step 2: Implement `POST /api/marcom/outlets/draft`**
  - File: `src/app/api/marcom/outlets/draft/route.ts`
  - Validates session with `requireMember`.
  - Enforces `SUBMIT_DRAFT_OUTLET` permission.
  - Generates unique draft code if not supplied.
  - Creates outlet with `status: "PENDING_APPROVAL"` and `active: false`.
- [ ] **Step 3: Implement Approval Helpers & Tests**
  - File: `src/app/api/marcom/outlets/[id]/approval/approvalHelpers.ts`
  - File: `src/app/api/marcom/outlets/[id]/approval/approvalHelpers.test.ts`
  - Tests ACC action: transitions to `APPROVED`, sets `active: true`, sets `approvedAt` and `approvedBy`.
  - Tests Reject action: transitions to `REJECTED`, sets `active: false`, requires non-empty `rejectionReason`.
- [ ] **Step 4: Implement `PATCH /api/marcom/outlets/[id]/approval`**
  - File: `src/app/api/marcom/outlets/[id]/approval/route.ts`
  - Validates session and checks `APPROVE_OUTLET` permission with target outlet's `branchId`.
  - Enforces state transition via `canTransitionOutletStatus`.
  - Updates outlet record in database.
- [ ] **Step 5: Verify API Tests**
  - Run `npm test -- src/app/api/marcom/outlets/draft/draftOutletHelpers.test.ts`
  - Run `npm test -- src/app/api/marcom/outlets/[id]/approval/approvalHelpers.test.ts`
- [ ] **Step 6: Commit Backend API Endpoints**
  - Git commit: `feat(api): add draft outlet submission and approval endpoints`

---

### Task 5: Mobile-Friendly Submission Modal (`SubmitDraftOutletModal`) & Combobox Shortcut

- [ ] **Step 1: Write failing tests for draft modal helpers**
  - File: `src/components/views/OutletsView/SubmitDraftOutletModal.test.ts`
  - Test coordinate validation, photo URL check, and payload formatting.
- [ ] **Step 2: Implement `SubmitDraftOutletModal.tsx`**
  - File: `src/components/views/OutletsView/SubmitDraftOutletModal.tsx`
  - Fields: Nama Outlet, Jenis Outlet (`TRADITIONAL`, `MODERN_RETAIL`, `EXCLUSIVE`), Cabang (`branchId`), Alamat, Kota, PIC Name, PIC Phone.
  - GPS autofill button: `Ambil Koordinat Saat Ini` (`navigator.geolocation`).
  - Storefront photo URL input / capture preview.
  - Clear confirmation toast and SWR store invalidation (`invalidateOutlets`).
- [ ] **Step 3: Integrate Shortcut in `OutletSearchCombobox.tsx`**
  - In `OutletSearchCombobox.tsx`, when search yields 0 results or at the bottom of search results, display clickable banner:
    `+ Toko belum terdaftar? Ajukan Toko Baru`
  - Clicking opens `SubmitDraftOutletModal` with current search term pre-filled as outlet name.
- [ ] **Step 4: Run Tests & Typecheck**
  - Run `npm test -- src/components/views/OutletsView/SubmitDraftOutletModal.test.ts`
  - Run `npx tsc --noEmit`
- [ ] **Step 5: Commit Submission Modal & Combobox Shortcut**
  - Git commit: `feat(ui): add SubmitDraftOutletModal and combobox shortcut for field sales`

---

### Task 6: Management Approval Queue Tab in `OutletsView`

- [ ] **Step 1: Write failing tests for approval queue helpers**
  - File: `src/components/views/OutletsView/OutletApprovalQueueTab.test.ts`
  - Test filtering pending outlets, duplicate name checking helper, and approval action validation.
- [ ] **Step 2: Implement `OutletApprovalQueueTab.tsx`**
  - File: `src/components/views/OutletsView/OutletApprovalQueueTab.tsx`
  - Visual card/table of pending outlets:
    - Thumbnail foto toko fasad dengan opsi modal pembesar.
    - Informasi outlet: nama, jenis, cabang, kota, diajukan oleh sales siapa (`submittedBy`).
    - Koordinat GPS dengan link OpenStreetMap / Google Maps.
    - Indikator peringatan jika terdapat potensi duplikasi nama toko di cabang yang sama.
    - Tombol **"ACC / Setujui"**: membuka konfirmasi penetapan kode resmi (default disarankan `O-SMG-xxx`).
    - Tombol **"Tolak"**: membuka modal input alasan penolakan.
- [ ] **Step 3: Update `OutletsView.tsx` with Tab Switcher**
  - Add tab switcher: `[ 🏢 Master Outlet ]` | `[ ⏳ Antrean Approval (N) ]` with live count badge.
  - Permission-aware: Only show approval actions to users with `APPROVE_OUTLET` permission.
  - Wire actions to refresh outlets list and trigger toasts.
- [ ] **Step 4: Run Full Regression Suite**
  - Run `npx tsc --noEmit`
  - Run `npm test`
- [ ] **Step 5: Commit Management Approval Tab & Integration**
  - Git commit: `feat(ui): integrate outlet approval queue tab in outlets view`

---

## Verification Plan

### Automated Tests
- State Machine: `npm test -- src/lib/marcom/outletApprovalMachine.test.ts`
- Permission Guards: `npm test -- src/lib/marcom/guards.test.ts`
- Code Generator: `npm test -- src/lib/marcom/outletCodeGenerator.test.ts`
- Draft Submission API Helper: `npm test -- src/app/api/marcom/outlets/draft/draftOutletHelpers.test.ts`
- Approval API Helper: `npm test -- src/app/api/marcom/outlets/[id]/approval/approvalHelpers.test.ts`
- UI Helpers:
  - `npm test -- src/components/views/OutletsView/SubmitDraftOutletModal.test.ts`
  - `npm test -- src/components/views/OutletsView/OutletApprovalQueueTab.test.ts`
- Full regression check: `npm test` (0 failures across all suites).
- TypeScript strict compilation: `npx tsc --noEmit` (0 errors).

### Manual Verification Flow
1. **Sales Field Simulation**:
   - Open `PlacementsView`, trigger `OutletSearchCombobox`.
   - Search for non-existent outlet "Kios Pulsa Sejahtera".
   - Click `+ Toko belum terdaftar? Ajukan Toko Baru`.
   - Fill form with store photo URL and GPS coordinates, submit draft.
   - Verify toast displays pending approval status and combobox updates.
2. **Manager Approval Simulation**:
   - Navigate to `OutletsView`, click tab `[ ⏳ Antrean Approval ]`.
   - Verify "Kios Pulsa Sejahtera" appears in pending queue with photo, branch, and GPS details.
   - Click `ACC / Setujui`, confirm assigned code `O-SMG-0843`.
   - Switch back to `Master Outlet` tab; verify the new store is now active (`active: true`, status `APPROVED`).
   - Re-open `PlacementsView`; verify "Kios Pulsa Sejahtera" is immediately searchable.
