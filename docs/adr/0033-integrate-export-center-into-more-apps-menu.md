# ADR-0033: Integrate Export Center Action into More Apps Menu

- **Status:** ACCEPTED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

The application provides an `ExportCenter` modal (`src/components/layout/ExportCenter.tsx`) that generates tabular CSV spreadsheets and print-ready PDF formats for four core datasets: Tasks, Reports, Placements, and MOUs.

Currently, `ExportCenter` can be opened via:
1. The **Reports** view header (`ReportsHeader.tsx`) via an "Export Center" button.
2. The **TopNav** header via a download icon button.
3. The **Command Palette** (`⌘K`) via the "Export Center" command.

Users looking for productivity tools inside the global rail's **"More"** popover (`src/components/modals/MoreAppsMenu.tsx`) find Command Palette, Brain² AI Assistant, and Backup & Data, but cannot directly access the Export Center modal. The user requested adding Export Center into "More" while explicitly preserving its existing presence on the Reports page.

## Options Considered

### Option 1: Place "Export Center" under "Backup & Data" section
- Add an action button next to JSON backup export/import in `MoreAppsMenu.tsx`.
- *Trade-offs:* Grouped by data actions, but blends operational tabular reporting (CSV/PDF) with low-level JSON state backups.

### Option 2: Place "Export Center" under "Main Tools" section (Chosen)
- Place the "Export Center" button directly in the primary tools section alongside Command Palette (`⌘K`) and Brain² AI Assistant.
- Wire the button to `setExportCenterOpen(true)` from `useWorkspaceStore` and close the popover.
- Keep the existing entry point on `ReportsView` and `TopNav` intact.
- *Trade-offs:*
  - **Pros:** High visibility and immediate one-click discoverability in the primary tools section; zero code duplication; reuses the existing global `ExportCenter` modal.
  - **Cons:** Adds one tool row to the top section of `MoreAppsMenu.tsx` (remains very clean and well under file size limits).

### Option 3: Inlining Export Datasets into `MoreAppsMenu`
- Embed the 4 dataset download buttons directly inside the popover without opening the modal.
- *Trade-offs:* Severe bloat; duplicates `ExportCenter.tsx` state and styling inside `MoreAppsMenu.tsx`. Definite YAGNI violation.

## Decision

We choose **Option 2: Place "Export Center" under "Main Tools" section**.

In `src/components/modals/MoreAppsMenu.tsx`:
1. Ingest `setExportCenterOpen` from `useWorkspaceStore`.
2. Add a primary tool row in the "Main Tools" section:
   - Icon: `FileSpreadsheet` with green accent (`text-emerald-500`).
   - Title: "Export Center".
   - Sub-label or badge: "CSV / PDF".
   - Action: `onClose(); setExportCenterOpen(true);`.
3. Preserve all existing Export Center triggers across `ReportsView.tsx` and `TopNav.tsx` without modification.

## Consequences

### Positive Consequences
1. **Unified Tool Access**: Export Center is immediately accessible anywhere in the app via the Global Rail More menu.
2. **Preserved Workflows**: Users accustomed to generating reports from `ReportsView` or `TopNav` experience zero disruption.
3. **Minimal Surface Area**: Adds only ~8 lines to `MoreAppsMenu.tsx` with zero schema or modal changes.
4. **Architectural Safety**: Reuses the existing Zustand action `setExportCenterOpen(true)` and dynamic modal `<ExportCenter />` in `src/app/page.tsx`.

### Negative Consequences / Accepted Debt
1. Minimal cognitive addition to the Main Tools section of `MoreAppsMenu.tsx`.



