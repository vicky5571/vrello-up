# Implementation Plan — MOU Table Rows UI Redesign & Entity Consolidation

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-mou-table-rows-redesign-design.md`  
**Status:** READY TO EXECUTE  

---

## 1. Overview & Phased Roadmap

This plan refines the MOU table rows in `src/components/views/MousView/mouColumns.tsx` by consolidating Partner and Outlet into a single column, cleaning up date validity empty states, and standardizing document pills with neutral glassmorphic styling.

### Phased Roadmap
- [x] **Phase 1: Consolidate Partner & Outlet Columns (`mouColumns.tsx`)**
  - Merge `partner` and `outlet` column definitions into a single `Partner & Outlet` column.
  - Implement two-line entity cell with primary partner name and secondary outlet name.
- [x] **Phase 2: Clean Validity & Document Empty States (`mouColumns.tsx`)**
  - Update `validity` column cell renderer to display a clean `—` when no dates are set.
  - Update `document` column cell renderer to display a clean `—` when no document is attached.
  - Apply neutral glassmorphic styling with document/drive icons (`FileText`, `ExternalLink`) to document buttons.
  - Format `Type` column replacing underscores with spaces.
- [x] **Phase 3: Verification & Verification Gates**
  - Run `npm run build:check`.
  - Run `npm run drift:check`.
  - Run `npm run test:smoke`.
  - Run `npm test`.

---

## 2. File Manifest & LOC Estimates

| File Path | Action | Est. LOC Change | Purpose |
| :--- | :---: | :---: | :--- |
| `src/components/views/MousView/mouColumns.tsx` | Edit | -25 LOC | Consolidate columns and update row cell renderers |

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Click event collision between partner & outlet | Low | Stop event propagation (`e.stopPropagation()`) on both interactive buttons inside the cell |
| Regressing document modal viewer trigger | Low | Ensure `setViewingDocMou(row.original)` remains attached to the document button |

---

## 4. Dependencies

- `lucide-react` for icons (`Store`, `Building2`, `FileText`, `ExternalLink`, `Download`)
- `MarcomTableShell` column helper
