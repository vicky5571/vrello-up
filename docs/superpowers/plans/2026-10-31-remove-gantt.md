# Plan 04: Remove Projects Gantt View — Implementation Plan

**Date:** 2026-10-31  
**Status:** Proposed  
**ADR:** `adr.md`  
**Spec:** `spec.md`  
**Baseline:** 569 tests pass, 0 fail

---

## Overview

Pure deletion and cleanup. No new logic is added. No API routes change.
No Prisma schema changes.

**Phases:** 5  
**Files deleted:** 4  
**Files modified:** 10  
**Tests expected after:** ≥ 569 pass, 0 fail

---

## Phase 1 — Delete the 4 core Gantt files

Delete these files entirely:

```
src/components/views/ProjectsView/ProjectsGanttView.tsx
src/components/views/ProjectsView/useProjectsGantt.ts
src/components/views/ProjectsView/GanttBar.tsx
src/components/views/ProjectsView/GanttUnscheduledShelf.tsx
```

**After this phase**, TypeScript will surface import errors in every file that
references these modules. Those errors drive the remaining phases.

**Command:**
```bash
rm src/components/views/ProjectsView/ProjectsGanttView.tsx \
   src/components/views/ProjectsView/useProjectsGantt.ts \
   src/components/views/ProjectsView/GanttBar.tsx \
   src/components/views/ProjectsView/GanttUnscheduledShelf.tsx
```

---

## Phase 2 — Remove `"gantt"` from the type system and routing

### 2.1 `src/types/index.ts`

Remove `| "gantt"` from the `ViewMode` union.

```diff
 export type ViewMode =
   | "pipeline"
   | "home"
   | "list"
   | "board"
   | "calendar"
-  | "gantt"
   | "channel"
```

### 2.2 `src/lib/router/urlState.ts`

Remove `"gantt"` from `VALID_VIEW_MODES`:

```diff
-  "gantt",
```

### 2.3 `src/lib/store/slices/createUiSlice.ts`

Verify that `normalizeViewMode` (or its equivalent fallback logic) returns
`"list"` for the now-invalid string `"gantt"`. Since `"gantt"` will no longer
be a valid `ViewMode` value, TypeScript will flag any explicit reference to it
in the slice. Remove or update any such reference.

If `normalizeViewMode` uses a `Set<ViewMode>` for validity checking, the
removal from `ViewMode` is sufficient — the set will automatically exclude
`"gantt"` at compile time. Confirm with a grep:

```bash
grep -n "gantt" src/lib/store/slices/createUiSlice.ts
# Expected: no output
```

---

## Phase 3 — Remove from `ActiveViewStage`

**File:** `src/components/views/ActiveViewStage.tsx`

### 3.1 Delete dynamic import block

```diff
-const ProjectsGanttView = dynamic(
-  () => import("@/components/views/ProjectsView/ProjectsGanttView").then((m) => m.ProjectsGanttView),
-  { ssr: false, loading: () => <ViewFallback /> },
-);
```

### 3.2 Delete switch case

```diff
-    case "gantt":
-      return <ProjectsGanttView />;
```

---

## Phase 4 — Remove from navigation entry points

Four files each have one or two gantt references. Work through them one by one.

### 4.1 `src/components/layout/navConfig.ts`

```diff
-  { id: "gantt", label: "Gantt Timeline", icon: Clock, iconColor: "text-amber-500" },
```

Check if `Clock` is used elsewhere in the file. If not, remove its import:
```diff
-import { Kanban, List, Calendar, Clock, ... } from "lucide-react";
+import { Kanban, List, Calendar, ... } from "lucide-react";
```

### 4.2 `src/components/layout/Sidebar.tsx`

Two inline array literals — update both:

```diff
-if (!["board", "list", "calendar", "gantt"].includes(activeView)) {
+if (!["board", "list", "calendar"].includes(activeView)) {
```

```diff
-if (["board", "list", "calendar", "gantt"].includes(activeView)) {
+if (["board", "list", "calendar"].includes(activeView)) {
```

### 4.3 `src/lib/hooks/useWorkspaceHotkeys.ts`

Remove key `"4"` from `VIEW_SHORTCUTS` entirely:

