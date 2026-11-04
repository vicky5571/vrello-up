# Spec — Field Event Edit Drawer and Modal Separation

**ADR:** `docs/adr/0022-field-event-edit-drawer.md`  
**Status:** Implemented  
**Date:** 2026-11-04  
**Author:** AI Pair Programmer & Lead Systems Architect  

---

## 1. Executive Summary

This specification establishes interaction uniformity between Field Events and Content Planner by separating event creation and event editing into distinct, purposeful UI containers:
1. **Creation Flow (`EventCreateModal.tsx`)**: Preserves the established centered modal dialog ("Create New Field Event") for fast event setup (dates, venue, budget, checklist template, and initial media).
2. **Inspection & Deep Edit Flow (`EventDrawer.tsx`)**: Replaces the edit modal with a right slide-over drawer (560px wide, spring animation, sticky actions) mirroring Content Planner's `ContentDrawer.tsx`.

This architecture gives field marketing managers ample vertical space for operational management (Google Drive media uploads, equipment borrowing schedules, subtask tracking) while keeping the background board/calendar visible for temporal context.

---

## 2. Interaction Flows & User Experience

```
User Action: Click "+ Event Baru" (Header / Empty State)
  ↓
Opens: <EventCreateModal> (Centered Modal Dialog)
  • Fast creation form (dates, location, outlet, budget, checklist)
  • On Submit → POST /api/marcom/events → Close Modal → Cache Update

─────────────────────────────────────────────────────────────

User Action: Click Event Card or Table Row
  ↓
Opens: <EventDrawer> (Right Slide-Over Drawer — 560px)
  • Contextual header with status badge, type pill, close button
  • Real-time edit of title, dates, PIC, location, outlet, budget, attendees
  • Media & Dokumentasi Event: "Upload dari Perangkat" via Google Drive, progress bar, folder link
  • Borrowed Equipment Section (<EventBorrowedEquipmentSection eventId={event.id} />)
  • Event Checklist Section (<EventChecklistSection />)
  • Sticky Footer: "Simpan Perubahan" (PATCH) | "Hapus Event" (DELETE)
```

---

## 3. Component Architecture & Props Contracts

### 3.1 `EventDrawer.tsx` Specification

**File Path:** `src/components/views/EventsView/EventDrawer.tsx`

```typescript
interface EventDrawerProps {
  event: FieldEventItem | null;
  onClose: () => void;
  onUpdateEvent: (updated: FieldEventItem) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<boolean>;
  branches: { id: string; name: string }[];
  members: User[];
  onOpenFootageModal?: (event: FieldEventItem, clipIdx?: number) => void;
}
```

#### Visual Structure & Layout (Wireframe):
```
┌─────────────────────────────────────────────────────────────┐
│ [STATUS: ON_PROGRESS ▼]  [Roadshow]                     [X] │  <-- Sticky Header
├─────────────────────────────────────────────────────────────┤
│ Event Title Input (Bold, 18px text-slate-900)               │
│                                                             │
│ [Start Date] [End Date]         [Branch Select]             │
│ [Location Input]                [Outlet Select]             │
│ [PIC Member Select]             [Status Transition]         │
│ [Budget IDR Input]              [Target vs Actual Attendee] │
│                                                             │
│ Logistics & Operational Notes:                              │
│ [ Textarea with auto-resize / 3 rows                      ] │
│                                                             │
│ 📁 Media & Dokumentasi Event        [Upload dari Perangkat] │
│ [ Upload Progress (XX%) ]                                   │
│ • [🖼 Photo Booth.jpg]  2.4 MB              [Preview] [X]   │
│ • [🎬 Crowd Recap.mp4] 18.5 MB              [Putar]   [X]   │
│ • [📁 Raw Footage Folder (Google Drive)]    [Buka]    [X]   │
│ [ + Tempel Link Folder Drive untuk Raw Footage            ] │
│                                                             │
│ 📦 Peralatan Dipinjam (Borrowed Equipment Section)          │
│ [ Sound system, projector, mic records...                 ] │
│                                                             │
│ ☑️ Checklist Persiapan Event (Subtasks Section)             │
│ [ Checklist template with completion toggles...           ] │
├─────────────────────────────────────────────────────────────┤
│ [Hapus Event]                      [Batal] [Simpan Perubahan]│  <-- Sticky Footer
└─────────────────────────────────────────────────────────────┘
```

#### Motion & Accessibility:
- **Backdrop**: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />` with `bg-slate-950/40 backdrop-blur-xs`.
- **Drawer Motion**: `<motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} />`.
- **Keyboard Dismissal**: Global `Escape` key event listener calls `onClose()`.
- **Focus Trap / Outside Click**: Clicking backdrop triggers `onClose()`.

---

### 3.2 `EventCreateModal.tsx` Specification

**File Path:** `src/components/views/EventsView/EventCreateModal.tsx`

```typescript
interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  branches: { id: string; name: string }[];
  members: User[];
  onCreated: (createdEvent: FieldEventItem) => void;
}
```

- Centered dialog container matching user's current creation modal.
- Initial form state for event kickoff (name, eventType, branch, location, outlet, dates, PIC, budget, target attendees, notes, and checklist template).
- Submits `POST /api/marcom/events` with initial payload.
- On success: closes modal, triggers toast, and immediately updates cache.

---

### 3.3 Coordinator Changes (`EventsView.tsx`)

In `src/components/views/EventsView/EventsView.tsx`:
```typescript
// Replace:
// const [isFormModalOpen, setIsFormModalOpen] = useState(false);
// const [editingEvent, setEditingEvent] = useState<FieldEventItem | null>(null);

// With:
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [selectedDrawerEvent, setSelectedDrawerEvent] = useState<FieldEventItem | null>(null);

// Handlers:
const openCreateModal = (date?: string) => {
  setDefaultDate(date);
  setIsCreateModalOpen(true);
};

const openEditDrawer = (event: FieldEventItem) => {
  setSelectedDrawerEvent(event);
};

const closeDrawer = () => {
  setSelectedDrawerEvent(null);
};
```

Mounting:
```tsx
{/* Create Modal */}
<EventCreateModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  defaultDate={defaultDate}
  branches={branches}
  members={members}
  onCreated={handleEventCreated}
/>

{/* Edit Drawer */}
<AnimatePresence>
  {selectedDrawerEvent && (
    <EventDrawer
      event={selectedDrawerEvent}
      onClose={closeDrawer}
      onUpdateEvent={handleEventUpdated}
      onDeleteEvent={handleDeleteEvent}
      branches={branches}
      members={members}
      onOpenFootageModal={openFootageModal}
    />
  )}
</AnimatePresence>
```

---

## 4. Verification & Acceptance Criteria

| ID | Criteria | Verification Method |
|---|---|---|
| AC-01 | Clicking "+ Event Baru" opens centered `<EventCreateModal>` dialog | Visual & component interaction |
| AC-02 | Clicking an event card or table row smoothly slides open `<EventDrawer>` from the right (560px) | Visual & component interaction |
| AC-03 | Pressing `Escape` or clicking backdrop closes `<EventDrawer>` | Keyboard & click event test |
| AC-04 | Editing values in `<EventDrawer>` and clicking "Simpan Perubahan" persists updates via PATCH API | API integration test |
| AC-05 | Clicking "Hapus Event" inside `<EventDrawer>` prompts confirmation, deletes via DELETE API, and closes drawer | Flow verification |
| AC-06 | `npm run drift:check` passes with 0 violations | CLI verification |
| AC-07 | `npm run build:check` passes with 0 errors | CLI verification |
| AC-08 | `npm test` passes with 0 failures | CLI verification |
