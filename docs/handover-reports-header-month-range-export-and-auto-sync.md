# Handover: Reports Header Month-Range Executive PDF Export, Auto-Sync of Range & Current Month, and Redundant Export Center Button Removal (ADR-0095)

- **Date:** 2026-11-08
- **Status:** Planning Complete — Ready for Implementation
- **ADR:** [ADR-0095](adr/0095-reports-header-month-range-export-and-auto-sync.md)
- **Spec:** [2026-11-08-reports-header-month-range-export-and-auto-sync-design.md](superpowers/specs/2026-11-08-reports-header-month-range-export-and-auto-sync-design.md)
- **Plan:** [2026-11-08-reports-header-month-range-export-and-auto-sync.md](superpowers/plans/2026-11-08-reports-header-month-range-export-and-auto-sync.md)

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/lib/marcom/monthlyReportSync.test.ts` | Unit tests for `enumerateReportPeriods` (single-month, multi-month, cross-year, and invalid ranges). |
| `src/lib/productivity/exportCenter.test.ts` | Unit tests for `buildMonthlyReportRangePrint` (multi-month page-break separation). |
| `src/components/modals/MoreAppsMenu.test.ts` | Update test asserting `ReportsHeader` no longer renders `"Export Center"` or `"1-Click Executive PDF"` and instead renders `"Export Laporan PDF"`. |
| `src/lib/marcom/monthlyReportSync.ts` | Add pure helper `enumerateReportPeriods` for chronological period listing. |
| `src/lib/productivity/exportCenter.ts` | Add `buildMonthlyReportRangePrint` and `printMonthlyReportRange`. |
| `src/app/api/marcom/reports/export-range/route.ts` | Create API route that syncs current month + auto-syncs missing months in range (Perilaku A) and returns ordered reports. |
| `src/components/views/ReportsView/ReportRangeExportModal.tsx` | Create modular month-range export dialog with start/end month-year inputs and export action. |
| `src/components/views/ReportsView/ReportsHeader.tsx` | Remove `"Export Center"` and replace `"⚡ 1-Click Executive PDF"` with `"Export Laporan PDF"`. |
| `src/components/views/ReportsView/ReportsView.tsx` | Mount `ReportRangeExportModal` and trigger range print. |
| `docs/SESSION_STATE.md` | Record ADR-0095 planning and implementation status. |

---

## 2. Exact Code Changes

### 2.1 `src/lib/marcom/monthlyReportSync.test.ts`

Add test cases for `enumerateReportPeriods`:
```ts
// Append inside describe("monthlyReportSync domain engine (ADR-0036)", ...):
  describe("enumerateReportPeriods helper (ADR-0095)", () => {
    it("returns single period when start and end are identical", () => {
      const periods = enumerateReportPeriods("November", 2026, "November", 2026);
      assert.deepStrictEqual(periods, [{ month: "November", year: 2026 }]);
    });

    it("returns chronologically ordered periods within same year", () => {
      const periods = enumerateReportPeriods("August", 2026, "October", 2026);
      assert.deepStrictEqual(periods, [
        { month: "August", year: 2026 },
        { month: "September", year: 2026 },
        { month: "October", year: 2026 },
      ]);
    });

    it("returns chronologically ordered periods across year boundary", () => {
      const periods = enumerateReportPeriods("November", 2025, "February", 2026);
      assert.deepStrictEqual(periods, [
        { month: "November", year: 2025 },
        { month: "December", year: 2025 },
        { month: "January", year: 2026 },
        { month: "February", year: 2026 },
      ]);
    });

    it("returns empty array when start is after end", () => {
      const periods = enumerateReportPeriods("November", 2026, "August", 2026);
      assert.deepStrictEqual(periods, []);
    });
  });
