# ADR-0028: Sub-Komponen ContentMediaSection pada Modal Schedule New Post

## Status
ACCEPTED

## Date
2026-11-05

## Context & Problem Statement
Dalam modul Marcom Content Planner (`ContentPlannerView`), pengguna menjadwalkan dan merencanakan publikasi media sosial (Instagram, TikTok, YouTube Shorts, Facebook, X, LinkedIn) melalui modal pembuatan konten: **Schedule New Post** (`ContentPostModal.tsx`).

Saat ini terdapat disparitas visual dan pengalaman pengguna (UX) yang signifikan antara modal pembuatan konten baru dan drawer detail konten (`ContentDrawer.tsx`):
1. **Modal Create Kurang Interaktif**: Di dalam `ContentPostModal.tsx`, bagian media (baris 330–462) hanya menyediakan input teks URL polos (`https://drive.google.com/...`) dengan tautan teks kecil *"Tambah Media | Google Drive"*. Pengguna tidak memiliki tombol langsung untuk mengunggah dari perangkat (*Upload dari Perangkat*), tidak memiliki pratinjau showcase banner 16:9, dan tidak dapat melihat play button overlay seperti di drawer.
2. **Kaya Fitur di Drawer**: Di sisi lain, `ContentDrawer.tsx` memiliki antarmuka media footage yang sangat kaya: tombol direct upload ke Google Drive via `useDirectDriveUpload("content")`, progress bar streaming upload, showcase player 16:9 dengan cover thumbnail, indikator format video, serta drag-and-drop reordering.
3. **Kebutuhan Deadline Cepat**: Mengingat batas waktu rilis yang ketat, melakukan refaktor menyeluruh pada `ContentDrawer.tsx` (yang saat ini berukuran 1.048 LOC) berisiko menimbulkan regresi pada alur drawer yang sudah berjalan stabil.

## Options Considered

### Opsi A-Lite: Buat Sub-Komponen Mandiri `ContentMediaSection.tsx` & Tunda Refactor Drawer (TERPILIH)
- Mengekstrak pola media visual dari drawer ke dalam sub-komponen terisolasi baru: `src/components/views/ContentPlannerView/ContentMediaSection.tsx`.
- Memasang `ContentMediaSection` langsung ke dalam form modal `ContentPostModal.tsx` ("Schedule New Post").
- Membiarkan `ContentDrawer.tsx` apa adanya untuk sementara waktu demi zero-risk regresi dan kecepatan rilis.
- Mencatat penyatuan `ContentDrawer.tsx` ke dalam `ContentMediaSection.tsx` sebagai *Technical Debt* terencana.
- **Trade-off Summary**:
  - *Engineering Cleanliness*: Tinggi. `ContentPostModal.tsx` tetap ringkas tanpa membengkak menjadi 700+ LOC.
  - *Speed to Ship*: Maksimal. Tidak ada risiko tabrakan state atau regresi pada drawer yang sudah ada.
  - *User Experience*: Pengguna langsung mendapatkan pengalaman upload dan visual banner 16:9 saat membuat post baru.

### Opsi A-Full: Ekstraksi dan Refaktor Sekaligus pada Modal & Drawer
- Membuat `ContentMediaSection.tsx`, lalu merombak `ContentPostModal.tsx` DAN `ContentDrawer.tsx` sekaligus dalam satu sesi.
- **Trade-off Summary**:
  - Mengeliminasi duplikasi kode seketika, namun membawa risiko regresi tinggi pada `ContentDrawer.tsx` (1.048 LOC) yang memuat berbagai logika callback event dan live preview. Tidak cocok untuk deadline mendesak.

### Opsi C: Pure Copy-Paste Inline Dump ke dalam `ContentPostModal.tsx`
- Menyalin ~200 baris kode JSX dan state upload langsung ke dalam `ContentPostModal.tsx`.
- **Trade-off Summary**:
  - Anti-pattern berat. Membuat `ContentPostModal.tsx` membengkak melebihi batas koordinator/komponen yang sehat, rentan tabrakan penamaan state/ref, dan sulit untuk diuji secara mandiri.

## Decision
Kami memilih **Opsi A-Lite**. Kami membuat sub-komponen atomik teruji `ContentMediaSection.tsx` khusus untuk modul Content Planner, memasangnya pada `ContentPostModal.tsx`, dan secara sadar menunda migrasi `ContentDrawer.tsx` sebagai technical debt terdaftar.

## Consequences

### Positif
- **Paritas Pengalaman Pengguna**: Form pembuatan konten baru kini memiliki tombol *"Upload dari Perangkat"*, bar progress upload real-time, showcase banner 16:9, serta daftar lampiran berkas lengkap.
- **Kerapian Kode**: `ContentPostModal.tsx` tetap terjaga ringkas (< 450 LOC) karena logika file input, Google Drive upload streaming, dan drag-and-drop reorder dienkapsulasi di dalam `ContentMediaSection.tsx`.
- **Zero Risk Regresi**: Tidak ada perubahan baris kode pada `ContentDrawer.tsx`, menjamin kestabilan alur edit detail post yang sudah berjalan.

### Negatif / Technical Debt Diterima
- **Duplikasi Pola Presentasi**: `ContentDrawer.tsx` masih memuat markup media footage lama secara inline (baris 530–730) hingga sesi refaktor mendatang dieksekusi.
- **Tracked Technical Debt**:
  - `DEBT-CP-001`: Refaktor `ContentDrawer.tsx` untuk menggunakan kembali `ContentMediaSection.tsx` dan pangkas ukurannya dari 1.048 LOC ke < 850 LOC.

## Invariant Compliance
- [x] **SSOT Preserved**: Tipe `TaskAttachment` kanonik dari `src/types/index.ts` digunakan secara konsisten.
- [x] **Component Boundary**: Sub-komponen modular terisolasi dalam direktori modul yang sama (`ContentPlannerView`).
- [x] **No Single-Tenant Drift**: Tidak ada workspace isolation leakage.
- [x] **Verification Gate**: `npm run drift:check`, `npm run build:check`, dan `npm test` wajib 100% lolos.



