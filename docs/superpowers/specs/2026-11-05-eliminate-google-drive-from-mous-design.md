# Specification: Eliminasi Total Google Drive & Standarisasi Dokumen MOU ke Internal Storage

## Status
IMPLEMENTED (ADR-0029)

## Date
2026-11-05

## 1. Executive Summary
Spesifikasi ini mendefinisikan eliminasi total dukungan Google Drive dari modul Marcom MOUs (`MousView`). Dokumen perjanjian kemitraan MOU distandarisasikan 100% menggunakan penyimpanan terpusat **Supabase Storage** (`mou-documents`). Form modal pembuatan/edit MOU dirombak untuk meniadakan input URL teks mentah dan menggantinya dengan kartu berkas aktif (*Active Document Card*), logika parser `mouDocumentHelpers.ts` dibersihkan dari seluruh percabangan `isGoogleDrive`/`EXTERNAL_URL`, dan seluruh data seeder `prisma/seed.ts` diperbarui dengan URL berkas PDF internal resmi.

---

## 2. Problem Statement & User Flow

### 2.1 The Problem
Pada implementasi sebelumnya di modul MOUs:
1. `MouFormModal.tsx` memuat field teks manual `Document URL / Path` dengan placeholder *"Auto-filled from upload, or enter /api/... or Google Drive URL"*. Hal ini mendorong staf lapangan untuk menempelkan link Google Drive milik akun personal mereka alih-alih mengunggah dokumen fisik ke sistem internal.
2. Link Google Drive personal sering kali mengalami kendala izin akses (*permission denied*), hilang saat akun staf non-aktif, atau dipindahkan folder-nya.
3. `mouDocumentHelpers.ts` memuat kode khusus untuk mendeteksi `drive.google.com` dan melabelinya sebagai *"Google Drive"*.
4. Data seed di `prisma/seed.ts` memuat tautan dummy Google Drive yang tidak relevan.

### 2.2 Target User Experience
1. **Membuka Form MOU (Baru / Edit)**: Pengguna membuka `MouFormModal`.
2. **Kondisi Tanpa Dokumen (*Empty State*)**:
   - Bagian dokumen menampilkan tombol bersih: **"Upload Dokumen MOU (PDF atau Gambar, maks 25MB)"** dengan ikon upload.
   - Tidak ada lagi input teks manual yang meminta URL atau menyebutkan Google Drive.
3. **Mengunggah Dokumen**:
   - Pengguna memilih berkas PDF atau gambar (JPG/PNG/WEBP) dari perangkat lokal.
   - Berkas diunggah via `POST /api/marcom/uploads` ke bucket Supabase Storage `mou-documents`.
   - Menampilkan indikator loading *"Uploading..."*.
4. **Kondisi Dokumen Terunggah (*Attached State*)**:
   - Menampilkan **Active Document Card** yang rapi:
     - Ikon file (PDF atau Gambar).
     - Nama berkas bersih tanpa prefix UUID (misal: `PKS_Sewa_Fascia_Outlet_Sentosa.pdf`).
     - Badge format dokumen (`DOKUMEN PDF` atau `GAMBAR SCAN`).
     - Tombol **"Pratinjau"**: membuka modal preview internal ([`MouDocumentViewerModal`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/MousView/MouDocumentViewerModal.tsx)).
     - Tombol **"Ganti Berkas"**: memicu pemilihan berkas baru.
     - Tombol **"Hapus"**: membersihkan dokumen dari state form.
5. **Pratinjau Dokumen**:
   - `MouDocumentViewerModal` langsung merender viewer PDF atau lightbox gambar secara internal tanpa ada peringatan tautan Google Drive eksternal.

---

## 3. Component Manifest & Architectural Contracts

| Komponen / Modul | Path File | Tanggung Jawab |
|---|---|---|
| `mouDocumentHelpers.ts` | `src/components/views/MousView/mouDocumentHelpers.ts` | Pure functions untuk klasifikasi berkas (`INTERNAL_PDF`, `INTERNAL_IMAGE`, `EMPTY`), pembersihan nama berkas UUID, dan pembentukan URL download. Menghapus seluruh percabangan `isGoogleDrive` dan `EXTERNAL_URL`. |
| `mouDocumentHelpers.test.ts` | `src/components/views/MousView/mouDocumentHelpers.test.ts` | Test suite untuk memvalidasi parser dokumen internal tanpa Google Drive. |
| `MouFormModal.tsx` | `src/components/views/MousView/MouFormModal.tsx` | Form modal MOU. Menghapus input teks URL mentah, menerapkan Active Document Card, dan memicu upload Supabase Storage murni. |
| `MouDocumentViewerModal.tsx` | `src/components/views/MousView/MouDocumentViewerModal.tsx` | Modal viewer dokumen internal (PDF & Image). Menghapus fallback card Google Drive eksternal. |
| `seed.ts` | `prisma/seed.ts` | Data seeder; mengganti seluruh URL dummy Google Drive dengan URL storage internal resmi. |