```

---

### 2.2 `src/lib/productivity/exportCenter.test.ts`

Add test cases for `buildMonthlyReportRangePrint`:
```ts
// Append to src/lib/productivity/exportCenter.test.ts:
test("buildMonthlyReportRangePrint renders multi-month documents with page breaks (ADR-0095)", () => {
  const rep1: any = {
    id: "r1",
    month: "September",
    year: 2026,
    summary: { totalActivities: 2, completionRate: 100 },
    achievements: ["Achievement 1"],
    keyIssues: [],
    actionPlans: [],
    activities: [],
  };
  const rep2: any = {
    id: "r2",
    month: "October",
    year: 2026,
    summary: { totalActivities: 3, completionRate: 75 },
    achievements: ["Achievement 2"],
    keyIssues: [],
    actionPlans: [],
    activities: [],
  };

  const html = buildMonthlyReportRangePrint([rep1, rep2]);
  assert.ok(html.includes("September 2026"), "Expected first report period");
  assert.ok(html.includes("October 2026"), "Expected second report period");
  assert.ok(html.includes("page-break-after: always;"), "Expected page-break-after between multiple reports");
});
```

---

### 2.3 `src/components/modals/MoreAppsMenu.test.ts`

#### Current Code (Lines 154–168)
```ts
  it("preserves Export Center in ReportsHeader (ADR-0033 non-goal)", () => {
    const reportsHeaderPath = path.resolve(
      process.cwd(),
      "src/components/views/ReportsView/ReportsHeader.tsx"
    );
    const reportsHeaderContent = fs.readFileSync(reportsHeaderPath, "utf-8");
    assert.ok(
      reportsHeaderContent.includes("onOpenExportCenter"),
      "Expected ReportsHeader to retain onOpenExportCenter prop"
    );
    assert.ok(
      reportsHeaderContent.includes("Export Center"),
      "Expected ReportsHeader to retain Export Center button"
    );
  });
```

#### Replacement Code
```ts
  it("verifies ReportsHeader consolidates into Export Laporan PDF and removes redundant Export Center (ADR-0095)", () => {
    const reportsHeaderPath = path.resolve(
      process.cwd(),
      "src/components/views/ReportsView/ReportsHeader.tsx"
    );
    const reportsHeaderContent = fs.readFileSync(reportsHeaderPath, "utf-8");
    assert.ok(
      !reportsHeaderContent.includes("onOpenExportCenter"),
      "Expected ReportsHeader to remove redundant onOpenExportCenter prop"
    );
    assert.ok(
      !reportsHeaderContent.includes("<span>Export Center</span>"),
      "Expected ReportsHeader to remove duplicate Export Center button (retained in MoreAppsMenu)"
    );
    assert.ok(
      reportsHeaderContent.includes("Export Laporan PDF"),
      "Expected ReportsHeader to render Export Laporan PDF button"
    );
    assert.ok(
      !reportsHeaderContent.includes("1-Click Executive PDF"),
      "Expected ReportsHeader to remove obsolete 1-Click Executive PDF button"
    );
  });
```

---

### 2.4 `src/lib/marcom/monthlyReportSync.ts`

Add `enumerateReportPeriods` helper:
```ts
/**
 * Enumerates every (month, year) period chronologically between start and end.
 * Returns empty array if start is after end, or inputs are invalid.
 */
export function enumerateReportPeriods(
  startMonth: string,
  startYear: number,
  endMonth: string,
  endYear: number,
): { month: string; year: number }[] {
  const startIdx = MONTH_OPTIONS.indexOf(startMonth as any);
  const endIdx = MONTH_OPTIONS.indexOf(endMonth as any);
  if (startIdx === -1 || endIdx === -1) return [];
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return [];

  const startVal = startYear * 12 + startIdx;
  const endVal = endYear * 12 + endIdx;
  if (startVal > endVal) return [];

  const results: { month: string; year: number }[] = [];
  let currentVal = startVal;
  while (currentVal <= endVal) {
    const y = Math.floor(currentVal / 12);
    const mIdx = currentVal % 12;
    results.push({ month: MONTH_OPTIONS[mIdx], year: y });
    currentVal++;
  }
  return results;
}
```

---

### 2.5 `src/lib/productivity/exportCenter.ts`

Add multi-month print builder and trigger:
```ts
/**
 * Builds printable HTML for a range of monthly reports, each on a fresh page.
 */
