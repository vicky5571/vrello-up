# Unified Projects Work Item Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Eliminate runtime HTTP 400 errors and corrupt dummy data during work item creation from Projects views by delegating creation to the original, official Marcom Hub creation modals (`ContentPostModal`, `EventFormModal`, `PlacementFormModal`) hosted inside a reusable `ProjectsCreateModalHost`.

**Architecture:** Create `ProjectsCreateModalHost.tsx` mirroring `ProjectsDetailDrawerHost.tsx`. The host lazily imports each entity's native Marcom modal, hydrates it with caller context (pre-selected date from Calendar, target workflow status from Board), handles submission and Zustand store cache invalidation, and closes seamlessly. Update `ProjectsCalendarView`, `ProjectsBoardView`, and `ProjectsListView` to trigger this host instead of performing blind HTTP mutations.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Zustand 5, Sonner toast, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-projects-work-item-create-modals-design.md`

## Global Constraints

- Coordinator files must remain strictly $\le 250$ LOC (`ProjectsCreateModalHost.tsx`, `ProjectsCalendarView.tsx`, `ProjectsBoardView.tsx`, `ProjectsListView.tsx`, `ProjectsBoardColumn.tsx`).
- Single Source of Truth: All domain entities must be imported from `src/types/index.ts`. No duplicate domain models.
- Zero raw `any` types without explicit `// @ts-expect-error: <reason>`.
- All verification gates (`npm run drift:check`, `npm run build:check`, `npm test`) must pass with 0 errors.

---

### Task 1: Create `createModalHelpers.ts` and Unit Tests

**Files:**
- Create: `src/components/views/ProjectsView/createModalHelpers.ts`
- Create: `src/components/views/ProjectsView/createModalHelpers.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  import type { MarcomWorkItemType, ProjectsColumn, MarcomPlacement } from "@/types";

  export interface CreateWorkItemRequest {
    type: MarcomWorkItemType;
    date?: string;
    status?: string;
    branchId?: string;
    outletId?: string;
  }

  export function sanitizeDateInput(dateStr?: string | null): string;
  export function resolveInitialStatus(type: MarcomWorkItemType, column?: ProjectsColumn): string | undefined;
  export function getInitialPlacementPayload(request: CreateWorkItemRequest): Partial<MarcomPlacement>;
  ```

- [x] **Step 1: Write failing test in `src/components/views/ProjectsView/createModalHelpers.test.ts`**

```typescript
// src/components/views/ProjectsView/createModalHelpers.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeDateInput,
  resolveInitialStatus,
  getInitialPlacementPayload,
  type CreateWorkItemRequest,
} from "./createModalHelpers";

describe("createModalHelpers: sanitizeDateInput", () => {
  it("formats valid date string to YYYY-MM-DD", () => {
    assert.equal(sanitizeDateInput("2026-11-15"), "2026-11-15");
    assert.equal(sanitizeDateInput("2026-11-15T10:00:00Z"), "2026-11-15");
  });

  it("falls back to today's date when input is null, undefined, or invalid", () => {
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(sanitizeDateInput(null), today);
    assert.equal(sanitizeDateInput(undefined), today);
    assert.equal(sanitizeDateInput("invalid-date"), today);
  });
});

describe("createModalHelpers: resolveInitialStatus", () => {
  it("maps board columns to correct entity status", () => {
    assert.equal(resolveInitialStatus("content", "To Do"), "DRAFT");
    assert.equal(resolveInitialStatus("content", "In Review"), "IN_REVIEW");
    assert.equal(resolveInitialStatus("event", "To Do"), "UPCOMING");
    assert.equal(resolveInitialStatus("event", "In Progress"), "ON_PROGRESS");
    assert.equal(resolveInitialStatus("placement", "To Do"), "NOT_STARTED");
    assert.equal(resolveInitialStatus("placement", "In Progress"), "ON_PROGRESS");
    assert.equal(resolveInitialStatus("placement", "Blocked"), "ISSUE");
  });

  it("returns default fallback when column is omitted or unsupported", () => {
    assert.equal(resolveInitialStatus("content"), "SCHEDULED");
    assert.equal(resolveInitialStatus("event"), "UPCOMING");
    assert.equal(resolveInitialStatus("placement"), "NOT_STARTED");
  });
});

describe("createModalHelpers: getInitialPlacementPayload", () => {
  it("constructs valid placement payload avoiding invalid PLANNED status", () => {
    const req: CreateWorkItemRequest = {
      type: "placement",
      date: "2026-12-01",
      status: "ON_PROGRESS",
    };
    const payload = getInitialPlacementPayload(req);
    assert.equal(payload.status, "ON_PROGRESS");
    assert.equal(payload.date, "2026-12-01");
  });

  it("defaults placement status strictly to NOT_STARTED when unmapped", () => {
    const req: CreateWorkItemRequest = { type: "placement" };
    const payload = getInitialPlacementPayload(req);
    assert.equal(payload.status, "NOT_STARTED");
    assert.ok(payload.date);
  });
});
```

