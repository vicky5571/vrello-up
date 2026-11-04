# Specification: Documents Side Drawer Deep Linking via URL Query Parameter (docId)

## Status
IMPLEMENTED (ADR-0026)

## Date
2026-11-05

## 1. Executive Summary
This specification defines the deep linking architecture for the Documents & Asset Library module. By binding the document drawer state bidirectionally to the `docId` URL query parameter, users can copy, share, bookmark, and directly open links to any document in the DAM library. Opening the URL automatically navigates to the Documents view and expands the 560px slide-over drawer with full media preview and metadata.

---

## 2. Problem Statement & User Flow

### 2.1 The Problem
When clicking the "Copy Link" action on a document card or drawer, the system previously copied raw storage file paths (e.g. `https://storage.marcom-internal.corp/...` or Supabase Storage URLs). When shared or opened, users lost all application context—metadata, editing capabilities, delete options, and the surrounding library views were inaccessible.

### 2.2 Target User Experience
1. **Sharing a Document**: An operator clicks "Salin Tautan" on a document card or drawer. The clipboard receives `https://{domain}/?mode=marcom&view=documents&docId={docId}` and a success toast appears.
2. **Receiving a Document**: A teammate clicks the link. The browser loads Vrello $\rightarrow$ mounts `DocumentsView` $\rightarrow$ automatically opens `DocumentDrawer` displaying the requested file live.
3. **Closing Drawer**: When closing the drawer via `X`, `Escape`, or backdrop click, `docId` is cleanly removed from the browser URL address bar using `window.history.replaceState`.
4. **Browser Back Button**: Pressing the browser's Back button closes the drawer seamlessly.
5. **Open in New Tab**: Middle-clicking or right-clicking the copy action button opens a new browser tab with that document's drawer open.

---

## 3. Component Manifest & Architectural Contracts

| Component / Module | File Path | Responsibilities |
|---|---|---|
| `urlState.ts` | `src/lib/router/urlState.ts` | Extends `UrlNavState` with `docId?: string`. Implements `buildShareableDocumentUrl(docId, origin?)`. Parses `docId` and alias `doc`. |
| `DocumentsView.tsx` | `src/components/views/DocumentsView/DocumentsView.tsx` | Reads `docId` from URL search params on mount/fetch. Sets `selectedDrawerDoc`. Syncs `docId` to URL query via `replaceState` when drawer opens/closes. |
| `DocumentCardsView.tsx` | `src/components/views/DocumentsView/DocumentCardsView.tsx` | Renders `<a href={shareUrl} onClick={handleCopyLink}>` for middle-click/right-click support and clipboard copy. |
| `DocumentDrawer.tsx` | `src/components/views/DocumentsView/DocumentDrawer.tsx` | Header "Salin Link" button copies `buildShareableDocumentUrl`. |

---

## 4. Pure Function Signatures & Data Contracts

### 4.1 URL Helper (`src/lib/router/urlState.ts`)
```typescript
export interface UrlNavState {
  appMode?: AppMode;
  view?: ViewMode;
  spaceId?: string;
  listId?: string;
  taskId?: string;
  docId?: string; // New: Documents deep-link identifier
}

export function buildShareableDocumentUrl(
  docId: string,
  origin = "",
): string {
  const params = new URLSearchParams();
  params.set("mode", "marcom");
  params.set("view", "documents");
  params.set("docId", docId.trim());
  const query = `?${params.toString()}`;
  return origin ? `${origin}/${query}` : `/${query}`;
}
```

### 4.2 Auto-Hydration in `DocumentsView.tsx`
```typescript
useEffect(() => {
  if (typeof window === "undefined" || documents.length === 0) return;
  const params = new URLSearchParams(window.location.search);
  const docIdParam = params.get("docId") || params.get("doc");
  if (docIdParam && (!selectedDrawerDoc || selectedDrawerDoc.id !== docIdParam)) {
    const matched = documents.find((d) => d.id === docIdParam);
    if (matched) {
      setSelectedDrawerDoc(matched);
    }
  }
}, [documents]);
```

### 4.3 Bidirectional URL State Sync in `DocumentsView.tsx`
```typescript
const handleSelectDrawerDoc = useCallback((doc: MarcomDocument | null) => {
  setSelectedDrawerDoc(doc);
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (doc) {
    url.searchParams.set("docId", doc.id);
  } else {
    url.searchParams.delete("docId");
    url.searchParams.delete("doc");
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}, []);
```

---

## 5. Non-Goals (Explicitly Out of Scope)
- No standalone `/documents/[id]` route (violates single-stage architecture).
- No database or schema changes.
- No changes to `/api/marcom/documents` REST endpoints.

---

## 6. Verification Checklist & Acceptance Criteria
- [ ] `buildShareableDocumentUrl("doc-001")` returns `/?mode=marcom&view=documents&docId=doc-001`.
- [ ] Direct visit to `/?mode=marcom&view=documents&docId=doc-001` auto-opens drawer for `doc-001`.
- [ ] Closing the drawer removes `docId` from browser address bar.
- [ ] Clicking copy button on card copies canonical deep link to clipboard.
- [ ] Unit tests pass: `documentDrawer.test.ts` and `urlState.test.ts`.
- [ ] Quality gates pass: `npm run drift:check`, `npm run build:check`, `npm test`.

