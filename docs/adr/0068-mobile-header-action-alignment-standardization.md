# ADR-0068: Mobile Header Action Alignment Standardization (Branches, Documents, Reports)

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* field operators predominantly hold smartphones with their right hand when interacting with operational modules on-site. In ADR-0061, we established an ergonomic principle: primary header action rows (`Refresh`, create buttons) must align to the right margin on smartphone screens (`< 640px`) to sit directly inside the natural touch arc of the user's thumb, while leaving desktop screens (`sm:` and `md:`) left-aligned within their respective columns.

While ADR-0061 addressed `PlacementsHeader.tsx`, `OutletsHeader.tsx`, and `EventsHeader.tsx`, subsequent mobile UI review revealed that three secondary management modules—**Branches**, **Documents**, and **Reports**—were left with awkward left-aligned action rows on mobile:
1. `BranchesHeader.tsx`: The `Refresh` and `+ Tambah Branch` action row sat flush against the left margin (`justify-start`), leaving an unbalanced void on the right edge and requiring uncomfortable thumb stretching.
2. `DocumentsHeader.tsx`: The `Refresh` and `+ Tambah Dokumen` row was left-aligned (`justify-start`), disconnected from the right-hand thumb zone.
3. `ReportsHeader.tsx` & `QuarterlyPosmReportTab.tsx`: The `Refresh` and `Export Center` actions, as well as the primary `+ Buat Laporan Bulanan` button, were left-aligned on mobile (`justify-start`, `self-start`), creating dead space on the right.

We need a standardized architectural rule across all remaining module headers to enforce one-handed mobile thumb ergonomics without breaking desktop column alignment.

## Options Considered

### Option 1: Universal Responsive Flex Alignment Classes (Chosen)
Apply `justify-end sm:justify-start w-full sm:w-auto` to the action button rows and `self-end sm:self-auto` to standalone action buttons across `BranchesHeader.tsx`, `DocumentsHeader.tsx`, `ReportsHeader.tsx`, and `QuarterlyPosmReportTab.tsx`.
- *Business & Operational Continuity:* High. Provides an immediately consistent physical touch interaction model across every view in the application.
- *Engineering Cost & Complexity:* Low. Purely declarative Tailwind responsive utilities; zero new state, zero added dependencies.
- *Data Integrity & Performance:* Zero runtime overhead; zero layout shifts.

### Option 2: Floating Action Buttons (FAB) on Mobile
Replace header action buttons on mobile with fixed floating action buttons in the bottom-right corner.
- *Business & Operational Continuity:* Poor. Collides with the bottom navigation bar (`MobileBottomNav.tsx`) and obscures table/card content.
- *Engineering Cost & Complexity:* High. Requires dedicated z-index stacking context management and scroll-hiding logic.

## Decision

We adopt **Option 1: Universal Responsive Flex Alignment Classes**.

Specifically:
1. **Action Row Containers:** Apply `justify-end sm:justify-start w-full sm:w-auto` across:
   - `src/components/views/BranchesView/BranchesHeader.tsx` (action row with Refresh and Tambah Branch)
   - `src/components/views/DocumentsView/DocumentsHeader.tsx` (action row with Refresh and Tambah Dokumen)
   - `src/components/views/ReportsView/ReportsHeader.tsx` (action row with Refresh and Export Center)
   - `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` (action bar with quarter selector and export actions)
2. **Standalone Action Buttons:** Apply `self-end sm:self-auto` on `+ Buat Laporan Bulanan` in `ReportsHeader.tsx`.
3. **Desktop Invariants:** Desktop viewports ($\ge 640\text{px}$) strictly retain their natural column flow via `sm:justify-start` and `sm:self-auto`.

## Consequences

### Positive Consequences
1. **Universal Thumb Ergonomics:** 100% of primary action buttons across all views (Placements, Outlets, Events, Branches, Documents, Reports) are anchored to the right margin on mobile, enabling natural one-handed thumb reach.
2. **Visual Margin Balance:** Eliminates awkward dead whitespace on the right margin of mobile cards.
3. **Zero Desktop Regression:** Desktop layouts remain pixel-perfect and column-aligned.
4. **Automated Verification:** Governed by regression test suites in `branchesHeaderResponsiveness.test.ts`, `documentsHeaderResponsiveness.test.ts`, and `reportsHeaderResponsiveness.test.ts`.

### Negative Consequences / Accepted Technical Debt
1. None. Purely declarative, responsive Tailwind layout classes with zero runtime or bundle overhead.



