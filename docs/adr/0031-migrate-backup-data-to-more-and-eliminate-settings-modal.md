# ADR-0031: Migrate Backup & Data to More Apps Menu and Eliminate Settings Modal

- **Status:** ACCEPTED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

The application currently maintains `src/components/modals/SettingsModal.tsx` (~279 LOC) triggered by a settings gear icon at the bottom of `Sidebar.tsx`. Upon inspection, `SettingsModal.tsx` contains only two tabs:
1. **Appearance (Preferences)**: Toggle buttons for Light Mode and Dark Mode.
2. **Backup & Data**: JSON Export and JSON Import for spaces, tasks, and tags stored in Zustand.

This creates several architectural and UX redundancies:
- **Redundant Theme Controls**: Theme toggling is already natively accessible on every screen via `<ThemeToggle />` in `TopNav` (top right, 1 click) and via the "Toggle Light/Dark Mode" action in `MoreAppsMenu.tsx`.
- **Sidebar Clutter & Coordinator Risk**: The gear icon in `Sidebar.tsx` consumes persistent visual real estate and forces the coordinator to maintain modal state (`isSettingsOpen`).
- **Bloat in "More" Pop-Up**: The pop-up `MoreAppsMenu.tsx` still contains a redundant "New Task" action button, even though task creation is directly accessible in the project stage and Command Palette (`⌘K`).

Maintaining an entire 280 LOC modal dialog solely for backup JSON export/import violates YAGNI principles. We need to consolidate essential operational data utilities into a unified location and eliminate redundant modals.

## Options Considered

### Option 1: Direct Inline Actions in "More" Menu & Full Deletion of SettingsModal (Chosen)
- Move JSON Export and JSON Import handlers directly into `MoreAppsMenu.tsx` under a dedicated "Data & Backup" section with a hidden file input.
- Completely remove `SettingsModal.tsx` (~279 LOC deleted).
- Remove the settings gear button and `isSettingsOpen` state from `Sidebar.tsx`.
- Delete the redundant "New Task" action from `MoreAppsMenu.tsx`.

*Trade-offs:*
- **Pros:** Net reduction of ~240 LOC across the codebase, 0 new files created, zero modal nesting (direct 1-click trigger), Sidebar simplified.
- **Cons:** Increases `MoreAppsMenu.tsx` by ~35 lines of handler code (still keeps it under 180 LOC, well below limits).

### Option 2: Dedicated Component Slice (`MoreBackupActions.tsx`)
- Extract backup handlers and buttons into a separate helper component `MoreBackupActions.tsx` and import it into `MoreAppsMenu.tsx`.
- Delete `SettingsModal.tsx` and clean `Sidebar.tsx`.

*Trade-offs:*
- **Pros:** Keeps `MoreAppsMenu.tsx` file size slightly smaller (< 140 LOC).
- **Cons:** Creates an unnecessary file abstraction for 35 LOC of straightforward JSON download and file reader logic.

### Option 3: Refactor SettingsModal into a Dedicated BackupDataModal
- Rename `SettingsModal.tsx` to `BackupDataModal.tsx`, remove the Appearance tab, and trigger it from a button in `MoreAppsMenu.tsx`.

*Trade-offs:*
- **Pros:** Retains large modal format for backup instructions.
- **Cons:** Poor UX pattern (opening a popover only to trigger another modal dialog on top); maintains redundant modal wrapper overhead.

## Decision

We choose **Option 1: Direct Inline Actions in "More" Menu & Full Deletion of SettingsModal**.

Backup & Data actions (Export JSON and Import JSON with file confirmation) will be directly integrated into `MoreAppsMenu.tsx`. `SettingsModal.tsx` and its caller in `Sidebar.tsx` will be completely eliminated. The redundant "New Task" button in `MoreAppsMenu.tsx` will be deleted.

## Consequences

### Positive Consequences
1. **Massive Code Elimination:** Deletes `SettingsModal.tsx` completely (~279 LOC eliminated), bringing net simplification to the modal subsystem.
2. **Lean Sidebar Architecture:** Removes modal state (`isSettingsOpen`) from `Sidebar.tsx`, keeping `Sidebar.tsx` clean and far below coordinator file size limits.
3. **No Modal Nesting:** Users can backup or restore workspace JSON data directly from the More pop-up without layered backdrop stacking.
4. **Cleaner "More" Pop-Up:** Deleting "New Task" and Quick Views leaves the pop-up focused solely on system utilities: Command Palette, AI Assistant, Backup/Data operations, and Theme Toggle.

### Negative Consequences / Accepted Debt
1. **No Extended Text Explanation in Backup Dialog:** Users will receive concise action labels ("Export Backup (JSON)" and "Import Backup (JSON)") and browser confirmation alerts instead of an entire modal pane of explanatory text.



