# Design Specification: Reports Expanded Row Modular Card Grid Styling & Atomic Extraction

- **Date:** 2026-11-05
- **Status:** APPROVED
- **ADR Reference:** `docs/adr/0035-reports-expanded-row-modular-card-grid.md`

## 1. Executive Summary & Goals

This specification formalizes the UI/UX overhaul of the monthly report expanded row in `src/components/views/ReportsView/`. The goal is to replace raw, unstyled HTML bullet dumps with an elegant, modular card grid while adhering to Strangler Pattern principles by extracting an atomic subcomponent `MonthlyReportExpandedRow.tsx` to trim `ReportsView.tsx` file size.

### Core Objectives:
1. **Visual Elevation:** Transform flat text columns into four distinct, elevated cards with subtle borders (`border-slate-200/80 dark:border-slate-800`), white/dark-surface backgrounds, soft drop shadows (`shadow-2xs`), themed icons, and count pill badges.
2. **Structured Activity Presentation:** Parse raw concatenated strings (e.g., `• [POSM] Roll-up... · Biaya: Rp 450.000`) into clean, structured list items with category pills (`POSM`, `MOU`, `CONTENT`, `EVENT`), bold title, and distinct subtext.
3. **Structured Document Attachments:** Format supporting documents into clean file cards featuring `FileText` icons, truncated filenames, file format chips, and direct open actions.
4. **Codebase Health & Modularity:** Extract ~80 lines of inline JSX from `ReportsView.tsx` into a dedicated atomic subcomponent `MonthlyReportExpandedRow.tsx`, improving readability and testability.

## 2. Component Architecture & Interface

### 2.1 File Location & Component Signature
- **File:** `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx`
- **Props Interface:**
  ```tsx
  import type { ReportItem, DocumentItem } from "@/types";

  export interface MonthlyReportExpandedRowProps {
    report: ReportItem;
    periodLabel: string;
    supporting: DocumentItem[];
    canManage: boolean;
    isDeletingId: string | null;
    onDeleteReport: (report: ReportItem) => void;
    onPrintReport: (report: ReportItem) => void;
  }
  ```

### 2.2 Activity Parser Helper (Pure Logic)
```ts
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
```

## 3. Layout & Card Grid Visual Specifications

### 3.1 Header Action Bar
```html
<div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
  <div>
    <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
      <FileSpreadsheet class="w-3.5 h-3.5 text-indigo-500" />
      Rincian Dokumen Laporan — {periodLabel}
    </h3>
    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
      Dokumen resmi siap cetak atau simpan sebagai PDF eksekutif
    </p>
  </div>
  <div class="flex items-center gap-2">
    <!-- Delete button (if canManage) -->
    <!-- Print document button -->
  </div>
</div>
```

### 3.2 2x2 Modular Grid Layout
The expanded section features a 2-column responsive grid (`grid grid-cols-1 md:grid-cols-2 gap-3.5`):

1. **Card 1: Aktivitas Operasional (Activities):**
   - **Header:** `<Layers class="w-3.5 h-3.5 text-indigo-500" />`, title "Aktivitas Operasional", count pill (`bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400`).
   - **Body:** Rendered via `parseActivityDisplay`. Each activity displays:
     - Category pill (`POSM` in emerald, `MOU` in violet, `CONTENT` in sky, `EVENT` in amber).
     - Activity title in `font-medium text-slate-800 dark:text-slate-200 text-xs`.
     - Subtext detail in `text-[11px] text-slate-500 dark:text-slate-400`.
2. **Card 2: Capaian Utama (Achievements):**
   - **Header:** `<CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />`, title "Capaian Utama", count pill (`bg-emerald-50 text-emerald-600`).
   - **Body:** Refined bullet items with subtle left indicator bar or disc marker, crisp typography.
3. **Card 3: Kendala & Isu Lapangan (Key Issues):**
   - **Header:** `<AlertTriangle class="w-3.5 h-3.5 text-amber-500" />`, title "Kendala & Isu Lapangan", count pill (`bg-amber-50 text-amber-600`).
   - **Body:** If empty/fallback: clean italicized placeholder `"Seluruh kegiatan operasional berjalan lancar..."`.
4. **Card 4: Rencana Tindak Lanjut (Action Plans):**
   - **Header:** `<ArrowUpRight class="w-3.5 h-3.5 text-blue-500" />`, title "Rencana Tindak Lanjut", count pill (`bg-blue-50 text-blue-600`).
   - **Body:** Action bullet items with actionable styling.

### 3.3 Supporting Documents Section
- **Header:** `<FileText class="w-3.5 h-3.5 text-slate-500" />` "Dokumen Pendukung ({supporting.length})".
- **Container:** Horizontal flex-wrap or auto-grid strip of compact file chips (`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors`).
- Displays file icon, clean filename, uppercase file extension badge (`PDF`, `DOCX`, `ZIP`), and opens link in new tab.

## 4. Acceptance Criteria & Verification Checklist

- [ ] `MonthlyReportExpandedRow.tsx` exists as a dedicated subcomponent in `src/components/views/ReportsView/`.
- [ ] `ReportsView.tsx` imports and renders `<MonthlyReportExpandedRow ... />` inside the expanded row branch.
- [ ] 4 modular cards render cleanly with themed icons, titles, and count badges.
- [ ] Raw concatenated activity strings are parsed cleanly with category badges (`POSM`, `MOU`, `CONTENT`, `EVENT`) instead of raw bracket text.
- [ ] Supporting documents render as clean file card chips with icons and file format badges.
- [ ] `ReportsView.tsx` LOC decreases by $\ge 60$ lines.
- [ ] Automated tests in `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` pass 100%.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures across all test suites.


