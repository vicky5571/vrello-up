# ADR-0029: Eliminasi Total Google Drive & Standarisasi Dokumen MOU ke Internal Storage

## Status
ACCEPTED

## Date
2026-11-05

## Context & Problem Statement
Modul Marcom MOUs (`MousView`) mengelola dokumen hukum kerja sama (*Memorandum of Understanding*) antara perusahaan dan mitra outlet untuk sewa ruang promosi, kompensasi branding, dan pemasangan material POSM.

Sebelumnya, modul MOUs mengizinkan penggunaan tautan Google Drive:
1. Input form pada `MouFormModal.tsx` menyediakan field teks manual bertuliskan *"Document URL / Path"* dengan placeholder *"Auto-filled from upload, or enter /api/... or Google Drive URL"*.
2. Helper logika `mouDocumentHelpers.ts` secara khusus mendeteksi `drive.google.com` / `docs.google.com` dan memberikan label *"Google Drive"*.
3. Data seeder awal di `prisma/seed.ts` memuat tautan dummy Google Drive (`https://drive.google.com/file/d/...`).
4. Viewer modal `MouDocumentViewerModal.tsx` merender kartu peringatan tautan eksternal khusus Google Drive.

Hal ini menimbulkan masalah operasional serius:
- **Risiko Akses Terkunci**: Berkas legal yang disimpan di Google Drive personal staf rentan terhadap masalah perizinan (*permission denied / request access*), serta risiko berkas dipindahkan atau dihapus oleh pemilik drive pribadi.
- **Inkonsistensi Penyimpanan**: Modul MOUs sebenarnya sudah memiliki bucket penyimpanan internal di **Supabase Storage** (`mou-documents`) melalui API `POST /api/marcom/uploads`. Membiarkan staf menempel tautan Google Drive manual melemahkan standarisasi penyimpanan internal perusahaan.
- **Instruksi Pengguna**: Pengguna secara tegas menginstruksikan bahwa Google Drive **tidak dibutuhkan sama sekali** pada halaman MOUs dan tidak memerlukan *backward compatibility* terhadap tautan Google Drive warisan, melainkan langsung memperbarui data seed.

## Options Considered

### Opsi A: Standarisasi Total ke Supabase Storage & Re-Seed Database (TERPILIH)
- Menghapus tipe `EXTERNAL_URL`, deteksi `isGoogleDrive`, dan label *"Google Drive"* secara menyeluruh dari `mouDocumentHelpers.ts`.
- Tipe dokumen MOU disederhanakan murni menjadi: `INTERNAL_PDF`, `INTERNAL_IMAGE`, dan `EMPTY`.
- Menghapus input teks manual `Document URL / Path` di `MouFormModal.tsx`. Dokumen MOU hanya bisa diisi melalui upload berkas fisik langsung (PDF/Gambar maks 25MB) ke bucket Supabase Storage `mou-documents`.
- Mengganti tampilan form dengan **Active Document Card** yang bersih (menampilkan ikon dokumen, nama berkas bersih tanpa UUID, badge format, tombol pratinjau, tombol ganti berkas, dan tombol hapus).
- Menghapus kartu eksternal Google Drive di `MouDocumentViewerModal.tsx`.
- Memperbarui data seeder `prisma/seed.ts` sehingga seluruh berkas MOU menggunakan URL dokumen PDF internal resmi (`https://storage.marcom-internal.corp/mou-documents/...`).
- **Trade-off & Evaluasi**:
  - *Data Integrity*: Maksimal. Seluruh berkas MOU dijamin tersimpan terpusat di infrastruktur penyimpanan resmi.
  - *UX Simplicity*: Tidak ada kebingungan menempel URL mentah. Pengguna cukup upload file dan melihat kartu dokumen aktif.
  - *No Technical Debt*: Tidak ada kode warisan Google Drive yang tertinggal di modul MOUs.

### Opsi B: Hanya Menghapus Teks Placeholder Saja (Minimalis)
- Hanya menghapus frasa *"or Google Drive URL"* pada placeholder input form, tetapi membiarkan input teks manual dan logika parsing Google Drive tetap ada di helper.
- **Trade-off & Evaluasi**:
  - Buruk. Menolak arahan pengguna dan tetap membuka celah bagi staf untuk memasukkan link Google Drive personal.

## Decision
Kami memilih **Opsi A**. Kami mengeliminasi seluruh logika, antarmuka, dan data Google Drive dari modul MOUs, menstandarisasikan penyimpanan dokumen MOU ke Supabase Storage murni, dan memperbarui seluruh data seeder.

## Consequences

### Positif
- **Integritas Dokumen Terjamin**: Semua dokumen MOU tersimpan di bucket Supabase Storage internal perusahaan, menghilangkan insiden tautan Google Drive pribadi yang terkunci.
- **Form Bersih & Modern**: Form pembuatan/edit MOU kini menggunakan kartu berkas aktif yang rapi dengan preview instan, menggantikan input teks mentah.
- **Kode Lebih Sederhana**: Logika `mouDocumentHelpers.ts` dan `MouDocumentViewerModal.tsx` jauh lebih ringkas tanpa percabangan eksternal URL.
- **Seeder Konsisten**: Data seeder di `prisma/seed.ts` bersih dari tautan Google Drive dummy.

### Negatif / Trade-offs Diterima
- Pengguna tidak dapat menempelkan tautan dokumen sembarangan; seluruh dokumen MOU wajib diunggah sebagai berkas fisik PDF atau Gambar.

## Invariant Compliance
- [x] **SSOT Preserved**: Kolom `Mou.docPath` tetap menyimpan string URL berkas kanonik tanpa perubahan tipe data skema Prisma.
- [x] **No Single-Tenant Drift**: Nol workspace-isolation leaks.
- [x] **Verification Gate**: `npm run drift:check`, `npm run build:check`, dan `npm test` harus tetap lulus 100%.



