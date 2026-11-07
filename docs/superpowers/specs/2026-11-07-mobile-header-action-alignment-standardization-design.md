# Design Spec: Mobile Header Action Alignment Standardization (Branches, Documents, Reports)

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0068-mobile-header-action-alignment-standardization.md`

## 1. Executive Summary & Problem Context

On smartphone viewports (< 640px), field personnel interact with management interfaces primarily one-handed. Action rows containing `Refresh` buttons, create modals, and export options were left-aligned across secondary modules (**Branches**, **Documents**, **Reports**), creating an inconsistent physical interaction model and dead whitespace on the right margin.

This specification unifies the mobile action row layout across all secondary headers to align right on mobile (`justify-end sm:justify-start w-full sm:w-auto`) while strictly preserving desktop natural column alignment on screens $\ge 640\text{px}$.

## 2. Component Specifications & Code Contracts

### 2.1 File: `src/components/views/BranchesView/BranchesHeader.tsx`
- **Target Element:** Action button container wrapping `Refresh` button and `+ Tambah Branch` button.
- **Contract:**
  ```tsx
  <div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
    {/* Refresh & Tambah Branch buttons */}
  </div>
  ```

### 2.2 File: `src/components/views/DocumentsView/DocumentsHeader.tsx`
- **Target Element:** Action button container wrapping `Refresh` button and `+ Tambah Dokumen` button.
- **Contract:**
  ```tsx
  <div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
    {/* Refresh & Tambah Dokumen buttons */}
  </div>
  ```

### 2.3 File: `src/components/views/ReportsView/ReportsHeader.tsx`
- **Target Element 1:** Action button container wrapping `Refresh` button and `Export Center` button.
- **Contract 1:**
  ```tsx
  <div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
    {/* Refresh & Export Center buttons */}
  </div>
  ```
- **Target Element 2:** `+ Buat Laporan Bulanan` button.
- **Contract 2:**
  ```tsx
  <button
    type="button"
    className={cn(
      "self-end sm:self-auto ...",
      // other button classes
    )}
  >
  ```

### 2.4 File: `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`
- **Target Element:** Action control bar container wrapping quarterly selector, refresh, and export triggers.
- **Contract:**
  ```tsx
  <div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
    {/* Quarter filter & action controls */}
  </div>
  ```

## 3. Invariants & Guardrails

1. **Desktop Invariant:** On viewports $\ge 640\text{px}$ (`sm:` breakpoint), all action rows reset to `sm:justify-start` and buttons reset to `sm:self-auto`.
2. **Coordinator File Size:** All header files remain under their 250 LOC limits.
3. **No Breaking Changes:** Zero impact on search filters, view switchers, or table logic.

## 4. Non-Goals

- No changes to button functionality, modals, or API calls.
- No changes to desktop column layouts.

## 5. Test & Verification Plan

### 5.1 Unit Tests
- `src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts`:
  - `assert.ok(content.includes("flex items-center gap-2 justify-end sm:justify-start"))`
- `src/components/views/DocumentsView/documentsHeaderResponsiveness.test.ts`:
  - `assert.ok(content.includes("flex items-center gap-2 justify-end sm:justify-start"))`
- `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts`:
  - `assert.ok(content.includes("justify-end sm:justify-start"))`
  - `assert.ok(content.includes("self-end sm:self-auto"))`

### 5.2 Verification Gates
- `npm run drift:check`: 0 drift, 100% spec-plan pairing.
- `npm run build:check`: `tsc --noEmit` 0 errors.
- `npm run test:smoke`: 150/150 smoke tests passing.
- `npm test`: 100% test suite passing.



