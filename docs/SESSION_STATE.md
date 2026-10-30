# SESSION_STATE.md — vrello-up

> **Update this file BEFORE ending every session.** Next session reads this first.

---

## Current Status

**Date:** 2026-10-31  
**Active Branch:** `vicky`  
**Active Feature:** Placements Persistent Header & Static View Switcher — **IMPLEMENTED & VERIFIED**  
**Spec:** `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`  
**Plan:** `docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md`  
**Previous Feature:** Comprehensive QA Database Seeder (`prisma/seed.ts`)  

---

## What Was Completed This Session

1. **Database Schema & Migrations (`prisma/schema.prisma` & migration SQL):**
   - Added enums `EquipmentStatus` (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `RETIRED`), `BorrowStatus` (`PENDING`, `APPROVED`, `ACTIVE`, `RETURNED`, `CANCELLED`, `OVERDUE`), and `EquipmentCondition` (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`, `DAMAGED`, `LOST`).
   - Added models `InventoryItem` (master equipment catalog with unique code, category, units, storage location), `BorrowRecord` (transaction with sequential code `BRW-YYYYMMDD-NNN`, purpose, dates, status, approver), and `BorrowItem` (junction items with condition tracking).
   - Added `borrowRecords BorrowRecord[]` relation on `FieldEvent`.
   - Cleaned defunct legacy columns via `db push --accept-data-loss` (single-tenant invariant compliance) and recorded official migration `prisma/migrations/20261030192500_add_inventory_system/migration.sql`.
   - Seeded 13 items across Audio/Visual, Staging/Booth, Merchandising/Display, and Electrical/Cables categories.

2. **Domain Model & SSOT Types (`src/types/index.ts`):**
   - Added `"inventory"` to `ViewMode` union.
   - Added canonical interfaces: `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`, `InventoryItem`, `BorrowItem`, `BorrowRecord`.

3. **API Route Handlers (`src/app/api/marcom/inventory/`):**
   - `route.ts`: GET catalog with search/category/status filters; POST new catalog item with unique code.
   - `[id]/route.ts`: GET item details; PUT updates with available/total unit sanity check; DELETE blocking if active borrows exist.
   - `[id]/availability/route.ts`: GET real-time availability snapshot with active borrow records.
   - `borrow/route.ts`: GET borrow records with status/event filters; POST new borrow request with auto-generated `BRW-YYYYMMDD-NNN` code in PENDING status.
   - `borrow/[id]/route.ts`: GET single borrow record; PUT updates status and atomically decrements `availableUnits` when transitioning to `ACTIVE`.
   - `borrow/[id]/return/route.ts`: POST processes return, updates condition after return, logs damages/notes, and atomically restores `availableUnits` for non-LOST equipment.

4. **State Management & SWR Store (`src/lib/marcom/marcomDataStore.ts` & tests):**
   - Extended `useMarcomDataStore` with `inventoryItems`, `borrowRecords`, `fetchInventory()`, `fetchBorrowRecords()`, and optimistic mutations.
   - Updated store test suite in `marcomDataStore.test.ts` (18 passed).

5. **Navigation & Coordinator Views (`navConfig.ts`, `ActiveViewStage.tsx`, `src/components/views/InventoryView/`):**
   - Added `"Equipment Inventory"` item under Marcom Master Data navigation section.
   - Dynamically loaded `InventoryView` in `ActiveViewStage.tsx`.
   - Built full modular UI component tree under `src/components/views/InventoryView/`:
     - `inventoryConstants.ts`: categories, badge styles, icons.
     - `InventoryHeaderKpis.tsx`: 4 KPI summary cards, tab switchers, search and filter controls.
     - `InventoryItemsGrid.tsx`: visual item card grid with unit availability indicators.
     - `InventoryTableView.tsx`: detailed sortable table view.
     - `BorrowRecordsTable.tsx`: filterable table of borrow transactions.
     - `BorrowTrackingBoard.tsx`: 4-column kanban board for active workflows.
     - `InventoryItemFormModal.tsx`: add/edit modal with validation.
     - `BorrowRequestModal.tsx`: multi-step request modal with item selection.
     - `BorrowDetailModal.tsx`: detailed transaction inspector with status actions.
     - `ReturnProcessModal.tsx`: return inspection and condition check-in dialog.
     - `InventoryViewModals.tsx`: modal coordinator isolating dialog logic.
     - `InventoryView.tsx`: coordinator component strictly $\le 250$ LOC (223 LOC).

6. **Event Integration (`EventBorrowedEquipmentSection.tsx`, `EventFormModal.tsx`):**
   - Added collapsible borrowed equipment section and request shortcut in `EventFormModal.tsx`.

7. **Permissions & Security (`guards.ts`, `guards.test.ts`):**
   - Added permissions: `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REQUEST_BORROW`, `APPROVE_BORROW`, `PROCESS_RETURN`.

8. **Automated Test Suites:**
   - `src/lib/marcom/inventoryLogic.test.ts`: pure domain logic tests for availability, code generation, and condition status.
   - `src/app/api/marcom/inventory/inventoryApi.test.ts`: API route tests.

9. **Sidebar Mode Switcher Restoration (`AppModeSegmentedControl.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`):**
   - Restored original Projects logo icon (`Kanban` from `lucide-react`) replacing `FolderKanban`.
   - Restored label text to `"Marcom Hub"` in mode switcher pills and `GlobalRail`.
   - Restored Framer Motion animated sliding pill (`motion.div layoutId="activeAppModeIndicator"` with spring physics and reduced-motion support).
   - Extracted `AppModeSegmentedControl.tsx` (104 LOC), bringing `Sidebar.tsx` coordinator down to 182 LOC.

10. **Bugfix: Equipment Inventory Mode Toggle Auto-Reversion (`createUiSlice.ts`, `urlState.ts`, `topNavConstants.ts`):**
   - Added `"inventory"` to `MARCOM_VIEW_SET` in `createUiSlice.ts` so `setActiveView("inventory")` resolves `appMode = "marcom"`.
   - Added `"inventory"` to `VALID_VIEW_MODES` and `MARCOM_VIEWS` in `urlState.ts`, plus `"equipment"` / `"equipments"` normalization aliases.
   - Added `"inventory"` to `MARCOM_VIEW_LABELS` in `topNavConstants.ts`.
   - Added Equipment Inventory view and quick action to `CommandPalette.tsx`.
   - Added automated tests in `marcomViews.test.ts` and `urlState.test.ts`.

11. **Bugfix: Stale Prisma Client Runtime on Development Server (500 error on fetchBorrowRecords):**
   - Root cause: Dev server process started before `BorrowRecord` / `BorrowItem` schema migration, retaining stale Prisma client in Node process memory where `prisma.borrowRecord` was `undefined`.
   - Terminated stale process, restarted clean Next.js server on port 3000, verified authenticated requests return HTTP 200 (`/api/marcom/inventory/borrow` and `/api/marcom/inventory`).

12. **Feature: Event Card Equipment Logistics Indicator Chip — IMPLEMENTED & VERIFIED:**
   - Created Spec: `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`
   - Created Plan: `docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md`
   - Created ADR: `docs/adr/0006-event-card-equipment-indicator.md` (ADR-06)
   - Created pure helper `getEventEquipmentSummary` in `src/lib/marcom/eventEquipmentHelpers.ts`.
   - Added unit test suite in `src/lib/marcom/eventEquipmentHelpers.test.ts` (4 passed).
   - Integrated reactive indicator chip into `EventCardsView.tsx` with teal active state, rose overdue state, and modal open trigger.
   - Added pre-fetch of `fetchBorrowRecords()` to `EventsView.tsx`.

13. **Feature: Open Detail Drawer on Row Click in Projects List View — IMPLEMENTED & VERIFIED:**
   - Attached `onClick={() => onSelect?.(item)}` to `<tr>` in `src/components/views/ProjectsView/ProjectsListRow.tsx` with `cursor-pointer` styling.
   - Isolated click event propagation (`e.stopPropagation()`) across all interactive cell controls (checkbox selection toggle, inline title edit input and double-click trigger, status dropdown button and options, due date editor and date button, PIC assignee editor and button, action button).
   - Preserved seamless row click behavior across non-control cell areas (type badge, branch, checklist, and empty cell padding) to open the domain drawer/modal (`ProjectsDetailDrawerHost`).

14. **Bugfix: HTML Redirect Response on Pipeline View (`SyntaxError: Unexpected token '<'`):**
   - Root cause: NextAuth edge middleware callback in `src/auth.config.ts` was returning `false` for unauthenticated requests on `/api/...` endpoints instead of a 401 JSON Response. NextAuth edge middleware automatically generated an HTTP 307 Temporary Redirect to the `/login` HTML page. The browser's client-side `fetch('/api/marcom/pipeline')` followed the redirect and received the HTML login page with HTTP 200 OK, causing `await res.json()` to fail with `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
   - Updated `src/auth.config.ts` `authorized` callback to inspect `request?.nextUrl?.pathname` and return an HTTP 401 JSON Response for unauthenticated/unapproved `/api/` requests, preserving page redirects only for non-API routes.
   - Updated `PipelineView.tsx` with defensive status handling (clean redirect to `/login` if 401 or redirected) and validated `content-type: application/json` before calling `.json()`.
   - Wrapped `src/app/api/marcom/pipeline/route.ts` GET handler in `try / catch` returning structured HTTP 500 JSON on database exceptions.
   - Added automated unit tests in `src/auth.config.test.ts` (8 passed).

15. **Comprehensive QA Edge-Case Database Seeder (`prisma/seed.ts`) — IMPLEMENTED & VERIFIED:**
   - Spec: `docs/superpowers/specs/2026-10-31-qa-comprehensive-seeder-design.md`
   - Plan: `docs/superpowers/plans/2026-10-31-qa-comprehensive-seeder.md`
   - Implemented clean atomic reset protocol (`cleanDatabase`) deleting all tables in reverse FK topological order, guaranteeing idempotent re-runs in < 1 second.
   - Implemented realistic Indonesian corporate domain data across all entities without artificial `[QA]` label strings.
   - Covered edge cases: SLA critical expired MoU (45d ago), SLA warning near-expiry MoU (8d), pending legal approval aging (>60d), flagship multi-year agreement (Rp 150M), rejected MoU with finance reasons, GPS geolocation anomaly (>1.4km deviation, `isLocationValid: false`), installation blocked with `ISSUE` renovation status, permanent material without MoU warning, extreme dimensions installation (`1200 x 400 cm`), cold/orphan outlet with 0 operational records, inactive outlet, overdue borrow with event link, damaged returns (`MAJOR_DAMAGE` and `LOST` equipment condition check-in), content posts in review/revision/published states, document files up to 88.5MB, and executive Q3 report with rich JSON.
   - Standardized branch indexing (`branch-1`..`branch-12`) and preserved catalog item counts ($\ge 13$) to satisfy all downstream integration test suites.

16. **Active Pills Animation on Content Planner Page (`ContentPlannerView.tsx`):**
    - Implemented fluid animated sliding pill for the View Modes Switcher (Cards vs Table) and Platform Filter Pills.
    - Integrated Framer Motion `motion.div` with shared `layoutId` (`activeContentPlannerViewPill` and `activeContentPlannerPlatformPill`), natural spring physics (`stiffness: 450, damping: 35`), and `useReducedMotion()` accessibility support.
    - Added tactile tap gestures (`whileTap={{ scale: 0.95 }}`) and semantic accessibility attributes (`role="tablist"`, `role="tab"`, `aria-selected`).

17. **Placements Persistent Header & Static View Switcher (`PlacementsView.tsx`, `PlacementsHeader.tsx`, `PlacementFilterControls.tsx`):**
    - Spec: `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md`
    - Upgraded `PlacementViewSwitcher` with Framer Motion `motion.div layoutId="activePlacementViewPill"`, spring physics (`stiffness: 450, damping: 35`), `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`.
    - Extracted atomic subcomponent `PlacementsHeader.tsx` (84 LOC) containing title, record badge, view switcher pills, refresh button, export trigger, and `+ Add Placement` action.
    - Anchored `PlacementsHeader` and `KpiSummaryCards` persistently at the top across Table, Map, and Recap view modes with 0px layout jump.
    - Streamlined `PlacementsMapTab.tsx` and `PlacementsRecapTab.tsx` by removing redundant duplicate headers and duplicate KPI bars.
    - Kept coordinator `PlacementsView.tsx` strictly under the 250 LOC limit (213 LOC).

---

## Verification Gates (this session)

- `npm run drift:check` → ✅ No drift detected (25 specs paired, single-tenant invariant OK, coordinator files LOC OK, SSOT OK)
- `npm run build:check` → ✅ 0 TypeScript errors
- `npm test` → ✅ 591 passed, 0 failed (100 suites)

---

## Blocked / Risks

- None.

---

## Next Step for Following Session

1. Run verification commands (`npm run drift:check`, `npm run build:check`, `npm test`) on session start.
2. Commit and push implemented feature to remote (`git push origin vicky`).