export function buildMonthlyReportRangePrint(
  reports: ReportLike[],
  opts?: { workspaceName?: string; generatedAt?: string }
): string {
  if (reports.length === 0) {
    return buildSingleMonthlyReportPrint({} as ReportLike, opts);
  }
  if (reports.length === 1) {
    return buildSingleMonthlyReportPrint(reports[0], opts);
  }

  // Extract individual report bodies and join with print page breaks
  const pagesHtml = reports
    .map((r, idx) => {
      const singleHtml = buildSingleMonthlyReportPrint(r, opts);
      const bodyMatch = singleHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const innerContent = bodyMatch ? bodyMatch[1] : singleHtml;
      const isLast = idx === reports.length - 1;
      return `<div class="monthly-report-page" style="${isLast ? "" : "page-break-after: always;"}">
        ${innerContent}
      </div>`;
    })
    .join("\n");

  // Re-wrap in single HTML document with standard executive print stylesheet
  const baseHtml = buildSingleMonthlyReportPrint(reports[0], opts);
  return baseHtml.replace(/<body[^>]*>[\s\S]*?<\/body>/i, `<body>${pagesHtml}</body>`);
}

export function printMonthlyReportRange(
  reports: ReportLike[],
  opts?: { workspaceName?: string }
): void {
  const html = buildMonthlyReportRangePrint(reports, opts);
  printDocument(html);
}
```

---

### 2.6 `src/app/api/marcom/reports/export-range/route.ts` (New File)

Create new route handler:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  enumerateReportPeriods,
  syncMonthlyReport,
} from "@/lib/marcom/monthlyReportSync";
import { MONTH_OPTIONS } from "@/lib/marcom/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { startMonth, startYear, endMonth, endYear } = body ?? {};

    const periods = enumerateReportPeriods(
      String(startMonth || ""),
      Number(startYear),
      String(endMonth || ""),
      Number(endYear),
    );

    if (periods.length === 0) {
      return NextResponse.json(
        { error: "Periode awal tidak boleh melebihi periode akhir atau format tidak valid" },
        { status: 400 },
      );
    }

    if (periods.length > 12) {
      return NextResponse.json(
        { error: "Rentang ekspor maksimal 12 bulan" },
        { status: 400 },
      );
    }

    // 1. Always auto-sync/update current calendar month
    const now = new Date();
    const currentMonth = MONTH_OPTIONS[now.getMonth()];
    const currentYear = now.getFullYear();
    await syncMonthlyReport({ month: currentMonth, year: currentYear });

    // 2. Perilaku A: Auto-sync any period in range that is missing in database
    // ponytail: ADR-0095 Perilaku A — auto-sync missing months in range. Switch to Perilaku B (skip syncMonthlyReport for non-current missing months) if historical gaps should remain unsaved.
    const resolvedReports = [];
    for (const p of periods) {
      let row = await prisma.monthlyReport.findFirst({
        where: {
          month: { equals: p.month, mode: "insensitive" },
          year: p.year,
        },
      });

      if (!row) {
        await syncMonthlyReport({ month: p.month, year: p.year });
        row = await prisma.monthlyReport.findFirst({
          where: {
            month: { equals: p.month, mode: "insensitive" },
            year: p.year,
          },
        });
      }

      if (row) {
        resolvedReports.push(row);
      }
    }

    return NextResponse.json({
      ok: true,
      count: resolvedReports.length,
      reports: resolvedReports,
    });
  } catch (error) {
    console.error("POST /api/marcom/reports/export-range error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memproses ekspor rentang laporan" },
      { status: 500 },
    );
  }
}
```

---

### 2.7 `src/components/views/ReportsView/ReportRangeExportModal.tsx` (New File)

