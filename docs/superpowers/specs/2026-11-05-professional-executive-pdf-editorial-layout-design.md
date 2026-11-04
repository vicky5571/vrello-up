# Design Specification: Professional Executive PDF Editorial Layout & Anti-AI-Slop Redesign

- **Date:** 2026-11-05
- **Status:** APPROVED
- **ADR Reference:** `docs/adr/0034-professional-executive-pdf-editorial-layout.md`

## 1. Executive Summary & Goals

This specification details the complete visual and architectural overhaul of the printable HTML/PDF generator used for monthly executive reports (`buildSingleMonthlyReportPrint` in `src/lib/productivity/exportCenter.ts` and `generateReportDraft` in `src/lib/marcom/reportDraftEngine.ts`).

### Core Objectives:
1. **Zero AI Slop:** Total removal of emojis (🏆, ⚠️, 🎯, 📋), colorful pastel alert callout boxes (`.box-green`, `.box-amber`, `.box-blue`), and robotic NLP phrases.
2. **Modern Editorial Aesthetic:** Redesign into an executive-grade annual report format featuring Deep Navy accents (`#1e3a8a` / `#0f172a`), hairline dividers (`#cbd5e1`), subtle 2px left slate accent rules, and high typographic density.
3. **Formal Document Control:** Introduce an official corporate masthead with organization name **"Vrello Up"**, formal document registration number (`No: VRL/MRK/REP/{YEAR}/{MONTH_NUM}/{SEQ}`), classification indicator (`DOKUMEN INTERNAL & RAHASIA`), and print metadata.
4. **Clean Tabular Realization:** Eliminate redundant bracket prefixes (`[POSM]`, `[MOU]`, `[KONTEN]`, `[EVENT]`) from item titles, standardize dates to Indonesian format (`DD/MM/YYYY`), and use compact, high-contrast status typography instead of button-like pills.
5. **Physical Print & Toner Optimization:** Eliminate heavy color fills that print as muddy gray blotches on B&W laser printers. Enforce strict `@page` margin rhythms and `break-inside: avoid` pagination rules.

## 2. Visual Architecture & Layout Specifications

### 2.1 Corporate Masthead & Document Header
```html
<div class="doc-header">
  <div class="brand-col">
    <div class="org-name">Vrello Up</div>
    <h1 class="doc-title">Laporan Eksekutif Bulanan</h1>
    <div class="doc-period">Periode Pelaporan: ${period}</div>
  </div>
  <div class="control-col">
    <div class="doc-badge">DOKUMEN INTERNAL & RAHASIA</div>
    <div class="control-meta">
      <div><strong>No. Dokumen:</strong> ${docNumber}</div>
      <div><strong>Tanggal Terbit:</strong> ${generatedDate}</div>
      <div><strong>Otoritas:</strong> Divisi Marketing & Communications</div>
    </div>
  </div>
</div>
```
- **Typography:**
  - `org-name`: 11px, bold, uppercase, letter-spacing 0.12em, `#1e3a8a` (Deep Navy).
  - `doc-title`: 22px, font-weight 800, `#0f172a` (Deep Slate), letter-spacing -0.02em.
  - `doc-period`: 12px, font-weight 600, `#475569`.
  - `doc-badge`: 9px, font-weight 700, uppercase, letter-spacing 0.08em, border `1px solid #94a3b8`, color `#334155`, padding `2px 6px`.

### 2.2 Unified Executive Scorecard Bar (Anti-Web-Cards)
Replace the 4 floating cards with an integrated 4-column summary bar bordered by hairline rules:
```html
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
    <div class="scorecard-label">Kemitraan & Konten</div>
    <div class="scorecard-val">${mousAppr} MOU · ${conPub} Pos</div>
    <div class="scorecard-sub">Nilai: ${mousVal}</div>
  </div>
</div>
```
- **Styling:**
  - `border-top: 2px solid #0f172a; border-bottom: 1px solid #cbd5e1;`
  - Zero background color fill (clean white paper).
  - `scorecard-col` separated by thin vertical dividers (`border-right: 1px solid #e2e8f0;`).
  - No rounded corners (`rounded-none`).

### 2.3 Editorial Narrative Sections
Each narrative block utilizes standard Roman numerals and subtle 2px solid left accent lines:
- `I. RINGKASAN CAPAIAN UTAMA (KEY ACHIEVEMENTS)` (Accent: `#0f172a`)
- `II. EVALUASI KENDALA & RISIKO LAPANGAN (KEY ISSUES)` (Accent: `#475569`)
- `III. RENCANA TINDAK LANJUT OPERASIONAL (ACTION PLANS)` (Accent: `#1e3a8a`)
- Zero pastel background blocks. Pure clean white background with `border-left: 2px solid #94a3b8; padding-left: 14px; margin-bottom: 16px;`.
- Bullet points render clean disc markers with 11px font size and `#334155` text color.

