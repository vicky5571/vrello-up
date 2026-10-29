# ADR 03: Unified Status Columns + Domain Sub-Status for Projects View

**Date:** 2026-10-31  
**Status:** Proposed  
**Supersedes:** Mapping section of `adr.md` (c380f00) and `02-feature-parity-adr.md` (column layout)  
**Author:** CodeBuddy / Team

---

## Context

After removing the general task system and repurposing the Projects view for
Marcom work items (ContentPost, FieldEvent, Placement), the Projects Board
exposes a structural problem: the three entity types carry heterogeneous status
enums that do not align:

| Entity | DB Status Values | Count |
|---|---|---|
| ContentPost | `DRAFT · IN_REVIEW · REVISION · APPROVED · SCHEDULED · PUBLISHED · ARCHIVED` | 7 |
| FieldEvent | `UPCOMING · ON_PROGRESS · COMPLETED · CANCELLED` | 4 |
| Placement | `NOT_STARTED · ON_PROGRESS · DONE · ISSUE` | 4 |

The current `getWorkItemColumn()` implementation (committed at c380f00 + feature
parity work) maps all 15 distinct DB values onto 8 heterogeneous columns
(`Upcoming · To Do · In Progress · Ready · Done · Blocked · Cancelled · Archived`).

**Problems with that approach:**

1. **Loss of workflow precision for ContentPost.** `DRAFT`, `IN_REVIEW`, and
   `REVISION` all collapse into one "In Progress" column. A post that was
   rejected for revision (`REVISION`) looks identical on the Board to one that
   was never touched (`DRAFT`).

2. **Cross-entity column semantics are inconsistent.** "Upcoming" is used
   exclusively by FieldEvent; "To Do" exclusively by Placement; "Ready"
   exclusively by ContentPost. Five of eight columns accept only one entity
   type — the Board is not truly unified.

3. **Drag precision loss.** Dropping a ContentPost back into "In Progress"
   always maps to `IN_REVIEW` regardless of whether the prior state was `DRAFT`
   or `REVISION`. Sub-workflow fidelity is lost on round-trip drag.

4. **Cognitive overhead.** Users must learn which columns apply to which
   entity type, with no labeling or visual cue explaining why some columns
   appear empty for certain entities.

### Reference: how vrello-old solved this

Vrello-old used a `StatusCategory` meta-layer (`open · in_progress · review ·
done · closed`) on top of user-customisable per-Space `Status` objects. The
Board grouped columns by `category`, not by name. Domain entities (events,
placements) were stored separately and synced via a `syncFieldEventOnTaskStatus
Change()` bridge — the UI column was always generic, and the domain status was
always private.

We deliberately removed that bridge (and the Task model). Direct entities are
now first-class work items. The meta-layer needs to be rebuilt without the Task
intermediary.

---

## Decision

**Adopt a two-tier status model: Unified Status (UI / column layer) +
Sub-Status (domain label, display-only).**

### Unified Column Set (6 columns)

```
TO DO  →  IN PROGRESS  →  IN REVIEW  →  DONE  |  BLOCKED  |  CANCELLED
```

| Column | Semantic | Entity types present |
|---|---|---|
| **To Do** | Queued, not yet started | Content (DRAFT), Event (UPCOMING), Placement (NOT_STARTED) |
| **In Progress** | Active work in execution | Content (REVISION), Event (ON_PROGRESS), Placement (ON_PROGRESS) |
| **In Review** | Awaiting decision / approval | Content (IN_REVIEW, APPROVED, SCHEDULED) |
| **Done** | Terminal success | Content (PUBLISHED), Event (COMPLETED), Placement (DONE) |
| **Blocked** | Explicit impediment requiring intervention | Placement (ISSUE) |
| **Cancelled** | Explicitly abandoned, retained for historical record | Event (CANCELLED) |

`Archived` is retained as a **hidden overflow bucket** — ContentPost `ARCHIVED`
records are stored and accessible via filter, but not shown as a visible Board
column by default.

### Sub-Status (display label on card)

Each card shows a small domain-specific badge below its title that carries the
original DB status label. The badge is informational only — it does not drive
any API call or business logic. It preserves operational semantics for the
domain expert reading the Board.

| DB Status | Unified Column | Sub-Status Badge Label |
|---|---|---|
| `DRAFT` | To Do | Draft |
| `IN_REVIEW` | In Review | Menunggu Review |
| `REVISION` | In Progress | Perlu Revisi |
| `APPROVED` | In Review | Approved |
| `SCHEDULED` | In Review | Terjadwal |
| `PUBLISHED` | Done | Published |
| `ARCHIVED` | *(hidden)* | Arsip |
| `UPCOMING` | To Do | Akan Datang |
| `ON_PROGRESS` | In Progress | Sedang Berlangsung |
| `COMPLETED` | Done | Selesai |
| `CANCELLED` | Cancelled | Dibatalkan |
| `NOT_STARTED` | To Do | Belum Dipasang |
| `ON_PROGRESS` | In Progress | Sedang Dipasang |
| `DONE` | Done | Terpasang |
| `ISSUE` | Blocked | Ada Kendala |

### Key design rationale

**Why `REVISION → In Progress` (not In Review)?**  
`REVISION` means the content was rejected and is being reworked. It is active
creative work, not passive waiting. Placing it in "In Progress" correctly
signals that the creator needs to act.

**Why `APPROVED` and `SCHEDULED → In Review` (not Done)?**  
Both statuses are still reachable by `REVISION` (`APPROVED → REVISION`,
`SCHEDULED → REVISION` per `contentWorkflow.ts`). Neither is terminal. The
post is waiting for a scheduled publish — still "under governance."  
`DONE` is reserved for genuinely terminal outcomes.

