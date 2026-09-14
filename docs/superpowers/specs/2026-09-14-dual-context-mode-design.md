# Design: Dual-Context Workspace Mode Switcher (Option B)

- Date: 2026-09-14
- Approach: Option B — Dual-Context Workspace Mode Switcher (approved after comparison with A and C)
- Skills: using-superpowers, superpowers:brainstorming (architectural path)

---

## 1. Context & Problem Statement

VrelloUp currently combines two distinct functional domains in a single interface:
1. **Projects & Tasks Engine**: ClickUp/Trello-style project management (Spaces, Folders, Lists, Tasks, Subtasks, Views like List/Board/Table/Calendar/Gantt/Channel, Automations, Agents).
2. **Marketing & Operations Hub**: Enterprise field marketing portal (Campaigns & Content, Placements, MOUs, Branches, Outlets, Documents, Reports, Analytics).

### The Confusion
- **Sidebar Overload**: Marketing views were appended directly under the Space/Folder/List tree in the sidebar, creating visual clutter and conflicting mental models.
- **TopNav Noise**: The 3-tiered header rendered task-specific controls (Agents, Automate, Brain², Share, Space/List breadcrumbs, ViewSwitcher with an awkward nested Marketing dropdown) even when viewing field marketing master data or reports.
- **FilterBar Mismatch**: The task filter bar (Status, Priority, Assignee, Group By) does not apply to Marcom entities (Outlets, Branches, MOUs), requiring awkward exclusions.

---

## 2. Approved Design Decisions

### 2.1 Mode Switcher Location
- Located at the very top of the left dock (`GlobalRail`).
- Two prominent toggles with tooltip and active pill/badge:
  - **Projects & Tasks** (Icon: `Kanban` or `CheckSquare`): Activates the ClickUp-style project workspace.
  - **Marketing & Ops Hub** (Icon: `Megaphone`): Activates the field operations/ERP workspace.

### 2.2 Dynamic Sidebar
- **When `appMode === "tasks"`**:
  - Displays Spaces, Folders, and Lists tree.
  - Quick action buttons: Add Space, Add Folder, Add List.
  - Completely hides Marketing & Ops items.
- **When `appMode === "marcom"`**:
  - Transforms into a dedicated Marketing & Operations Hub navigation panel.
  - Displays a clear header: **Marketing Hub**.
  - Two structured groups with zero clutter (*no subtitles/micro-labels per user request*):
    - **WORK ITEMS**:
      - `Campaigns & Content` (`events` / `content`)
      - `Placements` (`placements`)
      - `MOUs` (`mous`)
    - **MASTER DATA**:
      - `Branches` (`branches`)
      - `Outlets` (`outlets`)
      - `Documents` (`documents`)
      - `Reports` (`reports`)
      - `Analytics` (`analytics`)

### 2.3 Lean TopNav for Marketing Mode
- **When `appMode === "tasks"`**:
  - Full 3-tier header:
    - Tier 1: Workspace selector, ⌘K search, Call, Notifications, User menu.
    - Tier 2: Space/List Breadcrumbs + Task `ViewSwitcher` (Channel, List, Board, Calendar, Gantt, Table) — *marketing dropdown removed*.
    - Tier 3: Quick Action Controls (Agents, Automate, Brain², Share).
    - Subheader: Task `FilterBar`.
- **When `appMode === "marcom"`**:
  - Super-lean single-tier header (~44px):
    - Breadcrumbs: `Marketing Hub / [Active View Name]`
    - Quick ⌘K search trigger
    - Right utility controls: ThemeToggle, NotificationCenter, User menu.
    - Tier 2, Tier 3, and Task FilterBar are completely hidden.

---

## 3. Data Model & State Management

