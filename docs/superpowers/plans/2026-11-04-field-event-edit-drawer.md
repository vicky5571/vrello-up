# Plan — Field Event Edit Drawer and Modal Separation

**Status:** Completed  
**Date:** 2026-11-04  
**ADR:** `docs/adr/0022-field-event-edit-drawer.md`  
**Spec:** `docs/superpowers/specs/2026-11-04-field-event-edit-drawer-design.md`  

---

## File Manifest & Responsibility Mapping

| File Path | Role / Responsibility | Action |
|---|---|---|
| `src/components/views/EventsView/EventCreateModal.tsx` | Centered modal dialog for fast event kickoff & creation | Create |
| `src/components/views/EventsView/EventDrawer.tsx` | Slide-over right drawer (560px) for deep event inspection & editing | Create |
| `src/components/views/EventsView/EventsView.tsx` | View coordinator — manage `isCreateModalOpen` and `selectedDrawerEvent` | Modify |
| `src/components/views/EventsView/EventFormModal.tsx` | Deprecated 950-line monolith component | Delete |
| `src/components/views/EventsView/eventDrawer.test.ts` | Unit tests for `EventDrawer` interaction, state hydration, and handlers | Create |

---

## Explicit "Do Not Touch" List

- `src/components/views/EventsView/EventBorrowedEquipmentSection.tsx`: Child equipment borrowing section. Must be mounted unchanged inside `EventDrawer`.
- `src/components/views/EventsView/EventChecklistSection.tsx`: Child subtask checklist section. Must be mounted unchanged in both modal and drawer.
- `src/components/views/EventsView/EventFootageModal.tsx`: Media lightbox player. Invoked by both views for full-screen playback.
- `src/components/views/ContentPlannerView/*`: Content Planner components serve as design reference only; do not touch.

---

## Phase 1 — Create Focused `EventCreateModal.tsx`

**File:** `src/components/views/EventsView/EventCreateModal.tsx`

Extract the pure creation flow from `EventFormModal.tsx` into a dedicated creation dialog.

### 1a. Contract & State
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

### 1b. Implementation Requirements
- Centered `<Modal>` with standard backdrop blur and scale-in animation.
- Title: "Create New Field Event" with subtitle "On-ground brand activation, venue permits, budget & logistics".
- Inputs:
  - Event Name (`eventName`)
  - Event Type (`eventType`, default "Roadshow")
  - Branch Select (`branches`, default first branch)
  - Date Range (`startDate`, `endDate`)
  - Location input & Outlet select
  - PIC Member Select (`members`)
  - Budget (IDR formatting) & Target Attendees
  - Notes (`eventNotes`)
  - Subtask Checklist template (`EventChecklistSection`)
- On Submit: Dispatches `POST /api/marcom/events`, calls `onCreated(result)`, and closes modal.

**Checklist:**
- [x] Create `src/components/views/EventsView/EventCreateModal.tsx`
- [x] Implement create-only form state and validation
- [x] Wire `POST /api/marcom/events` submission
- [x] Run `npm run build:check`

---

## Phase 2 — Build Slide-Over `EventDrawer.tsx`

**File:** `src/components/views/EventsView/EventDrawer.tsx`

Build the slide-over drawer modeled directly after `ContentDrawer.tsx`.

### 2a. Contract
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

