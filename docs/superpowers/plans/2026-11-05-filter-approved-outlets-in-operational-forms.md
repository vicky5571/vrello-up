# Plan: Filter Approved Outlets in Operational Work Item Forms

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-filter-approved-outlets-in-operational-forms-design.md`
- **Refs:** `docs/adr/0049-filter-approved-outlets-in-operational-forms.md`

---

## 1. Executive Summary & Objective

Enforce strict data scoping across all operational work item entry forms (POSM Placements, Field Events, Content Posts, and Partnership MoUs) so that only verified, active retail stores (`status === "APPROVED"`) can be selected and linked. Protect promotional budgets and asset tracking by adding backend mutation guards in `POST /api/marcom/placements` that reject unapproved or rejected stores with `HTTP 400 Bad Request`.

---

## 2. File Manifest & Estimated LOC

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| **Create** | `src/app/api/marcom/placements/placementOutletGuard.test.ts` | ~60 LOC | Unit test validating placement creation rejects unapproved and rejected stores |
| **Create** | `src/components/views/PlacementsView/operationalOutletFilter.test.ts` | ~50 LOC | Invariant test verifying form components query `status=APPROVED` |
| **Modify** | `src/app/api/marcom/placements/route.ts` | ~15 LOC diff | Add pre-insert verification for `targetOutlet.status === "APPROVED"` |
| **Modify** | `src/components/views/PlacementsView/OutletSearchCombobox.tsx` | ~4 LOC diff | Append `status: "APPROVED"` to search query params |
| **Modify** | `src/components/views/EventsView/EventCreateModal.tsx` | ~3 LOC diff | Fetch `/api/marcom/outlets?status=APPROVED` |
| **Modify** | `src/components/views/EventsView/EventDrawer.tsx` | ~3 LOC diff | Fetch `/api/marcom/outlets?status=APPROVED` |
| **Modify** | `src/components/views/ContentPlannerView/ContentPostModal.tsx` | ~3 LOC diff | Fetch `/api/marcom/outlets?status=APPROVED` |
| **Modify** | `src/components/views/MousView/MousView.tsx` | ~5 LOC diff | Filter `storeOutlets.filter(o => o.status === "APPROVED")` |
| **Create** | `docs/handover-filter-approved-outlets-in-operational-forms.md` | ~180 LOC | Complete execution-ready handover guide with verbatim code diffs and checklist |
| **Modify** | `docs/SESSION_STATE.md` | ~20 LOC diff | Record active plan & spec readiness |

---

## 3. Phased Implementation Roadmap

### Phase 1: Backend Mutation Guard & Unit Testing (TDD)
- [ ] Create `src/app/api/marcom/placements/placementOutletGuard.test.ts`:
  - Test case: `rejects placement creation with HTTP 400 when outlet status is PENDING_APPROVAL`.
  - Test case: `rejects placement creation with HTTP 400 when outlet status is REJECTED`.
  - Test case: `rejects placement creation with HTTP 404 when outlet does not exist`.
  - Test case: `permits placement creation when outlet status is APPROVED`.
- [ ] In `src/app/api/marcom/placements/route.ts`:
  - Look up target outlet by `outletId` before `prisma.placement.create`.
  - Validate `targetOutlet.status === "APPROVED"`.
  - Return HTTP 400 with descriptive error if not approved.
- [ ] Run targeted test: `npx tsx --test src/app/api/marcom/placements/placementOutletGuard.test.ts`.

### Phase 2: Operational Forms Client-Side Scoping
- [ ] In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:
  - In `fetchOutlets()`, append `params.set("status", "APPROVED");`.
- [ ] In `src/components/views/EventsView/EventCreateModal.tsx`:
  - Update `fetch("/api/marcom/outlets")` to `fetch("/api/marcom/outlets?status=APPROVED")`.
- [ ] In `src/components/views/EventsView/EventDrawer.tsx`:
  - Update `fetch("/api/marcom/outlets")` to `fetch("/api/marcom/outlets?status=APPROVED")`.
- [ ] In `src/components/views/ContentPlannerView/ContentPostModal.tsx`:
  - Update `fetch("/api/marcom/outlets")` to `fetch("/api/marcom/outlets?status=APPROVED")`.
- [ ] In `src/components/views/MousView/MousView.tsx`:
  - Update `outletsList` calculation to filter `storeOutlets.filter((o) => o.status === "APPROVED")`.
- [ ] Create structural invariant test in `src/components/views/PlacementsView/operationalOutletFilter.test.ts`.
- [ ] Run structural test: `node --test src/components/views/PlacementsView/operationalOutletFilter.test.ts`.

### Phase 3: Non-Negotiable Verification & Handover Documentation
- [ ] Run full test suite: `npm test` across all 152 test suites (0 failures required).
- [ ] Run build check: `npm run build:check` (`tsc --noEmit`, 0 errors required).
- [ ] Run drift check: `npm run drift:check` (verify 76/76 spec-plan pairs and invariants).
- [ ] Create execution handover guide: `docs/handover-filter-approved-outlets-in-operational-forms.md`.
- [ ] Update `docs/SESSION_STATE.md`.
- [ ] Commit planning artifacts with standard git convention.

---

## 4. Risks, Edge Cases & Verification Strategy

| Risk / Edge Case | Impact | Mitigation Strategy |
|---|---|---|
| **Legacy Placements on Non-Approved Outlets** | Historical placements from earlier system versions might link to inactive stores | Mutation guard strictly targets `POST` (new creations); `GET` routes and historical records remain readable |
| **Admin Outlets Catalog & Approval Queue** | Super Admin must still see pending/rejected stores to review drafts | `GET /api/marcom/outlets` retains multi-status support when no filter is provided; `OutletsView` remains untouched |
| **Newly Created Stores during Field Visits** | Rep creates store draft on-site and wants to immediately place banner | Rep is blocked from placing banner until Super Admin approves draft; guarantees physical asset auditability |
| **Pipeline View Aggregations** | Pipeline 360 overview displays outlet health | `PipelineView` queries continue to operate across all operational stores without disruption |


