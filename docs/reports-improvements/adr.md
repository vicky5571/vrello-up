# ADR — Reports View Improvements

> **Status:** Accepted  
> **Tanggal:** 2025  
> **Scope:** 6 keputusan desain & teknis untuk improvement Reports View

---

## #1 — Fix Hardcoded `"Q3 2026"`

**Keputusan:** Ganti semua literal `"Q3 2026"` dengan kalkulasi dinamis dari `new Date()`.

**Alasan:** Fallback hardcoded akan salah secara otomatis begitu kuartal berganti. Tidak ada alasan teknis untuk tidak menghitung ini secara dinamis — semua informasi yang dibutuhkan tersedia dari `Date` API.

**Alternatif yang ditolak:** Menggunakan env variable atau config file — overkill untuk kalkulasi trivial ini.

---

## #2 — KPI Cards → `KpiSummaryCards`

**Keputusan:** Ganti 3 summary cards custom polos dengan komponen `KpiSummaryCards` yang sudah ada di `src/components/views/shared/KpiSummaryCards.tsx`.

**Alasan:**
- Konsistensi visual dengan `DocumentsView`, `HomeView`, dan view lain yang sudah pakai `KpiSummaryCards`
- `KpiSummaryCards` sudah support: icon, color, helper text, trend badge, skeleton loading, mobile strip — semua gratis
- Mengurangi duplikasi markup

**Alternatif yang ditolak:** Upgrade cards custom in-place — lebih banyak effort dengan hasil yang sama.

---

## #3 — Progress Bar di Report List

**Keputusan:** Tambah mini progress bar horizontal di setiap row laporan, menggantikan badge `%` tunggal yang ada sekarang.

**Alasan:** Badge `87%` membutuhkan kognitif lebih tinggi dibanding progress bar yang langsung terbaca secara visual. Konsisten dengan pattern di aplikasi produktivitas modern (Linear, Asana).

**Alternatif yang ditolak:**
- Circular progress — terlalu besar untuk row compact
- Heatmap color di background row — susah dibaca di dark mode

---

## #4 — Highlight Laporan Bulan Ini

**Keputusan:** Tambah badge "Bulan Ini" dan subtle background highlight pada baris laporan yang `month + year`-nya cocok dengan bulan kalender saat ini.

**Alasan:** Dengan list laporan yang terus bertambah, user perlu langsung tahu mana laporan yang relevan saat ini tanpa harus membaca semua label periode.

**Alternatif yang ditolak:**
- Pin laporan bulan ini ke atas list — mengubah sort order yang mungkin disengaja (newest first dari API)
- Full row background warna kuat — terlalu mencolok untuk sebuah list

---

## #5 — Empty State dengan CTA

**Keputusan:** Ganti empty state "No reports found." yang pasif dengan empty state informatif yang langsung bisa trigger form create laporan.

**Alasan:** User yang baru pertama kali membuka Reports view tidak tahu harus berbuat apa. CTA langsung mengurangi friction dan menghilangkan kebingungan.

**Alternatif yang ditolak:** Auto-open form create saat reports kosong — terlalu agresif, bisa mengganggu user yang hanya ingin melihat.

---

## #6 — Delete Laporan (Admin Only)

**Keputusan:** Tambah kemampuan delete laporan dari UI, gated di belakang `canManage`, dengan konfirmasi `window.confirm` sebelum eksekusi.

**Alasan:** Saat ini tidak ada escape hatch jika admin salah input bulan/tahun. Satu-satunya cara hapus adalah langsung ke database. API `DELETE /api/marcom/reports/[id]` sudah ada dan berfungsi — tinggal disambungkan dari UI.

**Keputusan: `window.confirm` bukan modal custom**
Untuk operasi destruktif yang jarang dilakukan (hapus laporan formal), `window.confirm` cukup — tidak perlu modal tambahan yang menambah kompleksitas komponen. Konsisten dengan pattern `deleteOne` di `DocumentsView`.

**Alternatif yang ditolak:**
- Soft delete / archive — butuh perubahan skema DB, overkill untuk sekarang
- Modal konfirmasi custom — overkill untuk aksi admin yang jarang dilakukan
