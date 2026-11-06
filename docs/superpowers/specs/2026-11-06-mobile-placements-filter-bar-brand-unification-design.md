# Technical Specification: Mobile Placements Table Header Deduplication and Brand Filter Toolbar Unification

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Refs:** ADR-0062
- **Target Files:** `src/components/views/PlacementsView/PlacementsView.tsx`, `src/components/views/PlacementsView/PlacementFilterControls.tsx`

---

## 1. Executive Summary

This specification governs the elimination of the redundant local table header (`[📋] Placements 22 placements`) and the unification of Brand Chips, Search input, and Status Chips into a dedicated, responsive filter toolbar within the Media Placements view (`PlacementsView.tsx`). On smartphone screens (< 640px), this provides unconstrained horizontal width for the Brand Chips (`All Brands`, `IM3`, `3 (Tri)`), eliminating text clipping, recovering ~40px of vertical height, and standardizing the view to match `OutletsView` and `EventsView` with `hideHeader={true}`.

---

## 2. Problem Statement & UX Architecture

### 2.1 Current Defect Analysis
1. **Brand Chip Text Clipping:** In `PlacementsView.tsx`, `brandChips` is passed as `headerExtra` to `MarcomTableShell`. The table shell renders a single non-wrapping flex row (`flex items-center justify-between`). On smartphone viewports (< 640px, available width ~330px), the title on the left (~145px) and brand chips on the right (~215px) exceed available width, forcing `3 (Tri)` to be clipped off at the right screen boundary.
2. **Visual Hierarchy Redundancy:** The page top already renders `Media Placements  22 placements` in `PlacementsHeader.tsx`. Having a second `Placements 22 placements` inside the table card confuses users, introduces visual noise, and consumes valuable mobile vertical space (~40px).

### 2.2 Desired UX Flow & Responsive Layout
1. **Mobile Smartphone (< 640px):**
   - Redundant title `[📋] Placements 22 placements` is eliminated via `hideTitle={true}` on `MarcomTableShell`.
   - Compact Brand Filter Chips (`PlacementBrandChips`) sit in `headerExtra` on the right side of the card header without being stretched full width.
   - Without the redundant title on the left, all 3 pills (`All Brands`, `IM3`, `3 (Tri)`) have ample room across the ~340px container, completely eliminating clipping.
   - Search input box sits below, stretching across 100% width.
   - Status chips sit below the search input in `filterBar`.
2. **Desktop Viewport ($\ge 640\text{px}$):**
   - Desktop search bar and compact Brand filter chips align inline on the right edge of the card header.
   - Status chips align below in `filterBar` with *Reset Filters* action.
   - Desktop layout remains 100% clean, spacious, and ergonomic.

---

## 3. Component Architecture & Invariants

### 3.1 `MarcomTableShell.tsx` — `hideTitle` Support
Add `hideTitle?: boolean` prop:
- When `hideTitle` is true: title block `[Icon Title Count]` is omitted, and the header container right-aligns `headerExtra` (`hideTitle && "justify-end"`).

### 3.2 `PlacementsView.tsx` Integration
In `src/components/views/PlacementsView/PlacementsView.tsx`:
- Pass `hideTitle={true}`, `headerExtra={brandChips}`, and `filterBar={statusFilterChips}` to `MarcomTableShell`.
- Retain compact `PlacementBrandChips` styling (`shrink-0`).
- Keep `PlacementsView.tsx` strictly under 220 LOC (coordinator invariant $\le 250$ LOC).

---

## 4. Acceptance Criteria & Non-Goals

### 4.1 Acceptance Criteria
- [ ] On mobile screens (< 640px), the duplicate table header `[📋] Placements 22 placements` is eliminated.
- [ ] On mobile screens (< 640px), all 3 brand filter chips (`All Brands`, `IM3`, `3 (Tri)`) render completely without text clipping or horizontal overflow.
- [ ] The search bar input stretches across full width on mobile (`flex-1 w-full`) and fixed/compact on desktop (`sm:max-w-xs`).
- [ ] Status filter chips and the *Reset Filters* button render responsively underneath.
- [ ] On desktop screens ($\ge 640\text{px}$), the search bar and brand filter chips align cleanly on a single horizontal row.
- [ ] All existing filtering behaviors (`selectedBrand`, `selectedStatus`, `searchTerm`, `onReset`) remain 100% functional.
- [ ] `PlacementsView.tsx` remains strictly $\le 250$ LOC.
- [ ] Unit test `src/components/views/PlacementsView/placementsFilterLayout.test.ts` passes with 0 failures.
- [ ] `npm run drift:check` passes (88/88 spec-plan pairs valid, coordinator sizes $\le 250$ LOC).
- [ ] `npm run build:check` exits with code 0.
- [ ] `npm run test:smoke` passes with 0 failures.

### 4.2 Non-Goals
- Modifying backend endpoints or SQL queries.
- Modifying domain types in `src/types/index.ts`.
- Altering placement status lifecycle machine in `placementMachine.ts`.

---

## 5. Verification Checklist

```bash
# 1. Targeted Unit Test
npx tsx --test src/components/views/PlacementsView/placementsFilterLayout.test.ts

# 2. Invariant & Coordinator LOC Check
npm run drift:check

# 3. TypeScript Typecheck
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke
```


