# Handover: Mobile Bottom Navigation — Fluid Sliding Pill Animation & Layout Isolation

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-sliding-pill-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-07-mobile-bottom-nav-sliding-pill.md`
- **ADR:** `docs/adr/0067-mobile-bottom-nav-sliding-pill-animation.md`

## 1. Target Files & Purpose

1. `src/components/layout/MobileBottomNav.tsx` — Mobile bottom navigation bar; wraps tabs in `LayoutGroup`, un-scales outer button, applies inner tactile tap scale, and enhances active pill contrast and spring physics.
2. `src/components/layout/MobileBottomNav.test.ts` — Unit test suite; verifies `LayoutGroup` isolation and ensures existing 14 test invariants remain green.

---

## 2. Exact Current Code Snippets

### File: `src/components/layout/MobileBottomNav.tsx` (Lines 4–5)
```tsx
import { useShallow } from "zustand/react/shallow";
import { motion, useReducedMotion } from "framer-motion";
```

### File: `src/components/layout/MobileBottomNav.tsx` (Lines 104–146)
```tsx
    <nav
      data-testid="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden h-14 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-lg select-none pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-1"
    >
      {BOTTOM_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(activeView, isSidebarOpen);

        return (
          <motion.button
            key={tab.id}
            type="button"
            whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
            onClick={() => tab.onClick(helpers)}
            className={cn(
              "relative flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl cursor-pointer group transition-colors",
              active
                ? "text-slate-900 dark:text-white font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            {active && (
              <motion.div
                layoutId="activeMobileBottomTab"
                className="absolute inset-y-1 inset-x-0.5 bg-slate-100/80 dark:bg-white/10 rounded-xl"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 450, damping: 32 }
                }
              />
            )}
            <div className="relative z-10 flex items-center justify-center">
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-105",
                  active ? tab.activeColor : "text-slate-400 dark:text-slate-400",
                )}
              />
            </div>
            <span className="relative z-10 text-[10.5px] font-medium leading-none mt-0.5">{tab.label}</span>
          </motion.button>
        );
      })}
    </nav>
```

---

## 3. Exact Change Instructions

### Step 1: `src/components/layout/MobileBottomNav.test.ts`
Add a new assertion verifying `LayoutGroup`:
```ts
  it("verifies MobileBottomNav wraps tabs in LayoutGroup for projection tree isolation", () => {
    const bottomNavContent = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(
      bottomNavContent.includes("LayoutGroup") &&
        bottomNavContent.includes('id="mobile-bottom-nav"'),
      "Expected MobileBottomNav to wrap tabs in LayoutGroup with id mobile-bottom-nav"
    );
  });
