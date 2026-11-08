# ADR-0099: Decouple Mobile Menu Drawer from Desktop Sidebar State

- **Status:** PROPOSED (Approved by User Direction)
- **Date:** 2026-11-08
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

In *vrello-up*, navigation between modules is coordinated by `Sidebar.tsx`, `GlobalRail.tsx` (desktop rail), and `MobileBottomNav.tsx` (mobile bottom navigation).

Currently, both desktop layout and mobile drawer navigation share a single boolean state in Zustand (`src/lib/store/slices/createUiSlice.ts`):
```ts
isSidebarOpen: true
```

This state serves two fundamentally incompatible UI paradigms:
1. **Desktop Viewports (`md:` / `≥ 768px`):** The sidebar is a **persistent layout column** placed beside `GlobalRail.tsx` and the main viewport canvas. It is intended to be open (`true`) by default so desktop users can see the module navigation menu without an extra click.
2. **Mobile Viewports (`< md` / `< 768px`):** The sidebar is a **modal overlay slide-over sheet** (`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw]`) accompanied by a dark backdrop (`fixed inset-0 bg-black/40 z-40`).

Because `isSidebarOpen` defaults to `true` globally, every time a mobile user loads or refreshes the application:
- The mobile slide-over drawer immediately opens and blocks $\approx 85\%$ of the screen.
- A dark backdrop covers the active page (e.g., Outlets or Pipeline).
- The "Menu" tab in `MobileBottomNav.tsx` lights up as active (`isActive: isSidebarOpen`).
- Users are forced to manually tap the backdrop or tap the Menu button before they can see or interact with any data on the page.
- This creates an unacceptable first impression and friction for field marketing personnel.

---

## Options Considered

### Option 1: Client-Side Mount Hook to Force `isSidebarOpen: false` on Mobile
- In `Sidebar.tsx`, add an effect on mount that checks `if (window.innerWidth < 768) setSidebarOpen(false)`.
- *Trade-offs:*
  - Pros: Keeps a single variable in the store.
  - Cons: Causes a brief frame-flicker on mobile where the backdrop starts rendering then disappears; couples mobile sheet state with desktop column state so resizing or navigating can inadvertently collapse or expand desktop columns.

### Option 2: State Decoupling — Split into Desktop `isSidebarOpen` & Mobile `isMobileMenuOpen` (Chosen)
- Decouple the ephemeral mobile modal sheet from the persistent desktop column:
  - **Desktop (`isSidebarOpen`):** Remains initialized to `true`. Exclusively consumed and toggled by desktop UI (`GlobalRail.tsx`).
  - **Mobile (`isMobileMenuOpen`):** Initialized to `false`. Exclusively consumed and toggled by mobile UI (`MobileBottomNav.tsx` "Menu" tab and backdrop tap).
  - **Sidebar Component (`Sidebar.tsx`):** Reads `isMobileMenuOpen` when on mobile (`isMobile === true`), and reads `isSidebarOpen` when on desktop (`isMobile === false`).
- *Trade-offs:*
  - Pros: Clean separation of concerns; zero possibility of desktop layout regression; zero flicker on initial mobile load because `isMobileMenuOpen` starts cleanly at `false`; intuitive one-handed mobile drawer behavior.
  - Cons: Requires adding two helper actions (`toggleMobileMenu`, `setMobileMenuOpen`) in `UiSlice`.

---

## Decision

Adopt **Option 2**. Introduce `isMobileMenuOpen: false` into `UiSlice` for mobile sheet drawer state, while keeping `isSidebarOpen: true` 100% dedicated to desktop layout column expansion.

---

## Consequences & Invariants

- **Desktop Invariant (`md:` / `≥ 768px`):**
  - Desktop sidebar remains `isSidebarOpen: true` by default.
  - Expand/collapse toggle on `GlobalRail.tsx` functions identically.
  - Exactly zero visual, dimensional, or behavioral change on desktop screens.
- **Mobile Experience:**
  - On page load, the active view (e.g. Outlets, Pipeline) renders cleanly and unobstructed without a blocking drawer or backdrop.
  - Tapping "Menu" on the bottom navigation bar toggles the drawer.
  - Selecting any navigation item or tapping the backdrop dismisses the drawer (`setMobileMenuOpen(false)`).
- **Default View Preserved:**
  - As explicitly requested by the user, the default view initialization and localStorage persistence are left completely intact.
- **Verification:**
  - Unit tests in `MobileBottomNav.test.ts` and `GlobalRail.test.ts` will verify both independent states.


