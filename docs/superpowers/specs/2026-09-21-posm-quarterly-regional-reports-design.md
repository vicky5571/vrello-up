# Spesifikasi Desain: Report Regional POSM Kuartal & Tema Kampanye (Fase 2A)

**Tanggal:** 2026-09-21  
**Status:** Draf Terverifikasi (Siap Review)  
**Dokumen Referensi:** Transkrip Pembahasan PIC Regional Jateng & Tech Lead (`vrello-up`)

---

## 1. Latar Belakang & Tujuan Bisnis

Berdasarkan hasil transkrip diskusi teknis antara PIC Bisnis Regional Jateng (P1) dan Tech Lead (P2):
1. **Kebutuhan Tim Regional:** Manajemen regional membutuhkan rekapitulasi berkala terhadap total material promosi (POSM) yang telah terpasang dari alokasi yang ditetapkan per kuartal (*quarterly cut-off*).
2. **Klasifikasi 2 Dimensi (Materi × Tema):** Selain kategori fisik material (Poster, Shop Blind, Stiker Etalase, Bottom Etalase, Shop Sign), pelaporan harus dapat membedah distribusi berdasarkan tema kampanye aktif, seperti *Product Hero*, *Gemini*, *Freedom Internet*, atau program taktis lainnya.
3. **Dual-Audience Requirements (Operasional vs Eksekutif):**
   - **Tim Lapangan / PIC Operasional:** Memerlukan akses instan di halaman kerja harian ([`PlacementsView`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/PlacementsView/PlacementsView.tsx)) dengan kemampuan *drill-down* dari angka matriks langsung ke daftar toko/outlet terkait.
   - **Manajemen / Head Office:** Memerlukan format laporan resmi di modul pelaporan ([`ReportsView`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/ReportsView/ReportsView.tsx)) yang menyajikan komparasi performa antar-cabang Jawa Tengah, narasi capaian, serta tombol ekspor / cetak PDF formal.

Untuk memenuhi kedua kebutuhan tersebut tanpa memecah navigasi atau menduplikasi logika bisnis, sistem menerapkan **Hybrid Architecture (Opsi A + Opsi B)** dengan **Single Source of Truth** pada engine kalkulasi analitik.

---

## 2. Ruang Lingkup (Scope)

### Dalam Cakupan (In Scope)
1. **Shared Calculation Engine (`src/lib/marcom/posmQuarterlyAnalytics.ts`)**:
   - Fungsi murni (*pure functions*) untuk mengekstrak daftar kuartal aktif (`getAvailableQuarters`).
   - Pembentukan matriks 2D: Tema Kampanye (baris) × Jenis Material POSM (kolom) beserta total realisasi dan target.
   - Perhitungan metrik KPI kuartal: Total Terpasang, Target Alokasi, % Ketercapaian, serta Persentase Integritas GPS (≤ 100 meter).
   - Agregasi performa per cabang (*branch breakdown*) untuk wilayah Semarang, Solo, Purwokerto, Kudus, dll.
2. **Opsi A: Tab Operasional di `PlacementsView` (`QuarterlyRecapTab.tsx`)**:
   - Tab ketiga di samping `Daftar` dan `Peta Sebaran`: `[ 📊 Rekap Kuartal & Tema ]`.
   - Dropdown pemilih Kuartal aktif (`Q1 2026`–`Q4 2026`) dan filter Cabang.
   - KPI Strip realisasi vs target dan akurasi deviasi GPS.
   - Matriks interaktif 2D: Mengklik sel matriks otomatis memicu *drill-down* ke tab `Daftar` dengan filter tema & material terpasang.
   - Modal cepat pengaturan target kuartalan (*Target Allocation Manager*).
3. **Opsi B: Tab Laporan Eksekutif di `ReportsView` (`QuarterlyPosmReportTab.tsx`)**:
   - Tab pendamping Laporan Bulanan: `[ 🎯 Rekap POSM Kuartalan ]`.
   - Ringkasan eksekutif capaian wilayah regional Jawa Tengah.
   - Tabel komparasi performa dan alokasi antar-cabang se-Jawa Tengah.
   - Tampilan ramah cetak (*print-friendly*) dan fungsi ekspor CSV/Cetak PDF.