### 2.4 Tabular Realization Section
- Title: `IV. MATRIKS RINCIAN KEGIATAN OPERASIONAL (${activities.length})`
- Columns:
  1. `NO` (35px, center aligned, text `#64748b`)
  2. `KATEGORI` (85px, bold, uppercase, text `#1e3a8a`)
  3. `NAMA KEGIATAN / MATERI` (flex/remaining, font-weight 600, text `#0f172a`)
  4. `STATUS` (90px, center aligned, compact uppercase text with subtle border `border border-slate-300 px-2 py-0.5 rounded text-[8px] font-bold`)
  5. `TANGGAL` (85px, standard Indonesian date `DD/MM/YYYY`)
  6. `KETERANGAN / REALISASI` (140px, text `#475569`, 10px)
- Row striping: Very faint alternating background `#fafafa` or clean bottom border `border-b: 1px solid #e2e8f0;` without full grid lines.

### 2.5 Formal Corporate Sign-Off Block
```html
<div class="sign-off">
  <div class="sign-box">
    <div class="sign-role">Disusun Oleh:</div>
    <div class="sign-title">Marcom Lead / Koordinator</div>
    <div class="sign-space"></div>
    <div class="sign-line">( _____________________________ )</div>
    <div class="sign-date">Tanggal: ${currentDateFormatted}</div>
  </div>
  <div class="sign-box">
    <div class="sign-role">Disetujui Oleh:</div>
    <div class="sign-title">Branch Manager</div>
    <div class="sign-space"></div>
    <div class="sign-line">( _____________________________ )</div>
    <div class="sign-date">Tanggal: _______________________</div>
  </div>
</div>
```

## 3. Data Contracts & Draft Engine Sanitization (`reportDraftEngine.ts`)

### 3.1 Title Prefix Sanitization
In `src/lib/marcom/reportDraftEngine.ts`:
- Replace `[POSM] ${materialName} di ${outletName}` $\rightarrow$ `${materialName} di ${outletName}`
- Replace `[MOU] Kemitraan ${m.partnerName}...` $\rightarrow$ `Kemitraan ${m.partnerName}...`
- Replace `[KONTEN] ${c.title}...` $\rightarrow$ `${c.title}`
- Replace `[EVENT] ${e.name}...` $\rightarrow$ `${e.name}`
*(The `type` field already explicitly designates `PLACEMENT`, `MOU`, `CONTENT`, or `EVENT`, making bracket prefixes redundant).*

### 3.2 Human-Grade Narrative Synthesis
Eliminate robotic formula phrases:
- **POSM Realization:**
  - If `placementsTotal > 0` and `placementsDone > 0`:
    `Realisasi Materi POSM: Menyelesaikan pemasangan ${placementsDone} dari ${placementsTotal} titik (${rate}%) dengan serapan anggaran materi ${formatIDR(placementTotalCost)}.`
  - If `placementsTotal > 0` and `placementsDone === 0`:
    `Distribusi POSM: Sebanyak ${placementsTotal} titik penempatan materi dalam persiapan operasional lapangan.`
- **Key Issues Fallback:**
  - If no issues: `Operasional berjalan sesuai rencana kerja tanpa kendala eskalasi kritis pada periode ini.` (Replaces generic bot phrase).
- **Action Plans Fallback:**
  - If no actions: `Melanjutkan monitoring performa materi terpasang dan penyusunan kalender program periode berikutnya.`

### 3.3 Indonesian Date Formatter
Ensure dates in table rows and headers are formatted as `DD/MM/YYYY`:
```ts
function formatIdDate(isoString?: string | null): string {
  if (!isoString) return "—";
  const [year, month, day] = isoString.slice(0, 10).split("-");
  if (!year || !month || !day) return isoString;
  return `${day}/${month}/${year}`;
}
```

## 4. Acceptance Criteria & Verification

- [ ] All emojis (🏆, ⚠️, 🎯, 📋) are completely absent from generated HTML.
- [ ] Colored alert callouts (`.box-green`, `.box-amber`, `.box-blue`) are removed; replaced with clean left hairline rules.
- [ ] Document title is "Laporan Eksekutif Bulanan", and organization name renders "Vrello Up".
- [ ] Official document number (`No. Dokumen: VRL/MRK/REP/...`) and confidentiality badge are present.
- [ ] Integrated Executive Scorecard renders without floating cards or rounded corners.
- [ ] Redundant bracket prefixes (`[POSM]`, `[MOU]`, etc.) are eliminated from the table.
- [ ] Dates in activities table strictly follow Indonesian `DD/MM/YYYY` format.
- [ ] Zero new npm dependencies added to `package.json`.
- [ ] `src/lib/productivity/exportCenter.test.ts` and `src/lib/marcom/reportDraftEngine.test.ts` pass with 100% assertions.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures across the test suite.



