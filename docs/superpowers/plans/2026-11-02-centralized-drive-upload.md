# Centralized Google Drive Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a centralized Google Drive storage system using a developer-authorized OAuth2 refresh token and direct browser-to-Google resumable uploads, allowing Vrello team members to upload multi-gigabyte files directly to the developer's Google Drive folder without seeing Google sign-in popups and without violating Vercel's 4.5 MB serverless limit.

**Architecture:** 
1. CLI token helper (`scripts/get-drive-refresh-token.ts`) to obtain `GOOGLE_DRIVE_REFRESH_TOKEN` once.
2. Pure helpers (`driveTokenHelpers.ts`, `driveUploadHelpers.ts`) for token exchange, resumable session negotiation, and attachment formatting.
3. Next.js API endpoints (`/api/marcom/drive/upload-session` and `/api/marcom/drive/finalize`) to initiate resumable sessions and grant public read access.
4. Client hook / uploader (`useDirectDriveUpload.ts`) handling chunked browser-to-Google streaming with progress tracking.
5. Integration into modals and dropzones.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Node.js `node:test`, Google Drive API v3.

**Spec:** `docs/superpowers/specs/2026-11-02-centralized-drive-upload-design.md`  
**ADR:** `docs/adr/0011-centralized-google-drive-storage-refresh-token.md`

---

## File Manifest

| Phase | Target File | Purpose | LOC Delta (est.) |
|---|---|---|---|
| Phase 1 | `scripts/get-drive-refresh-token.ts` | One-time developer CLI script to acquire `GOOGLE_DRIVE_REFRESH_TOKEN` | ~110 LOC |
| Phase 1 | `src/types/index.ts` | Add session and finalize types to SSOT | +25 LOC |
| Phase 2 | `src/lib/marcom/driveTokenHelpers.ts` | Pure helpers for token exchange body and response parsing | ~70 LOC |
| Phase 2 | `src/lib/marcom/driveTokenHelpers.test.ts` | Unit tests for token helpers | ~60 LOC |
| Phase 2 | `src/lib/marcom/driveUploadHelpers.ts` | Pure helpers for resumable headers and attachment building | ~80 LOC |
| Phase 2 | `src/lib/marcom/driveUploadHelpers.test.ts` | Unit tests for upload helpers | ~70 LOC |
| Phase 3 | `src/app/api/marcom/drive/upload-session/route.ts` | API route to create Google Drive resumable upload session | ~110 LOC |
| Phase 3 | `src/app/api/marcom/drive/finalize/route.ts` | API route to set file public read permission | ~90 LOC |
| Phase 4 | `src/lib/marcom/useDirectDriveUpload.ts` | Client React hook for direct browser-to-Google streaming | ~160 LOC |
| Phase 4 | `src/components/ui/DirectDriveUploadDropzone.tsx` | UI dropzone with progress bar and retry state | ~150 LOC |
| Phase 5 | Integration & Verification | Update creation modal host, run full test gates and drift checks | ~40 LOC |

---

## Sequencing Rules

- **Phase 1** establishes the CLI tool and domain SSOT types.
- **Phase 2** builds and tests pure logic helpers first (TDD).
- **Phase 3** implements backend serverless API routes with NextAuth and RBAC protection.
- **Phase 4** creates the client-side streaming hook and UI components (strictly $\le 250$ LOC).
- **Phase 5** runs full verification gates (`drift:check`, `build:check`, `test:smoke`, full `npm test`).

---

### Phase 1: One-Time Refresh Token Tool & SSOT Types

- [ ] **Task 1.1: Add SSOT Domain Types in `src/types/index.ts`**
  - Define `DriveUploadSessionRequest`, `DriveUploadSessionResponse`, `DriveFinalizeRequest`, and `DriveFinalizeResponse`.
  - Ensure canonical types remain strictly in SSOT.

- [ ] **Task 1.2: Build CLI Refresh Token Utility (`scripts/get-drive-refresh-token.ts`)**
  - Standalone script with zero external dependencies (uses native Node `http` and `crypto`).
  - Spawns local callback server on `http://localhost:3333/callback`.
  - Directs browser to Google OAuth consent for scope `https://www.googleapis.com/auth/drive.file`.
  - Captures `refresh_token` and outputs clean `.env.local` snippet.
  - Add npm script in `package.json`: `"drive:token": "tsx scripts/get-drive-refresh-token.ts"`.

