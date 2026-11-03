# Handover — Multi-File Upload in ContentPostModal (Create Flow)

**Status:** Complete  
**Date:** 2026-11-03  
**Estimated time:** 20–30 minutes  
**Risk:** Low — additive changes only, no DB changes needed

---

## Context

Multi-file upload already works in `ContentDrawer` (edit flow). The create modal (`ContentPostModal`) still uses the old single-file pattern: a hidden `<input type="file">` that triggers `useDirectDriveUpload` directly inside the modal and sets only `mediaUrl`.

The user wants the same multi-file behaviour in the create modal.

---

## What Exists Already (Do Not Change)

| What | Where | Notes |
|---|---|---|
| Multi-file upload modal | `src/components/ui/GoogleDriveLinkModal.tsx` | `onAttach: (attachments: TaskAttachment[]) => void` — already multi-file |
| Upload modal state | `ContentPlannerView.tsx` line ~120 | `isUploadModalOpen`, `pendingUploadAttachRef`, `handleOpenUploadModal` |
| Second `GoogleDriveLinkModal` render | `ContentPlannerView.tsx` line ~855 | The upload-modal instance is already rendered, just not wired to the create flow |
| `mediaAttachments` in DB + API | `prisma/schema.prisma`, POST route | Column exists, POST `/api/marcom/content` already accepts `mediaAttachments` |
| `ContentPostItem.mediaAttachments` | `src/types/index.ts` | `mediaAttachments?: TaskAttachment[]` — already there |

---

## Root Cause — Why It's Missing

`ContentPostModal` has its own internal `useDirectDriveUpload` hook and a hidden file input. It handles upload entirely inside the component and only surfaces `mediaUrl: string` back to the parent. It has no knowledge of `mediaAttachments`, `handleOpenUploadModal`, or `GoogleDriveLinkModal`.

---

## All Changes Required

### 1. `src/components/views/ContentPlannerView/ContentPostModal.tsx`

**A — Imports: remove, add**
```ts
// REMOVE:
import { useDirectDriveUpload } from "@/lib/marcom/useDirectDriveUpload";
// and from lucide: Upload

// ADD to lucide imports:
Paperclip, Film, File

// ADD to type import:
TaskAttachment,
```

**B — Props interface: add two new props**
```ts
// AFTER:
mediaUrl: string;
setMediaUrl: (val: string) => void;

// ADD:
mediaAttachments: TaskAttachment[];
setMediaAttachments: (val: TaskAttachment[]) => void;
onOpenUploadModal: (onAttach: (attachments: TaskAttachment[]) => void) => void;
```

**C — Destructure: add the three new props**
```ts
mediaUrl,
setMediaUrl,
mediaAttachments,          // ← ADD
setMediaAttachments,       // ← ADD
onOpenDriveSelector,
onOpenUploadModal,         // ← ADD
outletId,
```

**D — Remove internal upload logic** (no longer needed — parent handles it)

Remove these from the component body:
- `const fileInputRef = useRef<HTMLInputElement>(null);`
- `const { isUploading, progress, uploadFile } = useDirectDriveUpload();`
- The entire `handleDeviceUpload` function (lines 85–103)

Also remove the `useRef` import if it's now unused.

**E — Replace the entire media section JSX** (lines 299–366, the `{/* Media URL & Direct Upload */}` block)

Replace with:

