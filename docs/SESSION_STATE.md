# SESSION_STATE.md — vrello-up

> **Update this file BEFORE ending every session.** Next session reads this first.

---

## Current Status

**Date:** 2026-11-04  
**Active Branch:** `vicky`  
**Active Feature:** Field Event Media Attachments via Google Drive (ADR-0021) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Outlet Draft Photo Supabase Storage Migration (ADR-0020)  

---

## What Was Completed This Session

1. **Field Event Media Attachments Implementation (ADR-0021, Spec & Plan `2026-11-04-field-event-media-attachments`):**
   - **Database Schema & Migration:**
     - Modified `prisma/schema.prisma`: Added `mediaAttachments Json @default("[]")` to `FieldEvent` model; removed `EventFootage` relation and dropped `EventFootage` model.
     - Generated and applied migration `prisma/migrations/20261104000000_add_field_event_media_attachments/migration.sql`.
     - Regenerated Prisma Client v6.19.3.
     - Updated `prisma/seed.ts` to attach media attachments to `event-003` and clean up `eventFootage` references.
   - **Domain Entity SSOT (`src/types/index.ts`):**
     - Updated `FieldEventItem` interface to include `mediaAttachments?: TaskAttachment[]`.
   - **API Routes Updated:**
     - `src/app/api/marcom/events/route.ts`: Sanitizes `mediaAttachments`, validates array structure, persists directly to `prisma.fieldEvent.create`, and removed legacy `footage: true` queries.
     - `src/app/api/marcom/events/[id]/route.ts`: Added `"mediaAttachments"` to `PATCHABLE_FIELDS`, validates array in PATCH handler, and removed legacy `EventFootage` handling.
     - `src/app/api/marcom/outlets/[id]/route.ts` & `src/app/api/marcom/pipeline/route.ts`: Removed obsolete `include: { footage: true }`.
   - **Component Modernization & Refactoring:**
     - Created `src/components/views/EventsView/EventMediaSection.tsx`: Atomic subcomponent following Strangler Pattern with "Upload dari Perangkat" button, drag-and-drop zone, real-time Google Drive upload progress bar with cancellation, interactive attachment list with type icons (`Film`, `Video`, `File`, `Folder`), and Drive folder link input for raw coverage archives.
     - Updated `src/components/views/EventsView/EventFormModal.tsx`: Integrated `EventMediaSection`, converted legacy footage/mediaUrl to `TaskAttachment[]` for backward-compatibility, removed legacy footage states, and persisted `mediaAttachments`.
     - Updated `src/components/views/EventsView/EventFootageModal.tsx`: Adapted clips playlist to prioritize `event.mediaAttachments`, added image file previews alongside video/Google Drive iframes, and linked Drive archive folder.
     - Updated `src/components/views/EventsView/EventCardsView.tsx`: Displays photo and video previews, dynamic media count badge, and archive folder button.
     - Updated `src/components/views/EventsView/EventTableView.tsx`: Displays unified media count badge.
   - **Tests & Verification:**
     - Created `src/components/views/EventsView/eventsApi.test.ts` with 3 integration tests covering SSOT types, POST validation, and PATCH updates.
     - Verified:
       - `npm run drift:check`: ✅ No drift detected. All invariants pass.
       - `npm run build:check`: ✅ TypeScript compiled with 0 errors.
       - `npm run test:smoke`: ✅ 104 passed, 0 failed.
       - `node --test src/components/views/EventsView/eventsApi.test.ts`: ✅ 3 passed, 0 failed.

2. **Outlet Draft Photo Supabase Storage Migration (ADR-0020, Spec & Plan `2026-11-03-outlet-draft-photo-supabase-storage`):**
   - **Bucket Setup:** Created public `outlet-photos` Supabase Storage bucket with 25MB limit via Storage REST API.
   - **Extended `/api/marcom/uploads/route.ts`:**
     - Added `"outlets"` to `VALID_KINDS`.
     - Mapped `outlets` to `outlet-photos` bucket and `outlets` path prefix (`outlets/{branchId}/{uuid}-{sanitizedFilename}`).
     - Protected with `SUBMIT_DRAFT_OUTLET` permission action.
     - Updated invalid kind error message.
   - **Updated `SubmitDraftOutletModal.tsx`:**
     - Added `ALLOWED_PHOTO_TYPES` (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`) guard to prevent iOS HEIC payload bloat.
     - Stored compressed `File` in `photoFile` state, keeping `formData.photoUrl` base64 preview local to the browser.
     - Implemented upload-before-create in `handleSubmit`: uploads `photoFile` to `/api/marcom/uploads`, receives CDN public URL, asserts non-data URL safety net, and submits to `/api/marcom/outlets/draft`.
     - Added `isUploadingPhoto` state and spinner label ("Mengunggah Foto...").
     - Ensured `photoFile` resets on photo removal, manual URL input, and modal reopen.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 103 passed, 0 failed.
     - `npm test`: ✅ 748 passed, 0 failed (133 suites).
     - End-to-end smoke test verified file upload to `outlet-photos` and public CDN retrieval.
     - Confirmed existing database rows count with `photoUrl LIKE 'data:%'` is 0 (Phase 6 backfill not needed).

2. **Migrate Filesystem Uploads to Supabase Storage (ADR-0019, Spec & Plan `2026-11-03-migrate-filesystem-uploads-to-supabase-storage`):**
   - **Bucket Setup:** Created 3 public Supabase Storage buckets via Storage REST API: `mou-documents` (25MB limit), `marcom-documents` (25MB limit), and `placement-photos` (25MB limit).
   - **Shared Storage Helper (`src/lib/server/supabaseStorage.ts`):** Lightweight `uploadToSupabase(bucket, storagePath, buffer, mimeType)` REST helper using Node native `fetch` and service role authentication without needing `@supabase/supabase-js`.
   - **Rewrote `/api/marcom/uploads/route.ts`:** Replaced local `node:fs/promises` (`mkdir`, `writeFile`) with direct `uploadToSupabase`. Route returns public CDN URLs under `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`. Supported upload kinds: `documents`, `mou-documents`, `placements`.
   - **Updated `mouApi.ts`:** Changed `kind` parameter in `uploadMouDocument()` from `"documents"` to `"mou-documents"` to route MOU contracts into the dedicated `mou-documents` bucket.
   - **Tests Added & Passing:**
     - `src/lib/server/supabaseStorage.test.ts`: Tests missing env vars, successful buffer uploads, and HTTP error handling.
     - `src/app/api/marcom/uploads/uploadsApi.test.ts`: Enforces no local fs writes and verifies bucket mappings.
     - `src/components/views/MousView/mouApi.test.ts`: Verifies `kind: "mou-documents"` dispatched to `/api/marcom/uploads`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 103 passed, 0 failed.
     - `npm test`: ✅ 748 passed, 0 failed (133 suites).

2. **6-Dot Drag-to-Reorder for Media Attachments (`ContentDrawer.tsx` & `ContentPostModal.tsx`):**
   - **6-Dot Drag Handle:** Added `GripVertical` icon (6 dots) to the left of the file icon in `ContentDrawer` and `ContentPostModal`.
   - **Native Drag-and-Drop:** Enabled HTML5 drag-and-drop on the grip handle (`cursor-grab active:cursor-grabbing`, `draggable`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`) with a custom drag image (`setDragImage`) referencing the full attachment row.
   - **Visual Feedback:** While dragging, the dragged item displays `opacity-40 border-dashed border-pink-400` and the drop target row highlights with `border-pink-500 bg-pink-50/50`.
   - **Preserves Cover State:** Reordering items directly mutates only the sequence in `mediaAttachments`, keeping cover resolution decoupled and strictly bound to `mediaUrl`.
   - **Badge Update:** Cleaned up badge from `"(New)"` to `"New"`.

