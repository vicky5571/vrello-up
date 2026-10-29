# Plan 03: Unified Status Columns + Domain Sub-Status — Implementation Plan

**Date:** 2026-10-31  
**Status:** Proposed  
**ADR:** `03-unified-status-adr.md`  
**Spec:** `03-unified-status-spec.md`  
**Baseline:** feature parity work (uncommitted, 549 tests pass)

---

## Overview

All changes are **UI-layer only**. Zero Prisma schema changes. Zero API route
changes. Zero analytics/reporting engine changes.

Estimated phases: **6**  
Estimated files changed: **9**  
Tests expected after: **≥ 549 pass, 0 fail**

---

## Phase 1 — Update `ProjectsColumn` type and column order constants

**File:** `src/types/index.ts`

### 1.1 Replace `ProjectsColumn` union

```diff
 export type ProjectsColumn =
-  | "Upcoming"
   | "To Do"
   | "In Progress"
-  | "Ready"
+  | "In Review"
   | "Done"
   | "Blocked"
   | "Cancelled"
   | "Archived";
```

### 1.2 No other changes in `src/types/index.ts`

`ProjectsFilterState.columns: ProjectsColumn[]` and
`ViewPreferences.projectsBoardOrder` are generic — they inherit the new type
automatically. No edits needed beyond the union itself.

**Verify:** `grep -rn '"Upcoming"\|"Ready"' src/ --include="*.ts" --include="*.tsx"`  
Expected: only test fixtures and old mapping code (all updated in later phases).

---

## Phase 2 — Rewrite `src/lib/marcom/workItems.ts`

This is the single most critical file. All mapping logic lives here.

### 2.1 Update `PROJECTS_COLUMN_ORDER`

```ts
export const PROJECTS_COLUMN_ORDER: ProjectsColumn[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
  "Blocked",
  "Cancelled",
];

export const PROJECTS_COLUMN_ORDER_WITH_ARCHIVED: ProjectsColumn[] = [
  ...PROJECTS_COLUMN_ORDER,
  "Archived",
];
```

### 2.2 Rewrite `getWorkItemColumn()`

```ts
export function getWorkItemColumn(item: MarcomWorkItem): ProjectsColumn {
  switch (item._type) {
    case "content":
      switch (item.status) {
        case "DRAFT":     return "To Do";
        case "IN_REVIEW": return "In Review";
        case "REVISION":  return "In Progress";
        case "APPROVED":  return "In Review";
        case "SCHEDULED": return "In Review";
        case "PUBLISHED": return "Done";
        case "ARCHIVED":  return "Archived";
        default:          return "To Do";
      }
    case "event":
      switch (item.status) {
        case "UPCOMING":    return "To Do";
        case "ON_PROGRESS": return "In Progress";
        case "COMPLETED":   return "Done";
        case "CANCELLED":   return "Cancelled";
        default:            return "To Do";
      }
    case "placement":
      switch (item.status) {
        case "NOT_STARTED": return "To Do";
        case "ON_PROGRESS": return "In Progress";
        case "DONE":        return "Done";
        case "ISSUE":       return "Blocked";
        default:            return "To Do";
      }
  }
}
```

### 2.3 Rewrite `mapColumnToStatus()`

```ts
export function mapColumnToStatus(
  type: MarcomWorkItemType,
  column: ProjectsColumn,
): string | null {
  switch (type) {
    case "content":
      if (column === "To Do")       return "DRAFT";
      if (column === "In Progress") return "REVISION";
      if (column === "In Review")   return "IN_REVIEW";
      if (column === "Done")        return "PUBLISHED";
      if (column === "Archived")    return "ARCHIVED";
      return null;
    case "event":
      if (column === "To Do")       return "UPCOMING";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done")        return "COMPLETED";
      if (column === "Cancelled")   return "CANCELLED";
      return null;
    case "placement":
      if (column === "To Do")       return "NOT_STARTED";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done")        return "DONE";
      if (column === "Blocked")     return "ISSUE";
      return null;
  }
}
```

### 2.4 Add `getWorkItemSubStatus()` and supporting constants

Add after `mapColumnToStatus`:

