# Design Spec: Relocate Export Center from TopNav to More Apps Menu

- **Status:** APPROVED
- **Date:** 2026-11-05
- **ADR:** `docs/adr/0047-relocate-export-center-to-more-apps-menu.md`

---

## 1. Executive Summary & Objective

Relocate the trigger button for the Export Center modal out of the primary top navigation bar (`TopNav.tsx`) and consolidate off-canvas global access exclusively inside the Global Rail's "More" popover (`MoreAppsMenu.tsx`).

This declutters the top navigation bar, gives maximum horizontal space to breadcrumbs, search, and core profile/notification controls, and eliminates duplicate global triggers.

---

## 2. User Experience Flow & Screen Layout

### Before
- **TopNav Header:**
  - `[Breadcrumbs]` ... `[Search / Command Palette ⌘K]` ... `[Export Center (Download Icon)]` `[Notification Bell]` `[Theme Toggle]` `[User Avatar]`
- **Global Rail "More" Popover:**
  - Contains Command Palette (`⌘K`), Brain² AI Assistant, Export Center (`CSV / PDF`), and Backup & Data.
- **Redundancy:** Export Center is triggered from two separate adjacent global chrome surfaces.

### After
- **TopNav Header:**
  - `[Breadcrumbs]` ... `[Search / Command Palette ⌘K]` ... `[Notification Bell]` `[Theme Toggle]` `[User Avatar]`
  - Clean, unencumbered right action cluster with zero redundant icons.
- **Global Rail "More" Popover:**
  - Retains and solidifies the primary global off-canvas trigger in the Main Tools section:
    - Icon: `FileSpreadsheet` with green accent (`text-emerald-500`)
    - Title: "Export Center"
    - Badge: "CSV / PDF"
    - On Click: Closes popover (`onClose()`) and opens Export Center modal (`setExportCenterOpen(true)`).

---

## 3. Technical Changes & Component Contracts

### 3.1 `src/components/layout/TopNav.tsx`
- **Imports:**
  - Remove `Download` from `import { Search, Download } from "lucide-react";` -> `import { Search } from "lucide-react";`.
- **State / Hooks:**
  - Remove `const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);`.
- **Markup:**
  - Delete the entire `<button title="Export Center" onClick={() => setExportCenterOpen(true)}>...</button>` block inside the right action cluster.

### 3.2 `src/components/modals/MoreAppsMenu.tsx`
- Verify that `setExportCenterOpen` and `<button onClick={() => { onClose(); setExportCenterOpen(true); }}>` under Main Tools are fully active and properly styled.

### 3.3 `src/components/modals/MoreAppsMenu.test.ts`
- Add automated assertion verifying `TopNav.tsx` does NOT contain `title="Export Center"` or `setExportCenterOpen`.
- Preserve existing tests verifying `MoreAppsMenu.tsx` renders Export Center in Main Tools and dispatches `setExportCenterOpen(true)`.

---

## 4. Non-Goals

1. **No Changes to Modal Core:** The `ExportCenter.tsx` modal, CSV generation logic in `src/lib/productivity/exportCenter.ts`, and PDF layout engines remain untouched.
2. **No Changes to In-Page Contextual Export Triggers:** The contextual export buttons in `ReportsHeader.tsx`, `MousHeader.tsx`, and `PlacementsHeader.tsx` remain intact.
3. **No Database or API Changes:** Zero Prisma schema or server-side API modifications.

---

## 5. Verification Checklist

- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` passes all test suites with 0 failures.
- [ ] Visual verification: TopNav renders cleanly without the download icon.
- [ ] Functional verification: Global Rail "More" popover reliably triggers the Export Center modal.


