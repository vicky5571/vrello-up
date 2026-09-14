# Separate Content Planner and Field Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely separate Social Media ("Content Planner") and On-Ground Activations ("Field Events") across database models, REST APIs, and UI components into dedicated, modular workflows with independent schemas and KPI tracking.

**Architecture:** Replace the polymorphic `MarcomEvent` table with two specialized models: `ContentPost` (social digital planner) and `FieldEvent` (on-ground physical activations). Break down the monolithic `EventsView.tsx` (>2,200 lines) into two focused views: `ContentPlannerView.tsx` (~550 lines) and `FieldEventsView.tsx` (~600 lines), while preserving the dual-context mode switcher, dynamic sidebar, and Target Space & List task routing.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Prisma (PostgreSQL), Zustand 5, Tailwind CSS v4, Lucide React icons, Sonner toast, Node test runner.

**Spec:** [`docs/superpowers/specs/2026-09-14-separate-content-and-field-events-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-14-separate-content-and-field-events-design.md)

---

## Global Constraints

- Menu labels must strictly use: **`Content Planner`** and **`Field Events`** under WORK ITEMS.
- Never dump monolithic logic into `useWorkspaceStore.ts` (follow the Strangler Pattern and modularize logic in `src/lib/marcom/` or `src/lib/tasks/`).
- Preserve dual-persistence: support offline in-memory/localStorage state fallback alongside PostgreSQL Prisma queries.
- Retain the Target Space & List dropdown selector in both modals so activities can route work item tasks to any workspace Space (e.g. `Marketing & Campaigns`, `Design & Product`).
- `npx tsc --noEmit` and `npm test` must pass after every task with 0 errors.

---

### Task 1: Prisma Schema & Domain Types (`ContentPost` and `FieldEvent`)

**Files:**
- Modify: `prisma/schema.prisma:154-184`
- Modify: `src/types/index.ts`
- Test: `src/lib/marcom/contentAndEventsTypes.test.ts`

**Interfaces:**
- Produces: `ContentPost` and `FieldEvent` Prisma models and TypeScript interfaces in `@/types`.
- Consumes: Prisma CLI `npx prisma generate`.

- [ ] **Step 1: Write the failing test for new domain models**

Create `src/lib/marcom/contentAndEventsTypes.test.ts`:
```ts
import test from "node:test";
import assert from "node:assert/strict";
import type { ContentPostItem, FieldEventItem } from "@/types";

test("ContentPostItem has digital social fields without on-ground fields", () => {
  const post: ContentPostItem = {
    id: "post-1",
    title: "Behind-the-scenes Reel",
    platform: "instagram",
    format: "reel",
    publishDate: "2026-09-20T10:00:00.000Z",
    status: "SCHEDULED",
    caption: "Check this out! #Solo",
    mediaUrl: "https://example.com/asset.mp4",
    branchName: "Solo Square",
    picName: "Vicky",
    subtasks: [{ id: "st-1", title: "Record b-roll", completed: false }],
  };
  assert.equal(post.platform, "instagram");
  assert.equal(post.format, "reel");
  assert.equal("attendeeCount" in post, false);
  assert.equal("budget" in post, false);
});

test("FieldEventItem has on-ground logistics fields without social fields", () => {
  const event: FieldEventItem = {
    id: "event-1",
    name: "Grand Opening Expo",
    eventType: "Launch",
    startDate: "2026-10-01T09:00:00.000Z",
    endDate: "2026-10-03T18:00:00.000Z",
    location: "Main Atrium, Solo Paragon",
    branchName: "Solo Paragon",
    picName: "Sarah",
    status: "UPCOMING",
    budget: 25000000,
    targetAttendee: 500,
    attendeeCount: 0,
    notes: "Requires mall sound permit",
    footage: [],
  };
  assert.equal(event.budget, 25000000);
  assert.equal(event.location, "Main Atrium, Solo Paragon");
  assert.equal("postPlatform" in event, false);
  assert.equal("postFormat" in event, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marcom/contentAndEventsTypes.test.ts`
Expected: FAIL due to missing type exports `ContentPostItem` and `FieldEventItem`.

- [ ] **Step 3: Update `prisma/schema.prisma` and `src/types/index.ts`**

In `prisma/schema.prisma`, add `ContentPost` and update `FieldEvent` (aliasing / replacing `MarcomEvent`):
```prisma
model ContentPost {
  id          String    @id @default(cuid())
  title       String
  platform    String
  format      String
  publishDate DateTime?
  status      String    @default("SCHEDULED")
  caption     String    @default("")
  mediaUrl    String    @default("")
  branchName  String    @default("")
  picName     String    @default("")
  subtasks    Json      @default("[]")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([platform])
  @@index([status])
  @@index([publishDate])
}

model FieldEvent {
  id             String         @id @default(cuid())
  name           String
  eventType      String
  startDate      DateTime?
  endDate        DateTime?
  location       String         @default("")
  branchName     String         @default("")
  picName        String         @default("")
  status         EventStatus    @default(UPCOMING)
  budget         Float          @default(0)
  targetAttendee Int            @default(0)
  attendeeCount  Int            @default(0)
  notes          String         @default("")
  footage        EventFootage[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status])
  @@index([startDate])
  @@index([branchName])
}

model EventFootage {
  id       String     @id @default(cuid())
  eventId  String
  event    FieldEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  title    String
  filePath String
  duration String     @default("")
}
```

Run `npx prisma generate`.

In `src/types/index.ts`, add:
```ts
export interface ContentPostItem {
  id: string;
  title: string;
  platform: PostPlatform;
  format: PostFormat;
  publishDate?: string | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  caption?: string;
  mediaUrl?: string;
  branchName?: string;
  picName?: string;
  subtasks?: { id: string; title: string; completed?: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldEventItem {
  id: string;
  name: string;
  eventType: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string;
  branchName?: string;
  picName?: string;
  status: "UPCOMING" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";
  budget: number;
  targetAttendee: number;
  attendeeCount: number;
  notes?: string;
  footage?: { id: string; eventId: string; title: string; filePath: string; duration?: string }[];
  createdAt?: string;
  updatedAt?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/marcom/contentAndEventsTypes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add prisma/schema.prisma src/types/index.ts src/lib/marcom/contentAndEventsTypes.test.ts
git commit -m "feat(schema): add ContentPost and FieldEvent Prisma models and domain types"
```

---

### Task 2: REST API Endpoints for Content Posts and Field Events

**Files:**
- Create: `src/app/api/marcom/content/route.ts`
- Create: `src/app/api/marcom/content/[id]/route.ts`
- Modify: `src/app/api/marcom/events/route.ts`
- Modify: `src/app/api/marcom/events/[id]/route.ts`
- Test: `src/lib/marcom/contentEndpoints.test.ts`

**Interfaces:**
- Produces:
  - `GET /api/marcom/content`: returns `{ total: number, data: ContentPostItem[] }`
  - `POST /api/marcom/content`: accepts `{ title, platform, format, publishDate, caption, mediaUrl, branchName, picName, subtasks }`
  - `PATCH /api/marcom/content/[id]`, `DELETE /api/marcom/content/[id]`
  - `GET /api/marcom/events`: returns `{ total: number, data: FieldEventItem[] }`
  - `POST /api/marcom/events`: accepts `{ name, eventType, startDate, endDate, location, branchName, picName, status, budget, targetAttendee, attendeeCount, notes }`

- [ ] **Step 1: Write test for API route query parameters and payload validation**

Create `src/lib/marcom/contentEndpoints.test.ts` testing URL parameter construction and serialization for both endpoints.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marcom/contentEndpoints.test.ts`

- [ ] **Step 3: Implement `src/app/api/marcom/content/route.ts` and `[id]/route.ts`**

Connect to `prisma.contentPost` with role-checking via `requireMember("ws-main")` and in-memory fallback for test resilience.

- [ ] **Step 4: Update `src/app/api/marcom/events/route.ts` and `[id]/route.ts`**

Update Prisma queries to use `prisma.fieldEvent` (or fallback) with field mapping solely for physical activation fields (`name`, `eventType`, `startDate`, `endDate`, `location`, `branchName`, `picName`, `budget`, `attendeeCount`, `targetAttendee`, `notes`, `footage`).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/marcom/contentEndpoints.test.ts`
Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit changes**

```bash
git add src/app/api/marcom/content/ src/app/api/marcom/events/ src/lib/marcom/contentEndpoints.test.ts
git commit -m "feat(api): add dedicated /api/marcom/content and streamline /api/marcom/events"
```

---

### Task 3: Store & Navigation Routing for "Content Planner" and "Field Events"

**Files:**
- Modify: `src/lib/store/useWorkspaceStore.ts`
- Modify: `src/types/index.ts`
- Test: `src/lib/store/marcomViews.test.ts`

**Interfaces:**
- Produces: Support for `activeView = "content-planner"` and `activeView = "events"` in `useWorkspaceStore`.
- Consumes: `ViewMode = ... | "content-planner" | "events"`.

- [ ] **Step 1: Write unit test for store view switching**

In `src/lib/store/marcomViews.test.ts`, test that:
- Setting `activeView = "content-planner"` sets `appMode = "marcom"` and `lastMarcomView = "content-planner"`.
- Setting `activeView = "events"` sets `appMode = "marcom"` and `lastMarcomView = "events"`.
- `navigateToMarcom("content-planner")` and `navigateToMarcom("events")` resolve correctly.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/store/marcomViews.test.ts`

- [ ] **Step 3: Implement store updates in `src/lib/store/useWorkspaceStore.ts`**

Add `"content-planner"` to `MARCOM_VIEWS` list and ensure auto-synchronization with `appMode = "marcom"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/store/marcomViews.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/store/useWorkspaceStore.ts src/types/index.ts src/lib/store/marcomViews.test.ts
git commit -m "feat(store): add content-planner to activeView and auto-sync in marcom mode"
```

---

### Task 4: Dedicated `ContentPlannerView.tsx` Component

**Files:**
- Create/Refactor: `src/components/views/ContentPlannerView/ContentPlannerView.tsx`
- Consumes: `getWorkspaceSpacesAndLists`, `getDefaultDestinationForChannel` from `@/lib/tasks/targetSpaceList`.

**Features:**
- Header & KPIs: Active Scheduled Posts, Platform Distribution (Instagram, TikTok, YouTube, etc.), Ready to Publish.
- Platform filter pills: All, Instagram, TikTok, YouTube, Facebook, LinkedIn, X.
- Switchable Grid Cards View & Table View.
- Modal "Schedule Content Post" with:
  - Title / Hook
  - Platform & Format selects
  - Publish Date picker
  - Caption / Hashtags textarea with 1-click Copy button
  - Media Thumbnail URL
  - Production Subtasks checklist editor
  - **Target Space & List selector dropdowns** (defaults to `Marketing & Campaigns` $\rightarrow$ `Social & Content Calendar`, with instant option to target `Design & Product` or any other space).
  - Automatically creates execution task in target list upon scheduling.

- [ ] **Step 1: Build `ContentPlannerView.tsx`**
- [ ] **Step 2: Validate with `npx tsc --noEmit`**
- [ ] **Step 3: Commit changes**

```bash
git add src/components/views/ContentPlannerView/ContentPlannerView.tsx
git commit -m "feat(ui): build dedicated ContentPlannerView for social media management"
```

---

### Task 5: Dedicated `FieldEventsView.tsx` Component

**Files:**
- Modify/Refactor: `src/components/views/EventsView/EventsView.tsx` (or extract to `FieldEventsView.tsx` and re-export)
- Consumes: `getWorkspaceSpacesAndLists`, `getDefaultDestinationForChannel` from `@/lib/tasks/targetSpaceList`.

**Features:**
- Header & KPIs: Active Activations, Committed Budget (IDR), Target Attendees, Branch Coverage.
- Status filter chips: Upcoming, On Progress, Completed, Cancelled.
- Switchable Cards View & Table View with columns: Event Name, Type, Branch, Dates, Venue/Location, PIC, Budget (IDR), Attendance progress, Footage.
- Modal "Create Field Event" with:
  - Event Name & Event Type (Launch, Exhibition, Roadshow, Booth, Workshop)
  - Organizing Branch & Venue / Location
  - Start Date & End Date
  - PIC Name
  - Budget in IDR (with live currency formatting)
  - Target Attendees & Actual Attendees
  - Logistics / Permits Notes
  - Video Footage / B-roll file uploader
  - **Target Space & List selector dropdowns** with checkbox toggle *"Automatically create execution task in this list"*.

- [ ] **Step 1: Clean and refactor `EventsView.tsx` to remove all social media branching and focus 100% on field events**
- [ ] **Step 2: Validate with `npx tsc --noEmit`**
- [ ] **Step 3: Commit changes**

```bash
git add src/components/views/EventsView/EventsView.tsx
git commit -m "refactor(ui): streamline EventsView into dedicated Field Events activation manager"
```

---

### Task 6: Integrate Sidebar, Breadcrumbs, Command Palette, and App Router

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/TopNav.tsx`
- Modify: `src/components/layout/CommandPalette.tsx`
- Modify: `src/app/page.tsx`

**Requirements:**
- `Sidebar.tsx`: WORK ITEMS has exactly:
  1. `Content Planner` (`activeView === "content-planner"`, icon `Sparkles`)
  2. `Field Events` (`activeView === "events"`, icon `Flag` or `Megaphone`)
  3. `Placements` (`activeView === "placements"`)
  4. `MOUs` (`activeView === "mous"`)
- `TopNav.tsx`: Breadcrumbs show "Content Planner" when `activeView === "content-planner"`, and "Field Events" when `activeView === "events"`.
- `page.tsx`: Dynamically imports and renders `ContentPlannerView` when `activeView === "content-planner"` and `EventsView` when `activeView === "events"`.
- `CommandPalette.tsx`: ⌘K differentiates results between `📱 Content Planner` and `🎪 Field Event`.

- [ ] **Step 1: Update `Sidebar.tsx`, `TopNav.tsx`, `page.tsx`, and `CommandPalette.tsx`**
- [ ] **Step 2: Verify `npx tsc --noEmit`**
- [ ] **Step 3: Commit changes**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/TopNav.tsx src/components/layout/CommandPalette.tsx src/app/page.tsx
git commit -m "feat(layout): integrate Content Planner and Field Events into sidebar, nav, and command palette"
```

---

### Task 7: Verification & Full Suite Regression

**Files:**
- Run: Full test suite `npm test`
- Run: TypeScript build check `npx tsc --noEmit`
- Verify: Local dev server health at `http://localhost:3000/`

- [ ] **Step 1: Run `npm test` and verify 100% pass across all test suites**
- [ ] **Step 2: Run `npx tsc --noEmit` and verify 0 errors**
- [ ] **Step 3: Verify dev server returns HTTP 200**
- [ ] **Step 4: Update walkthrough artifact**
