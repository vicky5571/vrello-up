# Handover: Professional Executive PDF Editorial Layout & Anti-AI-Slop Redesign (ADR-0034)

- **Spec:** `docs/superpowers/specs/2026-11-05-professional-executive-pdf-editorial-layout-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-professional-executive-pdf-editorial-layout.md`
- **ADR:** `docs/adr/0034-professional-executive-pdf-editorial-layout.md`
- **Date:** 2026-11-05
- **Status:** READY FOR EXECUTION

## 1. Exact File Manifest & Purpose

1. `src/lib/marcom/reportDraftEngine.test.ts`
   - *Purpose:* Unit test suite for verifying natural human-like achievement descriptions and non-bracketed activity titles.
2. `src/lib/marcom/reportDraftEngine.ts`
   - *Purpose:* Strips redundant bracket prefixes from item titles (`[POSM]`, `[MOU]`, etc.) and refines zero-completion phrasing into dignified operational language.
3. `src/lib/productivity/exportCenter.test.ts`
   - *Purpose:* Unit test suite for verifying complete elimination of emojis, pastel alert boxes, and asserting the presence of corporate Vrello Up metadata and `DD/MM/YYYY` date formatting.
4. `src/lib/productivity/exportCenter.ts`
   - *Purpose:* Overhauls `buildSingleMonthlyReportPrint` template to render the modern editorial annual report layout, integrated Executive Scorecard Bar, Roman numeral narrative sections, and print-optimized pagination.
5. `src/components/views/ReportsView/ReportsView.tsx` & `ReportsHeader.tsx`
   - *Purpose:* DO NOT TOUCH. Consumers of `printSingleMonthlyReport` that remain completely untouched.

## 2. Exact Current Code Snippets

### A. Current Activities Mapping in `src/lib/marcom/reportDraftEngine.ts` (Lines 162–202)
```ts
  for (const p of placements) {
    const outletName = p.outlet?.name || "Outlet";
    const materialName = p.material?.name || "Materi POSM";
    activities.push({
      type: "PLACEMENT",
      title: `[POSM] ${materialName} di ${outletName}`,
      status: p.status,
      date: p.date ? new Date(p.date).toISOString().slice(0, 10) : null,
      detail: p.cost ? `Biaya: ${formatIDR(p.cost)}` : undefined,
    });
  }

  for (const m of mous) {
    activities.push({
      type: "MOU",
      title: `[MOU] Kemitraan ${m.partnerName}${m.outletName ? ` (${m.outletName})` : ""}`,
      status: m.status,
      date: m.startDate ? new Date(m.startDate).toISOString().slice(0, 10) : null,
      detail: m.compensationValue ? `Kompensasi: ${formatIDR(m.compensationValue)}` : undefined,
    });
  }

  for (const c of contents) {
    activities.push({
      type: "CONTENT",
      title: `[KONTEN] ${c.title} (${c.platform || "Media"})`,
      status: c.status || "DRAFT",
      date: c.publishDate ? new Date(c.publishDate).toISOString().slice(0, 10) : null,
      detail: c.format ? `Format: ${c.format}` : undefined,
    });
  }

  for (const e of events) {
    activities.push({
      type: "EVENT",
      title: `[EVENT] ${e.name}${e.branchName ? ` (${e.branchName})` : ""}`,
      status: e.status,
      date: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : null,
      detail: `Audiens: ${e.attendeeCount || 0} orang${e.budget ? ` | Anggaran: ${formatIDR(e.budget)}` : ""}`,
    });
  }
```

### B. Current Floating Cards & Emojis in `src/lib/productivity/exportCenter.ts` (Lines 612–663)
```html
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
```

## 3. Exact Change Instructions

