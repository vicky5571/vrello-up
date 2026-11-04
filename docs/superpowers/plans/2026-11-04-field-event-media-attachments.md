# Plan — Field Event Media Attachments via Google Drive & TaskAttachment SSOT

**Status:** Completed  
**Date:** 2026-11-04  
**ADR:** `docs/adr/0021-field-event-media-attachments-google-drive.md`  
**Spec:** `docs/superpowers/specs/2026-11-04-field-event-media-attachments-design.md`  

---

## File Manifest & Responsibility Mapping

| File Path | Role / Responsibility | Action |
|---|---|---|
| `prisma/schema.prisma` | Add `mediaAttachments Json` to `FieldEvent`, remove `EventFootage` model | Modify |
| `prisma/migrations/20261104000000_add_field_event_media_attachments/migration.sql` | SQL migration for database column and table drop | Create |
| `src/types/index.ts` | Domain entity SSOT — add `mediaAttachments?: TaskAttachment[]` to `FieldEventItem` | Modify |
| `src/app/api/marcom/events/route.ts` | POST/GET events handler — sanitize and persist `mediaAttachments` | Modify |
| `src/app/api/marcom/events/[id]/route.ts` | PATCH events handler — update `mediaAttachments` | Modify |
| `src/components/views/EventsView/EventFormModal.tsx` | Event create/edit dialog — replace manual URLs with upload dropzone & progress | Modify |
| `src/components/views/EventsView/EventFootageModal.tsx` | Event footage lightbox/player — adapt to `TaskAttachment[]` | Modify |
| `src/components/views/EventsView/EventCardsView.tsx` | Event board/card view — display attachment badge and thumbnail | Modify |
| `src/components/views/EventsView/EventTableView.tsx` | Event table view — display attachment count badge | Modify |
| `src/components/views/EventsView/eventsApi.test.ts` | Integration unit tests for `mediaAttachments` payload handling | Create / Modify |

---

## Explicit "Do Not Touch" List

- `src/app/api/marcom/drive/upload/route.ts` & `finalize/route.ts`: Core Google Drive resumable upload pipeline is shared across the entire system. It works correctly; do not alter its logic.
- `src/components/ui/GoogleDriveLinkModal.tsx`: Shared upload modal used by Content Planner. Reuse it unchanged.
- `src/lib/marcom/useDirectDriveUpload.ts`: Shared direct upload hook. Reuse unchanged.
- `src/components/views/EventsView/EventBorrowedEquipmentSection.tsx`: Completely isolated equipment borrowing subsystem. Do not modify.
- `src/components/views/EventsView/EventChecklistSection.tsx`: Completely isolated task checklist subsystem. Do not modify.

---

## Phase 1 — Database Schema & SSOT Types

### 1a. Update `prisma/schema.prisma`

At lines 250–285:
- In `model FieldEvent`, add:
  ```prisma
  mediaAttachments Json         @default("[]")
  ```
- Remove `footage EventFootage[]` from `model FieldEvent`.
- Delete `model EventFootage` completely.

### 1b. Create Migration File `prisma/migrations/20261104000000_add_field_event_media_attachments/migration.sql`

```sql
-- AlterTable
ALTER TABLE "FieldEvent" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE IF EXISTS "EventFootage";
```

Apply and resolve migration:
```bash
npx prisma migrate resolve --applied 20261104000000_add_field_event_media_attachments
npx prisma generate
```

### 1c. Update `src/types/index.ts`

In `FieldEventItem` (around line 333):
```typescript
// Replace:
mediaUrl?: string | null;
footage?: EventFootage[];

// With:
mediaUrl?: string | null;
mediaAttachments?: TaskAttachment[];
```
*Note: Keep `mediaUrl` optional for backward compatibility as cover reference.*

**Checklist:**
- [ ] Edit `prisma/schema.prisma`
- [ ] Create `prisma/migrations/20261104000000_add_field_event_media_attachments/migration.sql`
- [ ] Run `npx prisma migrate resolve --applied 20261104000000_add_field_event_media_attachments`
- [ ] Run `npx prisma generate`
- [ ] Edit `src/types/index.ts` to add `mediaAttachments?: TaskAttachment[]` to `FieldEventItem`
- [ ] Run `npm run build:check` (verify types compile)

---

## Phase 2 — API Endpoints Validation & Persistence

### 2a. Update `src/app/api/marcom/events/route.ts`

1. Update `eventInclude` (lines 7–10):
```typescript
// BEFORE:
const eventInclude = {
  footage: true,
  outlet: { select: { id: true, code: true, name: true } },
} as const;

// AFTER:
const eventInclude = {
  outlet: { select: { id: true, code: true, name: true } },
} as const;
```

