# Spec — Reports View Improvements

> **Status:** Ready  
> **File utama:** `src/components/views/ReportsView/ReportsView.tsx`  
> **File sekunder:** `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`, `src/lib/marcom/marcomDataStore.ts`

---

## Daftar Improvement

| # | Item | File | Effort |
|---|---|---|---|
| 1 | Fix hardcoded `"Q3 2026"` | `QuarterlyPosmReportTab.tsx` | XS |
| 2 | KPI Cards → `KpiSummaryCards` | `ReportsView.tsx` | S |
| 3 | Progress bar di report list | `ReportsView.tsx` | S |
| 4 | Highlight laporan bulan ini | `ReportsView.tsx` | XS |
| 5 | Empty state dengan CTA | `ReportsView.tsx` | XS |
| 6 | Delete laporan (admin only) | `ReportsView.tsx` + `marcomDataStore.ts` | M |

---

## #1 — Fix Hardcoded `"Q3 2026"`

- `currentQuarterFallback` dihitung **sekali** via `useMemo` dengan dep array `[]`
- Formula: `` `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}` ``
- Digunakan di dua tempat: argument `getAvailableQuarters()` dan fallback `useState`

**QA:** Buka tab POSM Quarterly — quarter selector harus default ke kuartal saat ini, bukan Q3 2026.

---

## #2 — KPI Cards → `KpiSummaryCards`

3 KPI cards dengan data dari `summary` (hasil `summarizeReports()`):

| Card | `label` | `value` | `helper` | `icon` | `color` |
|---|---|---|---|---|---|
| Total Laporan | "Total Laporan" | `summary.total` | `"Laporan tersimpan"` | `FileText` | `"indigo"` |
| Total Aktivitas | "Total Aktivitas" | `summary.totalActivities` | `"Akumulasi semua periode"` | `Activity` | `"blue"` |
| Avg Completion | "Avg Completion" | `` `${summary.completionRate}%` `` | lihat tabel bawah | `TrendingUp` | dinamis |

**Warna & helper text `Avg Completion`:**

| Rate | `color` | `helper` |
|---|---|---|
| ≥ 80% | `"emerald"` | `"Di atas target operasional"` |
| 50–79% | `"amber"` | `"Perlu perhatian"` |
| < 50% | `"rose"` | `"Di bawah ekspektasi"` |

**Loading state:** `isLoading={isLoading}` dan `skeletonCount={3}`.

**QA:**
- Skeleton 3 cards muncul saat `isLoading=true`
- Warna berubah sesuai threshold
- Layout tidak berubah di sekitar cards

---

## #3 — Progress Bar di Report List

**Struktur visual** menggantikan badge `%` di setiap row:
```
[label periode]  [N activities]  [====........] 87%
```

| Properti | Nilai |
|---|---|
| Lebar bar | `w-24` |
| Tinggi bar | `h-1.5` |
| Track | `bg-slate-200 dark:bg-slate-700` |
| Fill ≥80% | `bg-emerald-500` |
| Fill 50–79% | `bg-amber-400` |
| Fill <50% | `bg-rose-500` |
| Width fill | `style={{ width: \`${Math.min(rate, 100)}%\` }}` |
| Angka % | teks `text-[11px]` di kanan bar, `tabular-nums w-8 text-right` |
| Mobile | `hidden sm:flex` — bar disembunyikan di bawah 640px |

**Helper function:**
```ts
function completionBarColor(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-400";
  return "bg-rose-500";
}
```

**QA:**
- ≥80%: bar hijau, 50–79%: bar amber, <50%: bar merah
- Completion 100%: bar penuh, tidak overflow
- Mobile (<640px): bar tersembunyi, row tetap rapi

---

## #4 — Highlight Laporan Bulan Ini

**Deteksi "bulan ini"** (dihitung per row di dalam `reports.map()`):
```ts
const isCurrentPeriod =
  report.month === MONTH_OPTIONS[now.getMonth()] &&
  report.year === now.getFullYear();
```

**Visual saat `isCurrentPeriod === true`:**

| Elemen | Style |
|---|---|
| Row background | `bg-indigo-50/50 dark:bg-indigo-950/20` |
| Row hover | `hover:bg-indigo-50 dark:hover:bg-indigo-950/30` |
| Badge | `"Bulan Ini"` — `text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full` |
| Posisi badge | Setelah `span` periodLabel, sebelum span activities |

**QA:**
- Laporan bulan berjalan → tersorot + badge muncul
- Bulan lain → tidak ada highlight
- Dark mode → highlight tetap subtle

---

## #5 — Empty State dengan CTA

**Tampilan** (menggantikan "No reports found."):

```
[icon FileText, w-10 h-10, slate-300]

"Belum ada laporan tersimpan"
"Buat laporan bulanan pertama untuk mulai mendokumentasikan aktivitas Marcom."

[tombol — hanya jika canManage]
"+ Buat Laporan Pertama"  →  setShowCreateForm(true)
```

**Styling:**

| Elemen | Kelas |
|---|---|
| Container | `p-16 flex flex-col items-center justify-center text-center gap-3` |
| Icon | `w-10 h-10 text-slate-300 dark:text-slate-700` |
| Judul | `text-sm font-semibold text-slate-500 dark:text-slate-400` |
| Subteks | `text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs` |
| Tombol | `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer mt-1` |

**QA:**
- Admin → tombol muncul, klik → form create terbuka
- Non-admin → hanya teks, tidak ada tombol
- Setelah laporan tersimpan → empty state hilang

---

## #6 — Delete Laporan (Admin Only)

**Placement:** Di dalam expanded row, sejajar dengan tombol "Cetak Dokumen Resmi".

**Flow:**
1. Admin klik tombol "Hapus Laporan" (`Trash2` icon)
2. `window.confirm("Hapus laporan [periode]? Tindakan ini tidak dapat dibatalkan.")`
3. Jika konfirmasi → `DELETE /api/marcom/reports/[id]`
4. Sukses → `removeCachedReport(id)` + collapse expanded row + toast success
5. Gagal → toast error, tidak ada perubahan UI

**State baru:** `isDeletingId: string | null` — disable tombol + tampilkan spinner selama request.

**Styling tombol:**
```
bg-white dark:bg-slate-900
text-rose-600 dark:text-rose-400
border border-rose-200 dark:border-rose-900/50
hover:bg-rose-50 dark:hover:bg-rose-950/30
disabled:opacity-50
```

**Store:** `removeCachedReport` belum ada — harus ditambahkan ke `marcomDataStore`.

**QA:**
- Admin → tombol muncul di expanded row
- Non-admin → tombol tidak muncul
- Cancel confirm → tidak ada perubahan
- Sukses → laporan hilang, row collapse, toast success
- Error → toast error, laporan masih ada
- Selama request → tombol disable + spinner
