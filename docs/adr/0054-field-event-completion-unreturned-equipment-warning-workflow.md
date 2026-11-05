# ADR-0054: Field Event Completion Unreturned Equipment Warning Workflow and Operational Debt Architecture

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, User (Product Owner)
- **Consulted:** Warehouse Master, Regional Field Event Coordinator, Marcom Auditor
- **Supersedes:** None
- **Related ADRs:** ADR-0050 (Return Inspection), ADR-0052 (Compensation Settlement), ADR-0053 (Outlet Soft-Delete)

---

## 1. Context & Business Problem

Dalam operasional pemasaran lapangan (*Field Marketing Events*), tim lapangan sering meminjam aset operasional bernilai tinggi dari gudang (sound system portabel, wireless mic, genset mini, backdrop stand) yang ditautkan ke suatu acara (`FieldEvent`). Sering kali acara selesai pada Minggu malam di luar jam kerja gudang, sehingga peralatan belum langsung dikembalikan atau tertinggal di lokasi event.

Pada kondisi codebase sebelumnya:
Di endpoint `PATCH /api/marcom/events/[id]` dan komponen UI `EventDrawer.tsx`, PIC event dapat langsung mengubah status acara menjadi `COMPLETED` kapan saja tanpa adanya verifikasi apakah aset inventaris yang dipinjam untuk acara tersebut telah dikembalikan ke gudang. Akibatnya:
1. **Pelepasan Tanggung Jawab Fisik Dini**: Acara ditandai selesai (*completed*) secara administratif, namun aset fisik senilai jutaan hingga puluhan juta rupiah masih tercecer di lapangan atau di kendaraan pribadi staf tanpa kejelasan penguasaan (*custody*).
2. **Distorsi Visibilitas Logistik**: Manajemen dan tim gudang kesulitan melacak apakah aset yang berstatus `OVERDUE` atau `ACTIVE` masih digunakan untuk event yang sedang berlangsung atau memang tercecer pasca-acara bubar.
3. **Friction Pelaporan Lapangan vs Ketertiban Prosedural**: Jika backend langsung memblokir keras penutupan acara (*strict 422 blocker*), staf lapangan yang dikejar tenggat pelaporan KPI mingguan akan terhambat oleh antrean inspeksi fisik staf gudang.

---

## 2. Options Considered

### Opsi 1: Strict Fail-Closed Database Guard (Backend Blocker)
* **Deskripsi**: Menolak transisi status event ke `COMPLETED` pada endpoint `PATCH /api/marcom/events/[id]` dengan `HTTP 422 Unprocessable Entity` jika masih terdapat `BorrowRecord` yang terikat pada event berstatus `ACTIVE`, `OVERDUE`, `PENDING`, atau `APPROVED`.
* **Kelebihan**: 100% perlindungan terhadap kehilangan aset; memaksa kepatuhan prosedural serah-terima fisik sebelum acara ditutup.
* **Kekurangan**: Menimbulkan *deadlock* operasional bagi tim lapangan saat laporan eksekutif harus segera diserahkan namun staf gudang belum sempat menginput BAST di sistem.

### Opsi 2: Actionable Soft Warning & Intercept Confirmation with Multi-Surface Visibility (CHOSEN)
* **Deskripsi**: Mengizinkan transisi status event ke `COMPLETED` di backend (zero hard-blocker), namun di frontend:
  1. Mencegat pemilihan status `COMPLETED` seketika (Opsi B) di `EventDrawer.tsx` menggunakan modal konfirmasi interaktif (`EventCompleteWarningModal`).
  2. Menampilkan rincian alat yang belum kembali, nama peminjam, dan tanggal jatuh tempo.
  3. Memaksa konfirmasi eksplisit (*"Tetap Selesaikan Acara"* vs *"Batal & Periksa Alat"*).
  4. Memasang indikator peringatan visual di multi-permukaan: kartu event (`EventCardsView`), baris tabel event (`EventTableView`), tab field event di Cockpit 360° Drawer (`Outlet360Drawer`), dan baris tabel pipeline (`PipelineMatrixTable`).
  5. Mencatat arsitektur ini sebagai **Operational Debt** yang siap dimigrasikan ke Opsi 1 ketika kedewasaan operasional tim lapangan telah tercapai.
* **Kelebihan**: Kecepatan pelaporan lapangan terjaga; visibilitas aset tercecer melonjak tinggi di seluruh kokpit dan tabel; tidak ada kebuntuan administratif; jalur migrasi ke Opsi 1 tertata rapi.
* **Kekurangan**: Secara teknis alat masih bisa ditinggalkan dalam status pinjam jika pengguna sengaja mengonfirmasi override.

