# Handover: Decouple Mobile Menu Drawer from Desktop Sidebar State

- **Date:** 2026-11-08
- **Status:** Planning Complete — Ready for Implementation
- **ADR:** [ADR-0099](adr/0099-decouple-mobile-menu-drawer-from-desktop-sidebar-state.md)
- **Spec:** [2026-11-08-decouple-mobile-menu-drawer-from-desktop-sidebar-state-design.md](superpowers/specs/2026-11-08-decouple-mobile-menu-drawer-from-desktop-sidebar-state-design.md)
- **Plan:** [2026-11-08-decouple-mobile-menu-drawer-from-desktop-sidebar-state.md](superpowers/plans/2026-11-08-decouple-mobile-menu-drawer-from-desktop-sidebar-state.md)

---

## 1. Exact File Paths & Purpose

| File Path | One-Line Purpose |
| :--- | :--- |
| `src/lib/store/slices/types.ts` | Add `isMobileMenuOpen: boolean`, `toggleMobileMenu`, and `setMobileMenuOpen` to `UiState`/`UiActions`. |
| `src/lib/store/slices/createUiSlice.ts` | Initialize `isMobileMenuOpen: false`, implement `toggleMobileMenu` and `setMobileMenuOpen`. |
| `src/components/layout/Sidebar.tsx` | Conditionally guard drawer rendering via `isMobile ? isMobileMenuOpen : isSidebarOpen`. |
| `src/components/layout/MobileBottomNav.tsx` | Bind "Menu" tab to `isMobileMenuOpen` and `toggleMobileMenu()`, auto-close menu on tab clicks. |
| `src/components/layout/MobileBottomNav.test.ts` | Test suite validating decoupled mobile menu drawer state. |
| `docs/SESSION_STATE.md` | Record ADR-0099 planning status. |

---

## 2. Exact Code Changes

### 2.1 `src/lib/store/slices/types.ts`

#### Current Code (Lines 156 and 191)
```ts
  isSidebarOpen: boolean;
```
```ts
  toggleSidebar: () => void;
```

#### Replacement Code
```ts
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
```
```ts
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
```

---

### 2.2 `src/lib/store/slices/createUiSlice.ts`

#### Current Code (Lines 83 and 182–184)
```ts
  isSidebarOpen: true,
```
```ts
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
```

#### Replacement Code
```ts
  isSidebarOpen: true,
  isMobileMenuOpen: false,
```
```ts
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
```

---

### 2.3 `src/components/layout/Sidebar.tsx`

#### Current Code (Lines 29–52 and 60–80)
```tsx
  const {
    appMode,
    activeView,
    isSidebarOpen,
    isHelpDocsOpen,
  } = useWorkspaceStore(
    useShallow((s) => ({
      appMode: s.appMode,
      activeView: s.activeView,
      isSidebarOpen: s.isSidebarOpen,
      isHelpDocsOpen: s.isHelpDocsOpen,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setHelpDocsOpen = useWorkspaceStore((s) => s.setHelpDocsOpen);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);

  const handleSelectView = (viewId: string) => {
    setActiveView(viewId as any);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleSidebar();
    }
  };
```
```tsx
      <AnimatePresence>
        {/* Mobile overlay backdrop */}
        {isSidebarOpen && isMobile && (
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.24, ease: [0.2, 0, 0, 1] }
            }
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs"
          />
        )}

        {isSidebarOpen && (
          <motion.aside
```

