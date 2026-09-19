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
  id?: string;
  month: string;
  year: number;
  summary?: {
    totalActivities?: number;
    completionRate?: number;
    placementsDone?: number;
    placementsTotal?: number;
    placementTotalCost?: number;
    mousApproved?: number;
    mousTotal?: number;
    mouTotalCompensation?: number;
    contentPublished?: number;
    contentTotal?: number;
    eventsCompleted?: number;
    eventsTotal?: number;
    eventsTotalAttendees?: number;
    eventsTotalBudget?: number;
  } | null;
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

function formatCurrency(val?: number | null): string {
  if (typeof val !== "number" || Number.isNaN(val) || val <= 0) return "Rp 0";
  return "Rp " + Math.round(val).toLocaleString("id-ID");
}

function parseActivity(item: unknown): { type: string; title: string; status: string; date: string; detail: string } {
  if (item && typeof item === "object") {
    const r = item as Record<string, unknown>;
    return {
      type: String(r.type ?? "ACTIVITY"),
      title: String(r.title ?? r.name ?? "—"),
      status: String(r.status ?? "DONE"),
      date: fmtDate(typeof r.date === "string" ? r.date : null),
      detail: String(r.detail ?? r.description ?? "—"),
    };
  }
  return {
    type: "ACTIVITY",
    title: String(item ?? "—"),
    status: "DONE",
    date: "—",
    detail: "—",
  };
}

/**
 * Builds a formal executive monthly report document in printable HTML format.
 * Suitable for direct browser printing (Save as PDF).
 */