### 2b. Implementation Structure
1. **Container & Motion**:
   - Fixed overlay with backdrop blur: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />`
   - Slide-over drawer container: `<motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="relative z-50 w-full sm:w-[560px] h-full bg-white dark:bg-[#18191B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden" />`

2. **Sticky Header**:
   - Status badge with transition dropdown (using `canTransitionEvent`).
   - Event type badge.
   - Close (`X`) button.
   - Title input with inline editing.

3. **Scrollable Content (`overflow-y-auto flex-1 p-5 space-y-5`)**:
   - **Scheduling & Location**: Start/End dates, Branch dropdown, Location text input, Outlet dropdown.
   - **Team & Metrics**: PIC select (`findMemberForPic`), Budget input (`formatIDR`), Target Attendee vs Actual Attendee count.
   - **Logistics Notes**: Multi-line textarea for permits, sound rig, electrical requirements.
   - **Media & Dokumentasi Event** (incorporating ADR-0021):
     - "Upload dari Perangkat" button with hidden file input (`accept="image/*,video/*" multiple`).
     - `useDirectDriveUpload` hook with active percentage progress bar and cancel button.
     - Attachment list cards (file icons, filename, size in MB, preview action, delete action).
     - Drive folder link input for raw coverage archives (`isSharedFolder: true`).
   - **Borrowed Equipment**: `<EventBorrowedEquipmentSection eventId={event.id} />`.
   - **Subtasks Checklist**: `<EventChecklistSection eventType={eventType} eventSubtasks={eventSubtasks} setEventSubtasks={setEventSubtasks} />`.

4. **Sticky Footer (`p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`)**:
   - Left: "Hapus Event" button (`Trash2` icon, red hover, triggers confirmation prompt).
   - Right: "Batal" (Cancel) and "Simpan Perubahan" primary button (`isSaving` spinner).

**Checklist:**
- [x] Create `src/components/views/EventsView/EventDrawer.tsx`
- [x] Implement Framer Motion slide-over animation and Escape listener
- [x] Embed sticky header, body sections, media attachments, equipment, and checklist
- [x] Implement sticky footer with save (`PATCH`) and delete (`DELETE`) handlers
- [x] Run `npm run build:check`

---

## Phase 3 — Coordinator Integration in `EventsView.tsx`

**File:** `src/components/views/EventsView/EventsView.tsx`

### 3a. Update Imports & Coordinator State
```typescript
// Replace:
// import { EventFormModal } from "./EventFormModal";
// With:
import { EventCreateModal } from "./EventCreateModal";
import { EventDrawer } from "./EventDrawer";
import { AnimatePresence } from "framer-motion";

// Replace modal state:
// const [isFormModalOpen, setIsFormModalOpen] = useState(false);
// const [editingEvent, setEditingEvent] = useState<FieldEventItem | null>(null);

// With separate states:
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [selectedDrawerEvent, setSelectedDrawerEvent] = useState<FieldEventItem | null>(null);

const openCreateModal = useCallback((initialDate?: string) => {
  setDefaultDate(initialDate);
  setIsCreateModalOpen(true);
}, []);

const openEditDrawer = useCallback((event: FieldEventItem) => {
  setSelectedDrawerEvent(event);
}, []);

const closeDrawer = useCallback(() => {
  setSelectedDrawerEvent(null);
}, []);
```

### 3b. Update Call Sites
- In `EventCardsView`: `onSelectEvent={openEditDrawer}`.
- In `EventTableView`: `onSelectEvent={openEditDrawer}`.
- In `EventsCalendarView`: `onSelectEvent={openEditDrawer}`, `onCreateEvent={openCreateModal}`.
- In `EventsTimelineView`: `onSelectEvent={openEditDrawer}`.
- In `EventsHeader`: `onCreateClick={openCreateModal}`.

### 3c. Replace Bottom Mounts
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

### 3d. Delete Monolithic `EventFormModal.tsx`
Confirm no other imports reference `EventFormModal.tsx`, then delete the file.

**Checklist:**
- [x] Update `EventsView.tsx` state and callbacks
- [x] Connect `onSelectEvent` to `openEditDrawer` across all view tabs
- [x] Mount `<EventCreateModal>` and `<EventDrawer>`
- [x] Delete `src/components/views/EventsView/EventFormModal.tsx`
- [x] Verify `EventsView.tsx` line count stays within coordinator guidelines
- [x] Run `npm run build:check`

---

## Phase 4 — Unit Tests & Verification Gates

### 4a. Add Unit Tests in `src/components/views/EventsView/eventDrawer.test.ts`
- Test drawer rendering when `event` is provided.
- Test closing drawer via `onClose` callback.
- Test update dispatch calling `onUpdateEvent` with modified values.
- Test delete dispatch calling `onDeleteEvent`.

### 4b. Run Verification Gates
```bash
npm run drift:check       # Architectural invariants (<250 LOC, SSOT, spec pairing)
npm run build:check       # TypeScript build, 0 errors required
npm test                  # Full test suite, 0 failures required
```

Update `docs/SESSION_STATE.md`.

**Checklist:**
- [x] Create `src/components/views/EventsView/eventDrawer.test.ts`
- [x] Run `node --test src/components/views/EventsView/eventDrawer.test.ts`
- [x] Run `npm run drift:check` (`✅ No drift detected`)
- [x] Run `npm run build:check` (`0 errors`)
- [x] Run `npm test` (`0 failures`)
- [x] Update `docs/SESSION_STATE.md`
