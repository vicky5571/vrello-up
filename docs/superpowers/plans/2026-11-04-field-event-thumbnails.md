# Plan — Field Event Thumbnail Compression & Cover Preview in Edit Drawer

**Status:** Completed  
**Date:** 2026-11-04  
**ADR:** `docs/adr/0023-field-event-thumbnail-generation-cover-preview.md`  
**Spec:** `docs/superpowers/specs/2026-11-04-field-event-thumbnails-design.md`  

---

## File Manifest & Responsibility Mapping

| File Path | Role / Responsibility | Action |
|---|---|---|
| `src/app/api/marcom/drive/upload/route.ts` | Upload route — support optional `context` param (`"events"` vs `"content"`) | Modify |
| `src/components/views/EventsView/EventDrawer.tsx` | Slide-over drawer — implement 16:9 banner, row thumbnails, cover selector | Modify / Create |
| `src/components/views/EventsView/EventCardsView.tsx` | Cards view — render WebP thumbnail on event cards with video poster fallback | Modify |
| `src/components/views/EventsView/eventThumbnails.test.ts` | Unit tests for thumbnail resolution and cover fallback logic | Create |

---

## Explicit "Do Not Touch" List

- **Google Drive Embed URLs**: Do not embed `drive.google.com/thumbnail` or `/preview` URLs as image sources in Next.js `AppImage`. Always use Supabase WebP CDN URLs or SVG/gradient fallbacks.
- **Route Duplication**: Do NOT create a duplicate `/api/marcom/drive/upload-events` route. Keep `/api/marcom/drive/upload` unified.
- **`src/components/views/ContentPlannerView/*`**: Content Planner is read-only reference.

---

## Phase 1 — Upload Route: Support Optional `context` Param

**File:** `src/app/api/marcom/drive/upload/route.ts`

### 1a. Accept `context` in Multipart Form Data
In `POST(request: NextRequest)` around line 105:
```typescript
// Extract optional context parameter:
const rawContext = formData.get("context");
const context = rawContext === "events" ? "events" : "content";
```

### 1b. Update Supabase Storage Path
In `generateAndUploadThumbnail` (lines 35–45):
```typescript
// Update signature to accept context:
async function generateAndUploadThumbnail(
  fileBuffer: Buffer,
  mimeType: string,
  fileId: string,
  userId: string,
  context: "events" | "content" = "content"
): Promise<string | undefined> {
  ...
  const storagePath = `thumbnails/${context}/${userId}/${fileId}.webp`;
  ...
}
```

**Checklist:**
- [x] Add `context` parameter extraction in `src/app/api/marcom/drive/upload/route.ts`
- [x] Update `generateAndUploadThumbnail` to use `thumbnails/${context}/${userId}/${fileId}.webp`
- [x] Run `npm run build:check`

---

## Phase 2 — 16:9 Cover Showcase in `EventDrawer.tsx`

**File:** `src/components/views/EventsView/EventDrawer.tsx`

### 2a. Cover Resolution Helper
```typescript
const coverAttachment =
  mediaAttachments.find((a) => a.url === mediaUrl) ||
  mediaAttachments[0];

const isCoverVideo =
  coverAttachment?.type === "video" ||
  Boolean(coverAttachment?.url?.match(/\.(mp4|mov|webm)$/i));

const coverThumbnailUrl = coverAttachment?.thumbnailUrl;
```

### 2b. 16:9 Aspect-Video Banner Component
```tsx
{mediaAttachments.length > 0 && (
  <div
    onClick={() => {
      if (onOpenFootageModal && event) {
        onOpenFootageModal(event, 0);
      }
    }}
    className="group/player relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer shadow-xs hover:border-blue-500/50 transition-all flex items-center justify-center mb-3"
    title="Klik untuk memutar / preview media"
  >
    {coverThumbnailUrl ? (
      <AppImage
        src={coverThumbnailUrl}
        alt={event?.name || "Event Cover"}
        fill
        sizes="card"
        className="w-full h-full object-cover group-hover/player:scale-105 transition-transform duration-300"
      />
    ) : isCoverVideo ? (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4 text-center">
        <Video className="w-8 h-8 text-purple-400 mb-1 opacity-80 group-hover/player:scale-110 transition-transform" />
        <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
          {coverAttachment?.name || "Klip Video Event"}
        </span>
        <span className="text-[10px] text-purple-400/90 mt-0.5 font-medium">
          File Video (.MP4/.MOV)
        </span>
      </div>
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 p-4 text-center">
        <Folder className="w-8 h-8 text-amber-500 mb-1 opacity-80" />
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
          {coverAttachment?.name || "Dokumentasi Event"}
        </span>
      </div>
    )}

    {/* Play Button Overlay */}
    <div className="absolute inset-0 bg-black/30 group-hover/player:bg-black/15 flex items-center justify-center transition-colors">
      <div className="w-11 h-11 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover/player:scale-110 transition-transform">
        <Play className="w-4 h-4 fill-current ml-0.5" />
      </div>
    </div>
  </div>
)}
```