export function buildSingleMonthlyReportPrint(
  report: ReportLike,
  opts?: { workspaceName?: string; generatedAt?: string }
): string {
  const generated = opts?.generatedAt ?? new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
  const ws = opts?.workspaceName ?? "Vrello Marcom Operations";
  const period = `${report.month} ${report.year}`;
  const summary = report.summary ?? {};

  const totalAct = summary.totalActivities ?? 0;
  const compRate = summary.completionRate ?? 0;
  const posmDone = summary.placementsDone ?? 0;
  const posmTotal = summary.placementsTotal ?? 0;
  const posmCost = formatCurrency(summary.placementTotalCost);
  const mousAppr = summary.mousApproved ?? 0;
  const mousVal = formatCurrency(summary.mouTotalCompensation);
  const evDone = summary.eventsCompleted ?? 0;
  const evTot = summary.eventsTotal ?? 0;
  const evAtt = (summary.eventsTotalAttendees ?? 0).toLocaleString("id-ID");
  const conPub = summary.contentPublished ?? 0;

  const achievements = Array.isArray(report.achievements) ? report.achievements : [];
  const keyIssues = Array.isArray(report.keyIssues) ? report.keyIssues : [];
  const actionPlans = Array.isArray(report.actionPlans) ? report.actionPlans : [];
  const activities = Array.isArray(report.activities) ? report.activities : [];

  const renderList = (items: unknown[], emptyText: string) => {
    if (items.length === 0) {
      return `<p class="empty">${escapeHtml(emptyText)}</p>`;
    }
    return `<ul class="points">${items
      .map((item) => `<li>${escapeHtml(text(item))}</li>`)
      .join("")}</ul>`;
  };

  const activitiesRows = activities
    .map((item, idx) => {
      const act = parseActivity(item);
      const st = act.status.toUpperCase();
      const badgeClass =
        st === "DONE" || st === "APPROVED" || st === "PUBLISHED" || st === "COMPLETED"
          ? "badge-done"
          : st === "ISSUE" || st === "CANCELLED" || st === "REJECTED"
          ? "badge-issue"
          : "badge-prog";

      return `<tr>
        <td style="width: 30px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="width: 85px; font-weight: 700; text-transform: uppercase; font-size: 9px; color: #4338ca;">${escapeHtml(act.type)}</td>
        <td style="font-weight: 600;">${escapeHtml(act.title)}</td>
        <td style="width: 90px; text-align: center;"><span class="badge ${badgeClass}">${escapeHtml(act.status)}</span></td>
        <td style="width: 85px; color: #64748b;">${escapeHtml(act.date)}</td>
        <td style="color: #475569; font-size: 10px;">${escapeHtml(act.detail)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Laporan Eksekutif Bulanan — ${escapeHtml(period)}</title>
<style>
  @page { size: A4 portrait; margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 24px;
    font-size: 11px;
    line-height: 1.5;
    background: #fff;
  }
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .org-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6366f1; margin-bottom: 2px; }
  .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; }
  .period { font-size: 14px; font-weight: 700; color: #4338ca; margin: 2px 0 0; }
  .meta { font-size: 10px; color: #64748b; text-align: right; }
  
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }
  .kpi-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .kpi-card .label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }
  .kpi-card .value {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
  }
  .kpi-card .helper {
    font-size: 9px;
    color: #64748b;
    margin-top: 2px;
  }

  .section { margin-bottom: 16px; page-break-inside: avoid; }
  .section-title {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .box-green {
    background: #f0fdf4;
    border-left: 4px solid #16a34a;
    border-top: 1px solid #bbf7d0;
    border-right: 1px solid #bbf7d0;
    border-bottom: 1px solid #bbf7d0;
    border-radius: 0 8px 8px 0;
    padding: 10px 14px;
  }
  .box-amber {
    background: #fffbeb;
    border-left: 4px solid #d97706;
    border-top: 1px solid #fef3c7;
    border-right: 1px solid #fef3c7;
    border-bottom: 1px solid #fef3c7;
    border-radius: 0 8px 8px 0;
    padding: 10px 14px;
  }
  .box-blue {
    background: #eff6ff;
    border-left: 4px solid #2563eb;
    border-top: 1px solid #dbeafe;
    border-right: 1px solid #dbeafe;
    border-bottom: 1px solid #dbeafe;
    border-radius: 0 8px 8px 0;
    padding: 10px 14px;
  }
  
  ul.points { margin: 0; padding-left: 18px; }
  ul.points li { margin-bottom: 4px; font-size: 11px; color: #334155; }
  ul.points li:last-child { margin-bottom: 0; }
  p.empty { margin: 0; font-style: italic; color: #94a3b8; font-size: 11px; }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 10px;
  }
  table.data-table th, table.data-table td {
    border: 1px solid #e2e8f0;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  table.data-table th {
    background: #f1f5f9;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 9px;
    color: #475569;
    letter-spacing: 0.03em;
  }
  
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .badge-done { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .badge-prog { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .badge-issue { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }

  .sign-off {
    margin-top: 36px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    page-break-inside: avoid;
  }
  .sign-box {
    border-top: 1px solid #cbd5e1;
    padding-top: 8px;
    text-align: center;
  }
  .sign-role { font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 48px; }
  .sign-name { font-size: 11px; font-weight: 600; text-decoration: underline; color: #1e293b; }
  .sign-date { font-size: 9px; color: #64748b; margin-top: 2px; }

  @media print {
    body { padding: 0; margin: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="org-tag">${escapeHtml(ws)}</div>
    <h1 class="title">Laporan Eksekutif Bulanan</h1>
    <div class="period">Periode: ${escapeHtml(period)}</div>
  </div>
  <div class="meta">
    <div>Dicetak: ${escapeHtml(generated)}</div>
    <div>Status: Dokumen Resmi Terverifikasi</div>
  </div>
</div>

<div class="kpi-grid">
  <div class="kpi-card">
    <div class="label">Total Kegiatan</div>
    <div class="value">${totalAct}</div>
    <div class="helper">${compRate}% Selesai Dilaksanakan</div>
  </div>
  <div class="kpi-card">
    <div class="label">Materi POSM</div>
    <div class="value">${posmDone} / ${posmTotal}</div>
    <div class="helper">Biaya: ${posmCost}</div>
  </div>
  <div class="kpi-card">
    <div class="label">Event Lapangan</div>
    <div class="value">${evDone} / ${evTot}</div>
    <div class="helper">${evAtt} Partisipan</div>
  </div>
  <div class="kpi-card">
    <div class="label">Kemitraan & Media</div>
    <div class="value">${mousAppr} MOU · ${conPub} Pos</div>
    <div class="helper">Nilai MOU: ${mousVal}</div>
  </div>
</div>

<div class="section">
  <div class="section-title" style="color: #16a34a;">
    <span>🏆</span>
    <span>Pencapaian Utama (Key Achievements)</span>
  </div>
  <div class="box-green">
    ${renderList(achievements, "Belum ada pencapaian operasional yang selesai tercatat pada periode ini.")}
  </div>
</div>

<div class="section">
  <div class="section-title" style="color: #d97706;">
    <span>⚠️</span>
    <span>Kendala & Isu Lapangan (Key Issues)</span>
  </div>
  <div class="box-amber">
    ${renderList(keyIssues, "Seluruh kegiatan operasional berjalan lancar tanpa kendala kritis yang dilaporkan.")}
  </div>
</div>

<div class="section">
  <div class="section-title" style="color: #2563eb;">
    <span>🎯</span>
    <span>Rencana Tindak Lanjut (Action Plans)</span>
  </div>
  <div class="box-blue">
    ${renderList(actionPlans, "Tidak ada rencana tindak lanjut khusus yang diagendakan.")}
  </div>
</div>

${
  activities.length > 0
    ? `<div class="section">
  <div class="section-title" style="color: #0f172a;">
    <span>📋</span>
    <span>Rincian Kegiatan Operasional (${activities.length})</span>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="text-align: center;">No</th>
        <th>Kategori</th>
        <th>Nama Kegiatan / Materi</th>
        <th style="text-align: center;">Status</th>
        <th>Tanggal</th>
        <th>Keterangan / Realisasi</th>
      </tr>
    </thead>
    <tbody>
      ${activitiesRows}
    </tbody>
  </table>
</div>`
    : ""
}

<div class="sign-off">
  <div class="sign-box">
    <div class="sign-role">Disusun Oleh (Marcom Lead)</div>
    <div class="sign-name">( _________________________ )</div>
    <div class="sign-date">Tanggal: ${escapeHtml(generated.split(" pukul")[0] || generated)}</div>
  </div>
  <div class="sign-box">
    <div class="sign-role">Disetujui Oleh (Branch Manager)</div>
    <div class="sign-name">( _________________________ )</div>
    <div class="sign-date">Tanggal: ____________________</div>
  </div>
</div>

</body>
</html>`;
}

export function printSingleMonthlyReport(
  report: ReportLike,
  opts?: { workspaceName?: string }
): void {
  const html = buildSingleMonthlyReportPrint(report, opts);
  printDocument(html);
}
