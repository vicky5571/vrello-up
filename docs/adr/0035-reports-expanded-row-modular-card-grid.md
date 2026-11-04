# ADR-0035: Reports Expanded Row Modular Card Grid Styling & Atomic Extraction

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Branch Manager
- **Informed:** Core Development Team

## 1. Context & Business Problem

In the **Reports** view (`src/components/views/ReportsView/ReportsView.tsx`), users can click on a monthly report row (e.g. "November 2026") to expand and preview its operational details prior to printing or auditing.

Currently, the expanded details section is rendered directly inline inside `ReportsView.tsx` (lines 727–804) using raw HTML unstyled elements:
1. **Unstyled Bullet Dump:** Activities, Achievements, Key Issues, and Action Plans are displayed in an unstyled 2-column list (`ul.list-disc`) placed on a flat, low-contrast gray background (`bg-slate-50/60 dark:bg-slate-800/30`).
2. **Dense Unformatted Text Strings:** Activity items are rendered as concatenated raw strings with bracketed prefixes and bullet dots (e.g., `• [POSM] Roll-up / X-Banner Display... · Biaya: Rp 450.000`), making scanning tedious for field coordinators and managers.
3. **Disjointed Supporting Documents:** Document attachments sit at the bottom as bare hyperlink text without file icons, format badges, or card wrapping.
4. **Coordinator File Bloat:** `ReportsView.tsx` currently stands at 839 LOC. Inlining UI rendering for the expanded row introduces unnecessary complexity into the view coordinator, violating the project invariant to extract modular subcomponents.

The operational problem is that users cannot quickly inspect monthly metrics and achievements at a glance due to the lack of visual cards, distinct section badges, and structured item rows.

## 2. Options Considered

### Option 1: Modular Card Grid with Section Badges & Atomic Extraction — [CHOSEN]
- **Concept:** Extract the expanded row contents into a standalone subcomponent `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx`. Present the four sections (*Activities*, *Achievements*, *Key Issues*, *Action Plans*) in a responsive 2x2 grid of clean container cards with subtle borders, themed icons, and count pill badges. Parse activity strings into clean category tags (`POSM`, `MOU`, `CONTENT`, `EVENT`) and distinct subtext. Present supporting documents as a horizontal file card strip.
- **Pros:**
  - High scannability and visual polish aligned with Vrello design language.
  - Reduces `ReportsView.tsx` coordinator by ~80 lines.
  - Highly testable via targeted automated unit tests.
- **Cons:** Introduces one new file in `src/components/views/ReportsView/`.

### Option 2: Minimalist Divider-List Layout (Inline Polish)
- **Concept:** Keep the code inline in `ReportsView.tsx`. Replace `ul.list-disc` with subtle border-b separated lists, small icons next to titles, and inline badge chips.
- **Pros:** Zero new files.
- **Cons:** Fails to reduce `ReportsView.tsx` file size; lacks the visual elevation of card containers.

### Option 3: Segmented Mini-Tabs inside Expanded Row
- **Concept:** Introduce interactive mini-tabs ("Aktivitas (8)", "Ringkasan Narasi (5)", "Dokumen (0)") inside the expanded row.
- **Pros:** Reduces vertical height for very long activity lists.
- **Cons:** Over-engineering (YAGNI) for a simple summary preview; forces extra clicks to view achievements.

## 3. Decision

We choose **Option 1: Modular Card Grid with Section Badges & Atomic Extraction**.

### Architectural Directives:
1. **Extraction of `MonthlyReportExpandedRow.tsx`:**
   - Create `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx` (~130 LOC).
   - Props interface:
     ```ts
     interface MonthlyReportExpandedRowProps {
       report: ReportItem;
       supporting: DocumentItem[];
       canManage: boolean;
       isDeletingId: string | null;
       onDeleteReport: (report: ReportItem) => void;
       onPrintReport: (report: ReportItem) => void;
     }
     ```
   - Wire `<MonthlyReportExpandedRow ... />` into `ReportsView.tsx` inside `{isExpanded && (...)}`.
2. **Modular 2x2 Section Cards:**
   - **Activities Card:** Ikon `Layers` (indigo), badge counter. Parse activity title to render mini category badge (`POSM`, `MOU`, `KONTEN`, `EVENT`) in clean font with muted cost/realization subtext.
   - **Achievements Card:** Ikon `CheckCircle2` (emerald), badge counter. Clean list with subtle bullet markers and refined typography.
   - **Key Issues Card:** Ikon `AlertTriangle` (amber), badge counter. If zero issues, display soft muted status text.
   - **Action Plans Card:** Ikon `ArrowUpRight` (blue), badge counter.
3. **Structured Supporting Documents:**
   - Render supporting document attachments as a clean horizontal or grid strip of file cards with `FileText` icon, filename, and file type badge.
4. **Header Action Bar:**
   - Top bar contains report title ("Rincian Dokumen Laporan — {period}"), subtitle, and aligned actions ("Hapus Laporan" if `canManage`, and primary "Cetak Dokumen Resmi (Save as PDF)").

## 4. Consequences & Accepted Trade-offs

- **Positive:**
  - Dramatically improves executive and operational usability when expanding report rows.
  - Decreases LOC of `ReportsView.tsx`, improving codebase maintainability.
  - Zero state disruption: data flow remains purely props-driven.
- **Negative / Accepted Debt:**
  - One additional file in `src/components/views/ReportsView/`.



