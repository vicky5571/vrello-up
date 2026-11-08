# Handover: Monthly Reports Table Minimized Row Mobile Two-Line Layout (ADR-0096)

- **Date:** 2026-11-08
- **Status:** Planning Complete — Ready for Implementation
- **ADR:** [ADR-0096](adr/0096-monthly-reports-table-minimized-row-mobile-two-line-layout.md)
- **Spec:** [2026-11-08-monthly-reports-table-minimized-row-mobile-two-line-layout-design.md](superpowers/specs/2026-11-08-monthly-reports-table-minimized-row-mobile-two-line-layout-design.md)
- **Plan:** [2026-11-08-monthly-reports-table-minimized-row-mobile-two-line-layout.md](superpowers/plans/2026-11-08-monthly-reports-table-minimized-row-mobile-two-line-layout.md)

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` | Unit test verifying mobile two-line layout and anti-truncate period classes in collapsed rows. |
| `src/components/views/ReportsView/ReportsView.tsx` | Restructure collapsed row JSX to two-line on mobile (`< sm`) and single-line on desktop (`sm:`). |
| `docs/SESSION_STATE.md` | Record ADR-0096 planning and implementation status. |

---

## 2. Exact Code Changes

### 2.1 `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`

Append unit test asserting mobile two-line and anti-truncate period classes:
```ts
// Append before the closing }); of describe("MonthlyReportExpandedRow & parseActivityDisplay (ADR-0035)", ...):

    it("verifies collapsed monthly report row uses mobile two-line layout and anti-truncate period classes (ADR-0096)", () => {
      const coordCode = fs.readFileSync(coordinatorPath, "utf-8");

      assert.ok(
        !coordCode.includes("truncate\">\n                        {periodLabel(report)}"),
        "Period label must not use truncate class to prevent mobile period truncation"
      );
      assert.ok(
        coordCode.includes("whitespace-nowrap") &&
          coordCode.includes("{periodLabel(report)}"),
        "Period label must use whitespace-nowrap"
      );
      assert.ok(
        coordCode.includes("flex-col sm:flex-row"),
        "Collapsed row must use responsive flex-col sm:flex-row two-line stacking on mobile"
      );
    });
```

---

### 2.2 `src/components/views/ReportsView/ReportsView.tsx`

#### Current Code (Lines 622–677)
```tsx
                  <div
                    onClick={() => toggleExpand(report.id)}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-xs",
                      isCurrentPeriod
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {periodLabel(report)}
                      </span>
                      {isCurrentPeriod && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                          Bulan Ini
                        </span>
                      )}
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">
                        {report.summary?.totalActivities ?? 0} activities
                      </span>
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", completionBarColor(report.summary?.completionRate ?? 0))}
                            style={{ width: `${Math.min(report.summary?.completionRate ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tabular-nums w-8 text-right">
                          {report.summary?.completionRate ?? 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          printSingleMonthlyReport(report, {
                            workspaceName: "Vrello Marcom Operations",
                          });
                        }}
                        title={`Export PDF ${periodLabel(report)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-rose-500" />
                        <span>Export PDF</span>
                      </button>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
```

#### Replacement Code
```tsx
                  <div
                    onClick={() => toggleExpand(report.id)}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:py-2.5 gap-2 sm:gap-3 transition-colors cursor-pointer text-xs",
                      isCurrentPeriod
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    )}
                  >
                    {/* Line 1 on Mobile / Left on Desktop: Title + Current Badge + Mobile Actions */}
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {periodLabel(report)}
                        </span>
                        {isCurrentPeriod && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                            Bulan Ini
                          </span>
                        )}
                      </div>

                      {/* Mobile-Only Action Buttons (top right on mobile) */}
                      <div className="flex sm:hidden items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            printSingleMonthlyReport(report, {
                              workspaceName: "Vrello Marcom Operations",
                            });
                          }}
                          title={`Export PDF ${periodLabel(report)}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-rose-500" />
                          <span>Export PDF</span>
                        </button>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </div>
                    </div>

                    {/* Line 2 on Mobile / Middle on Desktop: Activities & Completion Rate */}
                    <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto text-slate-500 dark:text-slate-400">
                      <span className="shrink-0">
                        {report.summary?.totalActivities ?? 0} activities
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-20 sm:w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", completionBarColor(report.summary?.completionRate ?? 0))}
                            style={{ width: `${Math.min(report.summary?.completionRate ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tabular-nums w-8 text-right">
                          {report.summary?.completionRate ?? 0}%
                        </span>
                      </div>
                    </div>

                    {/* Desktop-Only Action Buttons (aligned right on desktop) */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          printSingleMonthlyReport(report, {
                            workspaceName: "Vrello Marcom Operations",
                          });
                        }}
                        title={`Export PDF ${periodLabel(report)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-rose-500" />
                        <span>Export PDF</span>
                      </button>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                            isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
```

---

## 3. Explicit "Do Not Touch" List

| File / Section | Reason |
| :--- | :--- |
| `ReportsView.tsx` expanded row (`MonthlyReportExpandedRow`) rendering | Out of scope; only collapsed row layout is modified. |
| `ReportsHeader.tsx` | Controlled by ADR-0095; out of scope. |
| `printSingleMonthlyReport` & `exportCenter.ts` | PDF print layout remains unchanged. |
| Desktop layout classes (`sm:` breakpoints) | Explicit user constraint: desktop layout must remain 100% identical. |

---

## 4. Numbered Execution Order

1. **Write Failing Test:**
   - Append test in `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` (Section 2.1).
   - Run `node --test src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` and confirm failure.
2. **Apply Replacement in `src/components/views/ReportsView/ReportsView.tsx`:**
   - Replace lines 622–677 with the code in Section 2.2.
   - Run `node --test src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` and confirm 0 failures.
3. **Run Verification Gates:**
   - `npm run drift:check`
   - `npm test`
   - `npm run build:check`
4. **Update `docs/SESSION_STATE.md`.**

---

## 5. Acceptance Criteria Checklist

- [ ] On mobile viewports (`< 640px`), the collapsed row renders in two lines: Line 1 (Period + optional Bulan Ini + Export PDF + Chevron) and Line 2 (Activities count + Progress bar + Completion percentage).
- [ ] Period titles on mobile (e.g. `"December 2099"` and `"September 2026"`) never truncate.
- [ ] On desktop viewports (`≥ 640px`), the row remains a single horizontal line identical to current appearance.
- [ ] Export PDF click does not bubble to row expansion.
- [ ] `npm run drift:check`, `npm test`, and `npm run build:check` all pass with 0 failures.

