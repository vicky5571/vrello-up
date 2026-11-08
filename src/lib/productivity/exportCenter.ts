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
      date: formatIdDate(typeof r.date === "string" ? r.date : null),
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

function formatIdDate(isoString?: string | null): string {
  if (!isoString) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoString)) return isoString;
  const isoMatch = isoString.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const d = new Date(isoString);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(isoString);
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
  const ws = opts?.workspaceName ?? "Vrello Up";
  const period = `${report.month} ${report.year}`;
  const monthCode = (report.month || "BLN").slice(0, 3).toUpperCase();
  const docNumber = `VRL/MRK/REP/${report.year || new Date().getFullYear()}/${monthCode}/001`;
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
        <td style="width: 35px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="width: 85px; font-weight: 700; text-transform: uppercase; font-size: 9px; color: #1e3a8a;">${escapeHtml(act.type)}</td>
        <td style="font-weight: 600; color: #0f172a;">${escapeHtml(act.title)}</td>
        <td style="width: 90px; text-align: center;"><span class="badge ${badgeClass}">${escapeHtml(act.status)}</span></td>
        <td style="width: 85px; color: #475569;">${escapeHtml(act.date)}</td>
        <td style="width: 140px; color: #475569; font-size: 10px;">${escapeHtml(act.detail)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Laporan Eksekutif Bulanan — ${escapeHtml(period)}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
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
  .doc-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 14px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .org-name {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #1e3a8a;
    margin-bottom: 3px;
  }
  .doc-title {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .doc-period {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin-top: 4px;
  }
  .control-col {
    text-align: right;
  }
  .doc-badge {
    display: inline-block;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1px solid #94a3b8;
    color: #334155;
    padding: 2px 8px;
    margin-bottom: 6px;
  }
  .control-meta {
    font-size: 9px;
    color: #64748b;
    line-height: 1.5;
  }
  .control-meta strong {
    color: #334155;
    font-weight: 600;
  }

  .scorecard-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 2px solid #0f172a;
    border-bottom: 1px solid #cbd5e1;
    margin-bottom: 22px;
    page-break-inside: avoid;
  }
  .scorecard-col {
    padding: 10px 14px;
    border-right: 1px solid #e2e8f0;
  }
  .scorecard-col:last-child {
    border-right: none;
  }
  .scorecard-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
    margin-bottom: 2px;
  }
  .scorecard-val {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
  }
  .scorecard-denom {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
  }
  .scorecard-sub {
    font-size: 9px;
    color: #475569;
    margin-top: 3px;
    font-weight: 500;
  }

  .editorial-section {
    margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .section-heading {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #0f172a;
    margin: 0 0 8px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }
  .editorial-content {
    border-left: 2px solid #94a3b8;
    padding: 4px 0 4px 14px;
  }
  
  ul.points { margin: 0; padding-left: 14px; }
  ul.points li { margin-bottom: 4px; font-size: 10.5px; color: #334155; line-height: 1.5; }
  ul.points li:last-child { margin-bottom: 0; }
  p.empty { margin: 0; font-style: italic; color: #94a3b8; font-size: 10.5px; }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 10px;
  }
  table.data-table th, table.data-table td {
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  table.data-table th {
    background: #f8fafc;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 9px;
    color: #334155;
    letter-spacing: 0.04em;
    border-bottom: 2px solid #cbd5e1;
    border-top: 1px solid #e2e8f0;
  }
  table.data-table td {
    border-bottom: 1px solid #e2e8f0;
  }
  table.data-table tr:last-child td {
    border-bottom: 1px solid #cbd5e1;
  }
  
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 700;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .badge-done { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .badge-prog { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }
  .badge-issue { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

  .sign-off {
    margin-top: 36px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    page-break-inside: avoid;
  }
  .sign-box {
    border-top: 1px solid #0f172a;
    padding-top: 8px;
    text-align: center;
  }
  .sign-role { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; margin-bottom: 4px; }
  .sign-title { font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 44px; }
  .sign-line { font-size: 11px; font-weight: 600; color: #1e293b; }
  .sign-date { font-size: 9px; color: #64748b; margin-top: 4px; }

  @media print {
    body { padding: 0; margin: 0; }
    .no-print { display: none; }
    table.data-table { page-break-inside: auto; }
    table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
  }
</style>
</head>
<body>

<div class="doc-header">
  <div>
    <div class="org-name">${escapeHtml(ws)}</div>
    <h1 class="doc-title">Laporan Eksekutif Bulanan</h1>
    <div class="doc-period">Periode Pelaporan: ${escapeHtml(period)}</div>
  </div>
  <div class="control-col">
    <div class="doc-badge">DOKUMEN INTERNAL &amp; RAHASIA</div>
    <div class="control-meta">
      <div><strong>No. Dokumen:</strong> ${escapeHtml(docNumber)}</div>
      <div><strong>Tanggal Terbit:</strong> ${escapeHtml(generated)}</div>
      <div><strong>Otoritas:</strong> Divisi Marketing &amp; Communications</div>
    </div>
  </div>
</div>

<div class="scorecard-bar">
  <div class="scorecard-col">
    <div class="scorecard-label">Total Aktivitas</div>
    <div class="scorecard-val">${totalAct}</div>
    <div class="scorecard-sub">${compRate}% Terealisasi</div>
  </div>
  <div class="scorecard-col">
    <div class="scorecard-label">Penempatan POSM</div>
    <div class="scorecard-val">${posmDone} <span class="scorecard-denom">/ ${posmTotal} Titik</span></div>
    <div class="scorecard-sub">Biaya: ${posmCost}</div>
  </div>
  <div class="scorecard-col">
    <div class="scorecard-label">Aktivitas Event</div>
    <div class="scorecard-val">${evDone} <span class="scorecard-denom">/ ${evTot} Event</span></div>
    <div class="scorecard-sub">${evAtt} Partisipan</div>
  </div>
  <div class="scorecard-col">
    <div class="scorecard-label">Kemitraan &amp; Konten</div>
    <div class="scorecard-val">${mousAppr} MOU · ${conPub} Pos</div>
    <div class="scorecard-sub">Nilai: ${mousVal}</div>
  </div>
</div>

<div class="editorial-section">
  <div class="section-heading">I. RINGKASAN CAPAIAN UTAMA (KEY ACHIEVEMENTS)</div>
  <div class="editorial-content">
    ${renderList(achievements, "Belum ada pencapaian operasional yang selesai tercatat pada periode ini.")}
  </div>
</div>

<div class="editorial-section">
  <div class="section-heading">II. EVALUASI KENDALA &amp; RISIKO LAPANGAN (KEY ISSUES)</div>
  <div class="editorial-content">
    ${renderList(keyIssues, "Seluruh kegiatan operasional berjalan lancar tanpa kendala kritis yang dilaporkan.")}
  </div>
</div>

<div class="editorial-section">
  <div class="section-heading">III. RENCANA TINDAK LANJUT OPERASIONAL (ACTION PLANS)</div>
  <div class="editorial-content">
    ${renderList(actionPlans, "Tidak ada rencana tindak lanjut khusus yang diagendakan.")}
  </div>
</div>

${
  activities.length > 0
    ? `<div class="editorial-section">
  <div class="section-heading">IV. MATRIKS RINCIAN KEGIATAN OPERASIONAL (${activities.length})</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">No</th>
        <th style="width: 85px;">Kategori</th>
        <th>Nama Kegiatan / Materi</th>
        <th style="width: 90px; text-align: center;">Status</th>
        <th style="width: 85px;">Tanggal</th>
        <th style="width: 140px;">Keterangan / Realisasi</th>
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
    <div class="sign-role">Disusun Oleh:</div>
    <div class="sign-title">Marcom Lead / Koordinator</div>
    <div class="sign-line">( _____________________________ )</div>
    <div class="sign-date">Tanggal: ${escapeHtml(generated.split(" pukul")[0] || generated)}</div>
  </div>
  <div class="sign-box">
    <div class="sign-role">Disetujui Oleh:</div>
    <div class="sign-title">Branch Manager</div>
    <div class="sign-line">( _____________________________ )</div>
    <div class="sign-date">Tanggal: _______________________</div>
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
