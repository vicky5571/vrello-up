# Spec: Filter Approved Outlets in Operational Work Item Forms

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0049-filter-approved-outlets-in-operational-forms.md` (ADR-0049)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary & Goals

This specification defines the systemic restriction of outlet selections across all operational work item forms (POSM Placements, Field Events, Content Posts, and Partnership MoUs) to verified stores with `status === "APPROVED"`.

### Core Objectives:
1. **Promotional Investment Integrity:** Prevent sales reps and coordinators from allocating physical POSM materials, organizing roadshow events, or drafting legal MoUs against unverified (`PENDING_APPROVAL`, `DRAFT`) or rejected (`REJECTED`) stores.
2. **Operational Form Scoping:** Update client-side query mechanisms in `OutletSearchCombobox.tsx`, `EventCreateModal.tsx`, `EventDrawer.tsx`, `ContentPostModal.tsx`, and `MousView.tsx` to explicitly demand `status=APPROVED`.
3. **Backend Mutation Hardening:** Guard `POST /api/marcom/placements` to reject placement creation on non-approved outlets with `HTTP 400 Bad Request`.
4. **Master Catalog Isolation:** Retain full multi-status visibility in `OutletsView.tsx` and `PipelineView.tsx` for administrative management, monitoring, and approval queues.
5. **Zero Performance Regression:** Leverage existing indexed database filters (`where: { status: "APPROVED" }`) for sub-millisecond query execution.

---

## 2. Operational Form Scoping Matrix

| Surface / Workflow | File Location | Previous Query / Filter | New Scoped Query / Filter |
|---|---|---|---|
| **POSM Placement Combobox** | `src/components/views/PlacementsView/OutletSearchCombobox.tsx` | `/api/marcom/outlets?q=...` | `/api/marcom/outlets?q=...&status=APPROVED` |
| **New Field Event Form** | `src/components/views/EventsView/EventCreateModal.tsx` | `/api/marcom/outlets` | `/api/marcom/outlets?status=APPROVED` |
| **Edit Field Event Drawer** | `src/components/views/EventsView/EventDrawer.tsx` | `/api/marcom/outlets` | `/api/marcom/outlets?status=APPROVED` |
| **Schedule Content Post Form** | `src/components/views/ContentPlannerView/ContentPostModal.tsx` | `/api/marcom/outlets` | `/api/marcom/outlets?status=APPROVED` |
| **Partnership MoU Form** | `src/components/views/MousView/MousView.tsx` | `storeOutlets` (unfiltered) | `storeOutlets.filter(o => o.status === "APPROVED")` |
| **Placement Backend API** | `src/app/api/marcom/placements/route.ts` | No status check | Rejects non-APPROVED with HTTP 400 |
| **Outlets Catalog (Admin)** | `src/components/views/OutletsView/OutletsView.tsx` | Shows all statuses | **Unchanged** (Retains all statuses) |

---

## 3. Implementation Details by Component

### 3.1 POSM Placement Combobox (`src/components/views/PlacementsView/OutletSearchCombobox.tsx`)
In `fetchOutlets`:
```tsx
// BEFORE:
        const params = new URLSearchParams({
          q: trimmed,
          limit: "15",
        });
        if (brand && brand !== "ALL") {
          params.set("brand", brand);
        }

// AFTER:
        const params = new URLSearchParams({
          q: trimmed,
          limit: "15",
          status: "APPROVED",
        });
        if (brand && brand !== "ALL") {
          params.set("brand", brand);
        }
```

### 3.2 Field Event Forms (`src/components/views/EventsView/`)

#### 1. In `EventCreateModal.tsx`:
```tsx
// BEFORE:
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      ...

// AFTER:
    fetch("/api/marcom/outlets?status=APPROVED")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      ...
```

#### 2. In `EventDrawer.tsx`:
```tsx
// BEFORE:
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      ...

// AFTER:
    fetch("/api/marcom/outlets?status=APPROVED")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      ...
```

### 3.3 Content Planner Modal (`src/components/views/ContentPlannerView/ContentPostModal.tsx`)
```tsx
// BEFORE:
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      ...

// AFTER:
    fetch("/api/marcom/outlets?status=APPROVED")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      ...
```

### 3.4 Partnership MoU View (`src/components/views/MousView/MousView.tsx`)
```tsx
// BEFORE:
  const outletsList = useMemo(
    () =>
      storeOutlets.map((o) => ({
        id: o.id,
        name: o.name,
        code: o.code,
        branchId: o.branchId,
      })),
    [storeOutlets]
  );

// AFTER:
  const outletsList = useMemo(
    () =>
      storeOutlets
        .filter((o) => o.status === "APPROVED")
        .map((o) => ({
          id: o.id,
          name: o.name,
          code: o.code,
          branchId: o.branchId,
        })),
    [storeOutlets]
  );
```

---

## 4. Backend Mutation Hardening (`src/app/api/marcom/placements/route.ts`)

In `POST /api/marcom/placements`:
Before creating the placement record, verify outlet approval:
```ts
  const targetOutlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    select: { id: true, status: true },
  });

  if (!targetOutlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  if (targetOutlet.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Hanya outlet berstatus APPROVED yang dapat dipasangi materi promosi." },
      { status: 400 }
    );
  }
```

---

## 5. Automated Test Contracts & Regression Guards

### 5.1 Backend Mutation Guard Unit Test (`src/app/api/marcom/placements/placementOutletGuard.test.ts`)
Create test verifying that:
1. Creating a placement with an unapproved (`PENDING_APPROVAL`, `DRAFT`, or `REJECTED`) outlet returns `HTTP 400 Bad Request` with message *"Hanya outlet berstatus APPROVED yang dapat dipasangi materi promosi."*.
2. Creating a placement with a non-existent outlet returns `HTTP 404 Not Found`.

### 5.2 Structural Invariant Tests
Create `src/components/views/PlacementsView/operationalOutletFilter.test.ts`:
1. `OutletSearchCombobox.tsx` includes `status: "APPROVED"`.
2. `EventCreateModal.tsx` includes `status=APPROVED`.
3. `EventDrawer.tsx` includes `status=APPROVED`.
4. `ContentPostModal.tsx` includes `status=APPROVED`.
5. `MousView.tsx` includes `filter((o) => o.status === "APPROVED")`.

---

## 6. Acceptance Criteria Checklist

- [ ] `OutletSearchCombobox` queries `/api/marcom/outlets?status=APPROVED` and displays only approved outlets.
- [ ] `EventCreateModal` loads only approved outlets in store selection.
- [ ] `EventDrawer` loads only approved outlets in store selection.
- [ ] `ContentPostModal` loads only approved outlets in store selection.
- [ ] `MouFormModal` in `MousView` receives only approved outlets.
- [ ] `POST /api/marcom/placements` rejects placement creation on non-approved outlets with `HTTP 400`.
- [ ] `OutletsView` catalog continues to display all outlet statuses (`APPROVED`, `PENDING_APPROVAL`, `REJECTED`, `DRAFT`).
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm test` passes with 0 failures across all 152 test suites.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.



