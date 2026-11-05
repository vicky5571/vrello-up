# ADR 0049: Filter Approved Outlets in Operational Work Item Forms

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In Vrello Up's organizational architecture, physical retail outlets (`Outlet`) represent critical Master Data. Outlets anchor promotional marketing activities: POSM branding material placements (`Placement`), field activations (`FieldEvent`), social media announcements (`ContentPost`), and partnership agreements (`Mou`).

When an outlet is drafted, it enters the system with status `PENDING_APPROVAL` (or `REJECTED` if turned down by the Super Admin). Only outlets with `status === "APPROVED"` represent legally and operationally verified retail partners.

However, an audit of operational work item forms revealed a significant data integrity gap:
1. **Unscoped Form Queries**:
   - POSM placement wizard (`OutletSearchCombobox.tsx`) queried `/api/marcom/outlets?q=...` without specifying a status filter.
   - Field Event creation (`EventCreateModal.tsx`) and drawer editing (`EventDrawer.tsx`) fetched `/api/marcom/outlets` without a status filter.
   - Content Planner (`ContentPostModal.tsx`) fetched `/api/marcom/outlets` without a status filter.
   - MoU partnership manager (`MousView.tsx`) passed all cached store outlets without status filtering.
2. **Operational Leakage & Waste**:
   - Sales reps and field teams were able to select unverified (`PENDING_APPROVAL`) or rejected (`REJECTED`) stores when creating placements or organizing events.
   - If marketing materials or event logistics were assigned to an unapproved store that the Super Admin subsequently rejected, organizational funds and materials were committed to an invalid partner.
3. **Missing Backend Enforcement**:
   - `POST /api/marcom/placements` and `POST /api/marcom/events` validated foreign key presence (`prisma.outlet.findUnique`) but did not assert `outlet.status === "APPROVED"`.

To protect promotional investments, prevent data corruption, and ensure clean relational integrity between Master Data and Operational Work Items, all operational forms and mutation endpoints must restrict outlet selections strictly to **`status === "APPROVED"`**.

---

## 2. Decision Drivers

1. **Promotional Investment Protection**: Company POSM materials, rental compensations, and event budgets must only be committed to verified, active (`APPROVED`) partner outlets.
2. **Defense-in-Depth (UI + Backend Guard)**: Client-side dropdown filtering must be reinforced by backend API mutation validation rejecting unapproved/rejected outlet links with `HTTP 400 Bad Request`.
3. **Master Data View Isolation**: The main catalog views (`OutletsView.tsx`, `PipelineView.tsx`) must continue displaying all outlet statuses (`APPROVED`, `PENDING_APPROVAL`, `REJECTED`, `DRAFT`) for administrative triage and approval queue auditing.
4. **Performance & Zero Regressions**: Maintain snappy real-time search (<50ms) and avoid breaking existing analytics or historical report generation.

---

## 3. Options Considered

### Option 1: Explicit Operational Scoping + Backend Guard (Chosen)
- Form-level queries specify `status=APPROVED`:
  - `OutletSearchCombobox.tsx`: appends `status: "APPROVED"` to query params.
  - `EventCreateModal.tsx`, `EventDrawer.tsx`, `ContentPostModal.tsx`: fetch `/api/marcom/outlets?status=APPROVED`.
  - `MousView.tsx`: filters `outlets.filter((o) => o.status === "APPROVED")`.
- Backend mutation guard in `POST /api/marcom/placements`:
  - Verify that the target outlet exists AND `outlet.status === "APPROVED"`.
  - Return HTTP 400 (`error: "Only APPROVED outlets can be linked to operational placements"`) if pending or rejected.
- **Pros**:
  - Full defense-in-depth: clean UI presentation and hardened backend protection.
  - Leaves `GET /api/marcom/outlets` backward-compatible for `OutletsView` and `PipelineView`.
  - Zero performance overhead (uses existing indexed Prisma where filters).
- **Cons**: Requires targeted updates across 5 form files and 1 API route.

### Option 2: Default API `GET /api/marcom/outlets` Returns `APPROVED` Only
- Change default behavior in `buildOutletSearchWhere`: if `status` query param is omitted, default to `status: "APPROVED"`.
- Require `OutletsView` to explicitly pass `status=ALL`.
- **Pros**: Automatically guards any future component calling `/api/marcom/outlets`.
- **Cons**: High regression risk. Existing analytics charts, inventory relationships, and test suites that rely on default unbounded queries would silently receive partial datasets.

### Option 3: Client-Side Filter Only
- Fetch all outlets and filter `status === "APPROVED"` strictly in the React component.
- **Pros**: Minimal code changes, no backend edits.
- **Cons**: Wastes bandwidth downloading unapproved and rejected stores across the wire. Leaves backend API unprotected against rogue API submissions.

---

## 4. Decision & Architectural Changes

We decide to implement **Option 1**:

1. **POSM Placement Search Combobox (`src/components/views/PlacementsView/OutletSearchCombobox.tsx`)**:
   - In `fetchOutlets()`, append `params.set("status", "APPROVED")`.
   - Results returned to the combobox picker are strictly verified stores.

2. **Field Event Forms (`src/components/views/EventsView/`)**:
   - In `EventCreateModal.tsx`: update fetch call to `/api/marcom/outlets?status=APPROVED`.
   - In `EventDrawer.tsx`: update fetch call to `/api/marcom/outlets?status=APPROVED`.

3. **Content Planner Form (`src/components/views/ContentPlannerView/ContentPostModal.tsx`)**:
   - In `useEffect`: update fetch call to `/api/marcom/outlets?status=APPROVED`.

4. **MoU Partnership Form (`src/components/views/MousView/MousView.tsx`)**:
   - In `outletsList` calculation, filter `storeOutlets.filter((o) => o.status === "APPROVED")`.

5. **Backend Mutation Guard (`src/app/api/marcom/placements/route.ts`)**:
   - Query target outlet status before record creation:
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

6. **Automated Regression Test**:
   - Add unit and integration tests verifying that operational endpoints reject pending and rejected outlets.

---

## 5. Consequences & Blast Radius

### Positive Consequences
- **Total Data Integrity**: Impossible for sales reps or promotional coordinators to accidentally or intentionally allocate physical POSM branding or event resources to unapproved or rejected stores.
- **Fail-Closed Backend**: Direct API attempts to create placements for unapproved stores receive HTTP 400 immediately.
- **Zero Impact on Admin Catalog**: `OutletsView` and `PipelineView` retain full visibility of all outlet statuses.

### Accepted Trade-offs
- If a sales rep identifies a brand-new outlet on-site, they must wait until the Super Admin approves the draft before creating an official POSM placement for it.



