# Handover: Eliminasi Total Google Drive & Standarisasi Dokumen MOU ke Internal Storage

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-eliminate-google-drive-from-mous-design.md`  
**Plan:** `docs/superpowers/plans/2026-11-05-eliminate-google-drive-from-mous.md`  
**ADR:** `docs/adr/0029-eliminate-google-drive-from-mous.md`  
**Status:** READY TO EXECUTE

---

## 1. File Manifest & One-Line Purpose

1. `src/components/views/MousView/mouDocumentHelpers.ts`: Pure parser helper dokumen MOU; menghapus `isGoogleDrive`, `EXTERNAL_URL`, dan menyederhanakan klasifikasi berkas ke storage internal.
2. `src/components/views/MousView/mouDocumentHelpers.test.ts`: Unit test helper dokumen; menghapus test case Google Drive eksternal.
3. `src/components/views/MousView/MouFormModal.tsx`: Form modal MOU; menghapus input teks URL mentah dan memasang Active Document Card.
4. `src/components/views/MousView/MouDocumentViewerModal.tsx`: Modal viewer dokumen MOU; membersihkan fallback card tautan eksternal.
5. `prisma/seed.ts`: Data seeder; mengganti URL dummy Google Drive dengan URL storage PDF internal resmi.

---

## 2. Exact Current Code Snippets (As-Is)

### 2.1 Current Types & Helper di `src/components/views/MousView/mouDocumentHelpers.ts` (baris 6–20 & 94–112):
```typescript
export type MouDocumentType =
  | "INTERNAL_PDF"
  | "INTERNAL_IMAGE"
  | "EXTERNAL_URL"
  | "EMPTY";

export interface ParsedMouDocument {
  type: MouDocumentType;
  rawPath: string;
  previewUrl: string;
  downloadUrl: string;
  filename: string;
  isExternal: boolean;
  label: string;
}
```
dan logika Google Drive:
```typescript
  if (isExternal) {
    const isGoogleDrive =
      raw.includes("drive.google.com") || raw.includes("docs.google.com");
    const filename = isGoogleDrive
      ? fallbackTitle
        ? `${fallbackTitle} (Google Drive)`
        : "Dokumen Google Drive"
      : extractCleanFilename(raw) || fallbackTitle || "Dokumen Eksternal";

    return {
      type: "EXTERNAL_URL",
      rawPath: raw,
      previewUrl: raw,
      downloadUrl: raw,
      filename,
      isExternal: true,
      label: isGoogleDrive ? "Google Drive" : "Tautan Eksternal",
    };
  }
