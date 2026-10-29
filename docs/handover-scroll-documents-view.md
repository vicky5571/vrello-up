# Handover: Fix Scroll pada DocumentsView

> **Status:** Ready to implement  
> **Estimasi waktu:** 5–10 menit  
> **Risiko:** Sangat rendah — perubahan minimal, zero visual regression  

---

## 1. Konteks & Root Cause

### Bagaimana scroll bekerja di app ini

App ini adalah SPA shell dengan arsitektur scroll yang **fully contained** — setiap layer sengaja `overflow-hidden`, sehingga **setiap view wajib menyediakan scroll container-nya sendiri**:

```
<div class="flex h-dvh overflow-hidden">           ← src/app/page.tsx (root)
  └── <main class="overflow-hidden h-full">        ← workspace main
        └── <div class="flex-1 overflow-hidden">   ← view stage
              └── <motion.div class="h-full w-full">
                    └── <DocumentsView />          ← ⚠️ TIDAK ADA SCROLL DI SINI
```

### Root cause

`DocumentsView` root `<div>` hanya punya:
```tsx
// src/components/views/DocumentsView/DocumentsView.tsx — baris 455
<div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
```

**Tidak ada `overflow-y-auto` dan tidak ada `h-full`** → konten yang meluap ke bawah terpotong (clipped) dan tidak bisa di-scroll.

### Bukti: view lain sudah benar

| View | Root class (scroll) |
|---|---|
| `HomeView` | `flex-1 overflow-y-auto px-8 py-6 h-full` ✅ |
| `ListView` | `flex-1 overflow-y-auto px-4 md:px-8 py-6 h-full` ✅ |
| `AnalyticsView` | `h-full w-full overflow-auto p-6` ✅ |
| `DocumentsView` | `p-4 sm:p-6 space-y-6 max-w-7xl mx-auto` ❌ |

---

## 2. Desain Scroll yang Direkomendasikan

**Scroll sebagian (partial scroll) — bukan seluruh halaman.**

Yang scroll: seluruh konten di dalam `DocumentsView` (header title, KPI bar, filter chips, grid/table dokumen)  
Yang **tidak** scroll: `TopNav`, `Sidebar`, `GlobalRail`

Ini konsisten dengan semua view lain di app ini dan merupakan standar aplikasi produktivitas modern (Notion, Linear, ClickUp).

---

## 3. File yang Diubah

### File 1 — WAJIB diubah
**`src/components/views/DocumentsView/DocumentsView.tsx`**

### File 2 — Tidak perlu diubah
- `src/app/page.tsx` — `motion.div` wrapper untuk `documents-view` sudah punya `key="documents-view"`, jadi scroll reset otomatis saat pindah view.
- `src/components/views/DocumentsView/DocumentCardsView.tsx` — tidak ada `overflow-hidden` yang menghalangi.
- `src/app/globals.css` — scrollbar styling sudah bagus, tidak perlu diubah.

---

## 4. Implementasi

### Perubahan di `DocumentsView.tsx`

**Lokasi:** baris 454–455 (tepat di `return (`)

**Sebelum:**
```tsx
return (
  <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
    {/* ...semua konten... */}
  </div>
);
```

**Sesudah:**
```tsx
return (
  <div className="h-full overflow-y-auto">
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* ...semua konten... */}
    </div>
  </div>
);
```

Closing tag `</div>` di baris 947–948 juga perlu ditutup dengan satu `</div>` tambahan untuk outer wrapper:

**Sebelum (akhir file):**
```tsx
      {/* 7. Google Drive Link Modal */}
      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
        defaultKind="all"
      />
    </div>
  );
}
```

**Sesudah:**
```tsx
      {/* 7. Google Drive Link Modal */}
      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
        defaultKind="all"
      />
    </div>
  </div>
  );
}
```

### Penjelasan pola dua lapis

```
outer div: h-full overflow-y-auto
  → menjadi scroll container yang pas mengisi view stage
  → scrollbar muncul di tepi kanan area konten

inner div: p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in ...
  → tidak ada perubahan visual sama sekali
  → padding, max-width, spacing, animasi tetap sama persis
```

Pola ini identik dengan cara `ListView` dan `HomeView` bekerja.

---

## 5. Edit yang Harus Dilakukan (Copy-Paste Ready)

### Edit 1 — Tambah outer scroll wrapper di awal return

**oldString:**
```
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
```

**newString:**
```
  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
```

---

### Edit 2 — Tutup outer div di akhir return

**oldString:**
```
    </div>
  );
}
```
*(catatan: ini adalah closing tag paling akhir dari file — tepat setelah `</GoogleDriveLinkModal>`)*

**newString:**
```
    </div>
    </div>
  );
}
```

---

## 6. QA Checklist Setelah Implementasi

- [ ] Buka Documents view dengan banyak dokumen (>12 cards) → pastikan bisa scroll ke bawah
- [ ] `TopNav` tidak ikut bergerak saat scroll
- [ ] Toggle antara **Cards view** dan **Table view** → keduanya scrollable
- [ ] Pindah ke view lain (contoh: Home) → kembali ke Documents → scroll position kembali ke atas
- [ ] Search + filter kategori tetap berfungsi normal
- [ ] Tidak ada perubahan visual pada padding, spacing, max-width
- [ ] Cek di viewport sempit (mobile ~375px)
- [ ] Dark mode tidak ada anomali

---

## 7. Referensi Codebase

| Item | Lokasi |
|---|---|
| File yang diubah | `src/components/views/DocumentsView/DocumentsView.tsx` |
| View stage (parent) | `src/app/page.tsx` baris 203 |
| DocumentsView di page.tsx | `src/app/page.tsx` baris 373–384 |
| Contoh view yang sudah benar | `src/components/views/HomeView/HomeView.tsx` |
| Scrollbar global styling | `src/app/globals.css` baris 162–193 |
