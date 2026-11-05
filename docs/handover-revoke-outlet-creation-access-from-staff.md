# Handover: Revoke Outlet Creation Access from Staff Role

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-revoke-outlet-creation-access-from-staff-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-revoke-outlet-creation-access-from-staff.md`
- **ADR:** `docs/adr/0045-revoke-outlet-creation-access-from-staff.md`

---

## 1. Executive Summary & Objective

This execution handover guides the complete revocation of outlet creation and submission privileges from the `staff` role in Vrello Up.

By deleting `"SUBMIT_DRAFT_OUTLET"` from `rolePermissions.staff` in `src/lib/marcom/guards.ts` and standardizing the UI permission checks in `OutletsView.tsx`, operational staff will no longer see the "+ Tambah Outlet" button, and attempts to invoke backend submission routes (`POST /api/marcom/outlets/draft` and `POST /api/marcom/uploads`) will be blocked with `403 Forbidden`. Additionally, the "Edit Outlet" button in `OutletExpandedRow.tsx` is properly gated behind `canManage` (Admin only).

---

## 2. File Manifest

| File Path | Action | One-Line Purpose |
|---|---|---|
| `src/lib/marcom/guards.ts` | **Modify** | Remove `"SUBMIT_DRAFT_OUTLET"` from `rolePermissions.staff` |
| `src/lib/marcom/guards.test.ts` | **Modify** | Update unit test assertion: `hasPermission("staff", "SUBMIT_DRAFT_OUTLET") === false` |
| `src/components/views/OutletsView/OutletsView.tsx` | **Modify** | Use `can("SUBMIT_DRAFT_OUTLET")` and pass `canManage` to `OutletExpandedRow` |
| `src/components/views/OutletsView/OutletExpandedRow.tsx` | **Modify** | Accept `canManage` instead of `canAddOutlet` for "Edit Outlet" button |
| `docs/SESSION_STATE.md` | **Modify** | Record active plan & spec readiness |

---

## 3. Explicit "Do Not Touch" List

| Target | Reason |
|---|---|
| `src/app/api/marcom/outlets/draft/route.ts` | Already checks `hasPermission(role, "SUBMIT_DRAFT_OUTLET")`; automatically blocks staff when guard changes |
| `src/app/api/marcom/uploads/route.ts` | Already maps `outlets: "SUBMIT_DRAFT_OUTLET"`; automatically blocks photo upload for staff |
| `src/components/views/OutletsView/SubmitDraftOutletModal.tsx` | Retains full functionality for Area Supervisors (`supervisor`) |
| `src/components/views/OutletsView/OutletApprovalQueueTab.tsx` | Outlet approval workflow for Area Supervisors and Admins remains untouched |
| Prisma Schema / Database | Zero database migrations required |

---

## 4. Exact Code Modification Instructions

### 4.1 In `src/lib/marcom/guards.ts`

#### Exact Current Snippet (Lines 49–63):
```ts
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
```

#### Replace With:
```ts
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

---

### 4.2 In `src/lib/marcom/guards.test.ts`

#### Exact Current Snippet (Lines 43–48):
```ts
test("staff can submit draft outlet, but cannot approve outlet without branch scope", () => {
  assert.equal(hasPermission("staff", "SUBMIT_DRAFT_OUTLET"), true);
  assert.equal(hasPermission("staff", "APPROVE_OUTLET"), false);
  assert.equal(hasPermission("viewer", "SUBMIT_DRAFT_OUTLET"), false);
  assert.equal(hasPermission("viewer", "APPROVE_OUTLET"), false);
});
```

#### Replace With:
```ts
test("staff cannot submit draft outlet nor approve outlet", () => {
  assert.equal(hasPermission("staff", "SUBMIT_DRAFT_OUTLET"), false);
  assert.equal(hasPermission("staff", "APPROVE_OUTLET"), false);
  assert.equal(hasPermission("viewer", "SUBMIT_DRAFT_OUTLET"), false);
  assert.equal(hasPermission("viewer", "APPROVE_OUTLET"), false);
});
```

---

### 4.3 In `src/components/views/OutletsView/OutletsView.tsx`

#### Change 1: Line 90
**Current Snippet:**
```ts
  const canManage = can("MANAGE_MASTER_DATA");
  const canAddOutlet = canManage || role !== "viewer";
```

**Replace With:**
```ts
  const canManage = can("MANAGE_MASTER_DATA");
  const canAddOutlet = canManage || can("SUBMIT_DRAFT_OUTLET");
```

