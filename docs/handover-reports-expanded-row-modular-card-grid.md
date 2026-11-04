# Handover: Reports Expanded Row Modular Card Grid Styling & Atomic Extraction (ADR-0035)

- **Spec:** `docs/superpowers/specs/2026-11-05-reports-expanded-row-modular-card-grid-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-reports-expanded-row-modular-card-grid.md`
- **ADR:** `docs/adr/0035-reports-expanded-row-modular-card-grid.md`
- **Date:** 2026-11-05
- **Status:** READY FOR EXECUTION

## 1. Exact File Manifest & Purpose

1. `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`
   - *Purpose:* Automated test verifying pure activity parsing logic, subcomponent existence, 4-card structure, and coordinator wiring.
2. `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx`
   - *Purpose:* Atomic subcomponent implementing the 2x2 modular card grid, parsed activities list, and supporting documents strip.
3. `src/components/views/ReportsView/ReportsView.tsx`
   - *Purpose:* Coordinator view that replaces inline expanded row markup with `<MonthlyReportExpandedRow ... />`, reducing coordinator LOC.
4. `src/components/views/ReportsView/ReportsHeader.tsx` & `QuarterlyPosmReportTab.tsx`
   - *Purpose:* DO NOT TOUCH. Distinct report views and headers that remain completely untouched.

## 2. Exact Current Code Snippets