2. **Decouple Cover Selection from Array Reordering (`ContentDrawer.tsx`, `ContentPlannerView.tsx`, `ContentPostModal.tsx`):**
   - **No Array Reordering:** Clicking "Cover" on any attachment now points `mediaUrl = att.url` without mutating or reordering the `mediaAttachments` array order. Files stay in their original upload sequence.
   - **Cover State Resolution:** Cover badge and cover buttons evaluate `isCover = att.url === (mediaUrl || mediaAttachments[0]?.url)`.
   - **Drawer Preview & Card Thumbnail:** Both preview player and calendar/list/board cards resolve the active cover attachment via `mediaAttachments.find(a => a.url === mediaUrl) || mediaAttachments[0]`. Lightbox thumbnail click automatically opens directly at the chosen cover's index.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Unsaved Media Indicator (New) in ContentDrawer (`src/components/views/ContentPlannerView/ContentDrawer.tsx`):**
   - **Feature & Visual Indicator:** Added thin green `(New)` text (`text-[10px] text-emerald-600 dark:text-emerald-400 font-normal shrink-0`) displayed right after the file size for any media attachment recently uploaded in the current drawer session that has not yet been saved to PostgreSQL.
   - **Persistence Synchronization:** Managed `savedAttachmentIds` state initialized from `post.mediaAttachments` on drawer open. Marking newly added files as unsaved until the user clicks "Simpan Perubahan", at which point `savedAttachmentIds` is updated and the `(New)` tag is cleared.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Simplify Media Upload Entry Points in ContentDrawer (Plan: `docs/superpowers/plans/2026-11-03-simplify-media-upload-entry-points.md`):**
   - **Upload-Only Modal (`src/components/ui/GoogleDriveLinkModal.tsx`):**
     - Removed segmented tab control ("Unggah Langsung" vs "Tempel Link URL") and `activeTab` state.
     - Removed `GoogleDriveUrlForm`, `buildAttachmentFromManualUrl`, and `Link2` imports.
     - Simplified header subtitle to "Unggah berkas langsung ke Google Drive."
     - Rendered the direct upload dropzone, file list, and confirmation action directly.
   - **Unified "Upload dari Perangkat" Entry Points (`src/components/views/ContentPlannerView/ContentDrawer.tsx`):**
     - Updated top header "Upload dari Perangkat" button to open `onOpenUploadModal`, leading directly into the multi-file upload modal.
     - Removed redundant "Link Drive" buttons from both top header and empty-state dropzone.
     - Updated empty-state dropzone "Upload dari Perangkat" button to trigger `onOpenUploadModal`.
     - Removed URL paste input from both empty-state dropzone and media-set action row.
     - Updated "Ganti" button in media-set view to open `onOpenUploadModal` with replacement callback (`setMediaAttachments(attachments)`).
     - Removed unused `CloudUpload` import.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Thumbnail Generation via Sharp + Supabase Storage (ADR-0018, Spec & Plan: `2026-11-03-thumbnail-generation-supabase-storage`):**
   - **Pre-requisite (Supabase Storage Bucket):**
     - Initialized and configured public bucket `content-thumbnails` via Supabase REST API (file size limit 5 MB, allowed MIME type `image/webp`).
     - Verified public object URL pattern returns 404 (NoSuchKey) instead of 401/403.
   - **Attachment Model & Types (`src/lib/marcom/driveUploadHelpers.ts`, `driveUploadHelpers.test.ts`):**
     - Extended `BuildDriveAttachmentParams` with optional `thumbnailUrl?: string`.
     - Populated `thumbnailUrl` on canonical `TaskAttachment` objects created via `buildDriveAttachment`.
     - Added comprehensive unit tests in `driveUploadHelpers.test.ts`.
   - **Upload Endpoint & Image Compression (`src/app/api/marcom/drive/upload/route.ts`):**
     - Integrated `sharp` image processor for compressible image types (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`).
     - Resizes images to max 800px width with aspect ratio preservation and converts to WebP (quality 75).
     - Directly streams WebP buffer to Supabase Storage at `thumbnails/${userId}/${fileId}.webp` with `x-upsert: true` and public max-age caching.
     - Preserves graceful non-fatal degradation: if Supabase upload or sharp fails, Google Drive upload still completes normally.
     - Returns `{ success: true, fileId, name, thumbnailUrl }`.
   - **Attachment Finalization & Hook Threading (`src/app/api/marcom/drive/finalize/route.ts`, `src/lib/marcom/useDirectDriveUpload.ts`):**
     - Threaded `thumbnailUrl` through `useDirectDriveUpload` upload response into the `finalize` API request payload.
     - Finalize route passes `thumbnailUrl` to `buildDriveAttachment`.
   - **Card & Drawer Thumbnail Rendering (`ContentPlannerView.tsx`, `ContentDrawer.tsx`):**
     - Added `thumbnailUrl` check as the primary rendering branch before the Google Drive placeholder check in `ContentPlannerView.tsx`.
     - Renders `<AppImage src={coverThumbnailUrl} ...>` with smooth hover preview overlay.
     - Added cover preview thumbnail rendering in `ContentDrawer.tsx`.
     - Added "Cover" action button on non-first attachment rows in `ContentDrawer.tsx` to easily reorder attachments and set any uploaded item as cover.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Toast Notifications Timer Progress Bar (Plan: `2026-11-03-toast-timer-progress-bar.md`):**
   - **Feature & UX Feedback:** Added a thin, semantic countdown timer progress bar (`height: 2px; opacity: 0.45; background: currentColor`) at the bottom of toast notifications in `src/app/globals.css`.
   - **Synchronization:** Explicitly set `duration={4000}` on `<Toaster />` in `src/app/layout.tsx` matching the CSS linear keyframe countdown.
   - **Interactive State:** Pauses countdown on toast hover (`animation-play-state: paused`) in sync with Sonner's hover-pause behavior; excludes loading/promise toasts and respects `prefers-reduced-motion`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Move Toast Notifications to top-right (Plan: `2026-11-03-fix-toast-position-top-right.md`):**
   - **Root Cause & UX Collision:** Toast notifications were configured at `bottom-right`, where sequentially fired multi-file upload toasts piled up directly over `ContentDrawer` bottom CTAs ("Simpan Perubahan" and "Hapus Post"), blocking user clicks.
   - **Fix:** Updated `<Toaster richColors position="top-right" />` in `src/app/layout.tsx`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Fix mediaAttachments Not Saving in ContentPlannerView Drawer Update (Plan: `2026-11-03-fix-media-attachments-not-saving.md`):**
   - **Root Cause:** `handleDrawerUpdate` in `ContentPlannerView.tsx` manually constructed the PATCH request payload and omitted `mediaAttachments`, causing updates from `ContentDrawer` to never persist attachments to PostgreSQL.
   - **Fix:** Added `mediaAttachments: updated.mediaAttachments ?? []` to the PATCH request body in `ContentPlannerView.tsx`.
   - **Impact:** Fixes both attachment persistence across drawer saves and enables the lightbox multi-attachment carousel/navigation when clicking post cards.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Multi-File Media UI Adaptation for Content Planner (Plan: `2026-11-03-multi-file-media-ui-adaptation.md`, ADR: `docs/adr/0017-multi-file-media-ui-adaptation.md`, Spec: `docs/superpowers/specs/2026-11-03-multi-file-media-ui-adaptation.md`):**
   - **`previewMedia` State Refactoring (`ContentPlannerView.tsx`):**
     - Updated shape from `{ title, mediaUrl, platform?, format? }` to `{ title, attachments: TaskAttachment[], currentIndex: number, platform?, format? }`.
     - Extended keyboard listener to handle `ArrowLeft` and `ArrowRight` navigation with boundary clamping.
     - Updated calendar/list card thumbnail click handler to populate `attachments` (real `mediaAttachments` or synthetic 1-item cover array) and `currentIndex: 0`.
   - **Full Lightbox Navigation (`ContentPlannerView.tsx`):**
     - Added active file counter (`${currentIndex + 1} / ${attachments.length}`) and truncated active filename in header.
     - Replaced hardcoded `previewMedia.mediaUrl` with active attachment `active.url` (including external link).
     - Added responsive prev/next navigation overlay buttons (`ChevronLeft` / `ChevronRight`) with disabled edge states.
     - Added bottom dot indicators (capped at 10 dots with ellipsis) with direct click-to-jump navigation.
   - **ContentDrawer Call Sites (`ContentDrawer.tsx`):**
     - Updated `onPreviewMedia` prop contract to accept `{ title, attachments, currentIndex, platform?, format? }`.
     - Cover thumbnail click opens lightbox at index 0.
     - Attachment list row click opens lightbox directly at clicked item index (`currentIndex: i`).
   - **Card Surface Indicators (`ContentPlannerView.tsx` & `ContentBoardCard.tsx`):**
     - Calendar & list view thumbnails display `+N` badge (`+{attachments.length - 1}`) when attachments > 1.
     - Kanban board cards display `ImageIcon` with item count badge (`🖼 N`) when attachments > 1.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected (0 errors).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Multi-File Device Upload in ContentDrawer (Plan: `2026-11-03-fix-drawer-multi-file-device-upload.md`):**
   - **Multi-File Input (`ContentDrawer.tsx`):** Added `multiple` attribute to `<input type="file">`, allowing OS file picker to select multiple files at once.
   - **Batch File Processing (`ContentDrawer.tsx`):** Updated `onChange` and `handleDrop` from single-element indexing (`files?.[0]`) to sequential `for...of` processing across `Array.from(files)`.
   - **Sequential Queue & Feedback:** Each file is streamed to Google Drive sequentially with distinct loading/success toasts, automatically appended into `mediaAttachments`, and keeps `mediaUrl` synchronized with the cover.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).

2. **Multi-File Upload in ContentPostModal Create Flow (Plan: `2026-11-03-multi-file-upload-create-modal.md`):**
   - **Modal Refactoring (`ContentPostModal.tsx`):**
     - Replaced internal single-file `useDirectDriveUpload` and hidden input with unified `onOpenUploadModal` trigger matching `ContentDrawer`.
     - Rendered interactive attachment list showing file type icons (`Film` vs `File`), filenames, formatted file sizes (`MB`), Cover indicator on first item, and delete actions.
     - Preserved manual link URL input as graceful empty-state fallback.
   - **View State & Creation Wiring (`ContentPlannerView.tsx`):**
     - Added `mediaAttachments: TaskAttachment[]` state to creation form.
     - Reset `mediaAttachments` to `[]` on modal open.
     - Included `mediaAttachments` and synchronized `mediaUrl = mediaAttachments[0]?.url || mediaUrl.trim()` in POST payload.
     - Passed `mediaAttachments`, `setMediaAttachments`, and `onOpenUploadModal` props to `<ContentPostModal>`.
   - **Cross-Component Compatibility:**
     - Made `mediaAttachments` props optional with default fallbacks in `ContentPostModalProps` to protect callers like `ProjectsCreateModalHost.tsx`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).

2. **Fix Prisma Migration History Drift (Plan: `docs/superpowers/plans/2026-11-03-fix-prisma-migration-drift.md`):**
   - **Root Cause & Diagnosis:** Live PostgreSQL database on Supabase was previously updated via direct SQL / `db push` without initializing the `_prisma_migrations` tracking table, causing `prisma migrate status` to warn that 5 existing migrations had not been applied.
   - **Migration History Initialization:**
     - Created `_prisma_migrations` table and resolved all 5 legacy migrations as applied using `npx prisma migrate resolve --applied`:
       - `20260906221636_marcom_port`
       - `20261027000000_remove_workspace_tenant`
       - `20261029072742_add_user_auth_model`
       - `20261029134026_drop_task_models`
       - `20261030192500_add_inventory_system`
     - Created new migration file `prisma/migrations/20261103000000_add_media_attachments/migration.sql` with safe idempotent SQL: `ALTER TABLE "ContentPost" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';`.
     - Resolved `20261103000000_add_media_attachments` as applied.
   - **Verification:**
     - `npx prisma migrate status`: ✅ 6 migrations found, database schema is up to date.
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.

2. **Multi-File Media Upload for Content Posts (ADR-0016, Spec & Plan: `2026-11-03-multi-file-media-upload`):**
   - **Database & Prisma Schema (`prisma/schema.prisma`):**
     - Added `mediaAttachments Json @default("[]")` to `model ContentPost`.
     - Applied Postgres schema update: `ALTER TABLE "ContentPost" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';`.
     - Regenerated Prisma Client (`npx prisma generate`).
   - **SSOT Type Definitions (`src/types/index.ts`):**
     - Updated `ContentPostItem` domain interface to include `mediaAttachments?: TaskAttachment[]`.
   - **API Routes (`src/app/api/marcom/content/route.ts`, `src/app/api/marcom/content/[id]/route.ts`):**
     - POST route: extracts `mediaAttachments` and enforces array validation (`Array.isArray(mediaAttachments) ? mediaAttachments : []`).
     - PATCH route: updates `mediaAttachments` when passed in request body (`Array.isArray(body.mediaAttachments) ? body.mediaAttachments : []`).
   - **Modal Multi-File Upload UI (`src/components/ui/GoogleDriveLinkModal.tsx`):**
     - Rewrote to accumulate files across multiple uploads in `uploadedFiles` state array instead of auto-closing immediately.
     - Dropzone remains available for batch uploading up to a 10-file cap.
     - Renders scrollable file list with file type icons (`Film` vs `FileText`), filename, formatted file size (`KB`/`MB`), checkmark status, and per-item remove button.
     - "Lampirkan X File" confirm button passes `TaskAttachment[]` to `onAttach` and closes modal.
     - "Tempel Link URL" tab automatically constructs a valid `TaskAttachment` via `buildAttachmentFromManualUrl` and attaches it.
   - **Callers & Hook Compatibility (`src/lib/marcom/useGoogleDrivePicker.ts`, `ContentPlannerView.tsx`):**
     - Updated `handleManualAttach` to accept `attachmentsOrUrl: TaskAttachment[] | string`, ensuring complete backward compatibility for other views (`DocumentsView`, `EventFormModal`, `ProjectsCreateModalHost`).
     - Updated `pendingUploadAttachRef` and `handleOpenUploadModal` in `ContentPlannerView.tsx` to handle `(attachments: TaskAttachment[]) => void`.
   - **Drawer State & Multi-Media Presentation (`src/components/views/ContentPlannerView/ContentDrawer.tsx`):**
     - Managed `mediaAttachments` local state, hydrated on post selection (`Array.isArray(post.mediaAttachments) ? post.mediaAttachments : []`).
     - Kept `mediaUrl` and `mediaAttachments[0]` in strict synchronization: attaching files sets cover URL to index 0, removing index 0 automatically promotes index 1 to cover and updates `mediaUrl`.
     - Rendered attachment list cards with "Cover" badge, preview button, and delete action.
     - Handled device file upload and Drive modal attachment flows seamlessly.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).

1. **Fix Drive Upload CORS Error + Restore Picker User Drive View (Plan: `2026-11-03-fix-drive-upload-cors-picker-upload-tab.md`):**
   - **Root Cause & Diagnosis:**
     1. Direct browser XHR `PUT` to Google's resumable session URL failed with browser CORS policy block (`No 'Access-Control-Allow-Origin' header is present`) because the resumable session URL was generated server-side with a service account token and does not authorize browser origins.
     2. Google Picker displayed "No documents" because `docsView.setParent(FOLDER_ID)` scoped file queries to the service account's internal Drive folder which authenticated users do not own.
   - **Server-Side Upload Proxy (`src/app/api/marcom/drive/upload/route.ts`):**
     - Created `POST /api/marcom/drive/upload` multipart endpoint that receives file binary, initiates resumable session, and executes the PUT stream server-to-server directly to Google's CDN without CORS constraints.
     - Enforces authentication guard and file name sanitization via `sanitizeUploadFileName`.
     - Returns `{ success: true, fileId, name }`.
   - **Hook Refactoring (`src/lib/marcom/useDirectDriveUpload.ts`):**
     - Replaced browser XHR with clean `fetch()` multipart POST to `/api/marcom/drive/upload` followed by `/api/marcom/drive/finalize`.
     - Added standard `AbortController` cancellation support (`cancelUpload()`) and progressive percentage progress indicators (20% -> 40% -> 75% -> 100%).
   - **Google Picker Unscoping (`src/lib/marcom/useGoogleDrivePicker.ts`):**
     - Removed `docsView.setParent(FOLDER_ID)` to let the Picker surface the authenticated user's own Drive documents and folders instead of the empty service account folder.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).
     - `npm run build`: ✅ Next.js production build compiled cleanly (48/48 routes).

