# Plan: Centralize Outlet Approval to Super Admin Role

- **Status:** IMPLEMENTATION COMPLETE
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-centralize-outlet-approval-to-super-admin-design.md`
- **Refs:** `docs/adr/0046-centralize-outlet-approval-to-super-admin.md`

---

## 1. Executive Summary & Objective

Centralize the authority to approve (`APPROVE_OUTLET`) pending draft outlets exclusively to the Super Admin (`admin`) role. This eliminates the self-approval risk for Area Supervisors, establishes strict centralized master data quality, hides actionable approval buttons for unauthorized roles in the Approval Queue tab, and enforces an HTTP 403 Forbidden fail-closed response in the backend.

---

## 2. File Manifest & Estimated LOC

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| **Modify** | `src/lib/marcom/guards.ts` | ~6 LOC diff | Remove `APPROVE_OUTLET` from `rolePermissions.supervisor` and gate it in `hasScopedPermission` exclusively for `admin` |
| **Modify** | `src/lib/marcom/guards.test.ts` | ~12 LOC diff | Update regression test assertions: `supervisor` and `staff` return `false` for `APPROVE_OUTLET` |
| **Modify** | `src/components/views/OutletsView/OutletApprovalQueueTab.tsx` | ~4 LOC diff | Update non-approver fallback notice to *"Hanya Super Admin yang dapat menyetujui outlet"* |
| **Create** | `docs/handover-centralize-outlet-approval-to-super-admin.md` | ~160 LOC | Complete execution-ready handover guide with verbatim code diffs and acceptance checklist |
| **Modify** | `docs/SESSION_STATE.md` | ~20 LOC diff | Record active plan & spec readiness |

---

## 3. Phased Implementation Roadmap

### Phase 1: Guard Core & Test Contract Updates (TDD)
- [x] In `src/lib/marcom/guards.ts`:
  - Locate `rolePermissions.supervisor` and remove `"APPROVE_OUTLET"`.
  - In `hasScopedPermission`:
    - Add `APPROVE_OUTLET` alongside `MANAGE_MASTER_DATA`:
      ```ts
      if (action === "MANAGE_MASTER_DATA" || action === "APPROVE_OUTLET") {
        return false;
      }
      ```
    - In the `role === "staff"` block, remove `action === "APPROVE_OUTLET"` from the branch PIC check (leaving only `action === "APPROVE_MOU"`).
- [x] In `src/lib/marcom/guards.test.ts`:
  - Update assertion for `hasPermission("supervisor", "APPROVE_OUTLET")` to `false`.
  - Update `hasScopedPermission` tests for `supervisor` on `APPROVE_OUTLET` to assert `false`.
  - Update `hasScopedPermission` tests for `staff` on `APPROVE_OUTLET` to assert `false`.
- [x] Run targeted test: `node --test src/lib/marcom/guards.test.ts` to confirm 0 failures.

### Phase 2: UI Component Label Alignment
- [x] In `src/components/views/OutletsView/OutletApprovalQueueTab.tsx`:
  - Locate lines 463–467.
  - Update fallback notice from `"Hanya PIC Cabang / Admin yang dapat ACC"` to:
    ```tsx
    <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      Hanya Super Admin yang dapat menyetujui outlet
    </div>
    ```

### Phase 3: Non-Negotiable Verification & Handover Documentation
- [x] Run full test suite: `npm test` across all 152 test suites (0 failures required).
- [x] Run build check: `npm run build:check` (`tsc --noEmit`, 0 errors required).
- [x] Run drift check: `npm run drift:check` (verify 73/73 spec-plan pairs and invariants).
- [x] Create execution handover guide: `docs/handover-centralize-outlet-approval-to-super-admin.md`.
- [x] Update `docs/SESSION_STATE.md`.
- [x] Commit planning artifacts with standard git convention.

---

## 4. Risks, Edge Cases & Verification Strategy

| Risk / Edge Case | Impact | Mitigation Strategy |
|---|---|---|
| **Direct API PATCH Calls from Non-Admin** | Supervisor or Staff attempts to invoke `PATCH /api/marcom/outlets/[id]/approval` directly | Route checks `hasScopedPermission(..., "APPROVE_OUTLET", ...)` which fails closed, returning HTTP 403 Forbidden |
| **Legitimate MoU or Borrow Approvals** | Area Supervisors still need to approve partnership MoUs and equipment borrowing | `APPROVE_MOU` and `APPROVE_BORROW` are kept intact in `rolePermissions.supervisor` and `hasScopedPermission` |
| **Admin Nationwide Approval** | Super Admin reviewing outlets in any branch | `role === "admin"` check returns `true` unconditionally at the top of `hasScopedPermission` |


