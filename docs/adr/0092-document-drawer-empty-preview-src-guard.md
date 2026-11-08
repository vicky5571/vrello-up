# ADR-0092: DocumentDrawer Empty Preview `src` Guard

- **Status:** Accepted
- **Date:** 2026-11-08
- **Deciders:** Engineering & Product

---

## 1. Context & Business Problem

React logs `An empty string ("") was passed to the src attribute` from `<iframe>` in `DocumentDrawer.tsx`.

- `fileType` initializes to `"PDF"` and `filePath` to `""` (lines 79, 81).
- State is populated from `document` only in a `useEffect` (lines 98–109), i.e. after the first render in which `document` is non-null.
- The guard at line 120 is only `if (!document) return null`, so the first render after opening renders the PDF branch (`<iframe src={filePath}>`, lines 409–416) with `src=""`.
- The same unguarded pattern exists in `<video src={filePath}>` (MP4 branch) and `AppImage src={filePath}` (PNG/JPG branch).
- A document whose `filePath` is edited to empty triggers the same error.

Operational cost: a browser may re-request the whole page for `src=""`, and the dev console is polluted by unhandled errors.

## 2. Options Considered

| Option | Description | Verdict |
|---|---|---|
| A | Derive `previewSrc = resolvePreviewSrc(filePath)` (`null` when blank) and render a "no file" placeholder for MP4/image/PDF branches. | **Chosen** |
| B | Guard only the PDF branch. | Rejected: leaves `<video>` and image exposed. |
| C | Restructure state (`key={document.id}` / derived state) so the first render is correct. | Rejected: higher regression risk on the edit form; the guard is still needed for legitimately empty `filePath`. |

## 3. Trade-Off Matrix

| Dimension | A | B | C |
|---|---|---|---|
| Operational continuity / rollback | Trivial rollback | Trivial | Harder (state model change) |
| Engineering cost | Low (1 helper + 1 branch) | Lowest | Medium |
| Coverage of failure modes | All `src` elements, empty and transient | PDF only | Transient only |

## 4. Decision

Option A. Add pure helper `resolvePreviewSrc(filePath?: string | null): string | null` to `src/lib/marcom/documentWorkflow.ts` (trims; blank → `null`). In `DocumentDrawer.tsx`, compute `previewSrc` and, when `null`, render a placeholder before the MP4, image and PDF branches. The Drive embed branch is already guarded by `driveInfo?.embedUrl`.

## 5. Consequences

- Positive: no empty `src` is ever rendered; unit-testable helper.
- Accepted debt: the root cause (state initialized outside the first render) remains; the first render shows the placeholder briefly instead of the preview. Revisit with Option C if more stale-state bugs appear.
- `LINK` and non-Drive URLs fall through to the existing fallback card and are unaffected.
