# Plan: Revoke Outlet Creation Access from Staff Role

- **Status:** IMPLEMENTATION COMPLETE
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-revoke-outlet-creation-access-from-staff-design.md`
- **Refs:** `docs/adr/0045-revoke-outlet-creation-access-from-staff.md`

---

## 1. Executive Summary & Objective

Revoke outlet draft creation and submission access from the `staff` role in Vrello Up. This enforces the Principle of Least Privilege across Master Data, hiding the "+ Tambah Outlet" button in the UI for staff and configuring backend API routes (`POST /api/marcom/outlets/draft` and `POST /api/marcom/uploads`) to reject staff requests with HTTP 403 Forbidden.

---

## 2. File Manifest & Estimated LOC

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| **Modify** | `src/lib/marcom/guards.ts` | ~2 LOC diff | Remove `SUBMIT_DRAFT_OUTLET` from `rolePermissions.staff` |
| **Modify** | `src/lib/marcom/guards.test.ts` | ~3 LOC diff | Update regression test assertion: `hasPermission("staff", "SUBMIT_DRAFT_OUTLET") === false` |
| **Modify** | `src/components/views/OutletsView/OutletsView.tsx` | ~5 LOC diff | Use `can("SUBMIT_DRAFT_OUTLET")` and pass `canManage` to `OutletExpandedRow` |
| **Modify** | `src/components/views/OutletsView/OutletExpandedRow.tsx` | ~6 LOC diff | Accept `canManage` instead of `canAddOutlet` for "Edit Outlet" button |
| **Create** | `docs/handover-revoke-outlet-creation-access-from-staff.md` | ~160 LOC | Complete execution-ready handover guide with exact code diffs and acceptance checklist |
| **Modify** | `docs/SESSION_STATE.md` | ~20 LOC diff | Record active plan & spec readiness |

---

## 3. Phased Implementation Roadmap

### Phase 1: Guard Core & Test Contract Update (TDD)
- [x] In `src/lib/marcom/guards.ts`:
  - Locate `rolePermissions.staff`.
  - Remove `"SUBMIT_DRAFT_OUTLET"` from the array.
- [x] In `src/lib/marcom/guards.test.ts`:
  - Update assertion from:
    ```ts
    assert.equal(hasPermission("staff", "SUBMIT_DRAFT_OUTLET"), true);
    ```
    to:
    ```ts
    assert.equal(hasPermission("staff", "SUBMIT_DRAFT_OUTLET"), false);
    ```
- [x] Run targeted test: `node --test src/lib/marcom/guards.test.ts` to confirm 0 failures.

### Phase 2: UI Coordinator & Component Hardening
- [x] In `src/components/views/OutletsView/OutletsView.tsx`:
  - Refactor line 90:
    ```ts
    const canAddOutlet = canManage || can("SUBMIT_DRAFT_OUTLET");
    ```
  - In `renderExpanded={(outlet) => ...}`:
    - Pass `canManage={canManage}` to `<OutletExpandedRow />` instead of `canAddOutlet={canAddOutlet}`.
- [x] In `src/components/views/OutletsView/OutletExpandedRow.tsx`:
  - In `OutletExpandedRowProps`: replace `canAddOutlet: boolean;` with `canManage: boolean;`.
  - In component signature: destructure `canManage`.
  - At line 123: replace `{canAddOutlet && (` with `{canManage && (`.

### Phase 3: Non-Negotiable Verification & Handover Documentation
- [x] Execute `npm test` across all 152 test suites (0 failures required).
- [x] Execute `npm run build:check` (`tsc --noEmit`, 0 errors required).
- [x] Execute `npm run drift:check` (verify 72/72 spec-plan pairs and single-tenant invariants).
- [x] Create execution handover guide: `docs/handover-revoke-outlet-creation-access-from-staff.md`.
- [x] Update `docs/SESSION_STATE.md` with active feature and completed planning artifacts.
- [x] Commit planning artifacts with standard git convention.

---

## 4. Risks, Edge Cases & Verification Strategy

| Risk / Edge Case | Impact | Mitigation Strategy |
|---|---|---|
| **Direct API Calls from Staff Session** | Tech-savvy user attempts to bypass UI via `fetch('/api/marcom/outlets/draft')` | Backend route checks `hasPermission(role, "SUBMIT_DRAFT_OUTLET")` and returns HTTP 403 Forbidden |
| **Photo Upload Abuse** | Staff attempts to upload images to `outlets` bucket | `POST /api/marcom/uploads` requires `SUBMIT_DRAFT_OUTLET` for `kind: "outlets"`, also returning HTTP 403 |
| **Supervisor Draft Capability** | Area Supervisor needs to submit store drafts for their assigned area | `supervisor` role retains `"SUBMIT_DRAFT_OUTLET"` with branch scoping |
| **Admin Direct Master Data** | Super Admin adding master data stores directly | `admin` retains `MANAGE_MASTER_DATA`, opening direct `OutletFormModal` |


