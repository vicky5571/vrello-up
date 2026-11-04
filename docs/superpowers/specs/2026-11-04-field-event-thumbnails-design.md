# Spec — Field Event Thumbnail Compression & Cover Preview in Edit Drawer

**ADR:** `docs/adr/0023-field-event-thumbnail-generation-cover-preview.md`  
**Status:** Proposed  
**Date:** 2026-11-04  
**Author:** AI Pair Programmer & Lead Systems Architect  

---

## 1. Executive Summary

This specification defines the visual and technical architecture for thumbnail generation, image compression, and cover asset selection for Field Events within the newly introduced `EventDrawer` (ADR-0022).

Following the benchmark set by Content Planner (ADR-0018), media uploaded to field events automatically undergoes server-side Sharp processing (resizing to max 800px width, WebP compression at quality 75) and is cached on Supabase Storage (`content-thumbnails`). In `EventDrawer`, the active cover asset is showcased in a responsive 16:9 aspect-video preview banner with play overlay. Individual attachment rows feature mini-thumbnails, a one-click "Cover" selector, and 6-dot drag reordering. Board cards in `EventCardsView` render the edge-cached WebP thumbnail, cutting card payload weight by up to 90%.

**Architectural Directives:**
1. **Zero Google Drive Thumbnail Embeds**: `drive.google.com/thumbnail` URLs are explicitly banned due to third-party cookie blocking in Safari/iOS. Images use Supabase WebP CDN URLs (`thumbnailUrl`); videos use a stylized gradient poster card.
2. **Unified Upload Route**: Reuse `/api/marcom/drive/upload` with an optional `context: "events" | "content"` field to avoid duplicating streaming and OAuth infrastructure.

---

## 2. Visual Layout & Interaction Wireframe

### In `EventDrawer.tsx` (Media Section)

```
┌─────────────────────────────────────────────────────────────┐
│ 📁 Media & Dokumentasi Event        [Upload dari Perangkat] │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                  16:9 COVER SHOWCASE                    │ │
│ │                                                         │ │
│ │ If Image: <AppImage src={coverAttachment.thumbnailUrl}> │ │
│ │ If Video: Gradient Card + <Video /> Icon + Title        │ │
│ │                     [ ▶ Putar / Play ]                  │ │
│ │                                                         │ │
│ │ (Hover: ambient glow & scale; Click: buka lightbox)     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Lampiran Media (3 file):                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [::] [🖼 36x36 WebP] booth-photo.jpg   2.4 MB  [COVER] [X]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [::] [🎬 36x36 Poster] crowd-recap.mp4 18.5 MB [Cover] [X]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [::] [📁 Folder Doc] Drive Raw Folder 0.0 MB           [X]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [ + Tempel Link Folder Drive untuk Raw Footage            ] │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Specifications & Data Flow

### 3.1 Upload & Compression Pipeline

```
Client (EventDrawer: Upload dari Perangkat or Dropzone)
  ↓
POST /api/marcom/drive/upload (multipart FormData: file, optional context="events")
  ↓
Server Sharp Image Processor:
  • Checks MIME: image/jpeg, image/jpg, image/png, image/webp
  • Resize: width 800px, withoutEnlargement: true
  • Compression: WebP format, quality 75
  • Streams buffer to Supabase Storage: bucket "content-thumbnails"
  • Storage path: thumbnails/{context}/{userId}/{fileId}.webp
  ↓
Returns: { success: true, fileId, name, thumbnailUrl }
  ↓
POST /api/marcom/drive/finalize
  • Builds TaskAttachment with thumbnailUrl: "https://...supabase.co/storage/v1/object/public/content-thumbnails/..."
  ↓
Client receives TaskAttachment and appends to mediaAttachments state
```

### 3.2 Display & Video Poster Fallback Rules

```typescript
// 1. Resolve active cover:
const coverAttachment =
  mediaAttachments.find((a) => a.url === mediaUrl) ||
  mediaAttachments[0];

const isCoverVideo =
  coverAttachment?.type === "video" ||
  coverAttachment?.url?.match(/\.(mp4|mov|webm)$/i);

const coverThumbnailUrl = coverAttachment?.thumbnailUrl;

// 2. Banner Rendering (Zero Google Drive Embeds):
if (coverThumbnailUrl) {
  // Image: Fast edge-cached WebP from Supabase
  return (
    <AppImage
      src={coverThumbnailUrl}
      alt={event.name}
      fill
      sizes="card"
      className="w-full h-full object-cover"
    />
  );
}

if (isCoverVideo) {
  // Video: Stylized dark gradient poster with Video icon
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4 text-center">
      <Video className="w-8 h-8 text-purple-400 mb-1 opacity-80 group-hover/player:scale-110 transition-transform" />
      <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
        {coverAttachment?.name || "Video Dokumentasi Event"}
      </span>
      <span className="text-[10px] text-purple-400/90 mt-0.5 font-medium">
        Klip Rekap / B-Roll
      </span>
    </div>
  );
}

// 3. Fallback: Generic Media Placeholder (Zero Google Drive thumbnail URLs)
return (
  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 p-4 text-center">
    <Folder className="w-8 h-8 text-amber-500 mb-1 opacity-80" />
    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
      {coverAttachment?.name || "Dokumentasi Event"}
    </span>
  </div>
);
```

### 3.3 Cover Synchronization & Reordering

```typescript
// Setting cover (does NOT reorder array):
const handleSetCover = (selectedUrl: string) => {
  setMediaUrl(selectedUrl);
};

// Safe removal fallback:
const handleRemoveAttachment = (id: string, url: string) => {
  const next = mediaAttachments.filter((a) => a.id !== id);
  setMediaAttachments(next);
  if (url === mediaUrl) {
    setMediaUrl(next[0]?.url || "");
  }
};
```

---

## 4. Verification & Acceptance Criteria

| ID | Criteria | Verification Method |
|---|---|---|
| AC-01 | `/api/marcom/drive/upload` accepts optional `context` param and stores thumbnails cleanly under `thumbnails/{context}/...` | API unit test |
| AC-02 | Uploading an image in `EventDrawer` triggers Sharp compression and returns WebP `thumbnailUrl` | Upload integration test |
| AC-03 | `EventDrawer` renders 16:9 aspect-video banner with `<AppImage src={coverThumbnailUrl}>` for images | Visual & component test |
| AC-04 | Videos render a stylized gradient card with `<Video />` icon in the cover banner (no broken Drive embeds) | Visual & component test |
| AC-05 | Clicking the 16:9 banner opens full-screen playback in `EventFootageModal` | Component interaction test |
| AC-06 | Attachment list rows display 36×36 square thumbnail for image items | Visual inspection |
| AC-07 | Clicking "Cover" updates `mediaUrl` without array mutation | Component unit test |
| AC-08 | Removing active cover gracefully falls back to `next[0]?.url` | State fallback test |
| AC-09 | `EventCardsView` renders `<AppImage src={coverThumbnailUrl}>` for image covers and gradient card for video covers | Component test |
| AC-10 | `npm run drift:check` passes with 0 violations | CLI verification |
| AC-11 | `npm run build:check` passes with 0 errors | CLI verification |
| AC-12 | `npm test` passes with 0 failures | CLI verification |