### Opsi 3: Admin Override Exception
* **Deskripsi**: Blokir staf biasa (Opsi 1), namun izinkan Admin melakukan force-complete dengan mencatat alasan tertulis.
* **Kelebihan**: Mengakomodasi keadaan darurat.
* **Kekurangan**: Membuka pintu belakang (*backdoor*); menambah kompleksitas skema audit tanpa menyelesaikan masalah gesekan staf harian.

---

## 3. Decision & Trade-Off Rationale

Kami memutuskan untuk mengimplementasikan **Opsi 2: Actionable Soft Warning & Intercept Confirmation with Multi-Surface Visibility** dan mencatatnya sebagai **Operational Debt**.

### Rasional Keputusan:
1. **Pragmatisme Operasional Lapangan**: Pada tahap pertumbuhan saat ini, menghalangi pelaporan event secara kaku berisiko memicu resistensi staf lapangan atau mendorong staf tidak menautkan event ke peminjaman alat sama sekali (*bypassing the feature entirely*).
2. **Intersepsi Seketika (Opsi B)**: Memunculkan modal dialog seketika saat opsi dropdown *"Completed"* dipilih memastikan PIC event sadar seketika mengenai daftar tanggung jawab fisik alat yang masih belum selesai di tangannya sebelum form disimpan.
3. **Multi-Surface Pervasive Visibility**: Peringatan tidak hanya muncul di laci detail event, tetapi disebarkan ke kartu event, baris tabel event, sub-drawer event di Pipeline 360°, dan baris tabel pipeline. Ini menjamin staf gudang dan manajer regional dapat melihat anomali logistik tersebut dari mana pun mereka memantau.
4. **Pemisahan Penguasaan Fisik vs Ganti Rugi**: Event tetap boleh ditutup jika alat sudah kembali secara fisik ke gudang (`RETURNED`), kendati proses pelunasan ganti rugi (ADR-0052) masih berjalan (`PENDING_SETTLEMENT`).

---

## 4. Operational Debt Ledger & Migration Path to Option 1

Keputusan ini sengaja menerima utang operasional demi fleksibilitas alur kerja tim lapangan. Berikut adalah catatan resmi utang ini:

| ID Utang | Komponen | Risiko Operasional yang Diterima | Mitigasi Saat Ini | Syarat Aktivasi Opsi 1 (Strict Blocker) |
| :--- | :--- | :--- | :--- | :--- |
| `DEBT-EVENT-LOGISTICS-001` | `PATCH /api/marcom/events/[id]` | Acara dapat berstatus `COMPLETED` saat alat masih berstatus `ACTIVE` atau `OVERDUE` jika PIC mengabaikan peringatan modal. | Dialog konfirmasi eksplisit dengan rincian alat; badge merah/oranye menyala di kartu event, tabel event, dan kokpit pipeline. | 1. SOP penerimaan fisik gudang telah memiliki SLA < 24 jam.<br>2. Tingkat kepatuhan staf mengembalikan alat > 90%.<br>3. Permintaan resmi dari Head of Marcom. |

### Panduan Migrasi Masa Depan ke Opsi 1:
Ketika syarat aktivasi di atas terpenuhi, langkah peningkatan ke Opsi 1 adalah:
1. Tambahkan pemeriksaan di `PATCH /api/marcom/events/[id]`:
   ```ts
   if (toStatus === "COMPLETED") {
     const blocking = await prisma.borrowRecord.count({
       where: { eventId: id, status: { in: ["ACTIVE", "OVERDUE", "PENDING", "APPROVED"] } }
     });
     if (blocking > 0) return NextResponse.json({ error: "..." }, { status: 422 });
   }
   ```
2. Ubah `EventDrawer.tsx` agar opsi "Completed" berstatus `disabled={hasUnreturnedEquipment}` dengan tooltip penjelas.

---

## 5. Consequences

### Konsekuensi Positif (Positive):
* **Zero Disruption to Field Operations**: PIC event tetap dapat melaporkan hasil penutupan event tepat waktu tanpa terhambat ketiadaan staf gudang di luar jam kerja.
* **Tinggi Kesadaran Tanggung Jawab**: PIC disajikan daftar alat nyata yang masih berada di tangannya melalui modal interaktif yang tidak bisa terlewat.
* **Transparansi Menyeluruh**: Multi-surface warning memastikan tim cabang, logistik, dan manajemen selalu mengetahui jika suatu event telah selesai tetapi peralatannya masih tercecer.

### Konsekuensi Negatif (Accepted Liabilities):
* Sistem masih mengizinkan inkonsistensi sementara di mana event berstatus `COMPLETED` namun memiliki relasi `BorrowRecord` berstatus `OVERDUE`.
* Pengawasan pengembalian alat tetap memerlukan tindak lanjut personal dari kepala cabang/gudang berdasarkan sinyal visual di UI.


