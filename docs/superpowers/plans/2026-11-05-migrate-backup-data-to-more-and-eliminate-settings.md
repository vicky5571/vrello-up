# Implementation Plan: Migrate Backup & Data to More Apps Menu and Eliminate Settings Modal

- **Spec:** `docs/superpowers/specs/2026-11-05-migrate-backup-data-to-more-and-eliminate-settings-design.md`
- **ADR:** `docs/adr/0031-migrate-backup-data-to-more-and-eliminate-settings-modal.md`
- **Date:** 2026-11-05
- **Status:** COMPLETE

## 1. File Manifest & Blast Radius

| File Path | Action | Description / Responsibility |
| :--- | :--- | :--- |
| `src/components/modals/MoreAppsMenu.test.ts` | Modify | Update unit test asserting Backup & Data actions and absence of New Task / SettingsModal |
| `src/components/modals/MoreAppsMenu.tsx` | Modify | Wire JSON export/import handlers, remove New Task, add Data & Storage section |
| `src/components/modals/SettingsModal.tsx` | Delete | Delete entire modal component (~279 LOC) |
| `src/components/layout/Sidebar.tsx` | Modify | Remove `SettingsModal` import, state `isSettingsOpen`, and footer gear icon |
| `CHANGELOG.md` | Modify | Log ADR-0031 refactoring |
| `docs/SESSION_STATE.md` | Modify | Update current status and completed tasks |
| `docs/superpowers/plans/2026-11-05-migrate-backup-data-to-more-and-eliminate-settings.md` | Track | Phased execution tracking |
| `docs/superpowers/specs/2026-11-05-migrate-backup-data-to-more-and-eliminate-settings-design.md` | Modify | Update spec status to IMPLEMENTED upon completion |

## 2. Phased Implementation Tasks

### Phase 1: Test-First Harness & Invariant Assertions
- [x] Task 1.1: Expand `src/components/modals/MoreAppsMenu.test.ts` to assert:
  - Presence of "Export Backup (JSON)" and "Import Backup (JSON)" labels and handlers.
  - Absence of "New Task" label and `setCreateTaskModalOpen` handler.
  - Absence of `SettingsModal` imports or lingering component references across `src/components/layout/Sidebar.tsx`.
- [x] Task 1.2: Run `node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts` to confirm failing (red) state.

### Phase 2: MoreAppsMenu Backup Integration & New Task Elimination
- [x] Task 2.1: In `src/components/modals/MoreAppsMenu.tsx`:
  - Import `Download`, `Upload`, and `Database` from `lucide-react`.
  - Import `toast` from `sonner`.
  - Import `useShallow` from `zustand/react/shallow`.
  - Ingest `spaces`, `tasks`, `tags`, and `importBackup` from `useWorkspaceStore`.
  - Remove `setCreateTaskModalOpen` and `Plus` icon.
- [x] Task 2.2: Implement `handleExportData` and `handleImportFile` with hidden `<input type="file" ref={fileInputRef} accept="application/json,.json" />`.
- [x] Task 2.3: Render "Data & Storage" section with Export and Import action buttons.
- [x] Task 2.4: Remove the "New Task" button from the JSX.
- [x] Task 2.5: Run `node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts` to confirm passing state for MoreAppsMenu.

### Phase 3: SettingsModal Elimination & Sidebar Cleanup
- [x] Task 3.1: In `src/components/layout/Sidebar.tsx`:
  - Remove `import { SettingsModal } from "@/components/modals/SettingsModal";`.
  - Remove `const [isSettingsOpen, setIsSettingsOpen] = useState(false);`.
  - Remove the settings gear icon `<button>` from the footer.
  - Remove `<SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />`.
- [x] Task 3.2: Delete `src/components/modals/SettingsModal.tsx` from the filesystem.
- [x] Task 3.3: Verify that no references to `SettingsModal` remain in the codebase (`git grep -in "SettingsModal"`).

### Phase 4: Full Verification Gates & Session Handoff
- [x] Task 4.1: Run `npm run drift:check` (must pass 100%, 58/58 spec-plan pairs, <=250 LOC).
- [x] Task 4.2: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [x] Task 4.3: Run `npm test` (must pass with 0 failures across all suites).
- [x] Task 4.4: Update `docs/superpowers/specs/2026-11-05-migrate-backup-data-to-more-and-eliminate-settings-design.md` to IMPLEMENTED.
- [x] Task 4.5: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [x] Task 4.6: Commit all changes with standard conventional commit message referencing ADR-0031.

## 3. Verification Checklist

- [x] `npm run drift:check` passes with no drift detected.
- [x] `npm run build:check` passes with 0 TypeScript errors.
- [x] `npm test` passes with 0 failures.



