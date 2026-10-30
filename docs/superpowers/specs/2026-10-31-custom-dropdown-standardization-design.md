# Design Spec: CustomDropdown Component & Sitewide Dropdown Standardization

**Date:** 2026-10-31  
**Author:** Critical Senior Software Engineer  
**Status:** Approved  
**Affected Files:**
- `src/components/ui/CustomDropdown.tsx` (New atomic component)
- `src/components/views/BranchesView/BranchesHeader.tsx`
- `src/components/views/OutletsView/OutletsHeader.tsx`
- `src/components/views/AnalyticsView/AnalyticsHeader.tsx`
- `src/components/views/PlacementsView/PlacementsHeader.tsx`
- `src/components/views/EventsView/EventsHeader.tsx`
- `src/components/views/PipelineView/PipelineFilterBar.tsx`
- `src/components/views/InventoryView/InventoryHeaderKpis.tsx`
- `src/components/views/MousView/MousView.tsx`

---

## 1. Executive Summary

Native HTML `<select>` elements render platform-dependent operating system popovers (e.g. unstyled Aqua popover on macOS) that clash with the modern, dark-mode-aware design language of the application. They lack searchability across long option lists (such as branches, regions, or categories), have poor keyboard feedback, and cannot display badges or icons.

This specification introduces a lightweight, accessible, zero-dependency `CustomDropdown` component in `src/components/ui/CustomDropdown.tsx` leveraging `useDropdown` for outside click and escape handling. It replaces native `<select>` dropdowns across the site headers and filter bars with a cohesive, searchable custom dropdown.

---

## 2. Visual & Interaction Architecture

### A. Component States

```
Trigger Closed:
┌──────────────────────────────────────┐
│ [Icon] DKI Jakarta               [▾] │
└──────────────────────────────────────┘

Trigger Open (with search input):
┌──────────────────────────────────────┐
│ [Icon] DKI Jakarta               [▴] │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ [🔍 Cari opsi...                   ] │
├──────────────────────────────────────┤
│   Semua Region                       │
│   Banten                             │
│   Central Java                       │
│   DI Yogyakarta                      │
│ ✓ DKI Jakarta                        │  <- Highlighted / Active
│   East Java                          │
│   West Java                          │
└──────────────────────────────────────┘
```

### B. Core Features & Invariants

1. **Integrated Search**:
   - When options count $\ge 6$ or `searchable={true}`, a sticky search input appears at the top of the menu with real-time filtering and clear button.
2. **Keyboard Navigation & Accessibility**:
   - `Escape` dismisses the dropdown and restores trigger focus.
   - `Enter` / `Space` toggles or selects option.
   - `ArrowDown` / `ArrowUp` navigates through visible options.
   - ARIA roles: `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"`, `role="option"`, `aria-selected`.
3. **Aesthetics & Theme Alignment**:
   - Glassmorphic backdrop blur, subtle borders (`border-slate-200 dark:border-slate-800`), smooth scale and fade transition (`animate-in fade-in zoom-in-95 duration-100`).
   - Checkmark icon (`Check`) for currently active item.
   - Supports optional badges and leading icons per option.
4. **Light Dismiss**:
   - Integrated with existing `useDropdown` hook for pointer-down outside dismissal.

---

## 3. Component Interface Contract

```typescript
export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface CustomDropdownProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[] | { value: T; label: string }[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
  id?: string;
}
```

---

## 4. Verification Checklist

- [ ] `CustomDropdown` component created with zero TypeScript errors
- [ ] Unit tests for `CustomDropdown` pass
- [ ] Drift check passes: `npm run drift:check`
- [ ] TypeScript check passes: `npm run build:check`
- [ ] Full test suite passes: `npm test`
- [ ] Native select elements in target headers replaced with `CustomDropdown`
