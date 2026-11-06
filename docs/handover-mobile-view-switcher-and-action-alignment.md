# Handover: Mobile View Switcher Full-Width & Action Row Right Alignment

- **Date:** 2026-11-06
- **Status:** IMPLEMENTATION COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-view-switcher-and-action-alignment-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-view-switcher-and-action-alignment.md
- **Refs:** ADR-0061, ADR-0060, ADR-0059

---

## 1. Overview & Objective

This handover document provides execution-ready instructions to right-align the action button rows and stretch the view mode switchers to 100% full width with symmetrically divided tabs on mobile viewports (< 640px) across `PlacementsHeader.tsx`, `PlacementFilterControls.tsx`, `OutletsHeader.tsx`, and `EventsHeader.tsx`, while **strictly maintaining 100% of the desktop layout unchanged**.

---

## 2. File Manifest

1. `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` — Unit test suite verifying right-aligned action row and full-width segmented switcher.
2. `src/components/views/PlacementsView/PlacementsHeader.tsx` — Placements view header component.
3. `src/components/views/PlacementsView/PlacementFilterControls.tsx` — Segmented view mode switcher component.
4. `src/components/views/OutletsView/OutletsHeader.tsx` — Outlets view header component.
5. `src/components/views/EventsView/EventsHeader.tsx` — Events view header component.

---

## 3. Explicit "Do Not Touch" List

- **Desktop Classes (`sm:` and `md:`)**: DO NOT modify or remove `sm:justify-start`, `sm:w-auto`, or `sm:flex-initial`. Desktop appearance must remain 100% byte-for-byte unaffected.
- **View Mode Machine & State Handlers**: DO NOT modify `onViewModeChange`, `onRefresh`, `onExport`, or `onAdd...`.
- **SSOT Domain Entities**: DO NOT alter types in `src/types/index.ts`.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Create Unit Test `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts`

**Path:** `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts`

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Action Row Alignment & View Switcher (ADR-0061)", () => {
  const placementsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementsHeader.tsx"
  );
  const switcherPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementFilterControls.tsx"
  );
  const outletsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsHeader.tsx"
  );

  it("verifies PlacementsHeader action row uses right alignment on mobile: justify-end sm:justify-start w-full sm:w-auto", () => {
    const content = fs.readFileSync(placementsHeaderPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start") && content.includes("w-full sm:w-auto"),
      "PlacementsHeader action row must be right-aligned on mobile"
    );
  });

  it("verifies PlacementViewSwitcher uses full width w-full on mobile with flex-1 tabs", () => {
    const content = fs.readFileSync(switcherPath, "utf-8");
    assert.ok(
      content.includes("w-full sm:w-auto"),
      "PlacementViewSwitcher must use w-full sm:w-auto"
    );
    assert.ok(
      content.includes("flex-1 sm:flex-initial") && content.includes("justify-center"),
      "PlacementViewSwitcher tab buttons must use flex-1 sm:flex-initial justify-center"
    );
  });

  it("verifies OutletsHeader action row uses right alignment on mobile", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start") && content.includes("w-full sm:w-auto"),
      "OutletsHeader action row must be right-aligned on mobile"
    );
  });
});
```

---

### Step 2: Update `src/components/views/PlacementsView/PlacementsHeader.tsx`

**Lines 48–50:**
```tsx
// BEFORE:
        <div className="flex items-center gap-1.5 sm:gap-2">

// AFTER:
        <div className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
```

---

### Step 3: Update `src/components/views/PlacementsView/PlacementFilterControls.tsx`

**In `PlacementViewSwitcher` (approx. line 124 & 138):**
```tsx
// BEFORE:
    <div
      role="tablist"
      aria-label="Placements View Switcher"
      className="relative flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0"
    >
      {VIEW_SWITCHER_OPTIONS.map((opt) => {
        ...
          <motion.button
            ...
            className={cn(
              "relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer",
              isActive ...

// AFTER:
    <div
      role="tablist"
      aria-label="Placements View Switcher"
      className="relative w-full sm:w-auto flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0"
    >
      {VIEW_SWITCHER_OPTIONS.map((opt) => {
        ...
          <motion.button
            ...
            className={cn(
              "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer",
              isActive ...
```

---

### Step 4: Update `src/components/views/OutletsView/OutletsHeader.tsx`

**A. Action row (approx line 90):**
```tsx
// BEFORE:
        <div className="flex items-center gap-1.5 sm:gap-2">

// AFTER:
        <div className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
```

**B. View switcher container & tab buttons (approx line 120 & 128):**
```tsx
// BEFORE:
        <div
          role="tablist"
          aria-label="View Mode Switcher"
          className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 self-start"
        >
          <motion.button
            ...
            className={cn(
              "relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",

// AFTER:
        <div
          role="tablist"
          aria-label="View Mode Switcher"
          className="w-full sm:w-auto flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
        >
          <motion.button
            ...
            className={cn(
              "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
```

---

### Step 5: Update `src/components/views/EventsView/EventsHeader.tsx`

**A. Action row (approx line 61):**
```tsx
// BEFORE:
        <div className="flex items-center gap-1.5 sm:gap-2">

// AFTER:
        <div className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
```

**B. View switcher container & tab buttons (approx lines 92 & 100):**
```tsx
// BEFORE:
        <div
          role="tablist"
          aria-label="Field event view modes"
          className="relative flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800 select-none"
        >
          {VIEW_OPTIONS.map((opt) => {
            ...
              <motion.button
                ...
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",

// AFTER:
        <div
          role="tablist"
          aria-label="Field event view modes"
          className="relative w-full sm:w-auto flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800 select-none"
        >
          {VIEW_OPTIONS.map((opt) => {
            ...
              <motion.button
                ...
                className={cn(
                  "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Tests (Ensure Green Phase)
npx tsx --test src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts
npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 88/88)
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

- [x] On mobile screens (< 640px), action button rows in `PlacementsHeader.tsx`, `OutletsHeader.tsx`, and `EventsHeader.tsx` right-align with `justify-end sm:justify-start w-full sm:w-auto`.
- [x] On mobile screens (< 640px), view mode switchers in `PlacementFilterControls.tsx`, `OutletsHeader.tsx`, and `EventsHeader.tsx` stretch across 100% full width with `w-full sm:w-auto`.
- [x] In all view mode switchers on mobile, tabs distribute width symmetrically with `flex-1 sm:flex-initial justify-center`.
- [x] On desktop screens ($\ge 640\text{px}$), all headers revert strictly to `sm:justify-start`, `sm:w-auto`, and `sm:flex-initial` (100% byte-for-byte fidelity with current desktop appearance).
- [x] Coordinator line limits remain strictly $\le 250$ LOC.
- [x] `npm run drift:check` passes with 89/89 pairs and 0 drift.
- [x] `npm run build:check` exits with code 0.
- [x] `npm run test:smoke` passes with 0 failures.



