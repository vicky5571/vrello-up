/**
 * Export Center builders (pure string generation, UI-agnostic).
 *
 * Two clean output formats, no new dependencies:
 *  - Excel: UTF-8 CSV with BOM (opens directly in Excel / Sheets).
 *  - PDF: a self-contained printable HTML summary opened in a print
 *    window so the user can "Save as PDF" with one click.
 *
 * Inputs are minimal structural types so task views and marcom views can
 * share the same builders without importing each other's view models.
 */

export type CsvCell = string | number | boolean | null | undefined;
export type CsvRows = CsvCell[][];

export interface ReportLike {
  id: string;
  month: string;
  year: number;
  summary?: { totalActivities?: number; completionRate?: number } | null;
  activities?: unknown[];
  achievements?: unknown[];
  keyIssues?: unknown[];
  actionPlans?: unknown[];
}

export interface PlacementLike {
  id: string;
  status: string;
  date?: string | null;
  picName?: string;
  dimensions?: string;
  cost?: number;
  notes?: string;
  outlet?: { name?: string } | null;
  outletId?: string;
  material?: { name?: string } | null;
  materialId?: string;
}

export interface MouLike {
  id: string;
  partnerName?: string;
  outletName?: string;
  mouType?: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  picName?: string;
  compensationValue?: number;
  branch?: { name?: string } | null;
  branchId?: string;
  notes?: string;
}

export interface TaskLike {
  id: string;
  title: string;
  statusId: string;
  priority: string;
  dueDate?: string;
  assignees?: { name?: string }[];
  tags?: { name?: string }[];
}

