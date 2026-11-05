# ADR 0046: Centralize Outlet Approval to Super Admin Role

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In Vrello Up's organizational architecture, physical retail stores and partner outlets (`Outlet`) represent foundational Master Data. They serve as legal and operational anchors for branding material placements (`Placement`), partnership contracts (`Mou`), and field activations (`FieldEvent`).

When a new store is registered via the draft submission form (`SubmitDraftOutletModal`), it enters an initial status of `PENDING_APPROVAL` in the Approval Queue (`OutletApprovalQueueTab`).

Under previous role-based access control (RBAC) rules:
1. `APPROVE_OUTLET` was included in `rolePermissions.supervisor` as well as designated to staff with branch penugasan (`hasScopedPermission`).
2. An Area Supervisor managing a branch was capable of approving store drafts within that branch.
3. This created a governance risk: because no anti-self-approval validation existed, a supervisor who submitted a draft outlet could immediately approve their own submission into active master data.
4. Business leadership decided that master data integrity requires centralized executive oversight.

To maintain strict network data quality, eliminate self-approval loopholes, and establish a single point of accountability for new physical assets, organization management has directed that **only the Super Admin (`admin`) role shall hold authority to approve or reject pending draft outlets**.

---

## 2. Decision Drivers

1. **Centralized Master Data Governance**: New store additions impact company commitments, inventory allocation, and legal agreements. Final approval must be restricted to Super Admin.
2. **Elimination of Self-Approval Risk**: Prevents operational managers from approving their own store additions without independent oversight.
3. **Fail-Closed RBAC**: The permission check must be enforced at the core guard level (`guards.ts`), guaranteeing that non-admin requests to `PATCH /api/marcom/outlets/[id]/approval` are rejected with HTTP 403 Forbidden.
4. **Transparent User Interface**: The Approval Queue tab must cleanly indicate to supervisors and staff that approval is reserved for Super Admin, hiding actionable approval buttons for unauthorized roles.

---

## 3. Options Considered

### Option 1: Complete Centralization of `APPROVE_OUTLET` to Super Admin (Chosen)
- Remove `APPROVE_OUTLET` from `rolePermissions.supervisor`.
- In `src/lib/marcom/guards.ts` `hasScopedPermission`:
  ```ts
  if (action === "MANAGE_MASTER_DATA" || action === "APPROVE_OUTLET") {
    return false;
  }
  ```
  *(Note: Since `role === "admin"` returns `true` earlier in `hasScopedPermission`, any non-admin attempting `APPROVE_OUTLET` fails closed immediately).*
- Remove the legacy `staff` fallback for `APPROVE_OUTLET`.
- In `OutletApprovalQueueTab.tsx`, update notice text to *"Hanya Super Admin yang dapat menyetujui outlet"*.
- Update unit tests in `src/lib/marcom/guards.test.ts`.
- **Pros**:
  - Airtight authorization: Super Admin alone can approve new stores.
  - Zero risk of self-approval or rogue master data insertion.
  - Clean, centralized code logic in `guards.ts`.
- **Cons**: Slightly higher approval backlog on Super Admin during intense expansion campaigns.

### Option 2: UI-Only Soft Restriction
- Hide the "ACC / Setujui" and "Tolak" buttons in `OutletApprovalQueueTab.tsx` when `role !== "admin"`, but leave `guards.ts` unchanged.
- **Pros**: Minimal code touched.
- **Cons**: Severe security flaw. A supervisor with web dev tools could still send a `PATCH` request to `/api/marcom/outlets/[id]/approval` and successfully approve the store.

### Option 3: Two-Tier Anti-Self-Approval
- Allow supervisors to approve outlets in their branch, but forbid approving records where `outlet.submittedBy === session.user.email`.
- **Pros**: Retains distributed approval across supervisors.
- **Cons**: Does not satisfy the user's explicit mandate (*"just admin can approve new outlets"*). Introduces fragile string/email matching.

---

## 4. Decision & Architectural Changes

We decide to implement **Option 1**:

1. **Permission Core (`src/lib/marcom/guards.ts`)**:
   - Remove `"APPROVE_OUTLET"` from `rolePermissions.supervisor`.
   - In `hasScopedPermission`:
     ```ts
     // MANAGE_MASTER_DATA and APPROVE_OUTLET are strictly reserved for Super Admin
     if (action === "MANAGE_MASTER_DATA" || action === "APPROVE_OUTLET") {
       return false;
     }
     ```
   - In `role === "staff"` branch: remove `action === "APPROVE_OUTLET"` check so staff cannot approve outlets under any circumstances.

2. **Frontend UI Alignment (`src/components/views/OutletsView/OutletApprovalQueueTab.tsx`)**:
   - Retain `can("APPROVE_OUTLET", outlet.branchId)` check. Because non-admins will evaluate to `false`, the "ACC / Setujui" and "Tolak" buttons are hidden for supervisors and staff.
   - Update fallback notice text from `"Hanya PIC Cabang / Admin yang dapat ACC"` to:
     ```tsx
     <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
       Hanya Super Admin yang dapat menyetujui outlet
     </div>
     ```

3. **Backend Route Protection (`src/app/api/marcom/outlets/[id]/approval/route.ts`)**:
   - The route handler invokes `hasScopedPermission({ role, action: "APPROVE_OUTLET", ... })`.
   - Because `hasScopedPermission` fails closed for non-admins, all unauthorized attempts to approve or reject stores will return `403 Forbidden` (`error: "Forbidden: You do not have permission to approve outlets for this branch"`).

4. **Automated Test Updates (`src/lib/marcom/guards.test.ts`)**:
   - Update test suites asserting that `supervisor` and `staff` cannot approve outlets:
     ```ts
     assert.equal(hasPermission("supervisor", "APPROVE_OUTLET"), false);
     assert.equal(hasScopedPermission({ role: "supervisor", action: "APPROVE_OUTLET", ... }), false);
     assert.equal(hasScopedPermission({ role: "staff", action: "APPROVE_OUTLET", ... }), false);
     ```

---

## 5. Consequences & Blast Radius

### Positive Consequences
- **Uncompromised Data Quality**: Eliminates self-approval and decentralized inconsistencies in store master data.
- **Fail-Closed Security**: Hard boundary at both client and server layers.
- **Zero Schema Changes**: Fully compatible with existing Prisma schema and database tables.

### Accepted Trade-offs
- Super Admin becomes the sole approver for store submissions across all operational branches.



