# ADR-0022 — Field Event Edit Drawer and Modal Separation

**Status:** Accepted  
**Date:** 2026-11-04  
**Area:** Field Events — User Interface & Interaction Patterns  
**Relates to:** ADR-0017 (Multi-File Media UI Adaptation), ADR-0021 (Field Event Media Attachments via Google Drive)

---

## Context & Problem Statement

In the Marcom operations system, Content Planner established a proven dual-interaction paradigm:
1. **Creation Flow (`ContentPostModal.tsx`)**: A lightweight, centered modal for fast kickoff and input of primary fields (title, platform, format, scheduled date).
2. **Inspection & Deep Editing Flow (`ContentDrawer.tsx`)**: A full-height, slide-over right drawer (560px wide) equipped with real-time media upload progress, asset carousel/previews, drag-to-reorder cover selection, revision notes, subtask checklists, and sticky bottom CTAs ("Simpan Perubahan" and "Hapus").

In contrast, Field Events currently routes both Create and Edit flows into a single monolithic component: `EventFormModal.tsx` (~950 lines). 

### UX & Architectural Friction
- **Inconsistent Mental Model**: Users transitioning from Content Planner to Field Events experience cognitive friction. In Content Planner, clicking a card opens a contextual right drawer, keeping the background calendar/board visible. In Field Events, clicking a card pops a heavy centered dialog that obscures the entire workspace.
- **Cramped Screen Real Estate**: A field event manages extensive operational data: logistics notes, outlet relations, equipment borrowing schedules, multi-item task checklists, and newly integrated Google Drive media attachments. Cramming all these into a fixed-height center modal causes nested scrolling and visual fatigue.
- **Codebase Monolith (Strangler Violation)**: `EventFormModal.tsx` combines dual-mode state initialization, branch filtering, outlet lookups, checklist templates, equipment rendering, and media management in nearly 1,000 lines of code, making maintenance and targeted extensions risky.

---

## Decision Drivers

- **Cross-Module Consistency**: Align Field Events interaction patterns directly with Content Planner.
- **Contextual Work Environment**: Users editing field events should be able to reference the background timeline/calendar while reviewing assets and checklist progress.
- **Strangler Pattern Compliance**: Decompose monolithic 950-line `EventFormModal` into focused, single-responsibility components with strict line-budget discipline.
- **Rich Media & Equipment Experience**: Provide full-height vertical real estate for drag-and-drop media uploads, Google Drive folder links, borrowed equipment manifests, and execution subtasks.

---

## Options Considered

### Option A: Dedicated `EventDrawer` for Editing + `EventCreateModal` for Creation (Selected)
- Build `EventDrawer.tsx` modeled directly after `ContentDrawer.tsx`:
  - Fixed-right slide-over container (560px width, spring physics via Framer Motion, backdrop blur).
  - Sticky header with event status and type badges, quick close button, and event title.
  - Scrollable content area accommodating logistical notes, outlet links, Google Drive media attachments, equipment borrowing records, and task checklist.
  - Sticky bottom action bar with "Simpan Perubahan" (Save Changes), "Hapus Event" (Delete), and status change triggers.
- Streamline `EventFormModal.tsx` into a lightweight `EventCreateModal.tsx` focused purely on initial event scheduling and creation.
- Update `EventsView.tsx` coordinator to route `openEditDrawer` and `openCreateModal`.

### Option B: All-in-One Drawer for Both Create and Edit
- Replace the modal completely with `EventDrawer.tsx` handling both creation and editing.
- Opening "New Field Event" slides the drawer from the right in empty state.
- *Rejected*: Deviates from Content Planner where creation is a focused modal; empty drawer feels disproportionately heavy for simple event initiation.

### Option C: Adaptive Modal/Drawer Container Shell
- Keep single component, but wrap it conditionally in `<Modal>` or `<Drawer>` based on an `isEdit` boolean flag.
- *Rejected*: Keeps the 950+ LOC monolith intact and adds complex layout branching.

---

## Deep Trade-Off Matrix

| Dimension | Option A (Dedicated Drawer + Create Modal) | Option B (All-in-One Drawer) | Option C (Adaptive Shell) |
|---|---|---|---|
| **UX Parity with Content Planner** | **100% Exact Match**: Modal for quick create, Drawer for deep edit | **Partial Match**: Deviates from Content Planner creation flow | **Moderate**: Shared inputs, but high risk of visual inconsistency |
| **Code Modularity & Cleanliness** | **Highest**: Decomposes 950 LOC monolith into focused components | **Moderate**: Single file, but still carries dual create/edit branching | **Lowest**: Monolith remains large, high conditional prop spaghetti |
| **User Productivity & Context** | **High**: Fast create dialog; deep drawer allows viewing background board | **Moderate**: Empty drawer feels excessive for quick 30-second creation | **High**: Similar to Option A at runtime |
| **Implementation Complexity** | **Moderate**: Clean separation of create vs edit state and handlers | **Low**: Single component refactoring | **High**: Nested container abstractions and dynamic styling |

---

## Decision

**We adopt Option A.**

1. Create `EventDrawer.tsx` (`src/components/views/EventsView/EventDrawer.tsx`) as the standard slide-over drawer for inspecting and editing existing field events.
2. Refactor the creation flow into `EventCreateModal.tsx` (`src/components/views/EventsView/EventCreateModal.tsx`) for fast, clean event creation.
3. Wire `EventsView.tsx` coordinator:
   - Clicking an event card or table row invokes `onSelectEvent` → opens `<EventDrawer>`.
   - Clicking "+ Event Baru" invokes `openCreateModal` → opens `<EventCreateModal>`.
4. Integrate the unified Google Drive media attachments section (ADR-0021) directly within `EventDrawer` with preview and playback hooks.

---

## Consequences

### Positive
- **Flawless Design Uniformity**: Navigating between Content Planner and Field Events provides an identical mental model (Modal = New Item, Drawer = Inspect & Edit).
- **Reduced Cognitive Load**: Slide-over drawer keeps the background board/calendar visible for orientation and spatial context.
- **Architectural Health**: Replaces the 950-line `EventFormModal` monolith with modular subcomponents respecting the Strangler Pattern.
- **Full-Height Media Experience**: Ample vertical real estate for viewing attached photos, video players, and Google Drive archive folders.

### Negative & Accepted Trade-offs
- Two separate form components (`EventCreateModal` and `EventDrawer`) must stay aligned on field validation rules (e.g. date ranges, budget numeric parsing). This is mitigated by importing pure validation helpers.

---

## Related Documentation

- ADR-0017: Multi-File Media UI Adaptation  
- ADR-0021: Field Event Media Attachments via Google Drive & TaskAttachment SSOT  
- Spec: `docs/superpowers/specs/2026-11-04-field-event-edit-drawer-design.md`  
- Plan: `docs/superpowers/plans/2026-11-04-field-event-edit-drawer.md`
