# Implementation Plan: Sub-Komponen ContentMediaSection pada Modal Schedule New Post

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-content-post-modal-media-section-design.md`  
**ADR:** `docs/adr/0028-content-post-modal-media-section.md`  
**Status:** READY TO IMPLEMENT

---

## 1. Plan Overview & Objectives
Membangun dan mengintegrasikan sub-komponen mandiri `ContentMediaSection.tsx` ke dalam modal "Schedule New Post" (`ContentPostModal.tsx`):
1. **Sub-Komponen Mandiri**: Buat `ContentMediaSection.tsx` yang memuat Google Drive streaming upload via `useDirectDriveUpload("content")`, showcase banner 16:9 dengan overlay play button, dan attachment list reordering.
2. **Refaktor Ringkas Modal**: Pasang `<ContentMediaSection />` ke `ContentPostModal.tsx` menggantikan baris 330–462 yang sebelumnya manual dan minim visual.
3. **Penyimpanan Tech Debt**: Dokumentasikan penundaan refaktor `ContentDrawer.tsx` sebagai tracked tech debt tanpa mengganggu kestabilan drawer.
4. **Automated Verification**: Tambahkan test assertions di `contentCardStyling.test.ts` dan verifikasi seluruh checks (drift, build, test).

---

## 2. File Manifest & Responsibility Breakdown

| File Path | Action | Estimated LOC Change | Responsibility |
|---|---|---|---|
| `src/components/views/ContentPlannerView/ContentMediaSection.tsx` | Create | +220 / -0 LOC | Sub-komponen atomik untuk direct device upload, streaming progress, preview banner 16:9, dan attachment list. |
| `src/components/views/ContentPlannerView/ContentPostModal.tsx` | Modify | +20 / -130 LOC | Mengimpor `ContentMediaSection`, membuang helper drag-and-drop inline duplikat, dan merender sub-komponen. |
| `src/components/views/ContentPlannerView/contentCardStyling.test.ts` | Modify | +25 / -0 LOC | Menambahkan test assertion untuk verifikasi eksistensi dan wiring `ContentMediaSection` di `ContentPostModal`. |

---

## 3. Risks & Mitigations

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Regresi pada alur drawer yang sudah ada | Sangat Rendah | Tinggi | Opsi A-Lite secara eksplisit TIDAK menyentuh `ContentDrawer.tsx`. Zero regression risk. |
| Ukuran file modal membengkak | Rendah | Rendah | Dengan mendelegasikan logika media ke `ContentMediaSection`, ukuran `ContentPostModal.tsx` justru berkurang dari 489 LOC ke ~380 LOC. |
| Konflik upload Google Drive context | Rendah | Sedang | Menggunakan context `"content"` secara eksplisit pada `useDirectDriveUpload("content")`. |

---

## 4. Phase 1: Pembuatan Sub-Komponen `ContentMediaSection.tsx`

### Tasks:
- [ ] **1.1 Buat Berkas `ContentMediaSection.tsx`**:
  - Lokasi: `src/components/views/ContentPlannerView/ContentMediaSection.tsx`.
  - Ekspor interface `ContentMediaSectionProps` (`mediaAttachments`, `setMediaAttachments`, `mediaUrl`, `setMediaUrl`, `postTitle`, `platform`, `format`, `onOpenDriveSelector`).
- [ ] **1.2 Integrasikan Hook Upload & File Picker**:
  - Panggil `useDirectDriveUpload("content")` untuk upload streaming Google Drive.
  - Sediakan hidden `<input type="file" ref={fileInputRef} multiple accept="image/*,video/*" />`.
  - Tambahkan tombol *"Upload dari Perangkat"* dan *"Google Drive"*.
- [ ] **1.3 Integrasikan 16:9 Showcase Banner & Player**:
  - Render banner aspect-video dengan thumbnail cover, ikon tipe video/image, overlay play button, dan judul konten.
- [ ] **1.4 Integrasikan Daftar Lampiran & Drag-Drop Reorder**:
  - Render list lampiran dengan thumbnail 36x36, info ukuran file, badge `Cover`, tombol jadikan cover, dan tombol hapus berkas.
  - Tambahkan drag handle (`GripVertical`) untuk reorder lampiran.

**Phase 1 Verification:**
- Berkas `ContentMediaSection.tsx` tercipta dan lolos pemeriksaan sintaksis TypeScript.

---

## 5. Phase 2: Integrasi ke `ContentPostModal.tsx`

### Tasks:
- [ ] **2.1 Impor `ContentMediaSection` di `ContentPostModal.tsx`**:
  - `import { ContentMediaSection } from "./ContentMediaSection";`
- [ ] **2.2 Ganti Blok Media Inline Lama**:
  - Hapus blok manual baris 330–462.
  - Gantikan dengan:
    ```tsx
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
- [ ] **2.3 Bersihkan Helper Drag-and-Drop yang Redundan di Modal**:
  - Hapus state `draggedAttachmentIndex`, `dragOverAttachmentIndex` serta fungsi `handleDragStartAttachment`, `handleDragOverAttachment`, `handleDropAttachment`, `handleDragEndAttachment` yang kini sudah ada di dalam `ContentMediaSection`.

**Phase 2 Verification:**
- Buka modal "Schedule New Post" di browser.
- Pastikan tampilan "Aset Media / Video Footage", tombol "Upload dari Perangkat", progress bar, banner 16:9, dan daftar lampiran berfungsi sempurna.

---

## 6. Phase 3: Automated Testing & Invariant Verification

### Tasks:
- [ ] **3.1 Tambahkan Test Assertions di `contentCardStyling.test.ts`**:
  - Verifikasi bahwa `ContentMediaSection.tsx` ada.
  - Verifikasi bahwa `ContentPostModal.tsx` mengimpor dan merender `ContentMediaSection`.
  - Verifikasi prop wiring (`mediaAttachments`, `mediaUrl`, dll.).
- [ ] **3.2 Jalankan Test Suites**:
  - `node --test src/components/views/ContentPlannerView/contentCardStyling.test.ts`
  - `npm test`
- [ ] **3.3 Jalankan Invariant Checks**:
  - `npm run drift:check`
  - `npm run build:check`

---

## 7. Tracked Technical Debt Ledger

| Debt ID | Module | Deskripsi | Target Resolusi |
|---|---|---|---|
| `DEBT-CP-001` | `ContentDrawer.tsx` | Refaktor markup media footage inline (baris 530–730) di `ContentDrawer.tsx` agar menggunakan `ContentMediaSection.tsx`, memangkas ukurannya dari 1.048 LOC ke < 850 LOC. | Sesi maintenance / refactor Content Planner berikutnya. |

---

## 8. Invariant Compliance Checklist

- [ ] **Coordinator Size**: `ContentPostModal.tsx` berkurang dari 489 LOC menjadi ~380 LOC (Jauh di bawah batas god file).
- [ ] **SSOT**: Tipe `TaskAttachment` kanonik dari `@/types`.
- [ ] **Strangler Pattern**: Mengisolasi logika media ke sub-komponen `ContentMediaSection.tsx`.
- [ ] **Single-Tenant**: Nol workspace isolation leakage.
- [ ] **Verification Gates**:
  - `npm run drift:check` PASS (55 spec-plan pairs)
  - `npm test` PASS (778+ tests, 0 failures)
  - `npm run build:check` PASS (0 TypeScript errors)



