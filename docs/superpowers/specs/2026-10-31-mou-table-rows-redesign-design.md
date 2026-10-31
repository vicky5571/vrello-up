# Spec — MOU Table Rows UI Redesign & Entity Consolidation

**Date:** 2026-10-31  
**Status:** DRAFT  
**Scope:** UI / Table Row Redesign (`src/components/views/MousView/mouColumns.tsx`)  
**Target:** Streamline MOU table rows by consolidating Partner & Outlet into a unified entity column, providing clean empty states for date validity, and applying neutral glassmorphic styling to document action pills.

---

## 1. Executive Summary

Based on visual evaluation of the MOUs table view, three key UX/UI refinements are implemented:
1. **Unified Partner & Outlet Column**: Consolidate the separate `Partner` (190px) and `Outlet` (170px) columns into a single `Partner & Outlet` column (230px). Partner name is rendered as primary bold text with quick-filter trigger, and the Outlet name is rendered beneath with a store icon and navigation trigger to Outlets. This saves ~130–170px of horizontal width.
2. **Clean Validity Empty State**: When an MOU has no period dates set (`startDate` and `endDate` are empty or `validity.status === "NO_DATE"`), render a clean subtle dash (`—`) instead of stacking redundant `"No period set"` and `"[Clock] No expiry"` badges.
3. **Neutral Glassmorphic Document Pills**: Replace harsh fuchsia styling on MOU document buttons with neutral glassmorphic backdrop-blur chips (`bg-slate-100/80 dark:bg-slate-800/60`, border `border-slate-200/80 dark:border-slate-700/60`), subtle Drive/document icons (`FileText`, `ExternalLink`), and clean preview modal / download triggers.
4. **Polished Type Formatting**: Replace raw database enum underscores (`SECONDARY_DISPLAY` -> `SECONDARY DISPLAY` or title-case) for clean readability.

---

## 2. UX & Visual Architecture

### Before vs. After Column Structure

#### Before (11 separate columns, 1,621px total width):
`[Select] | [Partner] | [Outlet] | [Branch] | [Type] | [Status] | [Period & Validity] | [Value] | [Realisasi Fisik] | [Dokumen MOU] | [Actions]`

#### After (10 columns, ~1,480px total width):
`[Select] | [Partner & Outlet] | [Branch] | [Type] | [Status] | [Period & Validity] | [Value] | [Realisasi Fisik] | [Dokumen MOU] | [Actions]`

### Detailed Column Refinements:
1. **Partner & Outlet (`partner`)**:
   - Line 1: `row.original.partnerName` (font-semibold, hover underline, filters table by partner).
   - Line 2: If `row.original.outletName`, render `<Store className="w-3 h-3 text-orange-500" />` + outlet name (clicking navigates to Outlets view). If no outlet, renders subtle `—`.
2. **Period & Validity (`validity`)**:
   - If `!startDate && !endDate`: renders `<span className="text-slate-400">—</span>`.
   - If dates exist: renders period range string + status badge (`Expired X days ago`, `X days left`, `Starts in X days`).
3. **Dokumen MOU (`document`)**:
   - If empty: `<span className="text-slate-400">—</span>`.
   - If present: Neutral glassmorphic button with preview modal trigger on click, plus download link button.

---

## 3. Acceptance Criteria

- [ ] `Partner` and `Outlet` columns are consolidated into a single `Partner & Outlet` column in `mouColumns.tsx`.
- [ ] Clicking the partner name filters the table by partner; clicking the outlet name navigates to the Outlets directory for that outlet.
- [ ] Rows without dates render a clean `—` instead of redundant `"No period set"` and `"No expiry"` badges.
- [ ] Rows without document files render a clean `—` instead of italic *"Tanpa Berkas"*.
- [ ] Document chips use neutral glassmorphic styling matching light and dark themes.
- [ ] Table horizontal layout is significantly more compact and legible.
- [ ] All verification gates pass: `npm run drift:check`, `npm run build:check`, `npm run test:smoke`, `npm test`.

---

## 4. Non-Goals

- Modifying underlying database schema or API handlers.
- Changing permissions or status transition logic.