4. **Persistensi Target Alokasi**:
   - Penyimpanan target alokasi kuartal per workspace pada local store / workspace preferences tanpa memerlukan skema database baru (mengikuti prinsip YAGNI & zero-dependency overhead).
5. **Unit & Integration Testing**:
   - Test suite menyeluruh pada `posmQuarterlyAnalytics.test.ts` menggunakan native Node test runner (`node --test`).

### Di Luar Cakupan (Out of Scope)
- Fitur pengajuan toko baru (*Draft Outlet & Approval*) ➔ Dijadwalkan pada Fase 2B.
- Upload/Download berkas fisik PDF MOU ➔ Dijadwalkan pada Fase 2C.
- Modul Field Event Google Form Replacement ➔ Dijadwalkan pada Fase 3.

---

## 3. Desain Arsitektur & Model Data

### 3.1 Single Source of Truth
Seluruh data mentah diambil dari model `Placement` yang sudah memuat atribut `quarter` dan `campaignTheme`. Tidak ada mutasi langsung atau duplikasi data; kedua tampilan UI mengonsumsi output dari modul fungsional yang sama.

```text
┌─────────────────────────────────────────────────────────────┐
│                      Placement Data                         │
│   (id, outletId, materialId, quarter, campaignTheme, ...)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          src/lib/marcom/posmQuarterlyAnalytics.ts           │
│  • buildQuarterlyMatrix(placements, quarter, targets)       │
│  • calculateQuarterKpi(placements, quarter, targets)        │
│  • calculateBranchBreakdown(placements, branches, quarter)  │
│  • getAvailableQuarters(placements)                         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│  PlacementsView (Tab Opsi A) ││    ReportsView (Tab Opsi B)  │
│  - Live Operational Matrix   ││    - Formal Executive Summary│
│  - Interactive Drill-Down    ││    - Inter-Branch Comparison │
│  - GPS Deviation Accuracy    ││    - Print / Export PDF/CSV  │
└──────────────────────────────┘└──────────────────────────────┘
```

### 3.2 Struktur Tipe Data Domain (`src/types/index.ts`)

```typescript
export interface PosmMatrixCell {
  materialId: string;
  materialName: string;
  actual: number;
  target: number;
  percentage: number;
}

export interface PosmMatrixRow {
  theme: string;
  cells: Record<string, PosmMatrixCell>; // Diindeks berdasarkan materialId
  totalActual: number;
  totalTarget: number;
  totalPercentage: number;
}

export interface PosmQuarterlyMatrix {
  quarter: string;
  rows: PosmMatrixRow[];
  columnTotals: Record<string, { actual: number; target: number; percentage: number }>;
  grandTotalActual: number;
  grandTotalTarget: number;
  grandTotalPercentage: number;
}

export interface PosmBranchBreakdown {
  branchId: string;
  branchName: string;
  totalPlacements: number;
  targetPlacements: number;
  percentage: number;
  validGpsCount: number;
  gpsIntegrityRate: number;
  topTheme: string;
}

export interface PosmQuarterlyKpis {
  totalActual: number;
  totalTarget: number;
  completionRate: number;
  validLocationCount: number;
  validLocationPercentage: number;
  averageDeviationMeters: number;
  activeOutletsCount: number;
}
```

---

## 4. Rincian Komponen & Alur Interaksi

### 4.1 Engine Agregasi Fungsional (`src/lib/marcom/posmQuarterlyAnalytics.ts`)
Modul ini bertanggung jawab atas seluruh kalkulasi data dengan karakteristik:
- **Ketahanan Terhadap Data Kosong:** Jika placement tidak memiliki tema (`campaignTheme` kosong), otomatis dikelompokkan ke kategori `"Reguler / Tanpa Tema"`.
- **Ekstraksi Kuartal Cerdas:** `getAvailableQuarters` mengumpulkan seluruh kuartal unik dari dataset, mengurutkannya secara kronologis, dan memastikan kuartal saat ini (misal `Q3 2026`) selalu ada sebagai opsi.
- **Pencegahan Pembagian Nol (Zero-Division Guard):** Jika target bernilai `0` atau belum diatur, persentase ketercapaian dihitung aman `0%` tanpa memunculkan `NaN` atau `Infinity`.

