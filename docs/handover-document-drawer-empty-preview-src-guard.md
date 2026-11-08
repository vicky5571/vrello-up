# Handover: DocumentDrawer Empty Preview `src` Guard (ADR-0092)

**Status:** Planning complete (ADR, Spec, Plan, Handover). Not implemented.
**Date:** 2026-11-08 · **Branch:** `vicky`

- ADR: `docs/adr/0092-document-drawer-empty-preview-src-guard.md`
- Spec: `docs/superpowers/specs/2026-11-08-document-drawer-empty-preview-src-guard-design.md`
- Plan: `docs/superpowers/plans/2026-11-08-document-drawer-empty-preview-src-guard.md`

## 0. Problem

Console error: `An empty string ("") was passed to the src attribute` from `<iframe>` in `DocumentDrawer.tsx`.

Root cause: `filePath` starts as `""` and `fileType` as `"PDF"` (lines 79, 81). State is synced from `document` in a `useEffect` (lines 98–109), after the first render. The first render after `document` becomes non-null therefore renders the PDF branch with `src=""`. `<video>` and `AppImage` have the same exposure. A document whose `filePath` is cleared triggers it as well.

Before starting, run the session-start protocol: read `AGENTS.md`, `docs/SESSION_STATE.md` and `docs/architecture-system-invariants.md`, then run `npm run drift:check` and `npm run test:smoke`.

## 1. Files

| File | Action | Purpose |
|---|---|---|
| `src/lib/marcom/documentWorkflow.test.ts` | Modify (first) | Tests for `resolvePreviewSrc` |
| `src/lib/marcom/documentWorkflow.ts` | Modify | Add pure helper `resolvePreviewSrc` |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Modify | Compute `previewSrc`, render placeholder, use in 3 branches |
| `docs/SESSION_STATE.md`, `CHANGELOG.md` | Modify | Handoff records |

## 2. Step-by-step

### Step 1: Failing tests

In `documentWorkflow.test.ts`, add `resolvePreviewSrc` to the existing import:

```ts
import {
  calculateDocumentKPIs,
  filterDocuments,
  formatFileSize,
  getDocumentTypeMeta,
  isCloudDocumentUrl,
  resolvePreviewSrc,
} from "@/lib/marcom/documentWorkflow";
```

Append at end of file:

```ts
test("resolvePreviewSrc returns null for blank values and trimmed string otherwise (ADR-0092)", () => {
  assert.equal(resolvePreviewSrc(""), null);
  assert.equal(resolvePreviewSrc("   "), null);
  assert.equal(resolvePreviewSrc(undefined), null);
  assert.equal(resolvePreviewSrc(null), null);
  assert.equal(resolvePreviewSrc(" /api/marcom/files/a.pdf "), "/api/marcom/files/a.pdf");
});
```

