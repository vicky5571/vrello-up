# Spec 04: Remove Projects Gantt View

**Date:** 2026-10-31  
**Status:** Proposed  
**ADR:** `adr.md`

---

## 1. Files to Delete

The following files are deleted in their entirety. No content is preserved.

| File | LOC | Reason |
|---|---|---|
| `src/components/views/ProjectsView/ProjectsGanttView.tsx` | 217 | Main view component |
| `src/components/views/ProjectsView/useProjectsGantt.ts` | 321 | All Gantt logic, state, drag, API mutations |
| `src/components/views/ProjectsView/GanttBar.tsx` | 130 | Per-item bar with drag handles |
| `src/components/views/ProjectsView/GanttUnscheduledShelf.tsx` | 122 | Unscheduled items shelf |

**Total deleted: 790 LOC**

---

## 2. `src/types/index.ts`

### 2.1 Remove `"gantt"` from `ViewMode`

```ts
// Before:
export type ViewMode =
  | "pipeline"
  | "home"
  | "list"
  | "board"
  | "calendar"
  | "gantt"           // ← DELETE this line
  | "channel"
  ...

// After:
export type ViewMode =
  | "pipeline"
  | "home"
  | "list"
  | "board"
  | "calendar"
  | "channel"
  ...
```

---

## 3. `src/components/views/ActiveViewStage.tsx`

### 3.1 Remove dynamic import

```ts
// Delete these lines:
const ProjectsGanttView = dynamic(
  () => import("@/components/views/ProjectsView/ProjectsGanttView").then((m) => m.ProjectsGanttView),
  { ssr: false, loading: () => <ViewFallback /> },
);
```

### 3.2 Remove switch case

```ts
// Delete:
case "gantt":
  return <ProjectsGanttView />;
```

---

## 4. `src/components/layout/navConfig.ts`

### 4.1 Remove Gantt entry from `PROJECTS_NAV_ITEMS`

```ts
// Delete:
{ id: "gantt", label: "Gantt Timeline", icon: Clock, iconColor: "text-amber-500" },
```

After removal, `PROJECTS_NAV_ITEMS` has 3 items: Board, List, Calendar.
Remove unused `Clock` import if it is only used here.

---

## 5. `src/lib/router/urlState.ts`

### 5.1 Remove `"gantt"` from `VALID_VIEW_MODES`

```ts
// Before:
const VALID_VIEW_MODES = new Set<ViewMode>([
  "list", "board", "calendar", "gantt", ...
]);

// After:
const VALID_VIEW_MODES = new Set<ViewMode>([
  "list", "board", "calendar", ...
]);
```

### 5.2 Fallback behaviour for `?view=gantt` deep links

`parseUrlNavState` returns `null` for unknown view strings, which causes the
store to use its default view (`"list"`). No additional code change is needed
— the removal of `"gantt"` from `VALID_VIEW_MODES` is sufficient to make
`?view=gantt` fall back gracefully.

---

## 6. `src/lib/store/slices/createUiSlice.ts`

### 6.1 Guard `lastTaskView` on hydration

If persisted Zustand state contains `lastTaskView: "gantt"`, it must be
normalised to `"list"` at hydration time to prevent a blank screen when the
store tries to restore the last task view.

```ts
// In the store's persist rehydration or normalizeViewMode function,
// add a guard:
function normalizeViewMode(view: string): ViewMode {
  const valid: ViewMode[] = ["list", "board", "calendar", /* other valid views */];
  if (valid.includes(view as ViewMode)) return view as ViewMode;
  return "list"; // fallback including old "gantt" values
}
```

The existing `normalizeViewMode` already has a fallback path — confirm it
covers `"gantt"` after the type is removed (TypeScript will catch it if not).

### 6.2 Remove `"gantt"` from Sidebar mode-switch inline arrays

These inline arrays in `createUiSlice.ts` are not present — the arrays live in
`Sidebar.tsx` (see §7). No change needed in this file beyond confirming the
`normalizeViewMode` guard.

---

## 7. `src/components/layout/Sidebar.tsx`

### 7.1 Update Projects mode-switch guard arrays

Two places in `Sidebar.tsx` use an inline array to test if the current view is
a "projects" view. Remove `"gantt"` from both:

```ts
// Before (two occurrences):
["board", "list", "calendar", "gantt"].includes(activeView)

// After:
["board", "list", "calendar"].includes(activeView)
```

---

## 8. `src/lib/hooks/useWorkspaceHotkeys.ts`

### 8.1 Remap key `"4"` from `"gantt"` to `"calendar"`