#### Replacement Code
```tsx
  const {
    appMode,
    activeView,
    isSidebarOpen,
    isMobileMenuOpen,
    isHelpDocsOpen,
  } = useWorkspaceStore(
    useShallow((s) => ({
      appMode: s.appMode,
      activeView: s.activeView,
      isSidebarOpen: s.isSidebarOpen,
      isMobileMenuOpen: s.isMobileMenuOpen,
      isHelpDocsOpen: s.isHelpDocsOpen,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setHelpDocsOpen = useWorkspaceStore((s) => s.setHelpDocsOpen);
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);

  const handleSelectView = (viewId: string) => {
    setActiveView(viewId as any);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const isMenuVisible = isMobile ? isMobileMenuOpen : isSidebarOpen;
```
```tsx
      <AnimatePresence>
        {/* Mobile overlay backdrop */}
        {isMobileMenuOpen && isMobile && (
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.24, ease: [0.2, 0, 0, 1] }
            }
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs"
          />
        )}

        {isMenuVisible && (
          <motion.aside
```

---

### 2.4 `src/components/layout/MobileBottomNav.tsx`

#### Current Code (Lines 10–21, 23–64, and 66–80)
```tsx
interface BottomTabItem {
  id: string;
  label: string;
  icon: typeof Layers;
  activeColor: string;
  isActive: (activeView: ViewMode, isSidebarOpen: boolean) => boolean;
  onClick: (helpers: {
    setActiveView: (view: ViewMode) => void;
    setAppMode: (mode: "tasks" | "marcom") => void;
    toggleSidebar: () => void;
  }) => void;
}
```
```tsx
const BOTTOM_TABS: BottomTabItem[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Layers,
    activeColor: "text-indigo-500 dark:text-indigo-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "pipeline",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("pipeline"); },
  },
  {
    id: "outlets",
    label: "Outlets",
    icon: Store,
    activeColor: "text-violet-500 dark:text-violet-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "outlets",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("outlets"); },
  },
  {
    id: "placements",
    label: "Placements",
    icon: MapPin,
    activeColor: "text-emerald-500 dark:text-emerald-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "placements",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("placements"); },
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "events",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("events"); },
  },
  {
    id: "menu",
    label: "Menu",
    icon: Menu,
    activeColor: "text-amber-500 dark:text-amber-400",
    isActive: (_view, isSidebarOpen) => isSidebarOpen,
    onClick: ({ toggleSidebar }) => toggleSidebar(),
  },
];
```
```tsx
export function MobileBottomNav() {
  const { activeView, isSidebarOpen } = useWorkspaceStore(
    useShallow((s) => ({
      activeView: s.activeView,
      isSidebarOpen: s.isSidebarOpen,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const shouldReduceMotion = useReducedMotion();

  const helpers = { setActiveView, setAppMode, toggleSidebar };
```

#### Replacement Code
```tsx
interface BottomTabItem {
  id: string;
  label: string;
  icon: typeof Layers;
  activeColor: string;
  isActive: (activeView: ViewMode, isMobileMenuOpen: boolean) => boolean;
  onClick: (helpers: {
    setActiveView: (view: ViewMode) => void;
    setAppMode: (mode: "tasks" | "marcom") => void;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (open: boolean) => void;
  }) => void;
}
```
```tsx
const BOTTOM_TABS: BottomTabItem[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Layers,
    activeColor: "text-indigo-500 dark:text-indigo-400",
    isActive: (view, isMobileMenuOpen) => !isMobileMenuOpen && view === "pipeline",
    onClick: ({ setActiveView, setAppMode, setMobileMenuOpen }) => { setAppMode("marcom"); setActiveView("pipeline"); setMobileMenuOpen(false); },
  },
  {
    id: "outlets",
    label: "Outlets",
    icon: Store,
    activeColor: "text-violet-500 dark:text-violet-400",
    isActive: (view, isMobileMenuOpen) => !isMobileMenuOpen && view === "outlets",
    onClick: ({ setActiveView, setAppMode, setMobileMenuOpen }) => { setAppMode("marcom"); setActiveView("outlets"); setMobileMenuOpen(false); },
  },
  {
    id: "placements",
    label: "Placements",
    icon: MapPin,
    activeColor: "text-emerald-500 dark:text-emerald-400",
    isActive: (view, isMobileMenuOpen) => !isMobileMenuOpen && view === "placements",
    onClick: ({ setActiveView, setAppMode, setMobileMenuOpen }) => { setAppMode("marcom"); setActiveView("placements"); setMobileMenuOpen(false); },
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view, isMobileMenuOpen) => !isMobileMenuOpen && view === "events",
    onClick: ({ setActiveView, setAppMode, setMobileMenuOpen }) => { setAppMode("marcom"); setActiveView("events"); setMobileMenuOpen(false); },
  },
  {
    id: "menu",
    label: "Menu",
    icon: Menu,
    activeColor: "text-amber-500 dark:text-amber-400",
    isActive: (_view, isMobileMenuOpen) => isMobileMenuOpen,
    onClick: ({ toggleMobileMenu }) => toggleMobileMenu(),
  },
];
```
```tsx
export function MobileBottomNav() {
  const { activeView, isMobileMenuOpen } = useWorkspaceStore(
    useShallow((s) => ({
      activeView: s.activeView,
      isMobileMenuOpen: s.isMobileMenuOpen,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const toggleMobileMenu = useWorkspaceStore((s) => s.toggleMobileMenu);
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);
  const shouldReduceMotion = useReducedMotion();

  const helpers = { setActiveView, setAppMode, toggleMobileMenu, setMobileMenuOpen };
```