- [x] **Step 2: Run test to verify failure**

Run: `node --test --import ./test/register-alias.mjs src/components/views/ProjectsView/createModalHelpers.test.ts`  
Expected: FAIL with `Cannot find module './createModalHelpers'`

- [x] **Step 3: Implement `src/components/views/ProjectsView/createModalHelpers.ts`**

```typescript
// src/components/views/ProjectsView/createModalHelpers.ts
import type {
  MarcomWorkItemType,
  ProjectsColumn,
  MarcomPlacement,
  PlacementStatus,
  PostStatus,
  EventStatus,
} from "@/types";
import { mapColumnToStatus } from "@/lib/marcom/workItems";

export interface CreateWorkItemRequest {
  type: MarcomWorkItemType;
  date?: string;
  status?: string;
  branchId?: string;
  outletId?: string;
}

/**
 * Returns a clean YYYY-MM-DD date string. Falls back to today's ISO date.
 */
export function sanitizeDateInput(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      return new Date().toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Resolves initial status for new work item based on target column or sensible default.
 */
export function resolveInitialStatus(
  type: MarcomWorkItemType,
  column?: ProjectsColumn,
): string {
  if (column) {
    const mapped = mapColumnToStatus(type, column);
    if (mapped) return mapped;
  }

  if (type === "content") return "SCHEDULED";
  if (type === "event") return "UPCOMING";
  return "NOT_STARTED";
}

/**
 * Prepares initial Partial<MarcomPlacement> ensuring status is strictly valid in the state machine.
 */
export function getInitialPlacementPayload(
  request: CreateWorkItemRequest,
): Partial<MarcomPlacement> {
  const validPlacementStatuses: PlacementStatus[] = [
    "NOT_STARTED",
    "ON_PROGRESS",
    "DONE",
    "ISSUE",
  ];

  const targetStatus =
    request.status && validPlacementStatuses.includes(request.status as PlacementStatus)
      ? (request.status as PlacementStatus)
      : "NOT_STARTED";

  return {
    status: targetStatus,
    date: sanitizeDateInput(request.date),
    outletId: request.outletId,
  };
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `node --test --import ./test/register-alias.mjs src/components/views/ProjectsView/createModalHelpers.test.ts`  
Expected: PASS (3 suites, 7 passed)

- [x] **Step 5: Commit Task 1**

```bash
git add src/components/views/ProjectsView/createModalHelpers.ts src/components/views/ProjectsView/createModalHelpers.test.ts
git commit -m "feat(projects): create pure helpers for work item creation context"
```

---

### Task 2: Build `ProjectsCreateModalHost.tsx` Component

**Files:**
- Create: `src/components/views/ProjectsView/ProjectsCreateModalHost.tsx`

**Interfaces:**
- Consumes:
  - `CreateWorkItemRequest` from `./createModalHelpers`
  - `useMarcomDataStore` (`branches`, `outlets`, `materials`, `mous`, `fetchPosts`, `fetchEvents`, `fetchPlacements`)
  - `useWorkspaceStore` (`users`)
  - `ContentPostModal`, `EventFormModal`, `PlacementFormModal`
- Produces:
  ```typescript
  export interface ProjectsCreateModalHostProps {
    createRequest: CreateWorkItemRequest | null;
    onClose: () => void;
    onRefresh?: () => Promise<void> | void;
  }
  export function ProjectsCreateModalHost(props: ProjectsCreateModalHostProps): React.JSX.Element | null;
  ```

- [x] **Step 1: Implement `src/components/views/ProjectsView/ProjectsCreateModalHost.tsx`**

Ensure file stays strictly $\le 250$ LOC (~190 LOC):

```tsx
// src/components/views/ProjectsView/ProjectsCreateModalHost.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import type {
  MarcomPlacement,
  PostPlatform,
  PostFormat,
  PostStatus,
  FieldEventItem,
} from "@/types";
import {
  type CreateWorkItemRequest,
  sanitizeDateInput,
  getInitialPlacementPayload,
} from "./createModalHelpers";

