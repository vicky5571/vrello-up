# Decompose MousView.tsx God Component — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Break the 1,319-line `MousView.tsx` god component into focused, single-responsibility modules. Zero visual/behavioral regression — the rendered output must be pixel-identical.

**Architecture:** Strangler-fig decomposition. Extract modules one at a time from the god file. Each task produces a new file, replaces its inline counterpart with an import, and the god file shrinks. At no point does MousView stop working.

**Spec:** Identified in [confusion audit](file:///Users/mac/.gemini/antigravity/brain/1fc8ac43-8140-4e53-9b55-40afcfe9ea6f/vrello-up-confusion-audit.md), Issue #4.

## Current Anatomy (1,319 lines)

| Lines | Responsibility | Target |
|-------|---------------|--------|
| 1–99 | Imports, constants, 15+ store selectors, 9 `useState` hooks | Stay in orchestrator (trimmed) |
| 100–183 | Effects, data loading, filter handlers, branch/outlet memos | Stay in orchestrator |
| 184–434 | **250 lines: Column definitions** with inline realization math, document cells, status badges | → `mouColumns.tsx` |
| 436–520 | **84 lines: File upload + form save handlers** with direct `fetch` calls | → `mouApi.ts` |
| 522–532 | Delete handler | → `mouApi.ts` |
| 534–562 | KPI aggregation | → `mouKpi.ts` |
| 564–911 | **348 lines: Table shell + expanded row renderer** with realization breakdown, RBAC actions, renewal prefill | → `MouExpandedRow.tsx` |
| 913–1305 | **393 lines: Create/edit modal form** with searchable branch dropdown, image compression + upload, 12 fields | → `MouFormModal.tsx` |
| 1307–1316 | Document viewer modal instantiation | Already extracted: `MouDocumentViewerModal.tsx` |

**Extraction order** is from pure logic (no React, testable) → leaf UI (no store deps) → wiring. This minimizes merge conflicts and allows verification after each step.

## Global Constraints

- Zero visual/behavioral regression.
- All 543 existing tests must continue passing after each task.
- No new dependencies.
- Follow existing sibling patterns: `EventFormModal.tsx`, `mouDocumentHelpers.ts`.
- `MousView.tsx` remains the public export and orchestrator — it imports the extracted modules.
- Commit after each task.

---

### Task 1: Extract MOU API helpers to `mouApi.ts`

**Why first:** Pure async functions, no React or JSX. Easiest to extract and test in isolation.

**Files:**
- Create: `src/components/views/MousView/mouApi.ts`
- Create: `src/components/views/MousView/mouApi.test.ts`
- Modify: `src/components/views/MousView/MousView.tsx` (lines 135–161, 436–520, 522–532)

**Extract these functions:**

```ts
// src/components/views/MousView/mouApi.ts

import type { MarcomMou, MouStatus } from "@/types";
import { compressImageFile } from "@/lib/marcom/imageCompression";

export interface MouSavePayload {
  branchId: string;
  outletId?: string;
  partnerName: string;
  mouType: string;
  outletName?: string;
  startDate?: string;
  endDate?: string;
  picName?: string;
  picPhone?: string;
  docPath?: string;
  compensationValue?: number;
  notes?: string;
  workspaceId: string;
}

export async function saveMou(
  payload: MouSavePayload,
  existingId?: string
): Promise<MarcomMou> {
  const url = existingId
    ? `/api/marcom/mous/${existingId}`
    : "/api/marcom/mous";
  const method = existingId ? "PATCH" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to save MOU (${res.status})`);
  }
  const resJson = await res.json().catch(() => ({}));
  return (resJson.data ?? resJson) as MarcomMou;
}

