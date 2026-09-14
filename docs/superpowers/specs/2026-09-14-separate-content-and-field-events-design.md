# Design Spec: Separation of Content Planner (Social Media) and Field Events (On-Ground)

- **Date**: 2026-09-14
- **Topic**: Full Separation of Social Media and On-Ground Activations in Database & UI
- **Status**: Approved for Implementation

---

## 1. Context & Rationale

Currently, `vrello-up` stores both digital social media posts (Instagram, TikTok, YouTube) and physical on-ground activations (mall exhibitions, roadshows, booth launches) inside a single Prisma model (`MarcomEvent`) and a single monolithic React component ([`EventsView.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/EventsView/EventsView.tsx), >2,200 lines).

### Identified Architectural Smells
1. **Database Sparse / Nullable Anti-pattern**:
   - For an Instagram Reel, fields like `location`, `budget`, `targetAttendee`, and `attendeeCount` are irrelevant (stored as 0/empty).
   - For a Mall Exhibition, fields like `postPlatform`, `postFormat`, and `mediaUrl` are irrelevant.
2. **Conflicting User Mental Models**:
   - Content creators care about platforms, formats (Reel vs Carousel), captions, hashtags, publish dates, and creative assets.
   - Field coordinators care about venues, permits, mall management, branches, budgets in IDR, attendee targets, and b-roll footage.
3. **Monolithic UI Complexity**:
   - Combining both channels forced tables to show nonsensical columns (e.g. "Attendees" or "Budget" for Instagram stories) and inflated `EventsView.tsx` with duplicate forms, states, and conditional branching.

---

## 2. Target Design

### 2.1 Navigation & Workspace Mode Integration

In **Marketing Hub** mode (pink megaphone icon), the dynamic Sidebar's **WORK ITEMS** group is cleanly partitioned into dedicated tools:

```text
MARKETING HUB
├─ WORK ITEMS
│  ├─ 📱 Content Planner      -> view: "content-planner" (Social media calendar & assets)
│  ├─ 🎪 Field Events         -> view: "events" (Physical activations, venues & budgets)
│  ├─ 📍 Placements           -> view: "placements" (Outlet promotional fixtures)
│  └─ 📝 MOUs                 -> view: "mous" (Tenant partnership contracts)
│
└─ MASTER DATA
   ├─ 🏢 Branches
   ├─ 🏪 Outlets
   ├─ 📁 Documents
   ├─ 📊 Monthly Reports
   └─ 📈 Analytics
```

---

## 3. Database Schema (`prisma/schema.prisma`)

We replace the polymorphic `MarcomEvent` table with two specialized relational models:

### 3.1 Model `ContentPost`
```prisma
model ContentPost {
  id          String    @id @default(cuid())
  title       String                           // Post concept / hook / title
  platform    String                           // instagram, tiktok, youtube, facebook, linkedin, twitter
  format      String                           // reel, carousel, image, story, article, thread
  publishDate DateTime?                        // Target release date & time
  status      String    @default("SCHEDULED")  // DRAFT, SCHEDULED, PUBLISHED, ARCHIVED
  caption     String    @default("")           // Copywriting caption & hashtags
  mediaUrl    String    @default("")           // Asset thumbnail URL or cloud drive link
  branchName  String    @default("")           // Associated branch (optional)
  picName     String    @default("")           // Creator / author PIC
  subtasks    Json      @default("[]")         // Production checklist items
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([platform])
  @@index([status])
  @@index([publishDate])
}
```

### 3.2 Model `FieldEvent`
```prisma
model FieldEvent {
  id             String         @id @default(cuid())
  name           String                           // Event name (e.g. Solo Roadshow 2026)
  eventType      String                           // Launch, Exhibition, Workshop, Booth
  startDate      DateTime?                        // Event start date
  endDate        DateTime?                        // Event end date
  location       String         @default("")      // Venue / Mall / Exhibition hall
  branchName     String         @default("")      // Organizing branch
  picName        String         @default("")      // Field coordinator PIC
  status         EventStatus    @default(UPCOMING)// UPCOMING, ON_PROGRESS, COMPLETED, CANCELLED
  budget         Float          @default(0)       // Allocated budget in IDR
  targetAttendee Int            @default(0)       // Target attendance
  attendeeCount  Int            @default(0)       // Actual attendees recorded
  notes          String         @default("")      // Logistics notes, permits, specs
  footage        EventFootage[]                   // Relational link to video b-roll records
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

### 3.3 Data Migration Strategy
- Any existing records in `MarcomEvent` where `postPlatform != null` or `eventType === 'Content'` are migrated to `ContentPost`.
- All other records are migrated to `FieldEvent`.

---

## 4. REST API Contracts

### 4.1 `/api/marcom/content` (Content Planner)
- `GET /api/marcom/content?platform=&status=&q=`: Returns filtered list of `ContentPost` items.
- `POST /api/marcom/content`: Creates a new social post.
- `PATCH /api/marcom/content/:id`: Updates an existing post.
- `DELETE /api/marcom/content/:id`: Removes a post.

### 4.2 `/api/marcom/events` (Field Events)
- `GET /api/marcom/events?branch=&status=&q=`: Returns filtered list of `FieldEvent` items including `footage`.
- `POST /api/marcom/events`: Creates a new on-ground event.
- `PATCH /api/marcom/events/:id`: Updates an on-ground event.
- `DELETE /api/marcom/events/:id`: Removes an on-ground event.

---

## 5. UI Components & User Experience

### 5.1 `ContentPlannerView.tsx`
- **Header & Metrics**:
  - Summary KPI cards: *Active Scheduled Posts, Posts Ready, Platform Distribution*.
- **Controls**:
  - Search input, platform filter chips (*All, Instagram, TikTok, YouTube, Facebook, LinkedIn, X*), status filters.
  - View switcher: Grid Cards vs Compact Table.
  - Button: `+ Schedule Post` (pink/purple gradient).
- **Schedule Post Modal & Slide-over Drawer**:
  - Title, Platform & Format selects, Publish Date picker, Media URL.
  - Caption textarea (with copy button).
  - Production Subtasks checklist editor.
  - **Destination Space & List Picker** (routes execution task to chosen Space/List, e.g. `Marketing & Campaigns` or `Design & Product`).

### 5.2 `FieldEventsView.tsx` (formerly monolithic `EventsView.tsx`)
- **Header & Metrics**:
  - Summary KPI cards: *Active Field Events, Committed Budget (IDR), Expected Attendees, Branch Coverage*.
- **Controls**:
  - Search input, Event Type pills, Status chips (*Upcoming, In Progress, Completed, Cancelled*).
  - View switcher: Cards vs Table.
  - Button: `+ New Field Event` (teal accent).
- **Create Field Event Modal & Slide-over Drawer**:
  - Event Name, Event Type, Organizing Branch, Venue/Location.
  - Start & End Date pickers, PIC name, Budget in IDR with live formatting.
  - Target vs Actual attendee counters.
  - Logistics & permit notes.
  - Footage & b-roll media manager.
  - **Destination Space & List Picker** with automatic execution task creation toggle.

### 5.3 Command Palette (`CommandPalette.tsx`)
- Differentiates search results with explicit group badges:
  - `📱 Content Planner • [Platform] [Format]`
  - `🎪 Field Event • [Branch] • [Venue]`

---

## 6. Verification & Testing Plan

1. **Unit Tests**:
   - `prisma` model validation and migration tests.
   - API route tests for `/api/marcom/content` and `/api/marcom/events`.
   - Store navigation tests confirming `activeView = "content-planner"` and `activeView = "events"` switch smoothly.
2. **Type Safety**:
   - `npx tsc --noEmit` must pass with 0 errors.
3. **Full Suite Regression**:
   - `npm test` all tests pass cleanly.
4. **End-to-End Functional Verification**:
   - Creating a post in Content Planner creates a `ContentPost` and routes a task to the chosen Space/List.
   - Creating an activation in Field Events creates a `FieldEvent` and routes a task to the chosen Space/List.
   - Both pages render dedicated metrics and clean forms without cross-contamination.
