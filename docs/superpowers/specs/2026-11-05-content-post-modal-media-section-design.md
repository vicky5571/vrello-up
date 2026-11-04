# Specification: Sub-Komponen ContentMediaSection pada Modal Schedule New Post

## Status
IMPLEMENTED (ADR-0028)

## Date
2026-11-05

## 1. Executive Summary
Spesifikasi ini mengatur perancangan dan penerapan sub-komponen mandiri `ContentMediaSection` (`src/components/views/ContentPlannerView/ContentMediaSection.tsx`) ke dalam form pembuatan postingan baru `ContentPostModal.tsx` ("Schedule New Post"). Dengan sub-komponen ini, content creator dan social media manager dapat langsung mengunggah video footage/gambar dari perangkat lokal ke Google Drive, melihat showcase banner 16:9 dengan overlay play button dan cover badge, serta mengatur urutan lampiran, tanpa menunggu post tersimpan lalu membukanya di drawer.

---

## 2. Problem Statement & User Flow

### 2.1 The Problem
Pada implementasi awal `ContentPostModal.tsx`, bagian media (baris 330–462) hanya memuat input teks URL biasa (`https://drive.google.com/...`) dengan tautan tombol kecil *"Tambah Media | Google Drive"*. Hal ini menimbulkan beberapa kendala:
1. **Tidak Ada Pratinjau Visual (Zero Preview)**: Pembuat konten tidak dapat melihat wujud visual thumbnail cover, video poster, atau orientasi konten yang akan diunggah sebelum postingan dijadwalkan.
2. **Alur Upload Perangkat Tidak Langsung**: Pengguna harus mengklik "Tambah Media" yang membuka modal sekunder, berbeda dengan drawer `ContentDrawer.tsx` yang menyediakan tombol *"Upload dari Perangkat"* secara langsung dengan file picker bawaan browser.
3. **Inkonsistensi Pengalaman**: Pembuatan post terasa kaku dan tekstual, kontras dengan pengalaman visual yang kaya di drawer.

### 2.2 Target User Experience
1. **Buka Modal "Schedule New Post"**: Pengguna menekan tombol "Schedule New Post" di `ContentPlannerHeader`.
2. **Pengisian Metadata Post**: Pengguna mengisi judul konsep, platform (Instagram, TikTok, YouTube Shorts, dll.), format konten (Reel, Carousel, Feed), tanggal rilis, dan caption draf.
3. **Pengelolaan Media & Video Footage**:
   - Di section **"Aset Media / Video Footage"**, pengguna dapat mengklik **"Upload dari Perangkat"** (memilih 1 atau beberapa file video/gambar). File langsung diunggah ke Google Drive dengan bar progress real-time dan tombol batal.
   - Atau pengguna dapat mengklik **"Google Drive"** untuk memilih aset dari Google Drive picker.
   - Atau jika pengguna memiliki link langsung, tersedia field URL cadangan (hanya muncul saat belum ada berkas terlampir).
   - Setelah berkas terlampir, muncul **16:9 Showcase Player Card** yang menampilkan thumbnail cover dengan tombol play overlay, badge tipe file (Video/Image), serta judul konten.
   - Di bawah player, tampil daftar lampiran dengan thumbnail kotak 36x36, ukuran berkas, tombol set/badge `Cover`, drag handle untuk reorder, dan tombol hapus (`X`).
4. **Penyimpanan Postingan**: Pengguna menekan "Schedule Post". Seluruh array `mediaAttachments` dan string cover `mediaUrl` diteruskan ke `POST /api/marcom/content` secara atomik.

---

## 3. Component Manifest & Architectural Contracts

