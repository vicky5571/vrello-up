# Spec: Field Event Completion Unreturned Equipment Warning Workflow and Operational Debt Architecture

- **Status:** APPROVED
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0054-field-event-completion-unreturned-equipment-warning-workflow.md`

---

## 1. Executive Summary & Problem Scope

Spesifikasi ini mendefinisikan sistem perlindungan peringatan operasional dan transparansi multi-permukaan untuk siklus hidup penutupan acara lapangan (`FieldEvent`):
1. **Pencegahan Pelepasan Tanggung Jawab Diam-Diam**: Menghentikan penutupan acara tanpa peringatan ketika aset inventaris masih berada di tangan staf atau lokasi acara.
2. **Intersepsi Seketika (Opsi B)**: Saat pengguna memilih status `COMPLETED` pada dropdown status di `EventDrawer.tsx`, sistem seketika memicu modal peringatan interaktif (`EventCompleteWarningModal`) jika terdapat peralatan pinjaman yang belum selesai (`ACTIVE`, `OVERDUE`, `PENDING`, atau `APPROVED`).
3. **Multi-Surface Pervasive Visibility**:
   - **Kartu Event (`EventCardsView.tsx`)**: Menampilkan badge merah berkedip/ikon peringatan jika event sudah selesai namun alat masih berstatus `ACTIVE` atau `OVERDUE`.
   - **Tabel Event (`EventTableView.tsx`)**: Menambahkan kolom atau indikator logistik alat pada setiap baris event.
   - **Sub-Drawer Field Events di Pipeline Cockpit (`Outlet360Drawer.tsx`)**: Menampilkan badge peringatan logistik pada setiap kartu event terkait toko.
   - **Tabel Matrix Pipeline (`PipelineMatrixTable.tsx`)**: Menampilkan indikator peringatan alat tercecer pada Kolom 4 (Field Events) untuk outlet yang memiliki event dengan anomali logistik.
4. **Pencatatan Operational Debt**: Menandai relasi ini sebagai utang teknis yang siap di-upgrade ke fail-closed blocker ketika prosedur organisasi telah matang.

---

## 2. User Experience Flow & State Interception

```
[Pengguna di EventDrawer]
         │
         ▼ (Memilih status "COMPLETED" di Dropdown Status)
[Cek Status Alat Inventaris via getEventEquipmentSummary]
         │
         ├─── Tidak ada alat / Seluruh alat sudah RETURNED/CANCELLED ───► Status diubah ke COMPLETED secara normal
         │
         └─── Terdapat alat ACTIVE / OVERDUE / PENDING / APPROVED
                   │
                   ▼ (Intersepsi Seketika - Opsi B)
         [Buka EventCompleteWarningModal]
         • Menampilkan daftar alat, nama peminjam, & due date
         • Peringatan risiko pengabaian serah terima fisik
                   │
                   ├───────────── "Batal & Periksa Alat" ─────────────┐
                   │                                                  ▼
                   │                                 [Kembalikan status dropdown ke semula]
                   │                                 [Scroll otomatis ke Borrowed Equipment Section]
                   ▼ "Tetap Selesaikan Acara (Override)"
         [Status dropdown diubah ke COMPLETED]
         [Tampilkan Banner Peringatan Oranye di EventDrawer]
         [Pengguna klik "Simpan Perubahan"] ──► Event tersimpan sebagai COMPLETED
```

---

## 3. Pure Logic & Diagnostic Helper Contracts

### 3.1 Peningkatan `src/lib/marcom/eventEquipmentHelpers.ts`

```ts
export interface UnreturnedEquipmentItem {
  borrowCode: string;
  borrowerName: string;
  borrowerPhone?: string;
  returnDueDate?: string | Date | null;
  status: "ACTIVE" | "OVERDUE" | "PENDING" | "APPROVED";
  itemsSummary: string; // contoh: "Portable PA Sound ×1, Wireless Mic ×2"
}