#### Change 2: Lines 518–527
**Current Snippet:**
```tsx
            renderExpanded={(outlet) => (
              <OutletExpandedRow
                outlet={outlet}
                canAddOutlet={canAddOutlet}
                onOpenDrawer={(id) => setSelectedOutletIdForDrawer(id)}
                onSelectBranch={(branchId) => setSelectedBranchId(branchId)}
                onEditOutlet={(o) => setModalOutlet(o)}
                navigateToMarcom={navigateToMarcom}
              />
            )}
```

**Replace With:**
```tsx
            renderExpanded={(outlet) => (
              <OutletExpandedRow
                outlet={outlet}
                canManage={canManage}
                onOpenDrawer={(id) => setSelectedOutletIdForDrawer(id)}
                onSelectBranch={(branchId) => setSelectedBranchId(branchId)}
                onEditOutlet={(o) => setModalOutlet(o)}
                navigateToMarcom={navigateToMarcom}
              />
            )}
```

---

### 4.4 In `src/components/views/OutletsView/OutletExpandedRow.tsx`

#### Change 1: Interface & Component Signature (Lines 13–29)
**Current Snippet:**
```tsx
export interface OutletExpandedRowProps {
  outlet: MarcomOutlet;
  canAddOutlet: boolean;
  onOpenDrawer: (outletId: string) => void;
  onSelectBranch: (branchId: string) => void;
  onEditOutlet: (outlet: MarcomOutlet) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
}

export function OutletExpandedRow({
  outlet,
  canAddOutlet,
  onOpenDrawer,
  onSelectBranch,
  onEditOutlet,
  navigateToMarcom,
}: OutletExpandedRowProps) {
```

**Replace With:**
```tsx
export interface OutletExpandedRowProps {
  outlet: MarcomOutlet;
  canManage: boolean;
  onOpenDrawer: (outletId: string) => void;
  onSelectBranch: (branchId: string) => void;
  onEditOutlet: (outlet: MarcomOutlet) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
}

export function OutletExpandedRow({
  outlet,
  canManage,
  onOpenDrawer,
  onSelectBranch,
  onEditOutlet,
  navigateToMarcom,
}: OutletExpandedRowProps) {
```

#### Change 2: Edit Outlet Button Condition (Lines 123–135)
**Current Snippet:**
```tsx
        {canAddOutlet && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditOutlet(outlet);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-orange-600" />
            <span>Edit Outlet</span>
          </button>
        )}
```

**Replace With:**
```tsx
        {canManage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditOutlet(outlet);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-orange-600" />
            <span>Edit Outlet</span>
          </button>
        )}
```

---

## 5. Numbered Execution Order

1. **Update Guard:** Modify `src/lib/marcom/guards.ts` as specified in Section 4.1.
2. **Update Test:** Modify `src/lib/marcom/guards.test.ts` as specified in Section 4.2.
3. **Verify Guard Test:** Run `node --test src/lib/marcom/guards.test.ts` to confirm unit test passes.
4. **Update View Coordinator:** Modify `src/components/views/OutletsView/OutletsView.tsx` as specified in Section 4.3.
5. **Update Expanded Row:** Modify `src/components/views/OutletsView/OutletExpandedRow.tsx` as specified in Section 4.4.
6. **Execute Verification Suite:**
   ```bash
   npm run drift:check
   npm test
   npm run build:check
   ```
7. **Commit:**
   ```bash
   git add src/lib/marcom/guards.ts src/lib/marcom/guards.test.ts src/components/views/OutletsView/OutletsView.tsx src/components/views/OutletsView/OutletExpandedRow.tsx docs/SESSION_STATE.md
   git commit -m "fix(rbac): revoke outlet draft creation access from staff role"
   ```

---

## 6. Acceptance Criteria Checklist

- [ ] `hasPermission("staff", "SUBMIT_DRAFT_OUTLET")` returns `false`.
- [ ] `hasPermission("supervisor", "SUBMIT_DRAFT_OUTLET")` returns `true`.
- [ ] `hasPermission("admin", "SUBMIT_DRAFT_OUTLET")` returns `true`.
- [ ] In `OutletsView`, the "+ Tambah Outlet" button is NOT rendered when logged in as `staff`.
- [ ] In `OutletExpandedRow`, the "Edit Outlet" button is NOT rendered when logged in as `staff` or `supervisor`.
- [ ] `POST /api/marcom/outlets/draft` returns `403 Forbidden` for `staff`.
- [ ] `POST /api/marcom/uploads?kind=outlets` returns `403 Forbidden` for `staff`.
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm test` passes with 0 failures across all 152 test suites.
- [ ] `npm run build:check` passes with 0 TypeScript/build errors.


