# CHANGELOG — vrello-up

Format: `[YYYY-MM-DD] <type>(<scope>): <description>` with spec/plan references.

---

## [2026-11-07]

- `fix(placements)`: Mobile outlet search results and selected outlet card readability (ADR-0075)
  - Search results dropdown responsive layout: introduced mobile stacked layout (`sm:hidden`) in `OutletSearchCombobox.tsx` rendering code, brand, and GPS status on row 1, full outlet name with `break-words line-clamp-2` on row 2, and physical street address with `MapPin line-clamp-2` on row 3, eliminating premature single-line truncation of retail names and branch qualifiers
  - Selected card header decluttering: hid `Ganti Outlet` from top header on mobile using `hidden sm:inline-flex`, expanding horizontal space for store title and physical address from ~92px to ~230px (+148% wider) and completely eliminating 5-line title and 8-line address fragmentation
  - Dedicated mobile action button: rendered a thumb-friendly full-width `Ganti Outlet Lain` button (`w-full sm:hidden py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 font-semibold border border-slate-200/80 shadow-2xs mt-1`) at the bottom of the card
  - Desktop 100% byte-for-byte preserved: retains legacy single-row header button placement (`hidden sm:flex sm:flex-col` / `hidden sm:inline-flex`) and hides mobile bottom buttons on viewports $\ge 640\text{px}$
  - Added TDD unit test suite in `src/components/views/PlacementsView/outletSearchResponsiveness.test.ts` (7/7 tests passing)
  - Verification: `npm run drift:check` ✅ (102/102 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (154/154), `npm test` ✅ (990/990)
  - Refs: `docs/adr/0075-mobile-outlet-search-and-selected-card-readability.md`, `docs/superpowers/specs/2026-11-07-mobile-outlet-search-and-selected-card-readability-design.md`, `docs/superpowers/plans/2026-11-07-mobile-outlet-search-and-selected-card-readability.md`

- `fix(placements)`: Placement form selected outlet GPS and address data propagation (ADR-0074)
  - Upstream projection preservation: enriched `outletsList` projection in `PlacementsView.tsx` to retain complete outlet records (`code`, `address`, `city`, `latitude`, `longitude`, `picPhone`) from `storeOutlets`, eliminating data stripping before modal delivery
  - Defensive coordinate & address coalescing: refactored `selectedOutletObj` in `PlacementFormModal.tsx` to coalesce `placement.outlet` and `selOutlet` via `pOutlet?.latitude ?? selOutlet?.latitude ?? null` and `pOutlet?.address || selOutlet?.address || ""`, preventing unselected properties from overwriting active GPS coordinates and physical street addresses
  - Step 1 & Step 4 consistency: restored `• GPS Aktif` badges and full address preview in `OutletSelectedCard.tsx`, ensuring installer geofencing radius validation in `Step4FinalCheck.tsx` receives authentic location telemetry
  - Architecturally compliant file bounds: `PlacementsView.tsx` maintained at 230 LOC ($\le 250$ LOC coordinator ceiling) and `PlacementFormModal.tsx` at 310 LOC ($\le 350$ LOC ceiling)
  - Added TDD unit test suite in `src/components/views/PlacementsView/placementOutletPropagation.test.ts` (8/8 tests passing)
  - Verification: `npm run drift:check` ✅ (101/101 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (153/153), `npm test` ✅ (983/983)
  - Refs: `docs/adr/0074-placement-form-selected-outlet-gps-and-address-propagation.md`, `docs/superpowers/specs/2026-11-07-placement-form-selected-outlet-gps-propagation-design.md`, `docs/superpowers/plans/2026-11-07-placement-form-selected-outlet-gps-propagation.md`

- `fix(events)`: Mobile event media upload action layout and header stabilization (ADR-0073)
  - Mobile (< 640px) header: hid the cramped `"Upload dari Perangkat"` header button via `hidden sm:flex` and added `shrink-0` to the header icon, allowing section title `"Media & Dokumentasi Event"` to span 100% on a single row without 2-line lateral wrapping
  - Mobile (< 640px) upload action: relocated the primary upload button to a dedicated full-width action button (`w-full sm:hidden py-2.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold flex items-center justify-center gap-2 border border-blue-200/60 shadow-2xs`) positioned directly beneath the media area (below thumbnail grid or dropzone), dramatically improving thumb reach ergonomics for field teams
  - Device input element accessibility: moved `<input ref={fileInputRef} ... />` outside the `hidden sm:flex` header container so it remains active in the DOM tree and cleanly triggered by both header and mobile buttons
  - Desktop 100% preserved: resets to header right-aligned action row (`hidden sm:flex items-center gap-2`) and hides the mobile bottom button (`sm:hidden`) on viewports $\ge 640\text{px}$
  - Safe file limit maintained: `EventMediaSection.tsx` maintains safe coordinator file limit at 454 LOC ($\le 460$ LOC)
  - Added TDD unit test suite in `src/components/views/EventsView/eventMediaResponsiveness.test.ts` (4/4 tests passing)
  - Verification: `npm run drift:check` ✅ (100/100 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (152/152), `npm test` ✅ (975/975)
  - Refs: `docs/adr/0073-mobile-event-media-upload-action-layout.md`, `docs/superpowers/specs/2026-11-07-mobile-event-media-upload-layout-design.md`, `docs/superpowers/plans/2026-11-07-mobile-event-media-upload-layout.md`

- `fix(events)`: Mobile checklist readability and responsive header layout (ADR-0072)
  - Mobile (< 640px) header: restructured header into 2 rows (`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`) with title `Event Preparation Checklist` spanning row 1 and status strip (`0/5 selesai` + `Template <type>`) on row 2, eliminating text collision and 4-line squished wrapping
  - Multi-line subtask text wrapping: removed single-line `truncate` from checklist item titles, applying `break-words text-xs leading-snug` so field teams can read complete logistics subtasks
  - Checkbox alignment: adjusted item row to `items-start justify-between gap-2.5` with checkbox `mt-0.5 shrink-0 w-4 h-4` to prevent vertical center-floating on multi-line text
  - Add-item input placeholder: shortened to `"Tambah item checklist baru..."` to prevent truncation on narrow smartphone viewports
  - Desktop 100% preserved: resets to single horizontal inline row (`sm:flex-row sm:items-center sm:justify-between`) on screens $\ge 640\text{px}$
  - Added TDD unit test suite in `src/components/views/EventsView/eventChecklistResponsiveness.test.ts` (5/5 tests passing)
  - Verification: `npm run drift:check` ✅ (99/99 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (151/151), `npm test` ✅ (971/971)
  - Refs: `docs/adr/0072-mobile-event-checklist-readability-enhancement.md`, `docs/superpowers/specs/2026-11-07-mobile-event-checklist-readability-design.md`, `docs/superpowers/plans/2026-11-07-mobile-event-checklist-readability.md`

- `feat(navigation)`: Fluid sliding pill animation and layout isolation for mobile bottom nav (ADR-0067)
  - Layout projection tree isolation: wrapped bottom navigation tab mapping inside `<LayoutGroup id="mobile-bottom-nav">` in `MobileBottomNav.tsx`, isolating bottom nav layout animations from page-level state transitions and mount/unmount cascades in `ActiveViewStage`
  - Decoupled tap scale feedback: replaced outer `<motion.button whileTap={{ scale: 0.92 }}>` with a static-boundary `<button>` and relocated tactile micro-scale feedback to the inner icon/label container (`<motion.div className="relative z-10 ...">`), eliminating bounding-box geometry distortion and layout projection cancellation during touch gestures
  - Tactile pill styling & spring physics: refined active pill styling with `bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl` and calibrated spring transition `{ type: "spring", stiffness: 420, damping: 30 }` for a crisp, continuous 60fps sliding transition across tabs
  - Invariants preserved: desktop navigation (`GlobalRail.tsx`, `Sidebar.tsx`) remains 100% byte-for-byte unaffected; coordinator file size remains strictly under limits (135 LOC <= 150 LOC)
  - Unit test verification: added `LayoutGroup` tree isolation assertion to `src/components/layout/MobileBottomNav.test.ts` (15/15 tests passing)
  - Verification: `npm run drift:check` ✅ (94/94 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (150/150), `npm test` ✅ (966/966)
  - Refs: `docs/adr/0067-mobile-bottom-nav-sliding-pill-animation.md`, `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-sliding-pill-design.md`, `docs/superpowers/plans/2026-11-07-mobile-bottom-nav-sliding-pill.md`

- `feat(navigation)`: Replace mobile bottom nav Home tab with Pipeline & Status (ADR-0066)
  - Mobile: replaced redundant `Home` tab in Slot 1 with `Pipeline` (`id: "pipeline"`, icon: `Layers`, activeColor: `text-indigo-500`) in `MobileBottomNav.tsx`
  - Operational alignment: elevates retail partnership pipeline (MoU approvals, proposal reviews, SLA aging) to instant 1-tap thumb reach for field teams, creating a 100% Marcom operational bottom toolbar (`Pipeline`, `Outlets`, `Placements`, `Events`, `Menu`)
  - Redundancy elimination: removes the mobile `Home` tab which duplicated the Kanban board; project task tracking remains fully accessible via the sidebar drawer (`Sidebar.tsx`) under Tasks mode
  - Desktop 100% preserved: desktop rail (`GlobalRail.tsx`) and drawer remain untouched
  - Updated TDD unit test assertions in `src/components/layout/MobileBottomNav.test.ts` (14/14 tests passing)
  - Verification: `npm run drift:check` ✅ (93/93 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (150/150), `npm test` ✅ (965/965)
  - Refs: `docs/adr/0066-mobile-bottom-nav-replace-home-with-pipeline.md`, `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-pipeline-design.md`, `docs/superpowers/plans/2026-11-07-mobile-bottom-nav-pipeline.md`

- `fix(placements)`: Equalize mobile view switcher pill height across tabs (ADR-0070)
  - Mobile: changed view switcher container from `flex items-center` to `flex items-stretch sm:items-center` in `PlacementFilterControls.tsx`
  - Mobile: added `min-h-[40px] sm:min-h-0` to all view switcher buttons so active pill spans the full track height consistently across all 3 tabs (`Table`, `Map View`, and 2-line `Rekap Kuartal`), eliminating the shrunken pill and vertical gaps
  - Desktop 100% preserved: resets to `sm:items-center` and `sm:min-h-0`
  - Added TDD assertions in `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` (5/5 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm run test:smoke` ✅ (150/150), `npm test` ✅ (965/965)
  - Refs: `docs/adr/0070-mobile-view-switcher-track-and-pill-height-equalization.md`, `docs/superpowers/specs/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization-design.md`, `docs/superpowers/plans/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization.md`

- `fix(outlets)`: Equalize mobile view switcher pill height across loading and loaded states (ADR-0070)
  - Mobile: changed view switcher container from `flex items-center` to `flex items-stretch sm:items-center` on `OutletsHeader.tsx`
  - Mobile: added `min-h-[40px] sm:min-h-0` to all view switcher buttons so active pill spans the full track height consistently, whether text is 1-line (`Tabel Data`) or 2-line (`Peta \n Sebaran`, `Antrean \n Approval`), eliminating the shrunken pill during loading
  - Desktop 100% preserved: resets to `sm:items-center` and `sm:min-h-0`
  - Added TDD assertions in `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` (11/11 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm run test:smoke` ✅ (150/150), `npm test` ✅ (964/964)
  - Refs: `docs/adr/0070-mobile-view-switcher-track-and-pill-height-equalization.md`, `docs/superpowers/specs/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization-design.md`, `docs/superpowers/plans/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization.md`

- `feat(analytics)`: Mobile header layout and horizontal KPI carousel (ADR-0065)
  - Mobile: aligned refresh action button to the right (`justify-end sm:justify-start`) for consistent one-handed thumb ergonomics
  - Mobile: organized filter toolbar into 2 rows — Row 1 with 50/50 2-column grid (`grid grid-cols-2 gap-2 w-full sm:w-auto`) for Branch and Quarter dropdowns, hiding `Filter:` label (`hidden sm:flex`); Row 2 for Brand toggle pills and conditional Reset button (`justify-between sm:justify-start`)
  - Mobile: transformed 2x2 KPI grid into a smooth horizontal scroll carousel (`flex overflow-x-auto pb-2 -mx-4 px-4 min-w-[210px] shrink-0`) eliminating text truncation in card footers and pulling downstream charts *above the fold*
  - Desktop 100% preserved: action button stays left-aligned in column (`sm:justify-start`), filter toolbar stays single inline row (`sm:flex sm:items-center`), and KPI cards stay static 4-column grid (`sm:grid sm:grid-cols-2 lg:grid-cols-4`)
  - Added TDD unit test suite in `src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts` (5/5 tests passing)
  - Verification: `npm run drift:check` ✅ (92/92 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (150/150), `npm test` ✅ (963/963)
  - Refs: `docs/adr/0065-mobile-analytics-roi-header-layout-and-horizontal-kpi-carousel.md`, `docs/superpowers/specs/2026-11-07-mobile-analytics-roi-header-design.md`, `docs/superpowers/plans/2026-11-07-mobile-analytics-roi-header.md`

- `fix(reports)`: Right-align header action buttons on mobile (ADR-0068)
  - Mobile: aligned primary action row (`Refresh`, `Export Center`) to the right (`justify-end sm:justify-start`) and aligned `+ Buat Laporan Bulanan` button to the right (`self-end sm:self-auto`)
  - Mobile: aligned `QuarterlyPosmReportTab` action row to the right (`justify-end sm:justify-start`)
  - Desktop 100% preserved: action rows stay left-aligned within columns (`sm:justify-start`) and button stays standard flow (`sm:self-auto`)
  - Added TDD unit test suite in `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` (3/3 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅ (958/958), `npm run test:smoke` ✅ (149/149)
  - Refs: `docs/adr/0068-mobile-header-action-alignment-standardization.md`, `docs/superpowers/specs/2026-11-07-mobile-header-action-alignment-standardization-design.md`, `docs/superpowers/plans/2026-11-07-mobile-header-action-alignment-standardization.md`

- `fix(documents)`: Right-align header action buttons on mobile (ADR-0068)
  - Mobile: aligned `Refresh` and `Tambah Dokumen` buttons to the right (`justify-end sm:justify-start`) for consistent one-handed thumb ergonomics
  - Desktop preserved: action buttons remain left-aligned in their column (`sm:justify-start`), and search/switcher controls are 100% untouched
  - Added TDD unit test suite in `src/components/views/DocumentsView/documentsHeaderResponsiveness.test.ts` (3/3 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅, `npm run test:smoke` ✅ (148/148)
  - Refs: `docs/adr/0068-mobile-header-action-alignment-standardization.md`, `docs/superpowers/specs/2026-11-07-mobile-header-action-alignment-standardization-design.md`, `docs/superpowers/plans/2026-11-07-mobile-header-action-alignment-standardization.md`

- `fix(inventory)`: Optimize mobile header layout and prevent code badge wrapping (ADR-0069)
  - Mobile: expanded search input to full width on row 2 (`order-last sm:order-first relative w-full sm:w-56`), eliminating the cramped ~90px search input
  - Mobile: paired category dropdown (`flex-1 sm:flex-initial sm:w-44`) with view mode switcher (`shrink-0`) on row 1
  - Mobile: right-aligned action row (`justify-end sm:justify-start`) and balanced segmented tabs 50/50 (`w-full sm:w-auto` with `flex-1 sm:flex-initial`)
  - Mobile: adjusted header and view outer padding from static `p-6` to responsive `p-4 sm:p-6`
  - Fixed item code badge breaking into 3 lines in `InventoryTableView.tsx` by adding `whitespace-nowrap`
  - Desktop 100% preserved: search remains first in row (`sm:order-first sm:w-56`), dropdown remains `sm:w-44`, action row left-aligned (`sm:justify-start`), and tabs inline
  - Added TDD unit test suite in `src/components/views/InventoryView/inventoryHeaderResponsiveness.test.ts` (7/7 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅, `npm run test:smoke` ✅ (147/147)
  - Refs: `docs/adr/0069-mobile-filter-toolbar-anti-shift-and-search-grid.md`, `docs/superpowers/specs/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid-design.md`, `docs/superpowers/plans/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid.md`

- `fix(branches)`: Anchor Reset Filters to prevent desktop layout shift and mobile CLS (ADR-0069)
  - Mobile: moved `Reset Filters` to Row 1 alongside `CustomDropdown` using `justify-between sm:justify-start`, eliminating the orphaned 3rd row and preventing Cumulative Layout Shift (CLS)
  - Desktop: ordered `Reset Filters` before the region dropdown via `sm:order-first`, so when active filters appear, they expand into left dead space instead of pushing the dropdown and search bar 90px to the left
  - Added unit test coverage in `src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts` (5/5 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅, `npm run test:smoke` ✅ (146/146)
  - Refs: `docs/adr/0069-mobile-filter-toolbar-anti-shift-and-search-grid.md`, `docs/superpowers/specs/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid-design.md`, `docs/superpowers/plans/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid.md`

- `fix(branches)`: Right-align header actions and make mobile search full width (ADR-0068)
  - Mobile: the `Refresh` and `Tambah Branch` action row is now right-aligned (`justify-end sm:justify-start`), matching the card's right margin
  - Mobile: the branch search input now spans the full content width (`w-full sm:w-56`), eliminating the narrow left-aligned field
  - Desktop preserved: title and actions stay on one row, the action row remains left-aligned within its own column, the region dropdown stays `w-40 sm:w-44`, and the search stays `sm:w-56` (224px)
  - Added structural regression tests in `src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts` (3/3 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅ (943/943), `npm run test:smoke` ✅ (146/146)
  - Refs: `docs/adr/0068-mobile-header-action-alignment-standardization.md`, `docs/superpowers/specs/2026-11-07-mobile-header-action-alignment-standardization-design.md`, `docs/superpowers/plans/2026-11-07-mobile-header-action-alignment-standardization.md`

- `fix(mobile)`: Remove spring overshoot from sidebar animation
  - Replaced the mobile sidebar's underdamped spring (`damping: 28, stiffness: 300`) with a monotonic 240ms tween (`ease: [0.2, 0, 0, 1]`) in `Sidebar.tsx`
  - Eliminated the bump/overshoot past `x: 0` that briefly pushed the drawer right of the viewport edge and exposed the page background on the left side
  - Aligned the mobile backdrop fade to the same 240ms/easing so both layers settle together
  - Kept desktop behavior byte-for-byte unchanged: `initial={false}`, `exit={undefined}`, and `transition={{ duration: 0 }}` when `!isMobile`
  - Added regression tests for no spring physics, shared backdrop/drawer timing, and desktop instant motion in `src/components/layout/MobileBottomNav.test.ts` (14/14 tests passing)
  - Updated ADR-0063 with a 2026-11-07 amendment and reconciled the animation spec
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅ (940/940), `npm run test:smoke` ✅ (145/145)
  - Refs: `docs/adr/0063-mobile-sidebar-slide-transition-and-backdrop-animation.md` (ADR-0063, amended)

- `fix(outlets)`: Stabilize GPS toast and mobile Create Outlet layout (ADR-0071)
  - Moved the `View on Maps` link to a dedicated second row on mobile (`sm:hidden`) while preserving the desktop header row (`hidden sm:inline-flex`) in `OutletFormModal.tsx`
  - Prevented the GPS header title from wrapping (`whitespace-nowrap`) so the header row stays compact at 390px
  - Fixed the GPS toast getting stuck on touch devices after it was tapped: the toast now uses a stable id, ignores pointer events so taps reach the modal close button, and is explicitly dismissed when the modal unmounts
  - Made the Sonner toaster container pass-through while keeping individual toasts interactive, preventing hover-pause on empty stack areas
  - Added TDD coverage in `src/components/views/OutletsView/outletFormModalMobileUx.test.ts` (7/7 tests passing)
  - Verification: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅ (937/937), `npm run test:smoke` ✅ (145/145)
  - Refs: `docs/adr/0071-mobile-outlet-form-gps-layout-and-toast-resilience.md`, `docs/superpowers/specs/2026-11-07-mobile-outlet-form-gps-layout-and-toast-resilience-design.md`, `docs/superpowers/plans/2026-11-07-mobile-outlet-form-gps-layout-and-toast-resilience.md`

## [2026-11-06]

- `feat(mobile)`: Bound notification center popover to viewport and add mobile backdrop
  - Decoupled `NotificationCenter` popover from relative bell icon trigger on mobile smartphones (< 640px) using `fixed inset-x-3 top-13 z-50 max-h-[82vh] flex flex-col`, eliminating left-edge clipping overflow
  - Introduced a tap-dismissable mobile backdrop overlay (`fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden`) for intuitive dismissal outside the panel
  - Strictly preserved 100% desktop placement and ergonomics on screens $\ge 640\text{px}$ (`sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86`)
  - Maintained coordinator file boundaries and compact implementation
  - Added TDD unit test suite in `src/lib/productivity/useNotificationFeed.test.ts` (5/5 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-notification-center-popover-viewport-bounded-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-notification-center-popover-viewport-bounded.md`
  - Refs: `docs/adr/0064-mobile-notification-center-popover-viewport-bounded-layout.md` (ADR-0064)

- `feat(mobile)`: Mobile sidebar slide transition and backdrop animation
  - Introduced fluid slide-in and slide-out transitions (`x: "-100%" -> 0 -> "-100%"`) and backdrop fade-in and fade-out transitions (`opacity: 0 -> 1 -> 0`) using Framer Motion `<AnimatePresence>` in `Sidebar.tsx`
  - Applied spring physics (`damping: 28, stiffness: 300`) on `motion.aside` for a responsive native sheet gesture feel on smartphone viewports (< 768px)
  - Strictly isolated motion transformations to mobile viewports via hydration-safe `isMobile` check, ensuring desktop sidebar ($\ge 768\text{px}$) renders as a 100% static panel without transform offsets or layout shift
  - Respected user accessibility preferences via `useReducedMotion()`
  - Enforced coordinator file constraints (`Sidebar.tsx` at 205 LOC $\le 250$ LOC)
  - Added TDD unit test suite in `src/components/layout/MobileBottomNav.test.ts` (11/11 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-sidebar-slide-transition-and-backdrop-animation-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-sidebar-slide-transition-and-backdrop-animation.md`
  - Refs: `docs/adr/0063-mobile-sidebar-slide-transition-and-backdrop-animation.md` (ADR-0063)

- `feat(mobile)`: Placements table header deduplication and brand filter preservation
  - Eliminated redundant local table title `[📋] Placements 22 placements` in `PlacementsView.tsx` via `hideTitle={true}` on `MarcomTableShell`, resolving mobile screen crowding beside the brand filter
  - Preserved compact pill styling and positioning of brand filter buttons in `headerExtra={brandChips}` (`shrink-0`), avoiding full-width stretching per user preference
  - Supported `hideTitle?: boolean` prop on `MarcomTableShell.tsx` with right-aligned `headerExtra` (`hideTitle && "justify-end"`)
  - With the redundant title removed on the left, compact brand chips (`All Brands`, `IM3`, `3 (Tri)`) have ample room across the mobile container, completely eliminating clipping of `3 (Tri)`
  - Maintained 100% desktop pixel parity and ergonomics on screens $\ge 640\text{px}$
  - Enforced coordinator file constraints (`PlacementsView.tsx` at 214 LOC $\le 250$ LOC, `PlacementFilterControls.tsx` at 164 LOC $\le 250$ LOC)
  - Added TDD unit test suite in `src/components/views/PlacementsView/placementsFilterLayout.test.ts` (4/4 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-placements-filter-bar-brand-unification-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-placements-filter-bar-brand-unification.md`
  - Refs: `docs/adr/0062-mobile-placements-table-header-deduplication-and-brand-filter-unification.md` (ADR-0062)


- `feat(mobile)`: Mobile view switcher full-width and action row right alignment
  - Right-aligned mobile action button row across headers (`PlacementsHeader.tsx`, `OutletsHeader.tsx`, `EventsHeader.tsx`) via `justify-end sm:justify-start w-full sm:w-auto`, anchoring action triggers to the right margin and removing the uneven empty void on smartphone screens
  - Expanded segmented view mode switcher containers to 100% full width (`w-full sm:w-auto`) on mobile with symmetrically divided tabs (`flex-1 sm:flex-initial justify-center`), providing expansive thumb touch targets and modern mobile segmented control behavior
  - Preserved 100% byte-for-byte desktop ergonomics and pixel alignment on screens $\ge 640\text{px}$ (`sm:justify-start`, `sm:w-auto`, `sm:flex-initial`)
  - Added comprehensive TDD unit test suites in `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` (4/4 tests passing) and `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` (10/10 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-view-switcher-and-action-alignment-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-view-switcher-and-action-alignment.md`
  - Refs: `docs/adr/0061-mobile-view-switcher-full-width-and-action-row-alignment.md` (ADR-0061)
  - Gates: `npm test` 923/923 passed across 160 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (89/89 specs paired); `npm run test:smoke` 140/140 passed

- `feat(mobile)`: Mobile filter and search proportional grid layout
  - Reorganized filter dropdowns and search bar in `OutletsHeader.tsx` into a 2-row symmetrical responsive layout on mobile (< 640px):
    - Row 1: Symmetrical 50/50 2-column grid (`grid grid-cols-2 gap-2 w-full`) with `w-full sm:w-44` dropdowns for Branch and Store Type filters, eliminating right margin void
    - Row 2: Full-width search bar and reset container (`flex items-center gap-2 w-full`), expanding input to `flex-1 sm:w-52` and positioning `Reset Filters` (`shrink-0`) beside it
  - Strictly preserved 100% desktop inline layout via Tailwind responsive prefixes (`sm:flex sm:items-center sm:gap-2 sm:w-auto`, `sm:w-44`, `sm:w-52`)
  - Added unit test suite in `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` (8/8 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-filter-search-proportional-grid-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-filter-search-proportional-grid.md`
  - Refs: `docs/adr/0060-mobile-filter-and-search-proportional-grid-layout.md` (ADR-0060)
  - Gates: `npm test` 911/911 passed across 157 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (87/87 specs paired); `npm run test:smoke` 139/139 passed

- `feat(mobile)`: Mobile typographical scale and compact visual hierarchy standardization
  - Standardized mobile page headers (`OutletsHeader.tsx`, `PlacementsHeader.tsx`, `EventsHeader.tsx`):
    - Scaled page title H1 down to `text-base sm:text-xl font-bold` (16px on mobile, 20px on desktop)
    - Scaled count badge to `text-[10px] sm:text-[11px]`
    - Scaled view description subtitle to `text-[11px] sm:text-xs leading-tight sm:leading-normal`
    - Scaled action buttons (`Refresh`, `+ Add Outlet`, `Export`, `New Field Event`) to `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3.5`
    - Scaled filter dropdowns and search inputs to `h-8 sm:h-9 text-xs sm:text-sm`
    - Scaled view switcher pills to `px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs`
  - Optimized data table row density in `OutletsView.tsx`:
    - Row cell padding reduced on mobile to `py-2 sm:py-3.5 px-2.5 sm:px-3`
    - Outlet name scaled to `text-xs sm:text-sm font-semibold`
    - Outlet code scaled to `text-[10px] sm:text-xs font-mono`
  - Refined bottom navigation bar in `MobileBottomNav.tsx`:
    - Standardized tab label typography to `text-[10.5px] font-medium leading-none mt-0.5`
    - Implemented spring-driven sliding active background pill using Framer Motion `layoutId="activeMobileBottomTab"`
  - Strictly preserved 100% desktop layouts and sizing via Tailwind responsive prefixes (`<mobile> sm:<desktop>`)
  - Added dedicated test suite `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` (5/5 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-typographical-scale-and-density-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-typographical-scale-and-density.md`
  - Refs: `docs/adr/0059-mobile-typographical-scale-and-density-standardization.md` (ADR-0059)
  - Gates: `npm test` 911/911 passed across 157 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (86/86 specs paired); `npm run test:smoke` 139/139 passed

- `feat(mobile)`: Mobile shell UI/UX polish and viewport optimization
  - De-duplicated header hamburger button in `TopNav.tsx` and standardized on single canonical hamburger in `TopNavBreadcrumbs.tsx`
  - Responsive breadcrumbs in `TopNavBreadcrumbs.tsx`: displays compact `[☰ Menu] [Active View Label]` on mobile (`< 640px`)
  - Universal mobile horizontal carousel strip in `KpiSummaryCards.tsx` (`mobileStrip = true` by default)
  - Refined modern active pill styling in `MobileBottomNav.tsx` (`bg-slate-100/70 dark:bg-white/10`)
  - Edge-to-edge native sheet in `Sidebar.tsx` (`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] rounded-r-2xl border-r shadow-2xl`)
  - Added test suite `src/components/layout/MobileBottomNav.test.ts` (6/6 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-shell-ui-ux-polish-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-shell-ui-ux-polish.md`
  - Refs: `docs/adr/0058-mobile-shell-ui-ux-polish-and-viewport-optimization.md` (ADR-0058)
  - Gates: `npm test` 906/906 passed across 156 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (84/84 specs paired); `npm run test:smoke` 138/138 passed

- `feat(mobile)`: Mobile responsiveness chassis and navigation architecture
  - Implemented responsive mobile viewport chassis in `src/app/page.tsx` with dynamic padding `pb-16 md:pb-0`
  - Created standalone fixed bottom navigation bar `src/components/layout/MobileBottomNav.tsx` (< 150 LOC) with 5 primary thumb-zone tabs
  - Added test suite `src/components/layout/MobileBottomNav.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-06-mobile-responsiveness-chassis-and-navigation-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mobile-responsiveness-chassis-and-navigation.md`
  - Refs: `docs/adr/0057-mobile-responsiveness-chassis-and-navigation-architecture.md` (ADR-0057)
  - Gates: `npm test` 900/900 passed across 156 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (83/83 specs paired); `npm run test:smoke` 137/137 passed

- `feat(events)`: Field event completion unreturned equipment warning workflow and operational debt architecture
  - Extended pure logic helper `src/lib/marcom/eventEquipmentHelpers.ts` with `UnreturnedEquipmentItem` interface, `hasUnreturned: boolean`, and `unreturnedList: UnreturnedEquipmentItem[]` to detect outstanding or overdue equipment loans
  - Created interactive modal `src/components/views/EventsView/EventCompleteWarningModal.tsx` intercepting completion when active/overdue loans remain, displaying borrower contacts, item lists, and providing "Batal & Periksa Alat" or override actions
  - Integrated status interception and persistent warning banner into `EventDrawer.tsx` with smooth auto-scroll to `#borrowed-equipment-section`
  - Elevated multi-surface visibility across the system:
    - `EventCardsView.tsx`: Displays alert triangle and amber badge for completed events with unreturned equipment
    - `EventTableView.tsx`: Displays warning pill badge on event names with unreturned units
    - `Outlet360Drawer.tsx`: Renders *"Alat Belum Kembali"* pill in the Field Events tab
    - `PipelineMatrixTable.tsx`: Populates `nearestEventId` and displays unreturned equipment warning in Column 4 (Field Events)
  - Logged operational debt tag `DEBT-EVENT-LOGISTICS-001` with explicit transition criteria towards future fail-closed policy
  - Spec: `docs/superpowers/specs/2026-11-06-field-event-completion-unreturned-equipment-warning-workflow-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-field-event-completion-unreturned-equipment-warning-workflow.md`
  - Refs: `docs/adr/0054-field-event-completion-unreturned-equipment-warning-workflow.md` (ADR-0054)
  - Gates: `npm test` 899/899 passed across 155 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (82/82 specs paired); `npm run test:smoke` 137/137 passed

- `feat(inventory)`: Modular 4-step wizard stepper header for borrow request modal
  - Created modular helper `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` with SSOT step metadata (`BORROW_WIZARD_STEPS`), `BorrowWizardStepId`, pure logic guard `canAdvanceFromBorrowStep`, and reactive status calculator `getBorrowStepCompletionStatus`
  - Created visual stepper header `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` adapting Media Placement's 4-column card design with Inventory blue tokens, sequence circles, short labels, step sub-labels (*Langkah 1..4*), completion checkmarks (`Check`), and animated horizontal progress track (`(step / 4) * 100%`)
  - Mounted `<BorrowStepperHeader />` in `BorrowRequestModal.tsx` under modal title row, replacing static text badge with reactive step progress and selective backward step jumping
  - Added automated unit tests in `src/components/views/InventoryView/borrowRequestModal.test.ts` (10/10 tests passing) asserting step metadata, validation guards, completion status calculation, and host modal integration
  - Spec: `docs/superpowers/specs/2026-11-06-borrow-request-modal-stepper-header-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-borrow-request-modal-stepper-header.md`
  - Refs: `docs/adr/0055-borrow-request-modal-stepper-header.md` (ADR-0055)
  - Gates: `npm test` 897/897 passed across 155 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (82/82 specs paired); `npm run test:smoke` 137/137 passed

- `feat(outlets)`: Outlet soft-delete architecture and database restrict protection
  - Added `deletedAt DateTime?` and index `@@index([deletedAt])` to `Outlet` model in Prisma schema and SSOT types (`src/types/index.ts`)
  - Hardened database foreign key `Placement_outletId_fkey` to `ON DELETE RESTRICT ON UPDATE CASCADE` to prevent raw cascade deletions from destroying historical advertising expenditure, photos, and compliance audit trails
  - Updated `outletsSearchFilter.ts` to isolate active directories by defaulting `where.deletedAt = null` (unless `includeDeleted: true`) and enforcing `where.active = true` when `status === "APPROVED"` (operational form guard)
  - Updated `DELETE /api/marcom/outlets/[id]/route.ts` to perform pure soft-delete (`update` with `{ deletedAt: new Date(), active: false }`) and return HTTP 404 if already soft-deleted or non-existent
  - Updated `GET /api/marcom/outlets/[id]/route.ts` to return HTTP 404 for soft-deleted outlets unless `includeDeleted=true`
  - Updated `DELETE /api/marcom/outlets/route.ts` to perform batch soft-delete via `updateMany` for non-deleted records (`deletedAt: null`)
  - Added automated test suite `src/app/api/marcom/outlets/outletSoftDelete.test.ts` (6/6 tests passing) verifying single soft-delete, placement preservation, repeat delete 404, batch soft-delete, and search filter invariants
  - Updated deterministic seed in `prisma/seed.ts` with soft-deleted outlet fixture `outlet-del-999` and historical placement `plc-hist-999`
  - Spec: `docs/superpowers/specs/2026-11-06-outlet-soft-delete-and-database-restrict-protection-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-outlet-soft-delete-and-database-restrict-protection.md`
  - Refs: `docs/adr/0053-outlet-soft-delete-and-database-restrict-protection.md` (ADR-0053)
  - Gates: `npm test` 892/892 passed across 155 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (80/80 specs paired); `npm run test:smoke` 133/133 passed

- `feat(inventory)`: Inventory compensation settlement and stock restoration workflow
  - Added 6 settlement fields to `BorrowRecord` in Prisma schema & SSOT domain types (`src/types/index.ts`): `settlementType`, `settledAmount`, `settledAt`, `settledBy`, `settlementNotes`, `settlementProofUrls`
  - Exported `CompensationSettlementType` enum (`"NONE" | "CASH_TRANSFER" | "ITEM_REPLACEMENT"`) in `src/types/index.ts`
  - Created backend mutation endpoint `POST /api/marcom/inventory/borrow/[id]/settle/route.ts` with Four-Eyes RBAC guard (401 unauth, 403 staff/viewer), validation (400 bad status/type/notes, 422 empty proofs), and atomic `$transaction`
  - Implemented dual-mode stock arithmetic: `CASH_TRANSFER` maintains decommissioned afkir stock; `ITEM_REPLACEMENT` atomically restores `totalUnits` and `availableUnits` on linked `InventoryItem`
  - Created `BorrowSettlementModal.tsx` with dynamic dual-mode switch, live total afkir units calculation, and multi-file attachment deck for upload to `/api/marcom/uploads` (`kind: "inventory-proofs"`)
  - Elevated `BorrowDetailModal.tsx` with *"Selesaikan Ganti Rugi"* trigger button for pending compensation and comprehensive resolution summary card when status is `RESOLVED`
  - Added structural UI invariant test `src/components/views/InventoryView/borrowSettlementModal.test.ts` (4/4 passed) and integration tests in `inventoryApi.test.ts` (5/5 passed)
  - Updated deterministic seed in `prisma/seed.ts` with `brw-rec-005` (resolved item replacement fixture)
  - Spec: `docs/superpowers/specs/2026-11-06-inventory-compensation-settlement-and-restoration-workflow-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-inventory-compensation-settlement-and-restoration-workflow.md`
  - Refs: `docs/adr/0052-inventory-compensation-settlement-and-restoration-workflow.md` (ADR-0052)
  - Gates: `npm test` 886/886 passed across 154 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (79/79 specs paired); `npm run test:smoke` 127/127 passed

- `feat(mou)`: MoU multi-document upload, mandatory approval guard, and revision lifecycle
  - Added `REVISION` to `MouStatus` enum and `docPaths String[] @default([])` to `Mou` in Prisma schema & SSOT domain types (`src/types/index.ts`)
  - Updated state machine (`mouMachine.ts`): allowed `SUBMITTED -> APPROVED | REVISION | REJECTED | DRAFT`, `REVISION -> SUBMITTED | DRAFT`, and `REJECTED -> DRAFT`
  - Added fail-closed mandatory document guard in `PATCH /api/marcom/mous/[id]`: rejects approvals (`APPROVED` or `DONE`) without document proof with HTTP 422
  - Multi-file upload support with attachment deck and individual remove buttons in `MouFormModal.tsx`
  - Multi-sheet pager modal viewer (*"Berkas X dari Y"*) with previous/next navigation and keyboard arrows in `MouDocumentViewerModal.tsx`
  - Integrated in-place revision lifecycle actions (Minta Revisi, Submit Ulang, Kembalikan ke Draft) and disabled tooltips on unapproved buttons in `MouExpandedRow.tsx` and `MouDetailDrawer.tsx`
  - Elevated Pipeline View and Cockpit with `RotateCcw` orange badge ("Perlu Revisi" / "Revisi") and pipelineEngine strict unapproved bottleneck detection
  - Updated deterministic seed fixtures in `prisma/seed.ts` with multi-page demonstration (`mou-hlth-004`) and revision status (`mou-rev-007`)
  - Spec: `docs/superpowers/specs/2026-11-06-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md`
  - Refs: `docs/adr/0051-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md` (ADR-0051)
  - Gates: `npm test` 881/881 passed across 153 suites (0 failures); `npm run build:check` 0 errors; `npm run drift:check` clean (78/78 specs paired)

- `feat(inventory)`: Warehouse role and return inspection compensation workflow
  - Added `WAREHOUSE` to `DbUserRole` and `UserRole` SSOT union with CUD authority over inventory and zero-write in other modules
  - Enforced Four-Eyes Principle: revoked `PROCESS_RETURN` and `MANAGE_INVENTORY` permissions from `staff`
  - Added multi-unit condition breakdown columns on `BorrowItem` (`goodUnits`, `minorDamageUnits`, `majorDamageUnits`, `lostUnits`)
  - Added compensation columns on `BorrowRecord` (`compensationAmount`, `compensationStatus`, `compensationNotes`, `damagePhotos`)
  - Updated `POST /api/marcom/inventory/borrow/[id]/return` with role authorization (403 for staff), quantity sum validation (422 for mismatch), and atomic stock math decommissioning major damaged & lost units from `totalUnits`
  - Elevated `ReturnProcessModal.tsx` with 4-unit condition breakdown inputs, real-time sum validation, damage photo proofs, and compensation inputs
  - Elevated `BorrowDetailModal.tsx` with compensation liability badge, details card, and damage photos gallery
  - Added `Warehouse` option to `UserRoleSelect.tsx`
  - Added comprehensive automated unit, integration, and structural regression tests
  - Spec: `docs/superpowers/specs/2026-11-06-warehouse-role-and-return-inspection-compensation-workflow-design.md`
  - Plan: `docs/superpowers/plans/2026-11-06-warehouse-role-and-return-inspection-compensation-workflow.md`
  - Refs: `docs/adr/0050-warehouse-role-and-return-inspection-compensation-workflow.md` (ADR-0050)
  - Gates: `npm test` 877/877 passed across 153 suites; `npm run build:check` 0 errors; `npm run drift:check` clean (77/77 specs paired)

## [2026-11-05]

- `fix(marcom)`: Restrict operational form outlet selection to approved stores
  - Added pre-insert verification in `POST /api/marcom/placements` rejecting unapproved/rejected stores with HTTP 400
  - Scoped `OutletSearchCombobox` to query `/api/marcom/outlets?status=APPROVED`
  - Restricted `EventCreateModal`, `EventDrawer`, and `ContentPostModal` to fetch `/api/marcom/outlets?status=APPROVED`
  - Filtered `outletsList` in `MousView.tsx` to `status === "APPROVED"` before passing to `MouFormModal`
  - Added automated unit and structural tests in `placementOutletGuard.test.ts` and `operationalOutletFilter.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-filter-approved-outlets-in-operational-forms-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-filter-approved-outlets-in-operational-forms.md`
  - Refs: `docs/adr/0049-filter-approved-outlets-in-operational-forms.md` (ADR-0049)
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean (76/76 specs paired)

- `fix(auth)`: Hard browser redirect to login page on sign-out
  - Replaced Next.js soft navigation (`router.push('/login')` + `router.refresh()`) with `window.location.href = "/login"` in `UserMenuDropdown.tsx`
  - Flushed client-side in-memory Zustand and RSC caches, preventing fallback "Pengguna VIEWER" state on sign-out
  - Added tactile `Loader2` spinning indicator and "Keluar..." label with click protection (`disabled`, `pointer-events-none`)
  - Added automated unit test contract in `src/components/layout/userMenuSignOut.test.ts` (4/4 passed)
  - Spec: `docs/superpowers/specs/2026-11-05-hard-browser-redirect-on-signout-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-hard-browser-redirect-on-signout.md`
  - Refs: `docs/adr/0048-hard-browser-redirect-on-signout.md` (ADR-0048)
  - Gates: `npm test` 860/860 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (75/75 specs paired)

- `style(layout)`: Relocate export center button from top nav to more apps menu
  - Removed redundant Export Center download button from `src/components/layout/TopNav.tsx` to declutter the top bar
  - Removed unused `Download` icon import and `setExportCenterOpen` selector from `TopNav.tsx`
  - Consolidated off-canvas global export access inside the Global Rail's "More" popover (`MoreAppsMenu.tsx`) under Main Tools
  - Added automated regression assertions in `src/components/modals/MoreAppsMenu.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-relocate-export-center-to-more-apps-menu-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-relocate-export-center-to-more-apps-menu.md`
  - Refs: `docs/adr/0047-relocate-export-center-to-more-apps-menu.md` (ADR-0047)
  - Gates: `npm test` 856/856 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (74/74 specs paired)

- `fix(rbac)`: Centralize outlet approval exclusively to super admin
  - Removed `"APPROVE_OUTLET"` permission from `rolePermissions.supervisor` in `src/lib/marcom/guards.ts`
  - Enforced strict fail-closed boundary for `APPROVE_OUTLET` in `hasScopedPermission` reserving outlet approvals exclusively for Super Admin
  - Updated queue fallback label in `OutletApprovalQueueTab.tsx` to *"Hanya Super Admin yang dapat menyetujui outlet"*
  - Updated unit tests in `src/lib/marcom/guards.test.ts` to assert supervisors and staff cannot approve outlets across any branch
  - Spec: `docs/superpowers/specs/2026-11-05-centralize-outlet-approval-to-super-admin-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-centralize-outlet-approval-to-super-admin.md`
  - Refs: `docs/adr/0046-centralize-outlet-approval-to-super-admin.md` (ADR-0046)
  - Gates: `npm test` 855/855 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (73/73 specs paired)

- `fix(rbac)`: Revoke outlet draft creation access from staff role
  - Removed `"SUBMIT_DRAFT_OUTLET"` permission from `rolePermissions.staff` in `src/lib/marcom/guards.ts`
  - Updated `canAddOutlet` in `OutletsView.tsx` to derive strictly from `can("SUBMIT_DRAFT_OUTLET")`, hiding "+ Tambah Outlet" from staff users
  - Updated `OutletExpandedRow.tsx` to require `canManage` (Admin only) for the "Edit Outlet" button instead of `canAddOutlet`
  - Automated unit test assertion in `guards.test.ts` verifying staff cannot submit draft outlets or approve outlets
  - Spec: `docs/superpowers/specs/2026-11-05-revoke-outlet-creation-access-from-staff-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-revoke-outlet-creation-access-from-staff.md`
  - Refs: `docs/adr/0045-revoke-outlet-creation-access-from-staff.md` (ADR-0045)
  - Gates: `npm test` 855/855 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (72/72 specs paired)

- `feat(auth)`: Add loading spinner transition to auth switch links
  - Created reusable `AuthSwitchLink` component wrapping React 19 `useTransition` and Next.js 15 `useRouter`
  - Rendered inline spinning `Loader2` and transition text ("Membuka pendaftaran..." / "Membuka halaman masuk...") immediately upon click
  - Blocked repeated clicks and double navigations via `disabled={isPending}` and `pointer-events-none`
  - Integrated `AuthSwitchLink` into `LoginForm` and `RegisterForm`, matching existing teal typography and focus ring design tokens
  - Added automated unit & integration tests in `src/components/auth/authSwitchLink.test.ts` (7/7 passing)
  - Spec: `docs/superpowers/specs/2026-11-05-auth-page-transition-loading-feedback-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-auth-page-transition-loading-feedback.md`
  - Refs: `docs/adr/0044-auth-page-transition-loading-feedback.md` (ADR-0044)
  - Gates: `npm test` 855/855 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (71/71 specs paired)

- `feat(auth)`: Add operational branch selection via CustomDropdown on register
  - Pre-fetched active branches during SSR in `RegisterPage` Server Component via Prisma (`findMany`)
  - Rendered searchable `CustomDropdown<string>` (`size="md"`, `direction="auto"`) for branch assignment in `RegisterForm`
  - Enforced client and server Zod validation requiring `branchId` with existence check against database
  - Initialized pending user `assignedBranchIds` with selected branch upon registration
  - Added unit and invariant tests in `src/app/api/auth/register/registerRoute.test.ts` (7/7 passing)
  - Spec: `docs/superpowers/specs/2026-11-05-registration-branch-selection-custom-dropdown-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-registration-branch-selection-custom-dropdown.md`
  - Refs: `docs/adr/0043-registration-branch-selection-custom-dropdown.md` (ADR-0043)
  - Gates: `npm test` 848/848 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (70/70 specs paired)

- `feat(inventory)`: Comprehensive UX polish and CustomDropdown for BorrowRequestModal
  - Replaced unstyled HTML `<select>` with searchable `CustomDropdown<string>` (`size="md"`, `direction="auto"`) for Field Event linking
  - Added dedicated "Clear link" action and real-time duration counter pill
  - Auto-filled `borrowerName` from session user (`useSession`) and eliminated redundant `borrowerDivision` input
  - Added horizontal category filter chips (`EQUIPMENT_CATEGORIES`) and unit quantity stepper buttons (`-` / `+`) on Step 3
  - Modernized review step (Step 4) with structured 2-column card layout and double-submission loading guard
  - Added automated invariant and unit tests in `src/components/views/InventoryView/borrowRequestModal.test.ts` (5/5 passing)
  - Spec: `docs/superpowers/specs/2026-11-05-borrow-request-modal-comprehensive-polish-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-borrow-request-modal-comprehensive-polish.md`
  - Refs: `docs/adr/0042-borrow-request-modal-comprehensive-polish.md` (ADR-0042)
  - Gates: `npm test` 841/841 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (69/69 specs paired)

- `feat(inventory)`: Standardize InventoryItemFormModal with CustomDropdown
  - Replaced unstyled HTML select elements for Category and Status with canonical CustomDropdown
  - Aligned dropdown dimensions (`size="md"`, `min-h-[36px]`) with sibling form text inputs
  - Enforced strong typing for `EquipmentStatus` and `EQUIPMENT_CATEGORIES` options
  - Added automated unit and architectural invariant tests in `src/components/views/InventoryView/inventoryItemFormModal.test.ts` (4/4 passing)
  - Spec: `docs/superpowers/specs/2026-11-05-inventory-item-form-custom-dropdowns-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-inventory-item-form-custom-dropdowns.md`
  - Refs: `docs/adr/0041-inventory-item-form-custom-dropdowns.md` (ADR-0041)
  - Gates: `npm test` 836/836 passed; `npm run build:check` 0 errors; `npm run drift:check` clean (68/68 specs paired)


- `feat(ui)`: Standardized ConfirmDialog component and inventory deletion integration
  - Created reusable `src/components/ui/ConfirmDialog.tsx` wrapping the native HTML `<dialog>` `Modal` primitive
  - Integrated `ConfirmDialog` into `InventoryView.tsx`, completely eliminating browser-native `window.confirm`
  - Added danger styling (`destructive` confirm button, red alert icon, soft red icon backdrop) and cancel fallback
  - Added contextual `itemDetails` preview card showing item code, equipment name, and category badge
  - Added loading indicator (`Loader2` spinner) with double-submission lock during async deletion
  - Added automated unit tests in `src/components/ui/confirmDialog.test.ts` (3/3 passing) and `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` (3/3 passing)
  - Spec: `docs/superpowers/specs/2026-11-05-standardized-confirm-dialog-component-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-standardized-confirm-dialog-component.md`
  - Refs: `docs/adr/0040-standardized-confirm-dialog-component.md`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean (67/67 specs paired)

- `style(inventory)`: Swap table and card view switcher positions and default to table
  - Swapped view switcher button order: Table View on the left, Card / Grid View on the right in `InventoryHeaderKpis.tsx`
  - Swapped switcher container and active pill styling: container uses `bg-slate-100 dark:bg-slate-800`, active pill uses `bg-white dark:bg-slate-900 rounded shadow-xs`
  - Set default `catalogViewMode` to `"table"` in `InventoryView.tsx`
  - Added automated unit tests in `src/components/views/InventoryView/inventoryViewMode.test.ts` (3/3 tests passing)

- `feat(ui)`: Standardize z-index stacking hierarchy and isolate table shells
  - Enforced CSS stacking context isolation (`isolation: isolate`) on `MarcomTableShell.tsx` and `MousView.tsx` to prevent sticky table headers and action cells from bleeding outside tables
  - Elevated active `CustomDropdown` container to `z-50` when `isOpen` is true
  - Coordinated all 12 Marcom view headers to `relative z-30` and elevated global `TopNav.tsx` to `relative z-40`
  - Documented Canonical 7-Layer Z-Index Stacking Hierarchy in `docs/architecture-system-invariants.md`
  - Added automated unit tests in `src/components/ui/customDropdownZIndex.test.ts` (5/5 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-05-z-index-stacking-context-standardization-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-z-index-stacking-context-standardization.md`
  - Refs: `docs/adr/0039-z-index-stacking-context-standardization.md`
  - Gates: `npm test` passed (826/826 tests); `npm run build:check` 0 errors; `npm run drift:check` clean (66/66 specs paired)


- `feat(mous)`: Row-scoped loading animation & state guard for MOU quick approve
  - Added visual loading feedback (`<RefreshCw className="animate-spin" />` and `"Menyetujui..."`) to the Quick Approve button in the MOUs table
  - Introduced double-submission protection (`disabled={isApproving}`) to eliminate duplicate approval requests and race conditions
  - Wrapped status transition in `try ... finally { setApprovingMouId(null); }` to guarantee immediate UI recovery on network failure or automation exception
  - Added unit test in `src/components/views/MousView/mouColumns.test.ts` (6/6 tests passing)
  - Spec: `docs/superpowers/specs/2026-11-05-mou-table-quick-approve-loading-animation-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-mou-table-quick-approve-loading-animation.md`
  - Refs: `docs/adr/0038-mou-table-quick-approve-loading-animation.md`
  - Gates: `npm test` passed (818/818 tests); `npm run build:check` 0 errors; `npm run drift:check` clean (65/65 specs paired)


- `fix(mous)`: Eliminate transparency on hovered sticky columns in MarcomTableShell
  - Replaced semi-transparent background hover classes (`group-hover:bg-slate-50/80`, `dark:group-hover:bg-slate-800/40`) with 100% solid opaque backgrounds (`group-hover:bg-slate-50`, `dark:group-hover:bg-[#202124]`)
  - Replaced semi-transparent selected row backgrounds with solid opaque teal fills to prevent horizontally scrolled content from bleeding through sticky columns
  - Added test assertion in `src/components/views/MousView/mouColumns.test.ts`
  - Refs: ADR-0030

- `style(documents)`: Remove redundant preview eye icon button from document cards
  - Cleaned up footer action bar in `DocumentCardsView.tsx` by removing redundant `Eye` button
  - Preserved root card clickability opening document preview drawer

- `feat(ui)`: Standardize modal and drawer form dropdowns with CustomDropdown
  - Replaced native unstyled HTML `<select>` elements with canonical `CustomDropdown` across `EventDrawer.tsx`, `EventCreateModal.tsx`, and `ContentPostModal.tsx`
  - Enabled real-time search filtering (`searchable={true}`) for Outlets and Person in Charge (PIC) pickers to streamline store selection across hundreds of records
  - Standardized form input sizing using `size="md"` (`min-h-[36px]`) to align with sibling text and number inputs
  - Preserved all interactive form side-effects: venue location autofill, checklist template generator, and custom PIC name text input reveal
  - Added unit test suite in `src/components/views/EventsView/eventDrawerCustomDropdown.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns.md`
  - Refs: `docs/adr/0037-standardize-event-and-content-modal-drawer-custom-dropdowns.md`
  - Gates: `npm test` passed (817/817 tests); `npm run build:check` 0 errors; `npm run drift:check` clean (64/64 specs paired)

- `feat(reports)`: Automated daily rolling sync & monthly report creation via Vercel Cron
  - Configured Vercel serverless cron job schedule (`0 17 * * *`) in root `vercel.json` targeting `/api/cron/reports-sync`
  - Created secure App Router route handler `src/app/api/cron/reports-sync/route.ts` enforcing `CRON_SECRET` authorization check
  - Built domain sync engine `src/lib/marcom/monthlyReportSync.ts` automating monthly report kickoff on period rollover and daily metric refresh
  - Implemented human-in-the-loop protection via `hasCustomNarratives` to strictly preserve custom admin entries in `achievements`, `keyIssues`, and `actionPlans`
  - Added unit and route tests in `src/lib/marcom/monthlyReportSync.test.ts` and `src/app/api/cron/reportsSyncRoute.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron.md`
  - Refs: `docs/adr/0036-automated-daily-sync-and-monthly-report-creation-cron.md`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(reports)`: Reports expanded row modular card grid styling & atomic extraction
  - Extracted inline expanded row markup from coordinator `ReportsView.tsx` into atomic subcomponent `MonthlyReportExpandedRow.tsx` (reduced coordinator file size by 84 LOC)
  - Designed responsive 2x2 modular card grid (`Aktivitas Operasional`, `Capaian Utama`, `Kendala & Isu Lapangan`, `Rencana Tindak Lanjut`) with themed icons (`Layers`, `CheckCircle2`, `AlertTriangle`, `ArrowUpRight`) and count pill badges
  - Implemented `parseActivityDisplay` to parse concatenated activity strings into structured category pills (`POSM`, `MOU`, `CONTENT`, `EVENT`), clean titles, and distinct subtext
  - Styled supporting documents strip as elevated file cards with `FileText` icons, truncated titles, uppercase format badges, and direct external links
  - Added unit test coverage in `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-reports-expanded-row-modular-card-grid-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-reports-expanded-row-modular-card-grid.md`
  - Refs: `docs/adr/0035-reports-expanded-row-modular-card-grid.md`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(reports)`: Professional executive PDF editorial layout and anti-AI-slop redesign
  - Removed all emojis (🏆, ⚠️, 🎯, 📋) and pastel alert callout boxes (`.box-green`, `.box-amber`, `.box-blue`)
  - Integrated high-density Executive Scorecard Bar bordered by hairline rules
  - Added corporate masthead with organization name "Vrello Up", official document registration number, and confidentiality badge
  - Stripped bracket prefixes (`[POSM]`, `[MOU]`, etc.) from activity titles and standardized dates to `DD/MM/YYYY`
  - Refined zero-completion achievement phrasing to sound natural and operational
  - Spec: `docs/superpowers/specs/2026-11-05-professional-executive-pdf-editorial-layout-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-professional-executive-pdf-editorial-layout.md`
  - Refs: `docs/adr/0034-professional-executive-pdf-editorial-layout.md`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(navigation)`: Integrate Export Center into MoreAppsMenu
  - Added Export Center action button with `FileSpreadsheet` icon and "CSV / PDF" badge into Main Tools in `src/components/modals/MoreAppsMenu.tsx`
  - Ingested `setExportCenterOpen` from workspace store to launch global tabular Export Center modal
  - Preserved contextual Export Center button in `ReportsHeader.tsx` on Reports page
  - Added automated unit test coverage in `src/components/modals/MoreAppsMenu.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-integrate-export-center-into-more-apps-menu-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-integrate-export-center-into-more-apps-menu.md`
  - Refs: `docs/adr/0033-integrate-export-center-into-more-apps-menu.md`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `fix(notifications)`: Proactively fetch notification feed on mount and window focus
  - Created `useNotificationFeed.ts` hook providing immediate initial mount fetch, window focus synchronization, and panel refresh
  - Delegated notification data fetching in `NotificationCenter.tsx` to `useNotificationFeed`
  - Eliminated lazy `if (!isOpen) return;` guard so unread badge renders accurately on page load
  - Added unit test coverage in `src/lib/productivity/useNotificationFeed.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-top-nav-notification-feed-lifecycle-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-top-nav-notification-feed-lifecycle.md`
  - Refs: `docs/adr/0032-top-nav-notification-feed-lifecycle.md`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `refactor(navigation)`: Remove redundant dark mode toggle from MoreAppsMenu
  - Deleted dark mode toggle button and `next-themes` dependency from `src/components/modals/MoreAppsMenu.tsx`
  - Theme toggling remains natively available via TopNav `<ThemeToggle />`
  - Updated unit test assertions in `src/components/modals/MoreAppsMenu.test.ts`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `refactor(modals)`: Migrate Backup & Data to More Apps Menu and eliminate SettingsModal
  - Integrated JSON Export and JSON Import into `src/components/modals/MoreAppsMenu.tsx` with hidden file picker and restore confirmation
  - Deleted redundant "New Task" button from `MoreAppsMenu.tsx`
  - Completely deleted `src/components/modals/SettingsModal.tsx` (~279 LOC eliminated)
  - Removed settings gear button, `SettingsModal` import, and `isSettingsOpen` state from `src/components/layout/Sidebar.tsx`
  - Added full test coverage in `src/components/modals/MoreAppsMenu.test.ts`
  - Spec: `docs/superpowers/specs/2026-11-05-migrate-backup-data-to-more-and-eliminate-settings-design.md`
  - Plan: `docs/superpowers/plans/2026-11-05-migrate-backup-data-to-more-and-eliminate-settings.md`
  - Refs: `docs/adr/0031-migrate-backup-data-to-more-and-eliminate-settings-modal.md`
  - Gates: `npm test` (789 passed, 0 failures); `npm run build:check` (0 errors); `npm run drift:check` (clean)

- `refactor(navigation)`: Remove redundant Quick Views section from MoreAppsMenu
  - Eliminated Quick Views section (Home, List, Kanban Board, Calendar) from `MoreAppsMenu.tsx`
  - Cleaned unused icon imports and `handleLaunchView`
  - Added unit test coverage in `src/components/modals/MoreAppsMenu.test.ts`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(users)`: Make branch pills clickable to open branch assignment modal
  - Converted branch badge pills in `UserActiveRow.tsx` into interactive buttons opening `UserBranchSelectModal`
  - Added hover and focus feedback styles (`hover:bg-primary/20 hover:border-primary/30 cursor-pointer`)
  - Added automated unit test assertion in `src/components/views/UsersView/userBranchAssignment.test.ts`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(users)`: Make branch pills clickable to open branch assignment modal
  - Converted branch badge pills in `UserActiveRow.tsx` into interactive buttons opening `UserBranchSelectModal`
  - Added hover and focus feedback styles (`hover:bg-primary/20 hover:border-primary/30 cursor-pointer`)
  - Added automated unit test assertion in `src/components/views/UsersView/userBranchAssignment.test.ts`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `style(profile)`: Remove redundant user name badge from ProfileHeader
  - Removed `{userName}` pill badge next to "Profil & Keamanan Akun" title in `ProfileHeader.tsx`
  - Cleaned unused `userName` prop from `ProfileHeaderProps` and `ProfileView.tsx`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(mous)`: Sticky right columns for MOU document and actions
  - Added declarative `MarcomColumnMeta` support in `MarcomTableShell.tsx` with sticky right positioning, solid backgrounds, right padding, and shadow borders
  - Configured sticky right with 130px offset and left border on MOU document column (size: 165px)
  - Configured sticky right with 0px offset on actions column (size: 130px) to prevent action button clipping and overlap
  - Added automated test in `src/components/views/MousView/mouColumns.test.ts`
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-05-mou-table-sticky-right-columns-design.md
  Plan: docs/superpowers/plans/2026-11-05-mou-table-sticky-right-columns.md
  Refs: docs/adr/0030-mou-table-sticky-right-columns.md

- `feat(mous)`: Eliminate Google Drive from MOUs and standardize on Supabase Storage
  - Cleaned `mouDocumentHelpers.ts` to strictly parse internal documents (`INTERNAL_PDF`, `INTERNAL_IMAGE`, `EMPTY`), removing `isGoogleDrive`, `EXTERNAL_URL`, and `isExternalUrl`
  - Replaced raw URL text input in `MouFormModal.tsx` with clean Active Document Card supporting Pratinjau, Ganti, and Hapus actions
  - Cleaned external Google Drive card fallback in `MouDocumentViewerModal.tsx`
  - Cleaned `mouColumns.tsx` document button styling
  - Replaced all dummy Google Drive links in `prisma/seed.ts` with official corporate internal PDF URLs and re-seeded database
  - Updated unit tests in `src/components/views/MousView/mouDocumentHelpers.test.ts` (10 passed, 0 failures)
  - Gates: `npm test` passed; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-05-eliminate-google-drive-from-mous-design.md
  Plan: docs/superpowers/plans/2026-11-05-eliminate-google-drive-from-mous.md
  Refs: docs/adr/0029-eliminate-google-drive-from-mous.md

- `feat(content)`: Extract and integrate ContentMediaSection into ContentPostModal
  - Created standalone atomic `ContentMediaSection.tsx` component with Google Drive direct upload, streaming progress bar, 16:9 showcase banner, play overlay, and drag-and-drop attachment reordering
  - Replaced inline legacy media markup in `ContentPostModal.tsx`, reducing file size from 489 LOC down to 321 LOC
  - Cleaned redundant drag-and-drop helpers and unused icons from `ContentPostModal.tsx`
  - Added unit test coverage in `src/components/views/ContentPlannerView/contentCardStyling.test.ts`
  - Recorded technical debt `DEBT-CP-001` for future drawer media alignment
  - Gates: `npm test` 780 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-05-content-post-modal-media-section-design.md
  Plan: docs/superpowers/plans/2026-11-05-content-post-modal-media-section.md
  Refs: docs/adr/0028-content-post-modal-media-section.md

- `feat(events)`: Integrate EventMediaSection into EventCreateModal
  - Integrated `EventMediaSection` sub-component into `EventCreateModal.tsx` between notes and checklist
  - Added `mediaAttachments` and `mediaUrl` local state management with clean form reset semantics
  - Synchronized `mediaAttachments` and `mediaUrl` with `POST /api/marcom/events` payload and `onCreated` callback
  - Added unit test coverage in `src/components/views/EventsView/eventDrawer.test.ts`
  - Gates: `npm test` 778 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-05-event-create-modal-media-attachments-design.md
  Plan: docs/superpowers/plans/2026-11-05-event-create-modal-media-attachments.md
  Refs: docs/adr/0027-event-create-modal-media-attachments.md

- `feat(documents)`: Documents side drawer deep linking via URL query parameter (docId)
  - Added `docId` parsing, serialization, and `buildShareableDocumentUrl` in `src/lib/router/urlState.ts`
  - Integrated auto-hydration in `DocumentsView.tsx` opening target drawer from `?docId=...`
  - Synchronized drawer state with browser URL via `replaceState` and added `popstate` support
  - Updated card and drawer copy buttons to share canonical deep links and wrapped card button in `<a>` tag
  - Removed obsolete "Lokasi: Cloud / Google Drive" & "Internal Server Storage" badge from `DocumentDrawer.tsx`
  - Restyled file replacement bar in `DocumentDrawer.tsx` to match Content Planner attachment style
  - Added unit test coverage in `urlState.test.ts` and `documentDrawer.test.ts`
  - Gates: `npm test` 778 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-05-documents-deep-linking-design.md
  Plan: docs/superpowers/plans/2026-11-05-documents-deep-linking.md
  Refs: docs/adr/0026-documents-deep-linking-drawer.md

- `refactor(documents)`: Eliminate legacy Drive/Cloud badges and standardize Documents KPIs
  - Removed obsolete Drive/Cloud and Server Local badges from `DocumentCardsView.tsx` footer
  - Removed Cloud/HardDrive storage icons from `DocumentsView.tsx` table rows
  - Standardized KPI Card 3 to "Ragam Kategori" displaying total category diversity and dominant category
  - Cleaned unused icon imports and helper calls
  - Added unit test assertion in `documentDrawer.test.ts` (9 passed, 0 failures)
  Spec: docs/superpowers/specs/2026-11-05-eliminate-document-status-design.md
  Plan: docs/superpowers/plans/2026-11-05-eliminate-document-status.md
  Refs: docs/adr/0025-eliminate-document-status-overengineering.md

- `refactor(documents)`: Complete elimination of document status and Supabase Storage focus
  - Removed `status` column from `DocumentItem` PostgreSQL schema and Prisma client
  - Cleaned `prisma/seed.ts` removing ad-hoc status attributes from document seed catalog
  - Removed `DocumentStatus` and `DocumentItem.status` from SSoT (`src/types/index.ts`)
  - Deleted obsolete `src/lib/marcom/documentTaxonomy.ts` and test file
  - Removed status handling from REST API endpoints (`/api/marcom/documents` and `[id]`)
  - Removed status from `DocumentDrawer`, `DocumentCreateModal`, and `DocumentCardsView`
  - Updated `DocumentsView` KPI Card 3 to "Penyimpanan Cloud" (cloud vs local metrics)
  - Re-seeded database and verified with full test suite (774 passed, 0 failures)
  Spec: docs/superpowers/specs/2026-11-05-eliminate-document-status-design.md
  Plan: docs/superpowers/plans/2026-11-05-eliminate-document-status.md
  Refs: docs/adr/0025-eliminate-document-status-overengineering.md

- `feat(documents)`: Documents Detail & Edit Drawer with focused creation modal
  - Created `DocumentCreateModal.tsx` centered kickoff dialog for uploading new assets cleanly
  - Created `DocumentDrawer.tsx` 560px slide-over right drawer combining live multi-format media preview (PDF, MP4, images, office/archives), file replacement, and metadata editing
  - Modernized `DocumentsView.tsx` coordinator, dropping LOC by ~400 lines (from 809 to 409 lines)
  - Wired document cards in `DocumentCardsView.tsx` and table rows in `MarcomTableShell` to `onSelectDocument`
  - Decommissioned obsolete `DocumentPreviewModal.tsx` and eliminated modal hopping
  - Added unit test suite `src/components/views/DocumentsView/documentDrawer.test.ts` (7 passing tests)
  - Gates: `npm test` 775 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-05-documents-detail-edit-drawer-design.md
  Plan: docs/superpowers/plans/2026-11-05-documents-detail-edit-drawer.md
  Refs: docs/adr/0024-documents-detail-edit-drawer.md

## [2026-11-04]

- `feat(events)`: Thumbnail compression & cover preview in EventDrawer
  - Added optional `context: "events"` parameter in `/api/marcom/drive/upload` to store thumbnails in `thumbnails/events/...`
  - Integrated 16:9 aspect-video cover preview showcase banner with play overlay
  - Added 36x36 square WebP thumbnails, 6-dot drag reordering, and one-click "Cover" selector
  - Replaced unoptimized `<img>` and raw `<video>` in `EventCardsView` with edge-cached WebP thumbnails and video poster cards
  - Enforced zero Google Drive thumbnail embeds across Field Events UI
  - Added unit test suite `src/components/views/EventsView/eventThumbnails.test.ts` (5 passing tests)
  - Gates: `npm test` 763 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-04-field-event-thumbnails-design.md
  Plan: docs/superpowers/plans/2026-11-04-field-event-thumbnails.md
  Refs: docs/adr/0023-field-event-thumbnail-generation-cover-preview.md

- `feat(events)`: Separate Field Event edit drawer and creation modal
  - Created `EventCreateModal.tsx` centered dialog for fast creation flow
  - Created `EventDrawer.tsx` 560px slide-over right panel for deep inspection and editing
  - Integrated `EventMediaSection`, `EventBorrowedEquipmentSection`, and `EventChecklistSection` inside drawer
  - Updated `EventsView.tsx`, `ProjectsCreateModalHost.tsx`, and `ProjectsDetailDrawerHost.tsx` (maintaining <= 250 LOC)
  - Decommissioned monolithic 950-line `EventFormModal.tsx`
  - Added unit test suite `src/components/views/EventsView/eventDrawer.test.ts` (7 passing tests)
  - Gates: `npm test` 758 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: docs/superpowers/specs/2026-11-04-field-event-edit-drawer-design.md
  Plan: docs/superpowers/plans/2026-11-04-field-event-edit-drawer.md
  Refs: docs/adr/0022-field-event-edit-drawer.md

## [2026-11-03]

- `refactor(content)`: Decouple cover selection from attachment array reordering
  - Updated cover selection to update `mediaUrl` directly instead of mutating and reordering the `mediaAttachments` array
  - Preserved original upload sequence in the attachment list across both `ContentDrawer` and `ContentPostModal`
  - Resolved active cover attachment and thumbnail via URL matching (`mediaAttachments.find(a => a.url === mediaUrl) || mediaAttachments[0]`)
  - Gates: `npm test` 743 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(content)`: Add thin green (New) indicator for unsaved uploaded media in ContentDrawer
  - Added thin green `(New)` indicator right after the file size for media attachments uploaded in the active drawer session
  - Synchronized `savedAttachmentIds` with drawer open state and automatically cleared `(New)` status upon clicking "Simpan Perubahan"
  - Gates: `npm test` 743 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `refactor(content)`: Simplify media upload entry points in ContentDrawer
  - Simplified `GoogleDriveLinkModal` to an upload-only modal by removing the URL paste tab and segmented control
  - Routed "Upload dari Perangkat" buttons directly to the multi-file `GoogleDriveLinkModal`
  - Removed "Link Drive" buttons and raw URL input fields from ContentDrawer
  - Re-wired "Ganti" button in media-set view to open the upload modal in replacement mode
  - Gates: `npm test` 743 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-simplify-media-upload-entry-points.md`

- `feat(content)`: Thumbnail generation via Sharp and Supabase Storage
  - Configured public bucket `content-thumbnails` in Supabase Storage with WebP optimization and CDN caching
  - Generated compressed WebP thumbnails (<=800px width, q=75) server-side via `sharp` during device upload
  - Stored thumbnail URL on `TaskAttachment.thumbnailUrl` without altering original full-resolution files in Google Drive
  - Prioritized `thumbnailUrl` in Content Planner card previews and drawer cover player over placeholder
  - Added "Cover" action button in `ContentDrawer` attachment list to easily reorder cover attachment
  - Gates: `npm test` 743 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-03-thumbnail-generation-supabase-storage.md`
  Plan: `docs/superpowers/plans/2026-11-03-thumbnail-generation-supabase-storage.md`
  Refs: `docs/adr/0018-thumbnail-generation-supabase-storage.md`

- `feat(ui)`: Add countdown timer progress bar to toast notifications
  - Added bottom progress bar (`height: 2px; opacity: 0.45; background: currentColor`) to `[data-sonner-toast]` in `src/app/globals.css`
  - Explicitly aligned `<Toaster duration={4000} />` in `src/app/layout.tsx` to CSS 4000ms countdown animation
  - Added hover pause behavior (`animation-play-state: paused`) matching Sonner auto-dismiss timer pause, and respected `prefers-reduced-motion`
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-toast-timer-progress-bar.md`

- `fix(ui)`: Relocate global toast notification stack to top-right
  - Changed `<Toaster>` position in `src/app/layout.tsx` from `bottom-right` to `top-right`
  - Prevents toasts from blocking primary bottom action buttons ("Simpan Perubahan", "Hapus Post") in ContentDrawer
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-fix-toast-position-top-right.md`

- `fix(content)`: Include mediaAttachments in ContentPlannerView handleDrawerUpdate payload
  - Resolved bug where multi-file uploads saved in ContentDrawer were omitted from the PATCH body
  - Added `mediaAttachments: updated.mediaAttachments ?? []` to PATCH payload in `ContentPlannerView.tsx`
  - Restored multi-file persistence in PostgreSQL and fixed card thumbnail click lightbox navigation
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-fix-media-attachments-not-saving.md`

- `feat(content)`: Multi-file media UI adaptation across Content Planner surfaces
  - Refactored `previewMedia` state to support `attachments: TaskAttachment[]` and `currentIndex: number`
  - Added full multi-file carousel navigation to lightbox modal: ArrowLeft/ArrowRight keyboard listeners, edge prev/next buttons, dot indicators, and file counter
  - Updated `ContentDrawer` to pass full attachment lists and jump to clicked attachment index
  - Added `+N` badge to calendar/list post thumbnails and multi-file count indicator (`🖼 N`) on Kanban board cards
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-03-multi-file-media-ui-adaptation.md`
  Plan: `docs/superpowers/plans/2026-11-03-multi-file-media-ui-adaptation.md`
  Refs: `docs/adr/0017-multi-file-media-ui-adaptation.md`

- `fix(content)`: Enable multi-file device upload and drag-and-drop in ContentDrawer
  - Added `multiple` attribute to `<input type="file">` enabling multi-selection in OS file dialog
  - Updated `onChange` and `handleDrop` to process all dropped/selected files sequentially via `for...of` queue
  - Ensured each uploaded file appends to `mediaAttachments` and synchronizes with cover `mediaUrl`
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-fix-drawer-multi-file-device-upload.md`

- `feat(content)`: Multi-file media upload in ContentPostModal creation flow
  - Replaced isolated single-file upload hook in `ContentPostModal.tsx` with shared `onOpenUploadModal`
  - Added attachment list preview with type icons, sizes, cover badge, and individual deletion
  - Wired `mediaAttachments` into post creation form state and POST payload in `ContentPlannerView.tsx`
  - Safeguarded optional prop signatures for cross-view callers (`ProjectsCreateModalHost.tsx`)
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-multi-file-upload-create-modal.md`

- `fix(db)`: Resolve Prisma migration history drift and reconcile schema tracking
  - Reconciled `_prisma_migrations` tracking table on Supabase PostgreSQL
  - Resolved and marked all 5 historical migrations as applied (`20260906221636_marcom_port`, `20261027000000_remove_workspace_tenant`, `20261029072742_add_user_auth_model`, `20261029134026_drop_task_models`, `20261030192500_add_inventory_system`)
  - Created and resolved `20261103000000_add_media_attachments/migration.sql` for `mediaAttachments` JSONB column
  - Verified `npx prisma migrate status` reports 6 migrations applied, schema up to date
  - Gates: `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-03-fix-prisma-migration-drift.md`

- `feat(content)`: Multi-file media upload and attachments management for content posts
  - Authored ADR 16 (`docs/adr/0016-multi-file-media-upload-content-post.md`) establishing multi-file media storage via JSON column while keeping `mediaUrl` as primary cover URL
  - Updated Prisma schema with `ContentPost.mediaAttachments Json @default("[]")` and applied to PostgreSQL
  - Updated domain SSOT interface `ContentPostItem` in `src/types/index.ts` with `mediaAttachments?: TaskAttachment[]`
  - Extended API routes `POST /api/marcom/content` and `PATCH /api/marcom/content/[id]` with array validation for `mediaAttachments`
  - Rewrote `GoogleDriveLinkModal.tsx` to support continuous multi-file uploads (up to 10 files) with file list, formatted sizes, per-item remove, and batch confirmation
  - Preserved backward compatibility in `useGoogleDrivePicker.ts` (`TaskAttachment[] | string`)
  - Updated `ContentDrawer.tsx` to display multi-media list with "Cover" badge, automatic cover promotion on delete, and synchronization with `mediaUrl`
  - Gates: `npm test` 742 pass / 0 fail; `npm run test:smoke` 101 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-03-multi-file-media-upload-design.md`
  Plan: `docs/superpowers/plans/2026-11-03-multi-file-media-upload.md`
  Refs: `docs/adr/0016-multi-file-media-upload-content-post.md`

## [2026-11-02]

- `fix(users)`: Branch assignment UX and accessibility fixes
  - Implemented FIX-1: Converted visual-only label checkboxes in `ApproveUserModal.tsx` and `UserBranchSelectModal.tsx` to native `<input type="checkbox" className="sr-only">` with `pointer-events-none` visual boxes for full keyboard Tab/Space navigation and screen reader support
  - Implemented FIX-2: Isolated `isBranchSaving` state in `UsersActiveTab.tsx`, eliminating race conditions between active user row operations and branch modal saves
  - Implemented FIX-3: Added `branchesStatus` state, memoized `fetchBranches`, and an inline error retry banner with "Coba Lagi" button in `UsersView.tsx`
  - Maintained all coordinator and subcomponent file sizes strictly $\le 250$ LOC
  - Gates: `npm test` 734 pass / 0 fail; `npm run test:smoke` 100 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Plan: `docs/superpowers/plans/2026-11-02-branch-assignment-ux-fixes.md`

- `feat(users)`: User management branch assignment and area supervisor scoping
  - Authored ADR 14 (`docs/adr/0014-user-management-branch-assignment.md`) establishing approval-time branch assignment and Area Supervisor boundary scoping
  - Implemented pure helpers in `src/lib/marcom/branchAssignmentHelpers.ts` (`getAssignableBranches`, `canAssignBranchToUser`, `formatUserBranchBadges`) with 13 unit tests
  - Hardened `PATCH /api/admin/users/[id]` enforcing `canAssignBranchToUser` (HTTP 403 when supervisors assign branches outside their area)
  - Created `ApproveUserModal.tsx` allowing managers to select role and branch penugasan before activating accounts in `UsersPendingTab.tsx`
  - Created `UserBranchSelectModal.tsx` and `UserActiveRow.tsx` (Strangler Pattern) displaying branch chips and editing penugasan in `UsersActiveTab.tsx`
  - Integrated branch fetching in `UsersView.tsx` and verified all coordinator files remain $\le 250$ LOC
  - Gates: `npm test` 733 pass / 0 fail; `npm run test:smoke` 100 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-02-user-branch-assignment-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-user-branch-assignment.md`
  Refs: `docs/adr/0014-user-management-branch-assignment.md`

- `feat(rbac)`: Implement supervisor guarded user management access
  - Authored ADR 13 (`docs/adr/0013-supervisor-guarded-user-management-access.md`) granting supervisors operational user management while preventing privilege escalation
  - Implemented pure RBAC guard functions in `src/lib/marcom/guards.ts` (`canAccessUserManagement`, `canManageUserTarget`, `canAssignUserRole`) with 14 unit tests
  - Hardened backend API endpoints (`/api/admin/users/route.ts` and `[id]/route.ts`) enforcing supervisor access while blocking tampering with admin accounts and role promotion to admin (HTTP 403)
  - Updated navigation and routing in `GlobalRail.tsx`, `ActiveViewStage.tsx`, and `/admin/users/page.tsx`
  - Hardened UI controls in `UserRoleSelect.tsx`, `UsersActiveTab.tsx`, `UsersRejectedTab.tsx`, and `UsersView.tsx` disabling admin deactivation, role change, and deletion for supervisors
  - Gates: `npm test` 710+ pass / 0 fail; `npm run test:smoke` pass; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-02-supervisor-guarded-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-supervisor-guarded-user-management.md`
  Refs: `docs/adr/0013-supervisor-guarded-user-management-access.md`

- `feat(ui)`: Global Rail pending users notification badge
  - Authored ADR 12 (`docs/adr/0012-global-rail-pending-users-badge.md`) adding real-time ambient badge on Users navigation icon
  - Added pure helpers `formatPendingBadgeCount` and `fetchPendingUsersCountApi` in `pendingUsersHelpers.ts` with 6 unit tests
  - Added `pendingUsersCount` and `setPendingUsersCount` to Zustand data slice and connected real-time count updates on user approval/rejection in `UsersView.tsx`
  - Created client polling and focus-revalidation hook `usePendingUsers.ts` scoped strictly to authorized managers
  - Rendered small red dot badge with white typography and rose-500 fill on `GlobalRail.tsx` (240 LOC $\le 250$)
  - Gates: `npm test` pass / 0 fail; `npm run test:smoke` pass; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-02-global-rail-pending-users-badge-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-global-rail-pending-users-badge.md`
  Refs: `docs/adr/0012-global-rail-pending-users-badge.md`

- `fix(build)`: Clean up ESLint unused vars and React Hook dependencies for production Vercel build
  - Resolved all `@typescript-eslint/no-unused-vars` and `react-hooks/exhaustive-deps` across 8 files (`DirectDriveUploadDropzone`, `GoogleDriveUrlForm`, `ProjectsListTable`, `useProjectsBoard`, `useProjectsList`, `MousView`, `OutletFormModal`, `MarcomTableShell`)
  - Verified `npm run lint` exits with 0 errors and 0 warnings

- `feat(gdrive)`: Centralized Google Drive storage via developer refresh token and direct resumable uploads
  - Authored ADR 11 (`docs/adr/0011-centralized-google-drive-storage-refresh-token.md`) establishing centralized developer storage ownership and zero user OAuth popups
  - Created standalone CLI helper `scripts/get-drive-refresh-token.ts` (`npm run drive:token`) for one-time developer refresh token acquisition
  - Registered SSOT request/response contracts (`DriveUploadSessionRequest`, `DriveUploadSessionResponse`, `DriveFinalizeRequest`, `DriveFinalizeResponse`) in `src/types/index.ts`
  - Built pure helper modules `driveTokenHelpers.ts` and `driveUploadHelpers.ts` with 13 comprehensive unit tests
  - Built server-side token manager `driveAuth.ts` with in-memory caching and automatic expiration renewal
  - Built `/api/marcom/drive/upload-session` route creating Google Drive Resumable Upload sessions targeting `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`
  - Built `/api/marcom/drive/finalize` route automating public read permissions (`anyoneWithLink`) to prevent Google 403 iframe preview blocks
  - Built client streaming hook `useDirectDriveUpload.ts` and responsive dropzone `DirectDriveUploadDropzone.tsx` streaming directly from browser to Google CDN (0 MB on Vercel)
  - Deconstructed and upgraded `GoogleDriveLinkModal.tsx` (<150 LOC) with segmented tabs for direct cloud upload vs manual link pasting via `GoogleDriveUrlForm.tsx`
  - Gates: `npm test` 693 pass / 0 fail; `npm run test:smoke` 94 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-02-centralized-drive-upload-design.md`
  Plan: `docs/superpowers/plans/2026-11-02-centralized-drive-upload.md`
  Refs: `docs/adr/0011-centralized-google-drive-storage-refresh-token.md`

---

## [2026-11-01]

- `fix(navigation)`: Resolve workspace return target and sanitize global view state
  - Built pure helper `resolveWorkspaceReturnTarget` in `layoutHierarchyHelpers.ts` with 6 unit tests
  - Guaranteed "Kembali ke Workspace" shortcut button always resolves strictly to an operational view (`board`, `list`, `calendar` or active Marcom view), eliminating false redirects to `profile` or `users`
  - Added rehydration sanitization in `useWorkspaceStore.ts` to reset legacy persisted `profile` or `users` values in `lastTaskView` and `lastMarcomView` back to `"board"` and `"events"`
  - Enforced strict work item whitelisting in `createUiSlice.ts` (`isWorkItem` required to update `lastTaskView`)
  - Gates: `npm test` 680 pass / 0 fail; `npm run test:smoke` 92 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Refs: `docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`, `docs/adr/0010-user-management-global-view-layout-isolation.md`

- `fix(layout)`: Extend global view layout isolation to user management
  - Refactored `shouldRenderSidebar` in `layoutHierarchyHelpers.ts` to check `GLOBAL_ACCOUNT_VIEWS` (suppressing `Sidebar.tsx` on both `profile` and `users`)
  - Expanded `UsersView` table into full widescreen stage width, eliminating horizontal scrolling and badge crowding
  - Maintained persistent `GlobalRail` (52px) with active highlight on `Users` icon and root breadcrumb `Vrello / Manajemen Pengguna` with return shortcut
  - Updated unit test suite in `layoutHierarchyHelpers.test.ts` (13 pass / 0 fail)
  - Gates: `npm test` 674 pass / 0 fail; `npm run test:smoke` 92 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-user-management-global-layout-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-user-management-global-layout.md`
  Refs: `docs/adr/0010-user-management-global-view-layout-isolation.md`

- `fix(layout)`: Isolate global view layout and direct profile breadcrumb hierarchy
  - Separated Operational Views (Projects/Marcom) from Global Account Views (Profile, Users)
  - Extracted pure helper module `layoutHierarchyHelpers.ts` with 12 unit tests verifying view categorization
  - Conditionally suppressed contextual `Sidebar.tsx` when `activeView === "profile"` while keeping `GlobalRail` (52px) visible
  - Restructured `TopNavBreadcrumbs.tsx` to render `Vrello / Profil & Keamanan Akun` directly with a "Kembali ke Workspace" shortcut button
  - Gated `ProjectsFilterBar` in `TopNav.tsx` strictly to task work items (`board`, `list`, `calendar`)
  - Preserved `lastTaskView` in `createUiSlice.ts` so navigating to Profile does not overwrite the user's prior work item view
  - Gates: `npm test` 673 pass / 0 fail; `npm run test:smoke` 92 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC (`Sidebar`: 187, `TopNavBreadcrumbs`: 175, `TopNav`: 151)
  Spec: `docs/superpowers/specs/2026-11-01-profile-layout-hierarchy-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-profile-layout-hierarchy.md`
  Refs: `docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`

- `feat(profile)`: Implement dedicated user profile workspace view and self-service account API
  - Created first-class `ProfileView` workspace view (`view=profile`) and registered in SSOT `ViewMode` and `urlState.ts`
  - Created `/profile/page.tsx` redirecting authenticated users to `/?view=profile` (and unauthenticated to `/login`)
  - Added "Lihat Profil & Akun" trigger to `UserMenuDropdown.tsx`
  - Built secure `/api/user/profile` route (`GET`, `PATCH`) with NextAuth session scoping, Zod schema validation, and bcrypt password verification
  - Built pure helper modules `profileValidators.ts` and `profileHelpers.ts` with 18 comprehensive unit tests
  - Built modular UI components `ProfileHeader.tsx`, `ProfileAvatarUploader.tsx`, `ProfileAccessCard.tsx`, `ProfileSecurityCard.tsx`, and `ProfileView.tsx` coordinator (218 LOC $\le 250$ LOC)
  - Dynamically mounted `ProfileView` in `ActiveViewStage.tsx`
  - Gates: `npm test` 661 pass / 0 fail; `npm run test:smoke` 91 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-user-profile-view-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-user-profile-view.md`
  Refs: `docs/adr/0008-dedicated-user-profile-workspace-view.md`

- `feat(rbac)`: Session RBAC and permissions synchronization across all 7 views
  - Resolved missing "+ Add / New / Upload" buttons across 7 core pages for authenticated database & Google OAuth accounts
  - Hydrated `assignedBranchIds` in NextAuth JWT and Session tokens in `src/auth.ts`, `src/auth.config.ts`, and `src/types/next-auth.d.ts`
  - Built pure helper module `permissionsHelpers.ts` (`normalizeMarcomRole`, `resolveEffectivePermissionsUser`) with 8 unit tests
  - Connected `useMarcomPermissions()` to `useSession()` with resilient fallback to Zustand store
  - Added `syncSessionUser` action to synchronize NextAuth session profile into active user roster in `TopNav.tsx`
  - Gates: `npm test` 643 pass / 0 fail; `npm run test:smoke` 89 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-session-rbac-permissions-sync-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-session-rbac-permissions-sync.md`

- `feat(projects)`: Unified Projects work item creation via original Marcom Hub modal forms
  - Eliminated runtime HTTP 400 errors (`status: "PLANNED"` on placements) and unvalidated placeholder cards across Projects views
  - Built pure helper module `createModalHelpers.ts` with comprehensive unit test suite (`sanitizeDateInput`, `resolveInitialStatus`, `getInitialPlacementPayload`)
  - Created reusable `ProjectsCreateModalHost.tsx` host component (238 LOC) lazily importing `ContentPostModal`, `EventFormModal`, and `PlacementFormModal`
  - Integrated `ProjectsCreateModalHost` into `ProjectsCalendarView.tsx` with date hydration from calendar cells
  - Integrated `ProjectsCreateModalHost` into `ProjectsBoardView.tsx` with status mapping and replaced inline input form in `ProjectsBoardColumn.tsx` with type picker trigger menu (reduced `ProjectsBoardColumn.tsx` to 234 LOC)
  - Integrated `ProjectsCreateModalHost` into `ProjectsListView.tsx`, `ProjectsListHeader.tsx`, and `ProjectsListTable.tsx`
  - Removed obsolete dummy quick-create methods from `useProjectsCalendar.ts`, `useProjectsBoard.ts`, and `useProjectsList.ts`
  - Gates: `npm test` 635 pass / 0 fail; `npm run test:smoke` 88 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean; all coordinator files $\le 250$ LOC
  Spec: `docs/superpowers/specs/2026-11-01-projects-work-item-create-modals-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-projects-work-item-create-modals.md`

- `perf(media)`: Core Web Vitals image optimization via Next.js Image architecture
  - Configured `images.remotePatterns` in `next.config.ts` for Unsplash, Google User Content, and Supabase storage
  - Built pure helper module `appImageHelpers.ts` with layout presets (`avatar`, `thumbnail`, `card`, `lightbox`) and `shouldBypassOptimization` for `blob:`, `data:`, and SVG
  - Created resilient `<AppImage />` primitive in `src/components/ui/AppImage.tsx` handling CLS prevention, responsive width downscaling, WebP/AVIF transformations, and graceful load error recovery
  - Migrated 22 raw `<img>` instances across 16 components to `<AppImage />` (`TopNav`, `UserMenuDropdown`, `UsersActiveTab`, `UsersPendingTab`, `UsersRejectedTab`, `OutletApprovalQueueTab`, `Outlet360Drawer`, `SubmitDraftOutletModal`, `PlacementPhotoUploader`, `PlacementPhotoGallery`, `EventTableView`, `EventCardsView`, `MouDocumentViewerModal`, `DocumentPreviewModal`, `ContentDrawer`, `ContentPlannerView`, `ProjectsWorkItemCard`)
  - Completely eliminated all `@next/next/no-img-element` ESLint warnings
  - Gates: `npm run lint` (0 no-img-element warnings), `npm test` 629 pass / 0 fail; `npm run test:smoke` 87 pass / 0 fail; `npm run build:check` 0 errors; `next build` 27/27 pages compiled; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-01-core-web-vitals-image-optimization-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-core-web-vitals-image-optimization.md`

- `fix(layout)`: Synchronize TopNav avatar and profile with active NextAuth session
  - Extracted pure helper `getEffectiveProfile` and `getInitials` in `userProfileHelpers.ts` with comprehensive unit test suite
  - Prioritized active NextAuth `session.user` data (name, email, image, role) over static fallback user
  - Added real avatar image rendering (`<img>`) with graceful error fallback to initials
  - Synchronized active session user ID to Zustand `useWorkspaceStore.currentUserId`
  - Unified `UserMenuDropdown.tsx` profile card with `getEffectiveProfile` for 100% visual and data parity
  - Gates: `npm test` 621 pass / 0 fail; `npm run test:smoke` 86 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-11-01-topnav-avatar-profile-sync-design.md`
  Plan: `docs/superpowers/plans/2026-11-01-topnav-avatar-profile-sync.md`

## [2026-10-31]

- `fix(theme)`: Set light theme as default for first-time visits
  - Updated `<ThemeProvider>` in `src/app/layout.tsx` to `defaultTheme="light"` and `enableSystem={false}`
  - Prevents forcing dark theme on initial visits before user preference is stored in localStorage
  - Preserves user manual theme toggling across sessions via localStorage
  - Gates: `npm test` 612 pass / 0 fail; `npm run test:smoke` 85 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(ui)`: Redesign MOU table rows with consolidated entity column and neutral glassmorphism
  - Consolidated standalone `Partner` and `Outlet` columns into unified `Partner & Outlet` column saving ~170px of table width
  - Formatted two-line entity cell with primary partner title and secondary outlet link with store icon
  - Replaced stacked `"No period set"` and `"No expiry"` badges with a clean, subtle `—` when no dates are configured
  - Styled MOU document chips with neutral glassmorphic backdrop blur (`bg-slate-100/80 dark:bg-slate-800/60`), subtle Drive/file icons, and clean preview modal triggers
  - Formatted `Type` column replacing raw database enum underscores with spaces
  - Gates: `npm test` 608 pass / 0 fail; `npm run test:smoke` 85 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-mou-table-rows-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-mou-table-rows-redesign.md`

- `feat(ui)`: Add unified header to User Management view
  - Extracted modular `UsersHeader.tsx` (198 LOC) matching the design language of `MousHeader`, `OutletsHeader`, and `DocumentsHeader`
  - Integrated Title row with `Users` icon, `{totalUsers}` counter badge, `{counts.pending}` pending review badge, concise subtitle, and spinning `RefreshCw` button
  - Stabilized Controls row with Framer Motion sliding pill tab switcher (`layoutId="activeUsersTabPill"` with spring dynamics and `useReducedMotion()`) and real-time quick search input with clear button
  - Embedded 4 `KpiSummaryCards` (Total Pengguna, Menunggu Review, Pengguna Aktif, Akun Ditolak/Nonaktif) with direct interactive click navigation to tabs
  - Created pure filtering logic `filterUsers` in `usersFilterHelpers.ts` with unit test suite
  - Refactored `UsersView.tsx` coordinator from 187 down to 123 LOC and applied full-bleed stage layout
  - Gates: `npm test` 608 pass / 0 fail; `npm run test:smoke` 85 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-users-header-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-users-header-redesign.md`

- `feat(ui)`: Add unified header to MOUs & Partnerships view
  - Extracted modular `MousHeader.tsx` (186 LOC) matching the design language of `OutletsHeader`, `DocumentsHeader`, and `PlacementsHeader`
  - Integrated Title row with `FileText` icon, `{totalMous}` counter badge, Refresh button, Export Center trigger, and `+ New MOU` modal trigger
  - Stabilized Filter row directly beneath Title with Framer Motion sliding pill animation (`layoutId="activeMouStatusPill"` with spring dynamics and `useReducedMotion()`), search input with clear button, searchable `CustomDropdown` selectors for Branch and MOU Type, and urgency filter chips
  - Embedded `KpiSummaryCards` directly within `MousHeader` with zero layout shifting
  - Refactored `MousView.tsx` from 417 down to 348 LOC and configured `MarcomTableShell` with `noPadding` and `hideHeader`
  - Gates: `npm test` 603 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-mous-header-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-mous-header-redesign.md`

- `feat(nav)`: Integrate User Management into central Workspace Stage Shell (ADR 07)
  - Extended domain SSOT `ViewMode` union with `"users"` in `src/types/index.ts` and registered it in `VALID_VIEWS` in `src/lib/router/urlState.ts`
  - Integrated dynamic `<UsersView />` loading directly into `src/components/views/ActiveViewStage.tsx` with fail-closed `isAdmin` check
  - Updated `GlobalRail.tsx` Users button to call `setActiveView("users")` and render active pill indicator (`isActive: activeView === "users"`)
  - Updated `UsersView.tsx` with self-hydrated session defaults and streamlined in-stage breadcrumb header
  - Converted `/admin/users/page.tsx` into an instant 307 server redirect to `/?view=users` preserving backwards-compatibility
  - Gates: `npm test` 603 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Refs: ADR 07 (`docs/adr/0007-integrate-user-management-into-workspace-stage.md`)
  Spec: `docs/superpowers/specs/2026-10-31-workspace-user-management-integration-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-workspace-user-management-integration.md`

- `feat(auth)`: Add Supervisor role with branch-scoped operational authority
  - Extended domain SSOT `UserRole` union with `"supervisor"` in `src/types/index.ts` and `assignedBranchIds` in `AppUser`
  - Added `SUPERVISOR` to `DbUserRole` enum and `assignedBranchIds String[] @default([])` to `User` in `prisma/schema.prisma`
  - Updated `src/lib/server/auth-helpers.ts` and `/api/admin/users/[id]` with role normalization, assigned branches persistence, and validation
  - Updated `src/lib/marcom/guards.ts` giving Supervisors Admin-level authority (approving MoUs, Outlets, Equipment Borrows, deleting MoUs/documents) strictly bounded by their assigned branches (`assignedBranchIds`)
  - Strictly blocked Supervisors from `MANAGE_MASTER_DATA` and user account management (`/admin/users`) preserving Least Privilege & Segregation of Duties
  - Added Supervisor option to `UserRoleSelect.tsx` and custom amber role badge in `UserMenuDropdown.tsx`
  - Gates: `npm test` 602 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-supervisor-role-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-supervisor-role.md`

- `feat(ui)`: Implement sitewide fluid active pills animation with Framer Motion
  - Replaced static CSS active classes with Framer Motion `motion.div layoutId="..."` sliding background pill animations
  - Configured premium spring dynamics (`type: "spring" as const, stiffness: 450, damping: 35`) and tactile tap feedback (`whileTap={{ scale: 0.95 }}`)
  - Added accessibility support via `useReducedMotion()` gracefully disabling layout animation for motion-sensitive users
  - Covered 10 segmented controls, tabs, and filter pills:
    1. Documents view switcher (Cards / Table) & Category filter chips (`DocumentsHeader.tsx`)
    2. Outlets view switcher (Table / Map / Approval) (`OutletsHeader.tsx`)
    3. Reports tab switcher (Monthly / Quarterly) (`ReportsHeader.tsx`)
    4. Inventory tab switcher (Catalog / Borrowing) & Grid/Table view switchers (`InventoryHeaderKpis.tsx`)
    5. Analytics brand filter pills (ALL / IM3 / TRI) (`AnalyticsHeader.tsx`)
    6. Branches status filter chips (All / Active / Inactive) (`BranchesHeader.tsx`)
    7. Projects group-by selector pills (Status / Priority / Branch / None) (`ProjectsListHeader.tsx`)
    8. Help & Documentation modal tab switcher (Shortcuts / Guides) (`HelpDocsModal.tsx`)
    9. Settings modal tab switcher (Backup & Data / Appearance) (`SettingsModal.tsx`)
    10. Placements outlet search brand override pills (IM3 / TRI) (`OutletSearchCombobox.tsx`)
  - Gates: `npm test` 599 pass / 0 fail; `npm run test:smoke` 84 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-sitewide-active-pills-animation-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-sitewide-active-pills-animation.md`

- `feat(headers)`: Swap controls row and KPI cards row across all 8 Marcom headers to stabilize pills
  - Inverted vertical order across `BranchesHeader`, `ReportsHeader`, `OutletsHeader`, `DocumentsHeader`, `InventoryHeaderKpis`, `PlacementsHeader`, `EventsHeader`, and `AnalyticsHeader`
  - Positioned Controls row (view switcher pills, tab switcher pills, filter chips, CustomDropdowns, and search inputs) directly beneath Title row (Row 2)
  - Positioned dynamic KPI Summary Cards (`KpiSummaryCards`) below controls (Row 3)
  - Completely eliminated layout jumping and Cumulative Layout Shift (CLS) when switching tabs or view modes where cards toggle visibility (e.g., Placements Map View, Reports Rekap POSM tab)
  - Gates: `npm test` 599 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-header-pills-cards-swap-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-header-pills-cards-swap.md`

- `feat(placements)`: Make placements header and view switcher persistent across tabs
  - Extracted atomic subcomponent `PlacementsHeader.tsx` (84 LOC) with animated view switcher pills (`motion.div layoutId="activePlacementViewPill"`), refresh trigger, export center trigger, and `+ Add Placement` action
  - Anchored `PlacementsHeader` and `KpiSummaryCards` persistently above dynamic content across Table, Map, and Recap view modes with 0px layout shift
  - Streamlined `PlacementsMapTab.tsx` and `PlacementsRecapTab.tsx` by removing redundant duplicate headers and KPI cards
  - Kept coordinator `PlacementsView.tsx` strictly under 250 LOC (213 LOC)
  - Gates: `npm test` 591 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md`

- `feat(seed)`: Implement comprehensive QA edge-case database seeder
  - Rewrote `prisma/seed.ts` with clean database reset protocol (`cleanDatabase`) deleting in reverse FK topological order
  - Populated realistic Indonesian business domain data across User, Branch, Material, Outlet, MoU, Placement, InventoryItem, BorrowRecord, FieldEvent, ContentPost, DocumentItem, and MonthlyReport
  - Built comprehensive QA "what if" edge cases: SLA critical expired contracts, SLA warning near-expiry MoUs, pending approval aging >60d, GPS geolocation anomaly >1.4km deviation, installation blocked with ISSUE renovation status, permanent material without MoU warning, extreme billboard dimensions, cold/orphan outlets, overdue borrow records linked to events, and damaged returns tracking
  - Standardized branch indexing (`branch-1`..`branch-12`) and preserved catalog item counts (13 items) for 100% downstream integration test compatibility
  - Gates: `npm test` 591 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-qa-comprehensive-seeder-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-qa-comprehensive-seeder.md`

- `fix(pipeline)`: Prevent HTML redirect response and JSON parse error in Pipeline view
  - Fixed NextAuth edge middleware authorized callback in `src/auth.config.ts` to return 401 JSON Response for `/api/` endpoints instead of redirecting to `/login` HTML page
  - Added defensive redirect/401 handling and content-type checking in `PipelineView.tsx` `fetchPipeline`
  - Wrapped `src/app/api/marcom/pipeline/route.ts` GET handler in `try / catch` returning structured HTTP 500 JSON
  - Added unit test suite in `src/auth.config.test.ts` (8 passed)
  - Gates: `npm test` 591 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(projects)`: Open work item detail drawer on row click in Projects list view
  - Attached `onClick={() => onSelect?.(item)}` and `cursor-pointer` to `<tr>` in `ProjectsListRow.tsx`
  - Added click event isolation (`e.stopPropagation()`) across all interactive cell controls (checkbox selection, title inline editing, status dropdown, date picker, PIC assignee editor, and actions button)
  - Gates: `npm test` 588 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(events)`: Add equipment logistics indicator chip to event cards
  - Created pure aggregation helper `getEventEquipmentSummary` in `src/lib/marcom/eventEquipmentHelpers.ts`
  - Integrated reactive indicator chip into `EventCardsView.tsx` with teal active state and rose overdue state
  - Added pre-fetch of `fetchBorrowRecords()` to `EventsView.tsx` for zero-lag cache resolution
  - 4 new unit tests; full suite 588 passed, 0 failed; build check 0 errors; drift check clean
  Spec: `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md`
  Refs: `docs/adr/0006-event-card-equipment-indicator.md` (ADR-06)

- `fix(inventory)`: Fix equipment inventory navigation reverting appMode to projects
  - Added `"inventory"` to `MARCOM_VIEW_SET` in `src/lib/store/slices/createUiSlice.ts` so `setActiveView("inventory")` resolves `appMode = "marcom"`
  - Added `"inventory"` and `"equipment"`/`"equipments"` normalization aliases to `VALID_VIEW_MODES` and `MARCOM_VIEWS` in `src/lib/router/urlState.ts`
  - Added `"inventory"` label to `MARCOM_VIEW_LABELS` in `src/components/layout/topNavConstants.ts`
  - Registered Equipment Inventory in `CommandPalette.tsx` views list and quick actions
  - Gates: `npm test` 584 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean


- `fix(projects)`: Replace invalid nested `<tr className="contents">` with `<Fragment>` in `ProjectsListTable`
  - Fixed HTML hydration error where `<tr>` cannot be a child of `<tr>`
  - Grouped section rows (header, items, quick-add) are now direct children of `<tbody>`
  - Gates: `npm test` 569 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `refactor(projects)`: Remove Projects Gantt view
  - Deleted 4 core Gantt files: `ProjectsGanttView.tsx`, `useProjectsGantt.ts`, `GanttBar.tsx`, `GanttUnscheduledShelf.tsx` (-790 LOC)
  - Removed `"gantt"` from `ViewMode` union in `src/types/index.ts`
  - Removed `"gantt"` from `VALID_VIEW_MODES` in `src/lib/router/urlState.ts`
  - Removed dynamic import and switch case from `src/components/views/ActiveViewStage.tsx`
  - Removed Gantt navigation item from `PROJECTS_NAV_ITEMS` and unused `Clock` icon in `navConfig.ts`
  - Updated Projects view guards in `Sidebar.tsx` to `["board", "list", "calendar"]`
  - Removed hotkey `"4"` mapping from `useWorkspaceHotkeys.ts`
  - Removed Gantt entry and unused `GanttChart` icon from `CommandPalette.tsx`
  - Removed Gantt button and unused `Milestone` icon from `MoreAppsMenu.tsx`
  - Updated `HelpDocsModal.tsx` shortcuts label to `"1 - 3"`, removed Gantt guide item and unused `Layers` icon
  - Removed Gantt features item and updated marketing subtitle in `UpgradeModal.tsx`
  - Added hydration and normalization fallback for legacy/persisted `gantt` state to `"list"` in `createUiSlice.ts` and `useWorkspaceStore.ts`
  - Gates: `npm test` 569 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-31-remove-gantt-design.md`
  Plan: `docs/superpowers/plans/2026-10-31-remove-gantt.md`
  Refs: `docs/remove-gantt/adr.md`

- `fix(auth)`: Correct login error signaling and enforce approval status (B1–B5)
  - `authorize()` throws client-safe `CredentialsSignin` subclasses (`pending` / `rejected`), so PENDING/REJECTED users see the correct message instead of "Email atau password tidak sesuai"
  - Middleware `authorized()` requires `status === "APPROVED"`; `auth.config.ts` now maps `id`/`role`/`status` into the session (required by the Edge middleware instance)
  - `/login` only redirects APPROVED sessions and renders the PENDING/REJECTED banner; `/register` routes non-APPROVED sessions to `/login` — prevents redirect loops
  - JWT hydration returns `null` when claims cannot be resolved, invalidating the session and clearing the cookie
  - `PATCH /api/admin/users/[id]` blocks self role/status changes (400)
  - Emails normalized (lowercase + trim) in register, credentials login, Google sign-in, and JWT hydration
  - 12 new unit tests; `npm test` 569 pass / 0 fail; build check 0 errors; drift check clean
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/auth-user-management/login-fix-plan.md`

---

## [2026-10-30]

- `style(layout)`: Align AppModeSegmentedControl styling with original workspace version
  - Restored track padding `px-2.5 pt-2.5 pb-1.5` and border token `border-slate-200/60`
  - Restored two-line centered layout for `Marcom Hub` with `min-h-[38px]` button height
  - Restored active pill border and shadow tokens matching legacy workspace UI
  - Gates: `npm test` 582 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `style(layout)`: Restore Projects Kanban icon, Marcom Hub label, and sliding pill animation
  - Replaced `FolderKanban` with original `Kanban` icon in Projects mode button
  - Renamed `Marcom` to `Marcom Hub` in mode switcher and GlobalRail
  - Restored Framer Motion animated sliding pill (`motion.div layoutId="activeAppModeIndicator"`)
  - Extracted `AppModeSegmentedControl.tsx` (104 LOC), reducing `Sidebar.tsx` coordinator to 182 LOC
  - Gates: `npm test` 582 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean

- `feat(inventory)`: Add Field Event Equipment Inventory & Borrowing System
  - Implemented master catalog `InventoryItem` with unique codes, category filters, and unit tracking
  - Implemented borrow workflow `BorrowRecord` and `BorrowItem` with sequential code `BRW-YYYYMMDD-NNN` and multi-state lifecycle (`PENDING` → `APPROVED` → `ACTIVE` → `RETURNED`)
  - Added atomic unit reservation and condition inspection on returns (`EXCELLENT` ... `DAMAGED` / `LOST`)
  - Added read-only equipment borrowing summary and shortcut inside `EventFormModal`
  - Added 6 API route handlers under `src/app/api/marcom/inventory/`
  - Built modular UI coordinator under `src/components/views/InventoryView/` (223 LOC coordinator) with Card Grid, Table View, Borrow Records Table, and Kanban Tracking Board
  - Seeded 13 items across 4 categories in `prisma/seed.ts`
  - Gates: `npm test` 582 pass / 0 fail; `npm run build:check` 0 errors; `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-30-inventory-system-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-inventory-system.md`
  Refs: `docs/inventory-system/adr.md`

- `feat(auth)`: Redesign login, register, and registration-success screens
  - Split-shell layout that mirrors the product: dark `#0F1115` brand rail with
    the Sidebar's emerald→teal "V" mark, CSS kanban preview, and feature cards;
    light/dark workspace panel on the right
  - New auth primitives: `AuthCard`, `AuthField`, `AuthAlert`,
    `AuthSubmitButton`, `GoogleButton`, `PasswordStrength`,
    `AuthBoardPreview`, `AuthBrandPanel`
  - Login: Google + credentials, deduplicated PENDING/REJECTED/error banners,
    password visibility, field-level semantics, preserved B1–B5 behavior
  - Register: field-level validation, 4-segment password strength meter,
    live confirm-match indicator, approval-pending timeline on success
  - **Root-cause fix:** `globals.css` never mapped the shadcn HSL tokens into
    Tailwind's theme, so `bg-card`, `bg-primary`, `border-border`,
    `text-foreground`, `bg-secondary`, `ring-primary`, etc. were never
    generated. Added an `@theme inline` block; `inline` keeps the ClickUp hex
    `--color-*` tokens working for direct variable usage
  - **Root-cause fix:** Tailwind 4's `dark:` variant defaults to
    `prefers-color-scheme`, while next-themes toggles `.dark`. Added
    `@custom-variant dark (&:where(.dark, .dark *))` so class-based dark mode
    works app-wide
  - `ThemeToggle` now derives its icon from `resolvedTheme`, so system-selected
    themes render the correct control
  - Visual QA at 375 / 768 / 1440 px in light + dark: no horizontal overflow;
    keyboard focus rings verified on cross-links and form controls
  - Gates: `npm test` 569 pass / 0 fail; `npm run build:check` 0 errors;
    `npm run drift:check` clean
  Spec: `docs/superpowers/specs/2026-10-30-auth-ui-redesign-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-ui-redesign.md`

- `feat(projects)`: Feature parity across unified Projects views (Board, List, Calendar, Gantt)
  - **Filter Bar (`ProjectsFilterBar`)**: Multi-criteria search and filter toolbar (search, types, columns, branches, pics, dateFrom, dateTo) with `applyProjectsFilters` pure function and 10 unit tests. Integrated directly into `TopNav` when in Projects mode.
  - **Board View (`ProjectsBoardView`)**:
    - Within-column reordering persisted in `viewPreferences.projectsBoardOrder`
    - Visual drop-line indicator (`DropLineIndicator`) with blue dot and guide
    - WCAG 2.2 keyboard dragging via `KeyboardSensor` with `sortableKeyboardCoordinates` and screen-reader announcements
    - Card enhancements: media thumbnail preview, subtask/checklist progress pill, overdue red date highlight, and quick `⋯` context menu for status move
    - Per-column select-all and card checkboxes connected to floating `ProjectsBulkActionBar` (bulk status change, bulk delete, clear)
    - Inline quick-create form per column with entity type selector (Content Post, Field Event, Placement)
  - **List View (`ProjectsListView`)**:
    - Sortable column headers with cycle none → asc → desc → none and active arrows
    - Group By toolbar selector (Type, Status, Branch, PIC, None) with collapsible groups and inline `+ New [Item]` in group footers
    - Inline editing per row: double-click title, click status for dropdown, click date for date input, click PIC for text input
    - Columns visibility dropdown menu wired to `viewPreferences.visibleFields`
    - Per-row checkbox and header select-all wired to `ProjectsBulkActionBar`
    - Overdue row highlight with red date and dimmed text
  - **Calendar View (`ProjectsCalendarView`)**:
    - Status-colored chips (15% bg opacity, 30% border, full color text) based on unified `STATUS_HEX_COLORS`
    - Day cell overflow handling (max 3 chips per day with `+N more` button opening `CalendarOverflowPopover`)
    - Empty day area click/double-click opening `CalendarCreatePopover` with date pre-filled
    - Multi-day Field Event spanning across date ranges with `↳` continuation indicator
  - **Gantt View (`ProjectsGanttView`)**:
    - Interactive drag operations: move body (shifts dates), left resize handle (shifts startDate), right resize handle (shifts endDate), and progress circle drag (updates event progress)
    - Collapsible left sidebar (280px) with "Hide Tasks" / "Show Tasks" toggle
    - Bottom "Unscheduled Shelf" for items lacking date fields with quick-schedule date picker popover
    - Zoom levels: Day (48px/col), Week (36px/col), Month (24px/col)
    - Screen-reader announcements for drag status
  - **Invariants & Gates**:
    - All 10 coordinator files strictly ≤ 250 LOC (`ProjectsBoardView` 114 LOC, `ProjectsListView` 89 LOC, `ProjectsCalendarView` 121 LOC, `ProjectsGanttView` 217 LOC)
    - Drift check passes: 0 drift detected
    - Build check passes: 0 TypeScript errors
    - Test suite passes: 549 tests pass, 0 fail
  Spec: `docs/remove-general-tasks/02-feature-parity-spec.md`
  Plan: `docs/remove-general-tasks/02-feature-parity-plan.md`
  ADR:  `docs/remove-general-tasks/02-feature-parity-adr.md`

- `refactor(marcom-hub)`: Remove general tasks and repurpose project views for unified Marcom Work Items
  - Implement unified `ProjectsBoardView`, `ProjectsListView`, `ProjectsCalendarView`, and `ProjectsGanttView` in `src/components/views/ProjectsView/` across Content Posts, Field Events, and Placements
  - Repurpose Board, Calendar, List, and Gantt sub-views inside `ContentPlannerView` to manage `ContentPostItem`
  - Remove task bridge & sync code across Events, Placements, MOUs, and Outlets views; create `src/lib/marcom/eventChecklist.ts`
  - Unify sidebar and mode switcher between Projects and Marcom Hub modes via `src/components/layout/navConfig.ts`
  - Delete task, space, and automation Zustand slices (`createTaskSlice`, `createSpaceSlice`, `createAutomationSlice`, `syncHelpers`)
  - Delete task UI components (`src/components/tasks/`), legacy views (`BoardView/`, `ListView/`, `GanttView/`, `CalendarView/`, `ChannelView/`, `HomeView/`), and task modals
  - Delete `/api/tasks` and `/api/realtime` routes and `src/lib/tasks/`
  - Drop Prisma task models (`SpaceItem`, `FolderItem`, `ListItem`, `TaskItem`, `TaskCommentItem`) via migration `20261029134026_drop_task_models`
  - Extract `ActiveViewStage.tsx` from `page.tsx` maintaining all coordinator files ≤ 250 LOC (`page.tsx` 84 LOC, `Sidebar.tsx` 214 LOC, `useWorkspaceStore.ts` 122 LOC)
  - All 539 unit tests pass, 0 fail; build check 0 errors; drift check clean
  Spec: `docs/superpowers/specs/2026-10-30-remove-general-tasks-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-remove-general-tasks.md`
  ADR:  `docs/remove-general-tasks/adr.md`

- `fix(auth)`: Resolve 4 audit issues from auth implementation
  - `fix(auth)`: Make JWT type fields required in `src/types/next-auth.d.ts`
  - `fix(middleware)`: Implement Auth.js v5 JWT verification with split `src/auth.config.ts` for Edge compatibility
  - `fix(register)`: Extract `RegisterSuccess.tsx` subcomponent, bringing `RegisterForm.tsx` to 249 LOC
  - `test(mailer)`: Add silent-catch tests for `sendMail` rejection path in `src/lib/server/mailer.test.ts`
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management-fixes.md`

- `docs(auth-fixes)`: Fix plan for 4 audit issues found in auth implementation
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management-fixes.md`
  Issues: JWT optional fields, cookie-only middleware, RegisterForm LOC, missing mailer failure test

- `feat(auth)`: Add credential registration, admin approval gate, and user management page
  - Add User Prisma model (`DbUserRole`/`DbUserStatus` enums, `PENDING` approval flow)
  - Add `/register` page with email+password form and Google OAuth path
  - Add `/login` page (credentials + Google, status-aware error messages)
  - Add NextAuth Credentials provider with bcryptjs, status blocking, lastLoginAt update
  - Add `/api/auth/register` endpoint (`POST`, bcrypt hash, duplicate guard)
  - Add `/api/admin/users` GET + PATCH + DELETE endpoints (admin-only)
  - Add `/admin/users` full-page view (Pending/Active/Rejected tabs)
  - Add Nodemailer email notifications for approval and rejection
  - Add Next.js middleware protecting all app routes via session cookie validation
  - Add `bcryptjs` and `nodemailer` dependencies
  - Add `auth-helpers` and `mailer` server utilities with unit test suites
  - Remove deprecated `LoginModal`, `InviteModal`, `TeamsModal`, `ShareModal`, and `AuthSync`
  - Remove persona switcher from `UserMenuDropdown` and `SettingsModal`
  - Remove Invite rail item; update Teams rail item to `/admin/users` navigation link
  - Remove Share button from `TopNavActionModals`
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`  
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management.md`  
  ADR:  `docs/auth-user-management/adr.md`

- `docs(auth)`: ARD, spec, and implementation plan for Authentication & User Management system
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management.md`
  ADR:  `docs/auth-user-management/adr.md`

---

## [2026-10-29]

- `fix(reports)`: Add outer scroll container to prevent content clipping  
  Ref: `docs/handover-scroll-reports-view.md`
- `feat(reports)`: Reports view UX improvements (KPI cards, progress bar, period highlight, empty state, report deletion)  
  Spec: `docs/superpowers/specs/2026-10-29-reports-view-improvements-design.md`  
  Plan: `docs/superpowers/plans/2026-10-29-reports-view-improvements.md`  
  ADR: `docs/reports-improvements/adr.md`
- `fix(documents)`: Add outer scroll container to prevent content clipping  
  Ref: `docs/handover-scroll-documents-view.md`

---

## [2026-10-27]

- `refactor(workspace)`: Remove multi-workspace layer — single-tenant simplification  
  Spec: `docs/superpowers/specs/2026-10-27-remove-workspace-single-tenant-design.md`  
  Plan: `docs/superpowers/plans/2026-10-27-remove-workspace-single-tenant.md`

---

## [2026-10-01]

- `feat(analytics)`: Analytics defect fixes  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-defect-fixes.md`
- `feat(analytics)`: Phase 1 — Backend persistence engine fixes  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-1-backend-persistence-engine-fixes.md`
- `feat(analytics)`: Phase 2 — Multi-dimensional filters & actionable KPIs  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-2-multi-dimensional-filters-actionable-kpis.md`
- `feat(analytics)`: Phase 3 — Modular charts, accessibility, drilldown  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-3-modular-charts-accessibility-drilldown.md`
- `refactor(outlets)`: Remove outlet tier option 2a  
  Spec: `docs/superpowers/specs/2026-10-01-remove-outlet-tier-option-2a-design.md`  
  Plan: `docs/superpowers/plans/2026-10-01-remove-outlet-tier-option-2a.md`

## [2026-09-30]

- `feat(mous)`: MOU table phase 1–4 (layout, validity countdown, filters, drawer-first architecture)
- `feat(outlets)`: Pilih Outlet phase 1–4 (UI consolidation, initialization safety, tokenized search, brand sync)
- `feat(placements)`: Placements table UI/UX overhaul
- `refactor(outlets)`: Outlet-MOU status refactor

## [2026-09-29]

- `feat(branches)`: Branches table UI/UX overhaul  
  Plan: `docs/superpowers/plans/2026-09-29-branches-table-ui-ux-overhaul.md`
- `feat(outlets)`: Outlet form modal UX overhaul  
  Plan: `docs/superpowers/plans/2026-09-29-outlet-form-modal-ux-overhaul.md`

## [2026-09-28]

- `perf(marcom)`: Batch delete N+1 query fix  
  Plan: `docs/superpowers/plans/2026-09-28-batch-delete-n-plus-one.md`
- `perf(marcom)`: Marcom table search performance  
  Plan: `docs/superpowers/plans/2026-09-28-marcom-table-search-performance.md`
- `feat(outlets)`: Master data boundary guards — outlet backfill  
  Plan: `docs/superpowers/plans/2026-09-28-master-data-boundary-guards-outlet-backfill.md`

## [2026-09-27]

- `refactor(types)`: Consolidate type definitions — SSOT  
  Plan: `docs/superpowers/plans/2026-09-27-consolidate-type-definitions-ssot.md`
- `refactor(mous)`: Decompose MousView (god-file strangler)  
  Plan: `docs/superpowers/plans/2026-09-27-decompose-mous-view.md`
- `refactor(store)`: God-file store strangler plan  
  Plan: `docs/superpowers/plans/2026-09-27-god-file-store-strangler-plan.md`
- `refactor(marcom)`: Reactive marcom data store  
  Plan: `docs/superpowers/plans/2026-09-27-reactive-marcom-data-store.md`
- Various: decouple-task-marcom-hardcoded-ids, eliminate-duplicate-state-phase-2, fix-kanban-marcom-desync, formalize-related-marcom-type, prisma-frontend-schema-divergence, relocate-prisma-singleton, type-outlet-backfill-prisma-client, workspace-store-slices-composition, auto-backfill-outlet-gps

## [2026-09-25]

- `feat(placements)`: Placement form wizard  
  Plan: `docs/superpowers/plans/2026-09-25-placement-form-wizard.md`
- `feat(placements)`: Placement wizard UX polish

## [2026-09-24]

- `feat(workspace)`: Workspace boundary — tenant isolation in views  
  Plan: `docs/superpowers/plans/2026-09-24-workspace-boundary-tenant-isolation-in-views.md`

## [2026-09-21]

- `feat(outlets)`: Draft outlet approval flow  
  Spec: `docs/superpowers/specs/2026-09-21-draft-outlet-approval-flow-design.md`
- `feat(posm)`: Field POSM execution  
  Spec: `docs/superpowers/specs/2026-09-21-field-posm-execution-design.md`
- `feat(reports)`: POSM quarterly regional reports  
  Spec: `docs/superpowers/specs/2026-09-21-posm-quarterly-regional-reports-design.md`
- `feat(router)`: URL routing and state sync  
  Spec: `docs/superpowers/specs/2026-09-21-url-routing-and-state-sync-design.md`

## [2026-09-20]

- `feat(pipeline)`: Pipeline view  
  Spec: `docs/superpowers/specs/2026-09-20-pipeline-view-design.md`

## [2026-09-19]

- `refactor(store)`: God files strangler phase 1  
  Spec: `docs/superpowers/specs/2026-09-19-god-files-strangler-phase-1-design.md`

## [2026-09-17]

- `feat(placements)`: Placement maps  
  Spec: `docs/superpowers/specs/2026-09-17-placement-maps-design.md`

## [2026-09-15]

- `feat(gdrive)`: Google Drive picker integration  
  Spec: `docs/superpowers/specs/2026-09-15-google-drive-picker-integration-design.md`
- `feat(marcom)`: Marcom work items workspace scoping  
  Spec: `docs/superpowers/specs/2026-09-15-marcom-work-items-workspace-scoping-design.md`

## [2026-09-14]

- `feat(mode)`: Dual context mode  
  Spec: `docs/superpowers/specs/2026-09-14-dual-context-mode-design.md`
- `feat(events)`: Separate content and field events  
  Spec: `docs/superpowers/specs/2026-09-14-separate-content-and-field-events-design.md`

## [2026-09-07]

- `feat(marcom)`: Marcom port — initial marcom domain integration  
  Spec: `docs/superpowers/specs/2026-09-07-marcom-port-design.md`