2. In `POST(request: Request)` (lines 60–120):
- Remove `footage` extraction.
- Extract `mediaAttachments` from `body`.
- Validate array:
```typescript
const mediaAttachments = Array.isArray(body?.mediaAttachments)
  ? (body.mediaAttachments as TaskAttachment[])
  : [];

const mediaUrl = mediaAttachments[0]?.url || (typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : null);
```
- In `prisma.fieldEvent.create`:
```typescript
data: {
  name,
  startDate: eventDate ? new Date(eventDate) : undefined,
  endDate: endDate ? new Date(endDate) : undefined,
  location,
  branchName,
  picName,
  eventType,
  status,
  budget,
  attendeeCount,
  targetAttendee,
  notes,
  outletId: outletId || null,
  mediaAttachments,
}
```

### 2b. Update `src/app/api/marcom/events/[id]/route.ts`

1. Add `"mediaAttachments"` to `PATCHABLE_FIELDS`.
2. Remove `eventInclude.footage`.
3. In `PATCH`:
- Remove `if (body?.footage !== undefined)` block (lines 70–89).
- Add `mediaAttachments` validation:
```typescript
if (body?.mediaAttachments !== undefined) {
  data["mediaAttachments"] = Array.isArray(body.mediaAttachments)
    ? body.mediaAttachments
    : [];
}
```

### 2c. Add Unit Tests in `src/components/views/EventsView/eventsApi.test.ts`

- Test creating an event with `mediaAttachments: [{ id: "att-1", name: "test.mp4", url: "https://drive.google.com/..." }]`.
- Verify `mediaAttachments` is serialized as JSON and returned in response.
- Test updating an event's `mediaAttachments` via PATCH.

**Checklist:**
- [ ] Update `src/app/api/marcom/events/route.ts`
- [ ] Update `src/app/api/marcom/events/[id]/route.ts`
- [ ] Create/update `src/components/views/EventsView/eventsApi.test.ts`
- [ ] Run `node --test src/components/views/EventsView/eventsApi.test.ts`
- [ ] Run `npm run build:check`

---

## Phase 3 — EventFormModal UI Modernization

**File:** `src/components/views/EventsView/EventFormModal.tsx`

### 3a. Update Imports & State

1. Add imports:
```typescript
import { Upload, Film, File, Video, Folder, Play, X, ExternalLink, Loader2 } from "lucide-react";
import { useDirectDriveUpload } from "@/lib/marcom/useDirectDriveUpload";
import type { TaskAttachment } from "@/types";
```
2. Replace footage state:
```typescript
// REMOVE:
// const [eventFootageList, setEventFootageList] = useState<EventFootage[]>([]);
// const [newFootageTitle, setNewFootageTitle] = useState("");
// const [newFootageDuration, setNewFootageDuration] = useState("");
// const [newFootagePath, setNewFootagePath] = useState("");
// const [eventMediaUrl, setEventMediaUrl] = useState("");

// ADD:
const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
const [folderUrlInput, setFolderUrlInput] = useState("");
const [showFolderInput, setShowFolderInput] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const { isUploading, progress, uploadFile, cancelUpload } = useDirectDriveUpload();
```

### 3b. Add Direct Device Upload Handlers

```typescript
const handleDeviceFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  for (const file of Array.from(files)) {
    try {
      const att = await uploadFile(file);
      if (att) {
        setMediaAttachments((prev) => [...prev, att]);
        toast.success(`Berhasil mengunggah ${file.name}`);
      }
    } catch {
      toast.error(`Gagal mengunggah ${file.name}`);
    }
  }
  if (fileInputRef.current) fileInputRef.current.value = "";
};

const handleAttachFolder = () => {
  if (!folderUrlInput.trim()) return;
  const folderAtt: TaskAttachment = {
    id: `folder-${Date.now()}`,
    name: "Raw Documentation Archive Folder",
    sizeBytes: 0,
    type: "document",
    url: folderUrlInput.trim(),
    source: "gdrive",
    isSharedFolder: true,
    uploadedAt: new Date().toISOString(),
  };
  setMediaAttachments((prev) => [...prev, folderAtt]);
  setFolderUrlInput("");
  setShowFolderInput(false);
  toast.success("Folder dokumentasi berhasil dilampirkan");
};

const handleRemoveAttachment = (id: string) => {
  setMediaAttachments((prev) => prev.filter((a) => a.id !== id));
};
```

### 3c. Replace UI Section (Lines 728–902)