const ContentPostModal = dynamic(
  () =>
    import("@/components/views/ContentPlannerView/ContentPostModal").then(
      (m) => m.ContentPostModal,
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

const PlacementFormModal = dynamic(
  () =>
    import("@/components/views/PlacementsView/PlacementFormModal").then(
      (m) => m.PlacementFormModal,
    ),
  { ssr: false },
);

export interface ProjectsCreateModalHostProps {
  createRequest: CreateWorkItemRequest | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
}

export function ProjectsCreateModalHost({
  createRequest,
  onClose,
  onRefresh,
}: ProjectsCreateModalHostProps) {
  const branches = useMarcomDataStore((s) => s.branches);
  const outletsList = useMarcomDataStore((s) => s.outlets);
  const materialsList = useMarcomDataStore((s) => s.materials);
  const mousList = useMarcomDataStore((s) => s.mous);
  const placements = useMarcomDataStore((s) => s.placements);
  const members = useWorkspaceStore((s) => s.users);

  const fetchPosts = useMarcomDataStore((s) => s.fetchPosts);
  const fetchEvents = useMarcomDataStore((s) => s.fetchEvents);
  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);

  // Content Post Form State
  const [contentTitle, setContentTitle] = useState("");
  const [contentPlatform, setContentPlatform] = useState<PostPlatform>("instagram");
  const [contentFormat, setContentFormat] = useState<PostFormat>("single");
  const [contentPublishDate, setContentPublishDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [contentStatus, setContentStatus] = useState<PostStatus>("SCHEDULED");
  const [contentCaption, setContentCaption] = useState("");
  const [contentMediaUrl, setContentMediaUrl] = useState("");
  const [contentOutletId, setContentOutletId] = useState("");
  const [contentRevisionNotes, setContentRevisionNotes] = useState("");
  const [isContentSaving, setIsContentSaving] = useState(false);

  // Placement Form State
  const [placementData, setPlacementData] =
    useState<Partial<MarcomPlacement> | null>(null);
  const [isPlacementSaving, setIsPlacementSaving] = useState(false);

  // Drive Picker for Content
  const { openSelector, isModalOpen: isDriveModalOpen, closeModal: closeDriveModal, handleManualAttach } =
    useGoogleDrivePicker();

  // Reset & initialize state whenever createRequest changes
  useEffect(() => {
    if (!createRequest) {
      setPlacementData(null);
      return;
    }

    const initialDate = sanitizeDateInput(createRequest.date);

    if (createRequest.type === "content") {
      setContentTitle("");
      setContentPlatform("instagram");
      setContentFormat("single");
      setContentPublishDate(initialDate);
      setContentStatus((createRequest.status as PostStatus) || "SCHEDULED");
      setContentCaption("");
      setContentMediaUrl("");
      setContentOutletId(createRequest.outletId || "");
      setContentRevisionNotes("");
    } else if (createRequest.type === "placement") {
      setPlacementData(getInitialPlacementPayload(createRequest));
    }
  }, [createRequest]);

  // Handle Content Post Submission
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim()) {
      toast.error("Judul postingan wajib diisi");
      return;
    }

    setIsContentSaving(true);
    try {
      const res = await fetch("/api/marcom/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contentTitle.trim(),
          platform: contentPlatform,
          format: contentFormat,
          publishDate: new Date(contentPublishDate).toISOString(),
          status: contentStatus,
          caption: contentCaption,
          mediaUrl: contentMediaUrl,
          outletId: contentOutletId || undefined,
          revisionNotes: contentRevisionNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat konten baru");
      }

      toast.success(`Postingan "${contentTitle}" berhasil dijadwalkan`);
      await fetchPosts();
      await onRefresh?.();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat konten");
    } finally {
      setIsContentSaving(false);
    }
  };

  // Handle Event Saved Callback
  const handleEventSaved = async (saved: FieldEventItem) => {
    toast.success(`Event "${saved.name}" berhasil dibuat`);
    await fetchEvents();
    await onRefresh?.();
    onClose();
  };

  // Handle Placement Submission
  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placementData?.outletId || !placementData?.materialId) {
      toast.error("Pilih outlet dan materi POSM terlebih dahulu");
      return;
    }

    setIsPlacementSaving(true);
    try {
      const res = await fetch("/api/marcom/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(placementData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat placement baru");
      }

      toast.success("Penempatan POSM berhasil didaftarkan");
      await fetchPlacements();
      await onRefresh?.();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat placement");
    } finally {
      setIsPlacementSaving(false);
    }
  };

  if (!createRequest) return null;

  return (
    <>
      {createRequest.type === "content" && (
        <ContentPostModal
          isOpen={true}
          onClose={onClose}
          onSave={handleSaveContent}
          isSaving={isContentSaving}
          title={contentTitle}
          setTitle={setContentTitle}
          platform={contentPlatform}
          setPlatform={setContentPlatform}
          format={contentFormat}
          setFormat={setContentFormat}
          publishDate={contentPublishDate}
          setPublishDate={setContentPublishDate}
          status={contentStatus}
          setStatus={setContentStatus}
          caption={contentCaption}
          setCaption={setContentCaption}
          outletId={contentOutletId}
          setOutletId={setContentOutletId}
          mediaUrl={contentMediaUrl}
          setMediaUrl={setContentMediaUrl}
          revisionNotes={contentRevisionNotes}
          setRevisionNotes={setContentRevisionNotes}
          onOpenDriveSelector={() => openSelector({ defaultKind: "video" })}
        />
      )}

      {createRequest.type === "event" && (
        <EventFormModal
          isOpen={true}
          onClose={onClose}
          event={null}
          defaultDate={sanitizeDateInput(createRequest.date)}
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          members={members}
          onSaved={handleEventSaved}
        />
      )}

      {createRequest.type === "placement" && placementData && (
        <PlacementFormModal
          placement={placementData}
          setPlacement={setPlacementData}
          onClose={onClose}
          onSave={handleSavePlacement}
          isSaving={isPlacementSaving}
          outletsList={outletsList}
          materialsList={materialsList}
          mousList={mousList}
          placements={placements}
        />
      )}

      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
      />
    </>
  );
}
```

- [x] **Step 2: Run build check to verify TypeScript compilation**

Run: `npm run build:check`  
Expected: PASS (0 errors)

- [x] **Step 3: Check LOC limit of `ProjectsCreateModalHost.tsx`**

Run: `wc -l src/components/views/ProjectsView/ProjectsCreateModalHost.tsx`  
Expected: $\le 250$ LOC (~220 LOC)

- [x] **Step 4: Commit Task 2**

```bash
git add src/components/views/ProjectsView/ProjectsCreateModalHost.tsx
git commit -m "feat(projects): create ProjectsCreateModalHost integrating original Marcom add forms"
```

---

### Task 3: Integrate `ProjectsCreateModalHost` into Calendar View

**Files:**
- Modify: `src/components/views/ProjectsView/ProjectsCalendarView.tsx`
- Modify: `src/components/views/ProjectsView/useProjectsCalendar.ts`

- [x] **Step 1: Update `ProjectsCalendarView.tsx`**

In `src/components/views/ProjectsView/ProjectsCalendarView.tsx`:
1. Add `createRequest` state: `const [createRequest, setCreateRequest] = useState<CreateWorkItemRequest | null>(null);`.
2. When `CalendarCreatePopover` triggers `onCreateType(type, dateStr)`, call `setCreateRequest({ type, date: dateStr })`.
3. Mount `<ProjectsCreateModalHost createRequest={createRequest} onClose={() => setCreateRequest(null)} onRefresh={loadData} />`.
4. Clean up old `handleCreateType` dependency.

- [x] **Step 2: Clean up `useProjectsCalendar.ts`**

Remove the hacky `handleCreateType` function that made blind POST requests with dummy data and `status: "PLANNED"`.

- [x] **Step 3: Run build check and smoke tests**

Run: `npm run build:check && npm run test:smoke`  
Expected: PASS

- [x] **Step 4: Commit Task 3**

```bash
git add src/components/views/ProjectsView/ProjectsCalendarView.tsx src/components/views/ProjectsView/useProjectsCalendar.ts
git commit -m "fix(projects): wire ProjectsCalendarView to ProjectsCreateModalHost with original add forms"
```

---

### Task 4: Integrate `ProjectsCreateModalHost` into Board View & Decompose `ProjectsBoardColumn.tsx`

**Files:**
- Modify: `src/components/views/ProjectsView/ProjectsBoardView.tsx`
- Modify: `src/components/views/ProjectsView/ProjectsBoardColumn.tsx`
- Modify: `src/components/views/ProjectsView/useProjectsBoard.ts`

- [x] **Step 1: Update `ProjectsBoardColumn.tsx`**

In `src/components/views/ProjectsView/ProjectsBoardColumn.tsx`:
Replace the inline title input form with a clean dropdown / popover menu that lets the user choose "+ Content Post", "+ Field Event", or "+ Media Placement".
Calling `onInitiateCreate?.(type, column)` invokes the parent modal.
This eliminates ~35 LOC from `ProjectsBoardColumn.tsx`, reducing it from 267 down to $\le 240$ LOC.

- [x] **Step 2: Update `ProjectsBoardView.tsx` and `useProjectsBoard.ts`**

In `ProjectsBoardView.tsx`:
1. Add `createRequest` state.
2. Pass `onInitiateCreate={(type, column) => setCreateRequest({ type, status: mapColumnToStatus(type, column) || undefined })}` to each column.
3. Mount `<ProjectsCreateModalHost createRequest={createRequest} onClose={() => setCreateRequest(null)} onRefresh={loadData} />`.
4. Remove defunct `handleQuickCreate` from `useProjectsBoard.ts`.

- [x] **Step 3: Run build check and smoke tests**

Run: `npm run build:check && npm run test:smoke`  
Expected: PASS

- [x] **Step 4: Commit Task 4**

```bash
git add src/components/views/ProjectsView/ProjectsBoardView.tsx src/components/views/ProjectsView/ProjectsBoardColumn.tsx src/components/views/ProjectsView/useProjectsBoard.ts
git commit -m "fix(projects): wire ProjectsBoardView to ProjectsCreateModalHost and reduce ProjectsBoardColumn LOC"
```

---

### Task 5: Integrate `ProjectsCreateModalHost` into List View

**Files:**
- Modify: `src/components/views/ProjectsView/ProjectsListView.tsx`
- Modify: `src/components/views/ProjectsView/ProjectsListHeader.tsx`
- Modify: `src/components/views/ProjectsView/ProjectsListTable.tsx`
- Modify: `src/components/views/ProjectsView/useProjectsList.ts`

- [x] **Step 1: Add "+ New Work Item" trigger to `ProjectsListHeader.tsx` and `ProjectsListTable.tsx`**

Allow users in List View to select the work item type to add (or auto-detect type when grouped by `type`).

- [x] **Step 2: Connect `ProjectsListView.tsx` to `ProjectsCreateModalHost`**

Mount `<ProjectsCreateModalHost createRequest={createRequest} onClose={() => setCreateRequest(null)} onRefresh={loadData} />`.
Remove defunct `handleQuickAddInGroup` from `useProjectsList.ts`.

- [x] **Step 3: Run build check and smoke tests**

Run: `npm run build:check && npm run test:smoke`  
Expected: PASS

- [x] **Step 4: Commit Task 5**

```bash
git add src/components/views/ProjectsView/ProjectsListView.tsx src/components/views/ProjectsView/ProjectsListHeader.tsx src/components/views/ProjectsView/ProjectsListTable.tsx src/components/views/ProjectsView/useProjectsList.ts
git commit -m "fix(projects): wire ProjectsListView to ProjectsCreateModalHost"
```

---

### Task 6: Run Full Verification Gates & Update Documentation

**Files:**
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/plans/README.md`
- Modify: `docs/SESSION_STATE.md`

