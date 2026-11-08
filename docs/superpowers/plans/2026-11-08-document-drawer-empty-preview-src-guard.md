# Implementation Plan: DocumentDrawer Empty Preview `src` Guard

- **Date:** 2026-11-08
- **Status:** Complete
- **Spec:** [2026-11-08-document-drawer-empty-preview-src-guard-design.md](../specs/2026-11-08-document-drawer-empty-preview-src-guard-design.md)
- **ADR:** [ADR-0092](../../adr/0092-document-drawer-empty-preview-src-guard.md)

## 1. File Manifest

| File | Action | Est. LOC change | Responsibility |
|---|---|---|---|
| `src/lib/marcom/documentWorkflow.test.ts` | Modify | +12 | Tests for `resolvePreviewSrc` (written first) |
| `src/lib/marcom/documentWorkflow.ts` | Modify | +4 | Add `resolvePreviewSrc` |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Modify | +12 | Compute `previewSrc`, placeholder, use in 3 branches |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Modify | +15 | Regression assertions for empty preview src guard |
| `docs/SESSION_STATE.md` | Modify | n/a | Record implementation completion |

`DocumentDrawer.tsx` is already ~749 LOC (above the 250 limit). Net growth is kept minimal; Strangler refactor is out of scope and recorded as debt.

## 2. Phases

### Phase 1: Helper (test-first)
- [x] Add tests: `""`, `"   "`, `undefined`, `null` → `null`; `" /api/marcom/files/a.pdf "` → `"/api/marcom/files/a.pdf"`.
- [x] Run `node --test src/lib/marcom/documentWorkflow.test.ts` → confirm failure.
- [x] Implement `resolvePreviewSrc` in `documentWorkflow.ts`.
- **Gate:** same command → `fail 0`.

### Phase 2: Drawer patch
- [x] Import `resolvePreviewSrc`; add `const previewSrc = resolvePreviewSrc(filePath);` after `driveInfo`.
- [x] After the Drive branch, return the placeholder when `!previewSrc` and `fileType` ∈ {MP4, PNG, JPG, PDF}.
- [x] Replace `src={filePath}` with `src={previewSrc}` in MP4, `AppImage` and PDF branches (type narrowed by the early return; no `any`).
- **Gate:** `npm run build:check` → 0 errors.

### Phase 3: Verification & handoff
- [x] `npm run drift:check`, `npm test` (fail 0), `npm run build:check`.
- [x] Manual: PDF drawer shows no console error; blank-`filePath` document shows placeholder; MP4/image previews unchanged.
- [x] Update `docs/SESSION_STATE.md` and `CHANGELOG.md` (reference spec and ADR-0092).

## 3. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Type narrowing of `string \| null` fails in JSX | Early return before branches; avoid casts to `any` |
| Placeholder flash on first render | Accepted (ADR-0092 debt); Option C is the future fix |
| Existing source-text tests (`documentDrawer.test.ts`) assert on `src={filePath}` | Grep the test file before patching and update assertions in the same phase |

## 4. Dependencies

Order: helper tests → helper → drawer → verification. No migration or API dependency.
