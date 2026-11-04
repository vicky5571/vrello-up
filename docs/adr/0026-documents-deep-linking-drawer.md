# ADR-0026: Documents Side Drawer Deep Linking via URL Query Parameter (docId)

## Status
ACCEPTED

## Date
2026-11-05

## Context & Problem Statement
In the Marcom Documents & Asset Library (`DocumentsView`), assets are inspected and edited through a 560px slide-over side drawer container (`DocumentDrawer.tsx`).

Previously, clicking the "Salin Tautan" (Copy Link) button on a document card (`DocumentCardsView.tsx`) or inside the drawer copied the raw underlying storage URL (`doc.filePath`, e.g. `https://storage.marcom-internal.corp/guidelines/IM3_Brand_Book_2026.pdf` or a Supabase Storage CDN URL).

This presented significant operational and user experience shortcomings:
1. **Loss of Application Context**: When team members shared links via Slack or WhatsApp, opening the link opened only the raw file binary or standalone PDF viewer in a blank browser tab. The recipient could not see metadata (branch, period, PIC, category, description), could not edit or replace the file, and had no navigation back to the Vrello workspace.
2. **No Direct Deep Linking**: There was no way to share a link to a specific document that automatically opened the Vrello Documents view with that document's side drawer open.
3. **No Middle-Click / Open in New Tab Support**: The card footer action was an unlinked `<button>` rather than an accessible `<a>` tag with standard browser href navigation.

## Options Considered

### Option A: URL Query Parameter (`docId`) with Bidirectional Sync (SELECTED)
- Extend `src/lib/router/urlState.ts` with canonical `docId` parameter and `buildShareableDocumentUrl(docId, origin?)`.
- In `DocumentsView.tsx`, hydrate `selectedDrawerDoc` from `docId` URL search parameter on initial mount/data arrival.
- Synchronize URL via `window.history.replaceState` when drawer opens or closes.
- Update `handleCopyLink` to copy `https://{domain}/?mode=marcom&view=documents&docId={doc.id}`.
- Wrap card action in `<a href={shareUrl} onClick={handleCopyLink} />` to support both left-click copy and middle/right-click "Open link in new tab".
- **Trade-off Summary**:
  - *Engineering Cleanliness*: Maximum. Reuses existing `urlState.ts` infrastructure. Zero new npm packages.
  - *User Experience*: Seamless. Shared links open directly in the rich workspace environment with the target drawer open.
  - *Performance*: Zero additional network requests or page re-renders.

### Option B: Standalone Next.js Page Route (`/documents/[id]`)
- Create a dedicated route `src/app/documents/[id]/page.tsx`.
- **Trade-off Summary**:
  - Severe architectural violation. Breaks Vrello's single-stage layout (`ActiveViewStage.tsx`), bypasses GlobalRail and Sidebar state, and duplicates coordinator logic.

## Decision
We choose **Option A**. We implement bidirectional URL deep linking for documents using query parameter `docId`, support shareable canonical URLs in copy buttons, and enable automatic drawer opening upon link resolution.

## Consequences

### Positive
- Team members can share direct links to any document asset, landing directly on Vrello with the slide drawer open.
- Browser Back/Forward navigation handles closing and reopening document drawers naturally.
- Middle-click and right-click "Open in new tab" are fully supported.

### Negative / Trade-offs Accepted
- If a document has been deleted, loading a URL with that `docId` will not find the document; a graceful fallback (toast warning) is provided.

## Invariant Compliance
- [x] Single-tenant invariant preserved (no workspace-scoped query params).
- [x] Coordinator file size limit preserved (`DocumentsView.tsx` remains $\le 450$ LOC).
- [x] Zero drift detected (`npm run drift:check`).

