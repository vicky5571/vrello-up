# MOU Table Phase 3: Multi-Dimensional Filtering & Enhanced KPIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the KPI summary cards into an executive 4-metric dashboard with mobile horizontal strip support, and expand table filtering with Branch, MOU Type, and Expiry urgency filters.

**Architecture:** Extend `mouKpi.ts` to calculate 4 executive metrics including an "Expiring / Expired" alert card. Pass `mobileStrip` to `<KpiSummaryCards>` to prevent mobile vertical layout encroachment. Introduce multi-dimensional state filters in `MousView.tsx` (`selectedBranch`, `selectedType`, `urgencyFilter`) with clean reset capabilities.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Node test runner (`node:test`).

**Spec:** [`docs/audit-mous-table-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-mous-table-ui-ux.md)

## Global Constraints

- Single Source of Truth: Core domain entities (`MarcomMou`, `MouStatus`) MUST be imported from `@/types`.
- Non-Destructive Filtering: Filtering must occur in-memory on client store data without redundant network roundtrips.
- Testing: All KPI threshold logic and filter predicates must be covered by unit tests (`npm test -- src/components/views/MousView/mouKpi.test.ts`).

---

## File Structure

```text
src/components/views/MousView/
├── mouKpi.ts              # Extended: 4 KPI items (Total, Active, Expiring/Expired, Plafon)
├── mouKpi.test.ts         # Unit tests for 4-card aggregation and urgency counter
└── MousView.tsx           # Modified: Branch dropdown, MOU Type dropdown, mobileStrip, reset action
```

---

### Task 1: 4-Card Executive KPI Dashboard Helper

**Files:**
- Modify: `src/components/views/MousView/mouKpi.ts`
- Modify: `src/components/views/MousView/mouKpi.test.ts`

**Interfaces:**
- Produces:
  - `buildMouKpiItems(mous: MarcomMou[], referenceNowMs?: number): KpiCardItem[]`

- [ ] **Step 1: Write failing unit test for 4-card KPI items**

```typescript
// src/components/views/MousView/mouKpi.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildMouKpiItems } from "./mouKpi.ts";
import type { MarcomMou } from "@/types";

test("buildMouKpiItems calculates 4 executive cards including urgency alert", () => {
  const refTime = new Date("2026-09-30T00:00:00Z").getTime();
  const mockMous: Partial<MarcomMou>[] = [
    { id: "1", status: "APPROVED", compensationValue: 10_000_000, endDate: "2026-12-31" },
    { id: "2", status: "APPROVED", compensationValue: 5_000_000, endDate: "2026-10-10" }, // Expiring soon (10 days)
    { id: "3", status: "SUBMITTED", compensationValue: 20_000_000, endDate: "2026-09-15" }, // Expired
    { id: "4", status: "DRAFT", compensationValue: 0 },
  ];

  const cards = buildMouKpiItems(mockMous as MarcomMou[], refTime);
  assert.equal(cards.length, 4);

  assert.equal(cards[0].label, "Total MOUs");
  assert.equal(cards[0].value, 4);

  assert.equal(cards[1].label, "Active Partnerships");
  assert.equal(cards[1].value, 2);

  assert.equal(cards[2].label, "Expiring & Expired");
  assert.equal(cards[2].value, 2); // 1 expiring soon + 1 expired
  assert.equal(cards[2].color, "amber");

  assert.equal(cards[3].label, "Total Plafon Commitment");
  assert.match(String(cards[3].value), /Rp/);
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/components/views/MousView/mouKpi.test.ts
```

- [ ] **Step 3: Implement 4-card aggregation in `mouKpi.ts`**

```typescript
// src/components/views/MousView/mouKpi.ts
import type { MarcomMou } from "@/types";
import { FileText, CheckCircle, AlertTriangle, Coins } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { calculateMouValidity } from "./mouDateHelpers";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

export type { KpiCardItem };

export function buildMouKpiItems(
  mous: MarcomMou[],
  referenceNowMs: number = Date.now()
): KpiCardItem[] {
  const totalMous = mous.length;
  const activeCount = mous.filter((m) => m.status === "APPROVED").length;
  
  const urgentCount = mous.filter((m) => {
    if (m.status === "DONE" || m.status === "REJECTED") return false;
    const validity = calculateMouValidity(m.startDate, m.endDate, referenceNowMs);
    return validity.isExpired || validity.isExpiringSoon;
  }).length;

  const totalValue = mous.reduce(
    (acc, m) => acc + (m.compensationValue || 0),
    0
  );

  return [
    {
      label: "Total MOUs",
      value: totalMous,
      helper: "Registered agreements",
      icon: FileText,
      color: "blue",
    },
    {
      label: "Active Partnerships",
      value: activeCount,
      helper: "Approved & active",
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "Expiring & Expired",
      value: urgentCount,
      helper: "Urgent renewals needed",
      icon: AlertTriangle,
      color: urgentCount > 0 ? "amber" : "slate",
    },
    {
      label: "Total Plafon Commitment",
      value: formatIDR(totalValue),
      helper: "Across all partnerships",
      icon: Coins,
      color: "violet",
    },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/components/views/MousView/mouKpi.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/views/MousView/mouKpi.ts src/components/views/MousView/mouKpi.test.ts
git commit -m "feat(mou): upgrade mouKpi with 4-card executive metrics and urgency detection"
```

---

### Task 2: Multi-Dimensional Filter Bar & Mobile Strip in `MousView.tsx`

**Files:**
- Modify: `src/components/views/MousView/MousView.tsx`

**Interfaces:**
- Consumes: `buildMouKpiItems`, `branches`, `MOU_TYPES`
- Produces: Integrated filters (`selectedBranch`, `selectedType`, `urgencyFilter`) and `mobileStrip` on KPI cards.

- [ ] **Step 1: Add filter state variables and memoized predicates**

In `MousView.tsx`:
```tsx
  const [selectedBranchId, setSelectedFilterBranchId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<"ALL" | "EXPIRING" | "EXPIRED">("ALL");

  const filteredMous = useMemo(() => {
    return mous.filter((m) => {
      if (selectedStatus !== "ALL" && m.status !== selectedStatus) return false;
      if (selectedBranchId !== "ALL" && m.branchId !== selectedBranchId) return false;
      if (selectedType !== "ALL" && m.mouType !== selectedType) return false;
      if (urgencyFilter !== "ALL") {
        const validity = calculateMouValidity(m.startDate, m.endDate);
        if (urgencyFilter === "EXPIRING" && !validity.isExpiringSoon) return false;
        if (urgencyFilter === "EXPIRED" && !validity.isExpired) return false;
      }
      return true;
    });
  }, [mous, selectedStatus, selectedBranchId, selectedType, urgencyFilter]);
```

- [ ] **Step 2: Update `kpiBar` prop to include `mobileStrip`**

```tsx
  kpiBar={<KpiSummaryCards items={kpiItems} mobileStrip />}
```

- [ ] **Step 3: Expand `filterBar` with Branch & Type dropdowns + Urgency toggles**

Render:
1. Status chips (`All`, `Draft`, `Submitted`, `Approved`, `Done`, `Rejected`)
2. Branch dropdown selector (`All Branches` + branch options)
3. MOU Type dropdown selector (`All Types` + `MOU_TYPES`)
4. Quick urgency toggle pills (`⚠️ Expiring Soon`, `🔴 Expired`)
5. Reset button when any filter is active (`Reset Filters`)

- [ ] **Step 4: Run typecheck and tests**

Run:
```bash
npm run typecheck
npm test -- src/components/views/MousView/
```

- [ ] **Step 5: Commit**

```bash
git add src/components/views/MousView/MousView.tsx
git commit -m "feat(mou): add multi-dimensional filters, urgency toggles, and mobileStrip KPI bar"
```