**Why `CANCELLED → its own column` (not hidden)?**  
`reportDraftEngine.ts` and `analyticsEngine.ts` hardcode `status === "CANCELLED"`
for KPI summaries. Events cancelled must stay visible in the Board so that the
Marcom Manager can review, reschedule, or reactivate (`CANCELLED → UPCOMING`
is a legal transition). Hiding them would break the reactivation workflow.

**Why `ISSUE → Blocked` (not In Progress)?**  
`placementMachine.ts` enforces `notes` as a mandatory field on `ISSUE`
transition, and `pipelineEngine.ts` explicitly treats `ISSUE` as a bottleneck
signal (`isBlockedItem = statusUpper === "ISSUE"`). The failure mode is
categorically different from progress.

**Why drop `Upcoming`, `Ready`, `Archived` as visible columns?**  
- `Upcoming` was used only by FieldEvent. It is replaced by `To Do` with
  sub-status "Akan Datang".  
- `Ready` was used only by ContentPost (`APPROVED` + `SCHEDULED`). These
  states semantically belong in `In Review` because they still require
  editorial governance (can be reverted to `REVISION`).  
- `Archived` is a terminal historical bucket, not a workflow step. Showing it
  on the default Board creates noise; it is accessible via filter.

---

## Consequences

### Positive

- **True unified Board.** All 6 columns receive cards from ≥2 entity types
  (except Blocked = Placement only, Cancelled = Event only — both are
  intentional domain-specific signals, not an oversight).
- **No DB migration required.** All DB enums (`PlacementStatus`,
  `EventStatus`) and the `PostStatus` string field remain unchanged.
- **No analytics cascade.** `analyticsEngine.ts`, `reportDraftEngine.ts`,
  `pipelineEngine.ts`, `Outlet360Drawer.tsx`, `ContentPlannerView/` all read
  DB status values directly — they are unaffected.
- **Sub-status badge preserves domain semantics.** Marcom Managers reading
  the Board can see `[Terjadwal]` vs `[Approved]` vs `[Menunggu Review]` even
  though all three occupy the "In Review" column.
- **Drag-to-column fidelity is clear and bounded.** `mapColumnToStatus()` now
  maps each column to **exactly one** DB status per entity type (no ambiguity).

### Negative / Accepted Trade-offs

- **APPROVED and SCHEDULED in `In Review`** may initially feel counterintuitive
  to users who equate "Approved" with "Done." Mitigated by the sub-status badge
  and column header tooltip.
- **`Blocked` column is Placement-only** in practice (unless business rules
  expand). Acceptable — it serves as an explicit escalation signal.
- **`Cancelled` column is Event-only** in practice. Acceptable — event
  cancellations are a high-frequency operational event worth surfacing.
- **Round-trip drag fidelity:** dragging a `REVISION` card to "To Do" maps it
  to `DRAFT` (the canonical "not started" state for Content). The `REVISION`
  sub-status is lost. This is acceptable — resetting to `DRAFT` is a legitimate
  workflow choice and is permitted by `contentWorkflow.ts` transitions.

---

## Alternatives Considered

### A: Keep current 8-column layout (status quo)
Rejected. As analysed: 5 of 8 columns are single-entity-type, `DRAFT /
IN_REVIEW / REVISION` collapse into one column destroying review loop
visibility.

### B: Fully unified DB enums (TO_DO / IN_PROGRESS / IN_REVIEW / DONE)
Rejected. Requires destructive PostgreSQL enum migration, cascade changes
across 8+ files in analytics/reporting engines, and permanently loses domain
semantics (`ISSUE`, `CANCELLED`, `REVISION`, `APPROVED`, `SCHEDULED`).

### C: Per-entity-type sub-tabs on Board
Partially adopted: the sub-status badge achieves the same domain visibility
without fragmenting the unified Board view. Full sub-tab separation is deferred
as a future enhancement.

### D: Vrello-old StatusCategory approach (wrapper Task + StatusCategory)
Rejected. We deliberately removed the Task intermediary. Re-introducing a
wrapper would undo that architectural decision.

---

## Files Affected (summary — details in spec and plan)

| File | Change type |
|---|---|
| `src/types/index.ts` | Update `ProjectsColumn` union type (8 → 6 visible + Archived retained) |
| `src/lib/marcom/workItems.ts` | Rewrite `getWorkItemColumn()`, `mapColumnToStatus()`, `PROJECTS_COLUMN_ORDER`; add `getWorkItemSubStatus()` |
| `src/components/views/ProjectsView/ProjectsWorkItemCard.tsx` | Add sub-status badge; update `VALID_COLUMNS_BY_TYPE` |
| `src/components/views/ProjectsView/ProjectsBoardView.tsx` | Update column order render; add Archived toggle |
| `src/components/views/ProjectsView/ProjectsListRow.tsx` | Show sub-status in status cell |
| `src/components/views/ProjectsView/CalendarPopovers.tsx` | Update `STATUS_HEX_COLORS` → column-based colors; keep domain colors for chip |
| `src/components/layout/ProjectsFilterBar.tsx` | Rename filter options to new column labels |
| `src/lib/marcom/projectsFilters.ts` | Update `DEFAULT_PROJECTS_FILTERS` column references |
| `src/lib/marcom/projectsFilters.test.ts` | Update test fixtures for new column names |

**Not affected:** `analyticsEngine.ts`, `reportDraftEngine.ts`,
`pipelineEngine.ts`, `placementMachine.ts`, `eventMachine.ts`,
`contentWorkflow.ts`, `Outlet360Drawer.tsx`, `ContentPlannerView/`,
`EventsView/`, Prisma schema, any API route.
