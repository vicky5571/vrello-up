# ADR-0030: Sticky Right Columns untuk Kolom Dokumen MOU dan Aksi pada Tabel MOUs

## Status
ACCEPTED

## Date
2026-11-05

## Context & Problem Statement
Modul Marcom MOUs (`MousView`) menyajikan daftar kemitraan outlet dalam tabel komprehensif (`mouColumns.tsx`) yang dirender menggunakan koordinator tabel bersama `MarcomTableShell.tsx`.

Tabel MOUs saat ini memiliki 10 kolom dengan total lebar ~1.240px:
*Expander (40px) $\rightarrow$ Mitra (200px) $\rightarrow$ Cabang (140px) $\rightarrow$ Tipe (150px) $\rightarrow$ Status (120px) $\rightarrow$ Periode (140px) $\rightarrow$ Kompensasi (160px) $\rightarrow$ PIC (150px) $\rightarrow$ Dokumen MOU (155px) $\rightarrow$ Aksi (85px)*.

Pada layar laptop atau desktop standar dengan sidebar navigasi terbuka, total lebar 1.240px melampaui lebar viewport kontainer, memaksa pengguna melakukan scroll horizontal ke kanan untuk:
1. Memeriksa apakah berkas dokumen MOU sudah terunggah (`docPath`).
2. Menekan tombol pratinjau dokumen (*Preview modal*) atau download berkas.
3. Menekan tombol aksi (*Quick Approve* atau *Open Drawer Detail*).

Ketika pengguna menggeser tabel ke kanan untuk melihat dokumen dan aksi, mereka kehilangan konteks kolom utama di sebelah kiri (nama mitra outlet dan cabang). Sebaliknya, ketika pengguna melihat nama mitra di kiri, kolom dokumen dan aksi tersembunyi di luar layar.

## Options Considered

### Opsi 1: Dukungan Meta Kolom Deklaratif di `MarcomTableShell` (TERPILIH)
- Memperluas `MarcomTableShell.tsx` untuk membaca konfigurasi `meta?: { sticky?: "right"; stickyOffset?: number; stickyBorder?: boolean }` pada header dan baris data.
- Di `mouColumns.tsx`:
  - Kolom `actions` (lebar 85px): `meta: { sticky: "right", stickyOffset: 0 }`.
  - Kolom `document` (lebar 155px): `meta: { sticky: "right", stickyOffset: 85, stickyBorder: true }`.
- Shell menerapkan `position: sticky`, offset `right`, z-index bertingkat (`z-20` untuk header, `z-10` untuk data rows), dan background solid (`bg-slate-50 dark:bg-[#18191B]` di header, `bg-white dark:bg-[#18191B]` di baris dengan dukungan hover).
- **Trade-off Summary**:
  - *Engineering Cleanliness*: Sangat tinggi. Menggunakan CSS standar tanpa overhead TanStack plugin.
  - *Reusability*: Tabel lain (`OutletsView`, `PlacementsView`, dll.) dapat memanfaatkan fitur sticky ini hanya dengan menambahkan `meta`.
  - *Performance*: Zero additional network/state overhead.

### Opsi 2: Integrasi Penuh TanStack `columnPinningFeature`
- Menambahkan plugin `columnPinningFeature` pada `marcomFeatures` TanStack table-core.
- **Trade-off Summary**:
  - Menambah kompleksitas tipe generik pada seluruh shell tabel marcom dan berpotensi menimbulkan regresi sizing pada tabel lain yang sudah stabil.

### Opsi 3: Hardcode CSS Wrapper di dalam Kolom Saja
- Membungkus isi sel di `mouColumns.tsx` dengan inline sticky tanpa mengubah `MarcomTableShell.tsx`.
- **Trade-off Summary**:
  - Cacat arsitektural. Header tabel (`<th>`) tidak dapat ikut menempel karena header dikontrol oleh shell, mengakibatkan ketidaksejajaran antara header dan isi tabel saat di-scroll.

## Decision
Kami memilih **Opsi 1**. Kami mengimplementasikan dukungan deklaratif sticky right columns pada `MarcomTableShell.tsx` melalui properti `meta` kolom, dan mengonfigurasikan kolom `document` dan `actions` pada `mouColumns.tsx` agar menempel di sisi kanan layar.

## Consequences

### Positif
- **Efisiensi Operasional Tinggi**: Pengguna dapat melihat tombol dokumen MOU dan tombol aksi/approval kapan saja tanpa perlu menggeser tabel ke ujung kanan secara manual.
- **Konteks Mitra Tetap Terjaga**: Pengguna dapat melihat nama mitra/cabang di sisi kiri sambil langsung berinteraksi dengan tombol dokumen dan aksi di sisi kanan.
- **Keselarasan Visual**: Header dan baris data menempel secara serasi tanpa jitter atau pergeseran layout.
- **Solusi Generik untuk Seluruh Aplikasi**: Tabel marcom lainnya dapat mengadopsi kolom sticky cukup dengan menambahkan konfigurasi `meta`.

### Negatif / Trade-offs Diterima
- Pada layar yang sangat sempit (< 640px / mobile), area sticky selebar 240px akan mendominasi sebagian layar viewport. Namun, pengguna mobile menggunakan layout card view terpisah.

## Invariant Compliance
- [x] **No Single-Tenant Drift**: Nol workspace leakage.
- [x] **Zero Breaking Changes on Other Tables**: Tabel yang tidak mendefinisikan `meta.sticky` tetap beroperasi seperti biasa.
- [x] **Verification Gate**: `npm run drift:check`, `npm run build:check`, dan `npm test` wajib 100% lolos.