2. **Direct "Upload dari Perangkat" Button & Drag-and-Drop in ContentDrawer & ContentPostModal:**
   - **User Intent & Problem Statement:** Users requested an explicit, foolproof **"Upload dari Perangkat"** button to upload images and videos directly from their local machine into Content Planner without having to navigate modal sub-tabs or deal with Google login popups.
   - **Direct Device File Picker (`ContentDrawer.tsx`, `ContentPostModal.tsx`):**
     - Embedded a hidden `<input ref={fileInputRef} type="file" accept="image/*,video/*" />` triggered directly by a prominent "Upload dari Perangkat" button with `<Upload />` icon.
     - Wired up `useDirectDriveUpload` for direct binary streaming to Google Drive via server-side resumable session (`/api/marcom/drive/upload-session` and `/api/marcom/drive/finalize`), bypassing Vercel 4.5MB payload limits and making files readable with zero user Google login.
     - Added real-time upload progress card showing animated progress bar, live percentage (`X%`), spinning indicator, and abort/cancel control.
   - **Interactive Dropzone Empty State (`ContentDrawer.tsx`):**
     - When no media is attached, replaced the plain text input with an interactive dashed dropzone supporting direct drag-and-drop of video/image files.
     - Provided two prominent actions: primary "Upload dari Perangkat" button and secondary "Link Drive" button (`onOpenUploadModal`), plus direct URL input.
   - **Post Creation Modal Parity (`ContentPostModal.tsx`):**
     - Added "Upload dari Perangkat" button alongside "Google Drive" picker with live upload progress bar.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Unify ContentDrawer Media Upload to Single "Tambah Media" Button (Plan: `2026-11-03-fix-drive-picker-no-upload-tab.md`):**
   - **User Intent & Problem Statement:** The native Google Picker had no upload tab and was scoped to a shared folder, showing "No documents". Having two adjacent text links ("Upload dari Perangkat" and "Pilih dari Google Drive") caused confusion and directed users back to the dead-end native Picker flow.
   - **Unified UX Entry Point (`ContentDrawer.tsx`):** Replaced the dual-link buttons with a single, prominent "Tambah Media" button that triggers `onOpenUploadModal`.
   - **Modal Integration (`ContentPlannerView.tsx`):** "Tambah Media" directly opens `GoogleDriveLinkModal` (which provides both "Unggah Langsung" via service account resumable direct stream and "Tempel Link URL" for existing Drive links). Removed `onOpenDrivePicker` invocation from `ContentDrawer`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Fix Google Drive Picker "Server rejected" & Content Media Type (Plan: `2026-11-03-fix-drive-picker-upload-server-rejected.md`):**
   - **Root Cause & Diagnosis:** Google Picker native Upload tab (`DocsUploadView`) failed with "Server rejected" when uploading images because `drive.file` OAuth scope restricts file access to app-created files and does not permit creating arbitrary files in the native Picker iframe. In addition, `defaultKind: "video"` was hardcoded for content posts, restricting Picker to video files only and blocking PNG/JPEG selections.
   - **Fix 1 — Disable Broken Picker Native Upload Tab (`src/lib/marcom/useGoogleDrivePicker.ts`):** Removed `new google.picker.DocsUploadView()` and `.addView(uploadView)` from `createAndShowPicker`. Direct uploads are handled safely and reliably by `GoogleDriveLinkModal` via `useDirectDriveUpload` using the server-side service account.
   - **Fix 2 — Allow All File Types for Content Posts (`ContentDrawer.tsx`, `ContentPlannerView.tsx`):** Changed `defaultKind` from `"video"` to `"all"` in `ContentDrawer.tsx` (`onOpenDrivePicker`) and `ContentPlannerView.tsx` (`onOpenDriveSelector` & `GoogleDriveLinkModal`), allowing users to pick images, carousels, videos, and documents seamlessly.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Verify Content Format Video Regression Resolution (Plan: `2026-11-02-fix-content-format-video-regression.md`):**
   - **Diagnosis & Plan Scope:** Evaluated regression report where `format: "video"` previously failed after hard refresh due to unpatched database rows reloading into in-memory Zustand store.
   - **Database Row Verification:** Verified database state directly via Prisma query (`ContentPost.findMany`). Zero rows contain invalid formats (`format: { notIn: ["reel", "carousel", "image", "story", "article", "thread"] }` returns 0). Zero rows contain invalid status (`REVISION_NEEDED`). All existing records (`cnt-001`, `cnt-002`, `cnt-003`, `cnt-004`, etc.) have canonical format (`reel` / `carousel` / `image`) and canonical status (`REVISION`, `PUBLISHED`, `IN_REVIEW`, `SCHEDULED`).
   - **Client-Side Guard Verification:** Confirmed `ContentDrawer.tsx` line 108 enforces `isValidFormat(post.format) ? post.format : "reel"` and `isValidPlatform(post.platform) ? post.platform : "instagram"`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Fix Invalid `format: "video"` & Seed Data Normalization (`ContentDrawer.tsx`, `prisma/seed.ts`):**
   - **Plan:** `docs/superpowers/plans/2026-11-02-fix-content-format-invalid-video.md`.
   - **Root Cause:** `prisma/seed.ts` originally seeded invalid `format` (`reels`, `video`, `shorts`) and invalid `status` (`REVISION_NEEDED`) directly via Prisma. When opened in `ContentDrawer`, `post.format` (`"video"`) was loaded into state and passed to `PATCH /api/marcom/content/[id]`, which failed with HTTP 400 (`Invalid format: 'video'. Must be one of: reel, carousel, image, story, article, thread`).
   - **Seed File Fix (`prisma/seed.ts`):** Corrected `cnt-001` (`"reels"` -> `"reel"`), `cnt-002` (`"video"` -> `"reel"`, `"REVISION_NEEDED"` -> `"REVISION"`), and `cnt-004` (`"shorts"` -> `"reel"`).
   - **Client-Side Fallback Guard (`ContentDrawer.tsx`):**
     - Imported `isValidFormat`, `isValidPlatform`, and `VALID_POST_STATUSES` from `@/lib/marcom/contentTaxonomy`.
     - Guarded `setFormat` with `isValidFormat(post.format) ? post.format : "reel"`.
     - Guarded `setPlatform` with `isValidPlatform(post.platform) ? post.platform : "instagram"`.
     - Guarded `setStatus` with fallback from `"REVISION_NEEDED"` to `"REVISION"` and validation against `VALID_POST_STATUSES`.
   - **Database Row Normalization:** Migrated existing records in `ContentPost` (`format: "reel"` for `video/reels/shorts`, `status: "REVISION"` for `REVISION_NEEDED`).
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Google Drive Remote Image Pattern & AppImage Resilience Fix (`next.config.ts`, `AppImage.tsx`, `appImageHelpers.ts`, `appImageHelpers.test.ts`):**
   - **Root Cause & Problem Statement:** Next.js threw runtime error `Error: Invalid src prop (...) on next/image, hostname "drive.google.com" is not configured under images in your next.config.js` when rendering card attachments with Google Drive viewer links.
   - **next.config.ts Configuration:** Added `drive.google.com`, `docs.google.com`, and `*.google.com` to `images.remotePatterns`.
   - **Image Source Normalization (`normalizeImageSrc` in `appImageHelpers.ts`):** Converts Google Drive web viewer links (`/file/d/{id}/view`, `?id={id}`) into direct thumbnail endpoints (`https://drive.google.com/thumbnail?id={id}&sz=w800`).
   - **Unconfigured Remote Host Protection (`isConfiguredRemoteHost` in `appImageHelpers.ts` & `AppImage.tsx`):** If an image URL belongs to an unconfigured external domain, `AppImage` gracefully falls back to a native `<img>` element instead of letting Next.js throw unhandled runtime exceptions.
   - **Bypass Image Optimization for Google Drive (`shouldBypassOptimization`):** Flags Google Drive URLs as `unoptimized` so client browsers fetch thumbnails directly with user session context rather than causing server-side image proxy failures.
   - **Unit Tests:** Added 6 new test cases to `src/components/ui/appImageHelpers.test.ts` (15 tests passing).
   - **Coordinator / Component LOC Check:** `AppImage.tsx` (135 LOC $\le 250$), `appImageHelpers.ts` (85 LOC $\le 250$).

2. **Unify Filter: Remove Pill Tabs, Promote Stat Cards & Active Card Animation (ADR 15):**
   - **User Intent & Problem Statement:** The User Management page had two UI elements filtering the same underlying user table. The user requested removing the pill bar, wiring the "Total Pengguna" stat card to display all users (reset filter), and making the active card border more beautiful with fluid spring animation on card switch.
   - **ADR & Spec:** `docs/adr/0015-unify-filter-stat-cards-remove-pill-tabs.md` & `docs/auth-user-management/spec-unify-filter-stat-cards.md`.
   - **"Total Pengguna" Filter Integration (`UsersView.tsx`, `UsersHeader.tsx`, `UsersActiveTab.tsx`, `UserActiveRow.tsx`, `src/types/index.ts`):**
     - Added `UserTabFilter = UserStatus | "ALL"` to SSOT types.
     - Wired "Total Pengguna" KPI card with `onClick: () => onTabChange("ALL")` and `active: activeTab === "ALL"`.
     - In `UsersView.tsx`: When `activeTab === "ALL"`, fetches `/api/admin/users?limit=50` (unfiltered by status) returning all registered accounts.
     - Enhanced `UsersActiveTab` and `UserActiveRow` to display all users with status-aware actions: approved accounts have "Nonaktifkan", pending accounts have "Setujui" (launching `ApproveUserModal`), and rejected accounts have "Aktifkan" (instant reactivate).
   - **Animated Active KPI Card Border (`KpiSummaryCards.tsx`):**
     - Integrated Framer Motion spring-animated sliding active indicator (`motion.div layoutId={activeLayoutId}`) across cards.
     - Styled each card with color-matched vibrant 2px border, ambient colored glow (`shadow-[0_0_16px_rgba(...)]`), and subtle surface tint when active.
     - Seamless, fluid glide when switching active cards with spring physics (`stiffness: 450, damping: 35`) and `useReducedMotion()` fallback.
     - Preserved coordinator LOC ($\le 250$): `UsersView` 188 LOC, `UsersHeader` 134 LOC, `UsersActiveTab` 233 LOC, `UserActiveRow` 177 LOC, `KpiSummaryCards` 241 LOC.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 734 passed, 0 failures (129 suites).
     - `npm run build`: ✅ Production Next.js build compiled cleanly (31/31 routes).

2. **Branch Assignment UX Fixes:**
   - **FIX-1 (Accessibility)**: Replaced click-based `<label>` with accessible native `<input type="checkbox" className="sr-only">` and `pointer-events-none` on visual box in `ApproveUserModal.tsx` and `UserBranchSelectModal.tsx`. Ensures full keyboard Tab/Space navigation and screen reader checked state announcements.
   - **FIX-2 (UX Race Condition)**: Isolated `isBranchSaving` state in `UsersActiveTab.tsx`, decoupling modal save state from table-row action `processingId`. Opening a branch modal while a row is deactivating no longer falsely disables the modal save button.
   - **FIX-3 (Resilience / Error Feedback)**: Added `branchesStatus` state (`idle`, `loading`, `ok`, `error`), memoized `fetchBranches`, and an amber error notification banner with an inline "Coba Lagi" retry button in `UsersView.tsx`.
   - Updated unit tests in `src/components/views/UsersView/userBranchAssignment.test.ts` (5 tests passing).
   - Preserved all coordinator and modal file sizes strictly $\le 250$ LOC.
   - Plan: `docs/superpowers/plans/2026-11-02-branch-assignment-ux-fixes.md`.

2. **User Management Branch Assignment & Area Supervisor Scoping (ADR 14):**
   - **User Intent & Problem Statement:** The user observed that previously neither the registration form nor User Management asked or allowed assigning users to specific branches (`assignedBranchIds`). Confirmed that `supervisor` acts as an Area Supervisor (Model A) with multi-branch purview, and managers should assign branches in User Management upon approval or via active user management (Option 1).
   - **ADR 14 & Spec:** Authored ADR 14 (`docs/adr/0014-user-management-branch-assignment.md`), Design Spec (`docs/superpowers/specs/2026-11-02-user-branch-assignment-design.md`), and Plan (`docs/superpowers/plans/2026-11-02-user-branch-assignment.md`).
   - **Pure RBAC & Scoping Helpers (`src/lib/marcom/branchAssignmentHelpers.ts`):**
     - `getAssignableBranches`: Admins can assign all branches; Supervisors can only assign from their own `assignedBranchIds`.
     - `canAssignBranchToUser`: Prevents supervisors from assigning out-of-scope branches.
     - `formatUserBranchBadges`: Displays "Semua Cabang (Nasional)" for Admin, "Belum Ada Cabang" for unassigned, and human-readable branch names for assigned users.
     - 13 comprehensive unit tests passing in `branchAssignmentHelpers.test.ts`.
   - **Backend API Hardening (`src/app/api/admin/users/[id]/route.ts`):**
     - In `PATCH /api/admin/users/[id]`, added validation using `canAssignBranchToUser`.
     - Rejects out-of-scope branch assignments by supervisors with HTTP 403 (`Supervisor hanya dapat menugaskan cabang dalam wilayah binaannya.`).
     - Added API guard test cases in `adminUsersGuards.test.ts` (6 tests passing).
     - Maintained file size at 218 LOC ($\le 250$ LOC).
   - **Approval & Active UI Components:**
     - `ApproveUserModal.tsx` (224 LOC $\le 250$): Modal triggered upon clicking "Setujui" in `UsersPendingTab` allowing explicit selection of role and branch penugasan before activating the account.
     - `UserBranchSelectModal.tsx` (199 LOC $\le 250$): Dialog for updating branch penugasan for active users in `UsersActiveTab`.
     - `UserActiveRow.tsx` (136 LOC $\le 250$): Extracted row subcomponent (Strangler Pattern) displaying user info, role select, branch chips with edit trigger, status, last login, and deactivate button.
     - `UsersActiveTab.tsx` (172 LOC $\le 250$): Added "Cabang" column and integrated `UserBranchSelectModal`.
     - `UsersPendingTab.tsx` (233 LOC $\le 250$): Integrated `ApproveUserModal`.
     - `UsersView.tsx` (155 LOC $\le 250$): Fetches branches from `/api/marcom/branches` on mount and passes them to tabs.
     - 4 unit tests passing in `userBranchAssignment.test.ts`.
   - **Verification Gates:**
     - `npm run drift:check`: Clean, 46 paired specs/plans, all coordinator files $\le 250$ LOC.
     - `npm run test:smoke`: 100 passed, 0 failed.
     - `npm test`: 733 passed, 0 failed (129 suites).
     - `npm run build:check`: 0 errors.
     - `npm run lint`: 0 warnings or errors.
     - `npm run build`: Production Next.js build compiled cleanly (31/31 routes).

2. **Supervisor Guarded User Management Access (ADR 13):**
   - **User Intent & Problem Statement:** The user inquired if the system has a `supervisor` user level and requested that supervisors be granted access to the User Management page (`/?view=users`) and its operational actions like an admin.
   - **Privilege Escalation & Hierarchy Protection:** Adopted guarded access (Option 2):
     - Supervisors are granted access to view all registration tabs (`PENDING`, `APPROVED`, `REJECTED`), approve/reject new registrations, reassign branches, and manage roles (`supervisor`, `staff`, `viewer`).
     - Supervisors are strictly blocked from promoting accounts to `admin` (privilege escalation prevention) and blocked from modifying, deactivating, or deleting `admin` accounts (tampering protection).
   - **ADR 13 & Spec:** Authored ADR 13 (`docs/adr/0013-supervisor-guarded-user-management-access.md`), Design Spec (`docs/superpowers/specs/2026-11-02-supervisor-guarded-user-management-design.md`), and Plan (`docs/superpowers/plans/2026-11-02-supervisor-guarded-user-management.md`).
   - **Pure RBAC Guards (`src/lib/marcom/guards.ts`):**
     - `canAccessUserManagement(role)`: Returns `true` for `"admin"` and `"supervisor"`.
     - `canManageUserTarget(actorRole, targetUserRole)`: Returns `false` if `targetUserRole === "admin"` and `actorRole !== "admin"`.
     - `canAssignUserRole(actorRole, nextRole)`: Returns `false` if `nextRole === "admin"` and `actorRole !== "admin"`.
     - Unit tests in `src/lib/marcom/guards.test.ts` (14 tests passed).
   - **API Endpoint Guarding (`src/app/api/admin/users/`):**
     - Hardened `route.ts` with `canAccessUserManagement(session.user.role)` (HTTP 403 otherwise).
     - Hardened `[id]/route.ts`:
       - `PATCH`: Enforces `canAccessUserManagement`, `canManageUserTarget` (blocks modifying admin accounts with 403), and `canAssignUserRole` (blocks promoting to admin with 403).
       - `DELETE`: Enforces `canAccessUserManagement` and `canManageUserTarget` (blocks deleting admin accounts with 403).
     - Verified with integration tests in `src/app/api/admin/users/adminUsersGuards.test.ts` (5 tests passed).
   - **UI Navigation & View Routing:**
     - `GlobalRail.tsx`: Authorized `users` nav item and `usePendingUsers` via `canAccessUserManagement` (240 LOC $\le 250$).
     - `ActiveViewStage.tsx`: Authorized mounting of `UsersView` via `canAccessUserManagement` (125 LOC $\le 250$).
     - `src/app/admin/users/page.tsx`: Updated redirect check using `canAccessUserManagement`.
   - **UsersView Component Protections:**
     - `UserRoleSelect.tsx`: Excludes `"admin"` option from dropdown when actor is `"supervisor"` and disables control when target is an admin.
     - `UsersActiveTab.tsx`: Disables deactivation button on admin accounts when actor is `"supervisor"`.
     - `UsersRejectedTab.tsx`: Disables reactivation and delete buttons on admin accounts when actor is `"supervisor"`.
     - `UsersView.tsx`: Passes session actor role to active and rejected tabs.
     - Verified with unit tests in `src/components/views/UsersView/userRoleSelect.test.ts` (3 tests passed).

