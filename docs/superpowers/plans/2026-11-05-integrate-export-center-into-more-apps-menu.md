# Implementation Plan: Integrate Export Center Action into More Apps Menu

- **Spec:** `docs/superpowers/specs/2026-11-05-integrate-export-center-into-more-apps-menu-design.md`
- **ADR:** `docs/adr/0033-integrate-export-center-into-more-apps-menu.md`
- **Date:** 2026-11-05
- **Status:** COMPLETE

## 1. File Manifest & Blast Radius

| File Path | Action | Estimated LOC | Description / Responsibility |
| :--- | :--- | :--- | :--- |
| `src/components/modals/MoreAppsMenu.test.ts` | Modify | +25 LOC | Add unit test assertions for Export Center trigger and preserve ReportsHeader checks |
| `src/components/modals/MoreAppsMenu.tsx` | Modify | +12 LOC | Ingest `setExportCenterOpen`, import `FileSpreadsheet`, render tool item |
| `CHANGELOG.md` | Modify | +10 LOC | Document ADR-0033 feature addition |
| `docs/SESSION_STATE.md` | Modify | +15 LOC | Update session status and active feature |
| `docs/superpowers/plans/2026-11-05-integrate-export-center-into-more-apps-menu.md` | Track | - | Phased execution tracking |
| `docs/superpowers/specs/2026-11-05-integrate-export-center-into-more-apps-menu-design.md` | Modify | - | Update spec status to IMPLEMENTED upon completion |

## 2. Phased Implementation Tasks

### Phase 1: Test-First Harness (`MoreAppsMenu.test.ts`)
- [x] Task 1.1: In `src/components/modals/MoreAppsMenu.test.ts`:
  - Assert that `MoreAppsMenu.tsx` includes "Export Center".
  - Assert that `MoreAppsMenu.tsx` imports `FileSpreadsheet`.
  - Assert that `MoreAppsMenu.tsx` binds `setExportCenterOpen`.
  - Assert that `src/components/views/ReportsView/ReportsHeader.tsx` continues to export and bind `onOpenExportCenter`.
- [x] Task 1.2: Run `node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts` to confirm failing (red) state.

### Phase 2: Implement Export Center in `MoreAppsMenu.tsx`
- [x] Task 2.1: In `src/components/modals/MoreAppsMenu.tsx`:
  - Import `FileSpreadsheet` from `lucide-react`.
  - Ingest `setExportCenterOpen` from `useWorkspaceStore`.
  - Insert "Export Center" button in the "Main Tools" section right after Brain² AI Assistant.
  - Implement click handler: `onClose(); setExportCenterOpen(true);`.
- [x] Task 2.2: Run `node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts` to confirm passing (green) state.

### Phase 3: Full Verification Gates & Session Handoff
- [x] Task 3.1: Run `npm run drift:check` (must pass 100%, 60/60 spec-plan pairs, <=250 LOC).
- [x] Task 3.2: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [x] Task 3.3: Run `npm test` (must pass with 0 failures across all suites).
- [x] Task 3.4: Update `docs/superpowers/specs/2026-11-05-integrate-export-center-into-more-apps-menu-design.md` to IMPLEMENTED.
- [x] Task 3.5: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [x] Task 3.6: Create execution-ready handover artifact `docs/handover-integrate-export-center-into-more-apps-menu.md`.

## 3. Verification Checklist

- [x] `npm run drift:check` passes with no drift detected.
- [x] `npm run build:check` passes with 0 TypeScript errors.
- [x] `npm test` passes with 0 failures.



