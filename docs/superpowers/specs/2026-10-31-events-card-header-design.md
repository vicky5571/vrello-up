# Spec: Field Events Card-Banner Header Architecture

**Spec ID:** `2026-10-31-events-card-header`  
**Status:** Draft  
**Date:** 2026-10-31  
**Plan:** [docs/superpowers/plans/2026-10-31-events-card-header.md](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-10-31-events-card-header.md)  

---

## 1. Executive Summary

Applies the unified Card-Banner Header design system established in Media Placements (`PlacementsHeader.tsx`) to the Field Events page (`EventsView.tsx`). The current open/naked header in `EventsView.tsx` will be encapsulated inside a modular container card (`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs`). 

Additionally, following the Strangler Pattern on God Files (`EventsView.tsx` currently has 531 LOC), the header markup, view switcher pills, and action buttons will be extracted into an atomic subcomponent `EventsHeader.tsx`, reducing coordinator bloat and guaranteeing consistent visual branding across Marcom modules.

---

## 2. Visual & Structural Specifications

### 2.1 Container Card Layout
- **Container**: `bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4`
- **Left Column (Branding & Info)**:
  - Header icon box: `p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50`
  - Title: `Field Events` (`text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2`)
  - Count Badge: `text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700` (`{totalEvents} {totalEvents === 1 ? "event" : "events"}`)
  - Subtitle: `text-xs text-slate-500 dark:text-slate-400 mt-1` (`Manage on-ground activations, mall roadshows, venue logistics, budgets in IDR, and event footage.`)
- **Right Column (Controls & Actions)**:
  - View switcher: Segmented tablist (`Cards`, `Table`, `Calendar`, `Timeline`) with animated sliding pill (`motion.div layoutId="activeFieldEventsViewPill"`).
  - Refresh button: `p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50` with spinning `RefreshCw` icon.
  - Primary Action Button: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs cursor-pointer` (`+ New Field Event`).

---

## 3. Component Architecture & Props Contract

### 3.1 `EventsHeader.tsx` Interface
```ts
export interface EventsHeaderProps {
  totalEvents: number;
  viewMode: ActivityViewMode;
  onViewModeChange: (mode: ActivityViewMode) => void;
  isLoading: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAddEvent: () => void;
}
```

### 3.2 Integration in `EventsView.tsx`
Replace lines 288–363 in `EventsView.tsx` with:
```tsx
<EventsHeader
  totalEvents={events.length}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  isLoading={isLoading}
  onRefresh={() => fetchEvents(true)}
  canManage={can("manage", "events")}
  onAddEvent={openCreateModal}
/>
```

---

## 4. Acceptance Criteria & Invariants

1. **Visual Parity**: The header on `/events` visually matches the Option B Card-Banner Container style from `/placements`.
2. **Animation Continuity**: The `activeFieldEventsViewPill` animated sliding pill transition is retained with spring physics and `useReducedMotion()` support.
3. **Responsive Design**: Collapses cleanly to a vertical column on mobile screens (`flex-col sm:flex-row sm:items-center`).
4. **Codebase Health**:
   - `EventsView.tsx` LOC is reduced.
   - All 26 specs have matching plans (`npm run drift:check` PASS).
   - Zero TypeScript compilation errors (`npm run build:check` PASS).
   - Full test suite passes (`npm test` PASS).
