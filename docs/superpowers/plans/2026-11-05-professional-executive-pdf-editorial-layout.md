# Implementation Plan: Professional Executive PDF Editorial Layout & Anti-AI-Slop Redesign

- **Spec:** `docs/superpowers/specs/2026-11-05-professional-executive-pdf-editorial-layout-design.md`
- **ADR:** `docs/adr/0034-professional-executive-pdf-editorial-layout.md`
- **Date:** 2026-11-05
- **Status:** COMPLETE

## 1. File Manifest & Blast Radius

| File Path | Action | Estimated LOC | Description / Responsibility |
| :--- | :--- | :--- | :--- |
| `src/lib/marcom/reportDraftEngine.test.ts` | Modify | +25 LOC | Unit tests verifying natural phrasing (no "Berhasil 0...") and removal of bracket prefixes |
| `src/lib/marcom/reportDraftEngine.ts` | Modify | ~35 LOC | Sanitize item titles (strip `[POSM]`, `[MOU]`, etc.) and refine zero-completion narrative phrasing |
| `src/lib/productivity/exportCenter.test.ts` | Modify | +30 LOC | Unit tests asserting removal of emojis, elimination of `.box-green`, and presence of Vrello Up header |
| `src/lib/productivity/exportCenter.ts` | Modify | ~120 LOC | Redesign `buildSingleMonthlyReportPrint` template: Scorecard Bar, Roman numeral sections, Kop Vrello Up |
| `CHANGELOG.md` | Modify | +10 LOC | Document ADR-0034 release entry |
| `docs/SESSION_STATE.md` | Modify | +15 LOC | Update session status and active feature |
| `docs/superpowers/plans/2026-11-05-professional-executive-pdf-editorial-layout.md` | Track | - | Phased execution tracking |
| `docs/superpowers/specs/2026-11-05-professional-executive-pdf-editorial-layout-design.md` | Modify | - | Update spec status to IMPLEMENTED upon completion |
| `docs/handover-professional-executive-pdf-editorial-layout.md` | Create | ~150 LOC | Execution-ready handover guide |

## 2. Phased Implementation Tasks

### Phase 1: Test-First Harness (TDD Red)
- [x] Task 1.1: In `src/lib/marcom/reportDraftEngine.test.ts`:
  - Assert that generated `activities` titles do NOT start with bracket prefixes like `[POSM]`, `[MOU]`, `[KONTEN]`, `[EVENT]`.
  - Assert that when `placementsDone === 0`, achievement text does NOT contain `"Berhasil menyelesaikan pemasangan 0"`.
- [x] Task 1.2: In `src/lib/productivity/exportCenter.test.ts`:
  - Assert that output HTML contains zero emojis: `assert.strictEqual(/[🏆⚠️🎯📋]/.test(html), false)`.
  - Assert that output HTML contains zero `.box-green`, `.box-amber`, or `.box-blue` class references.
  - Assert that output HTML renders `"Vrello Up"`, `"DOKUMEN INTERNAL & RAHASIA"`, and `"No. Dokumen: VRL/MRK/REP/"`.
  - Assert that date strings in activity table conform to `DD/MM/YYYY`.
- [x] Task 1.3: Run `node --test --import ./test/register-alias.mjs src/lib/marcom/reportDraftEngine.test.ts src/lib/productivity/exportCenter.test.ts` to confirm failing (red) state.

### Phase 2: Draft Engine Natural Phrasing & Title Sanitization
- [x] Task 2.1: In `src/lib/marcom/reportDraftEngine.ts`:
  - Update activity mapping to remove `[POSM] `, `[MOU] `, `[KONTEN] `, and `[EVENT] ` prefixes.
  - Refine `achievements` generator: when `placementsDone === 0 && placementsTotal > 0`, emit `"Distribusi POSM: Sebanyak ${placementsTotal} titik penempatan materi dalam persiapan operasional lapangan."` instead of robotic failure.
  - Refine fallback text for `keyIssues` and `actionPlans` to sound natural and professional.
- [x] Task 2.2: Run `node --test --import ./test/register-alias.mjs src/lib/marcom/reportDraftEngine.test.ts` to confirm passing (green) state.

### Phase 3: Editorial Layout & CSS Overhaul (`exportCenter.ts`)
- [x] Task 3.1: In `src/lib/productivity/exportCenter.ts`:
  - Replace `.header` and `.org-tag` with the new corporate masthead (defaulting to `"Vrello Up"`), official document number generator, and confidentiality badge.
  - Replace `.kpi-grid` and `.kpi-card` with the unified, ink-efficient **Executive Scorecard Bar** bordered by hairline rules.
  - Remove all emojis (🏆, ⚠️, 🎯, 📋) and replace `.box-green`, `.box-amber`, `.box-blue` with clean 2px slate hairline left rules and Roman numeral headers (`I. RINGKASAN CAPAIAN UTAMA`, `II. EVALUASI KENDALA & RISIKO LAPANGAN`, `III. RENCANA TINDAK LANJUT OPERASIONAL`).
  - Update activities table: clean border lines, Indonesian date formatting (`DD/MM/YYYY`), and compact, high-contrast status tags.
  - Polish signature block and `@page` rules for clean A4 printing without clipping.
- [x] Task 3.2: Run `node --test --import ./test/register-alias.mjs src/lib/productivity/exportCenter.test.ts` to confirm passing (green) state.

### Phase 4: Full Verification Gates & Session Handoff
- [x] Task 4.1: Run `npm run drift:check` (must pass 100%, 61/61 spec-plan pairs, coordinator LOC OK).
- [x] Task 4.2: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [x] Task 4.3: Run `npm test` (must pass with 0 failures across all test suites).
- [x] Task 4.4: Update `docs/superpowers/specs/2026-11-05-professional-executive-pdf-editorial-layout-design.md` status to `IMPLEMENTED`.
- [x] Task 4.5: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [x] Task 4.6: Create execution-ready handover guide `docs/handover-professional-executive-pdf-editorial-layout.md`.

## 3. Verification Checklist

- [x] All emojis removed from generated HTML.
- [x] Alert callout boxes replaced with editorial left hairline rules.
- [x] "Vrello Up" rendered in corporate masthead.
- [x] Official document registration number and confidentiality badge rendered.
- [x] Scorecard bar rendered without floating cards or rounded corners.
- [x] Dates in table formatted as `DD/MM/YYYY`.
- [x] `npm run drift:check` passes with no drift detected.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm test` passes with 0 failures.


