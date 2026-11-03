# ADR-0017 — Multi-File Media UI Adaptation for Content Planner

**Status:** Proposed  
**Date:** 2026-11-03  
**Area:** Content Planner — Media Display  
**Relates to:** ADR-0016 (Multi-File Media Upload)

---

## Context

ADR-0016 introduced `mediaAttachments: TaskAttachment[]` and a multi-file upload flow. The upload mechanism works. However, four frontend surfaces were built when only a single `mediaUrl: string` existed and have not been updated to reflect that a post can now carry N files:

| Surface | File | Built for |
|---|---|---|
| Board card media indicator | `ContentBoardCard.tsx` line 126 | Single — shows one icon if `mediaUrl` exists |
| Calendar/list card thumbnail | `ContentPlannerView.tsx` line 616 | Single — renders cover only, no count |
| Media lightbox/player modal | `ContentPlannerView.tsx` line 942 | Single — one `previewMedia.mediaUrl`, no navigation |
| `previewMedia` state shape | `ContentPlannerView.tsx` line 150 | Single — `{ title, mediaUrl, platform, format }` |

The most critical gap is the lightbox: a user who uploads a 5-slide carousel can only preview slide 1 inside the app.

---

## Decision Drivers

- `mediaAttachments` already exists on `ContentPostItem` — no DB or type changes needed
- `TaskAttachment` already has `url`, `name`, `type`, `embedUrl` — enough for per-item rendering
- The `previewMedia` state is local to `ContentPlannerView` — changing its shape is a pure frontend refactor
- Each adaptation is independent — they can be done in any order or separately

---

## Options Considered

### Lightbox navigation

| Option | Description | Decision |
|---|---|---|
| **A** | Add `attachments[]` + `currentIndex` to `previewMedia` state; prev/next arrows in modal | ✅ Chosen |
| B | Open a separate "gallery" modal for multi-file posts | Overkill — same modal handles both cases |
| C | Show all files as a filmstrip below the main preview | Complex layout; out of scope for now |

### Card thumbnail badge

| Option | Description | Decision |
|---|---|---|
| **A** | Overlay `+N` badge in top-right corner of thumbnail when N > 1 | ✅ Chosen — same pattern as Instagram carousel indicator |
| B | Show a grid of small thumbnails | Too dense at card size |

### Board card indicator

| Option | Description | Decision |
|---|---|---|
| **A** | Show count number next to the icon when N > 1 (`🖼 3`) | ✅ Chosen — minimal change |
| B | Replace icon with paperclip | Loses distinction between media and document |

---

## Consequences

### Positive
- Users can preview all carousel slides / video clips without leaving the app
- Visual count on cards communicates how many assets a post has at a glance
- `previewMedia` state upgrade is backward-compatible — `currentIndex` defaults to 0, single-file posts work exactly as before

### Negative
- `previewMedia` state shape change requires updating every `setPreviewMedia()` call site — there are 3 of them (ContentDrawer attachment list click, ContentPlannerView calendar card click, ContentPlannerView list card click)

### Neutral
- `ContentBoardCard` does not receive `post.mediaAttachments` count — it receives the full `post: ContentPostItem` object which already includes `mediaAttachments?` — so no prop interface change needed

---

## Non-Goals

- Gallery thumbnail filmstrip at bottom of lightbox (future enhancement)
- `ProjectsWorkItemCard` media display — different context, lower priority, `mediaUrl` cover still correct there
- Swipe gesture navigation in lightbox — mouse/keyboard only for now

---

## Related

- ADR-0016 — Multi-File Media Upload  
- Spec: `docs/superpowers/specs/2026-11-03-multi-file-media-ui-adaptation.md`  
- Plan: `docs/superpowers/plans/2026-11-03-multi-file-media-ui-adaptation.md`