### A. Current Inline `ReportSection` in `src/components/views/ReportsView/ReportsView.tsx` (Lines 104–120)
```tsx
function ReportSection({ title, items }: { title: string; items: unknown[] }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <div className="text-slate-400 dark:text-slate-500">—</div>
      ) : (
        <ul className="list-disc pl-4 space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="text-slate-700 dark:text-slate-300 break-words">
              {renderJsonItem(item, "—")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### B. Current Expanded Row JSX in `src/components/views/ReportsView/ReportsView.tsx` (Lines 727–804)
```tsx
                  {isExpanded && (
                    <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200/60 dark:border-slate-800">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Rincian Dokumen Laporan — {periodLabel(report)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Dokumen resmi siap cetak atau simpan sebagai PDF eksekutif
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(report)}
                              disabled={isDeletingId === report.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isDeletingId === report.id
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                              <span>{isDeletingId === report.id ? "Menghapus..." : "Hapus Laporan"}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              printSingleMonthlyReport(report, {
                                workspaceName: "Vrello Marcom Operations",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Dokumen Resmi (Save as PDF)</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <ReportSection title="Activities" items={report.activities ?? []} />
                        <ReportSection title="Achievements" items={report.achievements ?? []} />
                        <ReportSection title="Key issues" items={report.keyIssues ?? []} />
                        <ReportSection title="Action plans" items={report.actionPlans ?? []} />
                      </div>
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                          Supporting documents ({supporting.length})
                        </div>
                        {supporting.length === 0 ? (
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            No documents filed under this period.
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {supporting.map((doc) => (
                              <li key={doc.id} className="text-xs">
                                <a
                                  href={doc.filePath}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                                >
                                  {doc.name}
                                </a>
                                <span className="text-slate-400 dark:text-slate-500">
                                  {" "}· {doc.fileType}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
```

## 3. Exact Change Instructions

### Change 1: Create `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx`
Create this new atomic subcomponent:
```tsx
"use client";

import React from "react";
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
import type { ReportItem, DocumentItem } from "@/types";
import { cn } from "@/lib/utils";

export interface ParsedActivityItem {
  category: "POSM" | "MOU" | "CONTENT" | "EVENT" | "GENERAL";
  title: string;
  detail?: string;
}

export function parseActivityDisplay(item: unknown): ParsedActivityItem {
  if (!item) return { category: "GENERAL", title: "—" };
  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    const rawType = String(record.type || "").toUpperCase();
    const rawTitle = String(record.title || record.name || "—");
    const rawDetail = typeof record.detail === "string" ? record.detail : undefined;

    let category: ParsedActivityItem["category"] = "GENERAL";
    if (rawType.includes("PLACEMENT") || rawTitle.startsWith("[POSM]")) category = "POSM";
    else if (rawType.includes("MOU") || rawTitle.startsWith("[MOU]")) category = "MOU";
    else if (rawType.includes("CONTENT") || rawTitle.startsWith("[KONTEN]")) category = "CONTENT";
    else if (rawType.includes("EVENT") || rawTitle.startsWith("[EVENT]")) category = "EVENT";

    const cleanTitle = rawTitle.replace(/^\[(POSM|MOU|KONTEN|EVENT)\]\s*/i, "").trim();
    return { category, title: cleanTitle, detail: rawDetail };
  }
  const str = String(item);
  let category: ParsedActivityItem["category"] = "GENERAL";
  if (str.startsWith("[POSM]")) category = "POSM";
  else if (str.startsWith("[MOU]")) category = "MOU";
  else if (str.startsWith("[KONTEN]")) category = "CONTENT";
  else if (str.startsWith("[EVENT]")) category = "EVENT";

  const cleanTitle = str.replace(/^\[(POSM|MOU|KONTEN|EVENT)\]\s*/i, "").trim();
  const [titlePart, ...detailParts] = cleanTitle.split(" · ");
  return {
    category,
    title: titlePart || cleanTitle,
    detail: detailParts.join(" · ") || undefined,
  };
}

export interface MonthlyReportExpandedRowProps {
  report: ReportItem;
  periodLabel: string;
  supporting: DocumentItem[];
  canManage: boolean;
  isDeletingId: string | null;
  onDeleteReport: (report: ReportItem) => void;
  onPrintReport: (report: ReportItem) => void;
}

const CATEGORY_STYLES: Record<ParsedActivityItem["category"], { bg: string; text: string }> = {
  POSM: { bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/60", text: "text-emerald-700 dark:text-emerald-300" },
  MOU: { bg: "bg-violet-50 dark:bg-violet-950/50 border-violet-200/60 dark:border-violet-800/60", text: "text-violet-700 dark:text-violet-300" },
  CONTENT: { bg: "bg-sky-50 dark:bg-sky-950/50 border-sky-200/60 dark:border-sky-800/60", text: "text-sky-700 dark:text-sky-300" },
  EVENT: { bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/60", text: "text-amber-700 dark:text-amber-300" },
  GENERAL: { bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300" },
};

export function MonthlyReportExpandedRow({
  report,
  periodLabel,
  supporting,
  canManage,
  isDeletingId,
  onDeleteReport,
  onPrintReport,
}: MonthlyReportExpandedRowProps) {
  const activities = Array.isArray(report.activities) ? report.activities : [];
  const achievements = Array.isArray(report.achievements) ? report.achievements : [];
  const keyIssues = Array.isArray(report.keyIssues) ? report.keyIssues : [];
  const actionPlans = Array.isArray(report.actionPlans) ? report.actionPlans : [];

  return (
    <div className="px-4 py-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* 1. Header Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            Rincian Dokumen Laporan — {periodLabel}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Dokumen resmi siap cetak atau simpan sebagai PDF eksekutif
          </span>
        </div>
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
      </div>

      {/* 2. 2x2 Modular Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: Activities */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Aktivitas Operasional
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              {activities.length}
            </span>
          </div>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Belum ada aktivitas tercatat.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {activities.map((act, i) => {
                const parsed = parseActivityDisplay(act);
                const style = CATEGORY_STYLES[parsed.category];
                return (
                  <div key={i} className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 mt-0.5", style.bg, style.text)}>
                      {parsed.category}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug break-words">
                        {parsed.title}
                      </div>
                      {parsed.detail && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {parsed.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 2: Achievements */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Capaian Utama
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {achievements.length}
            </span>
          </div>
          {achievements.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Belum ada capaian operasional tercatat.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto pr-1">
              {achievements.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="break-words leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 3: Key Issues */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Kendala & Isu Lapangan
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              {keyIssues.length}
            </span>
          </div>
          {keyIssues.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Seluruh kegiatan operasional berjalan lancar tanpa kendala kritis.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto pr-1">
              {keyIssues.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className="break-words leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 4: Action Plans */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                Rencana Tindak Lanjut
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              {actionPlans.length}
            </span>
          </div>
          {actionPlans.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Belum ada rencana tindak lanjut khusus yang diagendakan.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto pr-1">
              {actionPlans.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span className="break-words leading-relaxed">{String(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Supporting Documents Strip */}
      <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
            Dokumen Pendukung ({supporting.length})
          </span>
        </div>
        {supporting.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            Tidak ada berkas dokumen yang terlampir pada periode ini.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {supporting.map((doc) => (
              <a
                key={doc.id}
                href={doc.filePath}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer group"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                  {doc.fileType}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Change 2: In `src/components/views/ReportsView/ReportsView.tsx`
1. Import `MonthlyReportExpandedRow` from `./MonthlyReportExpandedRow`.
2. Replace lines 727–804 with:
   ```tsx
   {isExpanded && (
     <MonthlyReportExpandedRow
       report={report}
       periodLabel={periodLabel(report)}
       supporting={supporting}
       canManage={canManage}
       isDeletingId={isDeletingId}
       onDeleteReport={handleDeleteReport}
       onPrintReport={(r) =>
         printSingleMonthlyReport(r, {
           workspaceName: "Vrello Marcom Operations",
         })
       }
     />
   )}
   ```
3. Remove obsolete inline `ReportSection` function definition.

## 4. Explicit "Do Not Touch" List with Reasons

| File / Component | Reason |
| :--- | :--- |
| `src/components/views/ReportsView/ReportsHeader.tsx` | Header bar handles instant export and modal triggers. Unaffected by expanded row changes. |
| `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` | POSM quarterly tab logic is strictly partitioned from monthly report expanded rows. |
| `/api/marcom/reports` API routes | API layer remains untouched; data flow is strictly view-layer presentation. |
| `prisma/schema.prisma` | Zero database schema changes required. |

## 5. Numbered Execution Order

1. **Step 1 (TDD Red):**
   - Create `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` testing `parseActivityDisplay` logic, component presence, and coordinator wiring.
   - Run:
     ```bash
     node --test --import ./test/register-alias.mjs src/components/views/ReportsView/monthlyReportExpandedRow.test.ts
     ```
     *(Confirm RED state).*

2. **Step 2 (Implementation Green):**
   - Create `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx` with full modular card grid implementation.
   - Update `src/components/views/ReportsView/ReportsView.tsx` to mount `<MonthlyReportExpandedRow ... />` and delete legacy `ReportSection`.
   - Run:
     ```bash
     node --test --import ./test/register-alias.mjs src/components/views/ReportsView/monthlyReportExpandedRow.test.ts
     ```
     *(Confirm GREEN state).*

3. **Step 3 (Full Verification Gates):**
   ```bash
   npm run drift:check
   npm run build:check
   npm test
   ```
   *(Confirm 0 drift, 0 build errors, 0 test failures).*

4. **Step 4 (Documentation Updates):**
   - Update `docs/superpowers/specs/2026-11-05-reports-expanded-row-modular-card-grid-design.md` status to `IMPLEMENTED`.
   - Update `docs/superpowers/plans/2026-11-05-reports-expanded-row-modular-card-grid.md` task checkboxes.
   - Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 6. Acceptance Criteria Checklist

- [ ] `MonthlyReportExpandedRow.tsx` exists and is mounted in `ReportsView.tsx`.
- [ ] 4 modular cards render with themed icons (`Layers`, `CheckCircle2`, `AlertTriangle`, `ArrowUpRight`) and count badges.
- [ ] Activity strings are parsed into clean category pills (`POSM`, `MOU`, `CONTENT`, `EVENT`) without raw brackets.
- [ ] Supporting documents render as clean file card chips with `FileText` icon and file format chips.
- [ ] Action buttons (Hapus Laporan & Cetak Dokumen) function identically to before.
- [ ] `ReportsView.tsx` LOC decreases by $\ge 60$ LOC.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures across all test suites.




