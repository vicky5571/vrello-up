# Google Drive & Picker Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable zero-server-cost video footage and asset management by integrating Google Drive & Google Picker with Shared Drive support, drag-and-drop direct uploads, smart link fallback, and in-app HD video playback.

**Architecture:** A modular hybrid architecture where pure utility functions parse and extract Google Drive file/folder metadata, a lightweight lazy-loading hook (`useGoogleDrivePicker`) handles Google Identity Services & Picker SDK with a clean fallback modal (`GoogleDriveLinkModal`) when environment variables are omitted, and an in-app responsive embed player (`GoogleDrivePreviewModal`) allows streaming video directly inside Task Drawer and Content Planner.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Google Picker API, Google Identity Services (GSI).

**Spec:** [`docs/superpowers/specs/2026-09-15-google-drive-picker-integration-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-15-google-drive-picker-integration-design.md)

## Global Constraints

- Never upload heavy footage files to the Next.js server (`/api/marcom/uploads`). All Google Drive assets must store only metadata (`driveFileId`, `url`, `thumbnailUrl`, `name`, `sizeBytes`).
- The application must work seamlessly even if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_API_KEY` are empty strings via the smart link fallback modal.
- Script injection (`gapi` and `gsi`) must be lazy-loaded on demand (never blocking initial page render).
- All new pure utility functions must have automated unit tests run via Node's native test runner (`node --test`).
- Full test suite (`npm test`) must pass with 0 regressions.

---

### Task 1: Domain Types & Pure Utilities for Google Drive Parsing

**Files:**
- Modify: `src/types/index.ts:39-47`
- Create: `src/lib/marcom/googleDriveUtils.ts`
- Test: `src/lib/marcom/googleDriveUtils.test.ts`

**Interfaces:**
- Consumes: `TaskAttachment` in `src/types/index.ts`
- Produces:
  ```typescript
  export interface GoogleDriveParsedUrl {
    isValid: boolean;
    id: string | null;
    kind: "file" | "folder" | null;
    embedUrl: string | null;
    viewUrl: string;
  }
  export function parseGoogleDriveUrl(rawUrl: string): GoogleDriveParsedUrl;
  export function getGoogleDriveMimeCategory(mimeType: string, filename?: string): "video" | "image" | "document" | "other";
  ```

- [ ] **Step 1: Write the failing unit test**

```typescript
// src/lib/marcom/googleDriveUtils.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGoogleDriveUrl, getGoogleDriveMimeCategory } from "./googleDriveUtils";

test("parseGoogleDriveUrl parses standard file URLs", () => {
  const url = "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing";
  const result = parseGoogleDriveUrl(url);
  assert.equal(result.isValid, true);
  assert.equal(result.id, "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
  assert.equal(result.kind, "file");
  assert.equal(result.embedUrl, "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview");
});

test("parseGoogleDriveUrl parses open?id= file URLs", () => {
  const url = "https://drive.google.com/open?id=abc123XYZ_456";
  const result = parseGoogleDriveUrl(url);
  assert.equal(result.isValid, true);
  assert.equal(result.id, "abc123XYZ_456");
  assert.equal(result.kind, "file");
});

test("parseGoogleDriveUrl parses folder URLs", () => {
  const url = "https://drive.google.com/drive/folders/1F9_FolderId_Example?usp=drive_link";
  const result = parseGoogleDriveUrl(url);
  assert.equal(result.isValid, true);
  assert.equal(result.id, "1F9_FolderId_Example");
  assert.equal(result.kind, "folder");
  assert.equal(result.embedUrl, null);
});

test("parseGoogleDriveUrl rejects invalid non-drive URLs", () => {
  const result = parseGoogleDriveUrl("https://example.com/video.mp4");
  assert.equal(result.isValid, false);
  assert.equal(result.id, null);
});

test("getGoogleDriveMimeCategory maps mime types accurately", () => {
  assert.equal(getGoogleDriveMimeCategory("video/mp4"), "video");
  assert.equal(getGoogleDriveMimeCategory("video/quicktime", "clip.mov"), "video");
  assert.equal(getGoogleDriveMimeCategory("image/jpeg"), "image");
  assert.equal(getGoogleDriveMimeCategory("application/pdf"), "document");
  assert.equal(getGoogleDriveMimeCategory("application/vnd.google-apps.folder"), "other");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marcom/googleDriveUtils.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Update `src/types/index.ts` and write minimal implementation in `src/lib/marcom/googleDriveUtils.ts`**

In `src/types/index.ts`:
```typescript
export interface TaskAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  type: "video" | "image" | "document" | "other";
  url: string;
  uploadedAt: string;
  source?: "local" | "gdrive";
  driveFileId?: string;
  thumbnailUrl?: string;
  isSharedFolder?: boolean;
}
```

In `src/lib/marcom/googleDriveUtils.ts`:
```typescript
export interface GoogleDriveParsedUrl {
  isValid: boolean;
  id: string | null;
  kind: "file" | "folder" | null;
  embedUrl: string | null;
  viewUrl: string;
}

