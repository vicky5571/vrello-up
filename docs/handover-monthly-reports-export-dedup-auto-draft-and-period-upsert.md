# Handover: Monthly Reports Export Button Deduplication, Automatic Draft Fetch on Open/Change, and Single-Row Period Upsert with Rollover Sync (ADR-0094)

- **Date:** 2026-11-08
- **Status:** Planning Complete — Ready for Implementation
- **ADR:** [ADR-0094](adr/0094-monthly-reports-export-dedup-auto-draft-and-period-upsert.md)
- **Spec:** [2026-11-08-monthly-reports-export-dedup-auto-draft-and-period-upsert-design.md](superpowers/specs/2026-11-08-monthly-reports-export-dedup-auto-draft-and-period-upsert-design.md)
- **Plan:** [2026-11-08-monthly-reports-export-dedup-auto-draft-and-period-upsert.md](superpowers/plans/2026-11-08-monthly-reports-export-dedup-auto-draft-and-period-upsert.md)

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/lib/marcom/monthlyReportSync.test.ts` | Add unit tests for `resolvePreviousMonthPeriod` (mid-year and January → December rollover). |
| `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` | Add ADR-0094 assertions for export button deduplication, removal of `"Tarik Data Otomatis"`, and backend `(month, year)` upsert. |
| `src/lib/marcom/monthlyReportSync.ts` | Add pure helper `resolvePreviousMonthPeriod(date?: Date)`. |
| `src/app/api/cron/reports-sync/route.ts` | On days 1–3 of a month (without query overrides), run `syncMonthlyReport` for the previous month before syncing the current month. |
| `src/app/api/marcom/reports/route.ts` | Upsert `MonthlyReport` by `(month, year)` in `POST` (update existing row instead of creating duplicates). |
| `src/components/views/ReportsView/monthlyReportExpandedRowHelpers.ts` | Make `onPrintReport` optional in `MonthlyReportExpandedRowProps`. |
| `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx` | Remove duplicate `"Cetak Dokumen Resmi (Save as PDF)"` button and unused `Printer` icon. |
| `src/components/views/ReportsView/ReportsView.tsx` | Remove `"⚡ Tarik Data Otomatis (Auto-Draft)"` button and trigger draft fetch automatically via `useEffect` when opening the form or changing `(month, year)`. |
| `docs/SESSION_STATE.md` | Record ADR-0094 implementation status. |

---

## 2. Exact Code Changes

### 2.1 `src/lib/marcom/monthlyReportSync.test.ts`

#### Current Code (Lines 1–16)
```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasCustomNarratives,
  syncMonthlyReport,
} from "./monthlyReportSync";