export interface EventEquipmentSummary {
  recordCount: number;
  totalUnits: number;
  hasOverdue: boolean;
  hasActive: boolean;
  hasPending: boolean;
  hasUnreturned: boolean; // hasActive || hasOverdue || hasPending
  statusText: string;
  unreturnedList: UnreturnedEquipmentItem[];
}
```

Fungsi murni:
```ts
export function getEventEquipmentSummary(
  borrowRecords: BorrowRecord[] | undefined,
  eventId: string
): EventEquipmentSummary | null;
```

* **Invarian Klasifikasi:**
  - `status === "RETURNED"` $\rightarrow$ Aman (stok sudah kembali ke gudang).
  - `status === "CANCELLED"` $\rightarrow$ Aman (peminjaman dibatalkan).
  - `status === "ACTIVE"` $\rightarrow$ Alat sedang di lapangan (belum kembali).
  - `status === "OVERDUE"` $\rightarrow$ Alat melewati batas pengembalian (tercecer).
  - `status === "PENDING" | "APPROVED"` $\rightarrow$ Peminjaman belum diambil/dibatalkan.

---

## 4. UI Component Specifications

### 4.1 `EventCompleteWarningModal.tsx` (Komponen Baru)
* **Path:** `src/components/views/EventsView/EventCompleteWarningModal.tsx`
* **Props:**
  ```ts
  export interface EventCompleteWarningModalProps {
    isOpen: boolean;
    eventName: string;
    unreturnedItems: UnreturnedEquipmentItem[];
    onConfirmComplete: () => void;
    onCancel: () => void;
  }
  ```
* **Perilaku:**
  - Menampilkan modal berlatar *backdrop-blur* dengan ikon `AlertTriangle` warna amber/oranye.
  - Menampilkan daftar kartu peminjaman yang memuat kode pinjam, nama staf, nomor kontak, daftar nama barang, dan tanggal jatuh tempo.
  - Tombol **"Batal & Periksa Alat"** (`variant="outline"`) $\rightarrow$ memanggil `onCancel()` yang mengembalikan dropdown ke status semula dan menggulir viewport ke seksi peralatan.
  - Tombol **"Tetap Selesaikan Acara"** (`bg-amber-600 hover:bg-amber-700 text-white font-bold`) $\rightarrow$ memanggil `onConfirmComplete()` yang menyetujui perubahan status.

### 4.2 `EventDrawer.tsx` (Pembaruan Intersepsi & Banner)
* **Intersepsi Dropdown (Opsi B):**
  Saat `onChange` status dipanggil:
  Jika nilai target adalah `COMPLETED` dan `equipmentSummary.hasUnreturned === true`:
  - Cegat perubahan status (jangan ubah `eventStatus` langsung).
  - Buka `isWarningModalOpen = true`.
  - Jika dikonfirmasi, barulah `setEventStatus("COMPLETED")`.
* **Banner Peringatan Tetap:**
  Jika status event saat ini adalah `COMPLETED` namun `equipmentSummary.hasUnreturned === true`, tampilkan banner peringatan oranye di bawah header drawer:
  > ⚠️ **Peringatan Logistik:** Acara ini telah berstatus *Completed*, namun masih terdapat peminjaman alat inventaris yang belum tercatat kembali ke gudang.

### 4.3 Multi-Surface Visibility Enhancements

#### A. Kartu Event (`EventCardsView.tsx`)
* Tambahkan indikator visual jika `event.status === "COMPLETED"` namun `equipmentSummary.hasUnreturned`:
  - Badge peralatan diberi warna merah tua/oranye (`bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300`).
  - Label: *"Alat Tercecer"* atau *"N Unit (Belum Kembali)"*.

#### B. Baris Tabel Event (`EventTableView.tsx`)
* Teruskan `borrowRecords` ke `EventTableView`.
* Tambahkan cell/badge logistik alat pada kolom *Schedule/Details*:
  - Jika alat masih tercecer, tampilkan badge oranye kecil bersimbol `Package` / `AlertCircle`.

#### C. Sub-Drawer Field Events di Cockpit 360° (`Outlet360Drawer.tsx`)
* Pada tab *Field Events* (`activeTab === "events"`):
  - Hitung status peminjaman alat untuk masing-masing event.
  - Tampilkan pill peringatan *"Peralatan Belum Kembali"* di samping status event yang telah selesai.

#### D. Baris Tabel Pipeline (`PipelineMatrixTable.tsx`)
* Pada Kolom 4 (*Field Events*):
  - Jika event terdekat atau salah satu event terkait memiliki alat yang tercecer, tambahkan ikon peringatan kecil berserta tooltip: *"Perhatian: Alat inventaris belum kembali ke gudang"*.

---

## 5. Non-Goals & Backend Invariants

1. **Zero Backend 422 Blocker:** Endpoint `PATCH /api/marcom/events/[id]` tetap memproses penyimpanan status `COMPLETED`. Sistem tidak menimbulkan kegagalan API bagi pengguna yang telah mengonfirmasi dialog peringatan.
2. **Backward-Compatibility:** Seluruh komponen yang tidak memiliki data peminjaman (`borrowRecords === undefined`) berjalan normal tanpa error (*graceful degradation*).

---

## 6. Acceptance Criteria

- [ ] **Intersepsi Seketika (Opsi B)**: Memilih opsi "Completed" pada dropdown status di `EventDrawer` seketika memicu `EventCompleteWarningModal` jika terdapat alat `ACTIVE`, `OVERDUE`, `PENDING`, atau `APPROVED`.
- [ ] **Tombol Batal**: Memilih "Batal & Periksa Alat" menutup modal, mengembalikan dropdown ke status sebelumnya, dan tidak mengubah state form.
- [ ] **Tombol Override**: Memilih "Tetap Selesaikan Acara" menyetujui perubahan status dropdown ke "Completed" dan menampilkan banner peringatan logistik di dalam laci.
- [ ] **Multi-Surface Warning Signals**:
  - [ ] Kartu di `EventCardsView` menampilkan sinyal peringatan alat tercecer.
  - [ ] Baris tabel di `EventTableView` menampilkan badge peralatan belum kembali.
  - [ ] Sub-drawer di `Outlet360Drawer` menampilkan status peringatan logistik pada kartu event.
  - [ ] Baris tabel di `PipelineMatrixTable` menampilkan indikator peringatan pada kolom Field Events.
- [ ] **Dokumentasi Operational Debt**: Dokumen ADR-0054 dan kode sumber menyertakan tag pelacakan utang operasional (`ponytail: debt` atau komentar terstandarisasi).
- [ ] **Quality Gates**: Seluruh pengujian non-negotiable (`drift:check`, `build:check`, `npm test`, `test:smoke`) lulus 100% dengan 0 kegagalan.


