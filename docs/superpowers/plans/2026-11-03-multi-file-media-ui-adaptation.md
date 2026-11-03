# Plan — Multi-File Media UI Adaptation for Content Planner

**Spec:** `docs/superpowers/specs/2026-11-03-multi-file-media-ui-adaptation.md`  
**ADR:** `docs/adr/0017-multi-file-media-ui-adaptation.md`  
**Status:** Complete  
**Date:** 2026-11-03

---

## File Manifest

| File | Action | Scope |
|---|---|---|
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | Edit | `previewMedia` state shape, keyboard handler, 1 call site, lightbox JSX |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | Edit | `onPreviewMedia` prop type, 2 call sites |
| `src/components/views/ContentPlannerView/ContentBoardCard.tsx` | Edit | Media indicator — count badge |

No new files. No DB changes. No API changes.

---

## Phase 1 — Update `previewMedia` State Shape

### File: `ContentPlannerView.tsx`

**Step 1 — Change state type (line ~150)**

```ts
// BEFORE:
const [previewMedia, setPreviewMedia] = useState<{
  title: string;
  mediaUrl: string;
  platform?: string;
  format?: string;
} | null>(null);

// AFTER:
const [previewMedia, setPreviewMedia] = useState<{
  title: string;
  attachments: TaskAttachment[];
  currentIndex: number;
  platform?: string;
  format?: string;
} | null>(null);
```

`TaskAttachment` is already imported at line 29 of `ContentPlannerView.tsx` — no new import needed.

**Step 2 — Extend keyboard handler `useEffect` (line ~157)**

```ts
// BEFORE:
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") setPreviewMedia(null);
};

// AFTER:
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") setPreviewMedia(null);
  if (e.key === "ArrowRight") {
    setPreviewMedia((prev) =>
      prev && prev.currentIndex < prev.attachments.length - 1
        ? { ...prev, currentIndex: prev.currentIndex + 1 }
        : prev
    );
  }
  if (e.key === "ArrowLeft") {
    setPreviewMedia((prev) =>
      prev && prev.currentIndex > 0
        ? { ...prev, currentIndex: prev.currentIndex - 1 }
        : prev
    );
  }
};
```

**Step 3 — Update the calendar/list card thumbnail click call site (line ~618)**

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

---

## Phase 2 — Rewrite Lightbox Modal JSX

### File: `ContentPlannerView.tsx`, lines ~942–1036

The entire `{previewMedia && (...)}` block needs updating. The active attachment is always:
```ts
const active = previewMedia.attachments[previewMedia.currentIndex];
```

**Header changes:**
- Replace `href={previewMedia.mediaUrl}` → `href={active.url}`
- Add counter `{previewMedia.currentIndex + 1} / {previewMedia.attachments.length}` — visible when length > 1
- Add filename `{active.name}` below counter — truncated

**Media viewport changes:**
- Replace all `previewMedia.mediaUrl` references inside the IIFE → `active.url`
- Wrap the viewport in a `relative` div
- Add prev/next arrow buttons absolutely positioned on left and right edges — visible only when `attachments.length > 1`

**Prev arrow button** (left edge of viewport):
```tsx
{previewMedia.attachments.length > 1 && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setPreviewMedia((prev) =>
        prev && prev.currentIndex > 0
          ? { ...prev, currentIndex: prev.currentIndex - 1 }
          : prev
      );
    }}
    disabled={previewMedia.currentIndex === 0}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-700/80 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
  >
    <ChevronLeft className="w-5 h-5" />
  </button>
)}
```

**Next arrow button** (right edge of viewport) — same pattern with `ChevronRight`, `currentIndex + 1`.

**Dots indicator** — below the media viewport, inside the modal body:
```tsx
{previewMedia.attachments.length > 1 && (
  <div className="flex items-center justify-center gap-1.5 py-2 bg-slate-950">
    {previewMedia.attachments.slice(0, 10).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setPreviewMedia((prev) => prev ? { ...prev, currentIndex: i } : prev)}
        className={cn(
          "w-1.5 h-1.5 rounded-full transition-all cursor-pointer",
          i === previewMedia.currentIndex
            ? "bg-pink-500 scale-125"
            : "bg-slate-600 hover:bg-slate-400"
        )}
      />
    ))}
    {previewMedia.attachments.length > 10 && (
      <span className="text-[10px] text-slate-500 ml-1">…</span>
    )}
  </div>
)}
```

**New lucide imports needed** in `ContentPlannerView.tsx`:
- `ChevronLeft`
- `ChevronRight`

Check current imports first — if already imported, skip.

---

## Phase 3 — Update `ContentDrawer.tsx` Call Sites

### File: `ContentDrawer.tsx`

**Step 4 — Update `onPreviewMedia` prop type (line ~56)**

```ts
// BEFORE:
onPreviewMedia?: (media: { title: string; mediaUrl: string; platform?: string; format?: string }) => void;

// AFTER:
onPreviewMedia?: (media: {
  title: string;
  attachments: TaskAttachment[];
  currentIndex: number;
  platform?: string;
  format?: string;
}) => void;
```

`TaskAttachment` is already imported in `ContentDrawer.tsx` — no new import needed.

**Step 5 — Update call site 1: single cover preview click (line ~556 area)**

This is where clicking the cover image/video in the drawer opens the lightbox:

```ts
// BEFORE:
onPreviewMedia({
  title: title,
  mediaUrl: mediaUrl,
  platform,
  format,
})

// AFTER:
onPreviewMedia({
  title: title,
  attachments: mediaAttachments.length
    ? mediaAttachments
    : [{ id: "cover", url: mediaUrl, name: title, type: "image", sizeBytes: 0, uploadedAt: "" }],
  currentIndex: 0,
  platform,
  format,
})
```

