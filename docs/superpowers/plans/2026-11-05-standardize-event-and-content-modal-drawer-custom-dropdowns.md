# Implementation Plan: Standardize Event & Content Modal/Drawer Form CustomDropdowns

- **Spec:** `docs/superpowers/specs/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns-design.md`
- **ADR:** `docs/adr/0037-standardize-event-and-content-modal-drawer-custom-dropdowns.md`
- **Date:** 2026-11-05
- **Status:** DRAFT

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
- [ ] Task 1.1: Create `src/components/views/EventsView/eventDrawerCustomDropdown.test.ts`:
  - Verify static source contracts: asserts that `EventDrawer.tsx`, `EventCreateModal.tsx`, and `ContentPostModal.tsx` import `CustomDropdown` from `@/components/ui/CustomDropdown`.
  - Assert that none of the 3 target files contain raw unstyled `<select` tags for Activation Type, Branch, Outlet, or PIC.
  - Assert that `CustomDropdown` options correctly map to data models and value setters.
- [ ] Task 1.2: Run `node --test --import ./test/register-alias.mjs src/components/views/EventsView/eventDrawerCustomDropdown.test.ts` to confirm failing (red) state.

### Phase 2: Refactor Field Event Edit Drawer (`EventDrawer.tsx`)
- [ ] Task 2.1: Import `CustomDropdown` in `src/components/views/EventsView/EventDrawer.tsx`.
- [ ] Task 2.2: Replace Activation Type `<select>` with `<CustomDropdown>` (`size="md"`).
- [ ] Task 2.3: Replace Organizing Branch `<select>` with `<CustomDropdown>` (`size="md"`).
- [ ] Task 2.4: Replace Outlet Terkait `<select>` with `<CustomDropdown>` (`size="md"`, `searchable={true}`, `menuClassName="w-full min-w-full max-w-md"`). Preserve autofill location and "Hapus tautan".
- [ ] Task 2.5: Replace PIC `<select>` with `<CustomDropdown>` (`size="md"`, `searchable={members.length >= 6}`). Preserve custom PIC name text input reveal.

### Phase 3: Refactor New Field Event Modal (`EventCreateModal.tsx`)
- [ ] Task 3.1: Import `CustomDropdown` in `src/components/views/EventsView/EventCreateModal.tsx`.
- [ ] Task 3.2: Replace Activation Type `<select>` with `<CustomDropdown>`.
- [ ] Task 3.3: Replace Organizing Branch `<select>` with `<CustomDropdown>`.
- [ ] Task 3.4: Replace Associated Outlet `<select>` with `<CustomDropdown>` (`searchable={true}`). Preserve autofill location and "Clear link".
- [ ] Task 3.5: Replace PIC `<select>` with `<CustomDropdown>` (`searchable={members.length >= 6}`). Preserve custom PIC name text input reveal.

### Phase 4: Refactor Schedule New Post Modal (`ContentPostModal.tsx`)
- [ ] Task 4.1: Import `CustomDropdown` in `src/components/views/ContentPlannerView/ContentPostModal.tsx`.
- [ ] Task 4.2: Replace Platform `<select>` with `<CustomDropdown<PostPlatform>>`.
- [ ] Task 4.3: Replace Format `<select>` with `<CustomDropdown<PostFormat>>`.
- [ ] Task 4.4: Replace Status `<select>` with `<CustomDropdown<PostStatus>>`.
- [ ] Task 4.5: Replace Associated Outlet `<select>` with `<CustomDropdown>` (`searchable={true}`). Preserve "Clear link".

### Phase 5: Verification Gates & Handoff
- [ ] Task 5.1: Run `node --test --import ./test/register-alias.mjs src/components/views/EventsView/eventDrawerCustomDropdown.test.ts` to verify green state.
- [ ] Task 5.2: Run `npm run drift:check` (must pass 100%, all 64 specs paired, coordinator LOC OK).
- [ ] Task 5.3: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [ ] Task 5.4: Run `npm test` (full test suite, 0 failures required).
- [ ] Task 5.5: Update `docs/superpowers/specs/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns-design.md` status to `IMPLEMENTED`.
- [ ] Task 5.6: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [ ] Task 5.7: Create execution-ready handover guide `docs/handover-standardize-event-and-content-modal-drawer-custom-dropdowns.md`.

## 3. Verification Checklist

- [ ] `EventDrawer.tsx` has 0 native `<select>` tags for type, branch, outlet, PIC.
- [ ] `EventCreateModal.tsx` has 0 native `<select>` tags for type, branch, outlet, PIC.
- [ ] `ContentPostModal.tsx` has 0 native `<select>` tags for platform, format, status, outlet.
- [ ] All dropdowns display modern dark/light styling and custom popovers.
- [ ] Outlet searches filter in real time.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 errors.
- [ ] `npm test` passes with 0 failures.