Replace both old sections with a clean, unified card:
```tsx
{/* Media & Documentation Attachments */}
<div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
      <Film className="w-4 h-4 text-blue-500" />
      <span>Media & Dokumentasi Event</span>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Upload dari Perangkat</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleDeviceFilesSelected}
      />
    </div>
  </div>

  {/* Real-time Upload Progress Bar */}
  {isUploading && (
    <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Mengunggah berkas ke Google Drive ({progress}%)...
        </span>
        <button
          type="button"
          onClick={cancelUpload}
          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
        >
          Batal
        </button>
      </div>
      <div className="w-full bg-blue-100 dark:bg-blue-900/40 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )}

  {/* Attachments List */}
  {mediaAttachments.length > 0 ? (
    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
      {mediaAttachments.map((att, idx) => (
        <div
          key={att.id || idx}
          className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {att.isSharedFolder ? (
              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            ) : att.type === "video" ? (
              <Video className="w-4 h-4 text-purple-500 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-blue-500 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {att.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {att.sizeBytes > 0 ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "Drive Link"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              title="Buka link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => handleRemoveAttachment(att.id)}
              className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="Hapus lampiran"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 rounded-lg text-center cursor-pointer transition-colors"
    >
      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
        Klik untuk upload dari perangkat atau drag & drop file ke sini
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">
        Mendukung file gambar (JPG, PNG, WebP) dan video (MP4, MOV)
      </p>
    </div>
  )}

  {/* Folder Archive Input Fallback */}
  <div className="pt-1">
    {!showFolderInput ? (
      <button
        type="button"
        onClick={() => setShowFolderInput(true)}
        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
      >
        <Folder className="w-3 h-3" />
        <span>+ Tempel Link Folder Drive untuk Raw Documentation</span>
      </button>
    ) : (
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="https://drive.google.com/drive/folders/..."
          value={folderUrlInput}
          onChange={(e) => setFolderUrlInput(e.target.value)}
          className="flex-1 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
        />
        <button
          type="button"
          onClick={handleAttachFolder}
          className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
        >
          Lampirkan Folder
        </button>
        <button
          type="button"
          onClick={() => setShowFolderInput(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )}
  </div>
</div>
```

### 3d. Update `handleSaveEvent` in `EventFormModal.tsx`

Include `mediaAttachments` in payload:
```typescript
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
  mediaAttachments, // ← Pass TaskAttachment[]
  checklist: eventSubtasks,
};
```

**Checklist:**
- [ ] Refactor state & handlers in `EventFormModal.tsx`
- [ ] Replace lines 728–902 with new Media & Documentation section
- [ ] Wire upload progress bar and cancel button
- [ ] Update `handleSaveEvent` payload to send `mediaAttachments`
- [ ] Verify `EventFormModal.tsx` stays under coordinator limit or extract subcomponent if necessary

---

## Phase 4 — Viewer Modernization & Card Badges

### 4a. Update `EventFootageModal.tsx`

- Change `clips` synthesis to inspect `event.mediaAttachments`:
```typescript
const clips: TaskAttachment[] = event.mediaAttachments && event.mediaAttachments.length > 0
  ? event.mediaAttachments.filter((a) => a.type === "video" || !a.isSharedFolder)
  : [];

const folderAttachment = event.mediaAttachments?.find((a) => a.isSharedFolder);
```
- For video clips: use `clip.url` and `clip.embedUrl` for iframe/video playback.
- For folder link: render bottom button pointing to `folderAttachment.url`.

### 4b. Update `EventCardsView.tsx` & `EventTableView.tsx`

- In `EventCardsView.tsx`:
  - Calculate `attachmentsCount = event.mediaAttachments?.length ?? 0`.
  - Display `🎬 {attachmentsCount} assets` badge when `attachmentsCount > 0`.
- In `EventTableView.tsx`:
  - Display attachment count pill when `e.mediaAttachments && e.mediaAttachments.length > 0`.

**Checklist:**
- [ ] Update `EventFootageModal.tsx`
- [ ] Update `EventCardsView.tsx`
- [ ] Update `EventTableView.tsx`
- [ ] Run `npm run build:check`

---

## Phase 5 — Verification Gates

Run non-negotiable verification gates:

```bash
npm run drift:check       # Architectural invariants (<250 LOC, SSOT, spec pairing)
npm test                  # Full test suite, 0 failures required
npm run build:check       # TypeScript build, 0 errors required
```

Update `docs/SESSION_STATE.md` with:
- ADR-0021 marked complete
- Spec & Plan status
- Changes ready for execution in the next session

**Checklist:**
- [ ] `npm run drift:check` passes with `✅ No drift detected`
- [ ] `npm run build:check` passes with `0 errors`
- [ ] `npm test` passes with `0 failures`
- [ ] `docs/SESSION_STATE.md` updated
