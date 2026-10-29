# Spec 03: Unified Status Columns + Domain Sub-Status

**Date:** 2026-10-31  
**Status:** Proposed  
**ADR:** `03-unified-status-adr.md`

---

## 1. Unified Column Definition

### 1.1 `ProjectsColumn` Type

Replace the current 8-value union with a 6-column visible set plus `Archived`
retained as an optional overflow:

```ts
// src/types/index.ts
export type ProjectsColumn =
  | "To Do"
  | "In Progress"
  | "In Review"
  | "Done"
  | "Blocked"
  | "Cancelled"
  | "Archived"; // retained for filter/hidden-shelf; not shown by default on Board
```

Removed values: `"Upcoming"`, `"Ready"`.

### 1.2 `PROJECTS_COLUMN_ORDER`

```ts
// src/lib/marcom/workItems.ts
export const PROJECTS_COLUMN_ORDER: ProjectsColumn[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
  "Blocked",
  "Cancelled",
];

// Archived is intentionally excluded from default order.
// It is accessible via the "Show Archived" toggle on the Board toolbar.
export const PROJECTS_COLUMN_ORDER_WITH_ARCHIVED: ProjectsColumn[] = [
  ...PROJECTS_COLUMN_ORDER,
  "Archived",
];
```

---

## 2. Status Mapping Functions

### 2.1 `getWorkItemColumn(item)` — DB status → unified column

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
      }
    case "event":
      switch (item.status) {
        case "UPCOMING":    return "To Do";
        case "ON_PROGRESS": return "In Progress";
        case "COMPLETED":   return "Done";
        case "CANCELLED":   return "Cancelled";
      }
    case "placement":
      switch (item.status) {
        case "NOT_STARTED": return "To Do";
        case "ON_PROGRESS": return "In Progress";
        case "DONE":        return "Done";
        case "ISSUE":       return "Blocked";
      }
  }
}
```

### 2.2 `mapColumnToStatus(type, column)` — unified column → DB status (for drag/move)

One DB status per (type, column) pair. When a column accepts multiple DB
statuses (Content `In Review` = `IN_REVIEW | APPROVED | SCHEDULED`), drag
always resolves to the **entry-point** status for that workflow stage:

```ts
export function mapColumnToStatus(
  type: MarcomWorkItemType,
  column: ProjectsColumn,
): string | null {
  switch (type) {
    case "content":
      if (column === "To Do")       return "DRAFT";
      if (column === "In Progress") return "REVISION";   // active rework
      if (column === "In Review")   return "IN_REVIEW";  // submission entry point
      if (column === "Done")        return "PUBLISHED";
      if (column === "Archived")    return "ARCHIVED";
      return null; // Blocked / Cancelled not valid for content

    case "event":
      if (column === "To Do")       return "UPCOMING";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done")        return "COMPLETED";
      if (column === "Cancelled")   return "CANCELLED";
      return null; // Blocked / In Review / Archived not valid for events

    case "placement":
      if (column === "To Do")       return "NOT_STARTED";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done")        return "DONE";
      if (column === "Blocked")     return "ISSUE";
      return null; // In Review / Cancelled / Archived not valid for placements
  }
}
```

### 2.3 `getWorkItemSubStatus(item)` — NEW function

Returns the human-readable domain sub-status label displayed on each card.

```ts
export type WorkItemSubStatus = {
  label: string;   // display text
  color: string;   // hex color for badge
};

export function getWorkItemSubStatus(item: MarcomWorkItem): WorkItemSubStatus {
  switch (item._type) {
    case "content":
      return CONTENT_SUB_STATUS[item.status];
    case "event":
      return EVENT_SUB_STATUS[item.status];
    case "placement":
      return PLACEMENT_SUB_STATUS[item.status];
  }
}

const CONTENT_SUB_STATUS: Record<PostStatus, WorkItemSubStatus> = {
  DRAFT:     { label: "Draft",            color: "#64748B" },
  IN_REVIEW: { label: "Menunggu Review",  color: "#F59E0B" },
  REVISION:  { label: "Perlu Revisi",     color: "#EF4444" },
  APPROVED:  { label: "Approved",         color: "#3B82F6" },
  SCHEDULED: { label: "Terjadwal",        color: "#8B5CF6" },
  PUBLISHED: { label: "Published",        color: "#10B981" },
  ARCHIVED:  { label: "Arsip",            color: "#94A3B8" },
};

