# Handover — Field Event Media Attachments (ADR-0021 / Spec / Plan)

**Date:** 2026-11-04  
**Feature:** Field Event Media Attachments via Google Drive & TaskAttachment SSOT  
**Status:** Planning Complete — Execution Ready  
**Artifacts Generated:**
- ADR: `docs/adr/0021-field-event-media-attachments-google-drive.md`
- Spec: `docs/superpowers/specs/2026-11-04-field-event-media-attachments-design.md`
- Implementation Plan: `docs/superpowers/plans/2026-11-04-field-event-media-attachments.md`

---

## 1. Executive Summary & Objective

In this planning session, we designed the unification of Field Event media handling with the Content Planner pattern. Currently, `EventFormModal` forces users to manually paste Google Drive links and enter clip metadata (`title`, `duration`, `filePath`) for an isolated `EventFootage` table. 

This change replaces those legacy text fields with the **"Upload dari Perangkat"** pattern: direct multi-file upload from device to Google Drive via `useDirectDriveUpload`, real-time progress indicators, WebP thumbnail generation via Sharp/Supabase Storage, and unified persistence as `TaskAttachment[]` in a new `mediaAttachments` JSONB column on `FieldEvent`.

User confirmed: **Existing mock data / database records for field events do NOT need migration.**

---

## 2. Exact Execution Order for the Next Session

When executing this plan in the next session, run tasks in this exact sequence:

1. **Step 1: Database Migration & Schema Update**
   - Modify `prisma/schema.prisma`:
     - Add `mediaAttachments Json @default("[]")` to `model FieldEvent`.
     - Remove `footage EventFootage[]` from `model FieldEvent`.
     - Delete `model EventFootage`.
   - Create migration: `prisma/migrations/20261104000000_add_field_event_media_attachments/migration.sql` with:
     ```sql
     ALTER TABLE "FieldEvent" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';
     DROP TABLE IF EXISTS "EventFootage";
     ```
   - Run: `npx prisma migrate resolve --applied 20261104000000_add_field_event_media_attachments`
   - Run: `npx prisma generate`

2. **Step 2: Domain Entity SSOT Update**
   - In `src/types/index.ts`, update `FieldEventItem`:
     - Add `mediaAttachments?: TaskAttachment[];`
     - Keep `mediaUrl?: string | null;` for backward compatibility.
   - Run: `npm run build:check`

3. **Step 3: API Route Updates**
   - `src/app/api/marcom/events/route.ts`:
     - Remove `footage: true` from `eventInclude`.
     - Extract `mediaAttachments` from `body` in `POST`.
     - Validate `mediaAttachments` is an array of `TaskAttachment`.
     - Pass `mediaAttachments` to `prisma.fieldEvent.create`.
   - `src/app/api/marcom/events/[id]/route.ts`:
     - Add `"mediaAttachments"` to `PATCHABLE_FIELDS`.
     - Remove `footage` handling in `PATCH`.
     - Update `data["mediaAttachments"]` with validated array.

4. **Step 4: UI Modernization in `EventFormModal.tsx`**
   - Import `useDirectDriveUpload`, `TaskAttachment`, and icons (`Upload`, `Film`, `File`, `Folder`, `ExternalLink`, `Loader2`).
   - Add state: `mediaAttachments: TaskAttachment[]`, `folderUrlInput: string`, `showFolderInput: boolean`.
   - Wire hidden file input with `accept="image/*,video/*" multiple` to `handleDeviceFilesSelected`.
   - Replace lines 728–902 with unified "Media & Dokumentasi Event" section (detailed template in plan).
   - Update `handleSaveEvent` to send `mediaAttachments: mediaAttachments`.

5. **Step 5: Modernize `EventFootageModal.tsx` & View Badges**
   - In `EventFootageModal.tsx`, adapt `clips` to read from `event.mediaAttachments`.
   - In `EventCardsView.tsx`, update `primaryClip` and badge to use `event.mediaAttachments`.
   - In `EventTableView.tsx`, show attachment count based on `e.mediaAttachments`.

6. **Step 6: Verification Gates**
   - Run: `npm run drift:check` (must be 0 drift).
   - Run: `npm run build:check` (must be 0 TS errors).
   - Run: `npm test` (all test suites must pass).
   - Update `docs/SESSION_STATE.md`.

---

## 3. Explicit "Do Not Touch" List

- **`src/app/api/marcom/drive/upload/route.ts` & `finalize/route.ts`**: Shared Google Drive server-to-server proxy. Works reliably; do not touch.
- **`src/lib/marcom/useDirectDriveUpload.ts`**: Shared direct streaming hook.
- **`src/components/ui/GoogleDriveLinkModal.tsx`**: Shared modal component.
- **`src/components/views/EventsView/EventBorrowedEquipmentSection.tsx`**: Isolated equipment borrowing logic.
- **`src/components/views/EventsView/EventChecklistSection.tsx`**: Isolated task checklist logic.

---

## 4. Acceptance Criteria Checklist

- [ ] "Upload dari Perangkat" button is prominently displayed in `EventFormModal`.
- [ ] Users can drag-and-drop or select multiple media files directly from their local device.
- [ ] Active upload progress bar displays upload percentage and cancellation control.
- [ ] Uploaded files display in an interactive list with type icons (`Film` vs `File` vs `Folder`), formatted file sizes, and remove buttons.
- [ ] Users can attach an external Google Drive folder link for raw coverage archives.
- [ ] Submitting form persists `mediaAttachments` to PostgreSQL.
- [ ] `EventFootageModal` plays videos from `TaskAttachment[]` and opens folder archives.
- [ ] `npm run drift:check` passes with `0 errors`.
- [ ] `npm run build:check` passes with `0 errors`.
- [ ] `npm test` passes with `0 failures`.