export async function transitionMouStatus(
  mouId: string,
  nextStatus: MouStatus
): Promise<void> {
  const res = await fetch(`/api/marcom/mous/${mouId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: nextStatus }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data.error || `Failed to transition MOU to ${nextStatus}`
    );
  }
}

export async function deleteMou(mouId: string): Promise<boolean> {
  const res = await fetch(`/api/marcom/mous/${mouId}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function uploadMouDocument(
  rawFile: File,
  mouId: string
): Promise<string> {
  const file = await compressImageFile(rawFile);
  const fd = new FormData();
  fd.append("kind", "documents");
  fd.append("id", mouId);
  fd.append("file", file);
  const res = await fetch("/api/marcom/uploads", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || "Failed to upload file");
  }
  const data = await res.json();
  return data.filePath;
}
```

- [x] **Step 1: Create `mouApi.ts` with the 4 functions above**

- [x] **Step 2: Write unit tests for `mouApi.ts`**

Create `src/components/views/MousView/mouApi.test.ts` — test the payload shape construction. Since these functions call `fetch` (browser-only), test the pure pre-fetch logic:
- `MouSavePayload` interface is importable and constructable.
- Verify the module exports all 4 functions.

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  saveMou,
  transitionMouStatus,
  deleteMou,
  uploadMouDocument,
} from "@/components/views/MousView/mouApi";

test("mouApi exports all 4 functions", () => {
  assert.equal(typeof saveMou, "function");
  assert.equal(typeof transitionMouStatus, "function");
  assert.equal(typeof deleteMou, "function");
  assert.equal(typeof uploadMouDocument, "function");
});
```

- [x] **Step 3: Replace inline fetch calls in `MousView.tsx` with imports from `mouApi.ts`**

In `handleStatusTransition` (L135–161), replace the inline fetch with:
```ts
import { transitionMouStatus, saveMou, deleteMou, uploadMouDocument } from "./mouApi";

// In handleStatusTransition:
await transitionMouStatus(mou.id, nextStatus);
```

In `handleSaveMou` (L462–520), replace inline fetch with:
```ts
const savedMou = await saveMou({
  branchId: branchId!,
  outletId: modalMou.outletId || undefined,
  // ... remaining fields
  workspaceId: activeWorkspaceId,
}, isEdit ? id : undefined);
```

In `handleFileUpload` (L436–460), replace with:
```ts
const filePath = await uploadMouDocument(rawFile, modalMou.id || "new");
setModalMou((prev) => (prev ? { ...prev, docPath: filePath } : null));
```

In `deleteOne` (L522–532), replace with:
```ts
const ok = await deleteMou(id);
if (ok) { removeCachedMou(...); invalidatePlacements(...); }
return ok;
```

- [x] **Step 4: Run `npm test` — expect 544+ tests, 0 failures**

- [x] **Step 5: Commit**
```bash
git add src/components/views/MousView/mouApi.ts src/components/views/MousView/mouApi.test.ts src/components/views/MousView/MousView.tsx
git commit -m "refactor(mous): extract API helpers to mouApi.ts

Move 4 direct fetch calls (save, transition, delete, upload) out of
MousView into a dedicated mouApi.ts module. MousView now imports
and calls these functions instead of inlining fetch logic."
```

**Line reduction:** ~80 lines removed from MousView.

---

### Task 2: Extract KPI aggregation to `mouKpi.ts`

**Files:**
- Create: `src/components/views/MousView/mouKpi.ts`
- Create: `src/components/views/MousView/mouKpi.test.ts`
- Modify: `src/components/views/MousView/MousView.tsx` (lines 534–562)

- [x] **Step 1: Create `mouKpi.ts`**

```ts
// src/components/views/MousView/mouKpi.ts
import type { MarcomMou } from "@/types";
import { CheckCircle, Clock, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface KpiItem {
  label: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  color: "emerald" | "amber" | "fuchsia";
}

export function buildMouKpiItems(mous: MarcomMou[]): KpiItem[] {
  const activeCount = mous.filter((m) => m.status === "APPROVED").length;
  const pendingCount = mous.filter((m) => m.status === "SUBMITTED").length;
  const totalValue = mous.reduce(
    (acc, m) => acc + (m.compensationValue || 0),
    0
  );

  return [
    {
      label: "Active MOUs",
      value: activeCount,
      helper: "Approved agreements",
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "Pending Approval",
      value: pendingCount,
      helper: "Submitted for review",
      icon: Clock,
      color: "amber",
    },
    {
      label: "Total Compensation",
      value: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(totalValue),
      helper: "Combined agreement value",
      icon: Coins,
      color: "fuchsia",
    },
  ];
}
```

- [x] **Step 2: Write unit tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildMouKpiItems } from "@/components/views/MousView/mouKpi";

test("buildMouKpiItems counts approved and submitted MOUs", () => {
  const mous = [
    { status: "APPROVED", compensationValue: 5_000_000 },
    { status: "SUBMITTED", compensationValue: 3_000_000 },
    { status: "DRAFT", compensationValue: 1_000_000 },
    { status: "APPROVED", compensationValue: 2_000_000 },
  ];
  const items = buildMouKpiItems(mous as any);
  assert.equal(items[0].value, 2); // 2 approved
  assert.equal(items[1].value, 1); // 1 submitted
  assert.ok(String(items[2].value).includes("10")); // 10M total
});

