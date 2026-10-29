# Implementation Plan — Reports View Improvements

> **Status:** Ready to execute  
> **Urutan eksekusi:** #1 → #5 → #4 → #3 → #2 → #6 (risiko terkecil ke terbesar)  
> **Catatan:** Setiap item bisa di-commit secara terpisah. Tidak ada dependency antar item kecuali import `FileText` yang dipakai #2 dan #5 — kerjakan keduanya dalam satu commit jika dilakukan bersama.

---

## #1 — Fix Hardcoded `"Q3 2026"`

**File:** `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`  
**Lokasi:** Tepat sebelum `availableQuarters` useMemo (~baris 63)

**Step 1** — Tambah `useMemo` `currentQuarterFallback` sebelum `availableQuarters`:
```ts
const currentQuarterFallback = useMemo(() => {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}, []);
```

**Step 2** — Edit `availableQuarters` useMemo:
```ts
// SEBELUM
() => getAvailableQuarters(placements, "Q3 2026"),
[placements]

// SESUDAH
() => getAvailableQuarters(placements, currentQuarterFallback),
[placements, currentQuarterFallback]
```

**Step 3** — Edit `useState` fallback:
```ts
// SEBELUM
() => availableQuarters[availableQuarters.length - 1] || "Q3 2026"

// SESUDAH
() => availableQuarters[availableQuarters.length - 1] || currentQuarterFallback
```

---

## #2 — KPI Cards → `KpiSummaryCards`

**File:** `src/components/views/ReportsView/ReportsView.tsx`

**Step 1** — Tambah ke import lucide-react (yang sudah ada di baris ~6):
```ts
// Tambah: FileText, Activity
// TrendingUp sudah ada? Cek — jika belum, tambahkan juga
```

**Step 2** — Tambah import komponen shared (setelah import `QuarterlyPosmReportTab`):
```ts
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
```

**Step 3** — Tambah `useMemo` `kpiCards` setelah `summary` useMemo (~baris 195):
```ts
const kpiCards = useMemo<KpiCardItem[]>(() => {
  const rate = summary.completionRate;
  const rateColor =
    rate >= 80 ? "emerald" : rate >= 50 ? "amber" : "rose";
  const rateHelper =
    rate >= 80
      ? "Di atas target operasional"
      : rate >= 50
      ? "Perlu perhatian"
      : "Di bawah ekspektasi";
  return [
    {
      label: "Total Laporan",
      value: summary.total,
      helper: "Laporan tersimpan",
      icon: FileText,
      color: "indigo",
    },
    {
      label: "Total Aktivitas",
      value: summary.totalActivities,
      helper: "Akumulasi semua periode",
      icon: Activity,
      color: "blue",
    },
    {
      label: "Avg Completion",
      value: `${rate}%`,
      helper: rateHelper,
      icon: TrendingUp,
      color: rateColor,
    },
  ];
}, [summary]);
```

**Step 4** — Ganti blok summary cards di JSX (~baris 422–440):
```tsx
// HAPUS seluruh blok:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
  {[...].map((card) => (...))}
</div>

// GANTI DENGAN:
<div className="mb-3">
  <KpiSummaryCards
    items={kpiCards}
    isLoading={isLoading}
    skeletonCount={3}
  />
</div>
```

---

## #3 — Progress Bar di Report List

**File:** `src/components/views/ReportsView/ReportsView.tsx`

**Step 1** — Tambah helper function `completionBarColor` setelah fungsi `renderJsonItem` (~baris 92):
```ts
function completionBarColor(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-400";
  return "bg-rose-500";
}
```

**Step 2** — Dalam `reports.map()`, ganti badge completion (~baris 680–682):
```tsx
// HAPUS:
<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
  {report.summary?.completionRate ?? 0}%
</span>

// GANTI DENGAN:
<div className="hidden sm:flex items-center gap-1.5 shrink-0">
  <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
    <div
      className={cn("h-full rounded-full transition-all", completionBarColor(report.summary?.completionRate ?? 0))}
      style={{ width: `${Math.min(report.summary?.completionRate ?? 0, 100)}%` }}
    />
  </div>
  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tabular-nums w-8 text-right">
    {report.summary?.completionRate ?? 0}%
  </span>
</div>
```

---

## #4 — Highlight Laporan Bulan Ini

**File:** `src/components/views/ReportsView/ReportsView.tsx`

**Step 1** — Di dalam `reports.map()`, setelah `const supporting = ...` (~baris 666), tambah:
```ts
const now = new Date();
const isCurrentPeriod =
  report.month === MONTH_OPTIONS[now.getMonth()] &&
  report.year === now.getFullYear();
```

