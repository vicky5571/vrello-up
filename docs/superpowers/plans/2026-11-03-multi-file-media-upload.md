# Plan — Multi-File Media Upload for Content Posts

**Spec:** `docs/superpowers/specs/2026-11-03-multi-file-media-upload-design.md`  
**ADR:** `docs/adr/0016-multi-file-media-upload-content-post.md`  
**Status:** Complete  
**Date:** 2026-11-03  

---

## File Manifest

| File | Action | LOC est. |
|---|---|---|
| `src/types/index.ts` | Edit — add `mediaAttachments?` to `ContentPostItem` | +2 |
| `prisma/schema.prisma` | Edit — add `mediaAttachments Json @default("[]")` | +1 |
| `src/app/api/marcom/content/[id]/route.ts` | Edit — accept `mediaAttachments` in PATCH | +5 |
| `src/app/api/marcom/content/route.ts` | Edit — accept `mediaAttachments` in POST | +5 |
| `src/components/ui/GoogleDriveLinkModal.tsx` | Rewrite — multi-file list UI + confirm button | ~80 → ~160 |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | Edit — attachment list + remove per-item | +40 |
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | Edit — update `onAttach` callback type + handler | +10 |

---

## Phase 0 — DB & Types (no UI)

### Step 1 — `prisma/schema.prisma`
```prisma
model ContentPost {
  ...
  mediaUrl          String    @default("")
  mediaAttachments  Json      @default("[]")   // ← ADD THIS LINE
  ...
}
```

### Step 2 — Generate migration
```bash
npx prisma migrate dev --name add_media_attachments
```

### Step 3 — `src/types/index.ts`
```ts
export interface ContentPostItem {
  ...
  mediaUrl?: string;
  mediaAttachments?: TaskAttachment[];   // ← ADD
  ...
}
```

### Step 4 — Verify
```bash
npm run build:check   # 0 errors
npm test              # 0 failures
```

---

## Phase 1 — API Routes

### Step 5 — `src/app/api/marcom/content/[id]/route.ts` (PATCH handler)

After the existing `mediaUrl` handling block, add:
```ts
if (body.mediaAttachments !== undefined) {
  // Accept array of TaskAttachment objects; store as-is in JSON column
  data.mediaAttachments = Array.isArray(body.mediaAttachments)
    ? body.mediaAttachments
    : [];
}
```

### Step 6 — `src/app/api/marcom/content/route.ts` (POST handler)

Same pattern as Step 5 — add `mediaAttachments` to the `data` object if present in body.

### Step 7 — Verify
```bash
npm run build:check
npm test
```

---

## Phase 2 — `GoogleDriveLinkModal` Rewrite

### Prop change
```ts
// BEFORE:
onAttach: (url: string, customTitle?: string) => void;

// AFTER:
onAttach: (attachments: TaskAttachment[]) => void;
```

### New internal state
```ts
const [uploadedFiles, setUploadedFiles] = useState<TaskAttachment[]>([]);
```

### New behavior
- `DirectDriveUploadDropzone.onUploadComplete` → appends to `uploadedFiles` (does NOT close modal)
- Dropzone stays visible after each upload
- List below dropzone shows each file: icon + name + size + remove button
- "Lampirkan X File" button at bottom → calls `onAttach(uploadedFiles)` → closes modal
- "Batal" / close → discards list → closes modal
- Reset `uploadedFiles` to `[]` on `isOpen` → `true` (via `useEffect`)

### Step 8 — Rewrite `GoogleDriveLinkModal.tsx`

Key structure:
```tsx
// State
const [uploadedFiles, setUploadedFiles] = useState<TaskAttachment[]>([]);

// Reset on open
useEffect(() => {
  if (isOpen) { setActiveTab("upload"); setUploadedFiles([]); }
}, [isOpen]);

// On each file upload completes — APPEND, don't close
const handleUploadComplete = (attachment: TaskAttachment) => {
  setUploadedFiles(prev => [...prev, attachment]);
  // no onClose() here
};

// Confirm button
const handleConfirm = () => {
  if (uploadedFiles.length > 0) {
    onAttach(uploadedFiles);
    onClose();
  }
};
```

### Step 9 — Verify
```bash
npm run build:check
npm test
```

---

## Phase 3 — Update All `onAttach` Callers

`GoogleDriveLinkModal.onAttach` signature changed to `(attachments: TaskAttachment[]) => void`. Two instances in `ContentPlannerView.tsx`:

### Instance 1 — Picker fallback modal (line ~849)
```tsx
// BEFORE:
onAttach={handleManualAttach}

// AFTER:
onAttach={(attachments) => {
  if (attachments[0]) handleManualAttach(attachments[0].url, attachments[0].name);
}}
```
`handleManualAttach` from `useGoogleDrivePicker` still takes `(url, title)` — wrap it.

### Instance 2 — ContentDrawer upload modal (line ~857)
```tsx
// BEFORE:
onAttach={(url) => {
  pendingUploadAttachRef.current?.(url);
  ...
}}

// AFTER:
// Change ref type from (url: string) to (attachments: TaskAttachment[])
const pendingUploadAttachRef = useRef<((attachments: TaskAttachment[]) => void) | null>(null);

onAttach={(attachments) => {
  pendingUploadAttachRef.current?.(attachments);
  ...
}}
```