**Checklist:**
- [x] Embed 16:9 banner in `EventDrawer.tsx`
- [x] Connect click action to open full-screen `EventFootageModal`
- [x] Enforce zero Google Drive thumbnail embed URLs

---

## Phase 3 — Row Thumbnails, "Cover" Button, and Reordering

**File:** `src/components/views/EventsView/EventDrawer.tsx`

### 3a. Row Mini Thumbnail (36×36 Square)
```tsx
<div className="flex items-center gap-2 min-w-0 flex-1">
  {att.thumbnailUrl ? (
    <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
      <AppImage
        src={att.thumbnailUrl}
        alt={att.name}
        fill
        sizes="thumb"
        className="w-full h-full object-cover"
      />
    </div>
  ) : att.isSharedFolder ? (
    <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center bg-amber-500/10 text-amber-500">
      <Folder className="w-4 h-4" />
    </div>
  ) : att.type === "video" ? (
    <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center bg-purple-500/10 text-purple-500">
      <Video className="w-4 h-4" />
    </div>
  ) : (
    <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center bg-blue-500/10 text-blue-500">
      <File className="w-4 h-4" />
    </div>
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
```

### 3b. "Cover" Selector Action
```tsx
<div className="flex items-center gap-1.5 shrink-0">
  {isCover ? (
    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
      Cover
    </span>
  ) : (
    <button
      type="button"
      onClick={() => setMediaUrl(att.url)}
      className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 font-semibold transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
      title="Jadikan aset ini sebagai cover thumbnail"
    >
      Cover
    </button>
  )}
  <button
    type="button"
    onClick={() => handleRemoveAttachment(att.id, att.url)}
    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
    title="Hapus lampiran"
  >
    <X className="w-3.5 h-3.5" />
  </button>
</div>
```

### 3c. Safe Deletion & Cover Fallback
```typescript
const handleRemoveAttachment = (id: string, url: string) => {
  const next = mediaAttachments.filter((a) => a.id !== id);
  setMediaAttachments(next);
  if (url === mediaUrl) {
    setMediaUrl(next[0]?.url || "");
  }
};
```

**Checklist:**
- [x] Add 36×36 square thumbnail to attachment rows
- [x] Add "Cover" badge/button on rows
- [x] Implement `handleRemoveAttachment` with cover fallback
- [x] Run `npm run build:check`

---

## Phase 4 — Card Thumbnail Optimization in `EventCardsView.tsx`

**File:** `src/components/views/EventsView/EventCardsView.tsx`

Update lines 72–76 and 225–245:
```tsx
const primaryAttachment =
  event.mediaAttachments?.find((a) => a.url === event.mediaUrl) ||
  event.mediaAttachments?.[0];

const coverThumbnailUrl = primaryAttachment?.thumbnailUrl;
const isVideo =
  primaryAttachment?.type === "video" ||
  Boolean(primaryAttachment?.url?.match(/\.(mp4|mov|webm)$/i));

// In Card Media Render:
{coverThumbnailUrl ? (
  <AppImage
    src={coverThumbnailUrl}
    alt={event.name}
    fill
    sizes="card"
    className="w-full h-full object-cover group-hover/player:scale-105 transition-transform duration-300"
  />
) : isVideo ? (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4 text-center">
    <Film className="w-8 h-8 text-purple-400 mb-1 opacity-80 group-hover/player:scale-110 transition-transform" />
    <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
      {event.name}
    </span>
  </div>
) : (
  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
    <Film className="w-6 h-6 opacity-40" />
  </div>
)}
```

**Checklist:**
- [x] Update `EventCardsView.tsx` card media rendering
- [x] Eliminate Google Drive thumbnail URLs
- [x] Run `npm run build:check`

---

## Phase 5 — Unit Tests & Verification Gates

### 5a. Unit Tests (`src/components/views/EventsView/eventThumbnails.test.ts`)
- Test cover resolution when `mediaUrl` matches a specific attachment.
- Test cover fallback to `mediaAttachments[0]` when `mediaUrl` is empty.
- Test cover reassignment when active cover is deleted.
- Test `context: "events"` parameter handling in upload route.

### 5b. Verification Commands
```bash
npm run drift:check       # Architectural invariants (<250 LOC, SSOT, spec pairing)
npm run build:check       # TypeScript build, 0 errors required
npm test                  # Full test suite, 0 failures required
```

Update `docs/SESSION_STATE.md`.

**Checklist:**
- [x] Create `src/components/views/EventsView/eventThumbnails.test.ts`
- [x] Run `node --test src/components/views/EventsView/eventThumbnails.test.ts`
- [x] `npm run drift:check` passes with `✅ No drift detected`
- [x] `npm run build:check` passes with `0 errors`
- [x] `npm test` passes with `0 failures`
- [x] Update `docs/SESSION_STATE.md`
