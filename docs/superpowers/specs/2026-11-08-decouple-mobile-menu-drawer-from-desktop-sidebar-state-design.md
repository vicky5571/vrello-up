# Decouple Mobile Menu Drawer from Desktop Sidebar State Design Specification

- **Date:** 2026-11-08
- **Status:** Approved
- **ADR:** [ADR-0099](../../adr/0099-decouple-mobile-menu-drawer-from-desktop-sidebar-state.md)

---

## 1. Executive Summary

This specification decouples the mobile slide-over menu drawer from the desktop static layout sidebar in *vrello-up*. By separating `isSidebarOpen` (desktop layout column, default `true`) from a newly introduced `isMobileMenuOpen` (mobile drawer sheet, default `false`), the application eliminates an intrusive UX bug where mobile users are immediately greeted on initial page load by an expanded drawer sheet and dark backdrop covering $\approx 85\%$ of the active page. Desktop viewports remain 100% byte-for-byte invariant, and existing default page configurations remain untouched.

---

## 2. Component & Architecture Specifications

### 2.1 Store State (`src/lib/store/slices/types.ts` & `createUiSlice.ts`)

- **State Definitions (`UiState` in `types.ts`):**
  ```ts
  isSidebarOpen: boolean;       // Desktop static layout column expansion
  isMobileMenuOpen: boolean;    // Mobile overlay slide-over sheet expansion
  ```
- **Actions Definitions (`UiActions` in `types.ts`):**
  ```ts
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  ```
- **Slice Implementation (`createUiSlice.ts`):**
  ```ts
  isSidebarOpen: true,         // Desktop continues to default to true
  isMobileMenuOpen: false,     // Mobile drawer starts closed by default
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  ```

### 2.2 Sidebar (`src/components/layout/Sidebar.tsx`)

- **State Selection:**
  ```tsx
  const { isSidebarOpen, isMobileMenuOpen } = useWorkspaceStore(
    useShallow((s) => ({
      isSidebarOpen: s.isSidebarOpen,
      isMobileMenuOpen: s.isMobileMenuOpen,
    }))
  );
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);
  ```
- **Render Guard:**
  - On mobile (`isMobile === true`): drawer renders when `isMobileMenuOpen === true`.
  - On desktop (`isMobile === false`): aside renders in static layout flow when `isSidebarOpen === true`.
- **Dismissal Actions:**
  - Backdrop tap: `onClick={() => setMobileMenuOpen(false)}`
  - Navigation item select (`handleSelectView`):
    ```tsx
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
    ```

### 2.3 Mobile Bottom Navigation (`src/components/layout/MobileBottomNav.tsx`)

- **State Selection:**
  ```tsx
  const { activeView, isMobileMenuOpen } = useWorkspaceStore(
    useShallow((s) => ({
      activeView: s.activeView,
      isMobileMenuOpen: s.isMobileMenuOpen,
    }))
  );
  const toggleMobileMenu = useWorkspaceStore((s) => s.toggleMobileMenu);
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);
  ```
- **Tab Contract Updates:**
  - Tab 1–4 (Pipeline, Outlets, Placements, Events):
    `isActive: (view, isMobileMenuOpen) => !isMobileMenuOpen && view === tab.id`
    `onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView(tab.id); setMobileMenuOpen(false); }`
  - Tab 5 (Menu):
    `isActive: (_view, isMobileMenuOpen) => isMobileMenuOpen`
    `onClick: () => toggleMobileMenu()`

---

## 3. Non-Goals & Architectural Boundaries

1. **No Default View Modifications:** As explicitly instructed by the user, the default page opened and `localStorage` rehydration logic remain unchanged.
2. **Zero Desktop Layout Alterations:** `GlobalRail.tsx` continues to control `isSidebarOpen: true`. Desktop layout is 100% byte-for-byte unaffected.
3. **No Redundant Re-renders:** State selectors use `useShallow` to prevent unneeded re-renders between independent mobile and desktop actions.

---

## 4. Verification & Testing Checklist

- [ ] **Unit Tests (`src/components/layout/MobileBottomNav.test.ts`):**
  - Verify `isMobileMenuOpen` is checked for the Menu tab.
  - Verify mobile tabs dismiss `isMobileMenuOpen`.
  - Verify `isSidebarOpen` remains independent for desktop.
- [ ] **Drift & Invariant Check:**
  - `npm run drift:check` passes with zero drift (126 spec-plan pairs valid).
  - All coordinator files remain $\le 250$ LOC.
- [ ] **Type & Build Verification:**
  - `npm run build:check` passes with 0 TypeScript errors.
  - `npm test` passes with 0 test failures.