test("buildMouKpiItems handles empty array", () => {
  const items = buildMouKpiItems([]);
  assert.equal(items[0].value, 0);
  assert.equal(items[1].value, 0);
});
```

- [x] **Step 3: Replace inline KPI in MousView.tsx with import**

Replace lines 534–562 with:
```ts
import { buildMouKpiItems } from "./mouKpi";

const kpiItems = useMemo(() => buildMouKpiItems(mous), [mous]);
```

- [x] **Step 4: Run `npm test` — expect 546+ tests, 0 failures**

- [x] **Step 5: Commit**
```bash
git commit -m "refactor(mous): extract KPI aggregation to mouKpi.ts"
```

**Line reduction:** ~30 lines removed from MousView.

---

### Task 3: Extract column definitions to `mouColumns.tsx`

**Files:**
- Create: `src/components/views/MousView/mouColumns.tsx`
- Modify: `src/components/views/MousView/MousView.tsx` (lines 184–434)

**Why this is one file:** Column definitions are a single `useMemo` block. They're JSX (`.tsx`) because cells render React elements, but they have zero state or effects — they're a pure function of `(navigateToMarcom, setMarcomFilter, setSelectedBranchId, can)`.

- [x] **Step 1: Create `mouColumns.tsx`**

Extract the entire `columnHelper.columns([...])` array into:

```tsx
// src/components/views/MousView/mouColumns.tsx
"use client";