describe("monthlyReportSync domain engine (ADR-0036)", () => {
  describe("hasCustomNarratives helper", () => {
    it("returns false for non-array, null, or empty array", () => {
      assert.strictEqual(hasCustomNarratives(null, ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives(undefined, ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives([], ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives("not-array", ["A", "B"]), false);
    });
```

#### Replacement Code
```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasCustomNarratives,
  resolvePreviousMonthPeriod,
  syncMonthlyReport,
} from "./monthlyReportSync";

describe("monthlyReportSync domain engine (ADR-0036)", () => {
  describe("resolvePreviousMonthPeriod helper (ADR-0094)", () => {
    it("resolves previous month within the same year (e.g. 1 December 2026 -> November 2026)", () => {
      const res = resolvePreviousMonthPeriod(new Date(2026, 11, 1));
      assert.deepStrictEqual(res, { month: "November", year: 2026 });
    });

    it("resolves previous month across year boundary (e.g. 1 January 2027 -> December 2026)", () => {
      const res = resolvePreviousMonthPeriod(new Date(2027, 0, 1));
      assert.deepStrictEqual(res, { month: "December", year: 2026 });
    });
  });

  describe("hasCustomNarratives helper", () => {
    it("returns false for non-array, null, or empty array", () => {
      assert.strictEqual(hasCustomNarratives(null, ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives(undefined, ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives([], ["A", "B"]), false);
      assert.strictEqual(hasCustomNarratives("not-array", ["A", "B"]), false);
    });
```

---

### 2.2 `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`

#### Current Code (Lines 89–100)
```ts
    it("ReportsView.tsx mounts MonthlyReportExpandedRow and eliminates legacy ReportSection", () => {
      const coordCode = fs.readFileSync(coordinatorPath, "utf-8");

      assert.match(coordCode, /MonthlyReportExpandedRow/);
      assert.strictEqual(
        coordCode.includes("function ReportSection"),
        false,
        "Expected obsolete ReportSection function to be eliminated"
      );
    });
  });
});
```

#### Replacement Code
```ts
    it("ReportsView.tsx mounts MonthlyReportExpandedRow and eliminates legacy ReportSection", () => {
      const coordCode = fs.readFileSync(coordinatorPath, "utf-8");

      assert.match(coordCode, /MonthlyReportExpandedRow/);
      assert.strictEqual(
        coordCode.includes("function ReportSection"),
        false,
        "Expected obsolete ReportSection function to be eliminated"
      );
    });

    it("verifies duplicate Cetak Dokumen Resmi and manual Tarik Data Otomatis buttons are removed and POST route upserts by period (ADR-0094)", () => {
      const expandedCode = fs.readFileSync(subcomponentPath, "utf-8");
      const coordCode = fs.readFileSync(coordinatorPath, "utf-8");
      const routePath = path.resolve(
        process.cwd(),
        "src/app/api/marcom/reports/route.ts"
      );
      const routeCode = fs.readFileSync(routePath, "utf-8");

      assert.ok(
        !expandedCode.includes("Cetak Dokumen Resmi (Save as PDF)"),
        "MonthlyReportExpandedRow must not render duplicate Cetak Dokumen Resmi (Save as PDF) button"
      );
      assert.ok(
        coordCode.includes("Export PDF") &&
          !coordCode.includes("Tarik Data Otomatis (Auto-Draft)"),
        "ReportsView must retain Export PDF button on row and remove manual Tarik Data Otomatis (Auto-Draft) button"
      );
      assert.ok(
        routeCode.includes("prisma.monthlyReport.findFirst") &&
          routeCode.includes("prisma.monthlyReport.update"),
        "POST /api/marcom/reports must check findFirst and update existing (month, year) report row"
      );
    });
  });
});
```

---

### 2.3 `src/lib/marcom/monthlyReportSync.ts`

#### Current Code (Lines 26–52)
```ts
/**
 * Checks whether an existing narrative array has been customized by an admin.
 * If user customized it, returns true to prevent daily cron from overwriting.
 */
export function hasCustomNarratives(
  existingNarratives: unknown,
  defaultNarratives: string[],
): boolean {
  if (!Array.isArray(existingNarratives) || existingNarratives.length === 0) return false;
  // If lengths differ or content differs from standard synthesized bullets, consider custom
  if (existingNarratives.length !== defaultNarratives.length) return true;
  return existingNarratives.some(
    (item, idx) => String(item).trim() !== String(defaultNarratives[idx]).trim()
  );
}

/**
 * Performs atomic daily synchronization and monthly report kickoff.
 * - If report does not exist for (month, year): creates it automatically.
 * - If report exists: refreshes summary metrics and activities, but strictly preserves user-authored narratives.
 */
export async function syncMonthlyReport(opts?: SyncReportOptions): Promise<SyncReportResult> {
```

#### Replacement Code
```ts
/**
 * Resolves the immediately preceding calendar month and year for rollover syncs.
 */
export function resolvePreviousMonthPeriod(date: Date = new Date()): {
  month: string;
  year: number;
} {
  const currentMonthIdx = date.getMonth();
  if (currentMonthIdx === 0) {
    return { month: MONTH_OPTIONS[11], year: date.getFullYear() - 1 };
  }
  return { month: MONTH_OPTIONS[currentMonthIdx - 1], year: date.getFullYear() };
}

/**
 * Checks whether an existing narrative array has been customized by an admin.
 * If user customized it, returns true to prevent daily cron from overwriting.
 */
export function hasCustomNarratives(
  existingNarratives: unknown,
  defaultNarratives: string[],
): boolean {
  if (!Array.isArray(existingNarratives) || existingNarratives.length === 0) return false;
  // If lengths differ or content differs from standard synthesized bullets, consider custom
  if (existingNarratives.length !== defaultNarratives.length) return true;
  return existingNarratives.some(
    (item, idx) => String(item).trim() !== String(defaultNarratives[idx]).trim()
  );
}

/**
 * Performs atomic daily synchronization and monthly report kickoff.
 * - If report does not exist for (month, year): creates it automatically.
 * - If report exists: refreshes summary metrics and activities, but strictly preserves user-authored narratives.
 */
export async function syncMonthlyReport(opts?: SyncReportOptions): Promise<SyncReportResult> {
```

---

### 2.4 `src/app/api/cron/reports-sync/route.ts`

#### Current Code (Lines 1–39)
```ts
import { NextResponse } from "next/server";
import { syncMonthlyReport } from "@/lib/marcom/monthlyReportSync";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, enforce CRON_SECRET authorization header
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized cron execution" },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : undefined;

    const result = await syncMonthlyReport({ month, year });

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("GET /api/cron/reports-sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute reports cron sync" },
      { status: 500 }
    );
  }
}
```

#### Replacement Code
```ts
import { NextResponse } from "next/server";
import {
  resolvePreviousMonthPeriod,
  syncMonthlyReport,
} from "@/lib/marcom/monthlyReportSync";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, enforce CRON_SECRET authorization header
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized cron execution" },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : undefined;

    // On days 1-3 of a new month (when no explicit period query is passed),
    // first run a final rollover update for the previous month (updating any
    // report created mid-month, e.g. on 8 November, with complete end-of-month metrics).
    const now = new Date();
    const previousMonthResult =
      !month && !yearParam && now.getDate() <= 3
        ? await syncMonthlyReport(resolvePreviousMonthPeriod(now))
        : undefined;

    const result = await syncMonthlyReport({ month, year });

    return NextResponse.json({
      ok: true,
      syncedAt: now.toISOString(),
      previousMonthResult,
      result,
    });
  } catch (error) {
    console.error("GET /api/cron/reports-sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute reports cron sync" },
      { status: 500 }
    );
  }
}
```

---

### 2.5 `src/app/api/marcom/reports/route.ts`

#### Current Code (Lines 36–65)
```ts
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { month, year, summary, activities, achievements, keyIssues, actionPlans } =
    body ?? {};
  if (!month || year === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: month, year" },
      { status: 400 },
    );
  }
  if (typeof month !== "string" || !Number.isInteger(year)) {
    return NextResponse.json(
      { error: "Invalid month or year" },
      { status: 400 },
    );
  }

  const report = await prisma.monthlyReport.create({
    data: {
      month,
      year,
      summary: (summary ?? {}) as Prisma.InputJsonValue,
      activities: asJsonArray(activities),
      achievements: asJsonArray(achievements),
      keyIssues: asJsonArray(keyIssues),
      actionPlans: asJsonArray(actionPlans),
    },
  });
  return NextResponse.json(report, { status: 201 });
}
```

#### Replacement Code
```ts
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { month, year, summary, activities, achievements, keyIssues, actionPlans } =
    body ?? {};
  if (!month || year === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: month, year" },
      { status: 400 },
    );
  }
  if (typeof month !== "string" || !Number.isInteger(year)) {
    return NextResponse.json(
      { error: "Invalid month or year" },
      { status: 400 },
    );
  }

  const normalizedMonth = month.trim();
  const existing = await prisma.monthlyReport.findFirst({
    where: {
      month: { equals: normalizedMonth, mode: "insensitive" },
      year,
    },
  });

  if (existing) {
    const updated = await prisma.monthlyReport.update({
      where: { id: existing.id },
      data: {
        month: normalizedMonth,
        year,
        summary: (summary ?? {}) as Prisma.InputJsonValue,
        activities: asJsonArray(activities),
        achievements: asJsonArray(achievements),
        keyIssues: asJsonArray(keyIssues),
        actionPlans: asJsonArray(actionPlans),
      },
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const report = await prisma.monthlyReport.create({
    data: {
      month: normalizedMonth,
      year,
      summary: (summary ?? {}) as Prisma.InputJsonValue,
      activities: asJsonArray(activities),
      achievements: asJsonArray(achievements),
      keyIssues: asJsonArray(keyIssues),
      actionPlans: asJsonArray(actionPlans),
    },
  });
  return NextResponse.json(report, { status: 201 });
}
```

---

### 2.6 `src/components/views/ReportsView/monthlyReportExpandedRowHelpers.ts`

#### Current Code (Lines 58–66)
```ts
export interface MonthlyReportExpandedRowProps<T extends MonthlyReportExpandedItem = MonthlyReportExpandedItem> {
  report: T;
  periodLabel: string;
  supporting: MonthlyReportSupportingDoc[];
  canManage: boolean;
  isDeletingId: string | null;
  onDeleteReport: (report: T) => void | Promise<void>;
  onPrintReport: (report: T) => void | Promise<void>;
}
```

#### Replacement Code
```ts
export interface MonthlyReportExpandedRowProps<T extends MonthlyReportExpandedItem = MonthlyReportExpandedItem> {
  report: T;
  periodLabel: string;
  supporting: MonthlyReportSupportingDoc[];
  canManage: boolean;
  isDeletingId: string | null;
  onDeleteReport: (report: T) => void | Promise<void>;
  onPrintReport?: (report: T) => void | Promise<void>;
}
```

---

### 2.7 `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx`

#### Current Code (Lines 4–15 & 64–89)
```tsx
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Printer,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  ExternalLink,
} from "lucide-react";
```
and:
```tsx
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => onDeleteReport(report)}
              disabled={isDeletingId === report.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeletingId === report.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isDeletingId === report.id ? "Menghapus..." : "Hapus Laporan"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onPrintReport(report)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen Resmi (Save as PDF)</span>
          </button>
        </div>
```

#### Replacement Code
Remove `Printer,` from `lucide-react` imports (and `onPrintReport,` from the destructured props at line 44), and replace lines 64–89 with:
```tsx
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => onDeleteReport(report)}
              disabled={isDeletingId === report.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeletingId === report.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isDeletingId === report.id ? "Menghapus..." : "Hapus Laporan"}</span>
            </button>
          )}
        </div>
