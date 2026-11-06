# ADR-0066: Mobile Bottom Navigation — Replace Home with Pipeline & Status

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). A large majority of mobile interactions are conducted by ground teams—specifically regional marketing coordinators, field promoters, and retail partner managers—operating in the field across retail outlets and event venues.

In ADR-0057, we established the initial 5-destination chassis for `MobileBottomNav.tsx`:
1. `Home` (`activeView: "home"`)
2. `Outlets` (`activeView: "outlets"`)
3. `Placements` (`activeView: "placements"`)
4. `Events` (`activeView: "events"`)
5. `Menu` (`toggleSidebar()`)

However, real-world operational evaluation reveals an ergonomic and functional imbalance:
1. **Redundancy of the "Home" Slot:** On mobile, `Home` simply renders the generic task Kanban board (`KanbanBoard.tsx`), which is primarily utilized for internal project task tracking rather than physical field operations. Furthermore, the Kanban board is already readily accessible inside the mobile sidebar drawer (`Sidebar.tsx`) under the *Tasks* mode navigation list.
2. **High-Frequency Field Demand for "Pipeline & Status":** Field operations revolve around the retail partnership lifecycle—monitoring MoU approvals, proposal review stages, SLA aging, and partner onboarding bottlenecks (`view: "pipeline"`). Field personnel currently have to open the slide-out menu drawer and scroll to "Pipeline & Status" every time they need to review partnership workflows.
3. **Ergonomic Opportunity:** Elevating `Pipeline` to Slot 1 in `MobileBottomNav.tsx` creates an entirely dedicated, 100% Marcom operational field toolbar (`Pipeline`, `Outlets`, `Placements`, `Events`, `Menu`), placing the highest-frequency daily marketing workflows within instant one-tap thumb reach.

## Options Considered

### Option 1: Direct Replacement with Duplicate Fallback Link in Sidebar
Replace `Home` with `Pipeline` in `MobileBottomNav.tsx`, and add a dedicated "Home Dashboard" button inside `Sidebar.tsx`.
- *Business & Operational Continuity:* High. Users retain direct visual access to `Home` via the slide-out menu drawer.
- *Engineering Cost & Complexity:* Moderate. Requires modifying both `MobileBottomNav.tsx` and `Sidebar.tsx`, expanding `Sidebar.tsx` coordinator LOC and requiring UI layout adjustments.
- *Data Integrity & Performance:* No impact.

### Option 2: Direct In-Place Slot Swap (Chosen)
Replace `Home` with `Pipeline` in `MobileBottomNav.tsx` directly without adding extra links into `Sidebar.tsx`.
- Because `Home` on mobile routes to the Tasks Kanban Board (`activeView: "home"` / `appMode: "tasks"`), and the Kanban Board is already first in the `PROJECTS_NAV_ITEMS` list in `Sidebar.tsx`, users desiring project task tracking can simply toggle Tasks mode in the drawer.
- *Business & Operational Continuity:* Excellent. Ground teams obtain zero-latency access to `Pipeline` in the bottom bar, while task management remains safely anchored inside the drawer where project tasks belong.
- *Engineering Cost & Complexity:* Extremely minimal. Zero risk of coordinator bloat; strictly touches `src/components/layout/MobileBottomNav.tsx` and its test suite.
- *Data Integrity & Performance:* Zero runtime overhead; eliminates an unused view transition.

### Option 3: Dynamic Contextual Bottom Tabs by App Mode
Dynamically swap the bottom tabs depending on whether `appMode` is `"tasks"` or `"marcom"`.
- *Business & Operational Continuity:* Poor. Creates jarring layout shifts and disorients field operators who switch modes.
- *Engineering Cost & Complexity:* High. Over-engineered and breaks muscle memory.
- *Data Integrity & Performance:* High cognitive load and complex state subscription.

## Decision

We adopt **Option 2: Direct In-Place Slot Swap**.

Specifically:
1. **Slot 1 Tab Definition in `MobileBottomNav.tsx`:**
   - `id`: `"pipeline"`
   - `label`: `"Pipeline"`
   - `icon`: `Layers` (imported from `lucide-react`)
   - `activeColor`: `"text-indigo-500 dark:text-indigo-400"`
   - `isActive`: `(view, isSidebarOpen) => !isSidebarOpen && view === "pipeline"`
   - `onClick`:
     ```ts
     onClick: ({ setActiveView, setAppMode }) => {
       setAppMode("marcom");
       setActiveView("pipeline");
     }
     ```
2. **Tab Invariants:**
   - Mobile bottom bar preserves exactly 5 canonical tabs: `Pipeline`, `Outlets`, `Placements`, `Events`, `Menu`.
   - Layout, typography (`text-[10.5px] font-medium`), padding, sliding active indicator pill (`layoutId="activeMobileBottomTab"`), and safe-area constraints remain 100% consistent with ADR-0057 and ADR-0058.
3. **Desktop Invariants:**
   - Desktop rail (`GlobalRail.tsx`) continues to display `Home` and desktop navigation remains 100% byte-for-byte unaffected.

## Consequences

### Positive Consequences
1. **100% Cohesive Operational Field Bar:** All 4 primary bottom navigation slots now represent core marketing operations (`Pipeline`, `Outlets`, `Placements`, `Events`).
2. **Instant Thumb Reach for Pipeline:** Field supervisors and retail managers can monitor MoU approval stages and SLA aging with a single tap.
3. **Zero Redundancy:** Removes the redundant `Home` tab from mobile which previously duplicated the Kanban board.
4. **Zero Overhead & Coordinator Safety:** `MobileBottomNav.tsx` remains ~140 LOC (well below the 150 LOC limit and 250 LOC coordinator limit).

### Negative Consequences / Accepted Technical Debt
1. **Home Access on Mobile:** Direct one-tap access to `Home` (`view: "home"`) is no longer on the mobile bottom bar; users requiring project task views use the Menu drawer to access the Kanban board under Tasks mode.