Run `node --test src/lib/marcom/documentWorkflow.test.ts` (use the project's usual loader flags if it needs them). It must fail first.

### Step 2: Helper

In `documentWorkflow.ts`, directly after `getDocumentTypeMeta` (currently lines 133–135):

```ts
export function getDocumentTypeMeta(fileType: DocFileType): DocumentTypeMeta {
  return DOCUMENT_TYPE_CONFIG[fileType] || DOCUMENT_TYPE_CONFIG.PDF;
}
```

add:

```ts
export function resolvePreviewSrc(filePath?: string | null): string | null {
  const trimmed = filePath?.trim();
  return trimmed ? trimmed : null;
}
```

Re-run the test; it must pass.

### Step 3: Drawer patch

**3a. Import** (current lines 31–36):

```tsx
import {
  getDocumentTypeMeta,
  formatFileSize,
  isCloudDocumentUrl,
  isValidDocumentFilePath,
} from "@/lib/marcom/documentWorkflow";
```

Add `resolvePreviewSrc,` after `isValidDocumentFilePath,`.

**3b. Derive value** (current lines 122–124):

```tsx
const typeMeta = getDocumentTypeMeta(fileType);
const isCloud = isCloudDocumentUrl(filePath);
const driveInfo = isCloud ? parseGoogleDriveUrl(filePath) : null;
```

Add below them:

```tsx
const previewSrc = resolvePreviewSrc(filePath);
```

This stays after the `if (!document) return null;` at line 120, so no hook is added or reordered.

**3c. Placeholder.** Inside the preview IIFE, immediately after the Drive branch (it ends around line 377) and before `// 2. Video Format (MP4)`:

```tsx
// Guard: never render src="" (ADR-0092)
if (
  !previewSrc &&
  (fileType === "MP4" || fileType === "PNG" || fileType === "JPG" || fileType === "PDF")
) {
  return (
    <div className="py-10 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
      Belum ada file untuk dipratinjau
    </div>
  );
}
```

**3d. Replace `src={filePath}` with `src={previewSrc}`** in exactly three places inside the IIFE:
- `<video ... src={filePath}>`: MP4 branch (about line 385)
- `<AppImage src={filePath} ...>`: PNG/JPG branch (about line 397)
- `<iframe src={filePath} ...>`: PDF branch (about line 412)

The early return in 3c does not narrow `previewSrc` inside the later `if (fileType === ...)` blocks, because TypeScript cannot correlate the two conditions. Never use `?? ""` or a cast, since both reintroduce `src=""`. Instead, put `previewSrc &&` into each branch condition:

```tsx
if (previewSrc && fileType === "MP4") { ... src={previewSrc} ... }
if (previewSrc && (fileType === "PNG" || fileType === "JPG")) { ... }
if (previewSrc && fileType === "PDF") { ... }
```

Keep the placeholder from 3c ahead of them. Do not use `any` or `as string`.

## 3. Do not touch

| Item | Reason |
|---|---|
| Drive embed branch (`driveInfo?.embedUrl`) | Already guarded |
| `useEffect` sync (lines 98–109) and `useState` defaults | Changing them is ADR Option C, rejected |
| Fallback card (branch 5), `LINK` handling | ADR-0091 behavior, unaffected |
| Buttons guarded by `filePath &&` (lines ~324, 438, 506) | Already correct |
| Prisma schema, API routes, `src/types/index.ts` | No contract change |
| `DocumentCreateModal.tsx` | Out of scope |

## 4. Known debt (accepted)

- `DocumentDrawer.tsx` is 749 LOC (limit 250). Do not add more than about 12 lines. A Strangler refactor needs its own ADR.
- The placeholder flashes for one commit on open because state is synced after render.

## 5. Verification (all must pass before claiming done)

```bash
node --test src/lib/marcom/documentWorkflow.test.ts   # fail 0
npm run drift:check    # ✅ No drift detected
npm test               # fail 0
npm run build:check    # 0 errors
```

Check `documentDrawer.test.ts` for source-text assertions on the changed lines (a grep for `src={filePath}` found none during planning). Manual browser check: open a PDF document drawer and confirm no `src` error in the console. Open a document with blank `filePath` and confirm the placeholder. Confirm MP4 and image previews are unchanged.

## 6. Acceptance criteria

- [ ] No `empty string ... src` console error when opening the drawer.
- [ ] Placeholder shown for MP4/PNG/JPG/PDF when `filePath` is blank.
- [ ] Valid previews unchanged.
- [ ] `resolvePreviewSrc` tests pass.
- [ ] `drift:check`, `npm test`, `build:check` all pass.
- [ ] No `any`; hook order untouched.
- [ ] `docs/SESSION_STATE.md` and `CHANGELOG.md` updated, referencing the spec and ADR-0092.

Suggested commit:

```
fix(documents): guard empty preview src in DocumentDrawer

Spec: docs/superpowers/specs/2026-11-08-document-drawer-empty-preview-src-guard-design.md
Plan: docs/superpowers/plans/2026-11-08-document-drawer-empty-preview-src-guard.md
Refs: ADR-0092
```
