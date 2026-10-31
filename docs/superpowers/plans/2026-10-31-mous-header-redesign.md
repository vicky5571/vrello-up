# Implementation Plan — MOUs View Unified Header Component

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-mous-header-redesign-design.md`  
**Status:** READY TO EXECUTE  

---

## 1. Overview & Phased Roadmap

This plan standardizes the MOUs page by extracting `MousHeader.tsx` to match the design language of `OutletsHeader`, `DocumentsHeader`, and `PlacementsHeader`, complete with spring physics pill animations (`layoutId="activeMouStatusPill"`).

### Phased Roadmap
- [x] **Phase 1: Component Extraction (`MousHeader.tsx`)**
  - Create `src/components/views/MousView/MousHeader.tsx`.
  - Implement Title Row, Action Buttons, KPI Summary Cards bar, and Filter Toolbar.
  - Implement Framer Motion fluid sliding pill animation with `layoutId="activeMouStatusPill"` and `useReducedMotion()`.
- [x] **Phase 2: MousView Integration & Refactoring**
  - Import and mount `MousHeader` in `src/components/views/MousView/MousView.tsx`.
  - Connect search query, status chips, branch dropdown, type dropdown, and urgency filters.
  - Remove duplicate inline header/filter logic from `MousView.tsx`.
- [x] **Phase 3: Verification & Verification Gates**
  - Run `npm run build:check`.
  - Run `npm run drift:check`.
  - Run `npm run test:smoke`.
  - Run `npm test`.

---

## 2. File Manifest & LOC Estimates

| File Path | Action | Est. LOC Change | Purpose |
| :--- | :---: | :---: | :--- |
| `src/components/views/MousView/MousHeader.tsx` | Create | ~180 LOC | Dedicated modular header for MOUs view |
| `src/components/views/MousView/MousView.tsx` | Edit | -90 LOC | Consume `MousHeader` and clean up inline markup |

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Search or filter state disconnection | Medium | Prop-drill existing store hooks `marcomFilters["mous"]` and `setMarcomFilter` directly |
| Z-index stacking issues with sliding pill | Low | Enforce `relative z-10` on all label text and icons within status buttons |
| Over-sized coordinator files (>250 LOC) | Medium | Extracting `MousHeader.tsx` reduces `MousView.tsx` from 417 LOC down to ~320 LOC |

---

## 4. Dependencies

- `framer-motion` for spring animations and `useReducedMotion`
- `lucide-react` for icons (`FileText`, `Download`, `Plus`, `RefreshCw`, `Search`, `X`)
- `KpiSummaryCards` shared component
- `CustomDropdown` shared component