---

### Phase 2: Pure Domain Logic & Unit Tests (TDD)

- [ ] **Task 2.1: Write Failing Unit Tests for Token Helpers (`src/lib/marcom/driveTokenHelpers.test.ts`)**
  - Test `buildTokenRequestBody` formats URLSearchParams correctly.
  - Test `parseTokenResponse` handles valid tokens and extracts `access_token`.
  - Test error handling when response contains Google OAuth error payloads.
  - Run: `node --test src/lib/marcom/driveTokenHelpers.test.ts` (expect failure).

- [ ] **Task 2.2: Implement `src/lib/marcom/driveTokenHelpers.ts`**
  - Implement pure functions satisfying all tests.
  - Run: `node --test src/lib/marcom/driveTokenHelpers.test.ts` (expect pass).

- [ ] **Task 2.3: Write Failing Unit Tests for Upload Helpers (`src/lib/marcom/driveUploadHelpers.test.ts`)**
  - Test `buildResumableSessionHeaders` generates exact Google Drive headers (`X-Upload-Content-Type`, `X-Upload-Content-Length`).
  - Test `extractUploadUrl` pulls Location header safely.
  - Test `sanitizeUploadFileName` removes illegal characters and trims whitespace.
  - Test `buildDriveAttachment` generates compliant `TaskAttachment` with `source: "gdrive"` and `/preview` embed.
  - Run: `node --test src/lib/marcom/driveUploadHelpers.test.ts` (expect failure).

- [ ] **Task 2.4: Implement `src/lib/marcom/driveUploadHelpers.ts`**
  - Implement pure functions satisfying all tests.
  - Run: `node --test src/lib/marcom/driveUploadHelpers.test.ts` (expect pass).

---

### Phase 3: Backend API Endpoints

- [ ] **Task 3.1: Implement `/api/marcom/drive/upload-session` Route**
  - File: `src/app/api/marcom/drive/upload-session/route.ts`
  - Guard with NextAuth session (`auth()`) and upload permissions.
  - Call Google Drive API to initiate resumable upload session.
  - Return `{ uploadUrl, fileId, name }`. Ensure file is $\le 250$ LOC.

- [ ] **Task 3.2: Implement `/api/marcom/drive/finalize` Route**
  - File: `src/app/api/marcom/drive/finalize/route.ts`
  - Set public read permissions (`role: "reader", type: "anyone"`) on the newly uploaded file ID via Google Drive API.
  - Return formatted `TaskAttachment`. Ensure file is $\le 250$ LOC.

---

### Phase 4: Client Hook & UI Component

- [ ] **Task 4.1: Implement `useDirectDriveUpload.ts` Hook**
  - File: `src/lib/marcom/useDirectDriveUpload.ts`
  - Handles two-step upload lifecycle:
    1. Requests upload session from backend.
    2. Streams file directly to Google using `XMLHttpRequest` with upload progress events.
    3. Calls finalize endpoint upon completion.
  - Exposes state: `{ isUploading, progress, error, uploadFile, reset }`.

- [ ] **Task 4.2: Implement `DirectDriveUploadDropzone.tsx` Component**
  - File: `src/components/ui/DirectDriveUploadDropzone.tsx`
  - Clean UI dropzone with drag-over state, file picker trigger, and progress bar with cancel capability.
  - Coordinator LOC strictly $\le 250$ LOC.

---

### Phase 5: Verification & Documentation

- [ ] **Task 5.1: Run Full Verification Suite**
  - Run: `npm run drift:check` (verify 0 drift, all specs/plans paired).
  - Run: `npm run build:check` (verify 0 TypeScript errors).
  - Run: `npm run test:smoke` (verify smoke test suite passes).
  - Run: `npm test` (verify full test suite passes with 0 failures).

- [ ] **Task 5.2: Update Documentation & Session State**
  - Update `docs/superpowers/specs/README.md` and `docs/superpowers/plans/README.md`.
  - Update `CHANGELOG.md` with ADR 11 and spec references.
  - Update `docs/SESSION_STATE.md`.