### Change 1: In `src/lib/marcom/reportDraftEngine.ts`
1. **Remove bracket prefixes from activity titles**:
   ```diff
   --- a/src/lib/marcom/reportDraftEngine.ts
   +++ b/src/lib/marcom/reportDraftEngine.ts
   @@ -166,3 +166,3 @@
          type: "PLACEMENT",
   -      title: `[POSM] ${materialName} di ${outletName}`,
   +      title: `${materialName} di ${outletName}`,
          status: p.status,
   @@ -176,3 +176,3 @@
          type: "MOU",
   -      title: `[MOU] Kemitraan ${m.partnerName}${m.outletName ? ` (${m.outletName})` : ""}`,
   +      title: `Kemitraan ${m.partnerName}${m.outletName ? ` (${m.outletName})` : ""}`,
          status: m.status,
   @@ -186,3 +186,3 @@
          type: "CONTENT",
   -      title: `[KONTEN] ${c.title} (${c.platform || "Media"})`,
   +      title: `${c.title} (${c.platform || "Media"})`,
          status: c.status || "DRAFT",
   @@ -196,3 +196,3 @@
          type: "EVENT",
   -      title: `[EVENT] ${e.name}${e.branchName ? ` (${e.branchName})` : ""}`,
   +      title: `${e.name}${e.branchName ? ` (${e.branchName})` : ""}`,
          status: e.status,
   ```

2. **Dignified zero-completion phrasing in achievements generator**:
   ```diff
   --- a/src/lib/marcom/reportDraftEngine.ts
   +++ b/src/lib/marcom/reportDraftEngine.ts
   @@ -206,5 +206,10 @@
      if (placementsTotal > 0) {
        const rate = Math.round((placementsDone / placementsTotal) * 100);
   -    achievements.push(
   -      `Realisasi Materi POSM: Berhasil menyelesaikan pemasangan ${placementsDone} dari ${placementsTotal} titik (${rate}%) dengan total serapan biaya materi ${formatIDR(placementTotalCost)}.`,
   -    );
   +    if (placementsDone > 0) {
   +      achievements.push(
   +        `Realisasi Materi POSM: Menyelesaikan pemasangan ${placementsDone} dari ${placementsTotal} titik (${rate}%) dengan serapan anggaran materi ${formatIDR(placementTotalCost)}.`,
   +      );
   +    } else {
   +      achievements.push(
   +        `Distribusi POSM: Sebanyak ${placementsTotal} titik penempatan materi dalam persiapan operasional lapangan.`,
   +      );
   +    }
      }
   ```

### Change 2: In `src/lib/productivity/exportCenter.ts`
1. **Update Default Workspace Name to `"Vrello Up"`**:
   ```ts
   const ws = opts?.workspaceName ?? "Vrello Up";
   ```
2. **Add Indonesian Date Formatter**:
   ```ts
   function formatIdDate(isoString?: string | null): string {
     if (!isoString) return "—";
     const d = isoString.slice(0, 10).split("-");
     if (d.length === 3) return `${d[2]}/${d[1]}/${d[0]}`;
     return isoString;
   }
   ```
3. **Replace Header with Corporate Masthead & Document Registration**:
   ```html
   <div class="doc-header">
     <div>
       <div class="org-name">${escapeHtml(ws)}</div>
       <h1 class="doc-title">Laporan Eksekutif Bulanan</h1>
       <div class="doc-period">Periode Pelaporan: ${escapeHtml(period)}</div>
     </div>
     <div class="control-col">
       <div class="doc-badge">DOKUMEN INTERNAL & RAHASIA</div>
       <div class="control-meta">
         <div><strong>No. Dokumen:</strong> VRL/MRK/REP/${report.year}/${report.month.slice(0, 3).toUpperCase()}/001</div>
         <div><strong>Tanggal Terbit:</strong> ${escapeHtml(generated)}</div>
         <div><strong>Otoritas:</strong> Divisi Marketing & Communications</div>
       </div>
     </div>
   </div>
   ```
