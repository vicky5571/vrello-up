# MOU Table Phase 2: Information Architecture & Validity Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate a dedicated "Validity & Countdown" column to give immediate visual awareness of contract durations and impending expirations, and streamline the "Realisasi Fisik" cell.

**Architecture:** Build a pure helper `mouDateHelpers.ts` with comprehensive unit tests for date math, relative countdowns, and urgency tiers (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`). Introduce the `validity` column in `mouColumns.tsx` sortable by `endDate`. Refactor the "Realisasi Fisik" cell into a clean 2-line component to prevent vertical table bloat.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, TanStack Table v9, Tailwind CSS v4, Lucide React, Node test runner (`node:test`).

**Spec:** [`docs/audit-mous-table-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-mous-table-ui-ux.md)

## Global Constraints

- Single Source of Truth: Core domain entities (`MarcomMou`, `MouStatus`) MUST be imported from `@/types`.
- Date Discipline: Safe UTC/ISO date parsing without timezone off-by-one errors.
- Strangler Pattern: Extract date calculation and countdown formatting into pure helper `mouDateHelpers.ts`.
- Testing: Pure test coverage required with 0 test failures (`npm test -- src/components/views/MousView/mouDateHelpers.test.ts`).

---

## File Structure

```text
src/components/views/MousView/
├── mouDateHelpers.ts          # Pure helpers for contract validity, days remaining, and urgency badges
├── mouDateHelpers.test.ts     # Unit tests for countdown math, thresholds (30d), and formatting
└── mouColumns.tsx             # Modified: Add "validity" column & streamline "placements" column
```

---

### Task 1: Contract Validity & Countdown Calculation Helper

**Files:**
- Create: `src/components/views/MousView/mouDateHelpers.ts`
- Test: `src/components/views/MousView/mouDateHelpers.test.ts`

**Interfaces:**
- Produces:
  - `type MouValidityStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "FUTURE" | "NO_DATE"`
  - `calculateMouValidity(startDate?: string | null, endDate?: string | null, referenceNowMs?: number): MouValidityInfo`
  - `formatMouDateRange(startDate?: string | null, endDate?: string | null): string`

- [ ] **Step 1: Write the failing unit tests**

```typescript
// src/components/views/MousView/mouDateHelpers.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { calculateMouValidity, formatMouDateRange } from "./mouDateHelpers.ts";

test("calculateMouValidity flags expired contract accurately", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const res = calculateMouValidity("2025-01-01", "2026-09-15", refTime);

  assert.equal(res.status, "EXPIRED");
  assert.equal(res.isExpired, true);
  assert.match(res.badgeText, /Expired 15 days ago/);
  assert.equal(res.variant, "rose");
});

test("calculateMouValidity flags contract expiring within 30 days as EXPIRING_SOON", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const res = calculateMouValidity("2026-01-01", "2026-10-15", refTime);

  assert.equal(res.status, "EXPIRING_SOON");
  assert.equal(res.isExpiringSoon, true);
  assert.match(res.badgeText, /Expires in 15 days/);
  assert.equal(res.variant, "amber");
});

test("calculateMouValidity flags contract with >30 days remaining as ACTIVE", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const res = calculateMouValidity("2026-01-01", "2026-12-31", refTime);

  assert.equal(res.status, "ACTIVE");
  assert.equal(res.isExpired, false);
  assert.match(res.badgeText, /92 days left/);
  assert.equal(res.variant, "emerald");
});

test("formatMouDateRange formats start and end dates cleanly", () => {
  assert.equal(formatMouDateRange("2026-01-01", "2026-12-31"), "01 Jan 2026 – 31 Dec 2026");
  assert.equal(formatMouDateRange(null, "2026-12-31"), "Until 31 Dec 2026");
  assert.equal(formatMouDateRange(null, null), "No period set");
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/components/views/MousView/mouDateHelpers.test.ts
```

- [ ] **Step 3: Implement `mouDateHelpers.ts`**

