# Spec: Step 3 Direct Physical Photo Upload Enforcement and Tautan URL Removal Design

- **Status:** Approved
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0079-step3-tautan-url-removal.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-step3-tautan-url-removal.md`

---

## 1. Executive Summary

In Step 3 (`Step3PhotoNotes.tsx`) of the POSM Placement creation wizard (`PlacementFormModal.tsx`), field documentation photos serve as mandatory physical evidence for audit verification when marking an installation as `DONE`.

Currently, the photo uploader component (`PlacementPhotoUploader.tsx`) exposes a legacy `"🔗 Tautan URL v"` trigger next to the `"Foto Bukti Pemasangan"` label, which opens an inline text box for pasting arbitrary image URLs (`https://...`). This feature represents technical debt and operational risk:
1. It bypasses client-side image compression (`compressImage`) and centralized cloud storage (`/api/marcom/uploads`).
2. It introduces broken links (expired external URLs, hotlink blocking).
3. It clutters the UI header row and causes misclicks on touch screens.
4. Field officers never type or paste web image links in production field operations.

This specification defines the complete removal of the `"Tautan URL"` feature across all viewports (mobile, tablet, and desktop) while preserving 100% of the authentic physical upload capabilities (`Ambil Foto (Kamera)` and `Pilih dari Galeri`), thumbnail previews, and full-screen lightbox viewing.

---

## 2. User Experience & Viewport Flow

### 2.1 Current vs. Target Layout

```
CURRENT LAYOUT (Step 3 Photo Header):
+-------------------------------------------------------------+
| Foto Bukti Pemasangan     [2 Foto Terlampir]  [🔗 Tautan URL v] |
+-------------------------------------------------------------+
| [Ambil Foto (Kamera)]          [Pilih dari Galeri]           |
+-------------------------------------------------------------+
| [ Tempel tautan gambar https://...            ] [ + Tambah ] | <- TO BE REMOVED
+-------------------------------------------------------------+

TARGET LAYOUT (Across All Viewports):
+-------------------------------------------------------------+
| Foto Bukti Pemasangan                    [2 Foto Terlampir] |
+-------------------------------------------------------------+
| [📷 Ambil Foto (Kamera)]       [🖼️ Pilih dari Galeri]        |
+-------------------------------------------------------------+
| (Thumbnail Grid / Lightbox Preview)                          |
+-------------------------------------------------------------+
```

### 2.2 Operational Interaction Contract
1. **Camera Capture (`Ambil Foto (Kamera)`)**:
   - Triggers native mobile camera via `<input type="file" accept="image/*" capture="environment" />`.
   - Compresses photo client-side via `compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 })`.
   - Posts to `/api/marcom/uploads` multipart form.
   - Appends storage URL to `photoUrl` serialized string.
2. **Gallery Selection (`Pilih dari Galeri`)**:
   - Triggers native file picker via `<input type="file" accept="image/*" multiple />`.
   - Iterates, compresses, and uploads each file with live progress toast/badge.
3. **Photo Counter Badge**:
   - If `photos.length === 0`: Only the `"Foto Bukti Pemasangan"` label is displayed on the left.
   - If `photos.length > 0`: The green pill badge `"{photos.length} Foto Terlampir"` displays cleanly on the right of the header row.
4. **Thumbnail Grid & Actions**:
   - Renders each photo using `<AppImage />` with `#N` index pill.
   - Hover/tap reveals `Eye` (open full-screen lightbox modal) and `X` (delete photo from list).

---

## 3. Component & State Machine Mapping

### 3.1 Target File: `src/components/views/PlacementsView/PlacementPhotoUploader.tsx`

#### State to Eliminate:
- `const [showManualUrl, setShowManualUrl] = useState(false);`
- `const [manualUrlInput, setManualUrlInput] = useState("");`

#### Handler to Eliminate:
- `const handleAddManualUrl = () => { ... }`

#### JSX Elements to Eliminate:
1. **Toggle Button in Header**:
```tsx
// REMOVE:
<button
  type="button"
  onClick={() => setShowManualUrl((prev) => !prev)}
  className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
>
  <LinkIcon className="w-3 h-3" />
  <span>Tautan URL</span>
  {showManualUrl ? (
    <ChevronUp className="w-3 h-3" />
  ) : (
    <ChevronDown className="w-3 h-3" />
  )}
</button>
```

2. **Manual URL Input Container**:
```tsx
// REMOVE:
{showManualUrl && (
  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
    <input
      type="url"
      placeholder="Tempel tautan gambar https://..."
      value={manualUrlInput}
      onChange={(e) => setManualUrlInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddManualUrl();
        }
      }}
      disabled={disabled || isUploading}
      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
    />
    <button
      type="button"
      onClick={handleAddManualUrl}
      disabled={!manualUrlInput.trim() || disabled || isUploading}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Plus className="w-3 h-3" />
      <span>Tambah</span>
    </button>
  </div>
)}
```

#### Unused Imports to Purge:
- `Link as LinkIcon`, `ChevronDown`, `ChevronUp`, `Plus` from `lucide-react`.

#### Target Header Row Structure:
```tsx
{/* Label and Count Badge */}
<div className="flex items-center justify-between">
  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
    Foto Bukti Pemasangan
  </label>
  {photos.length > 0 && (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
      {photos.length} Foto Terlampir
    </span>
  )}
</div>
```

---

## 4. Invariants & Data Integrity

1. **SSOT Invariant**: `MarcomPlacement.photoUrl` string format remains unchanged. Handled transparently by `parsePlacementPhotos` and `serializePlacementPhotos`.
2. **Single-Tenant Invariant**: No workspace or tenant scoping leaks.
3. **Historical Compatibility**: Placements created prior to this change that contain valid image URLs remain 100% visible, selectable for lightbox, and removable via the existing thumbnail grid.
4. **Mandatory Evidence Rule**: Step 3 validation (`canAdvanceFromStep` in `Step3PhotoNotes.tsx`) continues to enforce that a placement cannot be marked `DONE` without at least 1 photo URL.

---

## 5. Acceptance Criteria

- [ ] `PlacementPhotoUploader.tsx` contains NO references to `"Tautan URL"`, `showManualUrl`, `manualUrlInput`, or `handleAddManualUrl`.
- [ ] Header row renders cleanly across mobile and desktop viewports with `"Foto Bukti Pemasangan"` on the left and `"{N} Foto Terlampir"` on the right (when photos exist).
- [ ] No unused Lucide icon imports remain (`LinkIcon`, `ChevronDown`, `ChevronUp`, `Plus`).
- [ ] Both camera and gallery upload action buttons trigger file inputs and handle multi-image upload with compression.
- [ ] Photo thumbnail preview grid, delete action, and lightbox preview function without regressions.
- [ ] Dedicated unit test suite `src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts` passes with 100% assertion coverage.
- [ ] `npm run drift:check` passes with zero violations (106/106 spec-plan pairs).
- [ ] `npm run build:check` passes with zero TypeScript errors.
- [ ] `npm test` and `npm run test:smoke` pass with zero failures.

---

## 6. Non-Goals

- Modifying the upload backend endpoint `/api/marcom/uploads/route.ts`.
- Altering the Step 3 execution status buttons (`Sedang Dikerjakan` / `Selesai Terpasang (DONE)`).
- Adding complex multi-tier cloud file pickers.

