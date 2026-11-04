# Specification: Sticky Right Columns untuk Kolom Dokumen MOU dan Aksi pada Tabel MOUs

## Status
IMPLEMENTED (ADR-0030)

## Date
2026-11-05

## 1. Executive Summary
Spesifikasi ini mendefinisikan implementasi deklaratif *sticky right columns* pada tabel modul Marcom MOUs (`MousView`). Kolom **"Dokumen MOU"** (id: `"document"`, lebar 165px) dan kolom setelahnya **"Aksi"** (id: `"actions"`, lebar 130px) dibuat menempel (*pinned / sticky*) di sisi kanan tabel kontainer saat pengguna melakukan *scroll* horizontal. Dengan fitur ini, tombol preview dokumen MOU, download file, quick approval, dan navigasi detail drawer selalu terlihat dan dapat diakses seketika tanpa harus menggeser tabel bolak-balik. Lebar kolom aksi disetel 130px (offset dokumen 130px) guna memastikan tombol Quick Approve dan Chevron Drawer dapat berdampingan tanpa clipping visual.

---

## 2. Problem Statement & Target UX

### 2.1 The Problem
Tabel MOUs memiliki 10 kolom dengan total lebar 1.240px. Pada viewport desktop umum dengan sidebar aktif (lebar area konten ~900–1.100px), tabel berada dalam mode *horizontal scrolling*. 
- Pengguna yang sedang memeriksa mitra di sisi kiri tidak dapat melihat apakah dokumen MOU sudah dilampirkan atau belum.
- Untuk melakukan pratinjau dokumen atau membuka drawer detail, pengguna harus menggeser horizontal ke ujung kanan. Saat berada di ujung kanan, nama mitra dan cabang tersembunyi di luar layar kiri, sehingga pengguna kehilangan konteks baris mana yang sedang mereka lihat.

### 2.2 Target User Experience
1. **Navigasi Tabel**: Saat pengguna membuka halaman MOUs, tabel dirender dengan rapi.
2. **Scroll Horizontal**: Saat pengguna menggeser tabel ke kiri untuk melihat kolom Periode, Kompensasi, atau PIC, kolom **"Dokumen MOU"** dan kolom **"Aksi"** tetap diam (*pinned*) di tepi kanan viewport tabel.
3. **Pemisah Visual Elegan**: Terdapat garis batas dan bayangan lembut di sisi kiri kolom Dokumen MOU, memberikan indikasi visual bahwa kolom di bawahnya sedang bergerak melewatinya.
4. **Warna Latar Solid & Hover Sinkron**: Latar belakang kolom sticky memiliki warna solid (`bg-slate-50 dark:bg-[#18191B]` pada header dan `bg-white dark:bg-[#18191B]` pada baris) sehingga teks di bawahnya tidak tembus pandang, dan ikut berubah warna secara natural saat baris di-hover (`group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40`).

---

## 3. Component Manifest & Architectural Contracts

| Komponen / Modul | Path File | Tanggung Jawab |
|---|---|---|
| `MarcomTableShell.tsx` | `src/components/views/shared/MarcomTableShell.tsx` | Koordinator tabel bersama. Membaca `meta.sticky`, `meta.stickyOffset`, dan `meta.stickyBorder`, lalu merender style sticky pada header dan cell secara generik. |
| `mouColumns.tsx` | `src/components/views/MousView/mouColumns.tsx` | Konfigurasi kolom tabel MOUs. Mendefinisikan meta sticky pada kolom `document` (offset 130px) dan `actions` (offset 0px). |
| `mouColumns.test.ts` | `src/components/views/MousView/mouColumns.test.ts` | Unit test suite untuk memastikan konfigurasi meta sticky pada kolom MOU valid dan persisten. |

---

## 4. Pure Logic & Data Contracts

### 4.1 Interface `MarcomColumnMeta`
Didefinisikan di `src/components/views/shared/MarcomTableShell.tsx`:
```typescript
export interface MarcomColumnMeta {
  align?: "left" | "right";
  sticky?: "right" | "left";
  stickyOffset?: number;
  stickyBorder?: boolean;
}
```

