# Handover: Centralize Outlet Approval to Super Admin Role

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-centralize-outlet-approval-to-super-admin-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-centralize-outlet-approval-to-super-admin.md`
- **ADR:** `docs/adr/0046-centralize-outlet-approval-to-super-admin.md`

---

## 1. Executive Summary & Objective

This handover document provides execution-ready instructions for centralizing the authority to approve (`APPROVE_OUTLET`) pending draft outlets exclusively to the Super Admin (`admin`) role.

By removing `"APPROVE_OUTLET"` from `rolePermissions.supervisor` and configuring `hasScopedPermission` in `src/lib/marcom/guards.ts` to fail closed for non-admin roles, only Super Admins can approve or reject outlets. In the UI (`OutletApprovalQueueTab.tsx`), the "ACC / Setujui" and "Tolak" buttons are hidden for supervisors and staff, replaced by an informative message indicating that Super Admin approval is required.

---

## 2. File Manifest

| File Path | Action | One-Line Purpose |
|---|---|---|
| `src/lib/marcom/guards.ts` | **Modify** | Remove `APPROVE_OUTLET` from supervisor and restrict it to Super Admin in `hasScopedPermission` |
| `src/lib/marcom/guards.test.ts` | **Modify** | Update regression unit tests to assert non-admin roles cannot approve outlets |
| `src/components/views/OutletsView/OutletApprovalQueueTab.tsx` | **Modify** | Update fallback notice to *"Hanya Super Admin yang dapat menyetujui outlet"* |
| `docs/SESSION_STATE.md` | **Modify** | Record active plan & spec readiness |

---

## 3. Explicit "Do Not Touch" List

| Target | Reason |
|---|---|
| `src/app/api/marcom/outlets/[id]/approval/route.ts` | Automatically invokes `hasScopedPermission` and blocks non-admins with 403 Forbidden |
| `src/lib/marcom/guards.ts` (`APPROVE_MOU`, `APPROVE_BORROW`) | Area Supervisors retain authority to approve partnership contracts and equipment loans in their branches |
| `src/lib/marcom/outletCodeGenerator.ts` | Official outlet code auto-generation logic for Super Admin remains intact |
| Database / Prisma Schema | Zero database schema migrations required |

---

## 4. Exact Code Modification Instructions

### 4.1 In `src/lib/marcom/guards.ts`

#### Change 1: In `rolePermissions.supervisor` (Lines 30–48)
**Current Snippet:**
```ts
  supervisor: [
    "CREATE_MOU",
    "APPROVE_MOU",
    "DELETE_MOU",
    "CREATE_PLACEMENT",
    "UPDATE_PLACEMENT",
    "CREATE_EVENT",
    "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT",
    "DELETE_DOCUMENT",
    "EXPORT_REPORTS",
    "SUBMIT_DRAFT_OUTLET",
    "APPROVE_OUTLET",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "REQUEST_BORROW",
    "APPROVE_BORROW",
    "PROCESS_RETURN",
  ],
```

**Replace With:**
```ts
  supervisor: [
    "CREATE_MOU",
    "APPROVE_MOU",
    "DELETE_MOU",
    "CREATE_PLACEMENT",
    "UPDATE_PLACEMENT",
    "CREATE_EVENT",
    "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT",
    "DELETE_DOCUMENT",
    "EXPORT_REPORTS",
    "SUBMIT_DRAFT_OUTLET",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "REQUEST_BORROW",
    "APPROVE_BORROW",
    "PROCESS_RETURN",
  ],
```

#### Change 2: In `hasScopedPermission` Gate (Lines 118–122)
**Current Snippet:**
```ts
  // MANAGE_MASTER_DATA is strictly reserved for Super Admin
  if (action === "MANAGE_MASTER_DATA") {
    return false;
  }
```

**Replace With:**
```ts
  // MANAGE_MASTER_DATA and APPROVE_OUTLET are strictly reserved for Super Admin
  if (action === "MANAGE_MASTER_DATA" || action === "APPROVE_OUTLET") {
    return false;
  }
```

#### Change 3: In `hasScopedPermission` Staff Branch Block (Lines 145–154)
**Current Snippet:**
```ts
  // APPROVE_MOU & APPROVE_OUTLET: requires targetBranchId and targetBranchId must be in userBranchIds
  // Four-Eyes Principle / Segregation of Duties: Outlets and MOUs affect business commitments.
  // Approval requires Admin role or explicitly designated Branch PICs (targetBranchId in userBranchIds).
  if (action === "APPROVE_MOU" || action === "APPROVE_OUTLET") {
    if (!targetBranchId) return false;
    if (userBranchIds.length > 0) {
      return userBranchIds.includes(targetBranchId);
    }
    return false;
  }
```

**Replace With:**
```ts
  // APPROVE_MOU: requires targetBranchId and targetBranchId must be in userBranchIds
  // Four-Eyes Principle / Segregation of Duties: MOUs affect business commitments.
  // Approval requires Admin role or explicitly designated Branch PICs (targetBranchId in userBranchIds).
  if (action === "APPROVE_MOU") {
    if (!targetBranchId) return false;
    if (userBranchIds.length > 0) {
      return userBranchIds.includes(targetBranchId);
    }
    return false;
  }