```ts
import type { PostStatus, EventStatus, PlacementStatus } from "@/types";

export type WorkItemSubStatus = { label: string; color: string };

const CONTENT_SUB_STATUS: Record<PostStatus, WorkItemSubStatus> = {
  DRAFT:     { label: "Draft",             color: "#64748B" },
  IN_REVIEW: { label: "Menunggu Review",   color: "#F59E0B" },
  REVISION:  { label: "Perlu Revisi",      color: "#EF4444" },
  APPROVED:  { label: "Approved",          color: "#3B82F6" },
  SCHEDULED: { label: "Terjadwal",         color: "#8B5CF6" },
  PUBLISHED: { label: "Published",         color: "#10B981" },
  ARCHIVED:  { label: "Arsip",             color: "#94A3B8" },
};

const EVENT_SUB_STATUS: Record<EventStatus, WorkItemSubStatus> = {
  UPCOMING:    { label: "Akan Datang",        color: "#3B82F6" },
  ON_PROGRESS: { label: "Sedang Berlangsung", color: "#F59E0B" },
  COMPLETED:   { label: "Selesai",            color: "#10B981" },
  CANCELLED:   { label: "Dibatalkan",         color: "#EF4444" },
};

const PLACEMENT_SUB_STATUS: Record<PlacementStatus, WorkItemSubStatus> = {
  NOT_STARTED: { label: "Belum Dipasang",  color: "#64748B" },
  ON_PROGRESS: { label: "Sedang Dipasang", color: "#F59E0B" },
  DONE:        { label: "Terpasang",       color: "#10B981" },
  ISSUE:       { label: "Ada Kendala",     color: "#EF4444" },
};

export function getWorkItemSubStatus(item: MarcomWorkItem): WorkItemSubStatus {
  switch (item._type) {
    case "content":
      return CONTENT_SUB_STATUS[item.status] ?? { label: item.status, color: "#64748B" };
    case "event":
      return EVENT_SUB_STATUS[item.status] ?? { label: item.status, color: "#64748B" };
    case "placement":
      return PLACEMENT_SUB_STATUS[item.status] ?? { label: item.status, color: "#64748B" };
  }
}
```

Also export `WorkItemSubStatus` from the module.

---

## Phase 3 — Update `ProjectsWorkItemCard`

**File:** `src/components/views/ProjectsView/ProjectsWorkItemCard.tsx`

### 3.1 Update `VALID_COLUMNS_BY_TYPE`

```ts
const VALID_COLUMNS_BY_TYPE: Record<MarcomWorkItemType, ProjectsColumn[]> = {
  content:   ["To Do", "In Progress", "In Review", "Done", "Archived"],
  event:     ["To Do", "In Progress", "Done", "Cancelled"],
  placement: ["To Do", "In Progress", "Done", "Blocked"],
};
```

### 3.2 Import `getWorkItemSubStatus`

Add to existing imports from `@/lib/marcom/workItems`:
```ts
import {
  getWorkItemTitle,
  getWorkItemSubStatus,          // NEW
  VALID_COLUMNS_BY_TYPE,         // moved here from inline
} from "@/lib/marcom/workItems";
```

### 3.3 Add sub-status badge to card render

Inside `ProjectsWorkItemCard`, after the title line and before the
platform/type subtitle, insert the sub-status badge. Only render when
`density !== "compact"`:

```tsx
{density !== "compact" && (() => {
  const sub = getWorkItemSubStatus(item);
  return (
    <span
      style={{
        backgroundColor: `${sub.color}26`,
        borderColor: `${sub.color}4D`,
        color: sub.color,
      }}
      className="inline-flex items-center gap-1 text-[10px] font-medium
                 px-1.5 py-0.5 rounded-full border w-fit mt-0.5"
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: sub.color }}
      />
      {sub.label}
    </span>
  );
})()}
```

---

## Phase 4 — Update `ProjectsBoardView` — Archived toggle

**File:** `src/components/views/ProjectsView/ProjectsBoardView.tsx`

### 4.1 Add local state

```ts
const [showArchived, setShowArchived] = useState(false);
```

### 4.2 Pass `showArchived` to `useProjectsBoard`

```ts
const { ..., showArchived, setShowArchived } = useProjectsBoard();
```

Or manage state inside the hook and expose via return value.

### 4.3 Add toggle button in Board toolbar

In the top header row, next to the density/refresh controls:

```tsx
<button
  onClick={() => setShowArchived(!showArchived)}
  className={cn(
    "text-xs px-2 py-1 rounded-lg border transition-colors",
    showArchived
      ? "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200"
      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
  )}
  title={showArchived ? "Hide archived items" : "Show archived items"}
>
  {showArchived ? "Sembunyikan Arsip" : "Tampilkan Arsip"}
</button>
```

### 4.4 Render Archived column conditionally

In the column render loop:

```tsx
{(showArchived ? PROJECTS_COLUMN_ORDER_WITH_ARCHIVED : PROJECTS_COLUMN_ORDER).map(
  (column) => (
    <ProjectsBoardColumn
      key={column}
      column={column}
      className={column === "Archived" ? "opacity-60" : undefined}
      ...
    />
  )
)}
```

### 4.5 Update `useProjectsBoard` — `itemsByColumn` map init

The `itemsByColumn` map currently only initialises keys from
`PROJECTS_COLUMN_ORDER`. Add Archived:

```ts
for (const col of PROJECTS_COLUMN_ORDER_WITH_ARCHIVED) {
  map.set(col, []);
}
```

`getWorkItemColumn()` already returns `"Archived"` for `ARCHIVED` content —
items will flow into the map automatically.

---

## Phase 5 — Update `ProjectsListRow` — sub-status label in status cell

**File:** `src/components/views/ProjectsView/ProjectsListRow.tsx`

### 5.1 Import `getWorkItemSubStatus`

