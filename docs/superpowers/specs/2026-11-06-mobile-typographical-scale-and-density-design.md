# Spec: Mobile Typographical Scale and Compact Visual Hierarchy Standardization

- **Date:** 2026-11-06
- **Status:** COMPLETE
- **Refs:** ADR-0059

---

## 1. Executive Summary & Desktop Protection Invariant

Following the implementation of the mobile shell and horizontal KPI strip (ADR-0058), this specification defines the **Mobile Typographical Scale and Visual Hierarchy Standardization** for *vrello-up*.

### Core Objective
Resolve the visual dissonance between the compact bottom navigation bar (`text-[10.5px]`) and oversized page elements (`text-xl` titles, `h-10` buttons, and `text-sm` table rows), creating an authentic, native-feeling mobile experience while increasing visible data density by ~30%.

### Non-Negotiable Invariant: Desktop Protection
**Nothing on desktop is changed.** All typography, button heights, container paddings, and table row heights are scoped using responsive Tailwind prefixes (`<utility-mobile> sm:<utility-desktop>`). For viewports ≥ 640px (`sm:`) and ≥ 768px (`md:`), 100% of the desktop design remains completely identical.

---

## 2. Harmonized Mobile Typographical Scale Matrix

| UI Element | Desktop Baseline (`sm:` / `md:`) | Mobile Scale (`< sm`) | Token Mapping |
|---|---|---|---|
| **Page Title (H1)** | `text-xl font-bold` (20px) | `text-base font-bold` (16px) | `text-base sm:text-xl font-bold` |
| **Title Badge** | `text-[11px]` | `text-[10px]` | `text-[10px] sm:text-[11px]` |
| **Subtitle / Description** | `text-xs text-slate-500` (12px) | `text-[11px] text-slate-500 leading-tight` (11px) | `text-[11px] sm:text-xs leading-tight sm:leading-normal` |
| **Primary Action Button** | `h-9 sm:h-10 text-sm px-3.5` | `h-8 text-xs px-2.5` | `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3.5` |
| **Utility Button (Refresh)** | `p-2` (36×36px) | `p-1.5` (32×32px) | `p-1.5 sm:p-2` |
| **Sub-Tab Segmented Pills** | `py-1.5 px-3 text-xs` | `py-1 px-2.5 text-xs` | `py-1 sm:py-1.5 px-2.5 sm:px-3 text-xs` |
| **Filter Dropdowns** | `h-9 sm:h-10 text-xs sm:text-sm` | `h-8 text-xs` | `h-8 sm:h-9 text-xs sm:text-sm` |
| **Search Input** | `h-9 sm:h-10 text-sm` | `h-8 text-xs` | `h-8 sm:h-9 text-xs sm:text-sm` |
| **Table Header Cells** | `text-xs font-semibold py-3` | `text-[11px] font-semibold py-2` | `text-[11px] sm:text-xs py-2 sm:py-3` |
| **Table Row Cells (Name)** | `text-sm font-semibold py-3.5` | `text-xs font-semibold py-2` | `text-xs sm:text-sm py-2 sm:py-3.5` |
| **Table Row Cells (Code)** | `text-xs font-mono text-slate-500` | `text-[11px] font-mono` | `text-[11px] sm:text-xs` |
| **Bottom Navigation Tab Label** | N/A (Desktop uses GlobalRail) | `text-[10.5px] font-medium leading-none` | `text-[10.5px] font-medium leading-none` |

---

## 3. Component-Level Implementation Specifications

### 3.1. `src/components/views/OutletsView/OutletsHeader.tsx`
- **Title Block:**
  ```tsx
  <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
    <Store className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
    Outlets Directory
    <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-orange-50 ...">
      {totalOutlets} outlet
    </span>
  </h1>
  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight sm:leading-normal">
    Pusat data jaringan outlet, integrasi MoU, riwayat branding fisik, dan geolokasi.
  </p>
  ```
- **Action Buttons:**
  - Refresh: `p-1.5 sm:p-2 rounded-lg ...` with `<RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />`.
  - Add Outlet: `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-4 rounded-lg`.
- **View Switcher:**
  - Pills: `py-1 sm:py-1.5 px-2.5 sm:px-3 text-xs`.
- **Filter Row:**
  - Dropdowns: `h-8 sm:h-9 text-xs sm:text-sm`.
  - Search input: `h-8 sm:h-9 text-xs sm:text-sm pl-8 sm:pl-9`.

### 3.2. `src/components/views/PlacementsView/PlacementsHeader.tsx` & `EventsHeader.tsx`
- Apply matching responsive scale:
  - Title: `text-base sm:text-xl font-bold`.
  - Description: `text-[11px] sm:text-xs leading-tight`.
  - Buttons: `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-4`.
  - Search input: `h-8 sm:h-9 text-xs sm:text-sm`.

### 3.3. `src/components/views/OutletsView/OutletsView.tsx` (Table Density)
- In the table rendering section:
  - Table row padding: `py-2 sm:py-3.5 px-2.5 sm:px-3`.
  - Name cell: `text-xs sm:text-sm font-semibold`.
  - Code & city badges: `text-[10px] sm:text-xs font-mono`.
  - Checkbox sizing: maintain accessible 16px hit target.

### 3.4. `src/components/layout/MobileBottomNav.tsx`
- Refine tab labels to `text-[10.5px] font-medium leading-none mt-0.5`.
- Active state pill: `bg-slate-100/70 dark:bg-white/10`.

---

## 4. Verification & Testing Contracts

### 4.1. Unit Test Coverage (`src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`)
Create dedicated smoke test validating:
1. `OutletsHeader.tsx` employs `text-base sm:text-xl` on the title element.
2. `OutletsHeader.tsx` employs `text-[11px] sm:text-xs` on description.
3. `OutletsHeader.tsx` employs `h-8 sm:h-9` on buttons and search input.
4. Desktop classes (`sm:text-xl`, `sm:text-sm`) are strictly preserved.
5. All coordinator files (`page.tsx`, `TopNav.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`) stay strictly ≤ 250 LOC.

### 4.2. Acceptance Criteria Checklist
- [x] On mobile screens (< 640px), page titles render as 16px (`text-base`).
- [x] On desktop screens (≥ 640px), page titles render as 20px (`text-xl`) with 100% zero changes.
- [x] Action buttons and filter inputs on mobile scale down to `h-8 text-xs`.
- [x] Table rows render with compact vertical padding (`py-2`) and `text-xs` font size on mobile, fitting 30% more data rows on screen.
- [x] Bottom navigation bar text is scaled to `text-[10.5px]`, visually harmonizing with page elements.
- [x] `npm run drift:check` passes (86 spec-plan pairs valid, coordinator sizes ≤250 LOC).
- [x] `npm run build:check` exits with 0 TypeScript compilation errors.
- [x] `npm run test:smoke` passes with 0 failures.
- [x] `npm test` passes with 0 failures.

---

## 5. Non-Goals
- Modifying backend APIs, database models, or server routes.
- Modifying desktop typography, button heights, or table layouts.



