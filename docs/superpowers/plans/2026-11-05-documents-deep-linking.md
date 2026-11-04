# Implementation Plan: Documents Side Drawer Deep Linking via URL Query Parameter (docId)

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-documents-deep-linking-design.md`  
**ADR:** `docs/adr/0026-documents-deep-linking-drawer.md`  
**Status:** COMPLETED

---

## 1. Plan Overview & Objectives
Implement deep linking for the Marcom Documents module:
1. Extend `src/lib/router/urlState.ts` to parse, serialize, and build canonical document URLs with `docId`.
2. Update `DocumentsView.tsx` to hydrate the open drawer from `docId` URL parameter on mount/fetch, and synchronize `docId` with the address bar via `replaceState`.
3. Update `DocumentCardsView.tsx` and `DocumentDrawer.tsx` to copy canonical shareable URLs and wrap copy buttons in accessible `<a>` tags for new-tab navigation.
4. Add automated unit test coverage and verify all non-negotiable quality gates.

---

## 2. Phase 1: Router Helpers & Canonical URL Builder

### Tasks:
- [x] **1.1 Update `src/lib/router/urlState.ts`**:
  - Add `docId?: string;` to `UrlNavState` interface.
  - In `parseUrlNavState`:
    - Add extraction for `rawDocId = params.get("docId") || params.get("doc")`.
    - If `rawDocId`, assign `state.docId = rawDocId.trim()`.
    - If `state.docId` is present and no view specified, default `state.view = "documents"`.
  - In `serializeUrlNavState`:
    - Add serialization: if `state.docId`, append `params.set("docId", state.docId)`.
  - Add export function:
    ```typescript
    export function buildShareableDocumentUrl(docId: string, origin = ""): string {
      const params = new URLSearchParams();
      params.set("mode", "marcom");
      params.set("view", "documents");
      params.set("docId", docId.trim());
      const query = `?${params.toString()}`;
      return origin ? `${origin}/${query}` : `/${query}`;
    }
    ```
- [x] **1.2 Unit Tests in `src/lib/router/urlState.test.ts`**:
  - Add test verifying `parseUrlNavState` extracts `docId` and sets `view: "documents"`.
  - Add test verifying `buildShareableDocumentUrl` constructs correct canonical path.

**Phase 1 Verification:**
- Run `node --test src/lib/router/urlState.test.ts`

---

## 3. Phase 2: Coordinator Auto-Hydration & URL State Synchronization

### Tasks:
- [x] **2.1 Update `src/components/views/DocumentsView/DocumentsView.tsx`**:
  - Import `buildShareableDocumentUrl` from `@/lib/router/urlState`.
  - Add initial hydration `useEffect`:
    - Reads `window.location.search` for `docId` or `doc`.
    - When `documents` are loaded, finds matching document and calls `setSelectedDrawerDoc(matched)`.
    - If `docId` is specified but no document matches after load, triggers `toast.error("Dokumen tidak ditemukan")` and cleans the URL parameter.
  - Update drawer selection handler `handleSelectDrawerDoc`:
    - Sets `selectedDrawerDoc`.
    - Updates address bar via `window.history.replaceState` (adds `docId` when open, deletes `docId` when null).
  - Add popstate event listener:
    - Listens to browser Back/Forward; if `docId` is removed from URL, sets `setSelectedDrawerDoc(null)`.

**Phase 2 Verification:**
- Run `npm run build:check` to ensure no TypeScript compilation issues.

---

## 4. Phase 3: Card & Drawer Action Buttons Update

### Tasks:
- [x] **3.1 Update `src/components/views/DocumentsView/DocumentCardsView.tsx`**:
  - Import `buildShareableDocumentUrl` from `@/lib/router/urlState`.
  - In `handleCopyLink`:
    - Generate `shareUrl = buildShareableDocumentUrl(doc.id, window.location.origin)`.
    - Call `navigator.clipboard.writeText(shareUrl)`.
    - Toast: `toast.success(`Tautan dokumen "${doc.name}" berhasil disalin!`)`.
  - In card footer JSX:
    - Wrap the copy button in an `<a>` tag:
      ```tsx
      <a
        href={buildShareableDocumentUrl(doc.id)}
        onClick={(e) => handleCopyLink(doc, e)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Salin tautan dokumen (atau klik kanan untuk buka di tab baru)"
      >
        <Copy className="w-3.5 h-3.5" />
      </a>
      ```
- [x] **3.2 Update `src/components/views/DocumentsView/DocumentDrawer.tsx`**:
  - Import `buildShareableDocumentUrl` from `@/lib/router/urlState`.
  - In header copy link button, generate `shareUrl = buildShareableDocumentUrl(document.id, window.location.origin)` and copy to clipboard.

**Phase 3 Verification:**
- Run `npm run build:check`.

---

## 5. Phase 4: Automated Testing & Verification

### Tasks:
- [x] **4.1 Update `src/components/views/DocumentsView/documentDrawer.test.ts`**:
  - Test verifying `buildShareableDocumentUrl` returns valid query format.
  - Test verifying `DocumentsView.tsx` wires `docId` parameter resolution and `replaceState`.
  - Test verifying `DocumentCardsView.tsx` and `DocumentDrawer.tsx` use `buildShareableDocumentUrl`.
- [x] **4.2 Non-Negotiable Quality Gates**:
  - Run `npm run drift:check` → MUST pass with `✅ No drift detected`.
  - Run `npm run build:check` → MUST pass with 0 TypeScript compilation errors.
  - Run `npm test` → MUST pass with 0 failures across all test suites.

---

## 6. Verification Checklist
- [x] `buildShareableDocumentUrl` creates `/?mode=marcom&view=documents&docId=...`.
- [x] Copy button on card copies canonical deep link.
- [x] Middle-clicking copy link on card opens new tab with `?mode=marcom&view=documents&docId=...`.
- [x] Opening `/?mode=marcom&view=documents&docId=doc-001` auto-opens side drawer for `doc-001`.
- [x] Closing drawer cleans `docId` from browser address bar.
- [x] Quality gates green: drift-check, build-check, test suite.