```tsx
{/* Media Attachments */}
<div className="space-y-1.5">
  <div className="flex items-center justify-between mb-1">
    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
      Media / Aset (optional)
    </label>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() =>
          onOpenUploadModal((attachments) => {
            const merged = [...mediaAttachments, ...attachments];
            setMediaAttachments(merged);
            setMediaUrl(merged[0]?.url ?? "");
            toast.success(`${attachments.length} file berhasil dilampirkan`);
          })
        }
        className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
      >
        <Paperclip className="w-3 h-3" />
        <span>Tambah Media</span>
      </button>
      <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
      <button
        type="button"
        onClick={onOpenDriveSelector}
        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer"
      >
        <span>Google Drive</span>
      </button>
    </div>
  </div>

  {/* Attachment list — shown when files are attached */}
  {mediaAttachments.length > 0 ? (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span>Lampiran ({mediaAttachments.length})</span>
        <span className="text-[10px] text-slate-400">Item pertama adalah cover</span>
      </div>
      <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
        {mediaAttachments.map((att, i) => (
          <div
            key={att.id || i}
            className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
          >
            {att.type === "video" ? (
              <Film className="w-4 h-4 text-purple-500 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-blue-500 shrink-0" />
            )}
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
              {att.name}
            </span>
            {att.sizeBytes > 0 && (
              <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
            {i === 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider shrink-0">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                const next = mediaAttachments.filter((_, j) => j !== i);
                setMediaAttachments(next);
                setMediaUrl(next[0]?.url ?? "");
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              title="Hapus lampiran ini"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : (
    /* Fallback URL input — shown when no files attached yet */
    <input
      type="url"
      placeholder="https://drive.google.com/... atau klik Tambah Media"
      value={mediaUrl}
      onChange={(e) => setMediaUrl(e.target.value)}
      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-mono"
    />
  )}
</div>
```

---

### 2. `src/components/views/ContentPlannerView/ContentPlannerView.tsx`

**A — Add `mediaAttachments` state** (near line 139, after `mediaUrl`)
```ts
const [mediaUrl, setMediaUrl] = useState("");
const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]); // ← ADD
```

**B — Reset `mediaAttachments` in `openCreateModal`** (in the `useCallback`, near line 240)
```ts
setMediaUrl("");
setMediaAttachments([]); // ← ADD
setRevisionNotes("");
```

**C — Include `mediaAttachments` in the POST payload** (in `handleSavePost`, near line 272)
```ts
// Change:
mediaUrl: mediaUrl.trim(),

// To:
mediaUrl: mediaAttachments[0]?.url || mediaUrl.trim(),
mediaAttachments,                                        // ← ADD
```

**D — Pass new props to `<ContentPostModal>`** (near line 830)
```tsx
mediaUrl={mediaUrl}
setMediaUrl={setMediaUrl}
mediaAttachments={mediaAttachments}          // ← ADD
setMediaAttachments={setMediaAttachments}    // ← ADD
onOpenUploadModal={handleOpenUploadModal}    // ← ADD
onOpenDriveSelector={() => ...}
```

`handleOpenUploadModal` already exists at line ~123 — no changes needed to it.

---

## Execution Checklist

```
[x] 1. Edit ContentPostModal.tsx:
        - Remove: useRef, useDirectDriveUpload import, Upload lucide icon
        - Add: Paperclip, Film, File lucide icons; TaskAttachment type
        - Add 3 new props to interface + destructure
        - Remove: fileInputRef, isUploading/progress/uploadFile, handleDeviceUpload
        - Replace: entire media section JSX (lines 299–366)

[x] 2. Edit ContentPlannerView.tsx:
        - Add mediaAttachments state
        - Reset in openCreateModal
        - Add to POST payload
        - Pass 3 new props to <ContentPostModal>

[x] 3. npx tsc --noEmit     → 0 errors
[x] 4. npm test             → 0 failures
[x] 5. Manual test:
        → Click "Schedule New Post"
        → Click "Tambah Media" → GoogleDriveLinkModal opens
        → Upload 2 files → "Lampirkan 2 File" → modal closes
        → Modal shows file list with Cover badge
        → Click "Schedule Post" → post saved
        → Open ContentDrawer for that post → both attachments visible
```

---

## What NOT to Touch

| File | Reason |
|---|---|
| `GoogleDriveLinkModal.tsx` | Already correct — multi-file with confirm button |
| `useDirectDriveUpload.ts` | Still used by `GoogleDriveLinkModal` internally |
| `ContentDrawer.tsx` | Already has multi-file — don't touch |
| `/api/marcom/content/route.ts` | Already accepts `mediaAttachments` |
| `prisma/schema.prisma` | `mediaAttachments` column already exists |
| `src/types/index.ts` | `TaskAttachment[]` already on `ContentPostItem` |

---

## Key Insight

`handleOpenUploadModal` in `ContentPlannerView` already opens the second `GoogleDriveLinkModal` instance (the upload modal). `ContentDrawer` already calls it. This handover just wires `ContentPostModal` into the same mechanism — **no new state, no new components, no DB changes**.