### Step 10 — Update `ContentPlannerView.tsx`
- Change `pendingUploadAttachRef` type
- Update both `GoogleDriveLinkModal` instances as above
- Update `handleOpenUploadModal` signature: `(onAttach: (attachments: TaskAttachment[]) => void) => void`

### Step 11 — Update `ContentDrawer.tsx` props interface + handler
```ts
// Props
onOpenUploadModal?: (onAttach: (attachments: TaskAttachment[]) => void) => void;
```

Internal handler in drawer:
```ts
onOpenUploadModal((attachments) => {
  // Merge with existing attachments
  const merged = [...(existingAttachments), ...attachments];
  setMediaAttachments(merged);
  setMediaUrl(merged[0]?.url ?? "");
  toast.success(`${attachments.length} file berhasil dilampirkan`);
})
```

### Step 12 — Verify
```bash
npm run build:check
npm test
```

---

## Phase 4 — ContentDrawer Multi-File Display

### New local state in ContentDrawer
```ts
const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
```

### Sync from post prop (add to existing `useEffect([post])`)
```ts
setMediaAttachments(Array.isArray(post.mediaAttachments) ? post.mediaAttachments : []);
```

### Include in `handleSave` payload
```ts
const updatedPost: ContentPostItem = {
  ...post,
  mediaUrl: mediaAttachments[0]?.url ?? mediaUrl,
  mediaAttachments,
  ...
};
```

### UI — attachment list (replaces single video preview)
```tsx
{mediaAttachments.length > 0 ? (
  <div className="space-y-1.5">
    {mediaAttachments.map((att, i) => (
      <div key={att.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        {/* type icon */}
        <span className="text-[10px] text-slate-500 truncate flex-1">{att.name}</span>
        {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-600 font-semibold">cover</span>}
        <button onClick={() => {
          const next = mediaAttachments.filter((_, j) => j !== i);
          setMediaAttachments(next);
          setMediaUrl(next[0]?.url ?? "");
        }}>×</button>
      </div>
    ))}
  </div>
) : (
  // existing empty state
)}
```

### Step 13 — Update ContentDrawer
- Add `mediaAttachments` state
- Update `useEffect([post])` sync
- Update `handleSave` to include `mediaAttachments` + sync `mediaUrl`
- Replace single video preview with attachment list

### Step 14 — Final verify
```bash
npm run drift:check
npm test
npm run build:check
```

---

## Execution Order (Numbered Checklist)

```
Phase 0 — DB & Types
[x] 1. prisma/schema.prisma — add mediaAttachments column
[x] 2. npx prisma migrate dev --name add_media_attachments
[x] 3. src/types/index.ts — add mediaAttachments to ContentPostItem
[x] 4. npm run build:check + npm test

Phase 1 — API Routes
[x] 5. content/[id]/route.ts PATCH — accept mediaAttachments
[x] 6. content/route.ts POST — accept mediaAttachments
[x] 7. npm run build:check + npm test

Phase 2 — Modal Rewrite
[x] 8. GoogleDriveLinkModal.tsx — multi-file list, confirm button, new onAttach signature
[x] 9. npm run build:check + npm test

Phase 3 — Callers Update
[x] 10. ContentPlannerView.tsx — update ref type, both modal instances, handleOpenUploadModal
[x] 11. ContentDrawer.tsx — update onOpenUploadModal prop + handler
[x] 12. npm run build:check + npm test

Phase 4 — Drawer Display
[x] 13. ContentDrawer.tsx — mediaAttachments state, sync, save, list UI
[x] 14. npm run drift:check + npm test + npm run build:check
```

---

## Acceptance Criteria

- [x] Upload 3 files → modal shows list of 3 → "Lampirkan 3 File" → drawer shows 3 items
- [x] First item has "cover" badge, its URL is `mediaUrl`
- [x] Remove cover → second item becomes cover, `mediaUrl` updates
- [x] Save post → `mediaAttachments` persisted to DB, `mediaUrl` = first item
- [x] Reload → all 3 attachments still shown in drawer
- [x] Existing posts with `mediaUrl` only (no `mediaAttachments`) still display correctly
- [x] Board cards / Gantt / table unaffected (use `mediaUrl` only)
- [x] `npm run drift:check` passes
- [x] `npm test` — 0 failures
- [x] `npm run build:check` — 0 TypeScript errors

---

## Risk

| Risk | Mitigation |
|---|---|
| `mediaUrl` / `mediaAttachments[0]` drift | Sync enforced in `handleSave` — always set both together |
| Old posts have no `mediaAttachments` | `Array.isArray(post.mediaAttachments) ? ... : []` guard in `useEffect` |
| `GoogleDriveLinkModal` used elsewhere | Only 2 instances in `ContentPlannerView` — both updated in Phase 3 |
| `onAttach` signature change breaks TS | All callers updated in same phase — `build:check` catches any miss |
