# Handover: Integrasi EventMediaSection ke EventCreateModal

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-event-create-modal-media-attachments-design.md`  
**Plan:** `docs/superpowers/plans/2026-11-05-event-create-modal-media-attachments.md`  
**ADR:** `docs/adr/0027-event-create-modal-media-attachments.md`  
**Status:** READY TO EXECUTE

---

## 1. File Manifest & One-Line Purpose

1. `src/components/views/EventsView/EventCreateModal.tsx`: Form modal create field event; mengintegrasikan state media, merender sub-komponen `EventMediaSection`, mengemas payload submit.
2. `src/components/views/EventsView/eventDrawer.test.ts`: Automated unit test suite untuk modul Events; memverifikasi integrasi sub-komponen `EventMediaSection` di `EventCreateModal.tsx`.

---

## 2. Exact Current Code Snippets (As-Is)

### 2.1 Current Imports di `src/components/views/EventsView/EventCreateModal.tsx` (baris 13-25):
```tsx
import type {
  FieldEventItem,
  EventStatus,
  User,
} from "@/types";
import { cn, formatIDR } from "@/lib/utils";
import {
  getEventChecklistTemplate,
  findMemberForPic,
} from "@/lib/marcom/eventChecklist";
import { EventChecklistSection } from "./EventChecklistSection";
import { formatOutletSelectLabel } from "@/lib/marcom/outletRelations";
```

### 2.2 Current State Hooks di `src/components/views/EventsView/EventCreateModal.tsx` (baris 56-62):
```tsx
  const [eventStatus, setEventStatus] = useState<EventStatus>("UPCOMING");
  const [eventBudget, setEventBudget] = useState<string>("15000000");
  const [eventTargetAttendee, setEventTargetAttendee] = useState<string>("250");
  const [eventAttendeeCount, setEventAttendeeCount] = useState<string>("0");
  const [eventNotes, setEventNotes] = useState("");
  const [eventSubtasks, setEventSubtasks] = useState<EventChecklistSubtask[]>([]);
  const [eventOutletId, setEventOutletId] = useState<string>("");
```

### 2.3 Current `handleSubmit` Payload di `src/components/views/EventsView/EventCreateModal.tsx` (baris 172-188):
```tsx
      const payload = {
        name: eventName.trim(),
        eventType,
        branchName: eventBranchName,
        location: eventLocation.trim(),
        outletId: eventOutletId || null,
        date: eventStartDate || undefined,
        endDate: eventEndDate || undefined,
        picName: eventPicName.trim(),
        status: eventStatus,
        budget: parsedBudget,
        targetAttendee: parsedTargetAttendee,
        attendeeCount: parsedAttendeeCount,
        notes: eventNotes.trim(),
        checklist: eventSubtasks,
        mediaAttachments: [],
      };
```

### 2.4 Current `createdItem` di `src/components/views/EventsView/EventCreateModal.tsx` (baris 203-221):
```tsx
      const createdItem: FieldEventItem = {
        id: created.id,
        name: eventName.trim(),
        eventType,
        branchName: eventBranchName,
        location: eventLocation,
        startDate: eventStartDate || null,
        date: eventStartDate || null,
        endDate: eventEndDate || null,
        picName: picMember?.name || eventPicName,
        status: eventStatus,
        budget: parsedBudget,
        targetAttendee: parsedTargetAttendee,
        attendeeCount: parsedAttendeeCount,
        notes: eventNotes,
        mediaAttachments: [],
        outletId: eventOutletId || null,
        checklist: eventSubtasks,
      };
