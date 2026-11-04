# Implementation Plan: Sticky Right Columns untuk Kolom Dokumen MOU dan Aksi pada Tabel MOUs

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-mou-table-sticky-right-columns-design.md`  
**ADR:** `docs/adr/0030-mou-table-sticky-right-columns.md`  
**Status:** COMPLETED

---

## 1. Plan Overview & Objectives
Mengimplementasikan kolom sticky kanan (*sticky right columns*) pada tabel MOUs untuk kolom **"Dokumen MOU"** (lebar 155px) dan **"Aksi"** (lebar 85px):
1. **Dukungan Shell Deklaratif**: Perluas `MarcomTableShell.tsx` agar mengenali `meta: { sticky?: "right", stickyOffset?: number, stickyBorder?: boolean }` untuk styling header dan data cells secara murni via CSS standard `position: sticky`.
2. **Konfigurasi Kolom MOU**: Tambahkan `meta` pada kolom `document` dan `actions` di `src/components/views/MousView/mouColumns.tsx`.
3. **Automated Unit Testing**: Buat pengujian otomatis di `src/components/views/MousView/mouColumns.test.ts` untuk memastikan konfigurasi `sticky: "right"` dan offset 85px/0px terpasang dengan presisi.
4. **Verifikasi Kualitas**: Jalankan `npm run drift:check` (57 spec-plan pairs), `npm run build:check`, dan `npm test`.

---

## 2. File Manifest & Responsibility Breakdown

| File Path | Action | Estimated LOC Change | Responsibility |
|---|---|---|---|
| `src/components/views/shared/MarcomTableShell.tsx` | Modify | +25 / -5 LOC | Tambahkan tipe `MarcomColumnMeta` dan terapkan rendering sticky pada header dan cell div. |
| `src/components/views/MousView/mouColumns.tsx` | Modify | +14 / -2 LOC | Tambahkan konfigurasi `meta` sticky pada kolom `document` dan `actions`. |
| `src/components/views/MousView/mouColumns.test.ts` | Create | +45 / -0 LOC | Unit test suite untuk memvalidasi konfigurasi kolom MOU dan meta sticky. |

---

## 3. Risks & Mitigations

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Warna latar sel tembus pandang saat di-scroll | Rendah | Sedang | Pasang background warna solid `bg-white dark:bg-[#18191B]` dan `bg-slate-50 dark:bg-[#18191B]` pada elemen yang memiliki sticky. |
| Inkonsistensi warna saat hover baris | Rendah | Rendah | Tambahkan kelas `group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40` pada sel sticky agar selaras dengan hover baris. |
| Regresi pada tabel modul lain (Outlets, Events, dll.) | Sangat Rendah | Tinggi | Fitur sticky di shell murni deklaratif; tabel yang tidak mendefinisikan `meta.sticky` tetap menggunakan rendering standar. |

---

## 4. Phase 1: Implementasi Fitur Deklaratif Sticky Columns di `MarcomTableShell.tsx`

### Tasks:
- [x] **1.1 Definisikan Tipe `MarcomColumnMeta`**:
  - Di `src/components/views/shared/MarcomTableShell.tsx`:
    ```typescript
    export interface MarcomColumnMeta {
      align?: "left" | "right";
      sticky?: "right" | "left";
      stickyOffset?: number;
      stickyBorder?: boolean;
    }
    ```
- [x] **1.2 Perbarui Rendering Header**:
  - Pada `headerGroup.headers.map`:
    - Ekstrak `meta = (header.column.columnDef as any)?.meta as MarcomColumnMeta | undefined;`
    - Jika `meta?.sticky === "right"`, terapkan style inline `position: "sticky"`, `right: `${meta.stickyOffset ?? 0}px``, dan kelas `z-20 bg-slate-50 dark:bg-[#18191B]`.
    - Jika `meta?.stickyBorder`, terapkan border kiri dan bayangan lembut `border-l border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]`.
- [x] **1.3 Perbarui Rendering Baris Data Cell**:
  - Pada `(row as any).getVisibleCells().map`:
    - Ekstrak `meta = (cell.column.columnDef as any)?.meta as MarcomColumnMeta | undefined;`
    - Jika `meta?.sticky === "right"`, terapkan style inline `position: "sticky"`, `right: `${meta.stickyOffset ?? 0}px``, dan kelas `z-10 bg-white dark:bg-[#18191B] group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40`.
    - Jika `meta?.stickyBorder`, terapkan border kiri dan bayangan lembut.
  - Tambahkan kelas `group` pada kontainer row `flex items-center ...` agar selector `group-hover:` aktif dengan sempurna.

**Phase 1 Verification:**
- `MarcomTableShell.tsx` lolos pemeriksaan TypeScript tanpa error.

---

## 5. Phase 2: Konfigurasi Sticky Meta di `mouColumns.tsx`

### Tasks:
- [x] **2.1 Tambahkan Meta pada Kolom Dokumen MOU**:
  - Di `src/components/views/MousView/mouColumns.tsx`, tambahkan pada kolom `docPath` (id: `"document"`):
    ```typescript
    meta: {
      sticky: "right",
      stickyOffset: 85,
      stickyBorder: true,
    },
    ```
- [x] **2.2 Tambahkan Meta pada Kolom Aksi**:
  - Pada kolom display aksi (id: `"actions"`):
    ```typescript
    meta: {
      sticky: "right",
      stickyOffset: 0,
    },
    ```

**Phase 2 Verification:**
- Buka halaman MOUs di browser pada layar resolusi standar/kecil.
- Lakukan scroll horizontal ke kiri: pastikan kolom "Dokumen MOU" dan kolom "Aksi" menempel di sisi kanan tanpa glitch.

---

## 6. Phase 3: Automated Testing & Invariant Verification

### Tasks:
- [x] **3.1 Buat Unit Test `src/components/views/MousView/mouColumns.test.ts`**:
  - Uji bahwa `getMouColumns` menghasilkan kolom `document` dengan `meta.sticky === "right"` dan `meta.stickyOffset === 85`.
  - Uji bahwa kolom `actions` memiliki `meta.sticky === "right"` dan `meta.stickyOffset === 0`.
  - Uji bahwa kolom lain (seperti `partnerName`, `mouType`) tidak memiliki sticky right.
- [x] **3.2 Jalankan Unit Test Suites**:
  - `node --test src/components/views/MousView/mouColumns.test.ts`
  - `npm test`
- [x] **3.3 Jalankan Invariant & Build Checks**:
  - `npm run drift:check` (57 spec-plan pairs)
  - `npm run build:check` (0 errors)

---

## 7. Invariant Compliance Checklist

- [x] **Single-Tenant**: Nol workspace isolation leakage.
- [x] **SSOT**: Kolom tetap mengambil data kanonik `docPath` dari model `MarcomMou`.
- [x] **Coordinator Bounds**: `MarcomTableShell.tsx` tetap di bawah batas god file (< 680 LOC).
- [x] **Verification Gates**:
  - `npm run drift:check` PASS (57 spec-plan pairs)
  - `npm test` PASS (778+ tests, 0 failures)
  - `npm run build:check` PASS (0 TypeScript errors)



