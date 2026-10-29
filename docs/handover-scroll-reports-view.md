# Implementation Plan: Fix Scroll pada ReportsView

> **Status:** Ready to implement  
> **Estimasi waktu:** 5 menit  
> **Risiko:** Sangat rendah — zero visual regression

---

## Root Cause

Sama persis dengan bug yang sebelumnya diperbaiki di `DocumentsView`.

Chain scroll di app ini mengharuskan **setiap view menyediakan scroll container sendiri** karena seluruh parent chain adalah `overflow-hidden`:

```
h-dvh overflow-hidden (root)
  → overflow-hidden (main)
    → overflow-hidden (view stage)
      → h-full w-full (motion.div wrapper)
        → <ReportsView />  ← ⚠️ scroll container tidak valid
```

Root `<div>` ReportsView saat ini:
```tsx
<div className="flex-1 overflow-auto p-6">
```

**Masalah:** `flex-1` tanpa `h-full` — div tidak punya tinggi yang terdefinisi, sehingga `overflow-auto` tidak punya batas untuk memicu scroll. Konten yang meluap terpotong, bukan bisa di-scroll.

**Perbaikan:** Ganti ke pola dua lapis yang sama dengan `DocumentsView`:
- Outer div: `h-full overflow-y-auto` → scroll container yang valid
- Inner div: `p-6` → jaga padding, zero visual change

---

## File yang Diubah

**Hanya 1 file:** `src/components/views/ReportsView/ReportsView.tsx`

---

## Edit 1 — Ganti root div di awal return

**Lokasi:** baris 409

**oldString:**
```tsx
    <div className="flex-1 overflow-auto p-6">
```

**newString:**
```tsx
    <div className="h-full overflow-y-auto">
      <div className="p-6">
```

---

## Edit 2 — Tutup outer div di akhir file

**Lokasi:** baris 897–899 (closing tag paling akhir)

**oldString:**
```tsx
    </div>
  );
}
```

**newString:**
```tsx
    </div>
  </div>
  );
}
```

---

## QA Checklist

- [ ] Buka Reports view dengan banyak laporan → bisa scroll ke bawah
- [ ] TopNav tidak ikut scroll
- [ ] Tab **Laporan Bulanan** bisa scroll
- [ ] Tab **Rekap POSM Kuartalan** bisa scroll
- [ ] Padding `p-6` tidak berubah secara visual
- [ ] Pindah ke view lain lalu kembali ke Reports → scroll position reset ke atas
- [ ] Dark mode tidak ada anomali