### 4.2 Konfigurasi Kolom di `src/components/views/MousView/mouColumns.tsx`
```typescript
    // Kolom Dokumen MOU
    columnHelper.accessor("docPath", {
      id: "document",
      header: "Dokumen MOU",
      size: 165,
      minSize: 150,
      maxSize: 185,
      enableSorting: false,
      meta: {
        sticky: "right",
        stickyOffset: 130,
        stickyBorder: true,
      },
      cell: ({ row }) => { ... },
    }),

    // Kolom Aksi
    columnHelper.display({
      id: "actions",
      header: () => null,
      size: 130,
      minSize: 115,
      maxSize: 150,
      enableSorting: false,
      meta: {
        sticky: "right",
        stickyOffset: 0,
      },
      cell: ({ row }) => { ... },
    }),
```

### 4.3 Rendering di `MarcomTableShell.tsx`

#### Header Rendering:
```tsx
const meta = (header.column.columnDef as any)?.meta as MarcomColumnMeta | undefined;
const isRightSticky = meta?.sticky === "right";
const rightOffset = meta?.stickyOffset ?? 0;
const hasStickyBorder = meta?.stickyBorder ?? false;

<div
  key={header.id}
  role="columnheader"
  style={{
    width: `${(header as any).getSize()}px`,
    ...(isRightSticky ? { position: "sticky", right: `${rightOffset}px` } : {}),
  }}
  className={cn(
    "relative flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden",
    isRightAligned && "justify-end",
    isRightSticky && "z-20 bg-slate-50 dark:bg-[#18191B]",
    hasStickyBorder && "border-l border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]",
  )}
>
```

#### Row Cell Rendering:
```tsx
const meta = (cell.column.columnDef as any)?.meta as MarcomColumnMeta | undefined;
const isRightSticky = meta?.sticky === "right";
const rightOffset = meta?.stickyOffset ?? 0;
const hasStickyBorder = meta?.stickyBorder ?? false;

<div
  key={cell.id}
  role="cell"
  style={{
    width: `${cell.column.getSize()}px`,
    ...(isRightSticky ? { position: "sticky", right: `${rightOffset}px` } : {}),
  }}
  className={cn(
    "shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden",
    isRightSticky && "z-10 bg-white dark:bg-[#18191B] group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40",
    hasStickyBorder && "border-l border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]",
  )}
>
```

---

## 5. Non-Goals
1. **Tidak Mengubah Data Fetching atau State Table**: Logika sorting, filtering, selection, dan pagination tetap tidak berubah.
2. **Tidak Mengubah Modul Lain**: Tabel pada modul Branches, Outlets, Placements, Events, dan Documents tetap mempertahankan perilaku default mereka tanpa sticky right kecuali jika di kemudian hari ditambahkan `meta.sticky`.

---

## 6. Acceptance Criteria
- [ ] `MarcomTableShell.tsx` mendukung konfigurasi `meta?: MarcomColumnMeta` secara deklaratif.
- [ ] Kolom `document` pada tabel MOUs memiliki `position: sticky` dengan offset kanan 130px dan pembatas border kiri.
- [ ] Kolom `actions` pada tabel MOUs memiliki `position: sticky` dengan offset kanan 0px.
- [ ] Header dan cell data pada kolom `document` dan `actions` menempel secara konsisten saat tabel di-scroll secara horizontal.
- [ ] Latar belakang kolom sticky solid dan tidak tembus pandang terhadap kolom yang bergeser di bawahnya.
- [ ] Efek hover baris tetap bekerja secara halus pada kolom sticky.
- [ ] Unit test baru di `mouColumns.test.ts` memverifikasi konfigurasi meta sticky pada kolom `document` dan `actions`.
- [ ] `npm run drift:check`, `npm run build:check`, dan `npm test` semuanya lulus 100%.