### 3.1 Domain Type Definition
In [`src/types/index.ts`](file:///Users/mac/Web%20Development/vrello-up/src/types/index.ts):
```typescript
export type AppMode = "tasks" | "marcom";
```

### 3.2 Workspace Store Integration
In [`src/lib/store/useWorkspaceStore.ts`](file:///Users/mac/Web%20Development/vrello-up/src/lib/store/useWorkspaceStore.ts):
- **State Fields**:
  - `appMode: AppMode` (defaults to `"tasks"`, persisted in `localStorage`)
  - `lastTaskView: ViewMode` (defaults to `"list"`)
  - `lastMarcomView: ViewMode` (defaults to `"events"`)
- **Actions**:
  - `setAppMode: (mode: AppMode) => void`:
    - Toggles between `"tasks"` and `"marcom"`.
    - Switches `activeView` to `lastTaskView` (when entering tasks) or `lastMarcomView` (when entering marcom).
  - `setActiveView: (view: ViewMode) => void`:
    - Automatically updates `appMode` to match the target view (e.g., selecting `"branches"` sets `appMode: "marcom"`, selecting `"board"` sets `appMode: "tasks"`).
    - Updates `lastTaskView` or `lastMarcomView` respectively.
  - `navigateToMarcom: (view: ViewMode, search?: string) => void`:
    - Switches `appMode: "marcom"` and activates the targeted marcom view.

---

## 4. Component Architecture & Changes

### 4.1 `GlobalRail.tsx`
- Add a top-level mode toggle container above the collapse chevron:
  - Button 1: Tasks mode (`CheckSquare` / `Kanban`), active style when `appMode === "tasks"`.
  - Button 2: Marcom mode (`Megaphone`), active style when `appMode === "marcom"`.
  - Subtle divider separating the mode toggles from the sidebar collapse chevron and global nav items.

### 4.2 `Sidebar.tsx`
- Read `appMode` from `useWorkspaceStore`.
- If `appMode === "tasks"`:
  - Render Spaces, Folders, and Lists accordion.
  - Remove the bottom `{/* Marketing & Ops Section */}`.
- If `appMode === "marcom"`:
  - Render Marcom Hub header with quick badge.
  - Render WORK ITEMS group (`WORK_ITEM_VIEWS`).
  - Render MASTER DATA group (`MASTER_DATA_VIEWS`).
  - Active item highlights with standard rounded background.

### 4.3 `TopNav.tsx`
- Read `appMode` from `useWorkspaceStore`.
- If `appMode === "marcom"`:
  - Render lean Tier 1:
    - Left: Breadcrumbs (`Marketing Hub` $\rightarrow$ `Active View Name`).
    - Center: ⌘K quick search bar trigger.
    - Right: Theme toggle, Notifications, User avatar.
  - Skip Tier 2 and Tier 3 rendering.
- If `appMode === "tasks"`:
  - Render standard Tier 1, Tier 2 (Breadcrumbs + Task `ViewSwitcher`), Tier 3 (Agents, Automate, Brain², Share).

### 4.4 `ViewSwitcher.tsx`
- Remove the nested Marketing dropdown tab from `ViewSwitcher.tsx`.
- Task view switcher only renders task view tabs: Channel, List, Board, Calendar, Gantt, Table, + View.

### 4.5 `src/app/page.tsx`
- Hide `FilterBar` whenever `appMode === "marcom"`.

---

## 5. Testing & Verification Plan

### 5.1 Unit Tests
- Create or update `src/lib/store/appMode.test.ts`:
  - `setAppMode("marcom")` switches `appMode` and sets `activeView` to `lastMarcomView`.
  - `setAppMode("tasks")` switches `appMode` and sets `activeView` to `lastTaskView`.
  - `setActiveView("branches")` auto-syncs `appMode` to `"marcom"`.
  - `setActiveView("board")` auto-syncs `appMode` to `"tasks"`.
  - `navigateToMarcom` switches `appMode` to `"marcom"`.
- Run `npm test` to verify all 105+ tests pass with zero regressions.

### 5.2 Manual UI Verification
- Verify `GlobalRail` top buttons toggle between Tasks and Marketing Hub cleanly.
- Verify `Sidebar` switches content completely without visual glitches.
- Verify `TopNav` collapses to lean single-tier in Marcom mode and expands to 3 tiers in Tasks mode.
- Verify ⌘K search still works across both modes.