const FILE_REGEXES = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/,
  /\/uc\?id=([a-zA-Z0-9_-]+)/,
];

const FOLDER_REGEXES = [
  /\/drive(?:\/u\/\d+)?\/folders\/([a-zA-Z0-9_-]+)/,
];

export function parseGoogleDriveUrl(rawUrl: string): GoogleDriveParsedUrl {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed.includes("drive.google.com")) {
    return { isValid: false, id: null, kind: null, embedUrl: null, viewUrl: trimmed };
  }

  for (const regex of FOLDER_REGEXES) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return {
        isValid: true,
        id: match[1],
        kind: "folder",
        embedUrl: null,
        viewUrl: trimmed,
      };
    }
  }

  for (const regex of FILE_REGEXES) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      const fileId = match[1];
      return {
        isValid: true,
        id: fileId,
        kind: "file",
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        viewUrl: trimmed,
      };
    }
  }

  return { isValid: false, id: null, kind: null, embedUrl: null, viewUrl: trimmed };
}

export function getGoogleDriveMimeCategory(
  mimeType: string,
  filename?: string
): "video" | "image" | "document" | "other" {
  const mime = (mimeType || "").toLowerCase();
  const name = (filename || "").toLowerCase();

  if (mime.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".mov") || name.endsWith(".mkv")) {
    return "video";
  }
  if (mime.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) {
    return "image";
  }
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("spreadsheet") || name.endsWith(".pdf")) {
    return "document";
  }
  return "other";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/marcom/googleDriveUtils.test.ts`
Expected: PASS (5 passed, 0 failed).

- [ ] **Step 5: Commit Task 1**

```bash
git add src/types/index.ts src/lib/marcom/googleDriveUtils.ts src/lib/marcom/googleDriveUtils.test.ts
git commit -m "feat(marcom): add Google Drive types and URL parser utilities"
```

---

### Task 2: Google Drive Fallback Modal & Hook

**Files:**
- Create: `src/components/ui/GoogleDriveLinkModal.tsx`
- Create: `src/lib/marcom/useGoogleDrivePicker.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `parseGoogleDriveUrl`, `getGoogleDriveMimeCategory`, `TaskAttachment`
- Produces:
  ```typescript
  export function useGoogleDrivePicker(): {
    isConfigured: boolean;
    openSelector: (options: {
      onSelect: (attachments: TaskAttachment[]) => void;
      defaultKind?: "all" | "video";
    }) => void;
    isModalOpen: boolean;
    closeModal: () => void;
    handleManualAttach: (url: string, customTitle?: string) => void;
  };
  ```

- [ ] **Step 1: Create `src/components/ui/GoogleDriveLinkModal.tsx`**

A modal that allows entering any Google Drive URL, validates it live via `parseGoogleDriveUrl`, displays kind badge (Video, Folder, File), allows custom title, and shows helpful setup notes.

- [ ] **Step 2: Create `src/lib/marcom/useGoogleDrivePicker.ts`**

Read `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_API_KEY`, and `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`.
If configured, lazy-load Google scripts (`https://apis.google.com/js/api.js` and `https://accounts.google.com/gsi/client`), request token with `https://www.googleapis.com/auth/drive.file`, and launch `google.picker.PickerBuilder` with `SUPPORT_DRIVES` and `DocsUploadView`.
If not configured, open `GoogleDriveLinkModal`.

- [ ] **Step 3: Update `.env.example` with Google Drive environment variables**

```bash
# Google Drive & Picker Integration (Optional, enables native Drive pop-up)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
NEXT_PUBLIC_GOOGLE_API_KEY=""
NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID=""
```

