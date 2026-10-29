# ADR 04: Remove Projects Gantt View

**Date:** 2026-10-31  
**Status:** Accepted  
**Author:** Team

---

## Context

The Projects view currently ships four view modes for MarcomWorkItems
(ContentPost, FieldEvent, Placement): **Board**, **List**, **Calendar**, and
**Gantt**. This ADR concerns the decision to remove the Gantt view entirely.

### What the Gantt view does

`ProjectsGanttView` renders all three marcom entity types on a horizontal
pixel-mapped timeline. Each item becomes a coloured bar positioned by its date
field. FieldEvents get resize and progress-drag handles; content posts and
placements get a single move-drag handle. Items without a date fall into a
collapsible "unscheduled shelf" at the bottom. Three zoom levels (day / week /
month) adjust column width and the visible time window.

### Why removal is the right decision

**1. Near-zero unique value over Calendar.**  
The Calendar view already answers the primary question users have: "what is
happening when?" Calendar shows multi-day FieldEvent spans, content publish
dates, and placement install dates on a familiar monthly grid with status
chips. The Gantt adds pixel-level bar lengths and drag-reschedule, but for
Marcom operations the granularity of a calendar month is almost always
sufficient. FieldEvents are not software tasks with precise hour-level
dependencies.

**2. The drag-reschedule mutation is duplicated and risky.**  
`useProjectsGantt` contains its own PATCH calls to
`/api/marcom/events/:id`, `/api/marcom/content/:id`, and
`/api/marcom/placements/:id` — separate from the identical mutations in
`ContentPlannerView`, `EventsView`, and `Outlet360Drawer`. Keeping these in
sync when API contracts change requires updating four code paths. The Gantt
path is the least-tested of the four (zero dedicated unit tests).

**3. Two independent domain-specific timeline views already exist.**  
`EventsView/EventsTimelineView.tsx` (for FieldEvents) and
`ContentPlannerView/ContentGanttView.tsx` (for ContentPosts) are dedicated,
well-maintained, domain-expert views that already live within their respective
Marcom modules. They surface domain-specific features (event conflict
detection by branch, content status colouring) that the generic Projects Gantt
cannot replicate without reimplementing domain logic a third time.

**4. Zero test coverage.**  
The entire Gantt implementation (790 LOC across 4 files) has no dedicated unit
or integration tests. Bugs in drag math, date clamping, or API mutation are
invisible to the test suite.

**5. Complexity cost exceeds use frequency.**  
`useProjectsGantt.ts` (321 LOC) is the most complex hook in the Projects view.
It maintains five independent state variables, three data subscriptions, a
drag state machine with four drag types, and three async API mutation branches.
This complexity is only justified if the view is a primary workflow tool —
which it is not for Marcom field operations teams.

**6. `progress` field accessed via `as any`.**  
`GanttBar.tsx` reads `item.progress` via `(item as any).progress ?? 0` because
`FieldEventItem` does not have a `progress` field in `src/types/index.ts`. This
is an implicit schema coupling that would silently return `0` if the field is
ever renamed or removed on the API.

---

## Decision

**Delete the Projects Gantt view entirely.**

- Remove the 4 core files: `ProjectsGanttView.tsx`, `useProjectsGantt.ts`,
  `GanttBar.tsx`, `GanttUnscheduledShelf.tsx`
- Remove `"gantt"` from `ViewMode`, `VALID_VIEW_MODES`, `PROJECTS_NAV_ITEMS`,
  `VIEW_SHORTCUTS`, `CommandPalette`, `MoreAppsMenu`
- Update `Sidebar.tsx` mode-switch guards to use the remaining 3 view IDs
- Update `HelpDocsModal` and `UpgradeModal` copy to remove Gantt references
- Redirect any active `lastTaskView: "gantt"` to `"list"` on store hydration

**Not removed:**
- `EventsView/EventsTimelineView.tsx` — independent, domain-specific, unaffected
- `ContentPlannerView/ContentGanttView.tsx` — independent, domain-specific, unaffected
- Calendar view (`ProjectsCalendarView`) — the primary timeline replacement

---

## Consequences

### Positive
- −790 LOC of untested code
- One fewer async mutation path per entity type
- `ViewMode` union shrinks by one value, reducing combinatorial test surface
- `useWorkspaceHotkeys` key `"4"` freed up (can be repurposed or left unbound)
- Users wanting timeline for events use the purpose-built `EventsTimelineView`
- Users wanting content timeline use the purpose-built `ContentGanttView`

### Negative / Accepted trade-offs
- Users who navigated via keyboard shortcut `4` or the Command Palette
  "Gantt Timeline View" entry will find the shortcut/entry gone — minor UX
  disruption, mitigated by updating `HelpDocsModal` copy and remapping `"4"`
  to `"calendar"`.
- Deep-linked URLs containing `?view=gantt` will fall back to the default
  view (`"list"`) — acceptable since there is no persistent user content tied
  to the Gantt view itself.
- `UpgradeModal` listed Gantt as an Unlimited-tier feature — copy must be
  updated to avoid misleading prospective upgraders.

---

## Not in scope

- Removal of `EventsTimelineView` or `ContentGanttView` (domain views, out of scope)
- Adding timeline-specific drag-reschedule to Calendar view (future decision)
- Changes to Prisma schema or API routes (no schema changes required)
