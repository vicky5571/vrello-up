# Handover: Quarterly POSM Report Tab Control Bar Mobile Two-Line Layout & Theme Standardization (ADR-0097)

- **Date:** 2026-11-08
- **Status:** Planning Complete — Ready for Implementation
- **ADR:** [ADR-0097](adr/0097-quarterly-posm-control-bar-mobile-two-line-layout.md)
- **Spec:** [2026-11-08-quarterly-posm-control-bar-mobile-two-line-layout-design.md](superpowers/specs/2026-11-08-quarterly-posm-control-bar-mobile-two-line-layout-design.md)
- **Plan:** [2026-11-08-quarterly-posm-control-bar-mobile-two-line-layout.md](superpowers/plans/2026-11-08-quarterly-posm-control-bar-mobile-two-line-layout.md)

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` | Update test asserting mobile 2-line layout, icon-only refresh, and standardized print button. |
| `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` | Restructure control bar JSX to 2-line on mobile, icon-only refresh, and `bg-indigo-600` Cetak Laporan button. |
| `docs/SESSION_STATE.md` | Record ADR-0097 planning and implementation status. |

---

## 2. Exact Code Changes

### 2.1 `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts`

#### Current Code (Lines 32–38)
```ts
  it("verifies POSM quarterly tab action bar aligns right on mobile", () => {
    const content = fs.readFileSync(posmTabPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start"),
      "QuarterlyPosmReportTab action bar must use justify-end on mobile and sm:justify-start on desktop"
    );
  });
```

#### Replacement Code
```ts
  it("verifies POSM quarterly tab action bar uses mobile 2-line layout and executive theme (ADR-0097)", () => {
    const content = fs.readFileSync(posmTabPath, "utf-8");
    assert.ok(
      content.includes("grid-cols-2"),
      "QuarterlyPosmReportTab action bar must use balanced grid-cols-2 on mobile"
    );
    assert.ok(
      content.includes("Cetak Laporan"),
      "QuarterlyPosmReportTab print button must use concise label 'Cetak Laporan'"
    );
    assert.ok(
      !content.includes("Cetak PDF / Laporan"),
      "QuarterlyPosmReportTab must remove verbose label 'Cetak PDF / Laporan'"
    );
    assert.ok(
      content.includes("bg-indigo-600"),
      "QuarterlyPosmReportTab print button must use executive indigo theme"
    );
  });
```

---

### 2.2 `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`

#### Current Code (Lines 130–174)
```tsx
      {/* Action & Period Bar (Hidden on print) */}
      <div className="relative z-30 print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pilih Periode:
          </span>
          <CustomDropdown
            value={selectedQuarter}
            onChange={setSelectedQuarter}
            options={availableQuarters.map((q) => ({ value: q, label: q }))}
            ariaLabel="Pilih Periode Kuartal"
            className="w-32 sm:w-36 text-xs sm:text-sm font-semibold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={() => fetchReportData(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Ekspor CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF / Laporan
          </button>
        </div>
      </div>
```

#### Replacement Code
```tsx
      {/* Action & Period Bar (Hidden on print) */}
      <div className="relative z-30 print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Line 1 on Mobile / Left on Desktop: Period selector + Mobile-positioned Refresh */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Pilih Periode:
            </span>
            <CustomDropdown
              value={selectedQuarter}
              onChange={setSelectedQuarter}
              options={availableQuarters.map((q) => ({ value: q, label: q }))}
              ariaLabel="Pilih Periode Kuartal"
              className="w-32 sm:w-36 text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Refresh button positioned in top line on mobile */}
          <button
            type="button"
            onClick={() => fetchReportData(true)}
            disabled={isLoading}
            title="Segarkan data kuartalan"
            className="flex sm:hidden p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Line 2 on Mobile (2-column balanced grid) / Inline actions on Desktop */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          {/* Refresh button visible only on desktop */}
          <button
            type="button"
            onClick={() => fetchReportData(true)}
            disabled={isLoading}
            title="Segarkan data kuartalan"
            className="hidden sm:inline-flex p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>
```

---

## 3. Explicit "Do Not Touch" List

| File / Section | Reason |
| :--- | :--- |
| `QuarterlyPosmReportTab.tsx` printable sheet & matrix breakdown (lines 176+) | Out of scope; only top control bar is restructured. |
| `formatQuarterlyPosmCsv` & download helper logic | Out of scope. |
| Database schema and backend routes | Zero backend changes required. |

---

## 4. Numbered Execution Order

1. **Write Failing Test:**
   - Update `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` (Section 2.1).
   - Run `node --test src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` and confirm failure.
2. **Apply Replacement in `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`:**
   - Replace lines 130–174 with Section 2.2.
   - Run `node --test src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` and confirm 0 failures.
3. **Run Verification Gates:**
   - `npm run drift:check`
   - `npm test`
   - `npm run build:check`
4. **Update `docs/SESSION_STATE.md`.**

---

## 5. Acceptance Criteria Checklist

- [ ] On mobile viewports (`< 640px`), the control bar renders in two distinct lines: Line 1 (Period selector + icon-only Refresh) and Line 2 (50/50 balanced action buttons: `Ekspor CSV` and `Cetak Laporan`).
- [ ] No orphan wrapped buttons in the bottom right corner.
- [ ] Primary print button uses `bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs` with concise label `"Cetak Laporan"`.
- [ ] On desktop viewports (`≥ 640px`), the control bar aligns horizontally in 1 line.
- [ ] `window.print()` and CSV export trigger without error.
- [ ] `npm run drift:check`, `npm test`, and `npm run build:check` all pass with 0 failures.

