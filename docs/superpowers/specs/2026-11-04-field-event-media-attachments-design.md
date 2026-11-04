# Spec — Field Event Media Attachments via Google Drive & TaskAttachment SSOT

**ADR:** `docs/adr/0021-field-event-media-attachments-google-drive.md`  
**Status:** Implemented  
**Date:** 2026-11-04  
**Author:** AI Pair Programmer & Lead Systems Architect  

---

## 1. Executive Summary

Field Events currently utilize two disconnected, manual URL text inputs for media management: "Field Documentation Archive" (a single text URL pointing to a Drive folder) and "B-Roll Video Clips" (manual inputs for title, duration, and URL stored in an isolated `EventFootage` table).

This specification establishes complete feature parity with Content Planner by adopting the **"Upload dari Perangkat"** pattern. Field marketing teams can directly upload photos and videos from their devices to Google Drive with automatic resumable streaming, live progress tracking, WebP thumbnail generation, and drag-and-drop capability. All assets (including raw footage Drive folder links) are stored uniformly as `TaskAttachment[]` in a new `mediaAttachments` JSONB column on the `FieldEvent` model, retiring the `EventFootage` table and aligning Field Events with the application-wide SSOT type architecture.

---

## 2. Scope & Invariants

### In-Scope
1. **Schema & SSOT**:
   - Add `mediaAttachments Json @default("[]")` to `FieldEvent` in `prisma/schema.prisma`.
   - Remove `EventFootage` relation and model in `prisma/schema.prisma`.
   - Add `mediaAttachments?: TaskAttachment[]` to `FieldEventItem` in `src/types/index.ts`.
2. **API Layer**:
   - `POST /api/marcom/events`: Extract, validate, and persist `mediaAttachments`.
   - `PATCH /api/marcom/events/[id]`: Extract, validate, and update `mediaAttachments`.
   - `GET /api/marcom/events`: Return `mediaAttachments` array on all event records.
3. **UI Modernization**:
   - In `EventFormModal.tsx`, replace the two legacy manual URL input blocks with a unified "Media & Dokumentasi Event" section.
   - Integrate `useDirectDriveUpload` and `GoogleDriveLinkModal` for device file picking and folder linking.
   - Render upload progress bar, cancel control, file badges, thumbnails, and delete actions.
4. **Viewer Playback**:
   - Modernize `EventFootageModal.tsx` to accept `TaskAttachment[]` instead of `EventFootage[]`.
   - Support both video playback (via Google Drive preview embed/direct stream) and external folder archive access.
5. **Card & Table Indicators**:
   - Update `EventCardsView.tsx` and `EventTableView.tsx` to surface attachment count badges (`🖼 N` or `🎬 N`).

### Explicit Non-Goals
- Migrating or backfilling legacy `EventFootage` database rows (mock data is discarded per user direction).
- Modifying `EventBorrowedEquipmentSection` or `EventChecklistSection`.
- Changing the Google Drive server-side proxy upload pipeline (`/api/marcom/drive/upload`, `/api/marcom/drive/finalize`).

---

## 3. Data Contracts & SSOT Invariants

### Database Schema (`prisma/schema.prisma`)

```prisma
model FieldEvent {
  id             String         @id @default(cuid())
  name           String
  eventType      String
  startDate      DateTime?
  endDate        DateTime?
  location       String         @default("")
  branchName     String         @default("")
  picName        String         @default("")
  status         EventStatus    @default(UPCOMING)
  budget         Float          @default(0)
  targetAttendee Int            @default(0)
  attendeeCount  Int            @default(0)
  notes          String         @default("")
  outletId       String?
  outlet         Outlet?        @relation(fields: [outletId], references: [id], onDelete: SetNull)
  mediaAttachments Json         @default("[]") // SSOT TaskAttachment[]
  borrowRecords  BorrowRecord[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status])
  @@index([startDate])
  @@index([branchName])
  @@index([outletId])
}
```

### Domain Interface (`src/types/index.ts`)

```ts
export interface FieldEventItem {
  id: string;
  name: string;
  eventType: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string;
  branchName?: string;
  picName?: string;
  status: EventStatus;
  budget: number;
  targetAttendee: number;
  attendeeCount: number;
  notes?: string;
  date?: string | null;
  mediaUrl?: string | null;
  mediaAttachments?: TaskAttachment[]; // SSOT attachment array
  outletId?: string | null;
  outlet?: { id: string; name: string; code: string } | null;
  checklist?: { id: string; title: string; completed?: boolean }[];
  subtasks?: { id: string; title: string; completed?: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}
```

