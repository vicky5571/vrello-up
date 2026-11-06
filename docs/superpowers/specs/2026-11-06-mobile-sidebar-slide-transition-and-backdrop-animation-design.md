# Technical Specification: Mobile Sidebar Slide Transition & Backdrop Animation

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Refs:** ADR-0063, ADR-0058, ADR-0057
- **Target Files:**
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/MobileBottomNav.test.ts`

---

## 1. Executive Summary

This specification defines the responsive transition architecture for the mobile navigation sidebar in `Sidebar.tsx`. It introduces fluid slide-in and slide-out transitions (`x: "-100%" -> 0 -> "-100%"`) and backdrop fade transitions (`opacity: 0 -> 1 -> 0`) using Framer Motion's `AnimatePresence`. Crucially, it strictly isolates motion transformations to mobile viewports (< 768px), ensuring the desktop sidebar ($\ge 768\text{px}$) remains 100% static, unshifted, and unaffected by inline motion transforms.

---

## 2. Problem Statement & User Experience Flow

### 2.1 Current Defect
- In `Sidebar.tsx`, the conditional rendering `{isSidebarOpen && <div ... />} ` and `{isSidebarOpen && <aside ... />}` causes the mobile drawer and dark backdrop to mount and unmount with a 0ms hard pop/cut.
- When tapping the hamburger menu (`TopNavBreadcrumbs`) or the **Menu** tab (`MobileBottomNav`), the drawer suddenly appears on screen. When tapping the backdrop or a navigation link, it abruptly vanishes without an exit animation.

### 2.2 Desired User Experience Flow
1. **Drawer Opening on Mobile (< 768px):**
   - User taps the hamburger menu in the top bar or **Menu** in the bottom bar.
   - The dark overlay backdrop smoothly fades in (`opacity: 0 -> 1` in ~200ms).
   - Simultaneously, the sidebar drawer smoothly slides into view from the left edge (`x: "-100%" -> 0`) with realistic spring physics (`damping: 28, stiffness: 300`).
2. **Drawer Dismissal on Mobile (< 768px):**
   - User taps the backdrop or a navigation link (`handleSelectView`).
   - The drawer slides smoothly back out to the left (`x: 0 -> "-100%"`).
   - The backdrop fades out (`opacity: 1 -> 0`).
   - Elements are cleanly unmounted from the DOM only after exit animations finish.
3. **Desktop Preservation Invariant ($\ge 768\text{px}$):**
   - On screens $\ge 768\text{px}$, the sidebar renders as a static flex panel (`md:static md:w-60 md:h-full`).
   - Motion transforms are completely disabled (`initial={false}`, `exit={false}`, `transition={{ duration: 0 }}`) when `!isMobile`.
   - Zero layout shift, zero visual translation, and zero performance penalty on desktop.
4. **Accessibility Guard:**
   - If `prefers-reduced-motion` is active (`useReducedMotion()`), animations are skipped (`duration: 0`).

---

## 3. Component Architecture & Implementation Details

### 3.1 State & Viewport Detection in `Sidebar.tsx`

```tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function Sidebar() {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ... store selectors and helpers
```

### 3.2 Mobile Backdrop Animation Contract

```tsx
<AnimatePresence>
  {/* Mobile overlay backdrop: only rendered and animated on mobile */}
  {isSidebarOpen && isMobile && (
    <motion.div
      key="sidebar-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      onClick={toggleSidebar}
      className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs"
    />
  )}

  {/* Sidebar Drawer: animated on mobile, static on desktop */}
  {isSidebarOpen && (
    <motion.aside
      key="sidebar-aside"
      initial={isMobile && !shouldReduceMotion ? { x: "-100%" } : false}
      animate={{ x: 0 }}
      exit={isMobile && !shouldReduceMotion ? { x: "-100%" } : false}
      transition={
        shouldReduceMotion || !isMobile
          ? { duration: 0 }
          : { type: "spring", damping: 28, stiffness: 300 }
      }
      className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] md:static md:z-20 md:w-60 md:h-full rounded-r-2xl md:rounded-2xl border-r md:border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191B] shadow-2xl md:shadow-lg flex flex-col justify-between shrink-0 select-none overflow-hidden"
    >
      {/* ... Navigation content unchanged ... */}
    </motion.aside>
  )}
</AnimatePresence>
```

### 3.3 Strict Invariant Checks
1. **Coordinator File Size:** `Sidebar.tsx` currently has 175 lines. With the added hooks and motion props, it will stay around ~190 lines, well below the mandatory $\le 250$ LOC limit.
2. **SSOT Invariant:** No domain types are modified.
3. **Z-Index Layering (ADR-0039):** Backdrop stays at `z-40`, mobile drawer stays at `z-50`, desktop stays at `md:z-20`.

---

## 4. Acceptance Criteria & Non-Goals

### 4.1 Acceptance Criteria
- [ ] On mobile viewports (< 768px), opening the sidebar triggers a smooth slide-in from `x: "-100%"` to `0` with spring physics (`damping: 28, stiffness: 300`).
- [ ] On mobile viewports (< 768px), opening the sidebar triggers a smooth fade-in backdrop from `opacity: 0` to `1`.
- [ ] On mobile viewports (< 768px), closing the sidebar (tapping backdrop or navigation item) triggers an exit slide-out to `x: "-100%"` and backdrop fade-out to `opacity: 0` via `AnimatePresence`.
- [ ] On desktop screens ($\ge 768\text{px}$), the sidebar renders statically without initial or exit translation (`initial={false}`, `exit={false}`).
- [ ] When `prefers-reduced-motion` is enabled, all animations bypass instantly (`duration: 0`).
- [ ] `Sidebar.tsx` line count remains strictly $\le 250$ LOC.
- [ ] Unit tests in `src/components/layout/MobileBottomNav.test.ts` verify the animation wrappers and pass with 0 failures.

### 4.2 Non-Goals
- Changing the navigation structure, icons, or labels in `navConfig.ts`.
- Modifying `useWorkspaceStore` state slices or `toggleSidebar` action logic.
- Adding swipe-to-dismiss touch gesture drag (can be explored in a future enhancement).

---

## 5. Verification Checklist

```bash
# 1. Targeted Unit Tests
npx tsx --test src/components/layout/MobileBottomNav.test.ts

# 2. Invariant & Coordinator LOC Verification
npm run drift:check

# 3. TypeScript Strict Typecheck
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke

# 5. Full Test Suite
npm test
```



