# Implementation Plan: Reports Expanded Row Modular Card Grid Styling & Atomic Extraction

- **Spec:** `docs/superpowers/specs/2026-11-05-reports-expanded-row-modular-card-grid-design.md`
- **ADR:** `docs/adr/0035-reports-expanded-row-modular-card-grid.md`
- **Date:** 2026-11-05
- **Status:** DRAFT

## 1. File Manifest & Blast Radius

| File Path | Action | Estimated LOC | Description / Responsibility |
| :--- | :--- | :--- | :--- |
| `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` | Create | ~75 LOC | Unit tests verifying `parseActivityDisplay`, component existence, card structure, and wiring |
| `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx` | Create | ~130 LOC | Atomic subcomponent rendering the 2x2 modular card grid, parsed activities, and supporting documents |
| `src/components/views/ReportsView/ReportsView.tsx` | Modify | -80 LOC | Coordinator file: removes inline `ReportSection` and replaces inline expanded markup with `<MonthlyReportExpandedRow />` |
| `CHANGELOG.md` | Modify | +10 LOC | Document ADR-0035 release entry |
| `docs/SESSION_STATE.md` | Modify | +15 LOC | Update session status and active feature |
| `docs/superpowers/plans/2026-11-05-reports-expanded-row-modular-card-grid.md` | Track | - | Phased execution tracking |
| `docs/superpowers/specs/2026-11-05-reports-expanded-row-modular-card-grid-design.md` | Modify | - | Update spec status to IMPLEMENTED upon completion |
| `docs/handover-reports-expanded-row-modular-card-grid.md` | Create | ~200 LOC | Execution-ready handover guide |

## 2. Phased Implementation Tasks

### Phase 1: Test-First Harness (TDD Red)
- [ ] Task 1.1: Create `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`:
  - Test pure parsing logic `parseActivityDisplay` (correctly maps `[POSM]`, `[MOU]`, `[KONTEN]`, `[EVENT]`, extracts title and detail parts).
  - Test component rendering assertions: verifies that `MonthlyReportExpandedRow.tsx` renders 4 cards with icons (`Layers`, `CheckCircle2`, `AlertTriangle`, `ArrowUpRight`), count badges, and action buttons.
  - Test coordinator integration: asserts that `ReportsView.tsx` imports and mounts `<MonthlyReportExpandedRow ... />` and has eliminated inline `ReportSection`.
- [ ] Task 1.2: Run `node --test --import ./test/register-alias.mjs src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` to confirm failing (red) state.

### Phase 2: Implement `MonthlyReportExpandedRow.tsx` & Coordinator Wiring (TDD Green)
- [ ] Task 2.1: Create `src/components/views/ReportsView/MonthlyReportExpandedRow.tsx`:
  - Export `parseActivityDisplay` and `MonthlyReportExpandedRow`.
  - Render header action bar with period title, "Hapus Laporan" (guarded by `canManage`), and "Cetak Dokumen Resmi (Save as PDF)".
  - Render 2x2 responsive card grid (`Aktivitas Operasional`, `Capaian Utama`, `Kendala & Isu Lapangan`, `Rencana Tindak Lanjut`).
  - Render activities with clean category pills (`POSM` in emerald, `MOU` in violet, `CONTENT` in sky, `EVENT` in amber).
  - Render supporting documents as a horizontal strip of clean file cards with `FileText` icon and file format chips.
- [ ] Task 2.2: In `src/components/views/ReportsView/ReportsView.tsx`:
  - Import `MonthlyReportExpandedRow` from `./MonthlyReportExpandedRow`.
  - Replace lines 728–803 with `<MonthlyReportExpandedRow ... />`.
  - Remove obsolete inline `ReportSection` and `renderJsonItem` helpers (if no longer used elsewhere).
- [ ] Task 2.3: Run `node --test --import ./test/register-alias.mjs src/components/views/ReportsView/monthlyReportExpandedRow.test.ts` to confirm passing (green) state.

### Phase 3: Invariant & Regression Verification Gates
- [ ] Task 3.1: Run `npm run drift:check` (must pass 100%, 62/62 spec-plan pairs, coordinator LOC OK).
- [ ] Task 3.2: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [ ] Task 3.3: Run `npm test` (must pass with 0 failures across all test suites).
- [ ] Task 3.4: Update `docs/superpowers/specs/2026-11-05-reports-expanded-row-modular-card-grid-design.md` status to `IMPLEMENTED`.
- [ ] Task 3.5: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [ ] Task 3.6: Create execution-ready handover guide `docs/handover-reports-expanded-row-modular-card-grid.md`.

## 3. Verification Checklist

- [ ] `MonthlyReportExpandedRow.tsx` created and wired into `ReportsView.tsx`.
- [ ] `ReportsView.tsx` file size reduced by $\ge 60$ LOC.
- [ ] 4 modular cards rendered with themed icons and count pill badges.
- [ ] Activity items display distinct category badges (`POSM`, `MOU`, `CONTENT`, `EVENT`).
- [ ] Supporting documents rendered as clean file cards.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 errors.
- [ ] `npm test` passes with 0 failures across all suites.


