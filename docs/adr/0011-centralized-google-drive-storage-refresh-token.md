# ADR 11: Centralized Google Drive Storage via Developer Refresh Token and Direct Resumable Uploads

**Date:** 2026-11-02  
**Status:** Accepted  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Related Specs:** `docs/superpowers/specs/2026-11-02-centralized-drive-upload-design.md`  
**Related Plans:** `docs/superpowers/plans/2026-11-02-centralized-drive-upload.md`  
**Refs:** ADR 08 (`docs/adr/0008-dedicated-user-profile-workspace-view.md`), Spec `docs/superpowers/specs/2026-09-15-google-drive-picker-integration-design.md`

---

## Context

The current marketing and document operations across Vrello (Content Planner, Field Events, MOUs, Equipment Inventory, and Documents Center) require uploading heavy assets, such as high-definition B-roll footage, event video recap clips, and scanned multi-page PDF agreements.

Previously, this was handled via the client-side Google Picker API (`useGoogleDrivePicker.ts`). While functional for personal picking, it presents major operational and architectural friction:
1. **Per-User Authentication Friction:** Every team member is prompted with a Google OAuth consent popup to authorize access to their personal Google account.
2. **Fragmented Ownership & Storage Quota:** Files uploaded through the picker are owned by individual uploader accounts (e.g. `nnusa0001@gmail.com`). Storage quota is consumed on individual personal accounts rather than a central organization repository.
3. **Cross-Tenant Access Denial (403 on Embeds):** When User A uploads footage marked "Restricted" in their private Google Drive, User B sees Google's *"You need access"* error screen inside in-app preview iframes (`/file/d/{id}/preview`).
4. **Google Cloud Service Account Storage Limitation:** Google Cloud Service Accounts assigned to standard non-Workspace accounts (`@gmail.com`) have **0 GB default Drive storage**. Attempting to upload files via a Service Account into a personal Gmail folder fails with `403 Forbidden: The user's Drive storage quota has been exceeded`.
5. **Serverless Payload Limit (4.5 MB on Vercel):** Routing large video files through standard Next.js serverless API routes (`/api/marcom/uploads`) causes serverless executions to terminate with HTTP 413 (*Request Entity Too Large*).

---

## Decisions

### 1. Developer-Authorized Refresh Token Pattern
Instead of Google Service Accounts or individual per-user OAuth prompts, the application uses a **Server-Side Developer OAuth2 Refresh Token**:
- The developer account (`vickygp5571@gmail.com`) authorizes Google Drive API access once using a local utility script (`scripts/get-drive-refresh-token.ts`).
- The resulting `GOOGLE_DRIVE_REFRESH_TOKEN` is stored exclusively in `.env.local` (and production server environment variables). It is never prefixed with `NEXT_PUBLIC_` and is never exposed to client browsers.
- When an authenticated Vrello user uploads a file, the Next.js server exchanges this refresh token for short-lived Google Drive access tokens on behalf of the developer account. All uploaded files are stored in, and owned by, `vickygp5571@gmail.com`.

### 2. Direct Browser-to-Google Resumable Upload Sessions
To bypass Vercel's 4.5 MB request ceiling and support multi-gigabyte video footage:
- The client requests an upload session via `POST /api/marcom/drive/upload-session` providing `{ name, mimeType, sizeBytes }`.
- The server validates the request and calls the Google Drive API (`POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`) with `parents: [NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID]`.
- Google Drive returns a unique Resumable Upload Session URI (`Location` header).
- The server returns `{ uploadUrl, fileId }` to the client.
- The client browser streams the raw binary payload directly to Google's CDN with zero serverless proxy overhead, zero egress charges, and full real-time chunk upload progress.

### 3. Automated Public Read Permissions
Upon successful completion of the upload:
- The backend or finalization handler (`POST /api/marcom/drive/finalize`) assigns `{ role: "reader", type: "anyone" }` permission to the created file ID via Google Drive API.
- This ensures any authenticated Vrello team member can view the embedded video or PDF preview seamlessly inside `DocumentPreviewModal`, `EventFootageModal`, and `ContentPlannerView` without permission errors.

### 4. Preservation of Fallback Link Parser
The smart URL parser (`googleDriveUtils.ts`) and fallback modal (`GoogleDriveLinkModal.tsx`) remain active for manually pasted Google Drive links.

---

## Consequences

### Positive
- **Zero User Google Logins:** End users on Vrello never encounter Google OAuth popups or permission screens.
- **Centralized Ownership:** All files land in the designated Google Drive folder under `vickygp5571@gmail.com`, utilizing the developer's centralized storage quota.
- **Infinite Payload Support:** Direct browser-to-Google streaming completely bypasses Vercel's 4.5 MB serverless limit, enabling uploads of 4K B-roll footage and large media archives.
- **Reliable Previews:** Automated public read permissions eliminate the Google 403 "You need access" iframe blocks.

### Negative / Trade-offs
- Requires a one-time token generation step by the developer via `scripts/get-drive-refresh-token.ts`.
- If the developer's personal Google account password is changed or Google revoke the refresh token, the token must be re-issued.