```

---

### 4.2 In `src/lib/marcom/guards.test.ts`

#### Change 1: In Outlet Approval Boundaries Test (Lines 50–70)
**Current Snippet:**
```ts
test("hasScopedPermission enforces branch boundaries for outlet approval (Four-Eyes Principle)", () => {
  // Admin can approve outlet in any branch
  assert.equal(
    hasScopedPermission({ role: "admin", action: "APPROVE_OUTLET", targetBranchId: "branch-smg" }),
    true
  );

  // PIC Branch Solo can approve Solo outlet
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_OUTLET",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    true
  );
```

**Replace With:**
```ts
test("hasScopedPermission enforces branch boundaries for outlet approval (Four-Eyes Principle)", () => {
  // Admin can approve outlet in any branch
  assert.equal(
    hasScopedPermission({ role: "admin", action: "APPROVE_OUTLET", targetBranchId: "branch-smg" }),
    true
  );

  // PIC Branch Solo CANNOT approve Solo outlet (reserved for Admin only)
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_OUTLET",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    false
  );
```

#### Change 2: In Supervisor Capability Assertions (Lines 215–226)
**Current Snippet:**
```ts
test("supervisor has admin-level operational capabilities in unscoped capability checks", () => {
  assert.equal(hasPermission("supervisor", "CREATE_MOU"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_MOU"), true);
  assert.equal(hasPermission("supervisor", "DELETE_MOU"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_OUTLET"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_BORROW"), true);
  assert.equal(hasPermission("supervisor", "DELETE_DOCUMENT"), true);
  assert.equal(hasPermission("supervisor", "EXPORT_REPORTS"), true);
  assert.equal(hasPermission("supervisor", "VIEW_INVENTORY"), true);
  // MANAGE_MASTER_DATA is forbidden for supervisor
  assert.equal(hasPermission("supervisor", "MANAGE_MASTER_DATA"), false);
});
```

**Replace With:**
```ts
test("supervisor has admin-level operational capabilities in unscoped capability checks", () => {
  assert.equal(hasPermission("supervisor", "CREATE_MOU"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_MOU"), true);
  assert.equal(hasPermission("supervisor", "DELETE_MOU"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_OUTLET"), false);
  assert.equal(hasPermission("supervisor", "APPROVE_BORROW"), true);
  assert.equal(hasPermission("supervisor", "DELETE_DOCUMENT"), true);
  assert.equal(hasPermission("supervisor", "EXPORT_REPORTS"), true);
  assert.equal(hasPermission("supervisor", "VIEW_INVENTORY"), true);
  // MANAGE_MASTER_DATA is forbidden for supervisor
  assert.equal(hasPermission("supervisor", "MANAGE_MASTER_DATA"), false);
});
```

#### Change 3: In Supervisor Branch Boundaries Assertions (Lines 250–260)
**Current Snippet:**
```ts
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_OUTLET",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    true
  );
```

**Replace With:**
```ts
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_OUTLET",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    false
  );
```

---

### 4.3 In `src/components/views/OutletsView/OutletApprovalQueueTab.tsx`

#### Change: Fallback Notice for Non-Approver (Lines 463–467)
**Current Snippet:**
```tsx
                  ) : (
                    <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      Hanya PIC Cabang / Admin yang dapat ACC
                    </div>
                  )}
```

**Replace With:**
```tsx
                  ) : (
                    <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      Hanya Super Admin yang dapat menyetujui outlet
                    </div>
                  )}
```

---

## 5. Numbered Execution Order

1. **Update Guard Core:** Modify `src/lib/marcom/guards.ts` as specified in Section 4.1.
2. **Update Unit Tests:** Modify `src/lib/marcom/guards.test.ts` as specified in Section 4.2.
3. **Run Unit Tests:** Execute `node --test src/lib/marcom/guards.test.ts` to confirm tests pass.
4. **Update UI Label:** Modify `src/components/views/OutletsView/OutletApprovalQueueTab.tsx` as specified in Section 4.3.
5. **Run Verification Gates:**
   ```bash
   npm run drift:check
   npm test
   npm run build:check
   ```
6. **Commit:**
   ```bash
   git add src/lib/marcom/guards.ts src/lib/marcom/guards.test.ts src/components/views/OutletsView/OutletApprovalQueueTab.tsx docs/SESSION_STATE.md
   git commit -m "fix(rbac): centralize outlet approval exclusively to super admin"
   ```

---

## 6. Acceptance Criteria Checklist

- [x] `hasPermission("admin", "APPROVE_OUTLET")` returns `true`.
- [x] `hasPermission("supervisor", "APPROVE_OUTLET")` returns `false`.
- [x] `hasPermission("staff", "APPROVE_OUTLET")` returns `false`.
- [x] `hasScopedPermission` for `APPROVE_OUTLET` returns `false` for any non-admin role.
- [x] In `OutletApprovalQueueTab`, the "ACC / Setujui" and "Tolak" buttons are visible only for `admin`.
- [x] In `OutletApprovalQueueTab`, non-admin users see *"Hanya Super Admin yang dapat menyetujui outlet"*.
- [x] `PATCH /api/marcom/outlets/[id]/approval` returns `403 Forbidden` for non-admin callers.
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm test` passes with 0 failures across all 152 test suites.
- [x] `npm run build:check` compiles with 0 TypeScript errors.


