# Specification: Field Event Create Modal Media Attachments Integration

## Status
IMPLEMENTED (ADR-0027)

## Date
2026-11-05

## 1. Executive Summary
Spesifikasi ini mengatur integrasi sub-komponen atomik `EventMediaSection` (`src/components/views/EventsView/EventMediaSection.tsx`) ke dalam form pembuatan event baru `EventCreateModal.tsx`. Dengan integrasi ini, koordinator lapangan dan tim Marcom dapat langsung melampirkan media (gambar poster, banner hero, video footage, atau Google Drive folder link) ketika pertama kali membuat field event, tanpa harus menunggu event tersimpan lalu membukanya di slide drawer `EventDrawer.tsx`.

---

## 2. Problem Statement & User Flow

### 2.1 The Problem
Pada implementasi saat ini di `EventCreateModal.tsx`, `mediaAttachments` di-hardcode menjadi array kosong `[]` pada baris 187 (`POST /api/marcom/events`) dan baris 218 (`onCreated(createdItem)`). Hal ini menyebabkan:
1. Operator tidak dapat melampirkan poster promosi atau materi branding saat inisiasi event.
2. Operator harus melakukan dua langkah: (1) buat event tanpa media, (2) cari event di kartu, klik untuk membuka `EventDrawer`, lalu upload file di sana.
3. Inkonsistensi dengan `ContentPostModal.tsx` di Content Planner yang sudah mendukung multi-file upload saat form create dibuka.

### 2.2 Target User Experience
1. **Membuka Modal Buat Event**: Pengguna mengklik "+ New Event" atau "+ Add Event" dari header `EventsView` atau host `ProjectsCreateModalHost.tsx`.
2. **Pengisian Data Utama**: Pengguna mengisi nama event, tipe event, cabang, lokasi, PIC, status, dan target anggaran.
3. **Melampirkan Media**:
   - Pengguna melihat section **"Event Media & Documentation"** yang dirender oleh `EventMediaSection`.
   - Pengguna dapat melakukan drag-and-drop file gambar/video (langsung diunggah ke Google Drive Marcom via `useDirectDriveUpload("events")`).
   - Pengguna dapat memasukkan URL folder Google Drive (dengan validasi otomatis regex folder ID).
   - Pengguna dapat memilih gambar mana yang dijadikan **Cover/Hero Banner** (tersimpan di `mediaUrl`).
4. **Submit Form**: Pengguna menekan tombol "Create Field Event":
   - Form memvalidasi input.
   - Mengirim payload JSON lengkap berisi `mediaAttachments: TaskAttachment[]` dan `mediaUrl: string` ke `POST /api/marcom/events`.
   - Callback `onCreated(createdItem)` menerima item dengan `mediaAttachments` dan `mediaUrl` riil.
   - Modal tertutup dan state lokal `mediaAttachments` serta `mediaUrl` di-reset ke nilai default awal kosong.

---

## 3. Component Manifest & Architectural Contracts

| Komponen / Modul | Path File | Tanggung Jawab |
|---|---|---|
| `EventMediaSection.tsx` | `src/components/views/EventsView/EventMediaSection.tsx` | Sub-komponen visual presentasional untuk upload direct Google Drive, input folder link, reordering attachment, dan pemilihan cover banner. |
| `EventCreateModal.tsx` | `src/components/views/EventsView/EventCreateModal.tsx` | Form modal pembuatan field event baru. Mengelola state `mediaAttachments` dan `mediaUrl`, memanggil `EventMediaSection`, mengemas payload POST, dan mereset form. |
| `POST /api/marcom/events` | `src/app/api/marcom/events/route.ts` | Endpoint REST untuk persistensi `FieldEvent`. Menerima dan memvalidasi `mediaAttachments` dan `mediaUrl`. |
| `eventDrawer.test.ts` | `src/components/views/EventsView/eventDrawer.test.ts` | Unit test suite yang memverifikasi eksistensi dan integrasi `EventMediaSection` di dalam `EventCreateModal.tsx`. |

---

## 4. Pure Logic & State Contracts

### 4.1 State Management di `EventCreateModal.tsx`
```typescript
import type { TaskAttachment } from "@/types";
import { EventMediaSection } from "./EventMediaSection";

// State hooks baru di dalam EventCreateModal:
const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
const [mediaUrl, setMediaUrl] = useState<string>("");
```

### 4.2 Reset Form Semantics
Form reset harus mencakup `mediaAttachments` dan `mediaUrl`:
```typescript
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
State juga dibersihkan saat `onClose()` dieksekusi atau `isOpen` berubah menjadi false.

### 4.3 JSX Placement
`EventMediaSection` dimount di dalam scrollable form body, tepat setelah bagian **Notes & Permits** (`eventNotes`) dan sebelum **Event Preparation Checklist** (`EventChecklistSection`):
```tsx
{/* Logistics, Permits & Operational Notes */}
<div>
  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
    Logistics, Permits & Operational Notes
  </label>
  <textarea ... />
</div>

{/* Media & Documentation Attachments */}
<EventMediaSection
  mediaAttachments={mediaAttachments}
  setMediaAttachments={setMediaAttachments}
  mediaUrl={mediaUrl}
  setMediaUrl={setMediaUrl}
  eventName={eventName}
/>

{/* Event Preparation Checklist (Subtasks) */}
<EventChecklistSection
  eventType={eventType}
  eventSubtasks={eventSubtasks}
  setEventSubtasks={setEventSubtasks}
/>
```

### 4.4 Payload & OnCreated Synchronization
Pada `handleSubmit`:
```typescript
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
Dan pada konstruksi `createdItem`:
```typescript
const createdItem: FieldEventItem = {
  ...
  mediaAttachments,
  mediaUrl: created.mediaUrl || resolvedMediaUrl,
  ...
};
```

---

## 5. Non-Goals
1. **Tidak Mengubah Skema Prisma**: Kolom `mediaAttachments Json @default("[]")` sudah ada sejak ADR-0021. Tidak ada migrasi database baru.
2. **Tidak Mengubah Komponen Peminjaman Inventaris**: `EventBorrowedEquipmentSection` tetap khusus untuk event yang sudah ada di drawer (karena peminjaman barang membutuhkan `eventId` riil dari database).
3. **Tidak Mengubah Host Wrapper**: `ProjectsCreateModalHost.tsx` tetap membungkus `EventCreateModal` secara transparan tanpa perlu perubahan prop interface.

---

## 6. Acceptance Criteria
- [ ] `EventCreateModal.tsx` mengimpor `EventMediaSection` dan mengelola state `mediaAttachments` dan `mediaUrl`.
- [ ] Sub-komponen `EventMediaSection` tampil rapi di dalam modal create di antara Notes dan Checklist.
- [ ] Pengguna dapat mengunggah file langsung ke Google Drive dan memasukkan tautan Google Drive folder.
- [ ] Gambar pertama otomatis menjadi cover default, atau pengguna dapat menetapkan cover hero secara manual.
- [ ] Saat event disimpan, `mediaAttachments` tersimpan di database dan langsung terlihat ketika kartu event dibuka di drawer.
- [ ] Saat modal ditutup atau di-reset, state lampiran kembali bersih ke `[]`.
- [ ] Unit test di `src/components/views/EventsView/eventDrawer.test.ts` memverifikasi integrasi `EventMediaSection` di `EventCreateModal`.
- [ ] Semua verifikasi invariants (`npm run drift:check`, `npm run build:check`, `npm test`) lulus dengan 0 kesalahan.