```

---

### 2.8 `src/components/views/ReportsView/ReportsView.tsx`

#### Current Code A — Auto-Draft Handler (Lines 230–266)
```tsx
  const handleAutoDraft = async () => {
    if (!month.trim()) {
      toast.error("Pilih bulan terlebih dahulu");
      return;
    }
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear)) {
      toast.error("Tahun tidak valid");
      return;
    }
    setIsDrafting(true);
    try {
      const res = await fetch(
        `/api/marcom/reports/draft?month=${encodeURIComponent(month.trim())}&year=${parsedYear}`,
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal menarik data (${res.status})`);
      }
      const json = await res.json();
      const draft: ReportDraftResult = json.draft;
      if (draft) {
        setDraftData(draft);
        setTotalActivities(String(draft.summary.totalActivities));
        setCompletionRate(String(draft.summary.completionRate));
        setAchievementsText(draft.achievements.join("\n"));
        setKeyIssuesText(draft.keyIssues.join("\n"));
        setActionPlansText(draft.actionPlans.join("\n"));
        setActivitiesList(draft.activities);
        toast.success("Draf laporan berhasil disusun dari data operasional!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat draf laporan");
    } finally {
      setIsDrafting(false);
    }
  };
```

#### Replacement Code A — Automatic Draft `useEffect`
```tsx
  useEffect(() => {
    if (!showCreateForm) return;
    const trimmedMonth = month.trim();
    const parsedYear = Number(year);
    if (!trimmedMonth || !Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return;
    }

    let cancelled = false;
    setIsDrafting(true);

    fetch(
      `/api/marcom/reports/draft?month=${encodeURIComponent(trimmedMonth)}&year=${parsedYear}`,
    )
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Gagal menarik data (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const draft: ReportDraftResult = json.draft;
        if (draft) {
          setDraftData(draft);
          setTotalActivities(String(draft.summary.totalActivities));
          setCompletionRate(String(draft.summary.completionRate));
          setAchievementsText(draft.achievements.join("\n"));
          setKeyIssuesText(draft.keyIssues.join("\n"));
          setActionPlansText(draft.actionPlans.join("\n"));
          setActivitiesList(draft.activities);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Gagal membuat draf laporan");
      })
      .finally(() => {
        if (!cancelled) setIsDrafting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showCreateForm, month, year]);
```

#### Current Code B — Auto-Draft Banner in Create Form (Lines 477–498)
```tsx
              {/* Auto-Draft trigger banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-violet-900 dark:text-violet-200">
                      Otomasi Laporan:
                    </span>{" "}
                    Tarik metrik riil dari POSM, MOU, Media Sosial, & Field Events untuk periode{" "}
                    <strong>{month} {year}</strong>.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDraft}
                  disabled={isDrafting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Sparkles className={cn("w-3.5 h-3.5", isDrafting && "animate-spin")} />
                  <span>{isDrafting ? "Menghitung data..." : "⚡ Tarik Data Otomatis (Auto-Draft)"}</span>
                </button>
              </div>
```

#### Replacement Code B — Auto-Draft Info Banner (No Button)
```tsx
              {/* Auto-Draft status banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/50">
                <div className="flex items-center gap-2">
                  <Sparkles className={cn("w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0", isDrafting && "animate-spin")} />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-violet-900 dark:text-violet-200">
                      Otomasi Laporan:
                    </span>{" "}
                    {isDrafting ? (
                      <span>Menghitung metrik operasional untuk periode <strong>{month} {year}</strong>...</span>
                    ) : (
                      <span>Metrik riil dari POSM, MOU, Media Sosial, & Field Events untuk periode <strong>{month} {year}</strong> telah ditarik otomatis.</span>
                    )}
                  </div>
                </div>
              </div>
```

---

## 3. Explicit "Do Not Touch" List

| File / Section | Reason |
| :--- | :--- |
| `ReportsView.tsx` row header `"Export PDF"` button (lines 683–696) | Selected by user as the single row-level PDF export action. |
| `src/lib/marcom/reportDraftEngine.ts` & `src/lib/productivity/exportCenter.ts` | Calculation logic and PDF layout are unaffected. |
| `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` | Out of scope. |
| `prisma/schema.prisma` | Upsert is handled cleanly at the application/service layer without destructive schema migration. |

---

## 4. Numbered Execution Order

1. **Write Failing Tests:**
   - Update `src/lib/marcom/monthlyReportSync.test.ts` (Section 2.1) and `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` (Section 2.2).
   - Run `node --test src/lib/marcom/monthlyReportSync.test.ts src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` and confirm the new tests fail.
2. **Implement Backend Rollover & Upsert:**
   - Update `src/lib/marcom/monthlyReportSync.ts` (Section 2.3), `src/app/api/cron/reports-sync/route.ts` (Section 2.4), and `src/app/api/marcom/reports/route.ts` (Section 2.5).
3. **Implement UI Deduplication & Automatic Draft Fetch:**
   - Update `src/components/views/ReportsView/monthlyReportExpandedRowHelpers.ts` (Section 2.6), `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx` (Section 2.7), and `src/components/views/ReportsView/ReportsView.tsx` (Section 2.8).
4. **Run Verification Gates:**
   - `node --test src/lib/marcom/monthlyReportSync.test.ts src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`
   - `npm run drift:check`
   - `npm test`
   - `npm run build:check`
5. **Update `docs/SESSION_STATE.md`.**

---

## 5. Acceptance Criteria Checklist

- [ ] `MonthlyReportExpandedRow.tsx` no longer renders `"Cetak Dokumen Resmi (Save as PDF)"`; `"Export PDF"` on the row header in `ReportsView.tsx` remains the sole row export button.
- [ ] `ReportsView.tsx` no longer renders the `"⚡ Tarik Data Otomatis (Auto-Draft)"` button; opening `Buat Laporan Bulanan` or changing `Bulan (Month)` / `Tahun (Year)` automatically fetches and populates the draft metrics and narratives.
- [ ] `POST /api/marcom/reports` updates an existing `MonthlyReport` row when `(month, year)` already exists instead of creating a duplicate row.
- [ ] `resolvePreviousMonthPeriod` accurately computes the preceding month and year, and `GET /api/cron/reports-sync` runs a rollover update for the previous month on days 1–3 of a new month.
- [ ] `npm run drift:check`, `npm test`, and `npm run build:check` pass with 0 failures.