function text(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const r = value as Record<string, unknown>;
    const t = ["title", "name", "description"]
      .map((k) => r[k])
      .find((v) => typeof v === "string");
    if (t) return t;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return String(value);
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

/** RFC-4180 quoting; prefix with BOM (`\uFEFF`) when downloading for Excel. */
export function toCsv(rows: CsvRows): string {
  return (
    rows
      .map((row) =>
        row
          .map((cell) => {
            const s = cell === null || cell === undefined ? "" : String(cell);
            return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\r\n") + "\r\n"
  );
}

export function withBom(csv: string): string {
  return csv.startsWith("﻿") ? csv : `﻿${csv}`;
}

export function csvFilename(base: string): string {
  return `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function buildReportsCsv(reports: ReportLike[]): CsvRows {
  return [
    ["Period", "Total Activities", "Completion %", "Achievements", "Key Issues", "Action Plans"],
    ...reports.map((r) => [
      `${r.month} ${r.year}`,
      r.summary?.totalActivities ?? 0,
      r.summary?.completionRate ?? 0,
      (r.achievements ?? []).map((a) => text(a)).join(" | "),
      (r.keyIssues ?? []).map((a) => text(a)).join(" | "),
      (r.actionPlans ?? []).map((a) => text(a)).join(" | "),
    ]),
  ];
}

export function buildPlacementsCsv(placements: PlacementLike[]): CsvRows {
  return [
    ["Outlet", "Material", "Status", "Date", "PIC", "Dimensions", "Cost", "Notes"],
    ...placements.map((p) => [
      p.outlet?.name ?? p.outletId ?? "—",
      p.material?.name ?? p.materialId ?? "—",
      p.status,
      fmtDate(p.date),
      p.picName ?? "—",
      p.dimensions ?? "—",
      p.cost ?? "—",
      p.notes ?? "",
    ]),
  ];
}

export function buildMousCsv(mous: MouLike[]): CsvRows {
  return [
    ["Partner", "Outlet", "Type", "Branch", "Status", "Start", "End", "PIC", "Compensation", "Notes"],
    ...mous.map((m) => [
      m.partnerName ?? "—",
      m.outletName ?? "—",
      m.mouType ?? "—",
      m.branch?.name ?? m.branchId ?? "—",
      m.status,
      fmtDate(m.startDate),
      fmtDate(m.endDate),
      m.picName ?? "—",
      m.compensationValue ?? "—",
      m.notes ?? "",
    ]),
  ];
}

export function buildTasksCsv(tasks: TaskLike[]): CsvRows {
  return [
    ["Title", "Status ID", "Priority", "Due Date", "Assignees", "Tags"],
    ...tasks.map((t) => [
      t.title,
      t.statusId,
      t.priority,
      t.dueDate ?? "",
      (t.assignees ?? []).map((a) => a.name ?? "").join("; "),
      (t.tags ?? []).map((g) => g.name ?? "").join("; "),
    ]),
  ];
}

export interface PrintTable {
  columns: string[];
  rows: CsvCell[][];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Self-contained printable HTML doc; caller opens it in a print window. */
export function buildPrintHtml(opts: {
  title: string;
  subtitle?: string;
  tables: { heading?: string; columns: string[]; rows: CsvCell[][] }[];
  generatedAt?: string;
}): string {
  const generated = opts.generatedAt ?? new Date().toLocaleString();
  const tables = opts.tables
    .map((t) => {
      const head = t.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
      const body = t.rows
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td>${escapeHtml(c === null || c === undefined ? "" : String(c))}</td>`).join("")}</tr>`,
        )
        .join("");
      return `${t.heading ? `<h2>${escapeHtml(t.heading)}</h2>` : ""}
<table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${t.columns.length}" class="muted">No rows.</td></tr>`}</tbody></table>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${escapeHtml(opts.title)}</title>
<style>
body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#111827;margin:32px;font-size:12px}
h1{font-size:20px;margin:0 0 4px}p.sub{color:#6b7280;margin:0 0 16px}
h2{font-size:14px;margin:20px 0 8px}
table{width:100%;border-collapse:collapse;margin-bottom:8px}
th,td{border:1px solid #d1d5db;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f3f4f6;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.muted{color:#9ca3af}
@media print{body{margin:0}}
</style></head><body>
<h1>${escapeHtml(opts.title)}</h1>
<p class="sub">${escapeHtml(opts.subtitle ?? `Generated ${generated}`)}</p>
${tables}
</body></html>`;
}

/** Browser-only: triggers a CSV file download (no-op on server). */
export function downloadCsv(filename: string, rows: CsvRows): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([withBom(toCsv(rows))], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Browser-only: opens the printable doc in a new window for Save-as-PDF. */
export function printDocument(html: string): void {
  if (typeof window === "undefined") return;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  // Let the new window finish parsing before invoking print.
  w.setTimeout(() => {
    w.print();
  }, 250);
}

export function buildReportsPrint(reports: ReportLike[]): string {
  return buildPrintHtml({
    title: "Monthly Reports Summary",
    tables: [
      {
        heading: `Reports (${reports.length})`,
        columns: ["Period", "Activities", "Completion %", "Achievements", "Key Issues"],
        rows: reports.map((r) => [
          `${r.month} ${r.year}`,
          r.summary?.totalActivities ?? 0,
          `${r.summary?.completionRate ?? 0}%`,
          (r.achievements ?? []).map((a) => text(a)).join("; "),
          (r.keyIssues ?? []).map((a) => text(a)).join("; "),
        ]),
      },
    ],
  });
}

export function buildPlacementsPrint(placements: PlacementLike[]): string {
  return buildPrintHtml({
    title: "Placements Summary",
    tables: [
      {
        heading: `Placements (${placements.length})`,
        columns: ["Outlet", "Material", "Status", "Date", "PIC", "Cost"],
        rows: placements.map((p) => [
          p.outlet?.name ?? p.outletId ?? "—",
          p.material?.name ?? p.materialId ?? "—",
          p.status,
          fmtDate(p.date),
          p.picName ?? "—",
          p.cost ?? "—",
        ]),
      },
    ],
  });
}

export function buildMousPrint(mous: MouLike[]): string {
  return buildPrintHtml({
    title: "MOUs Summary",
    tables: [
      {
        heading: `MOUs (${mous.length})`,
        columns: ["Partner", "Type", "Branch", "Status", "Period", "PIC"],
        rows: mous.map((m) => [
          m.partnerName ?? "—",
          m.mouType ?? "—",
          m.branch?.name ?? m.branchId ?? "—",
          m.status,
          `${fmtDate(m.startDate)} → ${fmtDate(m.endDate)}`,
          m.picName ?? "—",
        ]),
      },
    ],
  });
}

export function buildTasksPrint(tasks: TaskLike[]): string {
  return buildPrintHtml({
    title: "Selected Tasks",
    tables: [
      {
        heading: `Tasks (${tasks.length})`,
        columns: ["Title", "Status", "Priority", "Due", "Assignees"],
        rows: tasks.map((t) => [
          t.title,
          t.statusId,
          t.priority,
          t.dueDate ?? "—",
          (t.assignees ?? []).map((a) => a.name ?? "").join("; ") || "—",
        ]),
      },
    ],
  });
}