```

### Step 2: `src/components/layout/MobileBottomNav.tsx`

1. **Import `LayoutGroup`:**
   - **Replace:**
     ```tsx
     import { motion, useReducedMotion } from "framer-motion";
     ```
   - **With:**
     ```tsx
     import { motion, LayoutGroup, useReducedMotion } from "framer-motion";
     ```

2. **Wrap Tabs with `LayoutGroup` and Decouple Tap Scale:**
   - **Replace:**
     ```tsx
         return (
           <motion.button
             key={tab.id}
             type="button"
             whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
             onClick={() => tab.onClick(helpers)}
             className={cn(
               "relative flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl cursor-pointer group transition-colors",
               active
                 ? "text-slate-900 dark:text-white font-semibold"
                 : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
             )}
           >
             {active && (
               <motion.div
                 layoutId="activeMobileBottomTab"
                 className="absolute inset-y-1 inset-x-0.5 bg-slate-100/80 dark:bg-white/10 rounded-xl"
                 transition={
                   shouldReduceMotion
                     ? { duration: 0 }
                     : { type: "spring", stiffness: 450, damping: 32 }
                 }
               />
             )}
             <div className="relative z-10 flex items-center justify-center">
               <Icon
                 className={cn(
                   "w-4 h-4 transition-transform group-hover:scale-105",
                   active ? tab.activeColor : "text-slate-400 dark:text-slate-400",
                 )}
               />
             </div>
             <span className="relative z-10 text-[10.5px] font-medium leading-none mt-0.5">{tab.label}</span>
           </motion.button>
         );
     ```
   - **With:**
     ```tsx
         return (
           <button
             key={tab.id}
             type="button"
             onClick={() => tab.onClick(helpers)}
             className={cn(
               "relative flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl cursor-pointer group transition-colors",
               active
                 ? "text-slate-900 dark:text-white font-semibold"
                 : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
             )}
           >
             {active && (
               <motion.div
                 layoutId="activeMobileBottomTab"
                 className="absolute inset-y-1 inset-x-0.5 bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl"
                 transition={
                   shouldReduceMotion
                     ? { duration: 0 }
                     : { type: "spring", stiffness: 420, damping: 30 }
                 }
               />
             )}
             <motion.div
               whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
               className="relative z-10 flex flex-col items-center justify-center gap-0.5"
             >
               <div className="flex items-center justify-center">
                 <Icon
                   className={cn(
                     "w-4 h-4 transition-transform group-hover:scale-105",
                     active ? tab.activeColor : "text-slate-400 dark:text-slate-400",
                   )}
                 />
               </div>
               <span className="text-[10.5px] font-medium leading-none mt-0.5">{tab.label}</span>
             </motion.div>
           </button>
         );
     ```
   - And wrap the `BOTTOM_TABS.map(...)` block with:
     ```tsx
     <LayoutGroup id="mobile-bottom-nav">
       {BOTTOM_TABS.map((tab) => { ... })}
     </LayoutGroup>
     ```

---

## 4. Explicit "Do Not Touch" List

- **`src/components/layout/GlobalRail.tsx`:** Do NOT modify desktop navigation rail.
- **`src/components/layout/Sidebar.tsx`:** Do NOT alter drawer navigation.
- **`src/components/views/**`:** Do NOT modify main stage views or API routes.
- **`BOTTOM_TABS` configuration:** Do NOT alter tab IDs, labels, or routing handlers (`Pipeline`, `Outlets`, `Placements`, `Events`, `Menu`).

---

## 5. Numbered Execution Order

1. **Update Test Suite:** Add `LayoutGroup` test assertion in `src/components/layout/MobileBottomNav.test.ts`.
2. **Verify RED State:** Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` (verify assertion failure on missing LayoutGroup).
3. **Implement Changes:** Apply `LayoutGroup`, unscaled outer button, inner `whileTap` wrapper, and enhanced pill styling to `src/components/layout/MobileBottomNav.tsx`.
4. **Verify GREEN State:** Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` (verify 15/15 passing).
5. **Execute Quality Gates:**
   - `npm run drift:check` (verify 94/94 spec-plan pairing).
   - `npm run build:check` (verify TypeScript 0 errors).
   - `npm run test:smoke` (150/150 smoke tests).
   - `npm test` (full test suite 965+ tests).
6. **Documentation & Commit:**
   - Update `CHANGELOG.md` with feat entry.
   - Update `docs/SESSION_STATE.md`.
   - Commit with standard git commit message referencing ADR-0067.

---

## 6. Acceptance Criteria Checklist

- [ ] Active pill slides smoothly across tabs with fluid spring physics.
- [ ] No layout projection cancellation or geometric jumping when touching tabs.
- [ ] Visual contrast of the pill is clearly defined in both light and dark modes with subtle border and `shadow-2xs`.
- [ ] `MobileBottomNav.test.ts` passes with 15/15 green assertions.
- [ ] `MobileBottomNav.tsx` remains <= 150 LOC.
- [ ] Desktop layout (`GlobalRail.tsx`) remains 100% byte-for-byte unaffected.
- [ ] All 4 verification gates pass with 0 errors/failures.



