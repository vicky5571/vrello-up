# Technical Specification: Integrate Export Center Action into More Apps Menu

- **Status:** APPROVED (ADR-0033)
- **Date:** 2026-11-05
- **Author:** Senior Software Engineer
- **References:** `docs/adr/0033-integrate-export-center-into-more-apps-menu.md`

## 1. Executive Summary

This specification defines the integration of the Export Center trigger into the primary "Main Tools" section of the "More" apps popover (`MoreAppsMenu.tsx`). Clicking this action opens the existing global tabular export modal (`ExportCenter.tsx`), enabling quick generation of CSV and PDF formats for Tasks, MOUs, Placements, and Reports directly from the Global Rail without altering the existing entry points in the Reports page or TopNav.

## 2. Background & Problem Statement

The `ExportCenter` modal (`src/components/layout/ExportCenter.tsx`) is a vital utility for exporting four major system datasets into CSV spreadsheets and print-ready PDFs.
- Currently, users accessing the app through the Global Rail's "More" popover have quick access to Command Palette, Brain² AI Assistant, and Backup & Data.
- However, they must navigate to the Reports page or find the TopNav icon to trigger Export Center.
- Adding a high-visibility trigger in the "Main Tools" section of `MoreAppsMenu.tsx` streamlines access to reporting tools while preserving the dedicated "Export Center" button in `ReportsHeader.tsx`.

## 3. User Experience & Interaction Flow

```
[Global Rail]
    │
    ▼ (click "More" 9-dots icon)
[MoreAppsMenu Popover]
    ├── Section 1: Main Tools
    │     ├── Command Palette (⌘K) ──► Opens CommandPalette modal
    │     ├── Brain² AI Assistant (AI) ──► Opens AI Drawer
    │     └── Export Center (CSV / PDF) [NEW]
    │               │
    │               ▼ (click)
    │         1. onClose() (dismiss popover)
    │         2. setExportCenterOpen(true)
    │               │
    │               ▼
    │         [Global ExportCenter Modal Opens]
    │           ├── Tasks (CSV / PDF)
    │           ├── MOUs (CSV / PDF)
    │           ├── Placements (CSV / PDF)
    │           └── Reports (CSV / PDF)
    │
    └── Section 2: Backup & Data
          ├── Export Backup (JSON)
          └── Import Backup (JSON)
```

## 4. Component Architecture & Implementation Details

### 4.1. `src/components/modals/MoreAppsMenu.tsx` Modifications

1. **Zustand Action Binding**:
   Ingest `setExportCenterOpen` alongside existing store bindings:
   ```typescript
   const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);
   ```

2. **Lucide Icon Import**:
   Import `FileSpreadsheet` from `lucide-react`:
   ```typescript
   import {
     Search,
     Sparkles,
     FileSpreadsheet,
     Database,
     Download,
     Upload,
     X,
     Grid3X3,
   } from "lucide-react";
   ```

3. **JSX Action Element in Main Tools Section**:
   Insert the following button inside the Main Tools container:
   ```tsx
   <button
     type="button"
     onClick={() => {
       onClose();
       setExportCenterOpen(true);
     }}
     className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
   >
     <div className="flex items-center gap-2.5">
       <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
       <span className="font-semibold">Export Center</span>
     </div>
     <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
       CSV / PDF
     </span>
   </button>
   ```

### 4.2. Preservation of Existing Triggers
- `src/components/views/ReportsView/ReportsHeader.tsx`: Retained without modifications.
- `src/components/layout/TopNav.tsx`: Retained without modifications.
- `src/components/layout/CommandPalette.tsx`: Retained without modifications.

## 5. Acceptance Criteria

1. **AC-1 (Export Center in More Menu)**:
   - Pop-up `MoreAppsMenu.tsx` displays "Export Center" with a `FileSpreadsheet` icon and "CSV / PDF" badge in the Main Tools section.
   - Clicking "Export Center" dismisses the popover (`onClose()`) and opens the global `ExportCenter` modal (`isExportCenterOpen === true`).
2. **AC-2 (Reports Page Preservation)**:
   - The "Export Center" button in `ReportsHeader.tsx` on the Reports page continues to function without changes or regressions.
3. **AC-3 (Quality & Invariants)**:
   - Coordinator limit invariant (`MoreAppsMenu.tsx` <= 250 LOC) is respected.
   - `npm run drift:check` passes with 0 drift.
   - `npm run build:check` compiles with 0 TypeScript errors.
   - `npm test` passes with 0 failures across all test suites.

## 6. Non-Goals

- Removing the Export Center button from the Reports view header.
- Modifying `ExportCenter.tsx` or dataset export algorithms (`buildMousCsv`, `buildReportsPrint`, etc.).
- Modifying the TopNav download icon button.

## 7. Verification Checklist

- [ ] `node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts` passes.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` passes with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures across all test suites.



