# Implementation Plan: Mobile Sidebar Slide Transition & Backdrop Animation

- **Date:** 2026-11-06
- **Status:** IMPLEMENTED
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-sidebar-slide-transition-and-backdrop-animation-design.md
- **Refs:** ADR-0063, ADR-0058, ADR-0057

---

## 1. Overview & File Manifest

This plan executes the responsive slide-in and slide-out drawer animation for the mobile sidebar navigation in `Sidebar.tsx`, accompanied by a smooth backdrop fade-in and fade-out transition via Framer Motion's `AnimatePresence`. The desktop layout ($\ge 768\text{px}$) is strictly guarded against motion translation artifacts via responsive runtime checks.

### File Manifest:
1. `src/components/layout/MobileBottomNav.test.ts` (TDD unit tests for sidebar animation wrappers and desktop protection invariants)
2. `src/components/layout/Sidebar.tsx` (Framer Motion `AnimatePresence`, `motion.div` backdrop, `motion.aside` drawer with spring physics)
3. `docs/handover-mobile-sidebar-slide-transition-and-backdrop-animation.md` (Execution and verification handover)
4. `docs/SESSION_STATE.md` (Session state tracking)
5. `CHANGELOG.md` (Release notes)

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Development (Red Phase)
- [x] Task 1.1: In `src/components/layout/MobileBottomNav.test.ts`, add test suite `Mobile Sidebar Slide Transition & Desktop Invariants (ADR-0063)`.
- [x] Task 1.2: Assert `Sidebar.tsx` imports `motion`, `AnimatePresence`, and `useReducedMotion`.
- [x] Task 1.3: Assert `Sidebar.tsx` wraps mobile backdrop and drawer with `<AnimatePresence>`.
- [x] Task 1.4: Assert `Sidebar.tsx` uses `motion.div` for backdrop with `opacity` fade and `motion.aside` for drawer with `x: "-100%"` slide.
- [x] Task 1.5: Assert `Sidebar.tsx` guards motion props with `isMobile` to prevent desktop layout shifts.
- [x] Task 1.6: Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` to confirm failing state (Red Phase).

### Phase 2: Implementation of Mobile Animation in `Sidebar.tsx` (Green Phase)
- [x] Task 2.1: In `src/components/layout/Sidebar.tsx`, add imports for `motion`, `AnimatePresence`, `useReducedMotion`, `useState`, `useEffect`.
- [x] Task 2.2: Implement `isMobile` listener (`window.innerWidth < 768`) and hook `useReducedMotion()`.
- [x] Task 2.3: Wrap conditional elements in `<AnimatePresence>`.
- [x] Task 2.4: Convert backdrop overlay to `motion.div` with fade transition `opacity: 0 -> 1 -> 0`.
- [x] Task 2.5: Convert drawer container to `motion.aside` with slide transition `x: isMobile ? "-100%" : 0` and spring physics (`damping: 28, stiffness: 300`).
- [x] Task 2.6: Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` to confirm passing state (Green Phase).

### Phase 3: Verification Gates & Quality Assurance
- [x] Task 3.1: Run `npm run drift:check` (91/91 spec-plan pairs valid, coordinator sizes $\le 250$ LOC).
- [x] Task 3.2: Run `npm run build:check` (0 TypeScript compilation errors).
- [x] Task 3.3: Run `npm run test:smoke` (0 failures).
- [x] Task 3.4: Run full test suite `npm test` (0 failures).
- [x] Task 3.5: Create `docs/handover-mobile-sidebar-slide-transition-and-backdrop-animation.md`.
- [x] Task 3.6: Update `docs/SESSION_STATE.md` and `CHANGELOG.md`.

---

## 3. Verification Commands

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


