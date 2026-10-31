# Spec — User Management View Unified Header Component

**Date:** 2026-10-31  
**Status:** DRAFT  
**Scope:** UI / Component Extraction & Modernization (`UsersHeader.tsx` & `UsersView.tsx`)  
**Target:** Standardize User Management page header to match the established workspace header architecture (`OutletsHeader`, `DocumentsHeader`, `MousHeader`, `PlacementsHeader`, `BranchesHeader`).

---

## 1. Executive Summary

Every primary module in `vrello-up` (Outlets, Documents, MOUs, Placements, Events, Reports, Analytics, Branches, Inventory) uses a unified, modern Header component featuring:
1. Title row with domain icon, counter badge, subtitle, and action buttons.
2. Filter & Navigation row directly below the title, with Framer Motion spring sliding pill active tab indicator (`motion.div layoutId="activeUsersTabPill"`), quick search input with clear button, and accessible controls.
3. KPI Summary Cards bar (`KpiSummaryCards`).
4. Stage container layout matching the full-bleed workspace rhythm: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.

Currently, `UsersView.tsx` uses an outdated raw breadcrumb, plain `h1`, basic underline tabs, no search capability, and a restrictive `max-w-7xl mx-auto` container that breaks visual harmony with all other workspace views.

This feature extracts `UsersHeader.tsx` into a modular, testable header component, introduces Framer Motion active pill tab switching, adds an instant client-side user search filter, embeds `KpiSummaryCards`, and standardizes `UsersView.tsx`.

---

## 2. UX Flow & Visual Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Users] Manajemen Pengguna  [N Pengguna] [M Perlu Review]    [Refresh] │
│ Kelola persetujuan akun, penugasan hak akses role, dan status pengguna  │
├────────────────────────────────────────────────────────────────────────┤
│ [Clock Pendaftaran Pending (M)] [Users Pengguna Aktif (N)] [UserX Nonaktif (K)] │
│ [Search: Cari nama, email, role...]                                     │
├────────────────────────────────────────────────────────────────────────┤
│ [ Total Pengguna ] [ Menunggu Review ] [ Pengguna Aktif ] [ Nonaktif ] │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Title Row (Row 1)**:
   - Icon: `Users` (indigo-500)
   - Title: "Manajemen Pengguna"
   - Counter Badge: `{totalUsers} Pengguna`
   - Pending Alert Badge (if `counts.pending > 0`): `{counts.pending} Perlu Persetujuan` (amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20)
   - Subtitle: "Kelola persetujuan akun, penugasan hak akses role, dan status akses pengguna sistem."
   - Action buttons: Refresh button (`RefreshCw`) with spinning indicator when `isLoading` is true.

2. **Controls & Navigation Row (Row 2)**:
   - Segmented tab control with Framer Motion sliding pill (`motion.div layoutId="activeUsersTabPill"`, spring dynamics `stiffness: 450, damping: 35`, `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`):
     - `PENDING`: "Pendaftaran Pending" (`Clock` icon, amber count badge if > 0)
     - `APPROVED`: "Pengguna Aktif" (`ShieldCheck` icon, count badge)
     - `REJECTED`: "Ditolak / Nonaktif" (`UserX` icon, count badge)
   - Quick Search Input:
     - Real-time client-side filter querying `user.name`, `user.email`, `user.role`, and `user.status`
     - Leading `Search` icon, trailing clear `X` button
     - Dynamic results count and clear trigger.

3. **KPI Summary Cards Row (Row 3)**:
   - `KpiSummaryCards items={kpiItems} mobileStrip`:
     - Card 1: "Total Pengguna" — total registered users across all statuses (color: `indigo`, icon: `Users`)
     - Card 2: "Menunggu Review" — pending registrations count (color: `amber`, icon: `Clock`, clickable to switch to PENDING tab)
     - Card 3: "Pengguna Aktif" — approved active users (color: `emerald`, icon: `ShieldCheck`, clickable to switch to APPROVED tab)
     - Card 4: "Akun Ditolak / Nonaktif" — rejected/inactive users (color: `rose`, icon: `UserX`, clickable to switch to REJECTED tab)

---

## 3. Component Interface Contract (`UsersHeader.tsx`)

```typescript
export interface UsersHeaderProps {
  counts: {
    pending: number;
    active: number;
    rejected: number;
  };
  activeTab: UserStatus;
  onTabChange: (tab: UserStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}
```

---

## 4. Pure Logic & Helpers (`usersFilterHelpers.ts`)

Extract pure filter logic:
```typescript
export function filterUsers(
  users: AppUser[],
  query: string
): AppUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((u) => {
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });
}
```

---

## 5. Acceptance Criteria

- [ ] `src/components/views/UsersView/UsersHeader.tsx` is created, following the glassmorphic backdrop-blur header architecture with row 1 (Title), row 2 (Tab Switcher + Search Input), and row 3 (`KpiSummaryCards`).
- [ ] Active tab switcher features Framer Motion spring sliding pill animation (`layoutId="activeUsersTabPill"`), `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`.
- [ ] Clicking KPI cards navigates directly to the respective tab (`PENDING`, `APPROVED`, `REJECTED`).
- [ ] Quick Search filters the active tab user list instantaneously by name, email, or role.
- [ ] `UsersView.tsx` outer container uses full-bleed workspace layout `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 flex-1 min-h-0 space-y-4` (removing restrictive `max-w-7xl mx-auto`).
- [ ] File size of `UsersView.tsx` coordinator is kept strictly under 250 LOC.
- [ ] All verification gates pass: `npm run drift:check`, `npm run build:check`, `npm run test:smoke`, `npm test`.

---

## 6. Non-Goals

- Modifying the underlying database schema (`User` model) or changing NextAuth backend auth logic.
- Altering the approval/rejection mutation API endpoints.
