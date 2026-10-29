# Reports vs Analytics — Batas Tanggung Jawab & Aturan Anti-Overlap

> **Dokumen ini adalah sumber kebenaran tunggal** untuk memutuskan konten apa
> yang masuk ke **Reports** dan apa yang masuk ke **Analytics**.  
> Setiap fitur baru, widget baru, atau data baru harus dicek ke dokumen ini
> sebelum diimplementasikan.

---

## 1. Ringkasan Satu Kalimat

| View | Satu Kalimat |
|---|---|
| **Analytics** | *"Apa yang sedang terjadi sekarang, dan di mana masalahnya?"* |
| **Reports** | *"Apa yang sudah dicapai bulan lalu, dan apa bukti tertulisnya?"* |

---

## 2. Perbedaan Fundamental

| Dimensi | Analytics | Reports |
|---|---|---|
| **Orientasi waktu** | Real-time / rolling (hari ini, minggu ini, kuartal berjalan) | Historis / closed period (bulan selesai, kuartal selesai) |
| **Tujuan utama** | Deteksi anomali, monitoring operasional, trigger aksi | Dokumentasi formal, pertanggungjawaban, arsip |
| **Audience** | Tim operasional internal (PIC lapangan, koordinator) | Manajemen, atasan, pihak eksternal (audit, regulator) |
| **Output** | Chart interaktif, metrik live, alert, drilldown | Dokumen PDF, laporan resmi, tanda tangan |
| **Granularitas** | Per-transaksi, per-outlet, per-event (bisa filter detail) | Per-bulan, per-kuartal (agregat periode tertutup) |
| **Aksi yang ditrigger** | Navigasi ke view operasional (Placements, MOU, Events) | Print/export PDF, simpan ke arsip |
| **Bisa diedit?** | Tidak — read-only, selalu fresh dari data terkini | Ya — admin bisa input narasi, achievement, action plan |
| **Frekuensi buka** | Harian / mingguan | Bulanan / kuartalan |

---

## 3. Kepemilikan Metrik — Siapa Menampilkan Apa

### 3.1 Metrik MILIK Analytics (tidak boleh ada di Reports)

| Metrik | Alasan |
|---|---|
| MOU SLA turnaround (avg hari submission → aktif) | Metrik proses real-time, berubah setiap ada MOU baru |
| POSM Deployment Rate saat ini | Snapshot live, relevan untuk tindakan hari ini |
| Biaya per outlet (cost per outlet) | KPI efisiensi operasional ongoing |
| MOU funnel conversion rate | Health check pipeline, bukan laporan historis |
| Konten tertahan >2 hari (content aging alert) | Alert operasional, bukan metrik pelaporan |
| Chart: POSM Economics (material × status) | Visualisasi interaktif untuk tindakan |
| Chart: MOU Aging heatmap | Deteksi bottleneck approval |
| Chart: Event Efficiency (cost per attendee trend) | Perbandingan efisiensi antar event |
| Chart: Content Cadence (publish rate per channel) | Monitoring ritme konten |
| Filter: Branch / Brand / Quarter (real-time slice) | Slice & dice operasional |

### 3.2 Metrik MILIK Reports (tidak boleh ada di Analytics)

| Metrik | Alasan |
|---|---|
| Total activities per bulan | Rekap periode tertutup |
| Completion rate bulan lalu | Metrik closed period, bukan live |
| Achievements (pencapaian utama) | Narasi kualitatif, ditulis manusia |
| Key issues (kendala lapangan) | Dokumentasi formal per periode |
| Action plans | Rencana yang disepakati, bukan prediksi otomatis |
| Supporting documents per laporan | Bukti lampiran dokumen resmi |
| POSM Quarterly Matrix (Tema × Material) | Rekap kuartalan tertutup untuk laporan eksekutif |
| Branch breakdown kuartalan (realisasi vs target) | Evaluasi performa per periode selesai |
| Tanda tangan digital / cetak PDF | Output dokumen resmi |
| Auto-draft dari data operasional | Titik handoff: data operasional → draft narasi laporan |

### 3.3 Zona Abu-Abu — Aturan Penyelesaian

Beberapa angka muncul di kedua tempat (contoh: jumlah POSM terpasang).
Ini **diizinkan dengan syarat**:

| Kondisi | Aturan |
|---|---|
| Angka sama persis, periode sama | ✅ Boleh — redundansi wajar untuk dua audience berbeda |
| Cara penyajian berbeda | ✅ Analytics: chart/trend · Reports: angka absolut dalam tabel |
| Salah satu bisa drilldown ke sumber data | ✅ Analytics punya drilldown, Reports tidak — ini pembeda sah |
| Kedua view menampilkan **narasi kualitatif** (teks achievements, issues) | ❌ Tidak boleh — narasi hanya di Reports |
| Kedua view punya **filter interaktif real-time** | ❌ Tidak boleh — filter interaktif hanya di Analytics |
| Kedua view punya **tombol Print/Export PDF dokumen resmi** | ❌ Tidak boleh — PDF dokumen resmi hanya di Reports |

---

## 4. Alur Data — Dari Operasional ke Laporan

