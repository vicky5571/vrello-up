# Implementation Plan: POSM Unit Economics Segmented Progress Bar List Layout

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Spec Reference:** `docs/superpowers/specs/2026-11-12-posm-unit-economics-segmented-progress-bar-list-design.md`
- **ADR Reference:** `docs/adr/0110-posm-unit-economics-segmented-progress-bar-list-layout.md`

---

## 1. File Manifest & Responsibilities

| File Path | Responsibility | Estimated Changes |
| :--- | :--- | :--- |
| `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx` | Refactor from cramped Recharts SVG `<BarChart>` to semantic Segmented Progress Bar List | ~80 LOC modified |
| `src/components/views/AnalyticsView/charts/posmEconomicsChart.test.ts` | Unit & invariant tests verifying collision elimination, full name rendering, percentage calculations, and drilldown handling | ~85 LOC (New file) |
| `docs/SESSION_STATE.md` | Session tracking and verification gates | Status update |

---

## 2. Phased Implementation Roadmap

### Phase 1: Component Refactoring (`PosmEconomicsChart.tsx`)
- [ ] **Task 1.1:** In `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx`:
  - Remove imports of Recharts components (`BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`).
  - Replace the fixed `h-96 sm:h-72` SVG container with a semantic HTML/Tailwind list structure:
    - Status legend flex bar at top:
      - Green dot: `Selesai (DONE)`
      - Amber dot: `Sedang Proses`
      - Rose dot: `Kendala (Issue)`
      - Slate dot: `Belum Mulai`
    - Meter row for each material in `data.materials`:
      - Header row: full material name (`text-xs font-semibold`) on left, formatted metrics (`{m.total} Titik ({m.doneRate}%) · {formatCompactIDR(m.avgCost)}/unit`) on right.
      - Track row: `h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex shadow-inner`.
      - Proportional segments for `done`, `inProgress`, `issue`, `notStarted`.
      - Rich tooltip title on hover for each segment.
      - Click handler on segments: `onClick={() => onDrilldown?.(m.materialName, status)}`.
  - Retain `ChartCard` wrapper and `accessibleTable`.
- [ ] **Verification 1:** Run `npm run build:check` to ensure 0 TypeScript compilation errors.

### Phase 2: Invariant & Unit Test Suite (`posmEconomicsChart.test.ts`)
- [ ] **Task 2.1:** Create `src/components/views/AnalyticsView/charts/posmEconomicsChart.test.ts`:
  - Assert that `PosmEconomicsChart.tsx` source code no longer uses cramped `YAxis` width or fixed `h-72` Recharts elements.
  - Assert that all 4 status segments (DONE, ON_PROGRESS, ISSUE, NOT_STARTED) are rendered with correct styling and drilldown mappings.
  - Test zero-division math guard when `total === 0` (percentages resolve safely to 0 without NaN).
  - Verify that `extractBarMaterialName` or direct string extraction functions correctly.
- [ ] **Verification 2:** Run targeted test:  
  `node --test --import ./test/register-alias.mjs src/components/views/AnalyticsView/charts/posmEconomicsChart.test.ts`

### Phase 3: Non-Negotiable Quality Gates & Handoff
- [ ] **Task 3.1:** Run invariant drift check:
  ```bash
  npm run drift:check
  ```
  Must report `✅ No drift detected. All invariants pass.` with all 137 spec-plan pairs valid.
- [ ] **Task 3.2:** Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Must compile with 0 errors.
- [ ] **Task 3.3:** Run full test suite:
  ```bash
  npm test
  ```
  Must pass all tests (target 0 failures).
- [ ] **Task 3.4:** Update `docs/SESSION_STATE.md` with ADR-0110 progress.
- [ ] **Task 3.5:** Git commit all documentation artifacts.


