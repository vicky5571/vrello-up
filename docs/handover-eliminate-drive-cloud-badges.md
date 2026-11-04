# Handover: Eliminate Legacy Drive/Cloud Storage Badges & Standardize Documents KPIs

**Date:** 2026-11-05  
**Scope:** `DocumentCardsView.tsx`, `DocumentsView.tsx`, `documentDrawer.test.ts`  
**Status:** EXECUTION-READY (Targeted Update)

---

## 1. Context & Purpose
The previous refactor (`cc56bee`) successfully eliminated `status` across database, seeder, types, API, and UI.

This targeted handover removes the misleading legacy storage indicator badges (`Drive / Cloud` vs `Server Local`) from document cards and table rows, and standardizes KPI Card 3 to **"Ragam Kategori"**. All document files stream directly to Supabase Storage, making internal storage protocol labels obsolete to end users.

---

## 2. File-by-File Changes

### 1. `src/components/views/DocumentsView/DocumentCardsView.tsx`

#### A. Clean Imports (lines 17–18, 28)
- Remove `Cloud,` and `HardDrive,` from `lucide-react` import.
- Remove `isCloudDocumentUrl,` from `@/lib/marcom/documentWorkflow` import.

#### B. Remove `isCloud` computation (line ~113)
- Delete:
  ```typescript
  const isCloud = isCloudDocumentUrl(doc.filePath);
  ```

#### C. Remove storage badge & clean card footer (lines ~183–197)
**Current Code:**
```tsx
            {/* Card Footer Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                {isCloud ? (
                  <>
                    <Cloud className="w-3 h-3 text-blue-500" />
                    <span>Drive / Cloud</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3 h-3 text-emerald-500" />
                    <span>Server Local</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
```

**Replace With:**
```tsx
            {/* Card Footer Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
```

---

### 2. `src/components/views/DocumentsView/DocumentsView.tsx`

#### A. Clean Imports
- If `Cloud` is only used in KPI card 3, keep or replace with `FolderKanban` or `Layers`.
- Remove `isCloudDocumentUrl` from `@/lib/marcom/documentWorkflow` import if no longer needed.

#### B. Update KPI Card 3 (lines ~125–155)
**Current Code:**
```typescript
      {
        label: "Total Dokumen",
        value: kpiData.totalDocuments,
        helper: `${kpiData.cloudDocsCount} Cloud · ${kpiData.localDocsCount} Server`,
        icon: Files,
        color: "teal",
      },
      {
        label: "Kapasitas Terpakai",
        value: kpiData.formattedStorage,
        helper: "Total file size",
        icon: HardDrive,
        color: "blue",
      },
      {
        label: "Penyimpanan Cloud",
        value: kpiData.cloudDocsCount,
        helper: `${kpiData.localDocsCount} Berkas Server/Lokal`,
        icon: Cloud,
        color: "emerald",
      },
      {
        label: "Kategori Terbanyak",
        value: kpiData.topCategory,
        helper: "Dominan repositori",
        icon: Layers,
        color: "violet",
      },
```

**Replace With:**
```typescript
      {
        label: "Total Dokumen",
        value: kpiData.totalDocuments,
        helper: "Total repositori aset",
        icon: Files,
        color: "teal",
      },
      {
        label: "Kapasitas Terpakai",
        value: kpiData.formattedStorage,
        helper: "Total file size",
        icon: HardDrive,
        color: "blue",
      },
      {
        label: "Ragam Kategori",
        value: categoryChips.length,
        helper: `Dominan: ${kpiData.topCategory}`,
        icon: Layers,
        color: "emerald",
      },
      {
        label: "Kategori Terbanyak",
        value: kpiData.topCategory,
        helper: "Kategori dominan",
        icon: Layers,
        color: "violet",
      },
```

#### C. Remove storage icon from table row title (lines ~226–238)
**Current Code:**
```tsx
              <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                {row.original.name}
              </span>
              {isCloudDocumentUrl(row.original.filePath) ? (
                <span title="Google Drive / Cloud">
                  <Cloud className="w-3 h-3 text-blue-500 shrink-0" />
                </span>
              ) : (
                <span title="Server Local">
                  <HardDrive className="w-3 h-3 text-emerald-500 shrink-0" />
                </span>
              )}
```

**Replace With:**
```tsx
              <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                {row.original.name}
              </span>
```

---

### 3. `src/components/views/DocumentsView/documentDrawer.test.ts`

Add test assertion to prevent regression:
```typescript
  it("verifies legacy Drive/Cloud and Server Local badges are eliminated", () => {
    const cardsPath = path.join(docsDir, "DocumentCardsView.tsx");
    const cardsContent = fs.readFileSync(cardsPath, "utf-8");
    assert.ok(!cardsContent.includes("Drive / Cloud"), "CardsView must not contain 'Drive / Cloud'");
    assert.ok(!cardsContent.includes("Server Local"), "CardsView must not contain 'Server Local'");

    const viewPath = path.join(docsDir, "DocumentsView.tsx");
    const viewContent = fs.readFileSync(viewPath, "utf-8");
    assert.ok(!viewContent.includes("Google Drive / Cloud"), "DocumentsView table must not contain 'Google Drive / Cloud'");
  });
```

---

## 3. Verification Commands
```bash
npm run drift:check
npm run build:check
node --test src/components/views/DocumentsView/documentDrawer.test.ts
npm test
```
