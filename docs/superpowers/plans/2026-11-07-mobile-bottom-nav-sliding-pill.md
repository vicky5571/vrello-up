# Implementation Plan: Mobile Bottom Navigation — Fluid Sliding Pill Animation & Layout Isolation

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-sliding-pill-design.md`
- **ADR:** `docs/adr/0067-mobile-bottom-nav-sliding-pill-animation.md`

## 1. Executive Summary & File Manifest

Eliminate layout projection distortion and global projection pollution in `MobileBottomNav.tsx` by introducing `<LayoutGroup id="mobile-bottom-nav">`, decoupling `whileTap` micro-scale feedback to the inner icon/label container, and enriching pill visual contrast (`border`, `shadow-2xs`, tuned spring physics) for an ultra-smooth 60fps sliding pill animation.

### File Manifest

| Action | File Path | Estimated LOC Impact | Description |
|---|---|---|---|
| Modify | `src/components/layout/MobileBottomNav.test.ts` | +8, -0 | Add assertions for `LayoutGroup` wrapping and decoupled tap scale. |
| Modify | `src/components/layout/MobileBottomNav.tsx` | +12, -8 | Implement `LayoutGroup`, unscaled outer button, inner `whileTap` wrapper, and tactile pill styling. |
| Modify | `CHANGELOG.md` | +12, -0 | Document feature with ADR-0067 and design spec references. |
| Modify | `docs/SESSION_STATE.md` | +15, -2 | Update active planning session state. |
| Create | `docs/handover-mobile-bottom-nav-sliding-pill.md` | +130 | Execution-ready handover guide with exact code snippets. |

## 2. Phased Implementation Steps

### Phase 1: Test-Driven Development (TDD) Baseline & Red State
- [ ] In `src/components/layout/MobileBottomNav.test.ts`:
  - Add test: `it("verifies MobileBottomNav wraps tabs in LayoutGroup for projection tree isolation")`:
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
- [ ] Run targeted test command:
  ```bash
  npx tsx --test src/components/layout/MobileBottomNav.test.ts
  ```
- [ ] Confirm RED state (assertion failure on missing `LayoutGroup`).

### Phase 2: Implementation of LayoutGroup & Decoupled Tap Scale (Green State)
- [ ] In `src/components/layout/MobileBottomNav.tsx`:
  - Import `LayoutGroup` from `framer-motion`:
    ```tsx
    import { motion, LayoutGroup, useReducedMotion } from "framer-motion";
    ```
  - Wrap `{BOTTOM_TABS.map(...)}` in `<LayoutGroup id="mobile-bottom-nav">`:
    ```tsx
    <LayoutGroup id="mobile-bottom-nav">
      {BOTTOM_TABS.map((tab) => { ... })}
    </LayoutGroup>
    ```
  - Change outer container from `<motion.button whileTap={{ scale: 0.92 }}>` to a standard `<button>` without `whileTap` scale:
    ```tsx
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
    ```
  - Enhance active pill visual styling:
    ```tsx
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
    ```
  - Wrap inner icon and label content in `<motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}>`:
    ```tsx
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
    ```
- [ ] Re-run targeted test command:
  ```bash
  npx tsx --test src/components/layout/MobileBottomNav.test.ts
  ```
- [ ] Confirm GREEN state (100% tests passing).

### Phase 3: Comprehensive Quality Verification Gates
- [ ] Run drift check to verify architectural invariants and 94/94 spec-plan pairing:
  ```bash
  npm run drift:check
  ```
- [ ] Run build check for TypeScript compilation:
  ```bash
  npm run build:check
  ```
- [ ] Run smoke test suite:
  ```bash
  npm run test:smoke
  ```
- [ ] Run complete test suite:
  ```bash
  npm test
  ```

### Phase 4: Documentation & Session Handoff
- [ ] Create execution handover file: `docs/handover-mobile-bottom-nav-sliding-pill.md`.
- [ ] Update `CHANGELOG.md` with:
  ```markdown
  - `feat(navigation)`: Fluid sliding pill animation and layout isolation for mobile bottom nav (ADR-0067)
  ```
- [ ] Update `docs/SESSION_STATE.md` with completed feature and verification evidence.
- [ ] Git commit with standard convention.



