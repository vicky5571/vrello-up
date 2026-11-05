# Spec: Centralize Outlet Approval to Super Admin Role

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0046-centralize-outlet-approval-to-super-admin.md` (ADR-0046)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary & Goals

This specification formalizes the architectural restriction of the `APPROVE_OUTLET` permission action to the Super Admin (`admin`) role exclusively.

### Core Objectives:
1. **Centralized Master Data Authority:** Ensure that all physical retail stores entering master data via the approval queue are vetted, coded, and activated solely by Super Admin.
2. **Elimination of Self-Approval Risk:** Area Supervisors who submit draft outlets cannot approve their own submissions into active master data.
3. **Fail-Closed Permission Core:** Update `src/lib/marcom/guards.ts` so that `APPROVE_OUTLET` immediately returns `false` for any non-admin role (`supervisor`, `staff`, `viewer`), regardless of branch assignment.
4. **Defensive UI Alignment:** In `OutletApprovalQueueTab.tsx`, show actionable "ACC / Setujui" and "Tolak" buttons only for `admin`. All other roles see an informative badge: *"Hanya Super Admin yang dapat menyetujui outlet"*.
5. **Backend Route Hardening:** Ensure `PATCH /api/marcom/outlets/[id]/approval` rejects any non-admin request with HTTP 403 Forbidden.

---

## 2. Updated Role & Capability Matrix

| Permission Action | `admin` | `supervisor` | `staff` | `viewer` |
|---|---|---|---|---|
| **`MANAGE_MASTER_DATA`** | ✅ Yes (Global) | ❌ No | ❌ No | ❌ No |
| **`APPROVE_OUTLET`** | ✅ **Yes (Global Exclusive)** | ❌ **No (Revoked)** | ❌ No | ❌ No |
| **`SUBMIT_DRAFT_OUTLET`** | ✅ Yes | ✅ Yes (Assigned Branches) | ❌ No (Revoked in ADR-0045) | ❌ No |
| **`APPROVE_MOU`** | ✅ Yes (Global) | ✅ Yes (Assigned Branches) | ❌ No | ❌ No |
| **`APPROVE_BORROW`** | ✅ Yes (Global) | ✅ Yes (Assigned Branches) | ❌ No | ❌ No |
| **UI: "ACC / Setujui" Button** | **Visible** | **Hidden** | **Hidden** | **Hidden** |
| **UI: "Tolak" Button** | **Visible** | **Hidden** | **Hidden** | **Hidden** |
| **UI: Non-Approver Notice** | Hidden | *"Hanya Super Admin..."* | *"Hanya Super Admin..."* | *"Hanya Super Admin..."* |

---

## 3. Code Modifications & Implementation Details

### 3.1 Permission Core (`src/lib/marcom/guards.ts`)

#### 1. In `rolePermissions`:
Remove `"APPROVE_OUTLET"` from `supervisor`:
```ts
// BEFORE:
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

// AFTER:
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

#### 2. In `hasScopedPermission`:
Add `APPROVE_OUTLET` to the strict Super Admin fail-closed gate:
```ts
// BEFORE:
  // MANAGE_MASTER_DATA is strictly reserved for Super Admin
  if (action === "MANAGE_MASTER_DATA") {
    return false;
  }

// AFTER:
  // MANAGE_MASTER_DATA and APPROVE_OUTLET are strictly reserved for Super Admin
  if (action === "MANAGE_MASTER_DATA" || action === "APPROVE_OUTLET") {
    return false;
  }
```

#### 3. In `hasScopedPermission` (Staff Branch):
Clean up obsolete `APPROVE_OUTLET` check:
```ts
// BEFORE:
  // APPROVE_MOU & APPROVE_OUTLET: requires targetBranchId and targetBranchId must be in userBranchIds
  if (action === "APPROVE_MOU" || action === "APPROVE_OUTLET") {
    if (!targetBranchId) return false;
    if (userBranchIds.length > 0) {
      return userBranchIds.includes(targetBranchId);
    }
    return false;
  }

// AFTER:
  // APPROVE_MOU: requires targetBranchId and targetBranchId must be in userBranchIds
  if (action === "APPROVE_MOU") {
    if (!targetBranchId) return false;
    if (userBranchIds.length > 0) {
      return userBranchIds.includes(targetBranchId);
    }
    return false;
  }
```

---

### 3.2 UI Component Alignment (`src/components/views/OutletsView/OutletApprovalQueueTab.tsx`)

In lines 463–467:
```tsx
// BEFORE:
  ) : (
    <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      Hanya PIC Cabang / Admin yang dapat ACC
    </div>
  )}

// AFTER:
  ) : (
    <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      Hanya Super Admin yang dapat menyetujui outlet
    </div>
  )}
```

---

## 4. Automated Test Contracts & Regression Guards

In `src/lib/marcom/guards.test.ts`:
1. `hasPermission("admin", "APPROVE_OUTLET") === true`.
2. `hasPermission("supervisor", "APPROVE_OUTLET") === false`.
3. `hasPermission("staff", "APPROVE_OUTLET") === false`.
4. `hasPermission("viewer", "APPROVE_OUTLET") === false`.
5. `hasScopedPermission({ role: "admin", action: "APPROVE_OUTLET", targetBranchId: "any" }) === true`.
6. `hasScopedPermission({ role: "supervisor", action: "APPROVE_OUTLET", userBranchIds: ["branch-smg"], targetBranchId: "branch-smg" }) === false`.
7. `hasScopedPermission({ role: "staff", action: "APPROVE_OUTLET", userBranchIds: ["branch-smg"], targetBranchId: "branch-smg" }) === false`.

---

## 5. Acceptance Criteria Checklist

- [ ] `hasPermission("supervisor", "APPROVE_OUTLET")` returns `false`.
- [ ] `hasPermission("admin", "APPROVE_OUTLET")` returns `true`.
- [ ] `hasScopedPermission` for `APPROVE_OUTLET` returns `false` for any non-admin regardless of assigned branches.
- [ ] In `OutletApprovalQueueTab`, the "ACC / Setujui" and "Tolak" buttons are visible ONLY when logged in as `admin`.
- [ ] In `OutletApprovalQueueTab`, when logged in as `supervisor` or `staff`, the fallback badge renders *"Hanya Super Admin yang dapat menyetujui outlet"*.
- [ ] `PATCH /api/marcom/outlets/[id]/approval` returns `403 Forbidden` if called by a non-admin session.
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm test` passes with 0 failures across all test suites.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.