### 4.2 Tab Operasional di PlacementsView (`QuarterlyRecapTab.tsx`)
- **Penempatan:** Muncul sebagai tab di sebelah *Tabel Data* dan *Peta Sebaran*.
- **Alur Drill-Down:**
  1. Pengguna melihat sel *Product Hero* pada kolom *Poster* (contoh: `420 / 500`).
  2. Pengguna mengklik sel tersebut.
  3. Handler `onDrillDown({ quarter: "Q3 2026", campaignTheme: "Product Hero", materialName: "Poster" })` dipanggil.
  4. Komponen beralih ke tab `Tabel Data`, memasang filter pencarian otomatis, dan menampilkan daftar outlet yang sesuai secara instan.
- **Modal Target Kuartal:** Form sederhana untuk memasukkan kuota alokasi per tema kampanye yang disimpan ke cache workspace.

### 4.3 Tab Laporan Formal di ReportsView (`QuarterlyPosmReportTab.tsx`)
- **Penempatan:** Muncul sebagai tab di dalam menu *Reports*: `[ Laporan Bulanan ] [ Rekap POSM Kuartalan ]`.
- **Tampilan Eksekutif:**
  - Header resmi: "Laporan Eksekutif Distribusi POSM Regional Jawa Tengah".
  - Ringkasan naratif capaian triwulan.
  - Tabel komparasi performa antar-cabang: Semarang, Solo, Purwokerto, Kudus (menampilkan total outlet, capaian target, dan akurasi GPS lapangan).
  - Tombol aksi: Cetak Laporan (memanfaatkan print CSS bawaan) dan Ekspor Data CSV.

---

## 5. Rencana Pengujian & Verifikasi

### 5.1 Unit Tests (`src/lib/marcom/posmQuarterlyAnalytics.test.ts`)
Menggunakan runner native Node (`node --test`) untuk memvalidasi:
1. `getAvailableQuarters`: Menghasilkan daftar kuartal terurut tanpa duplikasi.
2. `buildQuarterlyMatrix`: Menghitung total aktual per tema dan material secara akurat.
3. `buildQuarterlyMatrix` dengan target: Menghitung persentase ketercapaian dan batas pembagian nol.
4. `calculateBranchBreakdown`: Mengelompokkan capaian dan integritas GPS per cabang.
5. `calculateQuarterKpis`: Menghitung total pemasangan, rasio GPS valid, dan deviasi rata-rata.
6. Penanganan *edge case*: Dataset placement kosong (`[]`), tema null/undefined, dan koordinat kosong.

### 5.2 Verifikasi Regresi Menyeluruh
Menjalankan seluruh suite pengujian proyek:
```bash
npm test
```
**Kriteria Lolos:** Seluruh 359+ tes yang ada tetap berstatus 100% lulus (0 failures).

---

## 6. Checklist Eksekusi Bertahap (Roadmap)

- [ ] **Langkah 1:** Definisi tipe data domain di `src/types/index.ts`.
- [ ] **Langkah 2:** Implementasi TDD modul engine analitik di `src/lib/marcom/posmQuarterlyAnalytics.ts` beserta unit test di `posmQuarterlyAnalytics.test.ts`.
- [ ] **Langkah 3:** Pembuatan komponen `QuarterlyRecapTab.tsx` dan integrasi tab toggle di `PlacementsView.tsx`.
- [ ] **Langkah 4:** Pembuatan komponen `QuarterlyPosmReportTab.tsx` dan integrasi di `ReportsView.tsx`.
- [ ] **Langkah 5:** Verifikasi penuh fungsionalitas, interaksi drill-down, dan regresi test suite (`npm test`).