- [ ] **Step 4: Verify type safety**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/ui/GoogleDriveLinkModal.tsx src/lib/marcom/useGoogleDrivePicker.ts .env.example
git commit -m "feat(ui): add GoogleDriveLinkModal and useGoogleDrivePicker hook"
```

---

### Task 3: In-App Embedded Video & Preview Player Modal

**Files:**
- Create: `src/components/ui/GoogleDrivePreviewModal.tsx`

**Interfaces:**
- Consumes: `TaskAttachment`
- Produces:
  ```typescript
  export function GoogleDrivePreviewModal({
    attachment,
    onClose,
  }: {
    attachment: TaskAttachment | null;
    onClose: () => void;
  }): JSX.Element | null;
  ```

- [ ] **Step 1: Create `src/components/ui/GoogleDrivePreviewModal.tsx`**

A dark backdrop dialog containing:
- Header with attachment title, Google Drive badge, "Buka di Google Drive" button (`window.open(attachment.url, "_blank")`), and close button (X).
- Body with a 16:9 responsive aspect ratio container rendering an `<iframe>` with `src={attachment.embedUrl || "https://drive.google.com/file/d/" + attachment.driveFileId + "/preview"}` and attributes `allow="autoplay; fullscreen"`.
- If `isSharedFolder` is true, renders an informative folder card with a direct link to open the folder in Google Drive.

- [ ] **Step 2: Verify type safety**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 3**

```bash
git add src/components/ui/GoogleDrivePreviewModal.tsx
git commit -m "feat(ui): add GoogleDrivePreviewModal for in-app HD footage playback"
```

---

### Task 4: Task Drawer Integration

**Files:**
- Modify: `src/components/tasks/TaskDrawer.tsx`

**Interfaces:**
- Consumes: `useGoogleDrivePicker`, `GoogleDrivePreviewModal`, `GoogleDriveLinkModal`
- Updates: `task.attachments` state with new Google Drive items, integrates Play action to open `GoogleDrivePreviewModal`.

- [ ] **Step 1: Add Google Drive trigger button in `TaskDrawer.tsx`**

Beside the local dropzone header, add a styled button:
```tsx
<button
  type="button"
  onClick={() =>
    openSelector({
      onSelect: (newAtts) => {
        const updated = [...(task.attachments || []), ...newAtts];
        const updates: Partial<Task> = { attachments: updated };
        if (!task.mediaUrl && newAtts[0]?.url) {
          updates.mediaUrl = newAtts[0].url;
        }
        updateTask(task.id, updates);
        toast.success(`Berhasil menambahkan ${newAtts.length} aset Google Drive`);
      },
    })
  }
  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 cursor-pointer transition-colors"
>
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">...</svg>
  <span>Google Drive</span>
</button>
```

- [ ] **Step 2: Render Google Drive badge and wire Play action**

In `task.attachments.map((att) => ...)`:
- If `att.source === "gdrive"`: show a subtle `Drive` tag.
- When `Play` is clicked on a Google Drive attachment, set `previewDriveAttachment(att)`.
- Mount `<GoogleDrivePreviewModal>` and `<GoogleDriveLinkModal>` in `TaskDrawer.tsx`.

- [ ] **Step 3: Run full test suite & TypeScript check**

Run: `npm test && npx tsc --noEmit`
Expected: All tests pass, 0 errors.

- [ ] **Step 4: Commit Task 4**

```bash
git add src/components/tasks/TaskDrawer.tsx
git commit -m "feat(tasks): integrate Google Drive footage attachments and video player into TaskDrawer"
```

---

### Task 5: Content Planner Modal Integration & End-to-End Verification

**Files:**
- Modify: `src/components/views/ContentPlannerView/ContentPlannerView.tsx`

**Interfaces:**
- Consumes: `useGoogleDrivePicker`, `GoogleDriveLinkModal`
- Action: Fills `mediaUrl` when a Google Drive video or image is selected.

- [ ] **Step 1: Add Google Drive quick-fill button in Content Post Modal**

Beside the "Media / Thumbnail URL (optional)" label:
```tsx
<button
  type="button"
  onClick={() =>
    openSelector({
      defaultKind: "video",
      onSelect: (atts) => {
        if (atts[0]) {
          setMediaUrl(atts[0].url);
          toast.success("Tautan Google Drive berhasil disematkan ke postingan");
        }
      },
    })
  }
  className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
>
  <span>Pilih dari Google Drive</span>
</button>
```
Mount `<GoogleDriveLinkModal>` inside `ContentPlannerView.tsx`.

- [ ] **Step 2: Run full regression test suite**

Run: `npm test`
Expected: 153+ tests passing, 0 failures.

- [ ] **Step 3: Run TypeScript compiler validation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 5**

```bash
git add src/components/views/ContentPlannerView/ContentPlannerView.tsx
git commit -m "feat(content-planner): add Google Drive asset selection shortcut for posts"
```

---

## Verification Plan

### Automated Tests
- Run unit test for Google Drive utilities:
  ```bash
  npm test -- src/lib/marcom/googleDriveUtils.test.ts
  ```
- Run complete test suite:
  ```bash
  npm test
  ```
- Run TypeScript typecheck:
  ```bash
  npx tsc --noEmit
  ```

### Manual Verification
1. Open Task Drawer on any task:
   - Verify the "Google Drive" button appears next to "Footage & Attachments".
   - Click "Google Drive": verify the `GoogleDriveLinkModal` opens with validation when credentials are not configured.
   - Paste a valid Google Drive video link (e.g. `https://drive.google.com/file/d/12345/view`): verify it detects file type, extracts ID, and adds attachment.
   - Click "Play" on the attachment: verify `GoogleDrivePreviewModal` opens with iframe embed and clean controls.
2. Open Content Planner:
   - Open Create Post or Edit Post modal.
   - Click "Pilih dari Google Drive" beside Media URL: verify it populates the `mediaUrl` input field.