```

### 2.5 Current JSX Rendering di `src/components/views/EventsView/EventCreateModal.tsx` (baris 593-613):
```tsx
              {/* Notes & Permits */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logistics, Permits & Operational Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Mall management permit approved. Need 3 wireless mics, stage backdrop 6x3m, electricity 5500W..."
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden resize-y"
                />
              </div>

              {/* Event Preparation Checklist (Subtasks) */}
              <EventChecklistSection
                eventType={eventType}
                eventSubtasks={eventSubtasks}
                setEventSubtasks={setEventSubtasks}
              />
```

---

## 3. Exact Change Instructions

### Step 1: Modifikasi `src/components/views/EventsView/EventCreateModal.tsx`

#### 1. Tambahkan Import:
Tambahkan `TaskAttachment` ke import `@/types` dan import `EventMediaSection`:
```tsx
import type {
  FieldEventItem,
  EventStatus,
  User,
  TaskAttachment,
} from "@/types";
import { EventMediaSection } from "./EventMediaSection";
```

#### 2. Deklarasikan State Media:
Tambahkan dua state baru di dalam komponen `EventCreateModal`:
```tsx
  const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string>("");
```

#### 3. Perluas Fungsi `resetForm`:
Bersihkan state media saat reset form:
```tsx
  const resetForm = () => {
    setEventName("");
    setEventType("Roadshow");
    setEventBranchName("");
    setEventLocation("");
    setEventStartDate(defaultDate || new Date().toISOString().slice(0, 10));
    setEventEndDate("");
    setEventPicName("");
    setPicMemberId("");
    setEventStatus("UPCOMING");
    setEventBudget("15000000");
    setEventTargetAttendee("250");
    setEventAttendeeCount("0");
    setEventNotes("");
    setEventSubtasks([]);
    setMediaAttachments([]);
    setMediaUrl("");
  };
```

#### 4. Sinkronkan `handleSubmit` Payload & `createdItem`:
Ganti payload `mediaAttachments: []` menjadi array riil dan sertakan `mediaUrl`:
```tsx
    const resolvedMediaUrl = mediaUrl.trim() || mediaAttachments[0]?.url || "";

    const payload = {
      name: eventName.trim(),
      eventType,
      branchName: eventBranchName,
      location: eventLocation.trim(),
      outletId: eventOutletId || null,
      date: eventStartDate || undefined,
      endDate: eventEndDate || undefined,
      picName: eventPicName.trim(),
      status: eventStatus,
      budget: parsedBudget,
      targetAttendee: parsedTargetAttendee,
      attendeeCount: parsedAttendeeCount,
      notes: eventNotes.trim(),
      checklist: eventSubtasks,
      mediaAttachments,
      mediaUrl: resolvedMediaUrl,
    };
```
Dan pada `createdItem`:
```tsx
    const createdItem: FieldEventItem = {
      id: created.id,
      name: eventName.trim(),
      eventType,
      branchName: eventBranchName,
      location: eventLocation,
      startDate: eventStartDate || null,
      date: eventStartDate || null,
      endDate: eventEndDate || null,
      picName: picMember?.name || eventPicName,
      status: eventStatus,
      budget: parsedBudget,
      targetAttendee: parsedTargetAttendee,
      attendeeCount: parsedAttendeeCount,
      notes: eventNotes,
      mediaAttachments,
      mediaUrl: created.mediaUrl || resolvedMediaUrl,
      outletId: eventOutletId || null,
      checklist: eventSubtasks,
    };
```

#### 5. Mount Sub-Komponen di JSX:
Sisipkan `<EventMediaSection />` tepat sebelum `<EventChecklistSection />`:
```tsx
              {/* Event Media & Documentation Section */}
              <EventMediaSection
                mediaAttachments={mediaAttachments}
                setMediaAttachments={setMediaAttachments}
                mediaUrl={mediaUrl}
                setMediaUrl={setMediaUrl}
                eventName={eventName}
              />
```

---

### Step 2: Modifikasi `src/components/views/EventsView/eventDrawer.test.ts`
Tambahkan test case yang memverifikasi bahwa `EventCreateModal.tsx` mengimpor dan merender `EventMediaSection`:
```typescript
  it("verifies EventCreateModal integrates EventMediaSection and supports mediaAttachments", () => {
    const modalPath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventCreateModal.tsx"
    );
    const content = fs.readFileSync(modalPath, "utf-8");

    assert.ok(
      content.includes("import { EventMediaSection }"),
      "EventCreateModal must import EventMediaSection"
    );
    assert.ok(
      content.includes("<EventMediaSection"),
      "EventCreateModal must render EventMediaSection component"
    );
    assert.ok(
      content.includes("mediaAttachments={mediaAttachments}"),
      "EventCreateModal must wire mediaAttachments prop to EventMediaSection"
    );
    assert.ok(
      !content.includes("mediaAttachments: [],"),
      "EventCreateModal must not hardcode mediaAttachments as empty array in payload or createdItem"
    );
  });
```

---

## 4. Explicit "Do Not Touch" List

1. **`src/components/views/EventsView/EventMediaSection.tsx`**: JANGAN ubah prop interface atau fungsi internal komponen ini karena sudah dipakai secara stabil oleh `EventDrawer.tsx`.
2. **`prisma/schema.prisma`**: JANGAN lakukan migrasi database atau menambah kolom baru. Kolom `mediaAttachments` sudah bertipe `Json` dan `mediaUrl` sudah ada sejak ADR-0021.
3. **`src/app/api/marcom/events/route.ts`**: JANGAN modifikasi route backend ini kecuali jika ditemukan validasi yang menolak `mediaAttachments`. Route ini sudah memiliki parser array `TaskAttachment[]`.
4. **`src/components/views/ProjectsView/ProjectsCreateModalHost.tsx`**: JANGAN ubah host coordinator ini; interface props `EventCreateModal` (`isOpen`, `onClose`, `defaultDate`, `branches`, `members`, `onCreated`) tetap 100% kompatibel.

---

## 5. Numbered Execution Order

1. **Step 1**: Terapkan modifikasi pada `src/components/views/EventsView/EventCreateModal.tsx`.
2. **Step 2**: Tambahkan test case di `src/components/views/EventsView/eventDrawer.test.ts`.
3. **Step 3**: Jalankan targeted unit test: `node --test src/components/views/EventsView/eventDrawer.test.ts`.
4. **Step 4**: Jalankan verification gates:
   - `npm run drift:check`
   - `npm run build:check`
   - `npm test`
5. **Step 5**: Update `docs/SESSION_STATE.md` dan commit perubahan dengan format git konvensional.

---

## 6. Acceptance Criteria Checklist

- [ ] `EventCreateModal.tsx` mengimpor `EventMediaSection` dan mendefinisikan state `mediaAttachments` dan `mediaUrl`.
- [ ] `EventMediaSection` terpasang di JSX antara notes dan checklist.
- [ ] Payload submit mengirimkan `mediaAttachments` dan `mediaUrl`.
- [ ] Tidak ada lagi hardcoded `mediaAttachments: []` di `EventCreateModal.tsx`.
- [ ] State form dibersihkan saat modal ditutup atau berhasil dibuat.
- [ ] Targeted test `eventDrawer.test.ts` lolos tanpa kegagalan.
- [ ] `npm run drift:check` mengonfirmasi 0 drift dan 54 spec-plan pairs.
- [ ] `npm run build:check` lolos dengan 0 TypeScript error.
- [ ] `npm test` lolos dengan 0 kegagalan di seluruh test suite.



