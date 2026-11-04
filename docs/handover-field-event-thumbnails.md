# Handover — Field Event Thumbnail Compression & Cover Preview (ADR-0023 / Spec / Plan)

**Date:** 2026-11-04  
**Feature:** Field Event Thumbnail Compression & Cover Preview in Edit Drawer  
**Status:** Planning Complete — Execution Ready  
**Artifacts Generated:**
- ADR: `docs/adr/0023-field-event-thumbnail-generation-cover-preview.md`
- Spec: `docs/superpowers/specs/2026-11-04-field-event-thumbnails-design.md`
- Implementation Plan: `docs/superpowers/plans/2026-11-04-field-event-thumbnails.md`

---

## 1. Executive Summary & Objective

In this planning session, we designed the thumbnail compression, cover preview, and cover selection system for Field Events within `EventDrawer.tsx`, establishing identical visual polish and behavior to Content Planner (`ContentDrawer.tsx`).

### Core Architectural Decisions:
1. **Zero Google Drive Thumbnail Embeds**: `drive.google.com/thumbnail` URLs are explicitly banned to prevent third-party cookie blocking and image 403s on Safari, iOS, and Brave. Images strictly use Supabase WebP CDN URLs (`thumbnailUrl`); videos render a stylized gradient poster card with a `<Video />` icon.
2. **Unified Upload Route**: Rather than creating duplicate endpoints, we reuse `/api/marcom/drive/upload` with an optional `context: "events"` parameter, organizing thumbnails under `thumbnails/events/${userId}/${fileId}.webp` in the existing `content-thumbnails` Supabase bucket.
3. **16:9 Cover Showcase in `EventDrawer.tsx`**: Features a top 16:9 preview banner with play overlay, row-level 36×36 square thumbnails, a single-click "Cover" selector, and 6-dot drag reordering.
4. **Card Optimization**: `EventCardsView.tsx` renders edge-cached WebP thumbnails.

---

## 2. Files That Matter

| File Path | Purpose | Action in Next Session |
|---|---|---|
| `src/app/api/marcom/drive/upload/route.ts` | Upload route | Modify (support `context: "events"`) |
| `src/components/views/EventsView/EventDrawer.tsx` | Slide-over drawer | Modify (embed 16:9 banner, row thumbnails, cover toggle) |
| `src/components/views/EventsView/EventCardsView.tsx` | Card view | Modify (render WebP card thumbnails) |
| `src/components/views/EventsView/eventThumbnails.test.ts` | Unit tests | Create |

---

## 3. Exact Code Changes & Execution Order

### Step 1: Update `src/app/api/marcom/drive/upload/route.ts`
1. In `POST(request: NextRequest)` around line 105:
   ```typescript
   const rawContext = formData.get("context");
   const context = rawContext === "events" ? "events" : "content";
   ```
2. In `generateAndUploadThumbnail` (around line 35):
   ```typescript
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

### Step 2: In `EventDrawer.tsx`, Embed 16:9 Cover Showcase & Row Thumbnails
1. Resolve active cover:
   ```typescript
   const coverAttachment =
     mediaAttachments.find((a) => a.url === mediaUrl) ||
     mediaAttachments[0];
   const coverThumbnailUrl = coverAttachment?.thumbnailUrl;
   const isCoverVideo =
     coverAttachment?.type === "video" ||
     Boolean(coverAttachment?.url?.match(/\.(mp4|mov|webm)$/i));
   ```
2. Render 16:9 banner above the attachment list with play overlay:
   - For images: `<AppImage src={coverThumbnailUrl} fill sizes="card" className="w-full h-full object-cover" />`
   - For videos: Stylized dark gradient card with `<Video />` icon
   - Click triggers `onOpenFootageModal(event, 0)`
3. In each attachment row:
   - Render 36×36 square thumbnail (`<AppImage src={att.thumbnailUrl}>` for images)
   - Render "Cover" badge/button with `onClick={() => setMediaUrl(att.url)}`
   - Safe removal fallback: if removed item was cover, set `mediaUrl = remaining[0]?.url || ""`

### Step 3: In `EventCardsView.tsx`, Render Edge-Cached WebP Thumbnails
Update lines 72–76 and 225–245:
- Resolve `coverThumbnailUrl = primaryAttachment?.thumbnailUrl`
- Render `<AppImage src={coverThumbnailUrl} fill sizes="card" className="w-full h-full object-cover" />`

### Step 4: Verification Gates
```bash
npm run drift:check
npm run build:check
npm test
```

---

## 4. Explicit "Do Not Touch" List

- **Google Drive Thumbnail Embeds**: Never embed `drive.google.com/thumbnail` URLs.
- **Route Duplication**: Keep `/api/marcom/drive/upload` unified; do not create `/api/marcom/drive/upload-events`.
- **`src/components/views/ContentPlannerView/*`**: Read-only reference.

---

## 5. Acceptance Criteria Checklist

- [ ] `/api/marcom/drive/upload` accepts `context: "events"` and stores thumbnails at `thumbnails/events/...`.
- [ ] Uploading images in `EventDrawer` triggers Sharp compression and returns Supabase WebP `thumbnailUrl`.
- [ ] `EventDrawer` renders 16:9 aspect-video banner using `<AppImage src={coverThumbnailUrl}>`.
- [ ] Video attachments render stylized gradient card in the banner (zero Google Drive thumbnail embeds).
- [ ] Attachment rows render 36×36 square thumbnails for images.
- [ ] Clicking "Cover" designates the asset as cover without mutating array order.
- [ ] Removing active cover safely reassigns cover to the next available attachment.
- [ ] `EventCardsView` renders WebP thumbnails on event cards.
- [ ] `npm run drift:check` passes with `0 errors`.
- [ ] `npm run build:check` passes with `0 errors`.
- [ ] `npm test` passes with `0 failures`.
