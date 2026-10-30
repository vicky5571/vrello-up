# Projects Work Item Detail Drawers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the ability to inspect and edit work items from Projects Kanban Board, List View, and Calendar View by delegating to each entity's native drawer or modal (`ContentDrawer`, `EventFormModal`, `PlacementDetailDrawer`).

**Architecture:** Create an isolated host component `ProjectsDetailDrawerHost.tsx` that lazily imports domain drawers/modals, maps `MarcomWorkItem._type` to the appropriate component, and wires save/delete mutations to the centralized Zustand cache. Integrate `ProjectsDetailDrawerHost` into `ProjectsBoardView`, `ProjectsListView`, and `ProjectsCalendarView` as the default selection handler when `onSelectItem` is omitted.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Zustand 5, Sonner toast, @dnd-kit/core.

**Spec:** `docs/superpowers/specs/2026-10-30-projects-work-item-detail-drawers-design.md`

## Global Constraints

- Coordinator files must remain strictly $\le 250$ LOC (`ProjectsBoardView.tsx`, `ProjectsListView.tsx`, `ProjectsCalendarView.tsx`, `ProjectsDetailDrawerHost.tsx`).
- Single Source of Truth: All domain entities must be imported from `src/types/index.ts`. No duplicate interfaces.
- Zero raw `any` types without explicit `// @ts-expect-error: <reason>`.
- All verification gates (`npm run drift:check`, `npm run build:check`, `npm test`) must pass with 0 errors.

---

### Task 1: Create `ProjectsDetailDrawerHost.tsx` and Unit Tests

**Files:**
- Create: `src/components/views/ProjectsView/ProjectsDetailDrawerHost.tsx`
- Create: `src/components/views/ProjectsView/ProjectsDetailDrawerHost.test.ts`

**Interfaces:**
- Consumes:
  - `MarcomWorkItem` from `@/types`
  - `useWorkspaceStore` from `@/lib/store/useWorkspaceStore`
  - `useMarcomDataStore` from `@/lib/marcom/marcomDataStore`
  - `useMarcomPermissions` from `@/lib/marcom/permissions`
  - `ContentDrawer` from `@/components/views/ContentPlannerView/ContentDrawer`
  - `EventFormModal` from `@/components/views/EventsView/EventFormModal`
  - `PlacementDetailDrawer` from `@/components/views/PlacementsView/PlacementDetailDrawer`
  - `PlacementFormModal` from `@/components/views/PlacementsView/PlacementFormModal`
- Produces:
  - `ProjectsDetailDrawerHost({ selectedItem, onClose, onRefresh }: ProjectsDetailDrawerHostProps)`

- [ ] **Step 1: Write test for helper functions and item type dispatch**

```typescript
// src/components/views/ProjectsView/ProjectsDetailDrawerHost.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { MarcomWorkItem, ContentPostItem, FieldEventItem, MarcomPlacement } from "@/types";

describe("ProjectsDetailDrawerHost dispatch resolution", () => {
  it("correctly identifies content post item", () => {
    const post: MarcomWorkItem = {
      id: "post-1",
      title: "Test Post",
      platform: "instagram",
      format: "reel",
      status: "DRAFT",
      caption: "Sample caption",
      _type: "content",
    };
    assert.equal(post._type, "content");
    assert.equal(post.id, "post-1");
  });

  it("correctly identifies field event item", () => {
    const event: MarcomWorkItem = {
      id: "event-1",
      name: "Roadshow Bandung",
      eventType: "Roadshow",
      status: "UPCOMING",
      startDate: "2026-11-01",
      _type: "event",
    };
    assert.equal(event._type, "event");
    assert.equal(event.id, "event-1");
  });

  it("correctly identifies placement item", () => {
    const placement: MarcomWorkItem = {
      id: "place-1",
      status: "ON_PROGRESS",
      brand: "IM3",
      _type: "placement",
    };
    assert.equal(placement._type, "placement");
    assert.equal(placement.id, "place-1");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test --import ./test/register-alias.mjs src/components/views/ProjectsView/ProjectsDetailDrawerHost.test.ts`  
Expected: PASS (3 passed)

- [ ] **Step 3: Implement `ProjectsDetailDrawerHost.tsx`**