**Step 2** — Edit className outer row div yang clickable (~baris 670):
```tsx
// SEBELUM:
className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"

// SESUDAH:
className={cn(
  "flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-xs",
  isCurrentPeriod
    ? "bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
    : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
)}
```

**Step 3** — Tambah badge setelah `<span>` periodLabel (~baris 675):
```tsx
{isCurrentPeriod && (
  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full shrink-0">
    Bulan Ini
  </span>
)}
```

---

## #5 — Empty State dengan CTA

**File:** `src/components/views/ReportsView/ReportsView.tsx`

**Step 1** — Pastikan `FileText` sudah ada di lucide import (dari #2). Jika #2 dikerjakan terpisah, tambahkan sendiri.

**Step 2** — Ganti blok empty state (~baris 774–779):
```tsx
// HAPUS:
{!isLoading && !error && reports.length === 0 && (
  <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
    <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
    <span>No reports found.</span>
  </div>
)}

// GANTI DENGAN:
{!isLoading && !error && reports.length === 0 && (
  <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700" />
    <div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        Belum ada laporan tersimpan
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
        Buat laporan bulanan pertama untuk mulai mendokumentasikan aktivitas Marcom.
      </p>
    </div>
    {canManage && (
      <button
        type="button"
        onClick={() => setShowCreateForm(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Buat Laporan Pertama</span>
      </button>
    )}
  </div>
)}
```

---

## #6 — Delete Laporan (Admin Only)

**2 file yang diubah.**

---

### File A: `src/lib/marcom/marcomDataStore.ts`

**Step 1** — Tambah type signature di interface store (~baris 73, setelah `addCachedReport`):
```ts
removeCachedReport: (reportId: string) => void;
```

**Step 2** — Tambah implementasi (~baris 336, setelah `addCachedReport` implementation):
```ts
removeCachedReport: (reportId: string) => {
  set((s) => ({
    reports: s.reports.filter((r) => r.id !== reportId),
  }));
},
```

---

### File B: `src/components/views/ReportsView/ReportsView.tsx`

**Step 3** — Tambah `Trash2` ke lucide-react imports.

**Step 4** — Tambah state `isDeletingId` setelah `isInstantExporting` (~baris 150):
```ts
const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
```

**Step 5** — Tambah store subscription `removeCachedReport` setelah `addCachedReport` (~baris 129):
```ts
const removeCachedReport = useMarcomDataStore((s) => s.removeCachedReport);
```

**Step 6** — Tambah handler `handleDeleteReport` setelah `handleCreate` (~baris 335):
```ts
const handleDeleteReport = async (report: MarcomReport) => {
  const confirmed = window.confirm(
    `Hapus laporan "${periodLabel(report)}"? Tindakan ini tidak dapat dibatalkan.`
  );
  if (!confirmed) return;
  setIsDeletingId(report.id);
  try {
    const res = await fetch(`/api/marcom/reports/${report.id}`, { method: "DELETE" });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Gagal menghapus laporan (${res.status})`);
    }
    removeCachedReport(report.id);
    if (expandedId === report.id) setExpandedId(null);
    toast.success(`Laporan ${periodLabel(report)} berhasil dihapus`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Gagal menghapus laporan");
  } finally {
    setIsDeletingId(null);
  }
};
```

**Step 7** — Tambah tombol delete di dalam expanded row, setelah tombol "Cetak Dokumen Resmi" (~baris 729):
```tsx
{canManage && (
  <button
    type="button"
    onClick={() => handleDeleteReport(report)}
    disabled={isDeletingId === report.id}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
  >
    {isDeletingId === report.id
      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      : <Trash2 className="w-3.5 h-3.5" />
    }
    <span>{isDeletingId === report.id ? "Menghapus..." : "Hapus Laporan"}</span>
  </button>
)}
```

---

## Urutan Eksekusi

```
1. #1 Fix Q3 2026      → QuarterlyPosmReportTab.tsx saja, isolated
2. #5 Empty state CTA  → ReportsView.tsx, perubahan minimal
3. #4 Highlight        → ReportsView.tsx, pure additive
4. #3 Progress bar     → ReportsView.tsx, ganti satu elemen
5. #2 KPI Cards        → ReportsView.tsx, ganti blok + tambah useMemo + import baru
6. #6 Delete           → 2 file, paling banyak langkah
```

## Referensi Kode

| Resource | Path |
|---|---|
| File utama | `src/components/views/ReportsView/ReportsView.tsx` |
| POSM tab | `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx` |
| Store | `src/lib/marcom/marcomDataStore.ts` |
| DELETE API | `src/app/api/marcom/reports/[id]/route.ts` |
| KpiSummaryCards | `src/components/views/shared/KpiSummaryCards.tsx` |
| summarizeReports | `src/lib/marcom/analytics.ts` |
