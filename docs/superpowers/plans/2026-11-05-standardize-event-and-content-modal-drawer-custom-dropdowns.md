# Implementation Plan: Standardize Event & Content Modal/Drawer Form CustomDropdowns

- **Spec:** `docs/superpowers/specs/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns-design.md`
- **ADR:** `docs/adr/0037-standardize-event-and-content-modal-drawer-custom-dropdowns.md`
- **Date:** 2026-11-05
- **Status:** COMPLETE

## 1. File Manifest & Blast Radius

| File Path | Action | Estimated LOC | Description / Responsibility |
| :--- | :--- | :--- | :--- |
| `src/components/views/EventsView/EventDrawer.tsx` | Modify | ~40 LOC changed | Replace 4 native `<select>` tags (`eventType`, `eventBranchName`, `eventOutletId`, `picMemberId`) with `<CustomDropdown>` |
| `src/components/views/EventsView/EventCreateModal.tsx` | Modify | ~40 LOC changed | Replace 4 native `<select>` tags (`eventType`, `eventBranchName`, `eventOutletId`, `picMemberId`) with `<CustomDropdown>` |
| `src/components/views/ContentPlannerView/ContentPostModal.tsx` | Modify | ~40 LOC changed | Replace 4 native `<select>` tags (`platform`, `format`, `status`, `outletId`) with `<CustomDropdown>` |
| `src/components/views/EventsView/eventDrawerCustomDropdown.test.ts` | Create | ~80 LOC | Automated unit tests asserting `<select>` elimination and `CustomDropdown` props integration |
| `CHANGELOG.md` | Modify | +10 LOC | Document ADR-0037 release entry |
| `docs/SESSION_STATE.md` | Modify | +15 LOC | Update session status and active feature |
| `docs/superpowers/plans/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns.md` | Track | - | Phased execution tracking |
| `docs/superpowers/specs/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns-design.md` | Modify | - | Update spec status to IMPLEMENTED upon completion |
| `docs/handover-standardize-event-and-content-modal-drawer-custom-dropdowns.md` | Create | ~250 LOC | Execution-ready handover guide |

## 2. Phased Implementation Tasks

### Phase 1: Test-First Harness (TDD Red)
- [x] Task 1.1: Create `src/components/views/EventsView/eventDrawerCustomDropdown.test.ts`:
  - Verify static source contracts: asserts that `EventDrawer.tsx`, `EventCreateModal.tsx`, and `ContentPostModal.tsx` import `CustomDropdown` from `@/components/ui/CustomDropdown`.
  - Assert that none of the 3 target files contain raw unstyled `<select` tags for Activation Type, Branch, Outlet, or PIC.
  - Assert that `CustomDropdown` options correctly map to data models and value setters.
- [x] Task 1.2: Run `node --test --import ./test/register-alias.mjs src/components/views/EventsView/eventDrawerCustomDropdown.test.ts` to confirm failing (red) state.

### Phase 2: Refactor Field Event Edit Drawer (`EventDrawer.tsx`)
- [x] Task 2.1: Import `CustomDropdown` in `src/components/views/EventsView/EventDrawer.tsx`.
- [x] Task 2.2: Replace Activation Type `<select>` with `<CustomDropdown>` (`size="md"`).
- [x] Task 2.3: Replace Organizing Branch `<select>` with `<CustomDropdown>` (`size="md"`).
- [x] Task 2.4: Replace Outlet Terkait `<select>` with `<CustomDropdown>` (`size="md"`, `searchable={true}`, `menuClassName="w-full min-w-full max-w-md"`). Preserve autofill location and "Hapus tautan".
- [x] Task 2.5: Replace PIC `<select>` with `<CustomDropdown>` (`size="md"`, `searchable={members.length >= 6}`). Preserve custom PIC name text input reveal.

### Phase 3: Refactor New Field Event Modal (`EventCreateModal.tsx`)
- [x] Task 3.1: Import `CustomDropdown` in `src/components/views/EventsView/EventCreateModal.tsx`.
- [x] Task 3.2: Replace Activation Type `<select>` with `<CustomDropdown>`.
- [x] Task 3.3: Replace Organizing Branch `<select>` with `<CustomDropdown>`.
- [x] Task 3.4: Replace Associated Outlet `<select>` with `<CustomDropdown>` (`searchable={true}`). Preserve autofill location and "Clear link".
- [x] Task 3.5: Replace PIC `<select>` with `<CustomDropdown>` (`searchable={members.length >= 6}`). Preserve custom PIC name text input reveal.

### Phase 4: Refactor Schedule New Post Modal (`ContentPostModal.tsx`)
- [x] Task 4.1: Import `CustomDropdown` in `src/components/views/ContentPlannerView/ContentPostModal.tsx`.
- [x] Task 4.2: Replace Platform `<select>` with `<CustomDropdown<PostPlatform>>`.
- [x] Task 4.3: Replace Format `<select>` with `<CustomDropdown<PostFormat>>`.
- [x] Task 4.4: Replace Status `<select>` with `<CustomDropdown<PostStatus>>`.
- [x] Task 4.5: Replace Associated Outlet `<select>` with `<CustomDropdown>` (`searchable={true}`). Preserve "Clear link".

### Phase 5: Verification Gates & Handoff
- [x] Task 5.1: Run `node --test --import ./test/register-alias.mjs src/components/views/EventsView/eventDrawerCustomDropdown.test.ts` to verify green state.
- [x] Task 5.2: Run `npm run drift:check` (must pass 100%, all 64 specs paired, coordinator LOC OK).
- [x] Task 5.3: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [x] Task 5.4: Run `npm test` (full test suite, 0 failures required).
- [x] Task 5.5: Update `docs/superpowers/specs/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns-design.md` status to `IMPLEMENTED`.
- [x] Task 5.6: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [x] Task 5.7: Create execution-ready handover guide `docs/handover-standardize-event-and-content-modal-drawer-custom-dropdowns.md`.

## 3. Verification Checklist

- [x] `EventDrawer.tsx` has 0 native `<select>` tags for type, branch, outlet, PIC.
- [x] `EventCreateModal.tsx` has 0 native `<select>` tags for type, branch, outlet, PIC.
- [x] `ContentPostModal.tsx` has 0 native `<select>` tags for platform, format, status, outlet.
- [x] All dropdowns display modern dark/light styling and custom popovers.
- [x] Outlet searches filter in real time.
- [x] `npm run drift:check` passes with no drift detected.
- [x] `npm run build:check` compiles with 0 errors.
- [x] `npm test` passes with 0 failures.


