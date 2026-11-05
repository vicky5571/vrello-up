# Plan: Field Event Completion Unreturned Equipment Warning Workflow and Operational Debt Architecture

- **Status:** APPROVED
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0054-field-event-completion-unreturned-equipment-warning-workflow.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-field-event-completion-unreturned-equipment-warning-workflow-design.md`

---

## 1. Executive Summary & Strategy

Rencana implementasi ini mengeksekusi arsitektur peringatan operasional (Opsi 2) untuk penutupan acara lapangan (`FieldEvent`):
1. **Pure Logic Engine**: Memperluas `eventEquipmentHelpers.ts` untuk mengklasifikasikan pinjaman yang belum selesai (`ACTIVE`, `OVERDUE`, `PENDING`, `APPROVED`) dan menghasilkan roster `unreturnedList`.
2. **Instant Interception (Opsi B)**: Mengintersepsi perubahan dropdown status ke `COMPLETED` di `EventDrawer.tsx` menggunakan `EventCompleteWarningModal.tsx`.
3. **Multi-Surface Pervasive Visibility**:
   - `EventCardsView.tsx`: Badge merah/oranye "Alat Tercecer".
   - `EventTableView.tsx`: Indikator logistik alat belum kembali pada kolom jadwal/rincian.
   - `Outlet360Drawer.tsx`: Status peringatan logistik pada tab *Field Events*.
   - `PipelineMatrixTable.tsx`: Ikon peringatan pada Kolom 4 (*Field Events*).
4. **Operational Debt Ledger**: Mencatat tag `DEBT-EVENT-LOGISTICS-001` dengan kriteria migrasi yang jelas ke fail-closed guard Opsi 1.

---

## 2. Phased Implementation Breakdown

### Phase 1: Pure Logic & Diagnostics Engine
- [ ] 1.1 Perbarui interface `EventEquipmentSummary` dan tambahkan `UnreturnedEquipmentItem` di `src/lib/marcom/eventEquipmentHelpers.ts`.
- [ ] 1.2 Implementasikan logika ekstraksi `unreturnedList` dan kalkulasi `hasUnreturned` pada `getEventEquipmentSummary()`.
- [ ] 1.3 Perbarui unit test di `src/lib/marcom/eventEquipmentHelpers.test.ts` untuk memverifikasi penanganan status:
  - `RETURNED` & `CANCELLED` tidak memicu peringatan (`hasUnreturned: false`).
  - `ACTIVE`, `OVERDUE`, `PENDING`, `APPROVED` memicu peringatan (`hasUnreturned: true`).

### Phase 2: Warning Intercept Modal & EventDrawer Integration (Opsi B)
- [ ] 2.1 Buat komponen baru `src/components/views/EventsView/EventCompleteWarningModal.tsx`:
  - Roster kartu peminjaman alat (kode pinjam, nama peminjam, item summary, due date).
  - Aksi "Batal & Periksa Alat" (`onCancel`).
  - Aksi "Tetap Selesaikan Acara" (`onConfirmComplete`).
- [ ] 2.2 Hubungkan intersepsi seketika (Opsi B) pada dropdown status di `EventDrawer.tsx`:
  - Cegat pemilihan "Completed" saat `equipmentSummary?.hasUnreturned`.
  - Tampilkan modal peringatan konfirmasi.
  - Tampilkan banner peringatan permanen di bawah header drawer jika event berstatus `COMPLETED` namun alat masih tercecer.
  - Sediakan auto-scroll halus ke elemen `#borrowed-equipment-section` saat tombol batal diklik.

### Phase 3: Multi-Surface Visibility Enhancements
- [ ] 3.1 Perbarui `EventCardsView.tsx`:
  - Jika `event.status === "COMPLETED"` dan `equipmentSummary?.hasUnreturned`, tampilkan styling badge alat tercecer berlatar merah/oranye.
- [ ] 3.2 Perbarui `EventTableView.tsx`:
  - Teruskan prop `borrowRecords` dari `EventsView.tsx`.
  - Render indikator badge logistik peringatan pada kolom event jika memiliki alat yang belum kembali.