| Komponen / Modul | Path File | Tanggung Jawab |
|---|---|---|
| `ContentMediaSection.tsx` | `src/components/views/ContentPlannerView/ContentMediaSection.tsx` | Sub-komponen atomik presentasional untuk upload langsung Google Drive, progress bar streaming, showcase banner 16:9, reordering lampiran, dan cover selector. |
| `ContentPostModal.tsx` | `src/components/views/ContentPlannerView/ContentPostModal.tsx` | Form modal pembuatan post baru. Mengimpor dan merender `ContentMediaSection`, serta menyalurkan state ke handler submit. |
| `contentCardStyling.test.ts` | `src/components/views/ContentPlannerView/contentCardStyling.test.ts` | Test suite untuk memverifikasi pemanggilan dan integrasi `ContentMediaSection` di `ContentPostModal.tsx`. |

---

## 4. Pure Logic & Component Interface Contract

### 4.1 Interface `ContentMediaSectionProps`
```typescript
import type { TaskAttachment } from "@/types";

export interface ContentMediaSectionProps {
  mediaAttachments: TaskAttachment[];
  setMediaAttachments?: (attachments: TaskAttachment[]) => void;
  mediaUrl: string;
  setMediaUrl: (url: string) => void;
  postTitle?: string;
  platform?: string;
  format?: string;
  onOpenDriveSelector?: () => void;
}
```

### 4.2 Alur Upload Berkas ke Google Drive
```typescript
const { isUploading, progress, uploadFile, cancelUpload } = useDirectDriveUpload("content");

const processFiles = async (files: File[]) => {
  for (const file of files) {
    try {
      const att = await uploadFile(file, { context: "content" });
      if (att) {
        const next = [...mediaAttachments, att];
        setMediaAttachments?.(next);
        if (!mediaUrl) {
          setMediaUrl(next[0]?.url || att.url);
        }
        toast.success(`Berhasil mengunggah ${file.name}`);
      }
    } catch {
      toast.error(`Gagal mengunggah ${file.name}`);
    }
  }
};
```

### 4.3 Integrasi JSX di `ContentPostModal.tsx`
Di dalam `ContentPostModal.tsx`, blok kode manual lama (baris 330–462) digantikan oleh:
```tsx
{/* Media Attachments & Video Footage Section */}
<ContentMediaSection
  mediaAttachments={mediaAttachments}
  setMediaAttachments={setMediaAttachments}
  mediaUrl={mediaUrl}
  setMediaUrl={setMediaUrl}
  postTitle={title}
  platform={platform}
  format={format}
  onOpenDriveSelector={onOpenDriveSelector}
/>
```

---

## 5. Non-Goals
1. **Tidak Mengubah `ContentDrawer.tsx`**: Kode media di drawer dibiarkan apa adanya untuk mencegah regresi alur edit postingan yang sudah ada. Refaktor drawer dicatat sebagai tech debt di ADR-0028.
2. **Tidak Mengubah Backend / Database**: Skema Prisma dan endpoint `POST /api/marcom/content` sudah mendukung `mediaAttachments` dan `mediaUrl` sejak ADR-0016.
3. **Tidak Mengubah Props `ContentPostModal`**: Kontrak props antara `ContentPlannerView.tsx` dan `ContentPostModal.tsx` tetap identik.

---

## 6. Acceptance Criteria
- [ ] Berkas sub-komponen `ContentMediaSection.tsx` dibuat di `src/components/views/ContentPlannerView/`.
- [ ] `ContentPostModal.tsx` mengimpor dan merender `ContentMediaSection`.
- [ ] Tombol "Upload dari Perangkat" berfungsi dengan streaming progress bar real-time ke Google Drive.
- [ ] Showcase banner 16:9 tampil rapi dengan cover thumbnail dan overlay play button saat ada berkas terlampir.
- [ ] Daftar lampiran berkas mendukung drag-and-drop reordering, badge `Cover`, dan tombol hapus berkas.
- [ ] Automated unit test di `contentCardStyling.test.ts` memverifikasi integrasi `ContentMediaSection`.
- [ ] Seluruh verifikasi sistem (`npm run drift:check`, `npm run build:check`, `npm test`) lulus dengan 0 kesalahan.