```typescript
// src/components/views/MousView/mouDateHelpers.ts
export type MouValidityStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "FUTURE" | "NO_DATE";

export interface MouValidityInfo {
  status: MouValidityStatus;
  daysRemaining: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  badgeText: string;
  variant: "emerald" | "amber" | "rose" | "blue" | "slate";
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateMouValidity(
  startDate?: string | null,
  endDate?: string | null,
  referenceNowMs: number = Date.now()
): MouValidityInfo {
  if (!endDate) {
    return {
      status: "NO_DATE",
      daysRemaining: null,
      isExpired: false,
      isExpiringSoon: false,
      badgeText: "No expiry",
      variant: "slate",
    };
  }

  const endMs = new Date(endDate).getTime();
  if (Number.isNaN(endMs)) {
    return {
      status: "NO_DATE",
      daysRemaining: null,
      isExpired: false,
      isExpiringSoon: false,
      badgeText: "Invalid date",
      variant: "slate",
    };
  }

  if (startDate) {
    const startMs = new Date(startDate).getTime();
    if (!Number.isNaN(startMs) && startMs > referenceNowMs) {
      const daysUntilStart = Math.ceil((startMs - referenceNowMs) / MS_PER_DAY);
      return {
        status: "FUTURE",
        daysRemaining: Math.ceil((endMs - referenceNowMs) / MS_PER_DAY),
        isExpired: false,
        isExpiringSoon: false,
        badgeText: `Starts in ${daysUntilStart}d`,
        variant: "blue",
      };
    }
  }

  const diffDays = Math.ceil((endMs - referenceNowMs) / MS_PER_DAY);

  if (diffDays < 0) {
    const pastDays = Math.abs(diffDays);
    return {
      status: "EXPIRED",
      daysRemaining: diffDays,
      isExpired: true,
      isExpiringSoon: false,
      badgeText: pastDays === 1 ? "Expired yesterday" : `Expired ${pastDays} days ago`,
      variant: "rose",
    };
  }

  if (diffDays <= 30) {
    return {
      status: "EXPIRING_SOON",
      daysRemaining: diffDays,
      isExpired: false,
      isExpiringSoon: true,
      badgeText: diffDays === 0 ? "Expires today" : `Expires in ${diffDays} days`,
      variant: "amber",
    };
  }

  return {
    status: "ACTIVE",
    daysRemaining: diffDays,
    isExpired: false,
    isExpiringSoon: false,
    badgeText: `${diffDays} days left`,
    variant: "emerald",
  };
}

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr.slice(0, 10);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return isoStr.slice(0, 10);
  }
}

export function formatMouDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return "No period set";
  if (!startDate && endDate) return `Until ${formatDate(endDate)}`;
  if (startDate && !endDate) return `From ${formatDate(startDate)}`;
  return `${formatDate(startDate!)} – ${formatDate(endDate!)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/components/views/MousView/mouDateHelpers.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/views/MousView/mouDateHelpers.ts src/components/views/MousView/mouDateHelpers.test.ts
git commit -m "feat(mou): add mouDateHelpers for validity and countdown calculation"
```

---

### Task 2: Add "Validity & Countdown" Column & Streamline Realisasi in `mouColumns.tsx`

**Files:**
- Modify: `src/components/views/MousView/mouColumns.tsx`

**Interfaces:**
- Consumes: `calculateMouValidity`, `formatMouDateRange` from `./mouDateHelpers`

- [ ] **Step 1: Insert "Validity & Countdown" column after Status**

In `mouColumns.tsx`:
```tsx
    columnHelper.accessor("endDate", {
      id: "validity",
      header: "Period & Validity",
      size: 190,
      minSize: 150,
      sortingFn: (rowA, rowB) => {
        const timeA = rowA.original.endDate ? new Date(rowA.original.endDate).getTime() : 0;
        const timeB = rowB.original.endDate ? new Date(rowB.original.endDate).getTime() : 0;
        return timeA - timeB;
      },
      cell: ({ row }) => {
        const validity = calculateMouValidity(row.original.startDate, row.original.endDate);
        const periodStr = formatMouDateRange(row.original.startDate, row.original.endDate);

        const variantStyles = {
          emerald: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
          amber: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
          rose: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
          blue: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
          slate: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        }[validity.variant];

        return (
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={periodStr}>
              {periodStr}
            </span>
            <div>
              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-2xs", variantStyles)}>
                {validity.variant === "amber" || validity.variant === "rose" ? (
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                ) : (
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                )}
                <span>{validity.badgeText}</span>
              </span>
            </div>
          </div>
        );
      },
    }),
```

- [ ] **Step 2: Streamline "Realisasi Fisik" Column**

Refactor the `placements` column to render a high-scannability 2-line summary (points + rate badge + mini progress bar) and eliminate the double currency strings from the cell (deferring full financial detail to drawer/expanded row).

- [ ] **Step 3: Run typecheck and test suite**

Run:
```bash
npm run typecheck
npm test -- src/components/views/MousView/
```

- [ ] **Step 4: Commit**

```bash
git add src/components/views/MousView/mouColumns.tsx
git commit -m "feat(mou): add Validity & Countdown column and streamline Realisasi Fisik cell"
```
