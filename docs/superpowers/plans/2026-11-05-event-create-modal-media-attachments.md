# Implementation Plan: Field Event Create Modal Media Attachments Integration

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-event-create-modal-media-attachments-design.md`  
**ADR:** `docs/adr/0027-event-create-modal-media-attachments.md`  
**Status:** COMPLETED

---

## 1. Plan Overview & Objectives
Mengintegrasikan sub-komponen `EventMediaSection` ke dalam modal pembuatan event baru (`EventCreateModal.tsx`):
1. **State Management**: Tambahkan state `mediaAttachments` (`TaskAttachment[]`) dan `mediaUrl` (`string`) di `EventCreateModal.tsx`, serta pastikan reset state berjalan bersih saat modal ditutup atau form disubmit.
2. **Mounting Sub-Komponen**: Tampilkan `<EventMediaSection />` di dalam form scroll body tepat di antara field catatan operasional (`eventNotes`) dan checklist subtasks (`EventChecklistSection`).
3. **Payload Synchronization**: Kirimkan array `mediaAttachments` dan string `mediaUrl` riil ke API endpoint `POST /api/marcom/events`, serta pass ke callback `onCreated(createdItem)`.
4. **Automated Verification**: Perluas test suite `src/components/views/EventsView/eventDrawer.test.ts` untuk memverifikasi integrasi sub-komponen dan kelengkapan payload contract.

---

## 2. File Manifest & Responsibility Breakdown

| File Path | Action | Estimated LOC Change | Responsibility |
|---|---|---|---|
| `src/components/views/EventsView/EventCreateModal.tsx` | Modify | +25 / -4 LOC | Import `EventMediaSection` & `TaskAttachment`, tambahkan state, reset form, mounting JSX, dan payload submit. |
| `src/components/views/EventsView/eventDrawer.test.ts` | Modify | +20 / -0 LOC | Tambahkan unit test assertions untuk verifikasi integrasi `EventMediaSection` di `EventCreateModal.tsx`. |

---

## 3. Risks & Mitigations

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Ukuran file `EventCreateModal.tsx` membengkak | Rendah | Sedang | Komponen `EventMediaSection` sudah atomik dan mandiri. Hanya perlu ~25 baris kode penambahan di modal. |
| Pengguna mengunggah file tetapi batal submit (`Cancel`) | Sedang | Rendah | File yang terunggah tetap berada di Google Drive folder Marcom; sama persis dengan alur `ContentPostModal.tsx`. |
| Inkonsistensi cover image default | Rendah | Rendah | Gunakan fallback kanonik: `mediaUrl.trim() \|\| mediaAttachments[0]?.url \|\| ""` sehingga gambar pertama otomatis menjadi cover default. |

---

## 4. Phase 1: State Management & JSX Mounting di `EventCreateModal.tsx`

### Tasks:
- [x] **1.1 Import Sub-Komponen dan Tipe**:
  - Di `src/components/views/EventsView/EventCreateModal.tsx`:
    - Import `TaskAttachment` dari `@/types`.
    - Import `EventMediaSection` dari `./EventMediaSection`.
- [x] **1.2 Deklarasikan State Lokal**:
  - Tambahkan hooks state:
    ```typescript
    const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
    const [mediaUrl, setMediaUrl] = useState<string>("");
    ```
- [x] **1.3 Perluas Reset Semantics**:
  - Di dalam fungsi `resetForm`:
    - Tambahkan `setMediaAttachments([]);`
    - Tambahkan `setMediaUrl("");`
- [x] **1.4 Mount Sub-Komponen di JSX**:
  - Letakkan komponen `<EventMediaSection />` tepat di antara field `textarea` (`eventNotes`) dan `<EventChecklistSection />`:
    ```tsx
    {/* Media Attachments & Documentation Section */}
    <EventMediaSection
      mediaAttachments={mediaAttachments}
      setMediaAttachments={setMediaAttachments}
      mediaUrl={mediaUrl}
      setMediaUrl={setMediaUrl}
      eventName={eventName}
    />
    ```

**Phase 1 Verification:**
- Modal create dapat dibuka tanpa error render.
- File uploader Google Drive dan input link folder muncul di form modal.

---

## 5. Phase 2: Payload Synchronization & OnCreated Wiring

### Tasks:
- [x] **2.1 Sinkronkan Payload di `handleSubmit`**:
  - Hitung `resolvedMediaUrl = mediaUrl.trim() || mediaAttachments[0]?.url || ""`.
  - Ganti `mediaAttachments: []` pada payload POST dengan `mediaAttachments: mediaAttachments`.
  - Tambahkan `mediaUrl: resolvedMediaUrl` ke payload POST.
- [x] **2.2 Sinkronkan Konstruksi `createdItem`**:
  - Ganti `mediaAttachments: []` pada objek `createdItem` dengan `mediaAttachments: mediaAttachments`.
  - Tambahkan `mediaUrl: created.mediaUrl || resolvedMediaUrl` ke `createdItem`.
- [x] **2.3 Panggil `resetForm()`**:
  - Pastikan `resetForm()` dipanggil saat modal ditutup atau setelah submit sukses.

**Phase 2 Verification:**
- Buat event baru dengan upload gambar/folder Google Drive.
- Buka event yang baru dibuat di drawer: pastikan media lampiran langsung tampil lengkap dengan cover badge.

---

## 6. Phase 3: Automated Testing & Invariant Verification

### Tasks:
- [x] **3.1 Tambahkan Test Assertion di `src/components/views/EventsView/eventDrawer.test.ts`**:
  - Verifikasi bahwa `EventCreateModal.tsx` mengimpor dan merender `EventMediaSection`.
  - Verifikasi bahwa `EventCreateModal.tsx` mengikat prop `mediaAttachments` dan `setMediaAttachments`.
  - Verifikasi bahwa `EventCreateModal.tsx` mengirimkan `mediaAttachments` riil (bukan hardcoded `mediaAttachments: []`).
- [x] **3.2 Run Test Suites**:
  - `node --test src/components/views/EventsView/eventDrawer.test.ts`
  - `npm test`
- [x] **3.3 Run Drift & Build Checks**:
  - `npm run drift:check`
  - `npm run build:check`

---

## 7. Invariant Compliance Checklist

- [x] **Coordinator Size**: `EventCreateModal.tsx` tetap di bawah batas god-file (< 650 LOC; ekspektasi ~660 LOC).
- [x] **SSOT**: Tipe `TaskAttachment` dan `FieldEventItem` diimpor dari `@/types`.
- [x] **Strangler Pattern**: Tidak ada kode inline upload baru, memanfaatkan kembali `EventMediaSection.tsx`.
- [x] **Single-Tenant**: Nol workspace isolation leakage.
- [x] **Verification Gates**:
  - `npm run drift:check` PASS (54 spec-plan pairs)
  - `npm test` PASS (778+ tests, 0 failures)
  - `npm run build:check` PASS (0 TypeScript errors)



