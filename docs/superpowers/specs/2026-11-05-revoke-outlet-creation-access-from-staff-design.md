# Spec: Revoke Outlet Creation Access from Staff Role

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0045-revoke-outlet-creation-access-from-staff.md` (ADR-0045)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary & Goals

This specification defines the complete revocation of outlet creation and submission privileges from the `staff` role across both backend API guards and the user interface.

### Core Objectives:
1. **SSOT Permission Revocation:** Remove `SUBMIT_DRAFT_OUTLET` from `rolePermissions.staff` in `src/lib/marcom/guards.ts`.
2. **Defensive UI Alignment:** Update `OutletsView.tsx` to compute `canAddOutlet` via the canonical `can("SUBMIT_DRAFT_OUTLET")` hook, hiding the "+ Tambah Outlet" button from staff users entirely.
3. **Row Action Hardening:** Fix `OutletExpandedRow.tsx` so the "Edit Outlet" button requires `canManage` (Admin only) instead of `canAddOutlet`.
4. **Backend Enforcement:** Guarantee that `POST /api/marcom/outlets/draft` and `POST /api/marcom/uploads` (for outlet photos) reject any request initiated by a `staff` session with HTTP 403 Forbidden.
5. **Zero-Defect Verification:** Verify all regression guards pass across `guards.test.ts`, `uploadsApi.test.ts`, and invariant drift checks.

---

## 2. Role & Permission Matrix After Revocation

| Action / Capability | `admin` | `supervisor` | `staff` (New) | `viewer` |
|---|---|---|---|---|
| **`MANAGE_MASTER_DATA`** (Direct Create / Edit Outlet) | ✅ Yes (Global) | ❌ No | ❌ No | ❌ No |
| **`SUBMIT_DRAFT_OUTLET`** (Submit Draft Store to Queue) | ✅ Yes (Global) | ✅ Yes (Assigned Branches) | ❌ **No (Revoked)** | ❌ No |
| **`APPROVE_OUTLET`** (ACC / Reject Draft Outlet) | ✅ Yes (Global) | ✅ Yes (Assigned Branches) | ❌ No (Branch PIC only) | ❌ No |
| **View Outlets Table & Map** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **UI: "+ Tambah Outlet" Button** | Visible | Visible | **Hidden** | **Hidden** |
| **UI: "Edit Outlet" Button (Expanded Row & Drawer)** | Visible | **Hidden** | **Hidden** | **Hidden** |

---

## 3. Code Modifications & Component Contracts

### 3.1 Permission Core (`src/lib/marcom/guards.ts`)
In `rolePermissions`:
```ts
// BEFORE:
staff: [
  "CREATE_MOU",
  "CREATE_PLACEMENT",
  "UPDATE_PLACEMENT",
  "CREATE_EVENT",
  "UPLOAD_VIDEO_FOOTAGE",
  "UPLOAD_DOCUMENT",
  "EXPORT_REPORTS",
  "SUBMIT_DRAFT_OUTLET",
  "VIEW_INVENTORY",
  "MANAGE_INVENTORY",
  "REQUEST_BORROW",
  "PROCESS_RETURN",
],

// AFTER:
staff: [
  "CREATE_MOU",
  "CREATE_PLACEMENT",
  "UPDATE_PLACEMENT",
  "CREATE_EVENT",
  "UPLOAD_VIDEO_FOOTAGE",
  "UPLOAD_DOCUMENT",
  "EXPORT_REPORTS",
  "VIEW_INVENTORY",
  "MANAGE_INVENTORY",
  "REQUEST_BORROW",
  "PROCESS_RETURN",
],
```

### 3.2 View Coordinator (`src/components/views/OutletsView/OutletsView.tsx`)
1. Update `canAddOutlet` calculation:
```ts
// BEFORE:
const canManage = can("MANAGE_MASTER_DATA");
const canAddOutlet = canManage || role !== "viewer";

// AFTER:
const canManage = can("MANAGE_MASTER_DATA");
const canAddOutlet = canManage || can("SUBMIT_DRAFT_OUTLET");
```

2. Update `OutletExpandedRow` prop passing:
```tsx
// BEFORE:
<OutletExpandedRow
  outlet={outlet}
  canAddOutlet={canAddOutlet}
  onOpenDrawer={(id) => setSelectedOutletIdForDrawer(id)}
  onSelectBranch={(branchId) => setSelectedBranchId(branchId)}
  onEditOutlet={(o) => setModalOutlet(o)}
  navigateToMarcom={navigateToMarcom}
/>

// AFTER:
<OutletExpandedRow
  outlet={outlet}
  canManage={canManage}
  onOpenDrawer={(id) => setSelectedOutletIdForDrawer(id)}
  onSelectBranch={(branchId) => setSelectedBranchId(branchId)}
  onEditOutlet={(o) => setModalOutlet(o)}
  navigateToMarcom={navigateToMarcom}
/>
```

### 3.3 Expanded Row Component (`src/components/views/OutletsView/OutletExpandedRow.tsx`)
Update interface and render logic:
```tsx
// BEFORE:
export interface OutletExpandedRowProps {
  outlet: MarcomOutlet;
  canAddOutlet: boolean;
  ...
}

export function OutletExpandedRow({
  outlet,
  canAddOutlet,
  ...
}: OutletExpandedRowProps) {
  ...
  {canAddOutlet && (
    <button onClick={() => onEditOutlet(outlet)}>Edit Outlet</button>
  )}
}

// AFTER:
export interface OutletExpandedRowProps {
  outlet: MarcomOutlet;
  canManage: boolean;
  ...
}

export function OutletExpandedRow({
  outlet,
  canManage,
  ...
}: OutletExpandedRowProps) {
  ...
  {canManage && (
    <button onClick={() => onEditOutlet(outlet)}>Edit Outlet</button>
  )}
}
```

---

## 4. Automated Test Contracts & Regression Guards

### 4.1 Unit Test (`src/lib/marcom/guards.test.ts`)
```ts
test("Permission Matrix - Role Capabilities", async (t) => {
  ...
  await t.test("staff role capabilities", () => {
    // Other actions...
    assert.equal(hasPermission("staff", "CREATE_EVENT"), true);
    assert.equal(hasPermission("staff", "SUBMIT_DRAFT_OUTLET"), false); // MUST BE FALSE
    assert.equal(hasPermission("staff", "MANAGE_MASTER_DATA"), false);
  });
});
```

### 4.2 API Verification Contract
1. `POST /api/marcom/outlets/draft` with authenticated `staff` role returns:
   - Status: `403 Forbidden`
   - Body: `{ "error": "Forbidden: role cannot submit draft outlets" }`
2. `POST /api/marcom/uploads?kind=outlets` with authenticated `staff` role returns:
   - Status: `403 Forbidden`

---

## 5. Acceptance Criteria Checklist

- [ ] `hasPermission("staff", "SUBMIT_DRAFT_OUTLET")` returns `false`.
- [ ] `hasPermission("supervisor", "SUBMIT_DRAFT_OUTLET")` returns `true`.
- [ ] `hasPermission("admin", "SUBMIT_DRAFT_OUTLET")` returns `true`.
- [ ] In `OutletsView`, the "+ Tambah Outlet" button is NOT rendered when logged in as `staff`.
- [ ] In `OutletExpandedRow`, the "Edit Outlet" button is NOT rendered when logged in as `staff` or `supervisor` (only `admin`).
- [ ] `POST /api/marcom/outlets/draft` responds with HTTP 403 Forbidden if a staff user sends a draft submission.
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm test` passes with 0 failures across all suites.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.



