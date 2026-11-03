# Spec — Multi-File Media UI Adaptation for Content Planner

**ADR:** `docs/adr/0017-multi-file-media-ui-adaptation.md`  
**Status:** Proposed  
**Date:** 2026-11-03

---

## Overview

Three frontend surfaces need updating to reflect that a `ContentPostItem` can now carry multiple media files via `mediaAttachments: TaskAttachment[]`. No DB changes, no API changes, no new components — pure frontend adaptations.

---

## Change 1 — Lightbox Modal: Add File Navigation

### Current behaviour
`previewMedia` state shape:
```ts
{
  title: string;
  mediaUrl: string;
  platform?: string;
  format?: string;
}
```
The modal renders exactly one file — `previewMedia.mediaUrl`. No navigation exists.

### New behaviour
`previewMedia` state shape:
```ts
{
  title: string;
  attachments: TaskAttachment[];   // all files — replaces mediaUrl
  currentIndex: number;            // which one is active
  platform?: string;
  format?: string;
}
```

The active file is always `attachments[currentIndex]`. For backward compatibility with single-file posts (where `mediaAttachments` may be empty or absent), the caller constructs `attachments` as:
```ts
// When post.mediaAttachments has items — use them
attachments: post.mediaAttachments?.length
  ? post.mediaAttachments
  : [{ id: "cover", url: post.mediaUrl!, name: post.title, type: "image", sizeBytes: 0, uploadedAt: "" }]
```
This means single-file posts continue to work with zero special-casing inside the modal.

### Modal UI changes

**Header area** — add file counter and filename:
```
[PlatformIcon] Post Title  [REEL]       1 / 5          [↗ open]  [×]
                                     IMG_1234.jpg
```
- Counter: `{currentIndex + 1} / {attachments.length}` — hidden if only 1 file
- Filename: `attachments[currentIndex].name` — truncated, below counter

**Navigation arrows** — shown only when `attachments.length > 1`:
```
[←]   [media viewport]   [→]
```
- Left arrow: disabled when `currentIndex === 0`
- Right arrow: disabled when `currentIndex === attachments.length - 1`
- Positioned absolutely on left and right edges of the media viewport
- Keyboard: `ArrowLeft` / `ArrowRight` keys navigate; `Escape` closes (existing behaviour kept)

**External link button** — points to `attachments[currentIndex].url` (updates as user navigates)

**Bottom dots / filmstrip** — shown only when `attachments.length > 1`, max 10 dots:
```
  ● ○ ○ ○ ○
```
- Active dot filled pink, inactive dots hollow
- Clickable — clicking dot N jumps to index N
- If more than 10 files: show dots only for first 9 + an ellipsis, no scrolling filmstrip needed

### Media rendering — no change to existing render logic
The current IIFE inside the modal determines render type by checking:
1. `parseGoogleDriveUrl(url).isValid` → renders iframe embed
2. `url.endsWith(".mp4")` etc. → renders `<video>`
3. Otherwise → renders `<AppImage>`

This logic applies to `attachments[currentIndex].url` instead of `previewMedia.mediaUrl`. No other changes.

### Keyboard events — extend existing `useEffect`
```ts
// Current:
if (e.key === "Escape") setPreviewMedia(null);

// New:
if (e.key === "Escape") setPreviewMedia(null);
if (e.key === "ArrowRight") setPreviewMedia(prev =>
  prev && prev.currentIndex < prev.attachments.length - 1
    ? { ...prev, currentIndex: prev.currentIndex + 1 }
    : prev
);
if (e.key === "ArrowLeft") setPreviewMedia(prev =>
  prev && prev.currentIndex > 0
    ? { ...prev, currentIndex: prev.currentIndex - 1 }
    : prev
);
```

### Call sites that need updating — 3 total

**Site 1** — ContentPlannerView.tsx calendar/list card thumbnail click (line ~618):
```ts
// BEFORE:
setPreviewMedia({
  title: post.title,
  mediaUrl: post.mediaUrl!,
  platform: post.platform,
  format: post.format,
});

// AFTER:
setPreviewMedia({
  title: post.title,
  attachments: post.mediaAttachments?.length
    ? post.mediaAttachments
    : [{ id: "cover", url: post.mediaUrl!, name: post.title, type: "image", sizeBytes: 0, uploadedAt: "" }],
  currentIndex: 0,
  platform: post.platform,
  format: post.format,
});
```

**Site 2** — ContentDrawer.tsx attachment list item click (line ~658):
```ts
// BEFORE:
onPreviewMedia({ title: att.name || title, mediaUrl: att.url, platform, format });

// AFTER:
onPreviewMedia({
  title: title,
  attachments: mediaAttachments.length
    ? mediaAttachments
    : [{ id: "cover", url: att.url, name: att.name, type: att.type, sizeBytes: att.sizeBytes, uploadedAt: att.uploadedAt }],
  currentIndex: i,      // open at the clicked item's index
  platform,
  format,
});
```
Note: `onPreviewMedia` prop type in ContentDrawer must also be updated to match the new shape.

