# Implementation Plan: Mobile Notification Center Popover Viewport-Bounded Layout

- **Date:** 2026-11-06
- **Status:** COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-notification-center-popover-viewport-bounded-design.md
- **Refs:** ADR-0064

---

## 1. Overview & File Manifest

This plan implements viewport-bounded positioning for the `NotificationCenter` popover on mobile smartphones (< 640px) to prevent horizontal left-edge cropping, while strictly maintaining 100% desktop placement and ergonomics.

### File Manifest:
1. `src/components/layout/NotificationCenter.tsx` (Viewport-bounded styling and mobile backdrop)
2. `src/lib/productivity/useNotificationFeed.test.ts` (Unit test verification)
3. `docs/SESSION_STATE.md` (State tracking)

---

## 2. Phased Execution Tasks

### Phase 1: Implementation
- [x] Task 1.1: In `src/components/layout/NotificationCenter.tsx`, add mobile backdrop `<div className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden" onClick={() => setIsOpen(false)} />`.
- [x] Task 1.2: In `src/components/layout/NotificationCenter.tsx`, update popover wrapper to `fixed inset-x-3 top-13 z-50 max-h-[82vh] flex flex-col sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86`.
- [x] Task 1.3: Run verification tests.

### Phase 2: Quality Gates
- [x] Task 2.1: Run `npm run drift:check`.
- [x] Task 2.2: Run `npm run build:check`.
- [x] Task 2.3: Run `npm run test:smoke`.
