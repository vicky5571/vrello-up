# Handover: Documents Side Drawer Deep Linking via URL Query Parameter (docId)

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-documents-deep-linking-design.md`  
**Plan:** `docs/superpowers/plans/2026-11-05-documents-deep-linking.md`  
**ADR:** `docs/adr/0026-documents-deep-linking-drawer.md`  
**Status:** EXECUTION-READY (Planning Complete)

---

## 1. File Manifest

| File Path | One-Line Purpose | Action |
|---|---|---|
| `src/lib/router/urlState.ts` | URL parameter parsing, serialization & canonical link builder | Add `docId` support & `buildShareableDocumentUrl` |
| `src/lib/router/urlState.test.ts` | Pure router functions unit tests | Add test for `buildShareableDocumentUrl` & `parseUrlNavState` |
| `src/components/views/DocumentsView/DocumentsView.tsx` | Documents view coordinator | Add `docId` URL auto-hydration, drawer sync, and popstate |
| `src/components/views/DocumentsView/DocumentCardsView.tsx` | Documents grid cards | Update copy button to copy deep link & wrap in `<a>` tag |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Slide-over detail drawer | Update header "Salin Link" button to copy deep link |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Documents module unit tests | Add assertions for deep linking & URL sync |

---

## 2. Exact Changes by Phase

### Phase 1: Router Helpers & Canonical URL Builder

#### 1. `src/lib/router/urlState.ts`
**Change 1 — Add `docId` to `UrlNavState` (around line 9):**
```typescript
export interface UrlNavState {
  appMode?: AppMode;
  view?: ViewMode;
  spaceId?: string;
  listId?: string;
  taskId?: string;
  docId?: string;
}
```

**Change 2 — In `parseUrlNavState` (around line 70):**
```typescript
  const rawTask = params.get("task") || params.get("t");
  const rawDoc = params.get("docId") || params.get("doc");

  if (rawSpace) {
    state.spaceId = rawSpace.trim();
  }
  if (rawList) {
    state.listId = rawList.trim();
  }
  if (rawTask) {
    state.taskId = rawTask.trim();
  }
  if (rawDoc) {
    state.docId = rawDoc.trim();
    if (!state.view) {
      state.view = "documents";
    }
  }
```

**Change 3 — In `serializeUrlNavState` (around line 140):**
```typescript
  if (state.taskId) {
    params.set("task", state.taskId);
  }
  if (state.docId) {
    params.set("docId", state.docId);
  }
```

**Change 4 — Add `buildShareableDocumentUrl` at end of file:**
```typescript
/**
 * Constructs a shareable deep-link URL for a specific document asset.
 */
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

---

### Phase 2: Coordinator Auto-Hydration & URL State Synchronization

#### 1. `src/components/views/DocumentsView/DocumentsView.tsx`

**A. Import `buildShareableDocumentUrl`:**
```typescript
import { buildShareableDocumentUrl } from "@/lib/router/urlState";
```

**B. Auto-Hydrate `selectedDrawerDoc` from URL on Data Arrival:**
```typescript
  // Auto-open document drawer from URL query parameter (docId)
  useEffect(() => {
    if (typeof window === "undefined" || documents.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetDocId = params.get("docId") || params.get("doc");
    if (targetDocId) {
      const matched = documents.find((d) => d.id === targetDocId);
      if (matched) {
        setSelectedDrawerDoc(matched);
      } else if (!isLoading) {
        toast.error("Dokumen tidak ditemukan");
        const url = new URL(window.location.href);
        url.searchParams.delete("docId");
        url.searchParams.delete("doc");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      }
    }
  }, [documents, isLoading]);
```

**C. Sync `docId` to URL when Drawer Opens or Closes:**
Create a synchronized handler:
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

**D. Handle Browser Popstate (Back/Forward):**
```typescript
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const targetDocId = params.get("docId") || params.get("doc");
      if (!targetDocId) {
        setSelectedDrawerDoc(null);
      } else {
        const matched = documents.find((d) => d.id === targetDocId);
        if (matched) setSelectedDrawerDoc(matched);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [documents]);
```

**E. Wire `handleSelectDrawerDoc` to component props:**
- Pass `onSelectDocument={handleSelectDrawerDoc}` to `<DocumentCardsView />`.
- In `MarcomTableShell`, pass `onRowClick={(doc) => handleSelectDrawerDoc(doc)}`.
- In `<DocumentDrawer onClose={() => handleSelectDrawerDoc(null)} />`.

---

### Phase 3: Card & Drawer Action Buttons Update

#### 1. `src/components/views/DocumentsView/DocumentCardsView.tsx`

**A. Import `buildShareableDocumentUrl`:**
```typescript
import { buildShareableDocumentUrl } from "@/lib/router/urlState";
```

