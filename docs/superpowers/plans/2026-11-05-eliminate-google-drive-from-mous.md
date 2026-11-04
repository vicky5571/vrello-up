# Implementation Plan: Eliminasi Total Google Drive & Standarisasi Dokumen MOU ke Internal Storage

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-eliminate-google-drive-from-mous-design.md`  
**ADR:** `docs/adr/0029-eliminate-google-drive-from-mous.md`  
**Status:** READY TO IMPLEMENT

---

## 1. Plan Overview & Objectives
Membersihkan seluruh ketergantungan dan referensi Google Drive dari modul MOUs dan menstandarisasikan penyimpanan dokumen MOU ke Supabase Storage:
1. **Core Parser**: Sederhanakan `mouDocumentHelpers.ts` menjadi murni `INTERNAL_PDF`, `INTERNAL_IMAGE`, dan `EMPTY`. Hapus `isGoogleDrive`, label Google Drive, dan tipe `EXTERNAL_URL`.
2. **Modal Form UI**: Hapus input teks mentah `Document URL / Path` di `MouFormModal.tsx` dan terapkan Active Document Card yang bersih.
3. **Modal Viewer UI**: Bersihkan fallback card Google Drive dari `MouDocumentViewerModal.tsx`.
4. **Database Seeder**: Ganti seluruh tautan dummy Google Drive di `prisma/seed.ts` dengan URL storage internal korporat, lalu jalankan `npx prisma db seed`.
5. **Testing & Invariants**: Perbarui unit test di `mouDocumentHelpers.test.ts` dan loloskan seluruh gerbang verifikasi.

---

## 2. File Manifest & Responsibility Breakdown

| File Path | Action | Estimated LOC Change | Responsibility |
|---|---|---|---|
| `src/components/views/MousView/mouDocumentHelpers.ts` | Modify | +15 / -40 LOC | Hapus `isGoogleDrive`, `EXTERNAL_URL`, dan sederhanakan parser dokumen. |
| `src/components/views/MousView/mouDocumentHelpers.test.ts` | Modify | +20 / -35 LOC | Hapus test Google Drive dan sesuaikan pengujian untuk berkas internal. |
| `src/components/views/MousView/MouFormModal.tsx` | Modify | +40 / -30 LOC | Hapus input teks URL manual, pasang Active Document Card dengan aksi Pratinjau, Ganti, dan Hapus. |
| `src/components/views/MousView/MouDocumentViewerModal.tsx` | Modify | +5 / -35 LOC | Hapus card eksternal Google Drive. |
| `prisma/seed.ts` | Modify | +10 / -10 LOC | Ganti dummy Google Drive link dengan URL internal PDF resmi. |

---

## 3. Risks & Mitigations

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Broken link pada data seeded lama | Rendah | Rendah | Seeder `prisma/seed.ts` diperbarui dan di-reseed langsung (`npx prisma db seed`). |
| User bingung cara input dokumen tanpa text input | Rendah | Rendah | Active Document Card menyediakan tombol upload jelas dengan indikator format & preview. |
| Regresi pada modal detail outlet / placement | Rendah | Rendah | Kolom `docPath` tetap berupa string URL yang sama, sehingga drawer lain yang membaca `mou.docPath` tetap berfungsi normal. |

---

## 4. Phase 1: Pembersihan Core Logic & Parser Dokumen

### Tasks:
- [ ] **1.1 Perbarui `src/components/views/MousView/mouDocumentHelpers.ts`**:
  - Hapus `EXTERNAL_URL` dari `MouDocumentType`.
  - Hapus pengecekan `isExternalUrl` dan `isGoogleDrive`.
  - Logika parser mengembalikan `INTERNAL_IMAGE` untuk ekstensi gambar, atau `INTERNAL_PDF` untuk berkas lainnya.
  - Hapus penamaan berkas `(Google Drive)`.
- [ ] **1.2 Perbarui Unit Test `src/components/views/MousView/mouDocumentHelpers.test.ts`**:
  - Hapus test `parses Google Drive link as EXTERNAL_URL` dan `formatDocumentLabel Google Drive`.
  - Tambahkan assertion bahwa dokumen di-parse sebagai `INTERNAL_PDF` atau `INTERNAL_IMAGE`.
  - Jalankan test: `node --test src/components/views/MousView/mouDocumentHelpers.test.ts`.

**Phase 1 Verification:**
- Unit test helper parser lolos dengan 0 kegagalan.

---

## 5. Phase 2: Restrukturisasi UI Modal Form & Viewer

### Tasks:
- [ ] **2.1 Modifikasi `src/components/views/MousView/MouFormModal.tsx`**:
  - Hapus input teks manual `Document URL / Path`.
  - Pasang **Active Document Card**:
    - Jika `modalMou.docPath`: Tampilkan kartu dengan ikon dokumen, nama file bersih (`extractCleanFilename`), badge tipe dokumen, tombol *Pratinjau*, tombol *Ganti Berkas*, dan tombol *Hapus*.
    - Jika `!modalMou.docPath`: Tampilkan area tombol upload berkas langsung ke Supabase Storage.
- [ ] **2.2 Modifikasi `src/components/views/MousView/MouDocumentViewerModal.tsx`**:
  - Hapus cabang render kartu peringatan tautan Google Drive eksternal.
  - Sederhanakan viewer untuk hanya merender PDF viewer atau Image lightbox.

**Phase 2 Verification:**
- Buka form MOU baru di UI: pastikan tidak ada input teks Google Drive URL.
- Upload file PDF/gambar: kartu dokumen aktif muncul dengan benar dan tombol Pratinjau membuka viewer internal.

---

## 6. Phase 3: Pembaruan Seeder Database & Verifikasi Sistem

### Tasks:
- [ ] **3.1 Perbarui `prisma/seed.ts`**:
  - Ganti seluruh link `https://drive.google.com/file/d/...` pada `seedMous()` dengan URL internal korporat:
    - `https://storage.marcom-internal.corp/mou-documents/PKS_Warung_Berkah_Abadi_2025.pdf`
    - `https://storage.marcom-internal.corp/mou-documents/MOU_Campus_UGM_Canopy_2026.pdf`
    - `https://storage.marcom-internal.corp/mou-documents/PKS_Dewata_Selular_Flagship_2026.pdf`
    - `https://storage.marcom-internal.corp/mou-documents/MOU_Solo_Megah_Branding_2026.pdf`
- [ ] **3.2 Jalankan Seeder Database**:
  - `npx prisma db seed`
- [ ] **3.3 Jalankan Invariant & Test Verification**:
  - `npm run drift:check` (56 spec-plan pairs)
  - `npm run build:check` (0 error TypeScript)
  - `npm test` (0 failures)

---

## 7. Invariant Compliance Checklist

- [ ] **Single-Tenant**: Nol workspace isolation leakage.
- [ ] **SSOT**: Tipe `Mou` dan `MarcomMou` tetap konsisten menggunakan `docPath`.
- [ ] **Zero Google Drive references**: Tidak ada string `drive.google.com` yang tersisa di `MousView`.
- [ ] **Verification Gates**:
  - `npm run drift:check` PASS (56 spec-plan pairs)
  - `npm test` PASS (778+ tests, 0 failures)
  - `npm run build:check` PASS (0 TypeScript errors)