**Site 3** — ContentDrawer.tsx single media preview click (line ~556 area, the "click to preview cover" button):
```ts
// AFTER:
onPreviewMedia({
  title: title,
  attachments: mediaAttachments.length
    ? mediaAttachments
    : [{ id: "cover", url: mediaUrl, name: title, type: "image", sizeBytes: 0, uploadedAt: "" }],
  currentIndex: 0,
  platform,
  format,
});
```

---

## Change 2 — Calendar/List Card Thumbnail: `+N` Badge

### Current behaviour
The thumbnail block renders only the cover (lines 616–697 in ContentPlannerView). No indicator of additional files.

### New behaviour
When `post.mediaAttachments && post.mediaAttachments.length > 1`, render a small badge in the top-right corner of the thumbnail:

```
┌─────────────────────────────┐
│  [film icon]                │  ← +4  ←── badge, top-right corner
│  Post Title                 │
│  Google Drive Media  ▶      │
└─────────────────────────────┘
```

Badge spec:
- Position: `absolute top-2 right-2`
- Size: small pill `text-[10px] font-bold px-1.5 py-0.5 rounded-md`
- Style: `bg-slate-900/80 text-white backdrop-blur-xs border border-white/10`
- Content: `+{mediaAttachments.length - 1}` (e.g. `+4` for 5 total files)
- Hidden when `mediaAttachments.length <= 1`

The parent div already has `relative` and `overflow-hidden`, so `absolute` positioning works immediately.

---

## Change 3 — Board Card Media Indicator: Count Badge

### Current behaviour
`ContentBoardCard.tsx` line 126–130:
```tsx
{post.mediaUrl && (
  <span title="Has media attachment" className="text-blue-500">
    <ImageIcon className="w-3 h-3" />
  </span>
)}
```
Single icon, no count information.

### New behaviour
```tsx
{(post.mediaUrl || (post.mediaAttachments && post.mediaAttachments.length > 0)) && (
  <span
    title={`${post.mediaAttachments?.length ?? 1} media file(s) attached`}
    className="flex items-center gap-0.5 text-blue-500"
  >
    <ImageIcon className="w-3 h-3" />
    {post.mediaAttachments && post.mediaAttachments.length > 1 && (
      <span className="text-[9px] font-bold tabular-nums leading-none">
        {post.mediaAttachments.length}
      </span>
    )}
  </span>
)}
```

Result: single file → `🖼` (unchanged); 3 files → `🖼 3`.

---

## `onPreviewMedia` Prop Type — ContentDrawer

The `onPreviewMedia` prop in `ContentDrawer` currently types the argument as:
```ts
onPreviewMedia?: (media: { title: string; mediaUrl: string; platform?: string; format?: string }) => void;
```
(Defined at line ~56 of ContentDrawer.tsx)

This must be updated to match the new `previewMedia` state shape:
```ts
onPreviewMedia?: (media: {
  title: string;
  attachments: TaskAttachment[];
  currentIndex: number;
  platform?: string;
  format?: string;
}) => void;
```

The handler in `ContentPlannerView.tsx` is `onPreviewMedia={setPreviewMedia}` (line 1045) — since `setPreviewMedia` is typed from `useState`, updating the state shape automatically satisfies the prop type once both are changed together.

---

## Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Lightbox shows `currentIndex + 1 / total` counter when post has >1 attachment |
| FR-02 | Lightbox prev/next arrows navigate between attachments |
| FR-03 | Lightbox keyboard `ArrowLeft`/`ArrowRight` navigates; `Escape` closes |
| FR-04 | Clicking an attachment in the drawer's list opens lightbox at that item's index |
| FR-05 | External link button in lightbox opens the currently-active attachment's URL |
| FR-06 | Dots indicator shows current position; clicking a dot jumps to that index |
| FR-07 | Calendar/list card thumbnail shows `+N` badge when N > 1 attachments |
| FR-08 | Board card indicator shows count number when N > 1 attachments |
| FR-09 | Single-file posts (no `mediaAttachments`, only `mediaUrl`) behave identically to before |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | No new components — all changes are in-place edits |
| NFR-02 | No DB / API changes |
| NFR-03 | `npm run build:check` — 0 TypeScript errors after all changes |
| NFR-04 | `npm test` — 0 failures |

---

## Non-Goals

- Swipe/touch gesture navigation in lightbox
- Filmstrip thumbnail row at bottom of lightbox
- `ProjectsWorkItemCard` adaptation
- Reordering attachments within the lightbox