- [ ] 3.3 Perbarui `Outlet360Drawer.tsx`:
  - Pada tab `activeTab === "events"`, lakukan evaluasi status alat menggunakan `getEventEquipmentSummary(data.borrows, ev.id)` atau API data.
  - Tampilkan pill peringatan *"Peralatan Belum Kembali"* di samping badge status event.
- [ ] 3.4 Perbarui `PipelineMatrixTable.tsx`:
  - Tampilkan ikon peringatan `Package` / `AlertTriangle` pada Kolom 4 (Field Events) untuk outlet yang memiliki event dengan peralatan tercecer.

### Phase 4: Fixture Seed, Debt Ledger & Non-Negotiable Verification
- [ ] 4.1 Tambahkan fixture QA pada `prisma/seed.ts`:
  - Event `event-004` (atau event terselesaikan) yang memiliki peminjaman aktif/overdue untuk verifikasi visual otomatis.
- [ ] 4.2 Tambahkan komentar penanda utang operasional (`ponytail: debt DEBT-EVENT-LOGISTICS-001`) pada `eventEquipmentHelpers.ts` dan `EventDrawer.tsx`.
- [ ] 4.3 Jalankan seluruh quality gates:
  - `npm run drift:check` (81/81 pasangan spec-plan).
  - `npm run build:check` (0 errors).
  - `npm test` (0 failures).
  - `npm run test:smoke` (0 failures).
- [ ] 4.4 Perbarui `docs/SESSION_STATE.md` dan `CHANGELOG.md`.

---

## 3. File Manifest & Responsibilities

| File Path | LOC Est. | Responsibility |
| :--- | :---: | :--- |
| `src/lib/marcom/eventEquipmentHelpers.ts` | +35 | Pure logic ekstraksi `unreturnedList` dan flag `hasUnreturned`. |
| `src/lib/marcom/eventEquipmentHelpers.test.ts` | +40 | Unit tests klasifikasi status pengembalian & debt invariants. |
| `src/components/views/EventsView/EventCompleteWarningModal.tsx` | +110 | Modal peringatan interaktif interseptif penutupan event. |
| `src/components/views/EventsView/EventDrawer.tsx` | +45 | Intersepsi Opsi B pada dropdown status, banner peringatan, & auto-scroll. |
| `src/components/views/EventsView/EventCardsView.tsx` | +15 | Styling badge "Alat Tercecer" pada event berstatus `COMPLETED`. |
| `src/components/views/EventsView/EventTableView.tsx` | +25 | Integrasi kolom/badge logistik pada tabel event. |
| `src/components/views/EventsView/EventsView.tsx` | +10 | Penerusan prop `borrowRecords` ke `EventTableView`. |
| `src/components/views/OutletsView/Outlet360Drawer.tsx` | +20 | Pill status peringatan logistik pada tab *Field Events*. |
| `src/components/views/PipelineView/PipelineMatrixTable.tsx` | +20 | Ikon peringatan pada Kolom 4 (*Field Events*). |
| `prisma/seed.ts` | +20 | Fixture deterministic event completed dengan alat belum kembali. |

---

## 4. Risks & Mitigations

| Risiko Operasional / Teknis | Mitigasi Arsitektur |
| :--- | :--- |
| **Alert Fatigue**: Pengguna terlalu terbiasa menekan tombol override tanpa membaca daftar alat. | Tampilkan rincian nama alat dan nomor kontak peminjam secara mencolok dalam kartu bergaris tegas, bukan sekadar teks konfirmasi biasa. |
| **Kinerja Render di Tabel Pipeline**: Evaluasi logistik alat untuk puluhan outlet berpotensi memperlambat tabel. | Gunakan pre-computed lookup map `Map<string, EventEquipmentSummary>` berbasis O(1) di memory klien. |
| **Regresi Komponen Tanpa Borrow Data**: Pemanggilan drawer atau tabel di tempat yang tidak memiliki data pinjam. | Desain fail-safe murni: jika `borrowRecords` tidak diberikan, helper langsung mengembalikan `null` tanpa crash. |