```

### 2.2 Current Form UI di `src/components/views/MousView/MouFormModal.tsx` (baris 541–565):
```tsx
          <div>
            <label
              htmlFor="mou-doc-path"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Document URL / Path
            </label>
            <input
              id="mou-doc-path"
              type="text"
              placeholder="Auto-filled from upload, or enter /api/... or Google Drive URL"
              value={modalMou.docPath || ""}
              onChange={(e) => setModalMou({ ...modalMou, docPath: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
            />
            {modalMou.docPath && (
              <div className="mt-1.5 flex items-center gap-2">
                {(() => {
                  const p = parseMouDocumentSource(modalMou.docPath, modalMou.partnerName);
                  return (
                    <>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 font-medium">
                        {p.label}
                      </span>
```

### 2.3 Current Viewer Fallback di `src/components/views/MousView/MouDocumentViewerModal.tsx` (baris 190–218):
```tsx
          ) : (
            // EXTERNAL_URL (e.g. Google Drive)
            <div className="p-8 text-center max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <ExternalLink className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Dokumen Disimpan di Penyimpanan Eksternal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Berkas MOU ini tersimpan di tautan digital eksternal ({parsed.label}).
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 break-all text-left">
                  {parsed.rawPath}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <a
                  href={parsed.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru ({parsed.label})</span>
                </a>
              </div>
            </div>
          )}
```

### 2.4 Current Seeder di `prisma/seed.ts` (baris 408–465):
```typescript
      docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_exp_001/view",
...
      docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_soon_002/view",
...
      docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_sub_003/view",
...
      docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_hlth_004/view",
```

---

## 3. Exact Change Instructions

### Step 1: Modifikasi `src/components/views/MousView/mouDocumentHelpers.ts`
1. Sederhanakan tipe:
   ```typescript
   export type MouDocumentType =
     | "INTERNAL_PDF"
     | "INTERNAL_IMAGE"
     | "EMPTY";

   export interface ParsedMouDocument {
     type: MouDocumentType;
     rawPath: string;
     previewUrl: string;
     downloadUrl: string;
     filename: string;
     label: string;
   }
   ```
2. Hapus fungsi `isExternalUrl` dan pengecekan `isGoogleDrive`.
3. Perbarui `parseMouDocumentSource`:
   ```typescript
   export function parseMouDocumentSource(
     docPath: string | null | undefined,
     fallbackTitle?: string,
   ): ParsedMouDocument {
     if (!docPath || typeof docPath !== "string") {
       return {
         type: "EMPTY",
         rawPath: "",
         previewUrl: "",
         downloadUrl: "",
         filename: "",
         label: "Tidak ada berkas",
       };
     }

     const raw = docPath.trim();
     if (!raw || raw === "—" || raw === "-") {
       return {
         type: "EMPTY",
         rawPath: "",
         previewUrl: "",
         downloadUrl: "",
         filename: "",
         label: "Tidak ada berkas",
       };
     }

     const ext = getFileExtension(raw);
     const cleanName =
       extractCleanFilename(raw) || fallbackTitle || "dokumen-mou";
     const downloadUrl = raw.includes("?")
       ? `${raw}&download=1`
       : `${raw}?download=1`;

     if (IMAGE_EXTENSIONS.has(ext)) {
       return {
         type: "INTERNAL_IMAGE",
         rawPath: raw,
         previewUrl: raw,
         downloadUrl,
         filename: cleanName,
         label: "Gambar Scan",
       };
     }

     return {
       type: "INTERNAL_PDF",
       rawPath: raw,
       previewUrl: raw,
       downloadUrl,
       filename: cleanName.endsWith(".pdf") ? cleanName : `${cleanName}.pdf`,
       label: "Dokumen PDF",
     };
   }
   ```

---

### Step 2: Modifikasi `src/components/views/MousView/mouDocumentHelpers.test.ts`
1. Hapus test case yang menguji `drive.google.com` dan `isExternalUrl`.
2. Pastikan pengujian memvalidasi `INTERNAL_PDF` dan `INTERNAL_IMAGE`.

---

### Step 3: Modifikasi `src/components/views/MousView/MouFormModal.tsx`
1. Tambahkan `useRef<HTMLInputElement>` untuk trigger picker file lokal jika belum ada.
2. Hapus blok input teks `mou-doc-path` (baris 541–585).
3. Pasang Active Document Card:
   ```tsx
   <div>
     <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
       Dokumen MOU (Supabase Storage)
     </label>
     <input
       ref={fileInputRef}
       type="file"
       accept="application/pdf,image/*"
       onChange={handleFileUpload}
       disabled={isUploading}
       className="hidden"
     />

     {modalMou.docPath ? (
       <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
         <div className="flex items-center gap-2.5 min-w-0">
           <div className="w-8 h-8 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0 border border-fuchsia-200/50">
             <FileText className="w-4 h-4" />
           </div>
           <div className="min-w-0">
             <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
               {extractCleanFilename(modalMou.docPath) || "Dokumen MOU Terunggah"}
             </p>
             <span className="text-[10px] text-fuchsia-600 dark:text-fuchsia-400 font-medium">
               Tersimpan di Supabase Storage
             </span>
           </div>
         </div>
         <div className="flex items-center gap-1.5 shrink-0">
           {onTestPreview && (
             <button
               type="button"
               onClick={() => onTestPreview(modalMou as MarcomMou)}
               className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
             >
               Pratinjau
             </button>
           )}
           <button
             type="button"
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
             className="px-2.5 py-1 text-xs font-semibold text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
           >
             Ganti
           </button>
           <button
             type="button"
             onClick={() => setModalMou({ ...modalMou, docPath: "" })}
             className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
             title="Hapus dokumen"
           >
             <X className="w-4 h-4" />
           </button>
         </div>
       </div>
     ) : (
       <button
         type="button"
         onClick={() => fileInputRef.current?.click()}
         disabled={isUploading}
         className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-fuchsia-500 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-fuchsia-600 hover:bg-fuchsia-50/20 transition-all cursor-pointer disabled:opacity-50"
       >
         <Upload className="w-4 h-4 text-fuchsia-600" />
         <span>{isUploading ? "Mengunggah..." : "Upload Dokumen MOU (PDF atau Gambar, maks 25MB)"}</span>
       </button>
     )}
   </div>
   ```

---

### Step 4: Modifikasi `src/components/views/MousView/MouDocumentViewerModal.tsx`
Hapus percabangan render card eksternal (baris 190–218).

---

### Step 5: Modifikasi `prisma/seed.ts`
Ganti 4 tautan dummy Google Drive:
```typescript
      docPath: "https://storage.marcom-internal.corp/mou-documents/PKS_Warung_Berkah_Abadi_2025.pdf",
...
      docPath: "https://storage.marcom-internal.corp/mou-documents/MOU_Campus_UGM_Canopy_2026.pdf",
...
      docPath: "https://storage.marcom-internal.corp/mou-documents/PKS_Dewata_Selular_Flagship_2026.pdf",
...
      docPath: "https://storage.marcom-internal.corp/mou-documents/MOU_Solo_Megah_Branding_2026.pdf",
```

---

## 4. Explicit "Do Not Touch" List

1. **`prisma/schema.prisma`**: JANGAN lakukan alter kolom atau hapus kolom `docPath`. Kolom tetap bertipe `String` untuk menyimpan URL publik Supabase Storage.
2. **`src/app/api/marcom/uploads/route.ts`**: JANGAN ubah mapping `mou-documents` $\rightarrow$ `mou-documents` bucket.
3. **`src/components/views/OutletsView/Outlet360Drawer.tsx`**: JANGAN ubah parsing `docPath` di outlet drawer.

---

## 5. Numbered Execution Order

1. **Step 1**: Terapkan modifikasi `src/components/views/MousView/mouDocumentHelpers.ts`.
2. **Step 2**: Perbarui unit test `src/components/views/MousView/mouDocumentHelpers.test.ts`.
3. **Step 3**: Terapkan Active Document Card pada `src/components/views/MousView/MouFormModal.tsx`.
4. **Step 4**: Bersihkan fallback eksternal di `src/components/views/MousView/MouDocumentViewerModal.tsx`.
5. **Step 5**: Perbarui seeder `prisma/seed.ts` dan jalankan `npx prisma db seed`.
6. **Step 6**: Jalankan targeted unit test:
   `node --test src/components/views/MousView/mouDocumentHelpers.test.ts`
7. **Step 7**: Jalankan full verification suite:
   - `npm run drift:check`
   - `npm run build:check`
   - `npm test`
8. **Step 8**: Update `docs/SESSION_STATE.md` dan commit perubahan.

---

## 6. Acceptance Criteria Checklist

- [ ] Tidak ada lagi keyword `drive.google.com` atau `docs.google.com` di folder `src/components/views/MousView/`.
- [ ] `MouFormModal.tsx` bebas dari input teks URL manual.
- [ ] Form modal MOU memiliki Active Document Card dengan aksi Pratinjau, Ganti, dan Hapus.
- [ ] Dokumen yang diunggah tersimpan rapi di Supabase Storage (`mou-documents`).
- [ ] Data seed `prisma/seed.ts` bersih dari tautan Google Drive dan sukses di-seed ulang.
- [ ] Targeted unit test `mouDocumentHelpers.test.ts` lolos 100%.
- [ ] Invariant check `npm run drift:check` mengonfirmasi 56 spec-plan pairs dan 0 drift.
- [ ] `npm run build:check` lolos dengan 0 error TypeScript.
- [ ] `npm test` lolos dengan 0 test gagal.



