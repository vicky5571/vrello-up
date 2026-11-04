# ADR-0034: Professional Executive PDF Editorial Layout & Anti-AI-Slop Redesign

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Branch Manager
- **Informed:** Core Development Team

## 1. Context & Business Problem

The **Reports** view in Vrello Marcom Operations serves as the authoritative Single Source of Truth (SSOT) for closed-period historical auditing, executive performance review, and formal branch accountability (`docs/reports-vs-analytics-boundaries.md`). Unlike the real-time Analytics view, the primary consumers of Reports are C-level executives, Regional Directors, Branch Managers, and corporate auditors.

However, the current printable HTML/PDF generator (`src/lib/productivity/exportCenter.ts` and `src/lib/marcom/reportDraftEngine.ts`) outputs a document heavily laden with **"AI slop"** tropes and casual web dashboard artifacts:
1. **Gimmicky Emojis & Web Alert Callouts:** The narrative sections feature emojis (🏆, ⚠️, 🎯, 📋) and pastel background boxes with saturated left borders (`box-green`, `box-amber`, `box-blue`), resembling Bootstrap/Slack chatbot output rather than executive print stationery.
2. **Robotic & Unnatural NLP Templating:** When zero items are completed, the draft generator produces formulaic output such as *"Berhasil menyelesaikan pemasangan 0 dari 1 titik (0%) dengan total serapan biaya materi Rp 0"*. This exposes crude robotic logic to external stakeholders.
3. **Web-Dashboard Card Misalignment on Paper:** The executive KPI summary renders four floating cards with rounded corners (`rounded-lg`) and light gray borders, consuming excessive vertical whitespace without executive typographic rhythm.
4. **Data Redundancy & Non-Standard Formatting:** Activity titles repeat bracket prefixes (`[POSM]`, `[MOU]`, `[KONTEN]`, `[EVENT]`) despite an adjacent dedicated `KATEGORI` column. Dates are formatted in US notation (`11/1/2026`) instead of Indonesian standard (`01/11/2026` or `1 Nov 2026`). Table status cells resemble bright clickable web buttons.
5. **Physical Print Inefficiency:** Pastel fills print as muddy gray blotches on black-and-white office laser printers and waste toner. There is no official document control numbering (`No. Dokumen: VRL/MRK/...`) or confidentiality header.

The operational consequence is severe: physical and PDF reports submitted for official signing lose executive credibility and fail corporate audit standards.

## 2. Options Considered

### Option 1: Classic Corporate Executive Memo (Monochrome & Deep Slate)
- **Concept:** Strict corporate memo format in monochrome deep slate (`#0f172a`) and charcoal (`#334155`). Complete removal of all emojis and colored callout boxes. KPI metrics formatted as a minimal horizontal scorecard with hairline rules. Table without vertical borders.
- **Pros:** 100% ink-friendly for B&W laser printers and photocopiers; indisputable audit gravitas.
- **Cons:** Visually stark and conservative; lacks modern executive polish for digital PDF sharing.

### Option 2: Modern Editorial Annual-Report Style (Deep Navy & Refined Muted Accents) — [CHOSEN]
- **Concept:** Layout inspired by Big 4 / Fortune 500 corporate publications. Uses Deep Navy (`#1e3a8a` / `#0f172a`) for typographic hierarchy, hairline dividers (`#e2e8f0` / `#cbd5e1`), subtle 2px left slate accent rules for narrative sections without background fills, crisp status tags with muted high-contrast text, sanitized human-like prose, and official document control numbering.
- **Pros:**
  - Premium, authoritative, and scannable by executives.
  - Zero emojis and zero pastel web alert boxes.
  - High fidelity both on digital screen and physical B&W/color printing.
  - Retains zero new npm dependencies (pure string HTML/CSS builder).
- **Cons:** Requires rigorous CSS print rules (`@page`, `break-inside: avoid`) to ensure consistent pagination across desktop browser engines.

### Option 3: Formal Indonesian Government / BUMN Standard (Nota Dinas & Matriks Lampiran)
- **Concept:** Complete civil service / state-owned enterprise memo format (Kop surat resmi, Nomor/Sifat/Lampiran/Perihal metadata block, formal paragraph prose, multi-level signature hierarchy with NIP/Jabatan, tabular annex).
- **Pros:** High alignment with bureaucratic government/BUMN audits in Indonesia.
- **Cons:** Too rigid and verbose for agile private enterprise operations; removes executive metric summary at a glance.

## 3. Decision

We choose **Option 2: Modern Editorial Annual-Report Style**.

### Architectural Decisions:
1. **Total Elimination of Emojis and Web Pastel Boxes:**
   - Remove 🏆, ⚠️, 🎯, 📋 from `src/lib/productivity/exportCenter.ts`.
   - Replace `.box-green`, `.box-amber`, `.box-blue` with clean editorial callouts: transparent background, 2px solid neutral left border (`#94a3b8`), clean padding (`8px 0 8px 12px`), and clear uppercase section headers with Roman numerals (e.g. `I. RINGKASAN CAPAIAN UTAMA`, `II. EVALUASI KENDALA OPERASIONAL`, `III. RENCANA TINDAK LANJUT`).
2. **Integrated Executive Scorecard (Anti-Web-Cards):**
   - Replace the 4 rounded floating `.kpi-card` widgets with a unified, high-density **Executive Scorecard Table/Bar** featuring hairline top/bottom borders (`border-y border-slate-300`), crisp numeric values, and discrete sub-metrics.
3. **Natural Human-Grade Narrative Synthesis in `reportDraftEngine.ts`:**
   - Eliminate formulaic robotic phrases: if 0 items are completed, do not emit *"Berhasil menyelesaikan 0 dari N titik (0%)"*; instead, state *"Pemasangan materi POSM dalam tahap persiapan operasional (0 dari N titik terealisasi)"* or omit empty categories.
   - Strip redundant `[POSM]`, `[MOU]`, `[KONTEN]`, `[EVENT]` title prefixes in `activities` since the `Kategori` table column already explicitly states this taxonomy.
4. **Indonesian Date Standard & Clean Typography:**
   - Standardize all dates to `DD/MM/YYYY` (or `DD MMMM YYYY` in metadata) via a shared helper. Replace US formatted dates (`M/D/YYYY`).
   - Replace bright button-like badge pills with crisp, compact status typography (e.g. subtle uppercase text with small indicator bullet or neutral border).
5. **Corporate Document Control & Physical Sign-off:**
   - Add formal document header: Official Document Registration Number (`No. Dokumen: VRL/MRK/REP/{YEAR}/{MONTH_NUM}/{RANDOM_OR_ID}`), Classification tag (`DOKUMEN RAHASIA & INTERNAL`), and formal timestamp.
   - Refine signature blocks to include formal lines, designated roles, and official sign-off placeholders.
6. **Zero Dependencies & Zero Performance Overhead:**
   - Maintain pure TypeScript/HTML string templating in `src/lib/productivity/exportCenter.ts`. No puppeteer, no canvas, no heavy client-side PDF packages.

## 4. Consequences & Accepted Trade-offs

- **Positive:**
  - Executive reports immediately gain corporate authority and pass rigorous internal/external audits.
  - Zero "AI slop" or amateurish visual relics.
  - Ink and toner consumption is drastically minimized on office laser printers.
  - Page rhythm and readability are optimized for physical signing and archival.
- **Negative / Accepted Debt:**
  - Print layout styling depends on standard CSS print support (`@media print` and `@page`). While well-supported in Chromium and WebKit, minor margins must be tested across standard desktop browsers.