```diff
 const VIEW_SHORTCUTS: Record<string, ViewMode> = {
   "1": "list",
   "2": "board",
   "3": "calendar",
-  "4": "gantt",
 };
```

### 4.4 `src/components/layout/CommandPalette.tsx`

Remove the Gantt entry from the views array:

```diff
-{ id: "gantt", name: "Gantt Timeline View", icon: GanttChart },
```

Remove unused import:
```diff
-import { ..., GanttChart, ... } from "lucide-react";
```

### 4.5 `src/components/modals/MoreAppsMenu.tsx`

Remove the Gantt button from the Quick Views grid:

```diff
-<button onClick={() => handleLaunchView("gantt")}>
-  <Milestone className="w-3.5 h-3.5 text-purple-500" />
-  <span>Gantt</span>
-</button>
```

Remove unused import if `Milestone` is only used here:
```diff
-import { ..., Milestone, ... } from "lucide-react";
```

---

## Phase 5 — Update copy in modal help/upgrade text

### 5.1 `src/components/modals/HelpDocsModal.tsx`

Update the keyboard shortcuts label:
```diff
-{ key: "1 - 5", label: "Quick Switch Views (List, Board, Calendar, Gantt, Home)" },
+{ key: "1 - 3", label: "Quick Switch Views (List, Board, Calendar)" },
```

Delete the Gantt guide entry:
```diff
-{
-  title: "Gantt Timeline & Dependencies",
-  icon: Layers,
-  description: "Track task timelines with cycle-detection-safe dependency links, start dates, and duration progress."
-},
```

Check if `Layers` is used elsewhere in the file. Remove import if not.

### 5.2 `src/components/modals/UpgradeModal.tsx`

Remove Gantt from the Unlimited features list:
```diff
-"Interactive Gantt & Timeline Dependencies",
```

Update the subtitle copy:
```diff
-"Supercharge team workflows with Gantt dependencies, TanStack Table, and Brain² AI."
+"Supercharge team workflows with AI-powered insights, TanStack Table, and Brain² AI."
```

---

## Verification

Run after all phases are complete:

```bash
# 1. No remaining gantt references in source (excluding docs and node_modules)
grep -rn "gantt\|GanttView\|GanttBar\|GanttUnscheduled\|useProjectsGantt" \
  src/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules
# Expected: no output

# 2. All tests pass
npm test
# Expected: ≥ 569 pass, 0 fail

# 3. Confirm deleted files are gone
ls src/components/views/ProjectsView/Gantt* 2>&1
# Expected: No such file or directory

# 4. Domain views unaffected
grep -l "EventsTimelineView\|ContentGanttView" src/components/views/
# Expected: still present
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Persisted Zustand store with `lastTaskView: "gantt"` causes blank screen on first load after deploy | Low | Medium | `normalizeViewMode` fallback to `"list"` covers this; confirm in Phase 2.3 |
| `?view=gantt` deep link (e.g. in a bookmarked URL or shared link) shows blank | Low | Low | `parseUrlNavState` returns `null` for invalid views → store uses `"list"` default |
| `EventsTimelineView` or `ContentGanttView` accidentally touched | None | High | These files are not in scope; grep verification after completion confirms zero changes |
| Unused lucide icon imports cause lint warnings | Low | Low | Each phase explicitly checks and removes the associated icon import |

---

## Phase Summary

| Phase | Files Changed | Deletions | Type |
|---|---|---|---|
| 1 — Delete core files | 4 | 790 LOC | Delete |
| 2 — Type system + routing | 3 (`types/index.ts`, `urlState.ts`, `createUiSlice.ts`) | ~5 lines | Edit |
| 3 — ActiveViewStage | 1 | ~8 lines | Edit |
| 4 — Navigation entry points | 5 (`navConfig`, `Sidebar`, `hotkeys`, `CommandPalette`, `MoreAppsMenu`) | ~15 lines | Edit |
| 5 — Modal copy | 2 (`HelpDocsModal`, `UpgradeModal`) | ~8 lines | Edit |

**Net change: −790 LOC (deleted) − ~36 LOC (removed references) = −826 LOC total**
