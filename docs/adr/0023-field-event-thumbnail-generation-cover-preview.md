# ADR-0023 — Field Event Thumbnail Compression & Cover Preview in Edit Drawer

**Status:** Accepted  
**Date:** 2026-11-04  
**Area:** Field Events — Media Thumbnails & Cover Selection  
**Relates to:** ADR-0018 (Thumbnail Generation via Sharp + Supabase Storage), ADR-0021 (Field Event Media Attachments), ADR-0022 (Field Event Edit Drawer)

---

## Context & Problem Statement

In Content Planner, ADR-0018 introduced automatic WebP thumbnail generation:
1. When media is uploaded via `POST /api/marcom/drive/upload`, Sharp resizes compressible images (`jpg`, `jpeg`, `png`, `webp`) to a maximum width of 800px with aspect-ratio preservation.
2. The image is compressed into WebP (quality 75) and streamed directly to the public Supabase Storage bucket `content-thumbnails` (`thumbnails/${context}/${userId}/${fileId}.webp`).
3. The resulting public CDN URL is attached to `TaskAttachment.thumbnailUrl`.
4. In `ContentDrawer.tsx`, this powers a rich **16:9 Cover Preview Showcase banner** with hover play overlay and full-screen lightbox playback, as well as **row-level mini thumbnails** and a **"Cover" toggle button** to designate which asset represents the post on cards and calendars.

In Field Events, media was historically restricted to plain text URL strings for Google Drive folders and video links (`EventFootage`), with zero thumbnail generation or compression. Event cards in `EventCardsView` attempted to render Google Drive web viewer links, causing remote pattern mismatches or loading heavy multi-megabyte raw photos.

Furthermore, direct Google Drive thumbnail embeds (`drive.google.com/thumbnail?id=...` or `/preview`) are notoriously brittle in production: Safari (ITP), Brave, and iOS aggressively block Google Drive cookies in third-party contexts, frequently causing image 403s or broken image icons.

With the introduction of `EventDrawer` (ADR-0022) and the unified `TaskAttachment` SSOT schema (ADR-0021), Field Events requires thumbnail compression and cover preview experience that avoids flaky Google Drive embeds, reuses existing upload infrastructure, and ensures visual uniformity.

---

## Decision Drivers

- **Zero Pipeline Duplication**: Re-use the existing `/api/marcom/drive/upload` pipeline rather than creating duplicate upload routes. Support an optional `context: "events" | "content"` parameter for clean storage segregation.
- **Zero Google Drive Thumbnail Embeds**: Avoid flaky `drive.google.com/thumbnail` URLs. Strictly use Supabase Storage WebP CDN URLs for images, and stylized gradient poster cards for videos.
- **Visual Uniformity**: `EventDrawer` must feature the same prominent 16:9 aspect-video cover showcase banner, mini row thumbnails, and "Cover" toggle button as `ContentDrawer`.
- **Bandwidth & Rendering Performance**: Event cards in `EventCardsView` and `EventTableView` must load lightweight 800px WebP thumbnails instead of raw multi-megabyte images from Google Drive.
- **SSOT Integrity**: Leverage `TaskAttachment.thumbnailUrl` from `src/types/index.ts` and ensure `FieldEvent.mediaUrl` stays synchronized with the selected cover.

---

## Options Considered

### Option A: Unified Route + Supabase WebP CDN + Gradient Video Poster (Selected)
- **Backend Pipeline**: Reuse `/api/marcom/drive/upload` with an optional `context` param (`"events"` vs `"content"`, default `"content"`). Sharp compresses images to 800px WebP at quality 75, stored in Supabase Storage at `thumbnails/${context}/${userId}/${fileId}.webp`.
- **No Google Drive Embeds**: For images, use the public Supabase CDN URL (`thumbnailUrl`). For videos, render a stylized gradient card with a `<Video>` icon, clip title, and play button overlay (delegating playback to `EventFootageModal`).
- **Drawer Cover Showcase**: In `EventDrawer.tsx`, render a 16:9 aspect-video banner at the top of the Media section using `<AppImage src={coverThumbnailUrl}>`, complete with hover play overlay and trigger to `EventFootageModal`.
- **Row Thumbnails & Cover Selector**: Inside attachment rows, display 36×36 square thumbnail preview for images, 6-dot drag reordering, and a "Cover" button to designate which item is `FieldEvent.mediaUrl`.
- **Card/Table Synchronization**: Update `EventCardsView.tsx` to read `primaryClip?.thumbnailUrl || clipUrl`, serving fast WebP images on event cards.

