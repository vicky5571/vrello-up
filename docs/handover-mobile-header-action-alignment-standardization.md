# Handover: Mobile Header Action Alignment Standardization (Branches, Documents, Reports)

- **Status:** IMPLEMENTED & VERIFIED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-header-action-alignment-standardization-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-07-mobile-header-action-alignment-standardization.md`
- **ADR:** `docs/adr/0068-mobile-header-action-alignment-standardization.md`

## 1. Target Files & Purpose

1. `src/components/views/BranchesView/BranchesHeader.tsx` — Aligns `Refresh` and `Tambah Branch` to right on mobile.
2. `src/components/views/DocumentsView/DocumentsHeader.tsx` — Aligns `Refresh` and `Tambah Dokumen` to right on mobile.
3. `src/components/views/ReportsView/ReportsHeader.tsx` — Aligns action row (`Refresh`, `Export Center`) and `Buat Laporan` to right on mobile.
4. `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` — Aligns quarterly action row to right on mobile.
5. Corresponding test suites in `branchesHeaderResponsiveness.test.ts`, `documentsHeaderResponsiveness.test.ts`, and `reportsHeaderResponsiveness.test.ts`.

---

## 2. Exact Implementation Snippets

### File: `src/components/views/BranchesView/BranchesHeader.tsx` (Lines 87–93)
```tsx
<div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
  <button ... title="Segarkan data">
    <RefreshCw ... />
  </button>
  <button ...>
    <Plus ... /> Tambah Branch
  </button>
</div>
```

### File: `src/components/views/DocumentsView/DocumentsHeader.tsx` (Lines 76–82)
```tsx
<div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
  <button ... title="Refresh data">
    <RefreshCw ... />
  </button>
  <button ...>
    <Plus ... /> Tambah Dokumen
  </button>
</div>
```

### File: `src/components/views/ReportsView/ReportsHeader.tsx` (Lines 94–106)
```tsx
<div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
  <button ... title="Refresh data">
    <RefreshCw ... />
  </button>
  <button ...>
    <Download ... /> Export Center
  </button>
</div>
...
<button
  type="button"
  onClick={() => setIsCreateModalOpen(true)}
  className="self-end sm:self-auto inline-flex items-center gap-2 px-4 py-2 ... rounded-xl text-xs font-semibold ..."
>
  <Plus ... /> Buat Laporan Bulanan
</button>
```

### File: `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` (Lines 118–124)
```tsx
<div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto">
  {/* Quarter selection and report actions */}
</div>
```

---

## 3. Explicit "Do Not Touch" List

- **Desktop Viewport Layouts:** Do NOT remove `sm:justify-start` or `sm:self-auto`. Desktop must remain left-aligned within its column.
- **Search and Filters:** Do NOT modify the search inputs, category chips, or view mode switchers in these components.
- **Coordinator LOC Limits:** All modified files must remain strictly under 250 LOC.

---

## 4. Verification & Regression Checklist

- [x] `BranchesHeader.tsx` action row uses `justify-end sm:justify-start`.
- [x] `DocumentsHeader.tsx` action row uses `justify-end sm:justify-start`.
- [x] `ReportsHeader.tsx` action row uses `justify-end sm:justify-start` and create button uses `self-end sm:self-auto`.
- [x] `QuarterlyPosmReportTab.tsx` action row uses `justify-end sm:justify-start`.
- [x] All 3 unit test suites pass:
  - `npx tsx --test src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts`
  - `npx tsx --test src/components/views/DocumentsView/documentsHeaderResponsiveness.test.ts`
  - `npx tsx --test src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts`
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm run test:smoke` passes with 150/150 tests.
- [x] `npm test` passes with 966/966 tests.


