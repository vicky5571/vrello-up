# ADR-0021 — Field Event Media Attachments via Google Drive & TaskAttachment SSOT

**Status:** Accepted  
**Date:** 2026-11-04  
**Area:** Field Events — Media & Documentation Uploads  
**Relates to:** ADR-0011 (Google Drive Centralized Storage), ADR-0016 (Multi-File Media Upload Content Post), ADR-0017 (Multi-File Media UI Adaptation), ADR-0018 (Thumbnail Generation)

---

## Context & Business Problem

In field marketing operations (roadshows, brand activations, store openings, school visits), ground teams capture high-resolution photos, event documentation, and B-roll video clips. Currently, `EventFormModal` handles media through two fragmented, manual URL-input mechanisms:

1. **"Field Documentation Archive (Storage Destination)"**:
   - A single text input field storing `eventMediaUrl: string`.
   - Labeled as a Google Drive folder link for archiving raw footage and photo coverage.
   - Users must either manually paste a URL or open Google Picker to grab a folder URL.
   - `mediaUrl` exists in the TypeScript `FieldEventItem` type, but **does not exist as a column in the Prisma `FieldEvent` model**.

2. **"B-Roll Video Clips & Highlight Documentation"**:
   - Stores an array of clips via the `EventFootage` relational table (`title`, `filePath`, `duration`).
   - Requires users to manually type a clip title, duration (e.g. "02:15"), and paste a direct video link or Google Drive file URL.
   - No direct device upload capability exists; users cannot drag-and-drop or upload directly from local phones/laptops on-site.

### Operational Friction & Architectural Debt
- **Zero Direct Upload**: Field marketing staff and agency leads must first manually navigate to Google Drive in another browser tab, create/locate a folder, upload large files, generate a public sharing link, and paste the URL back into the modal. This results in missing assets and abandoned documentation entries.
- **Data Model Duplication & Disparity**: Content Planner utilizes the centralized `TaskAttachment` SSOT schema (`src/types/index.ts`) backed by `mediaAttachments Json @default("[]")` on PostgreSQL. In contrast, Field Events use a separate relational table (`EventFootage`) with unstructured text columns (`filePath`), creating two divergent file paradigms for marketing assets across the platform.
- **Incompatible Media Players**: `EventFootageModal` expects `EventFootage[]` (`filePath`), whereas `ContentPlannerView`'s media previewer supports multi-attachment previews, aspect-ratio scaling, and WebP thumbnail rendering for `TaskAttachment[]`.

---

## Decision Drivers

- **Single UX Paradigm**: Field event organizers and content planners should share identical upload conventions ("Upload dari Perangkat" with live progress, drag-and-drop, and Google Drive auto-sync).
- **SSOT Alignment**: Invariant 1 dictates domain models use `TaskAttachment` from `src/types/index.ts` rather than ad-hoc entity-specific models like `EventFootage`.
- **Infrastructure Reuse**: Leverage existing Google Drive upload pipeline (`useDirectDriveUpload` -> `/api/marcom/drive/upload` -> `/api/marcom/drive/finalize`) and `GoogleDriveLinkModal` without creating redundant storage APIs.
- **Relational Integrity**: Store attachments consistently as `mediaAttachments Json @default("[]")` on the `FieldEvent` model in PostgreSQL, deprecating `EventFootage`.
- **Backward Compatibility**: Existing field event records with `EventFootage` rows must be gracefully migrated or adapted so historical footage links remain playable.

---

## Options Considered

### Option A: Unified `TaskAttachment[]` via `mediaAttachments` JSONB (Selected)
- Add `mediaAttachments Json @default("[]")` to `model FieldEvent` in `prisma/schema.prisma`.
- Replicate the Content Planner UX in `EventFormModal`: replace both "Field Documentation Archive" text input and "B-Roll Video Clips" manual inputs with a unified Media & Documentation section powered by `GoogleDriveLinkModal` and `useDirectDriveUpload`.
- Support both files (photos/videos) and Drive folder links using `TaskAttachment` (which natively supports `isSharedFolder?: boolean` and `url`).
- Deprecate the `EventFootage` table via migration (migrating existing footage rows into `mediaAttachments` JSON objects).
- Adapt `EventFootageModal` to accept `TaskAttachment[]`.

