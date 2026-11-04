# ADR-0027: Integrasi EventMediaSection ke Modal Buat Event Baru (EventCreateModal)

## Status
ACCEPTED

## Date
2026-11-05

## Context & Problem Statement
Dalam modul Marcom Field Events (`EventsView`), tim lapangan dan koordinator promosi membuat event lapangan baru melalui modal `EventCreateModal.tsx`. 

Saat ini, `EventCreateModal.tsx` memiliki keterbatasan fungsional:
1. **Media Attachments Ter-hardcode Kosong**: Pada saat pengiriman form (`handleSubmit`), payload dikirim dengan `mediaAttachments: []` (baris 187 dan 218). Pengguna tidak memiliki opsi untuk mengunggah materi visual, poster promosi, atau folder Google Drive dokumentasi saat awal event dibuat.
2. **Inkonsistensi Komponen**: Di sisi lain, komponen detail slide drawer (`EventDrawer.tsx`) telah memecah pengelolaan media ke dalam sub-komponen atomik teruji `EventMediaSection.tsx` (ADR-0021 & ADR-0022). Komponen ini mendukung Google Drive direct upload via `useDirectDriveUpload("events")`, input tautan folder shared Google Drive, pemilihan cover photo/video hero, preview thumbnail, serta drag-and-drop reordering.
3. **Kesiapan Backend**: Endpoint API `POST /api/marcom/events` dan skema database Prisma (`FieldEvent.mediaAttachments Json @default("[]")`) telah 100% mendukung penyimpanan array `TaskAttachment[]` sejak implementasi ADR-0021. Ketiadaan input media di `EventCreateModal` murni merupakan disparitas UI frontend.

## Options Considered

### Opsi A: Integrasi Penuh Sub-Komponen `EventMediaSection` (TERPILIH)
- Mengimpor dan me-mount `EventMediaSection` yang sudah ada (`src/components/views/EventsView/EventMediaSection.tsx`) langsung ke dalam form `EventCreateModal.tsx`.
- Mengelola state lokal `mediaAttachments` (`TaskAttachment[]`) dan `mediaUrl` (`string`) di dalam `EventCreateModal`.
- Mengirimkan `mediaAttachments` dan `mediaUrl` riil ke API `POST /api/marcom/events`, serta menyertakannya pada objek `createdItem` callback `onCreated(createdItem)`.
- **Trade-off & Evaluasi**:
  - *Engineering Cleanliness*: Maksimal. Mengikuti prinsip DRY dan Strangler Pattern. Tidak ada duplikasi logika upload Google Drive atau parser folder link.
  - *UX Consistency*: 100% identik dengan alur di `EventDrawer.tsx` (termasuk direct drive upload, progress bar, cover selection, dan folder badge).
  - *Maintainability*: Perubahan fitur upload di masa mendatang otomatis dinikmati oleh create modal dan drawer sekaligus.

### Opsi B: Input Sederhana Khusus URL Saja (Minimalis)
- Hanya menambahkan input text sederhana untuk `mediaUrl` (link banner/drive) tanpa integrasi upload file riil.
- **Trade-off & Evaluasi**:
  - Mengabaikan kapabilitas multi-file dan folder upload yang sudah dibutuhkan tim Marcom. Tetap memaksa pengguna membuka drawer setelah create jika ingin upload file. Menghasilkan pengalaman pengguna yang terfragmentasi.

### Opsi C: Redukplikasi Logika Upload Baru Khusus Modal
- Menulis ulang handler upload khusus modal tanpa memakai `EventMediaSection`.
- **Trade-off & Evaluasi**:
  - Anti-pattern. Melanggar batas LOC `EventCreateModal` (< 650 LOC), meningkatkan cognitive load, dan rentan drift logika upload antar modal dan drawer.

## Decision
Kami memilih **Opsi A**. Kami menggunakan kembali sub-komponen `EventMediaSection` secara utuh di dalam `EventCreateModal.tsx`. Form create event akan memiliki state lokal `mediaAttachments` dan `mediaUrl`, membersihkannya saat reset/close, dan mengirimkannya secara atomik saat submit.

## Consequences

### Positif
- **Paritas Fitur**: Pengguna dapat langsung melampirkan foto rundown, banner promosi, atau folder Google Drive saat pembuatan event tanpa harus menunggu event terbuat lalu membuka drawer.
- **Konsistensi UI/UX**: Tampilan upload, interaksi drag-and-drop, pemilihan cover, dan indikator loading identik antara pembuatan event dan pengeditan event.
- **Zero Schema Change**: Tidak memerlukan perubahan skema Prisma atau migrasi database baru.
- **Pembersihan State Terjamin**: State lampiran dibersihkan secara bersih saat modal ditutup atau berhasil dibuat.

### Negatif / Trade-offs Diterima
- Jika pengguna mengunggah file ke Google Drive tetapi membatalkan pembuatan event (`Cancel`), file yang sudah terunggah ke Drive tetap berada di folder Google Drive Marcom (orphaned file). Hal ini konsisten dengan perilaku upload file di form web umum dan `ContentPostModal.tsx`.

## Invariant Compliance
- [x] **SSOT Preserved**: Menggunakan tipe kanonik `TaskAttachment` dan `FieldEventItem` dari `src/types/index.ts`.
- [x] **Strangler Pattern**: Tidak membuat inline logic baru; memanfaatkan sub-komponen `EventMediaSection` yang sudah terisolasi.
- [x] **No Single-Tenant Drift**: Tidak ada query atau kolom workspace-scoped baru.
- [x] **Verification Gate**: `npm run drift:check`, `npm run build:check`, dan `npm test` harus tetap lulus 100%.



