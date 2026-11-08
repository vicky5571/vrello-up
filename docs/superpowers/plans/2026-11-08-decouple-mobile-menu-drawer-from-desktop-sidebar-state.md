# Implementation Plan: Decouple Mobile Menu Drawer from Desktop Sidebar State

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-decouple-mobile-menu-drawer-from-desktop-sidebar-state-design.md](../specs/2026-11-08-decouple-mobile-menu-drawer-from-desktop-sidebar-state-design.md)
- **ADR:** [ADR-0099](../../adr/0099-decouple-mobile-menu-drawer-from-desktop-sidebar-state.md)

---

## Phase 1: Test-First Setup (`src/components/layout/MobileBottomNav.test.ts`)

- [x] Update `src/components/layout/MobileBottomNav.test.ts`
- [x] Test 1: Verify `MobileBottomNav.tsx` uses `isMobileMenuOpen` for Menu tab active state
- [x] Test 2: Verify `MobileBottomNav.tsx` triggers `toggleMobileMenu` on Menu tab click
- [x] Test 3: Verify operational tabs call `setMobileMenuOpen(false)` on click
- [x] Run test suite: verify RED baseline failures on target assertions

## Phase 2: Implementation of Store Slice & Component Updates

- [x] Update `src/lib/store/slices/types.ts`:
  - [x] Add `isMobileMenuOpen: boolean` to `UiState`
  - [x] Add `toggleMobileMenu: () => void` and `setMobileMenuOpen: (open: boolean) => void` to `UiActions`
- [x] Update `src/lib/store/slices/createUiSlice.ts`:
  - [x] Initialize `isMobileMenuOpen: false`
  - [x] Implement `toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }))`
  - [x] Implement `setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open })`
- [x] Update `src/components/layout/Sidebar.tsx`:
  - [x] Select `isMobileMenuOpen` and `setMobileMenuOpen` from `useWorkspaceStore`
  - [x] Update render guard: on mobile (`isMobile`), check `isMobileMenuOpen`; on desktop, check `isSidebarOpen`
  - [x] Update backdrop click to call `setMobileMenuOpen(false)`
  - [x] Update `handleSelectView` to call `setMobileMenuOpen(false)` on mobile
- [x] Update `src/components/layout/MobileBottomNav.tsx`:
  - [x] Select `isMobileMenuOpen`, `toggleMobileMenu`, and `setMobileMenuOpen`
  - [x] Update tab contracts to use `isMobileMenuOpen` and dismiss menu on tab switches
- [x] Run targeted tests: verify GREEN (100% pass)

## Phase 3: Verification & Session Handoff

- [x] Run `npm run drift:check` — confirm 0 drift, all 126 spec-plan pairs match
- [x] Run `npm run build:check` — confirm 0 TypeScript errors
- [x] Run `npm test` — confirm 0 test failures
- [x] Update `docs/SESSION_STATE.md`

