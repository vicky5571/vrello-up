# Handover — Field Event Edit Drawer and Modal Separation (ADR-0022 / Spec / Plan)

**Date:** 2026-11-04  
**Feature:** Field Event Edit Drawer & Creation Modal Separation  
**Status:** Planning Complete — Execution Ready  
**Artifacts Generated:**
- ADR: `docs/adr/0022-field-event-edit-drawer.md`
- Spec: `docs/superpowers/specs/2026-11-04-field-event-edit-drawer-design.md`
- Implementation Plan: `docs/superpowers/plans/2026-11-04-field-event-edit-drawer.md`

---

## 1. Executive Summary & Objective

In this planning session, we designed the transformation of the Field Event editing experience into a right slide-over drawer (`EventDrawer.tsx`, 560px wide) mirroring Content Planner's `ContentDrawer.tsx`, while strictly preserving the centered creation modal (`EventCreateModal.tsx`) for fast event initiation.

This decomposes the monolithic 950-line `EventFormModal.tsx` into clean, single-responsibility components and provides field marketing managers with ample vertical real estate to review operational notes, Google Drive media attachments, equipment borrowing records, and task checklists.

---

## 2. Files That Matter

| File Path | Purpose | Action in Next Session |
|---|---|---|
| `src/components/views/EventsView/EventCreateModal.tsx` | Dedicated creation dialog | Create (extract create logic) |
| `src/components/views/EventsView/EventDrawer.tsx` | 560px slide-over edit drawer | Create (model after `ContentDrawer.tsx`) |
| `src/components/views/EventsView/EventsView.tsx` | View coordinator | Modify (wire drawer and modal) |
| `src/components/views/EventsView/EventFormModal.tsx` | 950-line monolith | Delete after migration |
| `src/components/views/EventsView/eventDrawer.test.ts` | Interaction unit tests | Create |

---

## 3. Exact Code Changes & Execution Order

### Step 1: Create `src/components/views/EventsView/EventCreateModal.tsx`
Create the dedicated create modal preserving the exact form inputs from your screenshot:
- Name, eventType, branch, location, outlet, dates, PIC, budget, target attendees, notes, and checklist template.
- Submits `POST /api/marcom/events`.

### Step 2: Create `src/components/views/EventsView/EventDrawer.tsx`
Create the slide-over drawer:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
  className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer z-40"
/>
<motion.div
  initial={{ x: "100%" }}
  animate={{ x: 0 }}
  exit={{ x: "100%" }}
  transition={{ type: "spring", damping: 28, stiffness: 300 }}
  className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[560px] h-full bg-white dark:bg-[#18191B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
>
  {/* Sticky Header, Scrollable Body, Sticky Footer */}
</motion.div>
```

### Step 3: Update `src/components/views/EventsView/EventsView.tsx`
1. Replace lines 85–89:
```typescript
// BEFORE:
const [isFormModalOpen, setIsFormModalOpen] = useState(false);
const [editingEvent, setEditingEvent] = useState<FieldEventItem | null>(null);
const [defaultDate, setDefaultDate] = useState<string | undefined>();

// AFTER:
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [selectedDrawerEvent, setSelectedDrawerEvent] = useState<FieldEventItem | null>(null);
const [defaultDate, setDefaultDate] = useState<string | undefined>();
```
2. Replace lines 140–156:
```typescript
// BEFORE:
const openCreateModal = useCallback((initialDate?: string) => {
  setEditingEvent(null);
  setDefaultDate(initialDate);
  setIsFormModalOpen(true);
}, []);

const openEditModal = useCallback((event: FieldEventItem) => {
  setEditingEvent(event);
  setDefaultDate(undefined);
  setIsFormModalOpen(true);
}, []);

const closeFormModal = useCallback(() => {
  setIsFormModalOpen(false);
  setEditingEvent(null);
  setDefaultDate(undefined);
}, []);

// AFTER:
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
3. Replace lines 422–433:
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

### Step 4: Delete `src/components/views/EventsView/EventFormModal.tsx`
Verify zero remaining imports with `git grep "EventFormModal"`, then delete.

### Step 5: Verification Gates
```bash
npm run drift:check
npm run build:check
npm test
```

---

## 4. Explicit "Do Not Touch" List

- `src/components/views/EventsView/EventBorrowedEquipmentSection.tsx`: Reused inside `EventDrawer` without changes.
- `src/components/views/EventsView/EventChecklistSection.tsx`: Reused inside both modal and drawer without changes.
- `src/components/views/EventsView/EventFootageModal.tsx`: Shared media lightbox player.
- `src/components/views/ContentPlannerView/*`: Content Planner is read-only reference.

---

## 5. Acceptance Criteria Checklist

- [ ] Clicking "+ Event Baru" opens the centered `<EventCreateModal>`.
- [ ] Clicking an event card or table row slides open `<EventDrawer>` from the right (560px wide).
- [ ] Drawer matches `ContentDrawer` visual styling (backdrop blur, spring animation, sticky header & footer).
- [ ] Saving updates via `EventDrawer` dispatches PATCH and reflects immediately in the UI.
- [ ] Deleting an event inside `EventDrawer` prompts confirmation, dispatches DELETE, and closes the drawer.
- [ ] Monolithic `EventFormModal.tsx` is completely removed.
- [ ] `npm run drift:check` passes with `✅ No drift detected`.
- [ ] `npm run build:check` passes with `0 errors`.
- [ ] `npm test` passes with `0 failures`.