**Step 6 — Update call site 2: attachment list item click (line ~658)**

```ts
// BEFORE:
onPreviewMedia({
  title: att.name || title,
  mediaUrl: att.url,
  platform,
  format,
})

// AFTER:
onPreviewMedia({
  title: title,
  attachments: mediaAttachments,
  currentIndex: i,      // open at the index of the clicked item
  platform,
  format,
})
```

---

## Phase 4 — Calendar/List Card Thumbnail `+N` Badge

### File: `ContentPlannerView.tsx`, line ~627

The thumbnail wrapper div already has `relative` and `overflow-hidden`. Add this inside it, as the **last child** before the closing `</div>`:

```tsx
{/* Multi-file badge */}
{post.mediaAttachments && post.mediaAttachments.length > 1 && (
  <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-xs border border-white/10 pointer-events-none">
    +{post.mediaAttachments.length - 1}
  </div>
)}
```

The `pointer-events-none` ensures it doesn't interfere with the click-to-preview on the parent div.

---

## Phase 5 — Board Card Media Indicator Count

### File: `ContentBoardCard.tsx`, lines 126–130

```tsx
// BEFORE:
{post.mediaUrl && (
  <span title="Has media attachment" className="text-blue-500">
    <ImageIcon className="w-3 h-3" />
  </span>
)}

// AFTER:
{(post.mediaUrl || post.mediaAttachments?.length) ? (
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
) : null}
```

---

## Execution Checklist

```
Phase 1 — previewMedia state
[x] 1. ContentPlannerView.tsx — change useState type (line ~150)
[x] 2. ContentPlannerView.tsx — extend useEffect keyboard handler (line ~157)
[x] 3. ContentPlannerView.tsx — update thumbnail click call site (line ~618)
[x] 4. npx tsc --noEmit  → expect errors in lightbox JSX (previewMedia.mediaUrl no longer exists)

Phase 2 — Lightbox JSX rewrite
[x] 5. ContentPlannerView.tsx — add ChevronLeft, ChevronRight to lucide imports
[x] 6. ContentPlannerView.tsx — rewrite lightbox modal JSX (lines ~942–1036):
        - const active = previewMedia.attachments[previewMedia.currentIndex]
        - replace all previewMedia.mediaUrl → active.url
        - replace href in external link button → active.url
        - add counter + filename in header
        - wrap media viewport in relative div, add prev/next arrows
        - add dots indicator below media viewport
[x] 7. npx tsc --noEmit  → expect errors in ContentDrawer (prop type mismatch)

Phase 3 — ContentDrawer call sites
[x] 8. ContentDrawer.tsx — update onPreviewMedia prop type (line ~56)
[x] 9. ContentDrawer.tsx — update cover preview call site (line ~556)
[x] 10. ContentDrawer.tsx — update attachment list click call site (line ~658)
[x] 11. npx tsc --noEmit  → 0 errors

Phase 4 — Card badge
[x] 12. ContentPlannerView.tsx — add +N badge inside thumbnail wrapper (line ~627)

Phase 5 — Board card count
[x] 13. ContentBoardCard.tsx — update media indicator (lines 126–130)

Final
[x] 14. npx tsc --noEmit  → 0 TypeScript errors
[x] 15. npm test          → 0 failures
[x] 16. Manual test:
        → Upload 3 files to a post via ContentDrawer
        → Click cover thumbnail in calendar view → lightbox opens at index 1/3
        → Press ArrowRight → navigates to 2/3 → then 3/3
        → Press ArrowLeft → back to 2/3
        → Click dot 3 → jumps to 3/3
        → External link → opens file 3's URL in new tab
        → Close → reopen → click attachment row item #2 → lightbox opens at 2/3
        → Calendar card thumbnail shows "+2" badge
        → Board card shows "🖼 3"
        → Single-file post → no arrows, no counter, no badge — identical to before
```

---

## Exact Locations — Quick Reference

| Step | File | Line (approx) | What |
|---|---|---|---|
| 1 | ContentPlannerView.tsx | 150 | `useState` type |
| 2 | ContentPlannerView.tsx | 157 | `useEffect` keyboard |
| 3 | ContentPlannerView.tsx | 618 | thumbnail click |
| 5 | ContentPlannerView.tsx | top imports | add `ChevronLeft`, `ChevronRight` |
| 6 | ContentPlannerView.tsx | 942–1036 | entire lightbox block |
| 8 | ContentDrawer.tsx | 56 | prop type |
| 9 | ContentDrawer.tsx | ~564 | cover click |
| 10 | ContentDrawer.tsx | ~658 | attachment row click |
| 12 | ContentPlannerView.tsx | ~627 | `+N` badge |
| 13 | ContentBoardCard.tsx | 126 | icon + count |

---

## Risk

| Risk | Mitigation |
|---|---|
| `previewMedia.mediaUrl` still referenced somewhere after refactor | Step 4 (`tsc --noEmit`) will catch every reference — fix before proceeding |
| Single-file posts (no `mediaAttachments`) break | All call sites construct a synthetic 1-item `attachments` array from `mediaUrl` — modal always has ≥1 item |
| `ChevronLeft`/`ChevronRight` already imported | Check imports first — adding a duplicate import causes a lint warning but not a build error |
| Attachment list in drawer has `i` as index in `.map()` — make sure `i` is used in the call site | It already is in the existing map — just pass `currentIndex: i` |