Create new modular modal component:
```tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, X, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { MONTH_OPTIONS } from "@/lib/marcom/analytics";
import { enumerateReportPeriods } from "@/lib/marcom/monthlyReportSync";
import { printMonthlyReportRange } from "@/lib/productivity/exportCenter";

interface ReportRangeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MONTH_DROPDOWN_OPTIONS = MONTH_OPTIONS.map((m) => ({
  value: m,
  label: m,
}));

export function ReportRangeExportModal({
  isOpen,
  onClose,
  onSuccess,
}: ReportRangeExportModalProps) {
  const now = new Date();
  const currentMonth = MONTH_OPTIONS[now.getMonth()];
  const currentYear = now.getFullYear();

  const [startMonth, setStartMonth] = useState<string>(currentMonth);
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endMonth, setEndMonth] = useState<string>(currentMonth);
  const [endYear, setEndYear] = useState<number>(currentYear);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    const periods = enumerateReportPeriods(startMonth, startYear, endMonth, endYear);

    if (periods.length === 0) {
      toast.error("Periode awal tidak boleh melebihi periode akhir");
      return;
    }

    if (periods.length > 12) {
      toast.error("Rentang ekspor maksimal 12 bulan");
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch("/api/marcom/reports/export-range", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startMonth,
          startYear,
          endMonth,
          endYear,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal ekspor laporan (${res.status})`);
      }

      const json = await res.json();
      const reports = Array.isArray(json.reports) ? json.reports : [];
      if (reports.length === 0) {
        throw new Error("Tidak ada data laporan dalam rentang tersebut");
      }

      printMonthlyReportRange(reports, {
        workspaceName: "Vrello Marcom Operations",
      });

      toast.success(
        `Membuka cetak PDF ${periods.length} laporan (${startMonth} ${startYear} — ${endMonth} ${endYear})`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses ekspor");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label="Export Laporan PDF"
      showCloseButton={false}
      panelClassName="max-w-md"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Export Laporan PDF (Rentang Bulan)
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleExport} className="p-5 space-y-4">
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
          Ekspor laporan bulanan eksekutif resmi. Ekspor akan otomatis memperbarui data <strong>Bulan Ini</strong> sebelum mencetak.
        </div>

        <div className="space-y-3">
          {/* Dari Periode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Dari Periode</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <CustomDropdown
                className="w-full"
                value={startMonth}
                onChange={(val) => setStartMonth(val)}
                options={MONTH_DROPDOWN_OPTIONS}
                placeholder="Pilih Bulan"
                searchable={false}
                size="sm"
                ariaLabel="Dari Bulan"
              />
              <input
                type="number"
                min={2000}
                max={2100}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sampai Periode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sampai Periode</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <CustomDropdown
                className="w-full"
                value={endMonth}
                onChange={(val) => setEndMonth(val)}
                options={MONTH_DROPDOWN_OPTIONS}
                placeholder="Pilih Bulan"
                searchable={false}
                size="sm"
                ariaLabel="Sampai Bulan"
              />
              <input
                type="number"
                min={2000}
                max={2100}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? "Memproses..." : "Update Bulan Ini & Export PDF"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

---

### 2.8 `src/components/views/ReportsView/ReportsHeader.tsx`

#### Current Code (Lines 16–42 & 65–97)
```tsx
interface ReportsHeaderProps {
  reportTab: "monthly" | "posm_quarterly";
  setReportTab: (tab: "monthly" | "posm_quarterly") => void;
  kpiCards: KpiCardItem[];
  isLoading: boolean;
  fetchReports: () => void;
  onOpenExportCenter: () => void;
  onInstantExecutiveExport: () => void;
  isInstantExporting: boolean;
  canManage: boolean;
  showCreateForm: boolean;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
}
```
and:
```tsx
        <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            title="Refresh reports"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          <button
            type="button"
            onClick={onOpenExportCenter}
            title="Open Export Center — PDF summaries & Excel sheets"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shadow-2xs bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Center</span>
          </button>

          <button
            type="button"
            onClick={onInstantExecutiveExport}
            disabled={isInstantExporting}
            title="1-Klik tarik data riil & buka cetak PDF Laporan Eksekutif Bulanan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-2xs bg-gradient-to-r from-violet-600 to-indigo-600 border-indigo-500 text-white hover:from-violet-700 hover:to-indigo-700 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={cn("w-3.5 h-3.5", isInstantExporting && "animate-spin")} />
            <span>{isInstantExporting ? "Menyusun PDF..." : "⚡ 1-Click Executive PDF"}</span>
          </button>
        </div>
```

#### Replacement Code
```tsx
interface ReportsHeaderProps {
  reportTab: "monthly" | "posm_quarterly";
  setReportTab: (tab: "monthly" | "posm_quarterly") => void;
  kpiCards: KpiCardItem[];
  isLoading: boolean;
  fetchReports: () => void;
  onOpenRangeExport: () => void;
  canManage: boolean;
  showCreateForm: boolean;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
}
```
and:
```tsx
        <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            title="Refresh reports"
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          <button
            type="button"
            onClick={onOpenRangeExport}
            title="Ekspor Laporan PDF dalam rentang bulan"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Laporan PDF</span>
          </button>
        </div>
```

---

### 2.9 `src/components/views/ReportsView/ReportsView.tsx`

- Import `ReportRangeExportModal` from `./ReportRangeExportModal`.
- Add `const [isRangeExportOpen, setIsRangeExportOpen] = useState(false);`.
- Replace `onOpenExportCenter` and `onInstantExecutiveExport` on `<ReportsHeader>` with `onOpenRangeExport={() => setIsRangeExportOpen(true)}`.
- Render `<ReportRangeExportModal isOpen={isRangeExportOpen} onClose={() => setIsRangeExportOpen(false)} onSuccess={() => fetchReports({ silent: true })} />` inside the component.

---

## 3. Explicit "Do Not Touch" List

| File / Section | Reason |
| :--- | :--- |
| `MoreAppsMenu.tsx` Export Center item | Selected by user as the canonical entry point for global Export Center. |
| `ReportsView.tsx` row-level `"Export PDF"` button | Retained per ADR-0094. |
| `QuarterlyPosmReportTab.tsx` | Out of scope. |
| `prisma/schema.prisma` | Upsert and range queries execute purely over existing schema. |

---

## 4. Numbered Execution Order

1. **Write Failing Tests:**
   - Add tests to `src/lib/marcom/monthlyReportSync.test.ts` (Section 2.1).
   - Add tests to `src/lib/productivity/exportCenter.test.ts` (Section 2.2).
   - Update `src/components/modals/MoreAppsMenu.test.ts` (Section 2.3).
   - Run tests and confirm failures.
2. **Implement Backend & Helpers:**
   - Add `enumerateReportPeriods` to `src/lib/marcom/monthlyReportSync.ts` (Section 2.4).
   - Add `buildMonthlyReportRangePrint` & `printMonthlyReportRange` to `src/lib/productivity/exportCenter.ts` (Section 2.5).
   - Create `src/app/api/marcom/reports/export-range/route.ts` (Section 2.6).
3. **Implement UI Components:**
   - Create `src/components/views/ReportsView/ReportRangeExportModal.tsx` (Section 2.7).
   - Update `src/components/views/ReportsView/ReportsHeader.tsx` (Section 2.8).
   - Update `src/components/views/ReportsView/ReportsView.tsx` (Section 2.9).
4. **Verification Gates:**
   - `node --test src/lib/marcom/monthlyReportSync.test.ts src/lib/productivity/exportCenter.test.ts src/components/modals/MoreAppsMenu.test.ts`
   - `npm run drift:check`
   - `npm test`
   - `npm run build:check`
5. **Update `docs/SESSION_STATE.md`.**

---

## 5. Acceptance Criteria Checklist

- [ ] `ReportsHeader.tsx` renders `"Export Laporan PDF"` and no longer renders `"Export Center"` or `"⚡ 1-Click Executive PDF"`.
- [ ] Clicking `"Export Laporan PDF"` opens `ReportRangeExportModal`.
- [ ] Submitting `ReportRangeExportModal` validates `start <= end` and `<= 12` months.
- [ ] `POST /api/marcom/reports/export-range` auto-syncs the current calendar month and any missing months in range (Perilaku A, with `ponytail:` comment for switching to Perilaku B).
- [ ] Export refreshes the client table (`fetchReports({ silent: true })`) and opens the Executive PDF print preview with page-break separation between months.
- [ ] `npm run drift:check`, `npm test`, and `npm run build:check` all pass.