- [x] **Step 1: Run drift check**

Run: `npm run drift:check`  
Expected: `✅ No drift detected. All invariants pass.`

- [x] **Step 2: Run smoke tests**

Run: `npm run test:smoke`  
Expected: `ℹ pass 85, fail 0`

- [x] **Step 3: Run full test suite**

Run: `npm test`  
Expected: `ℹ pass 613+ (0 failures)`

- [x] **Step 4: Run production build check**

Run: `npm run build:check`  
Expected: `0 TypeScript errors`

- [x] **Step 5: Verify LOC limits across all touched files**

Run: `wc -l src/components/views/ProjectsView/ProjectsCreateModalHost.tsx src/components/views/ProjectsView/ProjectsBoardColumn.tsx src/components/views/ProjectsView/ProjectsBoardView.tsx src/components/views/ProjectsView/ProjectsListView.tsx src/components/views/ProjectsView/ProjectsCalendarView.tsx`  
Expected: All files strictly $\le 250$ LOC.

- [x] **Step 6: Update documentation indexes and session state**

Update:
- `docs/superpowers/specs/README.md`
- `docs/superpowers/plans/README.md`
- `docs/SESSION_STATE.md`

- [x] **Step 7: Commit documentation updates**

```bash
git add docs/superpowers/specs/README.md docs/superpowers/plans/README.md docs/SESSION_STATE.md
git commit -m "docs: document unified Projects work item creation via original Marcom Hub forms"
```