### Folder Attachment Invariant
When a user attaches a Google Drive raw documentation folder link, it is encoded as a standard `TaskAttachment`:
```ts
{
  id: "folder-" + Date.now(),
  name: "Raw Footage & Coverage Folder",
  sizeBytes: 0,
  type: "document",
  url: "https://drive.google.com/drive/folders/...",
  source: "gdrive",
  isSharedFolder: true,
  uploadedAt: new Date().toISOString()
}
```

---

## 4. UX Flow & Component Architecture

### In `EventFormModal.tsx`
Replace lines 728–902 (both "Field Documentation Archive" and "B-Roll Video Clips") with a single unified card:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 📁 Media & Dokumentasi Event                   [Upload dari Perangkat] │
│                                                                        │
│ [ Drag & drop foto, video rekap, atau file dokumentasi ke sini ]       │
│                                                                        │
│ Upload Progress (while uploading):                                     │
│ [████████████████░░░░] 75%  Mengunggah highlight.mp4...   [Batal]      │
│                                                                        │
│ Lampiran (3 file):                                                     │
│ 1. [🖼 photo-booth.jpg]    2.4 MB  [Cover]    [Preview]  [Hapus]        │
│ 2. [🎬 event-recap.mp4]    18.5 MB            [Putar]    [Hapus]        │
│ 3. [📁 Folder Raw Drive]   Folder Drive       [Buka]     [Hapus]        │
│                                                                        │
│ [ + Tempel Link Folder / Cloud Storage ]                               │
└────────────────────────────────────────────────────────────────────────┘
```

#### Interactions:
1. **Upload Button / Dropzone**: Triggers hidden file input (`accept="image/*,video/*" multiple`) or `GoogleDriveLinkModal`.
2. **Sequential Upload**: Files stream through `useDirectDriveUpload`, updating progress in real-time.
3. **Thumbnail & Cover**: Photos generate 800px WebP thumbnails via Sharp; first image/video automatically serves as cover.
4. **Folder Link Addition**: Allows pasting a Google Drive folder link for raw assets without needing to upload gigabytes of footage through the browser.

---

## 5. API Contracts

### `POST /api/marcom/events` & `PATCH /api/marcom/events/[id]`

**Request Payload:**
```json
{
  "name": "Roadshow Campus Surabaya",
  "eventType": "Roadshow",
  "branchName": "Surabaya",
  "mediaAttachments": [
    {
      "id": "gdrive-123",
      "name": "recap.mp4",
      "sizeBytes": 15420000,
      "type": "video",
      "url": "https://drive.google.com/file/d/123/view",
      "embedUrl": "https://drive.google.com/file/d/123/preview",
      "source": "gdrive",
      "driveFileId": "123",
      "thumbnailUrl": "https://xyz.supabase.co/storage/v1/object/public/content-thumbnails/...",
      "uploadedAt": "2026-11-04T01:00:00Z"
    }
  ]
}
```

**Validation Guard:**
- Ensure `mediaAttachments` is an array of objects conforming to `TaskAttachment`.
- Default to `[]` if null or omitted.
- Synchronize `mediaUrl` with `mediaAttachments[0]?.url || null`.

---

## 6. Acceptance & Verification Criteria

| ID | Criteria | Verification Method |
|---|---|---|
| AC-01 | User can click "Upload dari Perangkat" in `EventFormModal` and pick one or more files from device | Manual / component test |
| AC-02 | Files upload sequentially to Google Drive with active percentage progress bar | Unit test on upload handler |
| AC-03 | Attached files render in the modal list with thumbnail, name, file size, and remove button | Visual inspection & unit test |
| AC-04 | User can attach a Google Drive folder URL for raw documentation archive | Form state test |
| AC-05 | Submitting form persists `mediaAttachments` to PostgreSQL `FieldEvent` table | API integration test |
| AC-06 | `EventFootageModal` plays videos from `TaskAttachment[]` and provides folder external link | Component test |
| AC-07 | Drift check passes with 0 violations: `npm run drift:check` | CLI command |
| AC-08 | TypeScript build check passes with 0 errors: `npm run build:check` | CLI command |
| AC-09 | Full test suite passes: `npm test` with 0 failures | CLI command |