```
Data Operasional (live)
  ├── Placements, MOUs, Events, Content, Outlets
  │
  ▼
[Analytics View]          [Auto-Draft Engine]
  Monitoring harian   →→→   /api/marcom/reports/draft
  Chart, Alert, KPI         (jembatan: tarik data → draft laporan)
                                      │
                                      ▼
                            [Reports View]
                              Admin edit narasi
                              Simpan ke DB
                              Cetak PDF resmi
```

**Auto-Draft adalah satu-satunya jembatan yang sah** antara Analytics dan Reports.
Data mengalir satu arah: operasional → draft → laporan. Tidak ada arah sebaliknya.

---

## 5. Aturan Wajib (Checklist sebelum implementasi fitur baru)

### ✅ Fitur boleh masuk Analytics jika:
- [ ] Datanya real-time / berubah tanpa aksi manual
- [ ] Tujuannya adalah monitoring atau deteksi masalah
- [ ] Outputnya adalah insight yang memicu aksi (navigasi ke view lain)
- [ ] Tidak butuh tanda tangan atau format dokumen resmi

### ✅ Fitur boleh masuk Reports jika:
- [ ] Datanya untuk periode yang sudah selesai (bulan/kuartal lalu)
- [ ] Ada komponen narasi kualitatif yang ditulis manusia
- [ ] Outputnya adalah dokumen yang bisa dicetak atau diarsipkan
- [ ] Perlu persetujuan / sign-off

### ❌ Fitur TIDAK BOLEH ada di kedua view sekaligus jika:
- [ ] Menampilkan angka yang identik dengan cara yang identik
- [ ] Keduanya punya tombol print PDF dokumen yang sama
- [ ] Keduanya punya filter interaktif untuk data yang sama
- [ ] Keduanya bisa digunakan untuk input/edit narasi yang sama

---

## 6. Contoh Keputusan Konkret

| Pertanyaan | Jawaban | Alasan |
|---|---|---|
| "Tambah chart trend completion rate 12 bulan di Analytics?" | ❌ Reports | Trend historis closed period = milik Reports |
| "Tambah alert MOU pending >7 hari di Reports?" | ❌ Analytics | Alert real-time = milik Analytics |
| "Tambah ringkasan KPI bulan ini di Analytics?" | ✅ Analytics | Data live/rolling = milik Analytics |
| "Tambah grafik batang distribusi POSM di Reports?" | ⚠️ Pertimbangkan | Jika untuk periode tertutup → ok di Reports. Jika real-time → pindah ke Analytics |
| "Duplicate angka POSM di kedua view?" | ✅ Boleh | Angka sama, konteks berbeda (live vs historis), cara tampil berbeda |
| "Tambah filter branch di Reports?" | ❌ Tidak | Filter interaktif real-time adalah domain Analytics |
| "Tambah export CSV di Analytics?" | ✅ Boleh | Export data mentah ≠ export dokumen resmi; Analytics boleh punya export CSV |
| "Tambah tombol Print PDF Laporan Bulanan di Analytics?" | ❌ Tidak | PDF laporan resmi = eksklusif milik Reports |

---

## 7. Identitas Visual — Pembeda di UI

Untuk membantu user tidak bingung, kedua view harus punya identitas visual yang berbeda:

| Aspek | Analytics | Reports |
|---|---|---|
| **Label header** | "Operational Intelligence" + badge "Live Metrics" | "Reports" |
| **Warna aksen** | Indigo / Violet (sudah ada) | Indigo (sudah ada — pertimbangkan diferensiasi) |
| **Icon dominan** | Chart, TrendingUp, AlertCircle | Printer, FileText, Download |
| **Tombol utama** | Refresh (data live) | Export PDF / Cetak |
| **Tagline** | "Metrik operasional riil..." | "Laporan bulanan resmi..." |

---

## 8. State Saat Ini vs Ideal

### Yang sudah benar ✅
- Analytics: hanya chart + KPI live, ada drilldown ke view operasional
- Reports: ada narasi kualitatif (achievements, key issues, action plans)
- Auto-Draft sebagai jembatan sudah diimplementasikan
- POSM Quarterly di Reports = rekap period tertutup ✅

### Yang perlu diwaspadai ⚠️
- **Reports punya "1-Click Executive PDF"** yang menarik data dari draft engine — ini masih ok karena outputnya adalah dokumen resmi, bukan monitoring
- **Reports menampilkan `completionRate`** — angka ini juga muncul di Analytics KPI row. Ini diizinkan karena konteksnya beda (historis vs live), tapi jangan tambah chart trend yang sama di kedua tempat
- **Jika di masa depan ingin menambahkan chart ke Reports** — pastikan chart tersebut hanya untuk periode yang sudah selesai dan tidak interaktif (tidak bisa di-filter real-time)

---

*Dokumen ini dibuat berdasarkan analisis kode aktual di:*
- `src/components/views/AnalyticsView/AnalyticsView.tsx`
- `src/components/views/AnalyticsView/AnalyticsKpiRow.tsx`
- `src/components/views/AnalyticsView/useAnalyticsData.ts`
- `src/components/views/ReportsView/ReportsView.tsx`
- `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`