```ts
import { getWorkItemSubStatus } from "@/lib/marcom/workItems";
```

### 5.2 Replace raw status string in pill label

Find the status pill render (currently shows `item.status` or similar). Replace
with sub-status label and color:

```tsx
// Before (approximate current code):
<span className="...status badge classes...">{item.status}</span>

// After:
{(() => {
  const sub = getWorkItemSubStatus(item);
  return (
    <span
      style={{
        backgroundColor: `${sub.color}26`,
        borderColor: `${sub.color}4D`,
        color: sub.color,
      }}
      className="inline-flex items-center gap-1 text-[10px] font-medium
                 px-2 py-0.5 rounded-full border cursor-pointer"
      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
      {sub.label}
    </span>
  );
})()}
```

The status dropdown itself (the list of DB statuses for direct status change)
remains unchanged — it still offers the entity-native status values.

---

## Phase 6 — Update `projectsFilters.test.ts` fixtures

**File:** `src/lib/marcom/projectsFilters.test.ts`

### 6.1 Fix column reference in `mockItems`

The fixture event item currently has:
```ts
status: "UPCOMING", // Upcoming column
```

Update comment:
```ts
status: "UPCOMING", // To Do column
```

### 6.2 Fix column filter test

The test `"projectsFilters: column filter shows only items in selected columns"` 
uses `columns: ["In Progress"]` or `columns: ["Upcoming"]`. Update to use
`"To Do"` and `"In Progress"` aligned with the new mapping:

- Content `DRAFT` → `"To Do"`
- Event `UPCOMING` → `"To Do"`
- Content `IN_REVIEW` → `"In Review"`
- Placement `ON_PROGRESS` → `"In Progress"`

Update the `filters.columns` arrays and `expected` assertions accordingly.
All 10 tests must continue to pass.

---

## Phase 7 — Update `ProjectsFilterBar`

**File:** `src/components/layout/ProjectsFilterBar.tsx`

### 7.1 Column filter options

`PROJECTS_COLUMN_ORDER` is imported and used directly. After Phase 2 updates
`PROJECTS_COLUMN_ORDER`, the rendered column options in the filter bar update
automatically. No additional code change needed beyond the import.

Verify the `columns` filter section renders:
`To Do · In Progress · In Review · Done · Blocked · Cancelled`

---

## Verification Checklist

Run after all phases are complete:

```bash
# 1. No old column name references remain in active code
grep -rn '"Upcoming"\|"Ready"' src/ --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules" | grep -v ".test."

# 2. All tests pass
npm test

# 3. Smoke-check: getWorkItemColumn covers all 15 DB status values
grep -n "getWorkItemColumn\|DRAFT\|IN_REVIEW\|REVISION\|APPROVED\|SCHEDULED\|PUBLISHED\|ARCHIVED\|UPCOMING\|ON_PROGRESS\|COMPLETED\|CANCELLED\|NOT_STARTED\|DONE\|ISSUE" \
  src/lib/marcom/workItems.ts

# 4. Smoke-check: no analytics files changed
git diff --name-only | grep -E "analyticsEngine|reportDraftEngine|pipelineEngine|placementMachine|eventMachine|contentWorkflow"
# Expected: empty output
```

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `projectsBoardOrder` in `viewPreferences` stores old column names ("Upcoming", "Ready") as keys from a prior session | Low (dev/test only) | `useProjectsBoard` already guards with `map.get(col)?.push()` — unknown columns are silently dropped. No data corruption. |
| `ProjectsFilterState.columns` in Zustand store contains old column names from persisted state | Low | `applyProjectsFilters` calls `getWorkItemColumn()` which returns new values; stale column filter values simply match nothing rather than crashing. Add a migration guard in `createUiSlice` to reset `projectsFilters` if columns contain unknown values. |
| `CalendarPopovers.STATUS_HEX_COLORS` keyed by DB status string — unchanged | None | Calendar already uses DB status string as key. No change needed. ✅ |
| Type error: `"Upcoming"` or `"Ready"` referenced elsewhere | Low | Covered by Phase 1 — TypeScript will surface compile errors. Grep verification in Phase 6 catches any missed reference. |

---

## Phase Summary

| Phase | File(s) | Risk | Est. LOC Δ |
|---|---|---|---|
| 1 | `src/types/index.ts` | Low | −2 lines |
| 2 | `src/lib/marcom/workItems.ts` | Medium (core mapping) | +55 lines |
| 3 | `ProjectsWorkItemCard.tsx` | Low | +25 lines |
| 4 | `ProjectsBoardView.tsx` + `useProjectsBoard.ts` | Low | +30 lines |
| 5 | `ProjectsListRow.tsx` | Low | +15 lines |
| 6 | `projectsFilters.test.ts` | Low | ~10 lines changed |
| 7 | `ProjectsFilterBar.tsx` | None (auto via import) | 0 lines |

**Total:** ~133 net new lines, 9 files touched, 0 DB/API/analytics changes.