const EVENT_SUB_STATUS: Record<EventStatus, WorkItemSubStatus> = {
  UPCOMING:    { label: "Akan Datang",       color: "#3B82F6" },
  ON_PROGRESS: { label: "Sedang Berlangsung", color: "#F59E0B" },
  COMPLETED:   { label: "Selesai",            color: "#10B981" },
  CANCELLED:   { label: "Dibatalkan",         color: "#EF4444" },
};

const PLACEMENT_SUB_STATUS: Record<PlacementStatus, WorkItemSubStatus> = {
  NOT_STARTED: { label: "Belum Dipasang",    color: "#64748B" },
  ON_PROGRESS: { label: "Sedang Dipasang",   color: "#F59E0B" },
  DONE:        { label: "Terpasang",         color: "#10B981" },
  ISSUE:       { label: "Ada Kendala",       color: "#EF4444" },
};
```

---

## 3. Valid Drag Targets per Entity Type

Defines which columns a card of each entity type may be dragged to.
Derived from legal state machine transitions.

```ts
// src/components/views/ProjectsView/ProjectsWorkItemCard.tsx
const VALID_COLUMNS_BY_TYPE: Record<MarcomWorkItemType, ProjectsColumn[]> = {
  content:   ["To Do", "In Progress", "In Review", "Done", "Archived"],
  event:     ["To Do", "In Progress", "Done", "Cancelled"],
  placement: ["To Do", "In Progress", "Done", "Blocked"],
};
```

**Content note:** "Blocked" and "Cancelled" are not valid drag targets for
ContentPost. Content has no `ISSUE` or `CANCELLED` DB status. Dragging a
Content card to those columns returns `null` from `mapColumnToStatus` and the
move is silently rejected.

**Event note:** "In Review", "Blocked", "Archived" are not valid for events.

**Placement note:** "In Review", "Cancelled", "Archived" are not valid for placements.

---

## 4. Board View — Archived Column Behaviour

- By default the Board renders only the 6 columns in `PROJECTS_COLUMN_ORDER`.
- A **"Show Archived"** toggle button lives in the Board toolbar (top-right,
  near the density toggle).
- When enabled, an `Archived` column appends to the right of `Cancelled`.
- The Archived column is styled with reduced opacity (`opacity-60`) to visually
  distinguish it as a historical bucket.
- ContentPost `ARCHIVED` cards appear here. No event or placement cards ever
  appear in Archived.

---

## 5. Sub-Status Badge on Cards

### 5.1 Placement on `ProjectsWorkItemCard`

The sub-status badge renders as a small pill below the item title, before the
date/PIC row:

```
┌────────────────────────────────────┐
│ ☐  [content icon] instagram • reel │
│    Summer Promo Campaign           │
│    ● Menunggu Review               │  ← sub-status badge
│    📅 15 Jun 2026  👤 Alice        │
└────────────────────────────────────┘
```

### 5.2 Badge styles

```tsx
// Pill: small dot + label, using sub-status color at 15% opacity bg
<span
  style={{
    backgroundColor: `${subStatus.color}26`,
    borderColor: `${subStatus.color}4D`,
    color: subStatus.color,
  }}
  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
>
  <span
    className="w-1.5 h-1.5 rounded-full"
    style={{ backgroundColor: subStatus.color }}
  />
  {subStatus.label}
