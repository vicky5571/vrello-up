# ADR-0047: Relocate Export Center from TopNav to More Apps Menu

- **Status:** ACCEPTED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

The application provides a centralized `ExportCenter` modal (`src/components/layout/ExportCenter.tsx`) for generating tabular CSV spreadsheets and printable PDF summaries across four domain datasets: Tasks, Reports, Placements, and MOUs.

In ADR-0033, the Export Center trigger button was integrated into the Global Rail's "More" popover (`src/components/modals/MoreAppsMenu.tsx`) under the Main Tools section. However, ADR-0033 retained the standalone download icon button (`<Download className="w-3.5 h-3.5" />`) in the top navigation header (`src/components/layout/TopNav.tsx`) as a conservative non-goal.

In operational reality, having the Export Center trigger directly in `TopNav.tsx` creates undesirable UI clutter and redundancy:
1. **Header Crowding**: On standard desktop and tablet viewports, the top navigation header must accommodate breadcrumbs, the Command Palette search pill, notification feed, theme switch, and user profile avatar. An extra global export icon crowds this primary navigation plane.
2. **Duplicated Entry Points**: Users have multiple ways to access Export Center (via Global Rail "More" popover, Command Palette `⌘K`, and contextual headers on Reports, MOUs, and Placements). Retaining it on the top bar serves no unique purpose.

The decision is to completely remove the Export Center trigger button from `TopNav.tsx` and consolidate its global drawer/menu access exclusively inside the "More" popover (`MoreAppsMenu.tsx`).

## Options Considered

### Option 1: Clean Removal from TopNav (Chosen)
- Remove the button element `<button title="Export Center">` from `src/components/layout/TopNav.tsx`.
- Remove unused `Download` icon import and `setExportCenterOpen` selector in `TopNav.tsx`.
- Keep the existing `Export Center` trigger in `src/components/modals/MoreAppsMenu.tsx` (Main Tools section) as the primary off-canvas access point.
- Keep contextual export buttons on individual domain view headers (`ReportsHeader.tsx`, `MousHeader.tsx`, `PlacementsHeader.tsx`) and the Command Palette (`⌘K`).
- *Trade-offs:*
  - **Pros:** Declutters the top navigation header; eliminates duplicate entry points; reduces bundle and state subscriptions in `TopNav.tsx`; maintains 100% feature availability without user friction.
  - **Cons:** Users accustomed to clicking the top bar icon will now open it via "More" or `⌘K`.

### Option 2: Replace TopNav Icon with a Generic More Dropdown
- Replace the standalone export button with another top-level utility dropdown.
- *Trade-offs:* Redundant with the Global Rail's existing "More" button and violates YAGNI.

### Option 3: Conditionally Render by Viewport Breakpoint
- Hide on mobile, show on ultra-wide desktop.
- *Trade-offs:* Fragile CSS breakpoint logic; inconsistent user mental model across devices.

## Decision

We adopt **Option 1: Clean Removal from TopNav**.

Specifically:
1. In `src/components/layout/TopNav.tsx`:
   - Remove `<button title="Export Center" onClick={() => setExportCenterOpen(true)}>...</button>`.
   - Remove `Download` icon from `lucide-react` import.
   - Remove `const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);`.
2. In `src/components/modals/MoreAppsMenu.tsx`:
   - Verify and preserve the existing Export Center trigger button in Main Tools.
3. In `src/components/modals/MoreAppsMenu.test.ts`:
   - Add assertion verifying `TopNav.tsx` does NOT render the Export Center button or import `Download` for export.

## Consequences

### Positive Consequences
- **Cleaner Top Navigation**: The top bar is focused on identity, search, notifications, theme, and profile without unnecessary clutter.
- **Architectural Simplicity**: Dead code and unused store subscriptions removed from `TopNav.tsx`.
- **Zero Capability Loss**: Export Center remains globally accessible via "More" popover, `⌘K`, and domain headers.

### Negative Consequences / Accepted Debt
- None. The feature was already implemented in `MoreAppsMenu.tsx` under ADR-0033.


