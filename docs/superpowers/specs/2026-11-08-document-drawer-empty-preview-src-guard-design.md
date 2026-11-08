# Spec: DocumentDrawer Empty Preview `src` Guard

- **Date:** 2026-11-08
- **Status:** Approved (scope confirmed)
- **ADR:** [ADR-0092](../../adr/0092-document-drawer-empty-preview-src-guard.md)
- **Handover:** `docs/handover-document-drawer-empty-preview-src-guard.md`

## 1. Executive Summary

`DocumentDrawer.tsx` renders `<iframe>`, `<video>` and `AppImage` with `src={filePath}`. Because `filePath` starts as `""` and is populated by `useEffect` after the first render, an empty `src` is emitted, causing React's "empty string passed to src" error. The fix introduces a pure helper and a placeholder state.

## 2. Non-Goals

- Changing the `useEffect` state population pattern (ADR-0092 Option C).
- Schema, API, `DocumentCreateModal`, Drive embed branch or `LINK`/fallback card changes.
- Refactoring the 749-LOC `DocumentDrawer.tsx` (tracked as accepted debt).

## 3. UX Flow

| State | Preview frame result |
|---|---|
| Drive URL with `embedUrl` | Drive iframe (unchanged) |
| `fileType` ∈ {MP4, PNG, JPG, PDF} and `previewSrc === null` | Placeholder text `Belum ada file untuk dipratinjau` |
| `fileType` ∈ {MP4, PNG, JPG, PDF} and `previewSrc` non-null | `<video>` / `AppImage` / `<iframe>` with `src={previewSrc}` (unchanged look) |
| Other types (DOCX, XLSX, CSV, ZIP, LINK) | Existing fallback card (unchanged) |

Placeholder is rendered inside the existing frame (`min-h-[280px]`, centered), classes `py-10 px-6 text-center text-xs text-slate-500 dark:text-slate-400`.

## 4. Pure Logic Signature

```ts
// src/lib/marcom/documentWorkflow.ts
export function resolvePreviewSrc(filePath?: string | null): string | null;
```

Contract:
- `undefined`, `null`, `""`, whitespace-only → `null`.
- Otherwise returns the trimmed string unchanged (no URL validation; `isValidDocumentFilePath` stays the validator).
- Pure, no side effects.

## 5. SSOT / SQL / API

No changes to `src/types/index.ts`, Prisma schema, or API contracts.

## 6. Failure & Recovery Modes

| Situation | Behavior |
|---|---|
| First render after `document` becomes non-null (state not yet synced) | Placeholder flashes for one commit, then the real preview appears. No empty `src` rendered. |
| User clears `filePath` in the edit form | Placeholder shown; save is still blocked by existing `filePath.trim()` validation (line ~186). |
| Broken/unreachable URL | Out of scope; browser behavior unchanged. |

## 7. Invariants

- No element in the preview frame may receive `src=""`.
- No `any` types; narrow `string | null` via early return.
- Action buttons guarded by `filePath &&` remain unchanged.

## 8. Acceptance Criteria

- [ ] Opening the drawer for a PDF document logs no `empty string ... src` error.
- [ ] Blank `filePath` with MP4/PNG/JPG/PDF shows the placeholder.
- [ ] Valid previews render as before.
- [ ] `resolvePreviewSrc` unit tests pass (blank variants → `null`; valid → trimmed).

## 9. Verification Checklist

- [ ] `node --test src/lib/marcom/documentWorkflow.test.ts` (red first, then green)
- [ ] `npm run drift:check` → `✅ No drift detected`
- [ ] `npm test` → `fail 0`
- [ ] `npm run build:check` → 0 errors
- [ ] Manual browser check of PDF drawer and blank-`filePath` document