### Option B: Separate Upload Route for Field Events
- Create a dedicated `/api/marcom/drive/upload-events` route.
- *Rejected*: Duplicates ~200 lines of complex resumable session chunking, Google OAuth refresh handling, and Sharp logic. Creates maintenance debt and drift risk.

### Option C: Google Drive Thumbnail Embeds
- Embed `drive.google.com/thumbnail?id=...` for all images and videos.
- *Rejected*: Flaky across Safari/Brave/iOS due to third-party cookie restrictions and rate limits.

---

## Deep Trade-Off Matrix

| Dimension | Option A (Unified Route + WebP CDN + Poster) | Option B (Separate Upload Route) | Option C (Google Drive Embeds) |
|---|---|---|---|
| **UX & Reliability** | **Highest**: 100% reliable CDN WebP for images, stylized poster for videos, 0 broken embeds | **High**: Same runtime behavior as A | **Poor**: Frequent 403s and broken icons in Safari/iOS |
| **Code Maintainability** | **Highest**: 1 upload route with `context` param (DRY) | **Poor**: ~200 lines of duplicate streaming & OAuth code | **Moderate**: No thumbnail processing, but complex client error handling |
| **Bandwidth Efficiency** | **Highest**: Edge CDN-cached WebP thumbnails (~40–80 KB) | **Highest**: Edge CDN-cached WebP thumbnails | **Moderate**: Google Drive serves heavier original frames |
| **Infrastructure Reuse** | **Complete**: Reuses Sharp, Supabase Storage, and `AppImage` | **Partial**: Reuses bucket, but duplicates route | **Zero**: Uses Google Drive only |

---

## Decision

**We adopt Option A.**

1. **Keep Unified Upload Route (`/api/marcom/drive/upload`)**:
   - Accept an optional `context` field in multipart `FormData` (`"events" | "content"`, default `"content"`).
   - Store thumbnails in Supabase Storage at `thumbnails/${context}/${userId}/${fileId}.webp`.
   - Sharp continues compressing images (`image/jpeg`, `image/png`, `image/webp`) to max 800px width at quality 75 WebP.
2. **Avoid Google Drive Thumbnail Embeds**:
   - For image attachments: Render `<AppImage src={att.thumbnailUrl}>` from the Supabase CDN.
   - For video attachments: Render a stylized gradient poster card with a `<Video>` icon and play button.
   - Never embed `drive.google.com/thumbnail` URLs.
3. **Implement 16:9 Cover Showcase in `EventDrawer.tsx`**:
   - Resolve `coverAttachment = mediaAttachments.find(a => a.url === mediaUrl) || mediaAttachments[0]`.
   - If `coverAttachment?.thumbnailUrl` exists, render `<AppImage src={coverAttachment.thumbnailUrl} fill sizes="card" className="w-full h-full object-cover" />`.
   - If cover is video, render the stylized gradient poster.
   - Clicking banner opens full-screen player (`EventFootageModal`).
4. **Add Row-Level Thumbnails & Cover Assignment**:
   - Show 36×36 square thumbnail for image attachments.
   - Show "Cover" badge/button on each row to allow designating any attachment as the active cover.
   - Synchronize `mediaUrl` with the selected cover attachment.
5. **Card Optimization**:
   - In `EventCardsView.tsx`, render `primaryAttachment?.thumbnailUrl` through `<AppImage>` with fallback to video poster.

---

## Consequences

### Positive
- **Rock-Solid Visual Reliability**: Eliminates third-party cookie failures and broken Google Drive image links across Safari and mobile browsers.
- **Zero Code Duplication**: Single `/api/marcom/drive/upload` endpoint serves all marcom domains.
- **Fast Card Loading**: Board cards load lightweight WebP thumbnails from Supabase Storage instead of large raw assets.

### Negative & Accepted Technical Debt
- Minor storage accumulation in Supabase bucket `content-thumbnails` (offset by small file sizes: ~40–80 KB per thumbnail).

---

## Related Documentation

- ADR-0018: Thumbnail Generation via Sharp + Supabase Storage  
- ADR-0021: Field Event Media Attachments via Google Drive & TaskAttachment SSOT  
- ADR-0022: Field Event Edit Drawer and Modal Separation  
- Spec: `docs/superpowers/specs/2026-11-04-field-event-thumbnails-design.md`  
- Plan: `docs/superpowers/plans/2026-11-04-field-event-thumbnails.md`