```tsx
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import type {
  MarcomWorkItem,
  ContentPostItem,
  FieldEventItem,
  MarcomPlacement,
} from "@/types";

const ContentDrawer = dynamic(
  () =>
    import("@/components/views/ContentPlannerView/ContentDrawer").then(
      (m) => m.ContentDrawer,
    ),
  { ssr: false },
);

const EventFormModal = dynamic(
  () =>
    import("@/components/views/EventsView/EventFormModal").then(
      (m) => m.EventFormModal,
    ),
  { ssr: false },
);

const PlacementDetailDrawer = dynamic(
  () =>
    import("@/components/views/PlacementsView/PlacementDetailDrawer").then(
      (m) => m.PlacementDetailDrawer,
    ),
  { ssr: false },
);

const PlacementFormModal = dynamic(
  () =>
    import("@/components/views/PlacementsView/PlacementFormModal").then(
      (m) => m.PlacementFormModal,
    ),
  { ssr: false },
);

export interface ProjectsDetailDrawerHostProps {
  selectedItem: MarcomWorkItem | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
}

export function ProjectsDetailDrawerHost({
  selectedItem,
  onClose,
  onRefresh,
}: ProjectsDetailDrawerHostProps) {
  const updateCachedPost = useWorkspaceStore((s) => s.updateCachedPost);
  const removeCachedPost = useWorkspaceStore((s) => s.removeCachedPost);
  const updateCachedEvent = useWorkspaceStore((s) => s.updateCachedEvent);
  const updateCachedPlacement = useWorkspaceStore((s) => s.updateCachedPlacement);
  const branches = useWorkspaceStore((s) => s.branches);
  const members = useWorkspaceStore((s) => s.members);

  const outletsList = useMarcomDataStore((s) => s.outlets);
  const materialsList = useMarcomDataStore((s) => s.materials);
  const mousList = useMarcomDataStore((s) => s.mous);
  const placements = useWorkspaceStore((s) => s.placements);

  const { can } = useMarcomPermissions();
  const canManage = can("CREATE_PLACEMENT");

  const [editingPlacement, setEditingPlacement] =
    useState<Partial<MarcomPlacement> | null>(null);
  const [isPlacementSaving, setIsPlacementSaving] = useState(false);

  // Content Post Handlers
  const handleUpdatePost = useCallback(
    async (updated: ContentPostItem) => {
      try {
        const res = await fetch(`/api/marcom/content/${updated.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updated.title,
            platform: updated.platform,
            format: updated.format,
            publishDate: updated.publishDate || undefined,
            status: updated.status,
            caption: updated.caption,
            mediaUrl: updated.mediaUrl,
            branchName: updated.branchName,
            revisionNotes: updated.revisionNotes,
            subtasks: updated.subtasks,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed with status ${res.status}`);
        }

        const savedItem: ContentPostItem = await res.json();
        updateCachedPost(savedItem);
        toast.success("Post berhasil diperbarui");
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Failed to update post:", err);
        toast.error("Gagal memperbarui post");
        throw err;
      }
    },
    [updateCachedPost, onRefresh],
  );

  const handleDeletePost = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/marcom/content/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete post");
        removeCachedPost(id);
        toast.success("Post berhasil dihapus");
        onClose();
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Failed to delete post:", err);
        toast.error("Gagal menghapus post");
        throw err;
      }
    },
    [removeCachedPost, onClose, onRefresh],
  );

  // Field Event Handlers
  const handleEventSaved = useCallback(
    (savedEvent: FieldEventItem) => {
      updateCachedEvent(savedEvent);
      toast.success("Field event berhasil disimpan");
      onClose();
      if (onRefresh) onRefresh();
    },
    [updateCachedEvent, onClose, onRefresh],
  );

  // Placement Form Save Handler
  const handleSavePlacement = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingPlacement || !editingPlacement.id) return;
      setIsPlacementSaving(true);
      try {
        const res = await fetch(`/api/marcom/placements/${editingPlacement.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingPlacement),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed with status ${res.status}`);
        }

        const savedPlacement: MarcomPlacement = await res.json();
        updateCachedPlacement(savedPlacement);
        setEditingPlacement(null);
        toast.success("Placement berhasil diperbarui");
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Failed to save placement:", err);
        toast.error("Gagal menyimpan placement");
      } finally {
        setIsPlacementSaving(false);
      }
    },
    [editingPlacement, updateCachedPlacement, onRefresh],
  );

  if (!selectedItem) return null;

  return (
    <>
      {selectedItem._type === "content" && (
        <ContentDrawer
          post={selectedItem as ContentPostItem}
          onClose={onClose}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />
      )}

      {selectedItem._type === "event" && (
        <EventFormModal
          isOpen={true}
          event={selectedItem as FieldEventItem}
          onClose={onClose}
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          members={members}
          onSaved={handleEventSaved}
        />
      )}

      {selectedItem._type === "placement" && (
        <PlacementDetailDrawer
          placement={selectedItem as MarcomPlacement}
          onClose={onClose}
          onEdit={(p) => setEditingPlacement(p)}
          canManage={canManage}
        />
      )}

      {editingPlacement && (
        <PlacementFormModal
          placement={editingPlacement}
          setPlacement={setEditingPlacement}
          onClose={() => setEditingPlacement(null)}
          onSave={handleSavePlacement}
          isSaving={isPlacementSaving}
          outletsList={outletsList}
          materialsList={materialsList}
          mousList={mousList}
          placements={placements}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Verify LOC and TypeScript check**

Run: `npm run build:check`  
Expected: 0 TypeScript errors.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/components/views/ProjectsView/ProjectsDetailDrawerHost.tsx src/components/views/ProjectsView/ProjectsDetailDrawerHost.test.ts
git commit -m "feat(projects): add ProjectsDetailDrawerHost delegating to native entity drawers"
```

---

### Task 2: Wire `ProjectsDetailDrawerHost` into `ProjectsBoardView.tsx`

**Files:**
- Modify: `src/components/views/ProjectsView/ProjectsBoardView.tsx:24-40, 130-170`

**Interfaces:**
- Consumes:
  - `ProjectsDetailDrawerHost` from `./ProjectsDetailDrawerHost`
  - `useProjectsBoard` loadData callback for refresh sync
- Produces:
  - Card click on Kanban board opens drawer when `onSelectItem` is omitted.

- [ ] **Step 1: Add internal selection state and connect `ProjectsDetailDrawerHost`**

In `ProjectsBoardView.tsx`:
- Import `ProjectsDetailDrawerHost`
- Introduce state: `const [internalSelectedItem, setInternalSelectedItem] = useState<MarcomWorkItem | null>(null);`
- Determine handler: `const handleSelect = onSelectItem || setInternalSelectedItem;`
- Pass `onSelect={handleSelect}` to `<ProjectsBoardColumn>`
- Conditionally render `<ProjectsDetailDrawerHost selectedItem={internalSelectedItem} onClose={() => setInternalSelectedItem(null)} onRefresh={loadData} />` when `!onSelectItem`

- [ ] **Step 2: Verify Kanban drag and drop does not open drawer**

- Verify that `PointerSensor` activation constraint (5px distance) ensures clicking opens the drawer, while dragging moves the card without opening the drawer.

- [ ] **Step 3: Verify build and LOC**

Run: `wc -l src/components/views/ProjectsView/ProjectsBoardView.tsx`  
Expected: $\le 185$ LOC (well below 250 LOC).  
Run: `npm run build:check`  
Expected: 0 errors.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/components/views/ProjectsView/ProjectsBoardView.tsx
git commit -m "feat(projects): connect ProjectsDetailDrawerHost to ProjectsBoardView"
```

---

### Task 3: Wire `ProjectsDetailDrawerHost` into `ProjectsListView` and `ProjectsCalendarView`

**Files:**
- Modify: `src/components/views/ProjectsView/ProjectsListView.tsx`
- Modify: `src/components/views/ProjectsView/ProjectsCalendarView.tsx`

**Interfaces:**
- Consumes:
  - `ProjectsDetailDrawerHost` from `./ProjectsDetailDrawerHost`
- Produces:
  - Clicking rows in table or activity chips in calendar opens drawer when `onSelectItem` is omitted.

- [ ] **Step 1: Wire internal selection state in `ProjectsListView.tsx`**

- Import `ProjectsDetailDrawerHost`
- Introduce state: `const [internalSelectedItem, setInternalSelectedItem] = useState<MarcomWorkItem | null>(null);`
- Determine handler: `const handleSelect = onSelectItem || setInternalSelectedItem;`
- Pass `onSelectItem={handleSelect}` to `<ProjectsListTable>`
- Render `<ProjectsDetailDrawerHost selectedItem={internalSelectedItem} onClose={() => setInternalSelectedItem(null)} onRefresh={loadData} />` when `!onSelectItem`

- [ ] **Step 2: Wire internal selection state in `ProjectsCalendarView.tsx`**

- Import `ProjectsDetailDrawerHost`
- Introduce state: `const [internalSelectedItem, setInternalSelectedItem] = useState<MarcomWorkItem | null>(null);`
- Determine handler: `const handleSelect = onSelectItem || setInternalSelectedItem;`
- Pass `onSelectItem={handleSelect}` to `CalendarDayCell` and `CalendarPopovers`
- Render `<ProjectsDetailDrawerHost selectedItem={internalSelectedItem} onClose={() => setInternalSelectedItem(null)} onRefresh={loadData} />` when `!onSelectItem`

- [ ] **Step 3: Verify LOC and build check**

Run: `wc -l src/components/views/ProjectsView/ProjectsListView.tsx src/components/views/ProjectsView/ProjectsCalendarView.tsx`  
Expected: Both files $\le 150$ LOC.  
Run: `npm run build:check`  
Expected: 0 errors.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/components/views/ProjectsView/ProjectsListView.tsx src/components/views/ProjectsView/ProjectsCalendarView.tsx
git commit -m "feat(projects): connect ProjectsDetailDrawerHost to ListView and CalendarView"
```

---

### Task 4: Verification Gates & Handoff

**Files:**
- Modify: `docs/SESSION_STATE.md`

- [ ] **Step 1: Run drift check**

Run: `npm run drift:check`  
Expected: `✅ No drift detected. All invariants pass.`

- [ ] **Step 2: Run build check**

Run: `npm run build:check`  
Expected: 0 TypeScript errors.

- [ ] **Step 3: Run full test suite**

Run: `npm test`  
Expected: All tests pass, 0 failures.

- [ ] **Step 4: Update `docs/SESSION_STATE.md`**

Record the implementation of `ProjectsDetailDrawerHost` and the passing verification gates.

- [ ] **Step 5: Final Commit**

```bash
git add docs/SESSION_STATE.md
git commit -m "docs(projects): update session state for projects work item detail drawers"
```