Key `"4"` currently maps to `"gantt"`. After removal, the most logical
replacement is `"calendar"` — it is the temporal view that serves the same
"see items on a timeline" intent.

```ts
// Before:
const VIEW_SHORTCUTS: Record<string, ViewMode> = {
  "1": "list",
  "2": "board",
  "3": "calendar",
  "4": "gantt",
};

// After:
const VIEW_SHORTCUTS: Record<string, ViewMode> = {
  "1": "list",
  "2": "board",
  "3": "calendar",
  // Key "4" is unbound — freed for future use
};
```

Alternatively, remove key `"4"` entirely rather than reassigning it, to avoid
confusion (user may have muscle memory for the old mapping). Leaving it unbound
is the safer choice.

---

## 9. `src/components/layout/CommandPalette.tsx`

### 9.1 Remove Gantt entry from views list

```ts
// Delete this entry from the views array:
{ id: "gantt", name: "Gantt Timeline View", icon: GanttChart }
```

Remove the unused `GanttChart` import from lucide-react.

---

## 10. `src/components/modals/MoreAppsMenu.tsx`

### 10.1 Remove Gantt button from Quick Views grid

```tsx
// Delete:
<button onClick={() => handleLaunchView("gantt")}>
  <Milestone className="w-3.5 h-3.5 text-purple-500" />
  <span>Gantt</span>
</button>
```

Remove the unused `Milestone` import from lucide-react if it is only used here.

---

## 11. `src/components/modals/HelpDocsModal.tsx`

### 11.1 Update keyboard shortcuts description

```ts
// Before:
{ key: "1 - 5", label: "Quick Switch Views (List, Board, Calendar, Gantt, Home)" }

// After:
{ key: "1 - 3", label: "Quick Switch Views (List, Board, Calendar)" }
```

### 11.2 Remove Gantt guide entry

```ts
// Delete:
{
  title: "Gantt Timeline & Dependencies",
  icon: Layers,
  description: "Track task timelines with cycle-detection-safe dependency links, start dates, and duration progress."
}
```

---

## 12. `src/components/modals/UpgradeModal.tsx`

### 12.1 Remove Gantt from Unlimited features list

```ts
// Delete from features array:
"Interactive Gantt & Timeline Dependencies"
```

### 12.2 Update subtitle copy

```ts
// Before:
"Supercharge team workflows with Gantt dependencies, TanStack Table, and Brain² AI."

// After:
"Supercharge team workflows with AI-powered insights, TanStack Table, and Brain² AI."
```

(Or any copy that does not mention Gantt — exact wording is a product decision.)

---

## 13. No Changes Required

The following files reference Gantt concepts but require **no code changes**:

| File | Why no change needed |
|---|---|
| `EventsView/EventsTimelineView.tsx` | Independent domain view, not connected to `ViewMode "gantt"` |
| `ContentPlannerView/ContentGanttView.tsx` | Independent domain view, not connected to `ViewMode "gantt"` |
| `src/app/api/marcom/events/[id]/route.ts` | Gantt was a consumer; the API itself is unaffected |
| `src/app/api/marcom/content/[id]/route.ts` | Same |
| `src/app/api/marcom/placements/[id]/route.ts` | Same |
| Prisma schema | No schema change was introduced by Gantt |
| `src/lib/marcom/workItems.ts` | Gantt consumed these utilities but did not define them |
| `src/lib/marcom/projectsFilters.ts` | Same |

---

## 14. Acceptance Criteria

| # | Criteria |
|---|---|
| AC-1 | `ViewMode` type no longer includes `"gantt"` — TypeScript compile error if referenced |
| AC-2 | Sidebar renders 3 nav items in Projects mode: Board, List, Calendar |
| AC-3 | `ActiveViewStage` has no case for `"gantt"` — fallback renders nothing / default |
| AC-4 | Keyboard shortcut `"4"` does not trigger any view switch |
| AC-5 | Command Palette search for "gantt" returns no results |
| AC-6 | MoreAppsMenu Quick Views grid has no Gantt button |
| AC-7 | URL `?view=gantt` falls back to `"list"` view without error |
| AC-8 | Persisted store with `lastTaskView: "gantt"` hydrates to `"list"` without blank screen |
| AC-9 | `EventsTimelineView` and `ContentGanttView` are unaffected and render correctly |
| AC-10 | `HelpDocsModal` shortcuts show `"1 - 3"`, no Gantt guide entry |
| AC-11 | `UpgradeModal` does not mention Gantt |
| AC-12 | All existing tests pass (≥ 569, 0 fail) |
| AC-13 | No orphaned imports of `GanttBar`, `GanttUnscheduledShelf`, `useProjectsGantt`, `ProjectsGanttView` |
