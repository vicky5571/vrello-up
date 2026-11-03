# Spec — Multi-File Media Upload for Content Posts

**ADR:** `docs/adr/0016-multi-file-media-upload-content-post.md`  
**Status:** Proposed  
**Date:** 2026-11-03  

---

## Executive Summary

Allow users to upload multiple media files per content post. Files are stored as `TaskAttachment[]` in a new `mediaAttachments` JSON column. `mediaUrl` remains as the cover/primary URL for backward compatibility with all existing display components.

---

## Data Model Changes

### `src/types/index.ts` — `ContentPostItem`

```ts
// BEFORE:
export interface ContentPostItem {
  ...
  mediaUrl?: string;
  ...
}

// AFTER:
export interface ContentPostItem {
  ...
  mediaUrl?: string;                        // cover / primary — unchanged
  mediaAttachments?: TaskAttachment[];      // all files including cover — NEW
  ...
}
```

### `prisma/schema.prisma` — `ContentPost` model

```prisma
// ADD one column:
mediaAttachments  Json   @default("[]")
```

### DB Migration

```sql
ALTER TABLE "ContentPost"
ADD COLUMN "mediaAttachments" JSONB NOT NULL DEFAULT '[]';
```

### Sync Rule (enforced in save logic)

```
mediaUrl        = mediaAttachments[0]?.url ?? ""
mediaAttachments = [cover, ...extras]
```

Always kept in sync at save time. If `mediaAttachments` is empty, `mediaUrl` is also cleared.

---

## Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | User can upload 1–N files in `GoogleDriveLinkModal` "Unggah Langsung" tab |
| FR-02 | Each uploaded file is appended to a list — modal does NOT close after first file |
| FR-03 | User sees a list of uploaded files with name, size, type icon, and a remove button |
| FR-04 | User clicks "Selesai" / "Lampirkan X File" to confirm and close the modal |
| FR-05 | On confirm, `onAttach` is called once with all `TaskAttachment[]` items |
| FR-06 | First attachment's `url` becomes `mediaUrl` (cover); all attachments stored in `mediaAttachments` |
| FR-07 | ContentDrawer shows all attached files as a scrollable thumbnail list |
| FR-08 | User can remove individual files from the list in ContentDrawer |
| FR-09 | Removing the cover file (index 0) promotes the next file to cover |
| FR-10 | "Tambah Media" button re-opens modal to add more files to an existing list |

---

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Files upload sequentially (not parallel) to avoid server overload |
| NFR-02 | Each file shows individual progress in the modal list |
| NFR-03 | Upload can be cancelled per-file |
| NFR-04 | Max 10 files per post (UI enforced) |
| NFR-05 | Existing single-`mediaUrl` posts render correctly without `mediaAttachments` |

---

## UX Flow

### In `GoogleDriveLinkModal` (Upload tab)

```
[Dropzone — drag or click to add files]

Uploaded files:
  [img] photo1.jpg    1.2 MB  ✓  [×]
  [vid] video.mp4     24 MB   ↑ 67%  [cancel]
  [doc] brief.pdf     0.4 MB  ✓  [×]

                    [Tambah File Lagi]

        [Batal]   [Lampirkan 3 File →]
```

- Dropzone stays visible after upload — user can drop/click more files
- Each file in list shows: type icon, name, size, status (uploading % or ✓), remove button
- "Lampirkan X File" button is enabled when at least 1 file has finished uploading
- Files still uploading are included in the count but "Lampirkan" waits for all to finish (or skips failed ones)

### In `ContentDrawer` (media section)

```
Aset Media / Video Footage                    [Tambah Media]

  [thumb] photo1.jpg     Google Drive  ⋯ cover  [×]
  [thumb] video.mp4      Google Drive          [×]
  [icon]  brief.pdf      Google Drive          [×]
```

- First item has "cover" badge — it's the `mediaUrl`
- "×" removes that item; if it's the cover, next item becomes cover
- "Tambah Media" opens the modal again in append mode

---

## API Changes

### `PATCH /api/marcom/content/[id]`

Accept new optional field in body:
```ts
mediaAttachments?: TaskAttachment[]   // parsed from JSON body
```

Store as-is in `data.mediaAttachments`. Keep existing `mediaUrl` handling unchanged.

### No changes to `POST /api/marcom/drive/upload`

Upload route is file-agnostic — each file is uploaded individually. No batch upload endpoint needed.

---

## Components to Change

| Component | Change |
|---|---|
| `GoogleDriveLinkModal.tsx` | Multi-file list UI, "Lampirkan X File" confirm button, `onAttach` signature change |
| `DirectDriveUploadDropzone.tsx` | Stays single-file per call — called multiple times by the modal |
| `ContentDrawer.tsx` | Show attachment list, remove per-item, sync `mediaUrl` with `mediaAttachments[0]` |
| `ContentPlannerView.tsx` | `onAttach` callback now receives `TaskAttachment[]` — update `pendingUploadAttachRef` type |
| `src/types/index.ts` | Add `mediaAttachments?: TaskAttachment[]` to `ContentPostItem` |
| `prisma/schema.prisma` | Add `mediaAttachments Json @default("[]")` |
| `src/app/api/marcom/content/[id]/route.ts` | Accept `mediaAttachments` in PATCH body |
| `src/app/api/marcom/content/route.ts` | Accept `mediaAttachments` in POST body |

## Components NOT to Change

| Component | Reason |
|---|---|
| `useDirectDriveUpload.ts` | Single-file hook — correct as-is, called N times |
| `useGoogleDrivePicker.ts` | Picker path is separate, unrelated |
| Board cards / Gantt / table | Use `mediaUrl` only — unchanged |
| `ContentPostModal.tsx` | Separate create flow — multi-file is a v2 for that form |

---

## `GoogleDriveLinkModal` Prop Change

```ts
// BEFORE:
onAttach: (url: string, customTitle?: string) => void;

// AFTER:
onAttach: (attachments: TaskAttachment[]) => void;
```

All callers of `GoogleDriveLinkModal` must be updated:
- `ContentPlannerView.tsx` (upload modal instance) — update `pendingUploadAttachRef`
- `ContentPlannerView.tsx` (picker fallback instance) — `handleManualAttach` also needs update
- `useGoogleDrivePicker.ts` — `handleManualAttach` currently calls `onSelectRef.current([attachment])` — this already returns `TaskAttachment[]`, just need to align the modal's `onAttach` signature

---

## Non-Goals

- Reordering files (drag-to-reorder) — future enhancement
- Multi-file upload in `ContentPostModal` (create flow) — separate task
- Batch delete from Drive — out of scope
- Image cropping / preview generation — out of scope