**B. Update `handleCopyLink`:**
```typescript
  const handleCopyLink = (doc: MarcomDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shareUrl = buildShareableDocumentUrl(doc.id, window.location.origin);
    navigator.clipboard.writeText(shareUrl);
    toast.success(`Tautan "${doc.name}" berhasil disalin!`);
  };
```

**C. Wrap copy button in accessible `<a>` tag:**
```tsx
                <a
                  href={buildShareableDocumentUrl(doc.id)}
                  onClick={(e) => handleCopyLink(doc, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Salin tautan dokumen (klik kanan untuk buka tab baru)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </a>
```

#### 2. `src/components/views/DocumentsView/DocumentDrawer.tsx`

**A. Import `buildShareableDocumentUrl`:**
```typescript
import { buildShareableDocumentUrl } from "@/lib/router/urlState";
```

**B. Update "Salin Link" button in header (around line 280):**
```typescript
  const handleCopyShareLink = () => {
    const shareUrl = buildShareableDocumentUrl(document.id, window.location.origin);
    navigator.clipboard.writeText(shareUrl);
    toast.success("Tautan dokumen berhasil disalin!");
  };
```

---

### Phase 4: Automated Testing & Verification

#### 1. `src/lib/router/urlState.test.ts`
Add tests:
```typescript
test("urlState: parseUrlNavState parses docId and defaults view to documents", () => {
  const state = parseUrlNavState("?docId=doc-001");
  assert.equal(state.docId, "doc-001");
  assert.equal(state.view, "documents");
  assert.equal(state.appMode, "marcom");
});

test("urlState: buildShareableDocumentUrl constructs canonical URL", () => {
  const rel = buildShareableDocumentUrl("doc-001");
  assert.equal(rel, "/?mode=marcom&view=documents&docId=doc-001");

  const abs = buildShareableDocumentUrl("doc-001", "https://vrello.app");
  assert.equal(abs, "https://vrello.app/?mode=marcom&view=documents&docId=doc-001");
});
```

#### 2. `src/components/views/DocumentsView/documentDrawer.test.ts`
Add test:
```typescript
it("verifies DocumentsView and cards wire buildShareableDocumentUrl", () => {
  const viewPath = path.join(docsDir, "DocumentsView.tsx");
  const viewContent = fs.readFileSync(viewPath, "utf-8");
  assert.ok(viewContent.includes("buildShareableDocumentUrl"), "DocumentsView must use buildShareableDocumentUrl");
  assert.ok(viewContent.includes("docId"), "DocumentsView must handle docId URL parameter");

  const cardsPath = path.join(docsDir, "DocumentCardsView.tsx");
  const cardsContent = fs.readFileSync(cardsPath, "utf-8");
  assert.ok(cardsContent.includes("buildShareableDocumentUrl"), "CardsView must use buildShareableDocumentUrl");
});
```

---

## 3. Explicit "Do Not Touch" List

1. **`prisma/schema.prisma` & Database**:
   - Zero database changes. Do not alter any Prisma models or migrations.
2. **REST API Endpoints (`/api/marcom/documents`)**:
   - Do not modify API routes; everything is handled via URL client routing.
3. **Single-Tenant Invariant**:
   - Do not introduce `workspaceId` into any URLs.

---

## 4. Numbered Execution Order

1. **Step 1**: Edit `src/lib/router/urlState.ts` (add `docId`, `buildShareableDocumentUrl`).
2. **Step 2**: Add tests to `src/lib/router/urlState.test.ts` and run `node --test src/lib/router/urlState.test.ts`.
3. **Step 3**: Edit `src/components/views/DocumentsView/DocumentsView.tsx` (add auto-hydration and `handleSelectDrawerDoc`).
4. **Step 4**: Edit `src/components/views/DocumentsView/DocumentCardsView.tsx` (update `handleCopyLink` and `<a>` wrap).
5. **Step 5**: Edit `src/components/views/DocumentsView/DocumentDrawer.tsx` (update header copy link).
6. **Step 6**: Update `src/components/views/DocumentsView/documentDrawer.test.ts`.
7. **Step 7**: Run full verification gates: `npm run drift:check`, `npm run build:check`, `npm test`.

---

## 5. Acceptance Criteria Checklist

- [ ] `buildShareableDocumentUrl("doc-001")` returns `/?mode=marcom&view=documents&docId=doc-001`.
- [ ] Clicking copy button on any document card copies `https://{domain}/?mode=marcom&view=documents&docId={docId}`.
- [ ] Middle-clicking copy link on card opens new browser tab navigating to that document with drawer open.
- [ ] Navigating to `/?mode=marcom&view=documents&docId=doc-001` directly auto-opens drawer for `doc-001`.
- [ ] Closing the drawer removes `docId` from the browser address bar without page reload.
- [ ] Pressing browser Back button closes the open drawer.
- [ ] Non-negotiable gates: `drift:check`, `build:check`, and `npm test` all pass with 0 errors/failures.