### Option B: Parallel Support (Keep `EventFootage` and add `mediaAttachments`)
- Keep `EventFootage` relational table intact.
- Add `mediaAttachments` JSONB column to `FieldEvent` for new device uploads.
- Dual-render both lists in the UI and maintain two parallel persistence paths in `/api/marcom/events`.

### Option C: Patch `EventFootage` with Upload Trigger Only
- Keep the `EventFootage` database model.
- Replace only the video URL text input with an upload button that creates an `EventFootage` row from an uploaded `TaskAttachment`.
- Leave "Field Documentation Archive" as a plain manual URL text input.

---

## Deep Trade-Off Matrix

| Dimension | Option A (Unified `TaskAttachment[]`) | Option B (Parallel Dual Models) | Option C (Patch `EventFootage`) |
|---|---|---|---|
| **UX Consistency** | **Highest**: Exact mirror of Content Planner ("Upload dari Perangkat", progress bar, reorder/delete) | **Poor**: Fragmented UI with two different attachment sections | **Moderate**: Upload available for footage, but folder link remains manual text |
| **Architectural Cohesion** | **Highest**: 100% SSOT compliance; all marcom assets use `TaskAttachment` | **Low**: Technical debt of maintaining two file storage models | **Low**: `EventFootage` remains an isolated snowflake model |
| **Database Simplicity** | **Clean**: 1 JSONB column on `FieldEvent`, drops `EventFootage` child table | **Complex**: 1 JSONB column + 1 relational table + dual joins | **Static**: No DB schema change, but perpetuates schema fragmentation |
| **Migration Cost** | **Moderate**: Requires Prisma migration and one-time data backfill script | **None**: No immediate migration needed | **None**: No migration |
| **Maintenance Burden** | **Lowest**: One set of UI components, hooks, and helpers across Content and Events | **High**: Duplicate serialization, filtering, and mutation handlers | **High**: Custom translation layers between `TaskAttachment` and `EventFootage` |

---

## Decision

**We adopt Option A.**

We will unify Field Event media management around the `TaskAttachment` SSOT schema.
1. Add `mediaAttachments Json @default("[]")` to `model FieldEvent` in PostgreSQL via Prisma.
2. In `EventFormModal`, replace the two legacy sections with a unified "Media & Dokumentasi Event" section equipped with:
   - "Upload dari Perangkat" button triggering `GoogleDriveLinkModal` and direct file drop.
   - Support for attaching Google Drive shared folders (for raw coverage archives).
   - Real-time upload progress feedback with percentage indicators and cancel support.
   - Attachment list displaying file type icons (`Film` vs `File` vs `Folder`), file size, preview action, and deletion.
3. Migrate existing `EventFootage` database records into `FieldEvent.mediaAttachments` format, then retire the `EventFootage` Prisma model and table.
4. Update `EventFootageModal` to read from `TaskAttachment[]` for playback and preview.

---

## Consequences

### Positive
- **Uniform User Experience**: Users have the exact same frictionless drag-and-drop and device file picker experience in both Content Planner and Field Events.
- **Zero Vercel Serverless Limits**: Uploads stream binary directly through the established Google Drive resumable session pipeline, avoiding payload caps and timeouts.
- **Architectural Cleanup**: Eliminates an entire orphaned database table (`EventFootage`) in favor of standard JSONB storage.
- **Rich Media Support**: Automatically inherits WebP thumbnail generation via Supabase Storage for attached photos.

### Negative & Accepted Technical Debt
- **Prisma Schema Migration Required**: Must run a Prisma migration to add `mediaAttachments` to `FieldEvent` and deprecate/drop `EventFootage`.
- **Data Backfill Required**: Historical `EventFootage` rows must be transformed into `TaskAttachment` objects and appended to each event's `mediaAttachments` array before dropping the table.

### Neutral
- `EventFootageModal` interface adapts from `EventFootage[]` to `TaskAttachment[]` (or accepts both during transition).

---

## Related Documentation

- ADR-0011: Centralized Google Drive Storage & Refresh Token  
- ADR-0016: Multi-File Media Upload for Content Posts  
- ADR-0017: Multi-File Media UI Adaptation  
- ADR-0018: Thumbnail Generation via Sharp + Supabase Storage  
- Spec: `docs/superpowers/specs/2026-11-04-field-event-media-attachments-design.md`  
- Plan: `docs/superpowers/plans/2026-11-04-field-event-media-attachments.md`