2. **Global Rail Pending Users Notification Badge (ADR 12):**
   - **User Intent & Problem Statement:** Administrators had no ambient indication of new user registrations pending approval ("Menunggu Review") unless they navigated to `/?view=users`. Needed a small red dot badge displaying the exact pending count on the `Users` icon in `GlobalRail`.
   - **ADR 12 & Spec:** Authored ADR 12 (`docs/adr/0012-global-rail-pending-users-badge.md`), Design Spec (`docs/superpowers/specs/2026-11-02-global-rail-pending-users-badge-design.md`), and Plan (`docs/superpowers/plans/2026-11-02-global-rail-pending-users-badge.md`).
   - **Pure Logic Helpers (`src/lib/marcom/pendingUsersHelpers.ts`):**
     - `formatPendingBadgeCount`: Formats count, returns `null` for $\le 0$, caps at `"99+"`, and formats `1..99` as exact string.
     - `fetchPendingUsersCountApi`: Calls `/api/admin/users?status=PENDING&limit=1`, extracts `total`, and fails safe to `0` without throwing on non-200 or network issues.
     - 6 unit tests in `pendingUsersHelpers.test.ts` passing 100%.
   - **Zustand Data Slice Integration (`src/lib/store/slices/types.ts`, `createDataSlice.ts`):**
     - Added `pendingUsersCount: number` (initial 0) and `setPendingUsersCount: (count: number) => void`.
     - In `UsersView.tsx`: Connected `setPendingUsersCount(pData.total || 0)` whenever `fetchUsers` executes so approving/rejecting a user immediately decrements the badge in real time.
   - **Client Polling & Revalidation Hook (`src/lib/marcom/usePendingUsers.ts`):**
     - Only queries when `isAdmin: true` (0 calls for non-admins).
     - Fetches on mount, revalidates on window focus, and polls every 60s.
   - **Global Rail UI Presentation (`src/components/layout/GlobalRail.tsx`):**
     - Rendered small red dot badge (`bg-rose-500 text-white text-[9px] font-bold min-w-3.5 h-3.5 px-0.5 rounded-full ring-2 ring-[#0F1115] shadow-xs`) on top-right of the `Users` icon.
     - `GlobalRail.tsx` LOC: 239 LOC ($\le 250$ LOC coordinator limit). Added 5 tests in `GlobalRail.test.ts`.
   - **Verification Gates:**
     - `npm run drift:check`: Clean, 44 paired specs/plans.
     - `npm run lint`: `✔ No ESLint warnings or errors`.
     - `npm run test:smoke`: 96 passed, 0 failed.
     - `npm test`: 704 passed, 0 failures.
     - `npm run build:check`: 0 errors.
     - `npm run build`: Production Next.js build compiled successfully (31/31 routes).

2. **Production Build & ESLint Strict Invariant Resolution (Vercel Build Failure Fix):**
   - **Root Cause Evaluated:** Vercel deployment failed during `next build` -> `next lint` ("Linting and checking validity of types") due to strict ESLint `@typescript-eslint/no-unused-vars` errors and `react-hooks/exhaustive-deps` warnings across 8 files:
     - `DirectDriveUploadDropzone.tsx`: Unused import `CheckCircle2`.
     - `GoogleDriveUrlForm.tsx`: Unused import `Info`.
     - `ProjectsListTable.tsx`: Unused variable `isGroupFullySelected`.
     - `useProjectsBoard.ts`: Unused type import `MarcomWorkItemType` and unused destructuring `outlets, materials`.
     - `useProjectsList.ts`: Unused destructuring `outlets, materials`.
     - `MousView.tsx`: `handleStatusTransition` missing `useCallback` causing unnecessary re-creation in `columns = useMemo(...)`.
     - `OutletFormModal.tsx`: `suggestionSeed` in `useMemo` dependency array needed explicit referencing in expression `suggestionSeed >= 0 ? generateSuggestedOutletCode(selectedBranch?.code) : ""` to prevent unused/unnecessary dependency warning while satisfying unit test assertions.
     - `MarcomTableShell.tsx`: Pre-computed `searchKeysHash` hash string derived `resolvedKeys` directly in `useMemo` callback, resolving the missing `searchKeys` dependency warning without triggering unnecessary re-indexing on every render.
   - **Verification Gates:**
     - `npm run lint`: `✔ No ESLint warnings or errors` (0 errors, 0 warnings).
     - `npm run drift:check`: Clean, all architectural invariants pass.
     - `npm run test:smoke`: 94 passed, 0 failed.
     - `npm test`: 693 passed, 0 failures.
     - `npm run build:check`: `tsc --noEmit` exited 0 with no type errors.
     - `npm run build`: Production Next.js build compiled successfully, all 31/31 routes static/dynamic generated cleanly.

