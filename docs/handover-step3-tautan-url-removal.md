# Handover: Step 3 Direct Physical Photo Upload Enforcement and Tautan URL Removal

- **Status:** Execution-Ready
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0079-step3-tautan-url-removal.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-step3-tautan-url-removal-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-step3-tautan-url-removal.md`

---

## 1. Target Files & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/PlacementPhotoUploader.tsx` | Main photo uploader component in Step 3 where "Tautan URL" is removed |
| `src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts` | Dedicated unit test suite verifying removal of manual URL and preservation of physical camera/gallery uploads |

---

## 2. Exact Current Code Snippets & Modifications

### In `src/components/views/PlacementsView/PlacementPhotoUploader.tsx`:

#### A. Lucide Icon Imports (Lines 5–15)
**Current:**
```tsx
import {
  Camera,
  Image as ImageIcon,
  X,
  Eye,
  Loader2,
  Plus,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
```
**Change:**
Delete `Plus`, `Link as LinkIcon`, `ChevronDown`, `ChevronUp`.
**Result:**
```tsx
import {
  Camera,
  Image as ImageIcon,
  X,
  Eye,
  Loader2,
} from "lucide-react";
```

#### B. Component States (Lines 42–43)
**Current:**
```tsx
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState("");
```
**Change:**
Delete both state declarations completely.

#### C. Manual URL Handler (Lines 119–130)
**Current:**
```tsx
  const handleAddManualUrl = () => {
    const trimmed = manualUrlInput.trim();
    if (!trimmed) return;
    if (photos.includes(trimmed)) {
      toast.warning("URL foto sudah ada dalam daftar");
      return;
    }
    const next = [...photos, trimmed];
    onChange(serializePlacementPhotos(next));
    setManualUrlInput("");
    toast.success("Tautan foto ditambahkan");
  };
```
**Change:**
Delete the entire `handleAddManualUrl` function.

#### D. Label Row & Tautan URL Toggle Button (Lines 154–179)
**Current:**
```tsx
      {/* Label and Count Badge */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Foto Bukti Pemasangan
        </label>
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
              {photos.length} Foto Terlampir
            </span>
          )}
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
        </div>
      </div>
```
**Change:**
Remove the `<button ...>...</button>` element and unwrap the right side if only `{photos.length > 0 && ...}` remains:
**Result:**
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

#### E. Collapsible URL Input Block (Lines 228–255)
**Current:**
```tsx
      {/* Optional Manual URL Input */}
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
**Change:**
Delete this entire block completely.

---

## 3. Explicit "Do Not Touch" List

1. **`cameraInputRef` and `galleryInputRef` file inputs (Lines 134–152)**:
   - Must NOT be touched. `capture="environment"` and `multiple` attributes are critical for mobile camera and gallery picking.
2. **`handleFiles` upload pipeline (Lines 48–110)**:
   - Must NOT be touched. Handles image compression (`compressImage`), multipart upload to `/api/marcom/uploads`, error toasts, and serialization via `serializePlacementPhotos`.
3. **`handleRemovePhoto` (Lines 112–117)**:
   - Must NOT be touched. Manages deleting individual photos from the attached photo list.
4. **Photo Gallery Grid & Lightbox (Lines 257–330)**:
   - Must NOT be touched. Renders thumbnail previews with `<AppImage fill sizes="thumbnail" />`, index counters, delete overlays, and full-screen lightbox modal.
5. **Parent Wizard Component (`Step3PhotoNotes.tsx`)**:
   - Must NOT be touched. Props interface remains identical (`photoUrl`, `onChange`, `placementId`, `disabled`).

---

## 4. Numbered Execution Order

1. **Step 1**: Write failing unit test in `src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts`. Run with `node --import tsx --test` to confirm RED failure.
2. **Step 2**: Apply changes A through E to `src/components/views/PlacementsView/PlacementPhotoUploader.tsx`.
3. **Step 3**: Re-run unit test to verify GREEN (all pass).
4. **Step 4**: Run `npm run build:check` (0 errors).
5. **Step 5**: Run `npm run drift:check` (106/106 pairs, 0 drift).
6. **Step 6**: Run `npm run test:smoke` and `npm test`.
7. **Step 7**: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
8. **Step 8**: Commit git changes.

---

## 5. Acceptance Criteria Checklist

- [ ] Zero instances of `"Tautan URL"` in `PlacementPhotoUploader.tsx`.
- [ ] Zero instances of `showManualUrl`, `manualUrlInput`, or `handleAddManualUrl`.
- [ ] No unused Lucide imports (`Link as LinkIcon`, `ChevronDown`, `ChevronUp`, `Plus`).
- [ ] Header row renders cleanly: label on the left, badge on the right.
- [ ] Camera and Gallery buttons remain 100% operational.
- [ ] Thumbnail previews and lightbox modal remain intact.
- [ ] All verification commands (`drift:check`, `build:check`, `test:smoke`, `npm test`) pass with 0 failures.