---

## 3. Explicit "Do Not Touch" List

| File / Component | Reason |
| :--- | :--- |
| `src/components/layout/GlobalRail.tsx` | Desktop rail. Controls `isSidebarOpen: true` exclusively. Must not be touched. |
| `src/app/page.tsx` | Workspace root coordinator. Invariant and sizing checks apply. |
| Initial/default view settings in `useWorkspaceStore.ts` | User explicit mandate: do not change default page opened. |
| `localStorage` persistence contract | `partialize` keys remain unchanged. |

---

## 4. Numbered Execution Order

1. **Step 1 (Test-First):** Update `src/components/layout/MobileBottomNav.test.ts` to assert that `MobileBottomNav.tsx` uses `isMobileMenuOpen` and `toggleMobileMenu`. Verify RED baseline.
2. **Step 2 (Store Types):** In `src/lib/store/slices/types.ts`, add `isMobileMenuOpen`, `toggleMobileMenu`, and `setMobileMenuOpen`.
3. **Step 3 (Store Implementation):** In `src/lib/store/slices/createUiSlice.ts`, initialize `isMobileMenuOpen: false`, implement `toggleMobileMenu` and `setMobileMenuOpen`.
4. **Step 4 (Sidebar Component):** In `src/components/layout/Sidebar.tsx`, update state selection to use `isMobileMenuOpen` and `setMobileMenuOpen`, guarding mobile drawer via `isMobile ? isMobileMenuOpen : isSidebarOpen`.
5. **Step 5 (Bottom Nav Component):** In `src/components/layout/MobileBottomNav.tsx`, bind Menu tab to `isMobileMenuOpen` and `toggleMobileMenu()`, with `setMobileMenuOpen(false)` on other tabs.
6. **Step 6 (Verification):** Run `node --test src/components/layout/MobileBottomNav.test.ts`. Verify GREEN (all passing).
7. **Step 7 (Invariants & Quality Gates):**
   - Run `npm run drift:check`
   - Run `npm run build:check`
   - Run `npm test`
8. **Step 8 (Session State Update):** Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [ ] On mobile viewport load/refresh, the website opens directly to the active page without the drawer or backdrop blocking the screen.
- [ ] Tapping "Menu" in the mobile bottom bar opens the drawer and highlights the Menu tab.
- [ ] Tapping any operational tab (Pipeline, Outlets, Placements, Events) or the backdrop dismisses the drawer immediately.
- [ ] Desktop sidebar remains `isSidebarOpen: true` by default and functions identically with zero changes.
- [ ] Default page opened and persistence logic are completely preserved.
- [ ] `npm run drift:check` passes with zero drift across all 126 spec-plan pairs.
- [ ] `npm run build:check` passes with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures.



