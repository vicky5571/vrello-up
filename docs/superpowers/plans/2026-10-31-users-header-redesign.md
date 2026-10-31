# Implementation Plan — User Management View Unified Header Component

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-users-header-redesign-design.md`  
**Status:** READY TO EXECUTE  

---

## 1. Overview & Phased Roadmap

This plan standardizes the User Management page (`UsersView.tsx`) by extracting `UsersHeader.tsx` to match the design language of `OutletsHeader`, `DocumentsHeader`, and `MousHeader`, complete with spring physics pill animations (`layoutId="activeUsersTabPill"`), instant search filtering, and `KpiSummaryCards`.

### Phased Roadmap
- [x] **Phase 1: Pure Logic Extraction & Unit Tests (`usersFilterHelpers.ts` & `usersFilterHelpers.test.ts`)**
  - Implement `filterUsers(users, query)`.
  - Write test suite covering name, email, and role case-insensitive matching.
- [x] **Phase 2: Component Extraction (`UsersHeader.tsx`)**
  - Create `src/components/views/UsersView/UsersHeader.tsx`.
  - Implement Title Row, Action Buttons, KPI Summary Cards bar, and Filter Toolbar.
  - Implement Framer Motion fluid sliding pill animation with `layoutId="activeUsersTabPill"` and `useReducedMotion()`.
- [x] **Phase 3: UsersView Integration & Refactoring**
  - Import and mount `UsersHeader` in `src/components/views/UsersView/UsersView.tsx`.
  - Connect search query, tab switching, and `filterUsers`.
  - Update outer container to full-bleed stage styling `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Ensure coordinator `UsersView.tsx` remains strictly $\le 250$ LOC.
- [x] **Phase 4: Verification & Verification Gates**
  - Run `npm run build:check`.
  - Run `npm run drift:check`.
  - Run `npm run test:smoke`.
  - Run `npm test`.

---

## 2. File Manifest & LOC Estimates

| File Path | Action | Est. LOC Change | Purpose |
| :--- | :---: | :---: | :--- |
| `src/components/views/UsersView/usersFilterHelpers.ts` | Create | ~30 LOC | Pure filtering logic for user management |
| `src/components/views/UsersView/usersFilterHelpers.test.ts` | Create | ~45 LOC | Unit tests for user filtering helper |
| `src/components/views/UsersView/UsersHeader.tsx` | Create | ~160 LOC | Dedicated modular header for User Management view |
| `src/components/views/UsersView/UsersView.tsx` | Edit | -60 LOC | Consume `UsersHeader` and streamline stage layout |

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Stale user list on status mutation | Medium | Pass `onRefresh={fetchUsers}` and execute `fetchUsers()` on approve/reject action |
| Z-index stacking issues with sliding pill | Low | Enforce `relative z-10` on all label text and icons within status buttons |
| Over-sized coordinator files (>250 LOC) | Medium | Extracting `UsersHeader.tsx` keeps `UsersView.tsx` around ~130 LOC |

---

## 4. Dependencies

- `framer-motion` for spring animations and `useReducedMotion`
- `lucide-react` for icons (`Users`, `ShieldCheck`, `Clock`, `UserX`, `RefreshCw`, `Search`, `X`)
- `KpiSummaryCards` shared component