4. **Replace KPI Cards Grid with Executive Scorecard Bar**:
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
5. **Replace Alert Callout Boxes with Editorial Hairline Sections**:
   ```html
   <div class="editorial-section">
     <div class="section-heading">I. RINGKASAN CAPAIAN UTAMA (KEY ACHIEVEMENTS)</div>
     <div class="editorial-content">
       ${renderList(achievements, "Belum ada pencapaian operasional yang selesai tercatat pada periode ini.")}
     </div>
   </div>

   <div class="editorial-section">
     <div class="section-heading">II. EVALUASI KENDALA & RISIKO LAPANGAN (KEY ISSUES)</div>
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
   ```

## 4. Explicit "Do Not Touch" List with Reasons

| File / Module | Reason |
| :--- | :--- |
| `src/components/views/ReportsView/ReportsView.tsx` | View coordinator passes data to `printSingleMonthlyReport`. Its coordinator logic must remain unchanged to preserve $\le 250$ LOC limits and separation of concerns. |
| `src/components/views/ReportsView/ReportsHeader.tsx` | Dispatches 1-Click Executive PDF and Export Center. Props interface remains 100% backward-compatible. |
| `src/app/api/marcom/reports/draft/route.ts` | The API router contract remains identical; changes are encapsulated in pure logic in `reportDraftEngine.ts`. |
| `prisma/schema.prisma` | No database schema or model modifications required. |
| External PDF packages | No installation of `pdfmake`, `jsPDF`, or `puppeteer`. |

## 5. Numbered Execution Order

1. **Step 1 (TDD Red):**
   - Add new test cases to `src/lib/marcom/reportDraftEngine.test.ts` asserting clean activity titles and non-robotic achievement text.
   - Add new test cases to `src/lib/productivity/exportCenter.test.ts` asserting absence of emojis, removal of `.box-green`, and presence of "Vrello Up" and `DD/MM/YYYY` dates.
   - Run tests:
     ```bash
     node --test --import ./test/register-alias.mjs src/lib/marcom/reportDraftEngine.test.ts src/lib/productivity/exportCenter.test.ts
     ```
     *(Confirm RED state).*

2. **Step 2 (Engine Implementation Green):**
   - Apply title sanitization and achievement phrasing in `src/lib/marcom/reportDraftEngine.ts`.
   - Run engine test:
     ```bash
     node --test --import ./test/register-alias.mjs src/lib/marcom/reportDraftEngine.test.ts
     ```
     *(Confirm GREEN state).*

3. **Step 3 (Export Center Layout Implementation Green):**
   - Apply corporate masthead, scorecard bar, editorial Roman numeral sections, clean table, and `@page` styles in `src/lib/productivity/exportCenter.ts`.
   - Run export center test:
     ```bash
     node --test --import ./test/register-alias.mjs src/lib/productivity/exportCenter.test.ts
     ```
     *(Confirm GREEN state).*

4. **Step 4 (Full Verification Gates):**
   ```bash
   npm run drift:check
   npm run build:check
   npm test
   ```
   *(Confirm 0 drift, 0 build errors, 0 test failures).*

5. **Step 5 (Documentation & Handoff):**
   - Update `docs/superpowers/specs/2026-11-05-professional-executive-pdf-editorial-layout-design.md` status to `IMPLEMENTED`.
   - Update `docs/superpowers/plans/2026-11-05-professional-executive-pdf-editorial-layout.md` checkboxes.
   - Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 6. Acceptance Criteria Checklist

- [ ] Zero emojis (🏆, ⚠️, 🎯, 📋) rendered in printable HTML document.
- [ ] Alert callout boxes (`.box-green`, `.box-amber`, `.box-blue`) deleted; replaced by clean left hairline rules.
- [ ] Corporate masthead displays "Vrello Up", official document number, and confidentiality badge.
- [ ] Executive Scorecard Bar rendered with hairline borders, clean numeric typography, and zero rounded cards.
- [ ] Activity titles in table stripped of redundant `[POSM]`, `[MOU]`, etc. prefixes.
- [ ] Dates in activity table formatted strictly in Indonesian notation `DD/MM/YYYY`.
- [ ] Physical B&W printout is crisp, ink-efficient, and free from muddy gray background blotches.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures across all test suites.
