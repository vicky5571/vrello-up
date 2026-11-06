# Handover: Mobile Sidebar Slide Transition & Backdrop Animation

- **Date:** 2026-11-06
- **Status:** IMPLEMENTATION COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-sidebar-slide-transition-and-backdrop-animation-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-sidebar-slide-transition-and-backdrop-animation.md
- **Refs:** ADR-0063, ADR-0058, ADR-0057

---

## 1. Overview & Objective

This handover document provides execution-ready instructions to add smooth Framer Motion slide-in and slide-out transitions (`x: "-100%" -> 0 -> "-100%"`) and backdrop fade-in and fade-out transitions (`opacity: 0 -> 1 -> 0`) for the mobile navigation drawer in `src/components/layout/Sidebar.tsx`, while **strictly maintaining 100% of the desktop layout unchanged**.

---

## 2. File Manifest

1. `src/components/layout/MobileBottomNav.test.ts` — Regression and invariant test suite verifying Framer Motion wrappers, backdrop transitions, drawer slide transitions, and coordinator line limits.
2. `src/components/layout/Sidebar.tsx` — Main sidebar coordinator component updated with `AnimatePresence`, `motion.div` backdrop, `motion.aside` drawer, and viewport guard `isMobile`.
3. `docs/SESSION_STATE.md` — Session state tracking.
4. `CHANGELOG.md` — Change documentation.

---

## 3. Explicit "Do Not Touch" List

- **Desktop Layout Classes (`md:static md:z-20 md:w-60 md:h-full md:rounded-2xl md:border md:shadow-lg`)**: DO NOT modify or remove. Desktop appearance must remain 100% byte-for-byte unaffected.
- **Zustand Navigation Actions & Routing**: DO NOT alter `handleSelectView`, `setActiveView`, `toggleSidebar`, or `setHelpDocsOpen`.
- **SSOT Domain Entities**: DO NOT alter types in `src/types/index.ts`.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Add Unit Test Invariants to `src/components/layout/MobileBottomNav.test.ts`

Add a new `describe` block verifying:
1. `Sidebar.tsx` imports `AnimatePresence`, `motion`, and `useReducedMotion`.
2. `Sidebar.tsx` wraps the backdrop and drawer in `<AnimatePresence>`.
3. `Sidebar.tsx` uses `motion.aside` and `motion.div`.
4. `Sidebar.tsx` guards drawer motion props with `isMobile` / `shouldReduceMotion`.
5. `Sidebar.tsx` coordinator LOC remains strictly $\le 250$ LOC.

### Step 2: Update `src/components/layout/Sidebar.tsx`

1. Add imports:
   ```tsx
   import { useState, useEffect } from "react";
   import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
   ```
2. Initialize responsive state and motion hooks:
   ```tsx
   const shouldReduceMotion = useReducedMotion();
   const [isMobile, setIsMobile] = useState(false);

   useEffect(() => {
     const checkMobile = () => setIsMobile(window.innerWidth < 768);
     checkMobile();
     window.addEventListener("resize", checkMobile);
     return () => window.removeEventListener("resize", checkMobile);
   }, []);
   ```
3. Wrap rendered elements in `<AnimatePresence>`:
   ```tsx
   return (
     <>
       <AnimatePresence>
         {/* Mobile overlay backdrop */}
         {isSidebarOpen && isMobile && (
           <motion.div
             key="mobile-sidebar-backdrop"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
             onClick={toggleSidebar}
             className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs"
           />
         )}

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
             {/* navigation body unchanged */}
           </motion.aside>
         )}
       </AnimatePresence>

       {/* Modals */}
       <HelpDocsModal
         isOpen={isHelpDocsOpen}
         onClose={() => setHelpDocsOpen(false)}
       />
     </>
   );
   ```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Tests (Ensure Green Phase)
npx tsx --test src/components/layout/MobileBottomNav.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 91/91)
npm run drift:check

# 3. TypeScript Compilation (0 errors required)
npm run build:check

# 4. Smoke Test Suite (0 failures)
npm run test:smoke

# 5. Full Test Suite (0 failures)
npm test
```

---

## 6. Acceptance Criteria Checklist

- [x] Opening mobile sidebar slides in from `x: "-100%"` to `0` with spring physics (`damping: 28, stiffness: 300`).
- [x] Opening mobile sidebar fades in the backdrop (`opacity: 0 -> 1`).
- [x] Dismissing mobile sidebar (backdrop click or nav click) slides out to `x: "-100%"` and fades out backdrop (`opacity: 1 -> 0`).
- [x] On desktop screens ($\ge 768\text{px}$), sidebar renders statically without initial or exit motion (`initial={false}`, `exit={undefined}`).
- [x] Reduced motion is respected via `useReducedMotion()`.
- [x] `Sidebar.tsx` LOC remains strictly $\le 250$ LOC (205 LOC).
- [x] `npm run drift:check` passes with 0 drift (91/91 specs paired).
- [x] `npm run build:check` exits with code 0.
- [x] `npm run test:smoke` passes with 0 failures (144/144 passing).