2. **Centralized Google Drive Storage System via Developer Refresh Token & Direct Resumable Uploads:**
   - **Evaluated Architectural Invariants & Root Cause:**
     - Client-side Google Picker forced every team member to sign in to personal Google accounts and consumed individual storage quotas.
     - Files with default "Restricted" permissions resulted in Google 403 errors on embedded iframes for other team members.
     - Google Cloud Service Accounts on standard `@gmail.com` accounts have 0 GB quota, failing with `403 Forbidden: Storage quota exceeded`.
     - Vercel serverless request ceiling is 4.5 MB, failing large video/footage uploads with HTTP 413.
   - **ADR 11 (`docs/adr/0011-centralized-google-drive-storage-refresh-token.md`):** Adopted Developer OAuth2 Refresh Token architecture with browser-to-Google Resumable Upload sessions (`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`).
   - **Domain SSOT Types (`src/types/index.ts`):** Added `DriveUploadSessionRequest`, `DriveUploadSessionResponse`, `DriveFinalizeRequest`, and `DriveFinalizeResponse`.
   - **One-Time Developer CLI Helper (`scripts/get-drive-refresh-token.ts`, `npm run drive:token`):** Built standalone local tool using Node `http` to generate developer OAuth2 refresh token once with scope `https://www.googleapis.com/auth/drive.file`.
   - **Pure Logic Modules & 100% Test Coverage (TDD):**
     - `driveTokenHelpers.ts` + `driveTokenHelpers.test.ts`: 6 unit tests covering URLSearchParams formatting, Google OAuth response parsing, and token expiration calculations.
     - `driveUploadHelpers.ts` + `driveUploadHelpers.test.ts`: 7 unit tests covering Google resumable upload headers (`X-Upload-Content-Type`, `X-Upload-Content-Length`), Location header extraction, file name sanitization, and canonical `TaskAttachment` formatting.
   - **Server-Side Token Manager (`src/lib/server/driveAuth.ts`):** Lightweight in-memory access token cache with automatic renewal before expiration.
   - **Backend API Routes (`/api/marcom/drive/`):**
     - `upload-session/route.ts`: Validates NextAuth session and initiates a Google Drive resumable session targeting `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`.
     - `finalize/route.ts`: Automates public read permission (`role: "reader", type: "anyone"`) on the uploaded file ID so all team members can preview videos/documents without authentication blocks.
   - **Client Streaming Hook & UI Components:**
     - `useDirectDriveUpload.ts`: Two-step client lifecycle managing chunked browser-to-Google upload via `XMLHttpRequest` with upload progress events and cancellation.
     - `DirectDriveUploadDropzone.tsx`: Drag-and-drop zone with live percentage progress bar, cancel action, and error recovery.
     - `GoogleDriveLinkModal.tsx`: Upgraded modal with segmented tabs for direct cloud upload vs manual link pasting via `GoogleDriveUrlForm.tsx`.
   - **Verification Gates:** `npm run drift:check` (clean, 43 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (94 passed, 0 failed), `npm test` (693 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

1. **Workspace Return Target Resolver & LocalStorage Sanitization (`layoutHierarchyHelpers.ts`, `TopNavBreadcrumbs.tsx`, `useWorkspaceStore.ts`, `createUiSlice.ts`):**
   - **Root Cause Evaluated:** Before Global Views were isolated, visiting `view=profile` saved `"profile"` into `lastTaskView` in client `localStorage` (`vrelloup-workspace-storage`). Consequently, clicking the shortcut button "Kembali ke Workspace" on `users` (or rehydrating from storage) navigated to the Profile page rather than an actual operational workspace view.
   - **Pure Helper `resolveWorkspaceReturnTarget` (`layoutHierarchyHelpers.ts`):** Built fail-safe resolver ensuring return target is strictly an operational workspace view (`board`, `list`, `calendar` or active Marcom view), and rejected any global account views (`profile`, `users`). Added 6 unit tests in `layoutHierarchyHelpers.test.ts` (19 tests total passing).
   - **Strict Whitelist in UI Slice (`createUiSlice.ts`):** Restricted `lastTaskView` mutations strictly to `isWorkItem` (`board`, `list`, `calendar`). Global views (`profile`, `users`) can never pollute `lastTaskView`.
   - **Storage Rehydration Sanitizer (`useWorkspaceStore.ts`):** Added auto-cleanup in `onRehydrateStorage` resetting any persisted `"profile"` or `"users"` values in `lastTaskView` and `lastMarcomView` back to `"board"` and `"events"`.
   - **TopNav Return Integration (`TopNavBreadcrumbs.tsx`):** Connected "Kembali ke Workspace" button to `resolveWorkspaceReturnTarget`, ensuring `appMode` and `activeView` are correctly restored together with instant toast feedback.
   - **Verification Gates:** `npm run drift:check` (clean, 42 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (92 passed, 0 failed), `npm test` (680 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **User Management Global View Layout Isolation (`layoutHierarchyHelpers.ts`, `layoutHierarchyHelpers.test.ts`):**
   - **Root Cause Evaluated:** While ADR 07 unified User Management into the SPA stage, navigating to `users` still rendered the 240px operational `Sidebar` (showing Projects/Marcom menu items). This squeezed table column widths and introduced cognitive clutter for administrators.
   - **ADR 10 & Spec:** Authored ADR 10 (`docs/adr/0010-user-management-global-view-layout-isolation.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-user-management-global-layout-design.md`) extending Global Account View layout isolation to User Management (`users`).
   - **Pure Helper Refactoring (`layoutHierarchyHelpers.ts`):** Updated `shouldRenderSidebar` to evaluate `GLOBAL_ACCOUNT_VIEWS.has(activeView)`, suppressing `Sidebar.tsx` for both `profile` and `users`. Updated unit tests in `layoutHierarchyHelpers.test.ts` (13 passing tests).
   - **Widescreen Table Ergonomics:** `UsersView` expands across the full remaining viewport width, eliminating horizontal scrollbars for user approvals, RBAC role selectors, and assigned branch chips.
   - **Verification Gates:** `npm run drift:check` (clean, 42 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (92 passed, 0 failed), `npm test` (674 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Global View Layout Isolation & Profile Hierarchy (`layoutHierarchyHelpers.ts`, `Sidebar.tsx`, `TopNav.tsx`, `TopNavBreadcrumbs.tsx`, `createUiSlice.ts`):**
   - **Root Cause Evaluated:** Placing `profile` in `appMode: "tasks"` by default caused `TopNavBreadcrumbs` to render `Vrello / Projects / profile`, leaking the task filter bar (`ProjectsFilterBar`) into the profile view and cluttering the stage with the 240px operational `Sidebar`.
   - **ADR 09 & Spec:** Authored ADR 09 (`docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-profile-layout-hierarchy-design.md`) establishing clear bifurcation between Operational Views and Global Account Views.
   - **Pure Helpers Module (`layoutHierarchyHelpers.ts`):** Defined `WORK_ITEM_VIEWS` and `GLOBAL_ACCOUNT_VIEWS`. Implemented `shouldRenderSidebar`, `shouldRenderProjectsFilterBar`, and `getGlobalBreadcrumbInfo`. Added 12 unit tests in `layoutHierarchyHelpers.test.ts` (100% pass).
   - **Sidebar Unmount on Profile (`Sidebar.tsx`):** Conditionally returned `null` when `!shouldRenderSidebar(activeView)`, freeing 240px of screen width for a clean, full-stage profile experience while keeping `GlobalRail` (52px) persistently visible.
   - **TopNav Filter Bar Gating (`TopNav.tsx`):** Restricted `ProjectsFilterBar` strictly to task work items (`board`, `list`, `calendar`) via `shouldRenderProjectsFilterBar`.
   - **Direct Root Breadcrumb (`TopNavBreadcrumbs.tsx`):** Rendered `Vrello / Profil & Keamanan Akun` directly after root brand anchor with `User` icon and added an accessible "Kembali ke Workspace" shortcut button.
   - **UI Slice State Preservation (`createUiSlice.ts`):** Prevented `setActiveView("profile")` from overwriting `lastTaskView` or `lastMarcomView`.
   - **Verification Gates:** `npm run drift:check` (clean, 41 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (92 passed, 0 failed), `npm test` (673 passed, 0 failures), all coordinator files strictly $\le 250$ LOC (`Sidebar`: 187, `TopNavBreadcrumbs`: 175, `TopNav`: 151).

2. **Dedicated User Profile Workspace View (`ProfileView.tsx`, `ProfileHeader.tsx`, `ProfileAvatarUploader.tsx`, `ProfileAccessCard.tsx`, `ProfileSecurityCard.tsx`, `/api/user/profile`, `profileValidators.ts`, `profileHelpers.ts`):**
   - **User Intent & Problem Statement:** Credentials users (email & password) had no self-service mechanism to change their display name, upload/change profile avatar, or update their account password. While Google OAuth users have profiles hydrated from Google, standard accounts had no profile management screen or API.
   - **Architecture & ADR 08:** Authored ADR 08 (`docs/adr/0008-dedicated-user-profile-workspace-view.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-user-profile-view-design.md`) establishing Option 1 (Dedicated Workspace View `activeView: "profile"`).
   - **SSOT Domain Types (`src/types/index.ts`):** Added `"profile"` to `ViewMode` union, and declared `UserProfileResponse` and `UpdateProfilePayload` interfaces.
   - **URL Routing & Navigation (`urlState.ts`, `src/app/profile/page.tsx`, `UserMenuDropdown.tsx`):** Registered `"profile"` in `VALID_VIEW_MODES` and `urlState.ts`. Built Next.js redirection page at `/profile/page.tsx` redirecting to `/?view=profile` (and unauthenticated users to `/login`). Added "Lihat Profil & Akun" action trigger with `UserIcon` to `UserMenuDropdown.tsx` (120 LOC $\le 250$ LOC).
   - **Backend Security & API Route (`profileValidators.ts`, `/api/user/profile/route.ts`):**
     - Implemented `updateProfileSchema` in `profileValidators.ts` (Zod validation for name 2-80 chars, URL/data URI avatar, password length $\ge 8$, and matching confirmation). 8 unit tests in `profileValidators.test.ts` passing.
     - Implemented `GET` and `PATCH` endpoints in `src/app/api/user/profile/route.ts` with NextAuth session scoping.
     - Enforced Google Account protection (blocks password change for Google accounts), verified existing passwords via bcrypt comparison, hashed new passwords (cost factor 12), and mapped nullable avatar to Prisma `String @default("")`.
   - **Pure UI Helpers (`profileHelpers.ts`):** Implemented `formatBranchBadges`, `validatePasswordForm`, and `sanitizeAvatarUrl` with 10 unit tests in `profileHelpers.test.ts` passing.
   - **Atomic Components & Coordinator (`ProfileView/`):**
     - `ProfileHeader.tsx`: 73 LOC. Workspace view header with icon, title, subtitle, and account badge (`Google Verified` vs `Credentials Account`).
     - `ProfileAvatarUploader.tsx`: 196 LOC. `<AppImage />` preview with fallback initials, client-side Canvas compression to WebP ($\le 400\times 400$), URL input, and avatar removal.
     - `ProfileAccessCard.tsx`: 68 LOC. Displays RBAC role badge, registration date, and assigned branch chips. Extracted to protect coordinator size.
     - `ProfileSecurityCard.tsx`: 144 LOC. Google Identity shield card for OAuth users or password change form with show/hide password toggles for Credentials users.
     - `ProfileView.tsx`: 218 LOC ($\le 250$ LOC). Responsive two-column coordinator with Zustand store sync (`syncSessionUser`), data mutation handling, and toast feedback.
     - Mounted dynamically in `ActiveViewStage.tsx` (`case "profile":`).
   - **Verification Gates:** `npm run drift:check` (clean, 40 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (91 passed, 0 failed), `npm test` (661 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Session RBAC & Permissions Synchronization across All 7 Views (`permissions.ts`, `permissionsHelpers.ts`, `auth.ts`, `auth.config.ts`, `next-auth.d.ts`, `TopNav.tsx`, `createDataSlice.ts`):**
   - **Root Cause Evaluated:** All "+ Add / New / Upload" buttons across 7 core pages (Media Placements, Field Events, MOU, Branches, Outlets, Equipment Inventory, Documents) were conditionally gated by `useMarcomPermissions()`. Previously, `useMarcomPermissions()` resolved roles against a static mock array `const members = SEED_USERS` (`user-1` to `user-5`). When a user logged in with a real database account (e.g. `user-admin` or Google OAuth), their ID was not in `SEED_USERS`, causing `resolveMarcomRole` to fail closed to `"viewer"`. As a `"viewer"`, all create and manage permissions were revoked, making Add buttons vanish across the site.
   - **NextAuth Token & Session Claims Hydration:** Added `assignedBranchIds?: string[]` to `Session["user"]`, `User`, and `JWT` in `src/types/next-auth.d.ts`. Updated `resolveJwtClaims` in `src/lib/server/auth-helpers.ts` to propagate branch assignments, updated Credentials `authorize()` and `jwt()` callback in `src/auth.ts`, and updated `session()` callback in `src/auth.config.ts`. Added test cases in `src/lib/server/auth-helpers.test.ts` (19/19 passing).
   - **Pure Helper Module (`permissionsHelpers.ts`):** Implemented `normalizeMarcomRole` with case-insensitive trimming and fail-closed validation, and `resolveEffectivePermissionsUser` prioritizing active `session.user` over fallback store users with automatic branch scope extraction. Created comprehensive unit test suite in `src/lib/marcom/permissionsHelpers.test.ts` (8 passing tests).
   - **Hook Integration (`permissions.ts`):** Connected `useMarcomPermissions()` to `useSession()` from `next-auth/react`. Evaluates permissions dynamically for the authenticated user while providing resilient fallback to Zustand store for SSR, offline, and unit tests.
   - **Zustand Store Parity:** Added `syncSessionUser` action in `createDataSlice.ts` and called it in `TopNav.tsx` to keep Zustand's active user roster synchronized with real NextAuth session users.
   - **Verification Gates:** `npm run drift:check` (clean, 39 paired specs/plans), `npm run build:check` (0 TypeScript errors), `npm run test:smoke` (89 passed, 0 failed), `npm test` (643 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Unified Projects Work Item Creation via Original Marcom Hub Forms:**
   - **Root Cause Evaluated:** Quick creation triggers in Projects views (`useProjectsCalendar.handleCreateType`, `useProjectsBoard.handleQuickCreate`, `useProjectsList.handleQuickAddInGroup`) performed blind, minimal POST mutations with hardcoded dummy titles and invalid states (such as `status: "PLANNED"` on placements, which failed with HTTP 400). Placements bypassed the required 4-step wizard (outlet, material, geofence, photos) and field events bypassed logistics checklists.
   - **Pure Helpers Module (`createModalHelpers.ts`):** Implemented `sanitizeDateInput` with ISO date fallback, `resolveInitialStatus` mapping target board columns to valid entity statuses, and `getInitialPlacementPayload` enforcing state machine invariants (`NOT_STARTED` default). Added comprehensive unit tests in `createModalHelpers.test.ts` (6 passing tests).
   - **Modal Host Component (`ProjectsCreateModalHost.tsx`):** Built coordinator ($\le 250$ LOC, 238 LOC) mirroring `ProjectsDetailDrawerHost.tsx`. Dynamically imports `ContentPostModal`, `EventFormModal`, and `PlacementFormModal` via `next/dynamic` (`ssr: false`), wires Zustand data stores (`branches`, `outlets`, `materials`, `mous`, `placements`, `members`), handles submission and cache invalidation (`fetchPosts`, `fetchEvents`, `fetchPlacements`), and integrates with `GoogleDriveLinkModal`.
   - **Calendar Integration (`ProjectsCalendarView.tsx`, `useProjectsCalendar.ts`):** Connected `CalendarCreatePopover` to trigger `ProjectsCreateModalHost` pre-filled with the selected calendar cell date. Removed legacy dummy creation endpoint calls.
   - **Board Integration & Deconstruction (`ProjectsBoardView.tsx`, `ProjectsBoardColumn.tsx`, `useProjectsBoard.ts`):** Replaced inline title text form in `ProjectsBoardColumn.tsx` with a type picker trigger menu (`Content Post`, `Field Event`, `Media Placement`), saving ~33 LOC and bringing `ProjectsBoardColumn.tsx` safely down to 234 LOC ($\le 250$ LOC). Connected `ProjectsBoardView.tsx` with column status mapping and mounted `ProjectsCreateModalHost`.
   - **List View Integration (`ProjectsListView.tsx`, `ProjectsListHeader.tsx`, `ProjectsListTable.tsx`, `useProjectsList.ts`):** Added "+ New Item" trigger with type selector menu in `ProjectsListHeader.tsx` and group row actions in `ProjectsListTable.tsx`. Mounted `ProjectsCreateModalHost` in `ProjectsListView.tsx` and removed defunct `handleQuickAddInGroup`.
   - **Verification Gates:** `npm run drift:check` (clean, 0 drift), `npm run build:check` (0 errors), `npm run test:smoke` (88 passed, 0 failed), `npm test` (635 passed, 0 failures), all coordinator files strictly $\le 250$ LOC (`ProjectsCreateModalHost`: 238, `ProjectsBoardColumn`: 234, `ProjectsBoardView`: 199, `ProjectsCalendarView`: 154, `ProjectsListView`: 118).

2. **Core Web Vitals Next.js Image Optimization (`AppImage.tsx`, `appImageHelpers.ts`, `next.config.ts`, 16 components):**
   - **Root Cause Evaluated:** 22 raw `<img>` instances across 16 components lacked layout sizing, leading to Cumulative Layout Shift (CLS) on high-latency field connections, excessive bandwidth consumption without modern WebP/AVIF compression or responsive srcset downscaling, and Next.js compiler warnings under `@next/next/no-img-element`.
   - **Remote Host Whitelist (`next.config.ts`):** Configured `images.remotePatterns` for `images.unsplash.com`, `lh3.googleusercontent.com`, `*.googleusercontent.com`, and `*.supabase.co`.
   - **Pure Layout Helpers (`appImageHelpers.ts`):** Created `shouldBypassOptimization` for `blob:`, `data:`, SVG, and empty URLs to prevent runtime crashes during client-side photo picking. Added `resolveImageSizes` mapping presets (`avatar`: 36px, `thumbnail`: 64px/96px, `card`: 100vw/50vw/33vw, `lightbox`: 100vw/1200px, `full`: 100vw). Comprehensive unit test suite in `appImageHelpers.test.ts` (8 tests passing).
   - **Resilient Primitive (`AppImage.tsx`):** Built `<AppImage />` with automatic aspect ratio geometry (eliminating CLS), `sizes` optimization, automatic unoptimized bypass for blob/data URLs, and graceful placeholder error recovery.
   - **Full Codebase Migration (22 instances across 16 components):** Migrated `TopNav.tsx`, `UserMenuDropdown.tsx`, `UsersActiveTab.tsx`, `UsersPendingTab.tsx`, `UsersRejectedTab.tsx`, `OutletApprovalQueueTab.tsx` (2x), `Outlet360Drawer.tsx` (2x), `SubmitDraftOutletModal.tsx`, `PlacementPhotoUploader.tsx` (2x), `PlacementPhotoGallery.tsx` (3x), `EventTableView.tsx`, `EventCardsView.tsx`, `MouDocumentViewerModal.tsx`, `DocumentPreviewModal.tsx`, `ContentDrawer.tsx`, `ContentPlannerView.tsx` (2x), `ProjectsWorkItemCard.tsx`.
   - Gates: `npm run lint` (0 `@next/next/no-img-element` warnings), `npm run build:check` (0 errors), `npm run test:smoke` (87 passed, 0 failed), `npm test` (629 passed, 0 failures), `npm run build` (all 27/27 pages compiled), `npm run drift:check` (clean).

2. **TopNav Avatar & Profile Session Synchronization (`TopNav.tsx`, `UserMenuDropdown.tsx`, `userProfileHelpers.ts`, `userProfileHelpers.test.ts`):**
   - **Root Cause Evaluated:** TopNav avatar button derived initials exclusively from Zustand store `me = users.find(u => u.id === currentUserId) ?? users[0]`, which defaulted to `"user-1"` (`Alex Rivera` -> `"AR"`), completely ignoring authenticated NextAuth session data (`session.user`). TopNav trigger button also lacked profile image (`<img>`) rendering support, and `currentUserId` in Zustand was not synchronized with `session.user.id`.
   - **Pure Helper Module (`userProfileHelpers.ts`):** Implemented `getInitials(name, email)` with robust edge-case handling (multi-word, single-word, extra whitespace, email initial fallback, safe defaults) and `getEffectiveProfile({ sessionUser, fallbackUser })` prioritizing `sessionUser` properties (`name`, `email`, `image`, `role`, `initials`, `isAuthenticated`). Created comprehensive unit test suite in `userProfileHelpers.test.ts` (9 tests passing).
   - **TopNav Integration (`TopNav.tsx`):** Consumed `getEffectiveProfile`, rendered `profile.image` with `imageError` fallback to `profile.initials`, rendered active emerald presence dot when `isAuthenticated: true`, and added `useEffect` synchronizing `session.user.id` to `useWorkspaceStore.currentUserId`.
   - **UserMenuDropdown Parity (`UserMenuDropdown.tsx`):** Unified profile card resolution using `getEffectiveProfile({ sessionUser: session?.user })` with `imageError` fallback, ensuring 100% visual and data parity with TopNav trigger button.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (86 passed), `npm test` (621 passed, 0 failures), coordinator LOC strictly $\le 250$ (`TopNav.tsx`: 135 LOC, `UserMenuDropdown.tsx`: 99 LOC).

2. **Default Light Theme on First Visit (`src/app/layout.tsx`):**
   - **Evaluated Prior Behavior:** `<ThemeProvider>` in `src/app/layout.tsx` had `defaultTheme="dark"` and `enableSystem={true}`. In `next-themes`, when `defaultTheme="dark"`, any initial visit where `localStorage.getItem("theme")` was null defaulted to `"dark"`, bypassing the client device OS `prefers-color-scheme` and always forcing dark mode.
   - **Configured Deterministic Light Theme Default:** Changed `defaultTheme="light"` and set `enableSystem={false}`. First-time visitors and devices with no stored theme preference open in light theme.
   - **Preserved User Overrides:** User manual theme toggle actions (`ThemeToggle`, `SettingsModal`, `MoreAppsMenu`, `CommandPalette`) continue persisting to `localStorage` under key `"theme"` seamlessly.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

1. **Vercel-Supabase Authentication & Production Database Connectivity Fix (`src/lib/db.ts`, `src/auth.ts`, `src/components/auth/LoginForm.tsx`):**
   - **Root Cause Evaluated:** Integration between Supabase and Vercel automatically exposes `POSTGRES_PRISMA_URL` and `POSTGRES_URL`, but does not populate `DATABASE_URL` or `DIRECT_URL`. Previously, `src/lib/db.ts` only read `process.env.DATABASE_URL`, causing `new PrismaClient()` in Vercel serverless environment to fail on query execution (`Environment variable not found: DATABASE_URL`). Auth.js caught this unhandled database error and redirected to `?error=Configuration`. In turn, `LoginForm.tsx` caught this error and defaulted to showing `"Email atau password tidak sesuai."`, misdiagnosing a database connectivity failure as invalid credentials.
   - **Resilient Fallback Support:** Updated `src/lib/db.ts` to automatically read `process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL`, and synchronize `process.env.DATABASE_URL` and `process.env.DIRECT_URL` (from `POSTGRES_URL_NON_POOLING`) for Prisma engine internals.
   - **Detailed Logging in `src/auth.ts`:** Wrapped `prisma.user.findUnique` in `authorize()` with explicit error logging so future connection failures are visible in Vercel runtime logs. Made `lastLoginAt` updates resilient so write contention never aborts an approved sign-in.
   - **Accurate User Feedback in `LoginForm.tsx`:** Updated error handling to distinguish between server configuration/database connection failure (`error === "Configuration"`) and invalid credentials (`error === "CredentialsSignin"`).
   - Gates: `npm run build:check` (0 errors), `npm run lint` (0 errors), `npm run build` (27/27 static/dynamic pages compiled), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures). Local live Supabase authentication verified via curl (`HTTP/1.1 302 Found`, session-token issued).

1. **CustomDropdown Sitewide Z-Index, Stacking Context & Responsive Placement Fix (`CustomDropdown.tsx`, `customDropdownHelpers.ts`, Sitewide Headers & Toolbars):**
   - **Root Cause Evaluated:** Header containers with `backdrop-filter: blur(...)` (`backdrop-blur-sm`) create a CSS stacking context. When headers lacked explicit `relative z-20`, their stacking context fell below subsequent stage content containing positioned elements (`sticky top-0 z-20` on `MarcomTableShell` headers and `relative` row cells), causing the table headers and table rows to paint directly ON TOP of opened dropdown menus (as seen in the user's screenshot).
   - **CustomDropdown Root & Popover Stacking Elevation:** Updated `CustomDropdown.tsx` so the root wrapper div dynamically elevates to `z-30` (`isOpen ? "z-30" : "z-auto"`) when opened, preventing sibling controls in the same row from overlapping. Popover menu styled with solid `bg-white dark:bg-slate-900` (eliminating transparency bleed) and deep `shadow-2xl`.
   - **Responsive Viewport Collision Detection:** Added `computeDropdownPlacement` helper in `customDropdownHelpers.ts` with comprehensive unit test suite in `CustomDropdown.test.ts` (12 tests passed). Automatically detects viewport boundaries to flip direction upwards (`bottom-full mb-1 origin-bottom`) when space below < 240px and right-aligns (`right-0 left-auto`) when space to right < 220px. Added explicit `direction="up"` support for bottom-anchored bars (`PlacementBulkActionBar`, `ProjectsBulkActionBar`, and `MarcomTableShell` pagination).
   - **Sitewide Stacking Context Normalization:** Added `relative z-20` across all 11 unified view headers and filter bars sitewide (`MousHeader`, `OutletsHeader`, `BranchesHeader`, `AnalyticsHeader`, `InventoryHeaderKpis`, `ReportsHeader`, `DocumentsHeader`, `PlacementsHeader`, `EventsHeader`, `ContentPlannerHeader`, `UsersHeader`, `PipelineView` header, `PipelineFilterBar`, `ProjectsFilterBar`, `QuarterlyRecapTab`, `QuarterlyPosmReportTab`, `OutletApprovalQueueTab`, `OutletMapView`, and `EventsTimelineView`).
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **Supabase Cloud PostgreSQL Migration, Schema Synchronization & Seeding (`prisma/schema.prisma`, `.env.local`, `.env`):**
   - **Project Integration:** Connected project `kkstcawepmqenghaqxzt` in region `aws-0-ap-southeast-1`.
   - **Dual-URL Invariant:** Configured `directUrl = env("DIRECT_URL")` in `prisma/schema.prisma` datasource. Set `DATABASE_URL` to transaction pooler (`aws-0-ap-southeast-1.pooler.supabase.com:6543?pgbouncer=true`) and `DIRECT_URL` to direct connection (`aws-0-ap-southeast-1.pooler.supabase.com:5432`).
   - **URI Encoding Handling:** URL-encoded leading `@` in database password (`%40...`) to prevent connection URI host delimiter corruption.
   - **Environment Variables Sync:** Added `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
   - **Schema & Data Migration:** Successfully executed `npx prisma db push` synchronizing all 14 models and relations, followed by `npx tsx prisma/seed.ts` populating standard master data (7 users, 12 branches, 10 outlets, 7 materials, 6 MOUs, 6 placements, 13 inventory items, 4 events, 4 content posts, 4 documents).
   - Gates: Direct Node query verified (`status: 'CONNECTED_SUCCESSFULLY'`), `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

3. **Production Build & ESLint Strict Cleanup (`next lint` & `next build`):**
   - **Issue Triaged:** Vercel / local `npm run build` failed during Next.js compile step due to strict TypeScript ESLint rules (`@typescript-eslint/no-unused-vars` and `@typescript-eslint/no-explicit-any`).
   - **Unused Imports & Variables Removed:** Cleaned up orphaned imports and variables across 28 components/routes resulting from previous atomic header extractions and dropdown standardizations (`ContentPlannerView`, `EventsView`, `DocumentsView`, `OutletsView`, `ReportsView`, `ProjectsFilterBar`, `BorrowDetailModal`, `DropLineIndicator`, etc.).
   - **Explicit Types & Elimination of `any`:** Replaced all `any` usages in inventory borrow endpoints and `auth-helpers.test.ts` with strict typed interfaces (`RawBorrowRecord`, `Parameters<HandleGoogleSignInParams[...]>[0]`).
   - Gates: `npm run lint` (0 errors), `npm run build` (compiled and generated all 27 static/dynamic pages with 0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

4. **Next.js Security Patch Upgrade (`15.2.0` -> `15.2.9` for CVE-2025-66478):**
   - **Issue Triaged:** Vercel security gate blocked deployment post-build with `Build Failed: Vulnerable version of Next.js detected, please update immediately (CVE-2025-66478)`.
   - **Patch Upgrade:** Upgraded `next` and `eslint-config-next` to `15.2.9` (the official patched security release in the 15.2.x series, zero breaking changes).
   - **Callback Narrowing Fix:** Fixed closure variable narrowing in `auth-helpers.test.ts` via object capture pattern (`captured.data`).
   - Gates: `npm run build:check` (0 errors), `npm run lint` (0 errors), `npm run build` (27/27 pages compiled), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **MOU Table Rows UI Redesign & Entity Consolidation (`mouColumns.tsx`, `MarcomTableShell.tsx`, `placementColumns.tsx`):**
   - Consolidated standalone `Partner` (190px) and `Outlet` (170px) columns into a single unified `Partner & Outlet` column (220px), saving ~170px of horizontal table width.
   - Formatted two-line entity cell with primary partner title (filtering table on click) and secondary outlet link with store icon (jumping to Outlets view on click).
   - Replaced redundant stacked `"No period set"` and `"No expiry"` badges in Validity column with a clean, subtle `—` when no dates are configured.
   - Replaced harsh fuchsia styling on MOU document buttons with neutral glassmorphic backdrop-blur chips (`bg-slate-100/80 dark:bg-slate-800/60`, border `border-slate-200/80 dark:border-slate-700/60`), subtle Drive/file icons (`FileText`, `ExternalLink`), and clean preview modal triggers.
   - Formatted `Type` column replacing raw database enum underscores with clean spaces.
   - Implemented right-aligned (`text-right font-medium tabular-nums`) financial currency formatting for `Value` column in `mouColumns.tsx` and normalized header right-alignment in `MarcomTableShell.tsx` via `meta: { align: "right" }`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **User Management Unified Header Component (`UsersHeader.tsx`, `UsersView.tsx`, `usersFilterHelpers.ts`):**
   - Extracted `src/components/views/UsersView/UsersHeader.tsx` (198 LOC), standardizing User Management view with `MousHeader`, `OutletsHeader`, and `DocumentsHeader`.
   - Title Row: Icon (`Users` indigo-500), Title ("Manajemen Pengguna"), Counter badge (`totalUsers` Pengguna), Alert badge (`counts.pending` Perlu Review), Subtitle, and Refresh button (`RefreshCw`).
   - Controls & Navigation Row: Segmented tab buttons with Framer Motion fluid sliding pill animation (`layoutId="activeUsersTabPill"`, spring dynamics `stiffness: 450, damping: 35`, `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`) and real-time quick search input with clear button.
   - KPI Row: Embedded 4 `KpiSummaryCards` (Total Pengguna, Menunggu Review, Pengguna Aktif, Akun Ditolak/Nonaktif) with direct interactive click navigation to tabs.
   - Created pure filtering helper `filterUsers` in `usersFilterHelpers.ts` with unit test suite in `usersFilterHelpers.test.ts` (5 passed).
   - Refactored coordinator `UsersView.tsx` from 187 down to 123 LOC and applied full-bleed stage layout `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (608 passed, 0 failures).

2. **MOUs & Partnerships Unified Header Component (`MousHeader.tsx`, `MousView.tsx`):**
   - Extracted `src/components/views/MousView/MousHeader.tsx` (186 LOC), standardizing MOUs view with `OutletsHeader`, `DocumentsHeader`, and `PlacementsHeader`.
   - Title Row: Icon (`FileText`), Title ("MOUs & Partnerships"), Counter badge (`totalMous`), Subtitle, Refresh button (`RefreshCw`), Export button (`Download` -> `ExportCenter`), and "+ New MOU" button (`Plus`, conditional on `canCreate`).
   - Controls & Filter Row: Quick Search input with clear button, Status Chips with Framer Motion sliding pill animation (`layoutId="activeMouStatusPill"`, spring dynamics `stiffness: 450, damping: 35`, `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`), searchable Branch and MOU Type `CustomDropdown` selectors, Urgency chips (`Expiring Soon`, `Expired`), and dynamic Reset Filters link.
   - KPI Row: `KpiSummaryCards` embedded directly within `MousHeader` beneath the controls row for zero layout shifting.
   - Refactored `MousView.tsx` (reduced from 417 to 348 LOC) consuming `MousHeader` and configuring `MarcomTableShell` with `noPadding` and `hideHeader`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (603 passed, 0 failures).

2. **Workspace Shell Integration for User Management (ADR 07):**
   - Added `"users"` to SSOT `ViewMode` union in `src/types/index.ts` and `VALID_VIEWS` in `src/lib/router/urlState.ts`.
   - Updated `src/components/views/ActiveViewStage.tsx` with dynamic lazy import of `<UsersView />` guarded by `isAdmin`.
   - Updated `UsersView.tsx` with self-hydrating session defaults and removed redundant page back-link.
   - Updated `GlobalRail.tsx` to set `activeView: "users"` and display active state (`isActive: activeView === "users"`) with 0ms transition.
   - Replaced `/admin/users/page.tsx` with a clean 307 server redirect to `/?view=users`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (603 passed, 0 failures).

2. **Supervisor Role & Scoped Area Permissions (`guards.ts` & full stack):**
   - Added `"supervisor"` to `UserRole` SSOT in `src/types/index.ts` and `assignedBranchIds?: string[]` to `AppUser`.
   - Added `SUPERVISOR` to `DbUserRole` enum and `assignedBranchIds String[] @default([])` to `model User` in `prisma/schema.prisma` (`prisma db push` + `prisma generate` synchronized).
   - Updated `normalizeRole` in `src/lib/server/auth-helpers.ts` and `roleToDbRole` in `/api/admin/users/[id]` with `assignedBranchIds` persistence.
   - Updated `src/lib/marcom/guards.ts` allowing Supervisor full operational authority (approving MoUs, Outlets, Equipment Borrows, deleting MoUs/documents) strictly bounded by assigned branch boundaries (`assignedBranchIds`), while strictly preventing access to `MANAGE_MASTER_DATA` and user administration.
   - Updated `UserRoleSelect.tsx` with Supervisor option and `UserMenuDropdown.tsx` with dedicated amber role badge.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (602 passed, 0 failures).

1. **Sitewide Active Pills Animation Upgrade (`framer-motion`):**
   - Implemented spring-animated sliding background pills using `motion.div layoutId="..."` across 10 components sitewide.
   - Configured high-performance physics: `type: "spring" as const, stiffness: 450, damping: 35` with tactile micro-interactions (`whileTap={{ scale: 0.95 }}`).
   - Added full accessibility support via `useReducedMotion()` gracefully disabling animations if the user prefers reduced motion.
   - Preserved text clarity and contrast with `relative z-10` on labels and icons.
   - Verified 10 targeted locations:
     1. `DocumentsHeader.tsx`: Cards / Table view switcher (`activeDocumentsViewPill`) & Category filter chips (`activeDocumentsCategoryPill`)
     2. `OutletsHeader.tsx`: Table / Map / Approval view switcher (`activeOutletsViewPill`)
     3. `ReportsHeader.tsx`: Monthly / Quarterly tab switcher (`activeReportsTabPill`)
     4. `InventoryHeaderKpis.tsx`: Catalog / Borrowing tab switcher (`activeInventoryTabPill`), Catalog view switcher (`activeInventoryCatalogViewPill`), Borrow view switcher (`activeInventoryBorrowViewPill`)
     5. `AnalyticsHeader.tsx`: Brand filter toggle pills: ALL / IM3 / TRI (`activeAnalyticsBrandPill`)
     6. `BranchesHeader.tsx`: Status filter chips: All / Active / Inactive (`activeBranchesStatusPill`)
     7. `ProjectsListHeader.tsx`: Group by selector pills: Status / Priority / Branch / None (`activeProjectsGroupByPill`)
     8. `HelpDocsModal.tsx`: Shortcuts / Guides modal tab switcher (`activeHelpDocsTabPill`)
     9. `SettingsModal.tsx`: Backup & Data / Appearance modal tab switcher (`activeSettingsTabPill`)
     10. `OutletSearchCombobox.tsx`: Brand override pills: IM3 / TRI (`activeComboboxBrandPill`)
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (599 passed, 0 failures).

1. **Database Schema & Migrations (`prisma/schema.prisma` & migration SQL):**
   - Added enums `EquipmentStatus` (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `RETIRED`), `BorrowStatus` (`PENDING`, `APPROVED`, `ACTIVE`, `RETURNED`, `CANCELLED`, `OVERDUE`), and `EquipmentCondition` (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`, `DAMAGED`, `LOST`).
   - Added models `InventoryItem` (master equipment catalog with unique code, category, units, storage location), `BorrowRecord` (transaction with sequential code `BRW-YYYYMMDD-NNN`, purpose, dates, status, approver), and `BorrowItem` (junction items with condition tracking).
   - Added `borrowRecords BorrowRecord[]` relation on `FieldEvent`.
   - Cleaned defunct legacy columns via `db push --accept-data-loss` (single-tenant invariant compliance) and recorded official migration `prisma/migrations/20261030192500_add_inventory_system/migration.sql`.
   - Seeded 13 items across Audio/Visual, Staging/Booth, Merchandising/Display, and Electrical/Cables categories.

2. **Domain Model & SSOT Types (`src/types/index.ts`):**
   - Added `"inventory"` to `ViewMode` union.
   - Added canonical interfaces: `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`, `InventoryItem`, `BorrowItem`, `BorrowRecord`.

3. **API Route Handlers (`src/app/api/marcom/inventory/`):**
   - `route.ts`: GET catalog with search/category/status filters; POST new catalog item with unique code.
   - `[id]/route.ts`: GET item details; PUT updates with available/total unit sanity check; DELETE blocking if active borrows exist.
   - `[id]/availability/route.ts`: GET real-time availability snapshot with active borrow records.
   - `borrow/route.ts`: GET borrow records with status/event filters; POST new borrow request with auto-generated `BRW-YYYYMMDD-NNN` code in PENDING status.
   - `borrow/[id]/route.ts`: GET single borrow record; PUT updates status and atomically decrements `availableUnits` when transitioning to `ACTIVE`.
   - `borrow/[id]/return/route.ts`: POST processes return, updates condition after return, logs damages/notes, and atomically restores `availableUnits` for non-LOST equipment.

4. **State Management & SWR Store (`src/lib/marcom/marcomDataStore.ts` & tests):**
   - Extended `useMarcomDataStore` with `inventoryItems`, `borrowRecords`, `fetchInventory()`, `fetchBorrowRecords()`, and optimistic mutations.
   - Updated store test suite in `marcomDataStore.test.ts` (18 passed).

5. **Navigation & Coordinator Views (`navConfig.ts`, `ActiveViewStage.tsx`, `src/components/views/InventoryView/`):**
   - Added `"Equipment Inventory"` item under Marcom Master Data navigation section.
   - Dynamically loaded `InventoryView` in `ActiveViewStage.tsx`.
   - Built full modular UI component tree under `src/components/views/InventoryView/`:
     - `inventoryConstants.ts`: categories, badge styles, icons.
     - `InventoryHeaderKpis.tsx`: 4 KPI summary cards, tab switchers, search and filter controls.
     - `InventoryItemsGrid.tsx`: visual item card grid with unit availability indicators.
     - `InventoryTableView.tsx`: detailed sortable table view.
     - `BorrowRecordsTable.tsx`: filterable table of borrow transactions.
     - `BorrowTrackingBoard.tsx`: 4-column kanban board for active workflows.
     - `InventoryItemFormModal.tsx`: add/edit modal with validation.
     - `BorrowRequestModal.tsx`: multi-step request modal with item selection.
     - `BorrowDetailModal.tsx`: detailed transaction inspector with status actions.
     - `ReturnProcessModal.tsx`: return inspection and condition check-in dialog.
     - `InventoryViewModals.tsx`: modal coordinator isolating dialog logic.
     - `InventoryView.tsx`: coordinator component strictly $\le 250$ LOC (223 LOC).

6. **Event Integration (`EventBorrowedEquipmentSection.tsx`, `EventFormModal.tsx`):**
   - Added collapsible borrowed equipment section and request shortcut in `EventFormModal.tsx`.

7. **Permissions & Security (`guards.ts`, `guards.test.ts`):**
   - Added permissions: `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REQUEST_BORROW`, `APPROVE_BORROW`, `PROCESS_RETURN`.

8. **Automated Test Suites:**
   - `src/lib/marcom/inventoryLogic.test.ts`: pure domain logic tests for availability, code generation, and condition status.
   - `src/app/api/marcom/inventory/inventoryApi.test.ts`: API route tests.

9. **Sidebar Mode Switcher Restoration (`AppModeSegmentedControl.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`):**
   - Restored original Projects logo icon (`Kanban` from `lucide-react`) replacing `FolderKanban`.
   - Restored label text to `"Marcom Hub"` in mode switcher pills and `GlobalRail`.
   - Restored Framer Motion animated sliding pill (`motion.div layoutId="activeAppModeIndicator"` with spring physics and reduced-motion support).
   - Extracted `AppModeSegmentedControl.tsx` (104 LOC), bringing `Sidebar.tsx` coordinator down to 182 LOC.

10. **Bugfix: Equipment Inventory Mode Toggle Auto-Reversion (`createUiSlice.ts`, `urlState.ts`, `topNavConstants.ts`):**
   - Added `"inventory"` to `MARCOM_VIEW_SET` in `createUiSlice.ts` so `setActiveView("inventory")` resolves `appMode = "marcom"`.
   - Added `"inventory"` to `VALID_VIEW_MODES` and `MARCOM_VIEWS` in `urlState.ts`, plus `"equipment"` / `"equipments"` normalization aliases.
   - Added `"inventory"` to `MARCOM_VIEW_LABELS` in `topNavConstants.ts`.
   - Added Equipment Inventory view and quick action to `CommandPalette.tsx`.
   - Added automated tests in `marcomViews.test.ts` and `urlState.test.ts`.

11. **Bugfix: Stale Prisma Client Runtime on Development Server (500 error on fetchBorrowRecords):**
   - Root cause: Dev server process started before `BorrowRecord` / `BorrowItem` schema migration, retaining stale Prisma client in Node process memory where `prisma.borrowRecord` was `undefined`.
   - Terminated stale process, restarted clean Next.js server on port 3000, verified authenticated requests return HTTP 200 (`/api/marcom/inventory/borrow` and `/api/marcom/inventory`).

12. **Feature: Event Card Equipment Logistics Indicator Chip — IMPLEMENTED & VERIFIED:**
   - Created Spec: `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`
   - Created Plan: `docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md`
   - Created ADR: `docs/adr/0006-event-card-equipment-indicator.md` (ADR-06)
   - Created pure helper `getEventEquipmentSummary` in `src/lib/marcom/eventEquipmentHelpers.ts`.
   - Added unit test suite in `src/lib/marcom/eventEquipmentHelpers.test.ts` (4 passed).
   - Integrated reactive indicator chip into `EventCardsView.tsx` with teal active state, rose overdue state, and modal open trigger.
   - Added pre-fetch of `fetchBorrowRecords()` to `EventsView.tsx`.

13. **Feature: Open Detail Drawer on Row Click in Projects List View — IMPLEMENTED & VERIFIED:**
   - Attached `onClick={() => onSelect?.(item)}` to `<tr>` in `src/components/views/ProjectsView/ProjectsListRow.tsx` with `cursor-pointer` styling.
   - Isolated click event propagation (`e.stopPropagation()`) across all interactive cell controls (checkbox selection toggle, inline title edit input and double-click trigger, status dropdown button and options, due date editor and date button, PIC assignee editor and button, action button).
   - Preserved seamless row click behavior across non-control cell areas (type badge, branch, checklist, and empty cell padding) to open the domain drawer/modal (`ProjectsDetailDrawerHost`).

14. **Bugfix: HTML Redirect Response on Pipeline View (`SyntaxError: Unexpected token '<'`):**
   - Root cause: NextAuth edge middleware callback in `src/auth.config.ts` was returning `false` for unauthenticated requests on `/api/...` endpoints instead of a 401 JSON Response. NextAuth edge middleware automatically generated an HTTP 307 Temporary Redirect to the `/login` HTML page. The browser's client-side `fetch('/api/marcom/pipeline')` followed the redirect and received the HTML login page with HTTP 200 OK, causing `await res.json()` to fail with `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
   - Updated `src/auth.config.ts` `authorized` callback to inspect `request?.nextUrl?.pathname` and return an HTTP 401 JSON Response for unauthenticated/unapproved `/api/` requests, preserving page redirects only for non-API routes.
   - Updated `PipelineView.tsx` with defensive status handling (clean redirect to `/login` if 401 or redirected) and validated `content-type: application/json` before calling `.json()`.
   - Wrapped `src/app/api/marcom/pipeline/route.ts` GET handler in `try / catch` returning structured HTTP 500 JSON on database exceptions.
   - Added automated unit tests in `src/auth.config.test.ts` (8 passed).

15. **Comprehensive QA Edge-Case Database Seeder (`prisma/seed.ts`) — IMPLEMENTED & VERIFIED:**
   - Spec: `docs/superpowers/specs/2026-10-31-qa-comprehensive-seeder-design.md`
   - Plan: `docs/superpowers/plans/2026-10-31-qa-comprehensive-seeder.md`
   - Implemented clean atomic reset protocol (`cleanDatabase`) deleting all tables in reverse FK topological order, guaranteeing idempotent re-runs in < 1 second.
   - Implemented realistic Indonesian corporate domain data across all entities without artificial `[QA]` label strings.
   - Covered edge cases: SLA critical expired MoU (45d ago), SLA warning near-expiry MoU (8d), pending legal approval aging (>60d), flagship multi-year agreement (Rp 150M), rejected MoU with finance reasons, GPS geolocation anomaly (>1.4km deviation, `isLocationValid: false`), installation blocked with `ISSUE` renovation status, permanent material without MoU warning, extreme dimensions installation (`1200 x 400 cm`), cold/orphan outlet with 0 operational records, inactive outlet, overdue borrow with event link, damaged returns (`MAJOR_DAMAGE` and `LOST` equipment condition check-in), content posts in review/revision/published states, document files up to 88.5MB, and executive Q3 report with rich JSON.
   - Standardized branch indexing (`branch-1`..`branch-12`) and preserved catalog item counts ($\ge 13$) to satisfy all downstream integration test suites.

16. **Active Pills Animation on Content Planner Page (`ContentPlannerView.tsx`):**
    - Implemented fluid animated sliding pill for the View Modes Switcher (Cards vs Table) and Platform Filter Pills.
    - Integrated Framer Motion `motion.div` with shared `layoutId` (`activeContentPlannerViewPill` and `activeContentPlannerPlatformPill`), natural spring physics (`stiffness: 450, damping: 35`), and `useReducedMotion()` accessibility support.
    - Added tactile tap gestures (`whileTap={{ scale: 0.95 }}`) and semantic accessibility attributes (`role="tablist"`, `role="tab"`, `aria-selected`).

17. **Placements Persistent Header & Static View Switcher (`PlacementsView.tsx`, `PlacementsHeader.tsx`, `PlacementFilterControls.tsx`):**
    - Spec: `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md`
    - Upgraded `PlacementViewSwitcher` with Framer Motion `motion.div layoutId="activePlacementViewPill"`, spring physics (`stiffness: 450, damping: 35`), `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`.
    - Extracted atomic subcomponent `PlacementsHeader.tsx` (84 LOC) styled with Option B Card-Banner Container (`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs p-4 sm:p-5`), containing title, record badge, view switcher pills, refresh button, export trigger, and `+ Add Placement` action.
    - Added container padding (`p-4 sm:p-6 space-y-4 h-full overflow-y-auto`) to `PlacementsView.tsx` and aligned `MarcomTableShell` with `noPadding` and `hideRefreshButton`.
    - Positioned `KpiSummaryCards` conditionally (`viewMode !== "map"`), hiding the KPI cards on Map View to maximize the Leaflet interactive map viewport and prevent unwanted vertical scrollbars.
    - Streamlined `PlacementsMapTab.tsx` and `PlacementsRecapTab.tsx` by removing redundant duplicate headers.
    - Kept coordinator `PlacementsView.tsx` strictly under the 250 LOC limit (214 LOC).

18. **Field Events Card-Banner Header Architecture (`EventsView.tsx`, `EventsHeader.tsx`):**
    - Spec: `docs/superpowers/specs/2026-10-31-events-card-header-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-events-card-header.md`
    - Created atomic subcomponent `EventsHeader.tsx` (129 LOC) styled with the Card-Banner container (`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5`), matching the design system of Media Placements.
    - Integrated title, flag icon badge, event counter badge (`{totalEvents} events`), subtitle, animated view switcher (`layoutId="activeFieldEventsViewPill"`), refresh action, and role-guarded `+ New Field Event` action (`can("CREATE_EVENT")`).
    - Reduced `EventsView.tsx` from 531 to 447 LOC by decomposing the coordinator header.

19. **Content Planner Container Margin & Padding Alignment (`ContentPlannerView.tsx`):**
    - Removed restrictive `max-w-7xl mx-auto` that caused excessive lateral empty space on widescreen viewports.
    - Aligned outer container styling with `PlacementsView.tsx`: `p-4 sm:p-6 space-y-4 h-full overflow-y-auto`.
    - Removed redundant `pt-2` on Controls Bar for uniform 16px (`space-y-4`) vertical rhythm.

20. **Outlets Header & Navigation Labels Alignment (`OutletsView.tsx`, `navConfig.ts`):**
    - Renamed header title in `OutletsView.tsx` from `"Store Command Center"` to `"Outlets Directory"`.
    - Renamed sidebar navigation item in `navConfig.ts` under Master Data from `"Outlets Directory"` to `"Outlets"`.

21. **Media Placements Inventory-Style Unified Header (`PlacementsHeader.tsx`, `PlacementsView.tsx`):**
    - Restyled header zone with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `MapPin` icon (`text-emerald-500`), count badge, and updated actions bar.
    - Integrated `KpiSummaryCards` directly within the header (conditionally hidden on map view to maximize interactive map canvas viewport).
    - Positioned `PlacementViewSwitcher` at the bottom controls row before the bottom border.
    - Updated `PlacementsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 flex-1 min-h-0`.
    - Maintained coordinator `PlacementsView.tsx` strictly under the 250 LOC limit (213 LOC).

22. **Content Planner Inventory-Style Unified Header (`ContentPlannerHeader.tsx`, `ContentPlannerView.tsx`):**
    - Extracted atomic subcomponent `ContentPlannerHeader.tsx` (247 LOC) with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `Sparkles` icon (`text-pink-500`), count badge, subtitle, and top-right Refresh & Schedule Post buttons.
    - Integrated `KpiSummaryCards` directly within the header zone.
    - Standardized bottom controls row with Platform filter pills (`motion.div layoutId="activeContentPlannerPlatformPill"`), Search input, and Cards/Table view switcher (`layoutId="activeContentPlannerViewPill"`).
    - Updated `ContentPlannerView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 flex-1 min-h-0`.
    - Reduced `ContentPlannerView.tsx` by ~185 LOC by decoupling header and filter logic.

23. **Field Events Inventory-Style Unified Header (`EventsHeader.tsx`, `EventsView.tsx`):**
    - Upgraded `EventsHeader.tsx` with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `CalendarDays` icon (`text-blue-500`), event count badge, and top-right Refresh & New Field Event buttons.
    - Integrated `KpiSummaryCards` directly inside the header zone under Title row.
    - Positioned view switcher (Cards | Table | Calendar | Timeline with `activeFieldEventsViewPill`) at the bottom controls row before the bottom border.
    - Updated `EventsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 space-y-4 flex-1 min-h-0`.

24. **Pipeline Inventory-Style Unified Header (`PipelineView.tsx`):**
    - Upgraded header zone with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `Layers` icon (`text-indigo-500`), Cockpit 360° badge, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
    - Integrated `KpiSummaryCards` directly within the header zone.
    - Updated outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped content area in `p-4 sm:p-6 space-y-4 flex-1 min-h-0`.

25. **Analytics & ROI Hub Inventory-Style Unified Header (`AnalyticsHeader.tsx`, `AnalyticsActionableStrip.tsx`, `AnalyticsView.tsx`, `AnalyticsSkeleton.tsx`):**
    - Created `AnalyticsHeader.tsx` (~200 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `BarChart3` icon (`text-indigo-500`), `Live Metrics` badge, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
      - Embedded 4 KPI Cards (SLA Persetujuan MOU, POSM Deployment Rate, Efisiensi Event Lapangan, Reliabilitas Konten Sosmed) with drill-down routes to respective Marcom views and zero-CLS skeleton placeholders when loading.
      - Integrated bottom filter toolbar with Branch selector, Quarter selector, Brand toggle pills, and Reset button.
    - Extracted `AnalyticsActionableStrip.tsx` to surface unit economics and editorial turnaround in the stage content area.
    - Updated `AnalyticsSkeleton.tsx` to mirror stage content geometry (Actionable Telemetry strip + 2×2 Chart Grid).
    - Updated `AnalyticsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-6`.
    - Removed dead obsolete components `AnalyticsKpiRow.tsx` and `AnalyticsFilterBar.tsx`.

26. **Reports & Exports Hub Inventory-Style Unified Header (`ReportsHeader.tsx`, `ReportsView.tsx`):**
    - Created `ReportsHeader.tsx` following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `BarChart3` icon (`text-orange-500`), `Executive Archive` badge, subtitle, and top-right action buttons (Refresh, Export Center, and 1-Click Executive PDF).
      - Embedded 4 KPI Cards (Total Laporan, Total Aktivitas, Avg Completion, Laporan Terkini) with `KpiSummaryCards items={kpiCards}` within the header zone.
      - Bottom controls row with Tab switcher (Laporan Bulanan & Rekap POSM Kuartalan) and New Monthly Report button.
    - Updated `ReportsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

27. **Documents & Asset Library Hub Inventory-Style Unified Header (`DocumentsHeader.tsx`, `DocumentsView.tsx`):**
    - Created `DocumentsHeader.tsx` (~209 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Files` icon (`text-teal-500`), document count badge (`{count} dokumen`), concise subtitle, and top-right action buttons (Refresh and `+ Tambah Dokumen`).
      - Embedded 4 KPI Cards (Total Dokumen, Kapasitas Terpakai, Dokumen Aktif, Kategori Terbanyak) with `KpiSummaryCards items={kpiCards}` within the header zone.
      - Bottom controls row with Category filter chips (Semua Dokumen + individual categories with count badges), search input with clear button, and view mode switcher (Cards | Table).
    - Updated `DocumentsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` (removed restrictive `max-w-7xl mx-auto`), replaced inline headers with `<DocumentsHeader ... />`, and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

28. **Outlets Directory Inventory-Style Unified Header (`OutletsHeader.tsx`, `OutletsView.tsx`):**
    - Created `OutletsHeader.tsx` (~190 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Store` icon (`text-orange-500`), outlet count badge (`{totalOutlets} outlet`), concise subtitle, and top-right action buttons (Refresh and `+ Add Outlet` / `Ajukan Toko Baru`).
      - Embedded 5 KPI Cards (Total Outlets, Active Branches, Brand Portfolio, MoU Partnerships, Placements Installed) with `KpiSummaryCards items={kpiItems}` within the header zone.
      - Bottom controls row with View mode switcher tabs (Tabel Data, Peta Sebaran, Antrean Approval with pending count badge), Branch dropdown selector, Store Type dropdown selector, search input with clear button, and Reset Filters button.
    - Updated `OutletsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`, replaced inline header, floating KPI cards, and inline filterBar with `<OutletsHeader ... />`, and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

29. **Branches & Regional Hubs Inventory-Style Unified Header (`BranchesHeader.tsx`, `BranchesView.tsx`):**
    - Created `BranchesHeader.tsx` (~185 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Building2` icon (`text-cyan-600 dark:text-cyan-400`), branch count badge (`{totalBranches} branch`), concise subtitle, and top-right action buttons (Refresh and `+ Tambah Branch`).
      - Embedded 4 KPI Cards (Total Branches, Outlets Network, Active Partnerships, Avg Program Progress) with `KpiSummaryCards items={kpiItems}` within the header zone.
      - Bottom controls row with Status filter pills (Semua Status, Done, In Progress, Pending with count badges), Region dropdown selector, search input with clear button, and Reset Filters button.
    - Updated `BranchesView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`, replaced inline header, floating KPI cards, and inline filterBar with `<BranchesHeader ... />`, and wrapped table shell in responsive stage container `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

30. **CustomDropdown Component & Sitewide Dropdown Standardization (`CustomDropdown.tsx`, Multiple Views):**
    - Spec: `docs/superpowers/specs/2026-10-31-custom-dropdown-standardization-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-custom-dropdown-standardization.md`
    - Built reusable, accessible, dark-mode-ready, and searchable `CustomDropdown` component (`src/components/ui/CustomDropdown.tsx`) and pure helpers (`src/components/ui/customDropdownHelpers.ts`).
    - Features:
      - Auto-activated search input when options count $\ge 6$ (or explicit `searchable={true}`) with real-time filtering and clear button.
      - Click-outside and Escape key dismissal powered by existing `useDropdown` hook with trigger focus restoration.
      - Keyboard navigation (ArrowDown, ArrowUp, Enter, Space) and ARIA attributes (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`).
      - Active item indicator checkmark (`Check` icon), optional option badges and leading icons.
      - Glassmorphic backdrop blur styling matching both light and dark modes.
    - Replaced native unstyled `<select>` elements across:
      - `BranchesHeader.tsx` (Region dropdown — resolves user screenshot)
      - `OutletsHeader.tsx` (Branch & Store Type dropdowns)
      - `AnalyticsHeader.tsx` (Branch & Quarter dropdowns with icons)
      - `PipelineFilterBar.tsx` (Branch dropdown)
      - `InventoryHeaderKpis.tsx` (Category dropdown)
      - `MousView.tsx` (Branch & Type dropdowns)
      - `QuarterlyRecapTab.tsx` (Quarter & Branch dropdowns)
      - `EventsTimelineView.tsx` (Days range dropdown)
      - `QuarterlyPosmReportTab.tsx` (Quarter dropdown)
      - `OutletApprovalQueueTab.tsx` (Branch dropdown)
      - `OutletMapView.tsx` (Brand, Store Type, Branch, and MoU Status dropdowns)
      - `MarcomTableShell.tsx` (Sitewide table pagination pageSize dropdown)
      - `ProjectsFilterBar.tsx` (Branch & PIC dropdowns)
      - `ProjectsBulkActionBar.tsx` (Bulk status dropdown)
      - `PlacementBulkActionBar.tsx` (Bulk status dropdown)
      - `UserRoleSelect.tsx` (User role select)
    - Created unit tests in `src/components/ui/CustomDropdown.test.ts` (8 tests passing).

31. **Header Layout Swap: Stabilize Pills Row Above KPI Cards Row (`BranchesHeader`, `ReportsHeader`, `OutletsHeader`, `DocumentsHeader`, `InventoryHeaderKpis`, `PlacementsHeader`, `EventsHeader`, `AnalyticsHeader`):**
    - Spec: `docs/superpowers/specs/2026-10-31-header-pills-cards-swap-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-header-pills-cards-swap.md`
    - Inverted vertical order of Controls/Pills row and dynamic KPI Summary Cards row across all 8 Marcom headers:
      - Row 1: Title, domain badges, primary action buttons (Add / Create / Export).
      - Row 2: Controls & Navigation row (View switcher pills, tab pills, status filter chips, CustomDropdowns, and search inputs).
      - Row 3: KPI Summary Cards row (`KpiSummaryCards items={kpiItems}`).
    - Completely eliminated layout jumping (Cumulative Layout Shift) when switching tabs or views where cards are conditionally hidden (e.g. Map View in Placements, Rekap POSM tab in Reports, or during metric recalculations).
    - Established deterministic $Y$-coordinate for all primary user interaction pills directly beneath the title bar.

---

## Verification Gates (this session)

- `npm run drift:check` → ✅ No drift detected (all invariants pass, coordinator LOC OK, SSOT OK)
- `npm run build:check` → ✅ 0 TypeScript errors
- `npm run lint` → ✅ 0 warnings or errors
- `npm test` → ✅ 734 passed, 0 failed (129 suites)
- `npm run test:smoke` → ✅ 100 passed, 0 failed
- `npm run build` → ✅ 31/31 pages compiled cleanly

---

## Blocked / Risks

- None.

---

## Next Step for Following Session

1. Run verification commands (`npm run drift:check`, `npm run build:check`, `npm test`) on session start.
2. Push committed branch to remote (`git push origin vicky`).
3. Continue standardizing any remaining views if requested by user.