---

## 4. Pure Logic & Data Contracts

### 4.1 Tipe Dokumen MOU Baru (`src/components/views/MousView/mouDocumentHelpers.ts`)
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

### 4.2 Logika Parsing Dokumen
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
  const cleanName = extractCleanFilename(raw) || fallbackTitle || "dokumen-mou";
  const downloadUrl = raw.includes("?") ? `${raw}&download=1` : `${raw}?download=1`;

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

  // Default atau file .pdf dianggap sebagai dokumen PDF resmi
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

### 4.3 Restrukturisasi UI di `MouFormModal.tsx`
Menghapus input teks manual:
```tsx
{/* SEBELUM: Teks input URL manual yang mengizinkan paste Google Drive */}
<input
  id="mou-doc-path"
  type="text"
  placeholder="Auto-filled from upload, or enter /api/... or Google Drive URL"
  value={modalMou.docPath || ""}
  onChange={(e) => setModalMou({ ...modalMou, docPath: e.target.value })}
/>

{/* SESUDAH: Active Document Card murni */}
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
      <button
        type="button"
        onClick={() => onTestPreview?.(modalMou as MarcomMou)}
        className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 rounded-lg cursor-pointer"
      >
        Pratinjau
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-2.5 py-1 text-xs font-semibold text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg cursor-pointer"
      >
        Ganti
      </button>
      <button
        type="button"
        onClick={() => setModalMou({ ...modalMou, docPath: "" })}
        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
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
    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-fuchsia-500 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-fuchsia-600 hover:bg-fuchsia-50/20 transition-all cursor-pointer"
  >
    <Upload className="w-4 h-4 text-fuchsia-600" />
    <span>Upload Dokumen MOU (PDF atau Gambar, maks 25MB)</span>
  </button>
)}
```

---

### 4.4 Pembaruan Seeder Database (`prisma/seed.ts`)
Mengganti seluruh tautan dummy Google Drive di `seedMous()`:
```typescript
// SEBELUM:
docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_exp_001/view",
docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_soon_002/view",
docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_sub_003/view",
docPath: "https://drive.google.com/file/d/1A8x9yZ_mou_hlth_004/view",

// SESUDAH:
docPath: "https://storage.marcom-internal.corp/mou-documents/PKS_Warung_Berkah_Abadi_2025.pdf",
docPath: "https://storage.marcom-internal.corp/mou-documents/MOU_Campus_UGM_Canopy_2026.pdf",
docPath: "https://storage.marcom-internal.corp/mou-documents/PKS_Dewata_Selular_Flagship_2026.pdf",
docPath: "https://storage.marcom-internal.corp/mou-documents/MOU_Solo_Megah_Branding_2026.pdf",
```

---

## 5. Non-Goals
1. **Tidak Mengubah Skema Kolom Prisma**: Kolom `docPath` tetap ada sebagai string URL publik.
2. **Tidak Mengubah Modul Lain**: Modul Content Planner atau Events yang memang memakai Google Drive cloud archiving tidak terdampak. Perubahan ini strictly terisolasi untuk MOUs.

---

## 6. Acceptance Criteria
- [ ] Tidak ada lagi string `drive.google.com` atau `docs.google.com` di seluruh folder `src/components/views/MousView/`.
- [ ] `MouFormModal.tsx` tidak memiliki input teks URL manual.
- [ ] Form menampilkan Active Document Card dengan aksi Pratinjau, Ganti, dan Hapus.
- [ ] `MouDocumentViewerModal.tsx` hanya merender pratinjau dokumen internal.
- [ ] Seeder `prisma/seed.ts` bersih dari link Google Drive dan berhasil dijalankan via `npx prisma db seed`.
- [ ] Seluruh unit test di `mouDocumentHelpers.test.ts` lulus 100%.
- [ ] `npm run drift:check`, `npm run build:check`, dan `npm test` semuanya lulus tanpa error.



