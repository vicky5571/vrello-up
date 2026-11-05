# ADR 0045: Revoke Outlet Creation Access from Staff Role

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In Vrello Up's telecommunication marketing and distribution operations, physical retail stores and brand outlets (`Outlet`) represent critical organizational Master Data. Outlets serve as anchors for branding material placements (`Placement`), legal partnership agreements (`Mou`), and field activations (`FieldEvent`).

Previously, the role-based access control (RBAC) matrix in `src/lib/marcom/guards.ts` granted `SUBMIT_DRAFT_OUTLET` to the `staff` role alongside `supervisor` and `admin`. Furthermore, `OutletsView.tsx` computed the creation permission using an overly permissive client-side check:
```ts
const canAddOutlet = canManage || role !== "viewer";
```

This arrangement introduced several operational and data governance concerns:
1. **Uncontrolled Master Data Proliferation**: Operational field staff were able to submit draft outlet records directly, increasing administrative overhead on Area Supervisors and Super Admins who had to continuously triage incomplete, poorly verified, or duplicate outlet drafts.
2. **Defective UI Permission Guarding**: Because `OutletsView.tsx` evaluated `role !== "viewer"`, the UI bypassed the canonical permission helper `can("SUBMIT_DRAFT_OUTLET")`.
3. **Misleading Row Action Scoping**: In `OutletExpandedRow.tsx`, the "Edit Outlet" button was conditionally rendered using `canAddOutlet`, even though modifying an existing outlet record requires Super Admin privileges (`MANAGE_MASTER_DATA`).

Business management has decreed that general operational staff (`staff`) should focus exclusively on tactical work items (events, material placements, inventory borrowing) and must **not** have authority to add or draft new physical outlet records into the network.

---

## 2. Decision Drivers

1. **Principle of Least Privilege (PoLP)**: Staf role permissions must be strictly scoped to operational tasks; master data creation must be restricted to management (`supervisor` and `admin`).
2. **Defense-in-Depth (UI + API Enforcement)**: The restriction must not be a superficial cosmetic change; backend endpoints (`POST /api/marcom/outlets/draft` and `POST /api/marcom/uploads`) must enforce HTTP 403 Forbidden on staff attempts.
3. **Single Source of Truth (SSOT)**: UI views must check canonical permission functions (`can("SUBMIT_DRAFT_OUTLET")`) rather than hardcoding role comparisons (`role !== "viewer"`).
4. **Zero Regressions on Legitimate Workflows**: Area Supervisors must retain the ability to submit draft outlets within their assigned branches, and Super Admins must retain direct master data creation authority.

---

## 3. Options Considered

### Option 1: Complete Revocation of `SUBMIT_DRAFT_OUTLET` from Staff (Chosen)
- Remove `SUBMIT_DRAFT_OUTLET` from `rolePermissions.staff` in `src/lib/marcom/guards.ts`.
- Refactor `OutletsView.tsx` to compute:
  ```ts
  const canAddOutlet = canManage || can("SUBMIT_DRAFT_OUTLET");
  ```
- Refactor `OutletExpandedRow.tsx` to accept and check `canManage` instead of `canAddOutlet` for the "Edit Outlet" action.
- Update `src/lib/marcom/guards.test.ts` to assert that `hasPermission("staff", "SUBMIT_DRAFT_OUTLET") === false`.
- **Pros**:
  - Eliminates the security gap at the core SSOT permission layer.
  - Automatically protects backend API (`POST /api/marcom/outlets/draft` and `POST /api/marcom/uploads` for outlet photos).
  - Eliminates misleading "Edit Outlet" button for non-admin users.
- **Cons**: Field staff cannot initiate store registrations directly; store additions must be routed through their Area Supervisor.

### Option 2: UI-Only Soft Restriction
- Hide the "+ Tambah Outlet" button in `OutletsView.tsx` when `role === "staff"`, leaving `guards.ts` unchanged.
- **Pros**: Trivial change requiring only one line edit in the UI component.
- **Cons**: Critical security anti-pattern. The backend API route remains fully exposed; any tech-savvy staff member could submit drafts using the browser developer console or cURL.

### Option 3: Conditional Branch PIC Staff Exemption
- Allow staff to add draft outlets only if they are designated as a Branch PIC (`assignedBranchIds.length > 0`).
- **Pros**: Provides localized delegation if certain senior staff act as branch managers.
- **Cons**: Unnecessary architectural complexity. Violates the user's explicit directive to eliminate staff addition access entirely.

---

## 4. Decision & Architectural Changes

We decide to implement **Option 1**:

1. **Permission Core (`src/lib/marcom/guards.ts`)**:
   - Delete `"SUBMIT_DRAFT_OUTLET"` from `rolePermissions.staff`.
   - Result:
     - `admin`: retains `MANAGE_MASTER_DATA` & `SUBMIT_DRAFT_OUTLET`.
     - `supervisor`: retains `SUBMIT_DRAFT_OUTLET` (scoped to assigned branches).
     - `staff`: strictly prohibited from submitting draft outlets.
     - `viewer`: strictly read-only.

2. **Frontend Coordinator Alignment (`src/components/views/OutletsView/OutletsView.tsx`)**:
   - Replace `const canAddOutlet = canManage || role !== "viewer";` with:
     ```ts
     const canAddOutlet = canManage || can("SUBMIT_DRAFT_OUTLET");
     ```
   - Update `OutletExpandedRow` prop passing to supply `canManage={canManage}` instead of `canAddOutlet={canAddOutlet}`.

3. **Row Action Alignment (`src/components/views/OutletsView/OutletExpandedRow.tsx`)**:
   - Replace prop `canAddOutlet: boolean` with `canManage: boolean`.
   - Gate the "Edit Outlet" button behind `canManage`, aligning with `OutletMapView` and `Outlet360Drawer`.

4. **Automated Test Contract (`src/lib/marcom/guards.test.ts`)**:
   - Update assertion:
     ```ts
     assert.equal(hasPermission("staff", "SUBMIT_DRAFT_OUTLET"), false);
     ```

---

## 5. Consequences & Blast Radius

### Positive Consequences
- **Strict Data Integrity**: Ensures that only qualified management personnel (`supervisor`, `admin`) can register physical outlets into the network.
- **Architectural Purity**: Resolves the hardcoded `role !== "viewer"` check in favor of the canonical `can(...)` permission hook.
- **Alignment on Edit Action**: Fixes the UI anomaly where staff members saw an "Edit Outlet" button that resulted in HTTP 403 when clicked.

### Accepted Trade-offs
- If a field sales rep discovers an unmapped outlet, they must report it to their Area Supervisor or Branch PIC to register it in the system.



