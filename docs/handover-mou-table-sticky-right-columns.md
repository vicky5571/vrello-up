# Handover: Sticky Right Columns untuk Kolom Dokumen MOU dan Aksi pada Tabel MOUs

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-mou-table-sticky-right-columns-design.md`  
**Plan:** `docs/superpowers/plans/2026-11-05-mou-table-sticky-right-columns.md`  
**ADR:** `docs/adr/0030-mou-table-sticky-right-columns.md`  
**Status:** READY TO EXECUTE

---

## 1. File Manifest & One-Line Purpose

1. `src/components/views/shared/MarcomTableShell.tsx`: Koordinator tabel bersama; menambahkan pembacaan `meta.sticky`, `meta.stickyOffset`, dan `meta.stickyBorder` pada header dan cell.
2. `src/components/views/MousView/mouColumns.tsx`: Konfigurasi kolom tabel MOUs; menambahkan meta sticky right pada kolom `document` dan `actions`.
3. `src/components/views/MousView/mouColumns.test.ts`: Automated test suite untuk memverifikasi meta sticky right pada kolom MOUs.

---

## 2. Exact Current Code Snippets (As-Is)

### 2.1 Current Header Rendering di `src/components/views/shared/MarcomTableShell.tsx` (baris 443–459):
```tsx
              {headerGroup.headers.map((header) => {
                const canSort = (header.column as any).getCanSort();
                const isSorted = (header.column as any).getIsSorted();
                const sortDirection = isSorted === "asc" ? "ascending" : isSorted === "desc" ? "descending" : "none";
                const isRightAligned = (header.column.columnDef as any)?.meta?.align === "right";
                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-sort={canSort ? sortDirection : undefined}
                    style={{ width: `${(header as any).getSize()}px` }}
                    className={cn(
                      "relative flex items-center gap-1.5 shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden",
                      isRightAligned && "justify-end",
                    )}
                  >
```

### 2.2 Current Row Cell Rendering di `src/components/views/shared/MarcomTableShell.tsx` (baris 536–546):
```tsx
                      className={cn(
                        "flex items-center px-4 py-2.5 transition-colors text-xs",
                        hasRowAction && "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500",
                        (row as any).getIsSelected() && "bg-teal-50/40 dark:bg-teal-950/20",
                      )}
                    >
                      {(row as any).getVisibleCells().map((cell: any) => {
                        const isExpander = (cell.column as any).id === "expander";
                        return (
                          <div key={cell.id} role="cell" style={{ width: `${cell.column.getSize()}px` }} className="shrink-0 px-2 first:pl-0 last:pr-0 overflow-hidden">
```

### 2.3 Current `document` & `actions` Columns di `src/components/views/MousView/mouColumns.tsx` (baris 333–384):
```tsx
    columnHelper.accessor("docPath", {
      id: "document",
      header: "Dokumen MOU",
      size: 155,
      minSize: 130,
      enableSorting: false,
      cell: ({ row }) => {
...
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      size: 85,
      minSize: 70,
      maxSize: 110,
      enableSorting: false,
      cell: ({ row }) => {
...
      },
    }),
```

---

## 3. Exact Change Instructions

### Step 1: Modifikasi `src/components/views/shared/MarcomTableShell.tsx`

1. Ekspor interface `MarcomColumnMeta` di bagian atas file:
   ```typescript
   export interface MarcomColumnMeta {
     align?: "left" | "right";
     sticky?: "right" | "left";
     stickyOffset?: number;
     stickyBorder?: boolean;
   }
   ```
2. Pada `headerGroup.headers.map`:
   ```tsx
              {headerGroup.headers.map((header) => {
                const canSort = (header.column as any).getCanSort();
                const isSorted = (header.column as any).getIsSorted();
                const sortDirection = isSorted === "asc" ? "ascending" : isSorted === "desc" ? "descending" : "none";
                const meta = (header.column.columnDef as any)?.meta as MarcomColumnMeta | undefined;
                const isRightAligned = meta?.align === "right";
                const isRightSticky = meta?.sticky === "right";
                const rightOffset = meta?.stickyOffset ?? 0;
                const hasStickyBorder = meta?.stickyBorder ?? false;

                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-sort={canSort ? sortDirection : undefined}
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
3. Pada baris data container `div` (baris 536):
   Tambahkan kelas `group`:
   ```tsx
                      className={cn(
                        "group flex items-center px-4 py-2.5 transition-colors text-xs",
                        hasRowAction && "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500",
                        (row as any).getIsSelected() && "bg-teal-50/40 dark:bg-teal-950/20",
                      )}
   ```
4. Pada `(row as any).getVisibleCells().map`:
   ```tsx
                      {(row as any).getVisibleCells().map((cell: any) => {
                        const isExpander = (cell.column as any).id === "expander";
                        const meta = (cell.column.columnDef as any)?.meta as MarcomColumnMeta | undefined;
                        const isRightSticky = meta?.sticky === "right";
                        const rightOffset = meta?.stickyOffset ?? 0;
                        const hasStickyBorder = meta?.stickyBorder ?? false;

                        return (
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

### Step 2: Modifikasi `src/components/views/MousView/mouColumns.tsx`

1. Perbarui kolom `document`:
   ```typescript
    columnHelper.accessor("docPath", {
      id: "document",
      header: "Dokumen MOU",
      size: 155,
      minSize: 130,
      enableSorting: false,
      meta: {
        sticky: "right",
        stickyOffset: 85,
        stickyBorder: true,
      },
      cell: ({ row }) => {
   ```
2. Perbarui kolom `actions`:
   ```typescript
    columnHelper.display({
      id: "actions",
      header: () => null,
      size: 85,
      minSize: 70,
      maxSize: 110,
      enableSorting: false,
      meta: {
        sticky: "right",
        stickyOffset: 0,
      },
      cell: ({ row }) => {
   ```

---

### Step 3: Buat Unit Test `src/components/views/MousView/mouColumns.test.ts`
Buat berkas test baru:
```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMouColumns } from "./mouColumns";

describe("mouColumns sticky right configuration", () => {
  it("verifies document column has sticky right with offset 85 and stickyBorder", () => {
    const columns = getMouColumns({
      can: () => true,
      setViewingDocMou: () => {},
      onOpenDrawer: () => {},
      onQuickApprove: () => {},
    });

    const docCol = columns.find((c: any) => c.id === "document") as any;
    assert.ok(docCol, "document column must exist");
    assert.equal(docCol.meta?.sticky, "right");
    assert.equal(docCol.meta?.stickyOffset, 85);
    assert.equal(docCol.meta?.stickyBorder, true);
  });

  it("verifies actions column has sticky right with offset 0", () => {
    const columns = getMouColumns({
      can: () => true,
      setViewingDocMou: () => {},
      onOpenDrawer: () => {},
      onQuickApprove: () => {},
    });

    const actionsCol = columns.find((c: any) => c.id === "actions") as any;
    assert.ok(actionsCol, "actions column must exist");
    assert.equal(actionsCol.meta?.sticky, "right");
    assert.equal(actionsCol.meta?.stickyOffset, 0);
  });

  it("verifies non-sticky columns do not have sticky meta", () => {
    const columns = getMouColumns({
      can: () => true,
      setViewingDocMou: () => {},
      onOpenDrawer: () => {},
      onQuickApprove: () => {},
    });

    const partnerCol = columns.find((c: any) => c.accessorKey === "partnerName") as any;
    assert.ok(partnerCol, "partnerName column must exist");
    assert.equal(partnerCol.meta?.sticky, undefined);
  });
});
```

---

## 4. Explicit "Do Not Touch" List

1. **`src/components/views/MousView/MousView.tsx`**: JANGAN ubah coordinator ini; props yang dikirimkan ke `MarcomTableShell` tetap identik.
2. **`src/components/views/BranchesView/` dkk.**: JANGAN ubah kolom-kolom tabel lain; mereka mewarisi fungsionalitas shell tanpa breaking changes.
3. **Lebar Kolom**: JANGAN ubah `size: 155` pada kolom `document` dan `size: 85` pada kolom `actions` karena offset sticky (85px) bergantung pada lebar ini.

---

## 5. Numbered Execution Order

1. **Step 1**: Modifikasi `src/components/views/shared/MarcomTableShell.tsx`.
2. **Step 2**: Modifikasi `src/components/views/MousView/mouColumns.tsx`.
3. **Step 3**: Buat file unit test `src/components/views/MousView/mouColumns.test.ts`.
4. **Step 4**: Jalankan targeted unit test:
   `node --test src/components/views/MousView/mouColumns.test.ts`
5. **Step 5**: Jalankan full verification suite:
   - `npm run drift:check`
   - `npm run build:check`
   - `npm test`
6. **Step 6**: Update `docs/SESSION_STATE.md` dan commit.

---

## 6. Acceptance Criteria Checklist

- [ ] `MarcomTableShell.tsx` mengenali `meta.sticky: "right"`, `meta.stickyOffset`, dan `meta.stickyBorder`.
- [ ] Kolom `document` menempel di sisi kanan dengan offset 85px dan pembatas border kiri.
- [ ] Kolom `actions` menempel di sisi paling kanan dengan offset 0px.
- [ ] Selama scroll horizontal, teks di bawah sel sticky tidak tembus pandang (*solid background*).
- [ ] Hover effect pada baris tetap berjalan selaras di seluruh sel termasuk sel sticky.
- [ ] Unit test `mouColumns.test.ts` lulus 100%.
- [ ] `npm run drift:check` lulus dengan 57 spec-plan pairs dan 0 drift.
- [ ] `npm run build:check` lulus dengan 0 error TypeScript.
- [ ] `npm test` lulus dengan 0 kegagalan di seluruh test suite.