import { Store, Building2, Layers, AlertTriangle, Eye, Download } from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import {
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { calculateMouPlacementRealization } from "@/lib/marcom/placementMouBridge";
import { parseMouDocumentSource } from "./mouDocumentHelpers";
import type { MarcomMou, MouStatus } from "@/types";

const columnHelper = createMarcomColumnHelper<MarcomMou>();

const STATUS_STYLES: Record<MouStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  SUBMITTED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

interface MouColumnDeps {
  navigateToMarcom: (view: string, search?: string) => void;
  setMarcomFilter: (view: string, query: string) => void;
  setSelectedBranchId: (id: string) => void;
  setViewingDocMou: (mou: MarcomMou) => void;
  can: (action: string, branchId?: string) => boolean;
}

export function buildMouColumns(deps: MouColumnDeps) {
  // ... paste entire columnHelper.columns([...]) block
  // Replace direct closure references with deps.navigateToMarcom, etc.
}
```

- [x] **Step 2: Replace in MousView.tsx**

```tsx
import { buildMouColumns } from "./mouColumns";

const columns = useMemo(
  () => buildMouColumns({
    navigateToMarcom,
    setMarcomFilter,
    setSelectedBranchId,
    setViewingDocMou,
    can,
  }),
  [navigateToMarcom, setMarcomFilter, setSelectedBranchId, can],
);
```

- [x] **Step 3: Remove `STATUS_STYLES`, `columnHelper`, and related icon imports from MousView.tsx**

- [x] **Step 4: Run `npm test` — expect 546+ tests, 0 failures**

- [x] **Step 5: Commit**
```bash
git commit -m "refactor(mous): extract column definitions to mouColumns.tsx

250 lines of column definitions with inline realization math,
document preview cells, and status badges moved to a dedicated
module. MousView passes deps via a typed interface."
```

**Line reduction:** ~250 lines removed from MousView.

---

### Task 4: Extract expanded row renderer to `MouExpandedRow.tsx`

**Files:**
- Create: `src/components/views/MousView/MouExpandedRow.tsx`
- Modify: `src/components/views/MousView/MousView.tsx` (lines 598–884)

**The `renderExpanded` callback** receives a `MarcomMou` and renders 286 lines of JSX: expiry banner, PIC metadata grid, realization breakdown, document actions, RBAC workflow buttons, and renewal prefill. This is a natural component boundary.

- [x] **Step 1: Create `MouExpandedRow.tsx`**

```tsx
// src/components/views/MousView/MouExpandedRow.tsx
"use client";

import type { MarcomMou, MouStatus } from "@/types";
// ... relevant imports for icons, cn, formatIDR, calculateMouPlacementRealization,
//     parseMouDocumentSource

interface MouExpandedRowProps {
  mou: MarcomMou;
  can: (action: string, branchId?: string) => boolean;
  onStatusTransition: (mou: MarcomMou, nextStatus: MouStatus) => void;
  onEdit: (mou: MarcomMou) => void;
  onRenew: (mou: MarcomMou) => void;
  onViewDoc: (mou: MarcomMou) => void;
  navigateToMarcom: (view: string, search?: string) => void;
  setSelectedBranchId: (id: string) => void;
}

export function MouExpandedRow({ mou, can, onStatusTransition, onEdit, onRenew, onViewDoc, navigateToMarcom, setSelectedBranchId }: MouExpandedRowProps) {
  // ... paste the renderExpanded callback body
  // Replace closure references with props
}
```

- [x] **Step 2: Replace `renderExpanded` in MousView.tsx**

```tsx
import { MouExpandedRow } from "./MouExpandedRow";

// Inside MarcomTableShell:
renderExpanded={(mou) => (
  <MouExpandedRow
    mou={mou}
    can={can}
    onStatusTransition={handleStatusTransition}
    onEdit={(m) => { setIsBranchDropdownOpen(false); setBranchSearch(""); setModalMou(m); }}
    onRenew={(m) => {
      setIsBranchDropdownOpen(false);
      setBranchSearch("");
      setModalMou({
        branchId: m.branchId,
        outletId: m.outletId,
        outletName: m.outletName,
        partnerName: m.partnerName,
        mouType: m.mouType,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        picName: m.picName,
        picPhone: m.picPhone,
        compensationValue: m.compensationValue,
        notes: `Perpanjangan (Renewal) dari MOU ${m.partnerName} (berakhir ${m.endDate?.slice(0, 10)})`,
        status: "DRAFT",
      });
    }}
    onViewDoc={setViewingDocMou}
    navigateToMarcom={navigateToMarcom}
    setSelectedBranchId={setSelectedBranchId}
  />
)}
```

- [x] **Step 3: Run `npm test` — expect 546+ tests, 0 failures**

- [x] **Step 4: Commit**
```bash
git commit -m "refactor(mous): extract expanded row to MouExpandedRow.tsx

286 lines of expanded row JSX (expiry banner, PIC metadata,
realization breakdown, RBAC workflow buttons, renewal prefill)
moved to a dedicated component with a typed props interface."
```

**Line reduction:** ~260 lines removed from MousView.

---

### Task 5: Extract create/edit modal to `MouFormModal.tsx`

**Files:**
- Create: `src/components/views/MousView/MouFormModal.tsx`
- Modify: `src/components/views/MousView/MousView.tsx` (lines 913–1305)

**This is the largest extraction** (393 lines). The modal owns its own local state for branch search, dropdown open, file upload progress. Following the sibling pattern `EventFormModal.tsx`.

- [x] **Step 1: Create `MouFormModal.tsx`**

```tsx
// src/components/views/MousView/MouFormModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDropdown } from "@/components/ui/useDropdown";
import type { MarcomMou, MouStatus } from "@/types";
import { cn, formatIDR } from "@/lib/utils";
import { uploadMouDocument, saveMou, type MouSavePayload } from "./mouApi";
import { parseMouDocumentSource } from "./mouDocumentHelpers";
import { MouDocumentViewerModal } from "./MouDocumentViewerModal";
// ... icons

interface BranchOption { id: string; name: string; code: string; }
interface OutletOption { id: string; name: string; code: string; branchId: string; }

interface MouFormModalProps {
  mou: Partial<MarcomMou>;
  branches: BranchOption[];
  outlets: OutletOption[];
  activeWorkspaceId: string;
  onSaved: (mou: MarcomMou, isEdit: boolean) => void;
  onClose: () => void;
}

const MOU_TYPES = ["Compensation", "Exclusive Branding", "Event Sponsorship", "Space Rental", "Joint Promotion"] as const;

export function MouFormModal({
  mou: initialMou,
  branches,
  outlets,
  activeWorkspaceId,
  onSaved,
  onClose,
}: MouFormModalProps) {
  // Own local state: modalMou, isSaving, isUploading, branchSearch, isBranchDropdownOpen
  // Own handlers: handleFileUpload, handleSaveMou
  // All the JSX from lines 913–1305
}
```

The key insight: the modal owns `branchSearch`, `isBranchDropdownOpen`, `isSaving`, `isUploading` state internally. MousView only needs to pass in `initialMou` and receive `onSaved` / `onClose` callbacks.

- [x] **Step 2: Replace modal section in MousView.tsx**

```tsx
import { MouFormModal } from "./MouFormModal";

// Replace lines 913–1305 with:
{modalMou && (
  <MouFormModal
    mou={modalMou}
    branches={branches}
    outlets={outletsList}
    activeWorkspaceId={activeWorkspaceId}
    onSaved={(savedMou, isEdit) => {
      if (isEdit) {
        updateCachedMou(activeWorkspaceId, savedMou);
      } else {
        addCachedMou(activeWorkspaceId, savedMou);
      }
      invalidatePlacements(activeWorkspaceId);
      setModalMou(null);
      fetchMous(activeWorkspaceId, true);
    }}
    onClose={() => setModalMou(null)}
  />
)}
```

- [x] **Step 3: Remove modal-only state from MousView.tsx**

Remove from MousView: `branchSearch`, `setBranchSearch`, `isBranchDropdownOpen`, `setIsBranchDropdownOpen`, `isSaving`, `setIsSaving`, `isUploading`, `setIsUploading`, `branchTriggerRef`, `branchDropdownRef`, `branchSearchInputRef`, `handleFileUpload`, `handleSaveMou`, the dropdown focus `useEffect` (L100–106), `selectedBranch` memo (L174–176), `availableOutlets` memo (L178–182), and `MOU_TYPES` constant (L95).

- [x] **Step 4: Run `npm test` — expect 546+ tests, 0 failures**

- [x] **Step 5: Run `npx tsc --noEmit` — expect 0 errors**

- [x] **Step 6: Commit**
```bash
git commit -m "refactor(mous): extract create/edit modal to MouFormModal.tsx

393 lines of modal form JSX with searchable branch dropdown, image
compression, file upload, 12 form fields, and date validation moved
to a self-contained MouFormModal component. MousView passes initial
data via props and receives callbacks."
```

**Line reduction:** ~390 lines removed from MousView.

---

### Task 6: Final cleanup and verification

**Files:**
- Modify: `src/components/views/MousView/MousView.tsx` — clean dead imports

- [x] **Step 1: Remove all unused imports from MousView.tsx**

After Tasks 1–5, icons like `Upload`, `RefreshCw`, `Search`, `ChevronDown`, `Check`, `X`, `Layers`, `AlertTriangle`, `ShieldAlert`, `Eye` should no longer be needed in MousView. Clean `compressImageFile` import, `parseMouDocumentSource` import, `calculateMouPlacementRealization` import.

- [x] **Step 2: Verify final line count**

```bash
wc -l src/components/views/MousView/MousView.tsx
# Expected: ~300–350 lines (orchestrator only)
```

- [x] **Step 3: Run full test suite**

```bash
npm test
# Expected: 546+ tests, 0 failures
```

- [x] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
# Expected: 0 errors
```

- [x] **Step 5: Verify file inventory**

```bash
ls -la src/components/views/MousView/
# Expected files:
# MousView.tsx          (~300 lines, orchestrator)
# MouFormModal.tsx      (~400 lines, modal form)
# MouExpandedRow.tsx    (~290 lines, expanded row)
# mouColumns.tsx        (~260 lines, column definitions)
# mouApi.ts             (~80 lines, API helpers)
# mouApi.test.ts        (~15 lines, API tests)
# mouKpi.ts             (~40 lines, KPI builder)
# mouKpi.test.ts        (~20 lines, KPI tests)
# MouDocumentViewerModal.tsx  (existing, unchanged)
# mouDocumentHelpers.ts       (existing, unchanged)
# mouDocumentHelpers.test.ts  (existing, unchanged)
```

- [x] **Step 6: Commit**
```bash
git commit -m "refactor(mous): final cleanup — remove dead imports from MousView

MousView.tsx reduced from 1,319 to ~320 lines. All business logic,
column definitions, expanded row UI, and modal form extracted to
focused modules."
```

---

## Summary: Before → After

```
BEFORE (1 file, 1,319 lines):
  MousView.tsx ← everything

AFTER (7 source files, same total lines):
  MousView.tsx          ~320 lines  ← orchestrator: state, effects, wiring
  MouFormModal.tsx      ~400 lines  ← create/edit modal form
  MouExpandedRow.tsx    ~290 lines  ← expanded row details
  mouColumns.tsx        ~260 lines  ← column definitions
  mouApi.ts              ~80 lines  ← API fetch helpers
  mouKpi.ts              ~40 lines  ← KPI aggregation
  mouApi.test.ts + mouKpi.test.ts   ← new tests
```

**Each extracted module is:**
- Single-responsibility
- Independently readable
- Has a typed interface (props or function signature)
- Can be tested or modified without touching MousView.tsx