</span>
```

### 5.3 Density behaviour

| Density | Badge shown |
|---|---|
| `compact` | Hidden (space constraint) |
| `default` | Shown |
| `relaxed` | Shown with slightly larger text (`text-[11px]`) |

---

## 6. List View — Sub-Status in Status Cell

The status cell in `ProjectsListRow` currently renders a clickable pill that
opens a dropdown of valid DB statuses. After this change:

- The pill label shows the **sub-status label** (e.g., "Menunggu Review")
  instead of the raw DB enum string (e.g., "IN_REVIEW").
- The pill background/border/text color derives from `getWorkItemSubStatus()`.
- The status dropdown options are populated from the entity's own valid DB
  statuses (unchanged — `contentWorkflow`, `eventMachine`, `placementMachine`
  still govern valid transitions).
- Selecting a status from the dropdown fires a PATCH to the entity's API (same
  as today).

---

## 7. Calendar View — Status Chip Colors

`CalendarPopovers.tsx` currently exports `STATUS_HEX_COLORS` keyed by raw DB
status string. This continues to work without change — the chip on calendar
cells already uses the DB status string as key. No changes needed in Calendar.

---

## 8. Filter Bar — Column Filter Options

`ProjectsFilterBar.tsx` renders a multi-select for `columns`. The options
must reflect the new 6-column set (plus Archived as optional):

```ts
// Options rendered in filter bar
const COLUMN_FILTER_OPTIONS: ProjectsColumn[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
  "Blocked",
  "Cancelled",
  "Archived",
];
```

The `ProjectsFilterState.columns` field type (`ProjectsColumn[]`) is unchanged.
The `applyProjectsFilters` logic is unchanged — it calls `getWorkItemColumn()`
which already handles the new mapping.

---

## 9. Bulk Action Bar — Status Dropdown Options

`ProjectsBulkActionBar.tsx` renders a `<select>` populated from
`PROJECTS_COLUMN_ORDER`. After the change it will show:

```
To Do / In Progress / In Review / Done / Blocked / Cancelled
```

The component code requires no change beyond `PROJECTS_COLUMN_ORDER` updating.

---

## 10. `projectsFilters.test.ts` — Updated Fixtures

All test fixtures that reference old column names must be updated:

| Old column name | New column name |
|---|---|
| `"Upcoming"` | `"To Do"` |
| `"In Progress"` (for DRAFT/IN_REVIEW) | `"In Review"` or `"To Do"` |
| `"Ready"` | `"In Review"` |

Specifically:
- Fixture content item with `status: "DRAFT"` → expects column `"To Do"`
- Fixture event item with `status: "UPCOMING"` → expects column `"To Do"`
- Column filter test for `"In Progress"` → adjust fixture statuses accordingly

---

## 11. Acceptance Criteria

| # | Criteria |
|---|---|
| AC-1 | Board renders exactly 6 columns in order: To Do · In Progress · In Review · Done · Blocked · Cancelled |
| AC-2 | "Show Archived" toggle in Board toolbar appends Archived column |
| AC-3 | ContentPost `DRAFT` card appears in "To Do" column |
| AC-4 | ContentPost `IN_REVIEW` card appears in "In Review" column |
| AC-5 | ContentPost `REVISION` card appears in "In Progress" column |
| AC-6 | ContentPost `APPROVED` card appears in "In Review" column |
| AC-7 | ContentPost `SCHEDULED` card appears in "In Review" column |
| AC-8 | ContentPost `PUBLISHED` card appears in "Done" column |
| AC-9 | ContentPost `ARCHIVED` card hidden by default; visible when "Show Archived" is on |
| AC-10 | FieldEvent `UPCOMING` card appears in "To Do" column |
| AC-11 | FieldEvent `ON_PROGRESS` card appears in "In Progress" column |
| AC-12 | FieldEvent `COMPLETED` card appears in "Done" column |
| AC-13 | FieldEvent `CANCELLED` card appears in "Cancelled" column |
| AC-14 | Placement `NOT_STARTED` card appears in "To Do" column |
| AC-15 | Placement `ON_PROGRESS` card appears in "In Progress" column |
| AC-16 | Placement `DONE` card appears in "Done" column |
| AC-17 | Placement `ISSUE` card appears in "Blocked" column |
| AC-18 | Each card shows a sub-status badge with correct label and color (default density) |
| AC-19 | Sub-status badge hidden at compact density |
| AC-20 | Dragging ContentPost to "To Do" PATCHes `{ status: "DRAFT" }` |
| AC-21 | Dragging ContentPost to "In Progress" PATCHes `{ status: "REVISION" }` |
| AC-22 | Dragging ContentPost to "In Review" PATCHes `{ status: "IN_REVIEW" }` |
| AC-23 | Dragging ContentPost to "Done" PATCHes `{ status: "PUBLISHED" }` |
| AC-24 | Dragging FieldEvent to "Blocked" column is silently rejected (null mapping) |
| AC-25 | Dragging Placement to "In Review" column is silently rejected (null mapping) |
| AC-26 | List view status cell shows sub-status label text, not raw DB enum string |
| AC-27 | All 10 `projectsFilters.test.ts` tests pass with updated column fixtures |
| AC-28 | `analyticsEngine`, `reportDraftEngine`, `pipelineEngine` test suites unchanged and passing |
| AC-29 | No Prisma schema changes; no DB migration generated |
| AC-30 | Total test suite ≥ 549 pass, 0 fail |
