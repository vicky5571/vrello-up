# Handover: Complete Elimination of Document Status & Supabase Storage Focus

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-eliminate-document-status-design.md`  
**Plan:** `docs/superpowers/plans/2026-11-05-eliminate-document-status.md`  
**ADR:** `docs/adr/0025-eliminate-document-status-overengineering.md`  
**Status:** EXECUTION-READY (Planning Complete)

---

## 1. File Manifest

| File Path | One-Line Purpose | Action |
|---|---|---|
| `prisma/schema.prisma` | PostgreSQL schema definition | Remove `status` column from `DocumentItem` |
| `prisma/migrations/20261105000000_drop_document_item_status/migration.sql` | Migration SQL dropping status column | Auto-generated via `prisma migrate dev` |
| `prisma/seed.ts` | Development database seeder | Remove ad-hoc status attributes from `documents` seed |
| `src/types/index.ts` | SSoT domain interface definitions | Remove `DocumentStatus` type and `DocumentItem.status` |
| `src/lib/marcom/documentTaxonomy.ts` | Obsolete status validation helper | **DELETE FILE** |
| `src/lib/marcom/documentTaxonomy.test.ts` | Obsolete status taxonomy test | **DELETE FILE** |
| `src/app/api/marcom/documents/route.ts` | Documents list & create API | Remove status extraction, validation, & persistence |
| `src/app/api/marcom/documents/[id]/route.ts` | Documents detail, patch & delete API | Remove `"status"` from `PATCHABLE_FIELDS` & validation |
| `src/lib/marcom/documentWorkflow.ts` | Document KPI & filtering pure functions | Remove status metrics; keep cloud vs local storage |
| `src/components/views/DocumentsView/DocumentCreateModal.tsx` | Creation modal dialog | Remove status input; focus upload on Supabase Storage |
| `src/components/views/DocumentsView/DocumentDrawer.tsx` | Slide-over detail & edit drawer | Remove status dropdown; stream replacement to Supabase |
| `src/components/views/DocumentsView/DocumentCardsView.tsx` | Grid card representation of documents | Remove status pill badges |
| `src/components/views/DocumentsView/DocumentsView.tsx` | Documents view coordinator & table | Remove status column, dead state, update KPI Card 3 |
| `src/components/views/DocumentsView/documentDrawer.test.ts` | Documents drawer & modal unit tests | Update assertions to enforce zero status elements |
| `src/lib/marcom/documentWorkflow.test.ts` | Pure functions unit tests | Update assertions for KPI calculation & filtering |

---

## 2. Exact Changes by Phase

### Phase 1: Database Schema & Migration

#### 1. `prisma/schema.prisma` (lines 345–357)
**Current Code:**
```prisma
model DocumentItem {
  id          String      @id @default(cuid())
  name        String
  category    String
  period      String      @default("")
  branchName  String      @default("")
  ownerPic    String      @default("")
  status      String      @default("DRAFT")
  fileType    DocFileType
  fileSizeMb  Float       @default(0)
  filePath    String
  description String      @default("")
}
```

**Instruction:** Delete the line `status      String      @default("DRAFT")`.

**Target Code:**
```prisma
model DocumentItem {
  id          String      @id @default(cuid())
  name        String
  category    String
  period      String      @default("")
  branchName  String      @default("")
  ownerPic    String      @default("")
  fileType    DocFileType
  fileSizeMb  Float       @default(0)
  filePath    String
  description String      @default("")
}
```

#### 2. Run Migration Command
Execute in terminal:
```bash
npx prisma migrate dev --name drop_document_item_status
```
This applies `ALTER TABLE "DocumentItem" DROP COLUMN "status";` and regenerates Prisma Client.

#### 3. `prisma/seed.ts` (lines 1039–1092)
**Current Code:**
```typescript
    {
      id: "doc-001",
      name: "Panduan Brand Guidelines IM3 2026 Versi Lengkap",
      category: "Brand Guidelines",
      period: "2026",
      branchName: "Semarang Pandanaran",
      ownerPic: "Budi Santoso",
      status: "PUBLISHED",
      fileType: "PDF" as DocFileType,
      fileSizeMb: 14.8,
      filePath: "https://storage.marcom-internal.corp/guidelines/IM3_Brand_Book_2026.pdf",
      description: "Standard Operating Procedure untuk penerapan logo, palet warna kuning #FFD800, tipografi, dan tata letak kanopi outlet.",
    },
    {
      id: "doc-002",
      name: "Rekap Arsip MoU Regional Central Java Q3-2026",
      category: "Legal & MoU",
      period: "Q3 2026",
      branchName: "Semarang Pandanaran",
      ownerPic: "Agus Prasetyo",
      status: "FINAL",
      fileType: "ZIP" as DocFileType,
      fileSizeMb: 88.5,
      filePath: "https://storage.marcom-internal.corp/archives/2026/MOU_Central_Java_Q3_Archived.zip",
      description: "Arsip kompresi ZIP berisi seluruh scan PDF perjanjian kerjasama outlet di wilayah Semarang dan Solo.",
    },
    {
      id: "doc-003",
      name: "Template Perjanjian Kerjasama Gerai Eksklusif Tri",
      category: "Templates",
      period: "2026",
      branchName: "Solo Slamet Riyadi",
      ownerPic: "Rina Wijaya",
      status: "DRAFT",
      fileType: "DOCX" as DocFileType,
      fileSizeMb: 2.1,
      filePath: "https://storage.marcom-internal.corp/templates/Draft_PKS_Gerai_Tri_2026.docx",
      description: "Draf master word template untuk kontrak kemitraan toko eksklusif.",
    },
    {
      id: "doc-004",
      name: "Data Mentah Log Audit GPS Penempatan POSM",
      category: "Audit Logs",
      period: "Oktober 2026",
      branchName: "Denpasar Teuku Umar",
      ownerPic: "Wayan Sudarma",
      status: "VERIFIED",
      fileType: "CSV" as DocFileType,
      fileSizeMb: 4.6,
      filePath: "https://storage.marcom-internal.corp/audit/gps_checkin_logs_oct2026.csv",
      description: "Ekspor tabel CSV koordinat check-in vendor beserta kalkulasi deviasi radius meter.",
    },
```

**Instruction:** Delete `status: "PUBLISHED",`, `status: "FINAL",`, `status: "DRAFT",`, and `status: "VERIFIED",` from all 4 documents.

---

### Phase 2: SSoT Types & API Layer Refactoring

#### 1. `src/types/index.ts`
**Current Code (lines 480, 489):**
```typescript
export type DocumentStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  period?: string;
  branchName?: string;
  ownerPic?: string;
  status?: DocumentStatus;
  fileType: DocFileType | string;
  fileSizeMb?: number;
  filePath: string;
  description?: string;
}
```

**Instruction:** Delete `export type DocumentStatus = ...;` and delete `status?: DocumentStatus;` from `DocumentItem`.

**Target Code:**
```typescript
export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  period?: string;
  branchName?: string;
  ownerPic?: string;
  fileType: DocFileType | string;
  fileSizeMb?: number;
  filePath: string;
  description?: string;
}
```

#### 2. Delete Obsolete Taxonomy Files
Run in terminal:
```bash
rm src/lib/marcom/documentTaxonomy.ts
rm src/lib/marcom/documentTaxonomy.test.ts
```

#### 3. `src/app/api/marcom/documents/route.ts`
**Instruction:**
- Remove line 5: `import { VALID_DOCUMENT_STATUSES, isValidDocumentStatus } from "@/lib/marcom/documentTaxonomy";`
- In `POST`, remove `status` from `const { name, category, ... } = body ?? {};`
- Remove lines 49-55:
  ```typescript
  // DELETE THESE 7 LINES:
  const rawStatus = typeof status === "string" && status.trim() !== "" ? status.trim().toUpperCase() : "DRAFT";
  if (!isValidDocumentStatus(rawStatus)) {
    return NextResponse.json(
      { error: `Invalid status: '${status}'. Must be one of: ${VALID_DOCUMENT_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }
  ```
- In `prisma.documentItem.create`, pass clean data object:
  ```typescript
  const document = await prisma.documentItem.create({
    data: { name, category, period, branchName, ownerPic, fileType, fileSizeMb, filePath, description },
  });
  ```

#### 4. `src/app/api/marcom/documents/[id]/route.ts`
**Instruction:**
- Remove line 5: `import { VALID_DOCUMENT_STATUSES, isValidDocumentStatus } from "@/lib/marcom/documentTaxonomy";`
- In `PATCHABLE_FIELDS` (line 8), remove `"status"`:
  ```typescript
  const PATCHABLE_FIELDS = ["name", "category", "period", "branchName", "ownerPic", "fileType", "fileSizeMb", "filePath", "description"] as const;
  ```
- Remove lines 25-30:
  ```typescript
  // DELETE THESE 6 LINES:
  if (data.status !== undefined && !isValidDocumentStatus(data.status)) {
    return NextResponse.json(
      { error: `Invalid status: '${data.status}'. Must be one of: ${VALID_DOCUMENT_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }
  ```

---

### Phase 3: Pure Domain Helpers & UI Views Refactoring

#### 1. `src/lib/marcom/documentWorkflow.ts`
**Instruction:**
- In `DocumentKPIs` (lines 3-13), delete `activeCount: number;`, `draftCount: number;`, and `archivedCount: number;`.
- In `calculateDocumentKPIs` (lines 133-200):
  - Delete `activeCount`, `draftCount`, `archivedCount` counters and the status checking block:
    ```typescript
    // DELETE THIS BLOCK:
    const normalizedStatus = (doc.status || "").toLowerCase();
    if (normalizedStatus === "active") {
      activeCount++;
    } else if (normalizedStatus === "draft") {
      draftCount++;
    } else if (normalizedStatus === "archived") {
      archivedCount++;
    }
    ```
  - Return clean KPIs without `activeCount`, `draftCount`, `archivedCount`.
- In `FilterDocumentsOptions` (line 202), delete `status?: string;`.
- In `filterDocuments` (lines 209-252), delete the status filter block:
  ```typescript
  // DELETE THIS BLOCK:
  if (status && status !== "ALL") {
    if (doc.status?.trim().toLowerCase() !== status.trim().toLowerCase()) {
      return false;
    }
  }
  ```

#### 2. `src/components/views/DocumentsView/DocumentCreateModal.tsx`
**Instruction:**
- Remove `DocumentStatus` from imports.
- Delete line 53: `const [status, setStatus] = useState<DocumentStatus>("ACTIVE");`
- In `resetForm`, delete `setStatus("ACTIVE");`
- In `handleSubmit`, delete `status,` from `payload`.
- In JSX (lines ~302-320), delete the `<div className="space-y-1.5"><label>Status</label>...</div>` select input.
- Clean up Google Drive picker triggers so file upload uses `/api/marcom/uploads` (Supabase Storage) without modal clutter.

#### 3. `src/components/views/DocumentsView/DocumentDrawer.tsx`
**Instruction:**
- Remove `DocumentStatus` from imports.
- Delete `const DOCUMENT_STATUSES = ...` constant array (lines 53-70).
- Delete `const [status, setStatus] = useState<DocumentStatus>("ACTIVE");` and `currentStatusMeta`.
- In `useEffect` on document change, delete `setStatus(document.status || "ACTIVE");`
- In `handleSave`, delete `status,` from `payload`.
- In JSX (lines 327-348), delete the Status Selector Dropdown `<select>` container.
- Keep file replacement streaming directly to `/api/marcom/uploads` (Supabase Storage).

#### 4. `src/components/views/DocumentsView/DocumentCardsView.tsx`
**Instruction:**
- In lines 114-149, delete `const statusLower = (doc.status || "DRAFT").toLowerCase();` and delete the `<span className={...}>{doc.status || "DRAFT"}</span>` pill badge from the card header.
- Card header cleanly renders Category and File Type chip.
- In lines 184-196, delete the bottom-left storage indicator container:
  ```tsx
  // DELETE THIS STORAGE BADGE:
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
  ```
- Footer cleanly houses the action buttons (`Eye`, `Copy`, `Edit2`, `Trash2`).

#### 5. `src/components/views/DocumentsView/DocumentsView.tsx`
**Instruction:**
- Remove `DocumentStatus` from imports (line 36) and re-exports (line 38).
- Delete dead state line 60: `const [selectedStatus] = useState<string>("ALL");`
- In `filteredDocuments` useMemo, delete `status: selectedStatus,` from `filterDocuments` call and remove `selectedStatus` from dependency array.
- In lines 229-237, remove the Cloud / HardDrive storage icon next to the document title:
  ```tsx
  // DELETE THESE 9 LINES:
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
- In `kpiCards` (lines 141-147), update Card 3 from "Dokumen Aktif" to "Ragam Kategori":
  ```typescript
  {
    label: "Ragam Kategori",
    value: categoryChips.length,
    helper: `Dominan: ${kpiData.topCategory}`,
    icon: Layers,
    color: "emerald",
  },
  ```
  *(Import `Layers` from `lucide-react`)*
- In `columns` (lines 297-317), delete the `columnHelper.accessor("status", ...)` definition.

---

### Phase 4: Database Re-seed & Automated Verification

#### 1. `src/components/views/DocumentsView/documentDrawer.test.ts`
**Instruction:**
- Remove `DocumentStatus` from imports (line 5) and from `mockDoc` (line 143).
- Add specific assertions:
  ```typescript
  it("verifies status field is completely eliminated from Documents module", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");
    assert.ok(!drawerContent.includes("DOCUMENT_STATUSES"), "Drawer must not have DOCUMENT_STATUSES");
    assert.ok(!drawerContent.includes("setStatus("), "Drawer must not have setStatus");

    const createPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const createContent = fs.readFileSync(createPath, "utf-8");
    assert.ok(!createContent.includes("setStatus("), "CreateModal must not have setStatus");

    const cardsPath = path.join(docsDir, "DocumentCardsView.tsx");
    const cardsContent = fs.readFileSync(cardsPath, "utf-8");
    assert.ok(!cardsContent.includes("doc.status"), "CardsView must not render status");

    const viewPath = path.join(docsDir, "DocumentsView.tsx");
    const viewContent = fs.readFileSync(viewPath, "utf-8");
    assert.ok(!viewContent.includes('accessor("status"'), "Table must not have status column");
  });
  ```

#### 2. `src/lib/marcom/documentWorkflow.test.ts`
**Instruction:**
- In `mockDocs`, remove `status: "ACTIVE"`, `status: "DRAFT"`, `status: "ARCHIVED"`.
- In `calculateDocumentKPIs` tests, assert `kpis.cloudDocsCount` and `kpis.localDocsCount` instead of `activeCount`/`draftCount`/`archivedCount`.
- In `filterDocuments` tests, remove the status filtering test assertion.

#### 3. Re-seed Database
Run:
```bash
npx prisma db seed
```
Verify that the output finishes with `📂 Seeding documents catalog & executive quarterly reports...` and `Seeding completed successfully!`.

---

## 3. Explicit "Do Not Touch" List

1. **`Mou`, `ContentPost`, `FieldEvent`, `Placement` models and files**:
   - **Reason**: These entities have real, audited state machines (`mouMachine.ts`, `eventMachine.ts`, etc.) and operational lifecycles. They are NOT overengineered and MUST retain their `status` fields.
2. **`src/app/api/marcom/uploads/route.ts`**:
   - **Reason**: This is our production Supabase Storage upload handler supporting `documents`, `mou-documents`, `placements`, and `outlets`. It works perfectly and is the destination for document files.
3. **`src/lib/server/supabaseStorage.ts`**:
   - **Reason**: Shared Supabase Storage REST client. Must not be modified.
4. **Single-Tenant Invariant**:
   - **Reason**: Never re-introduce `workspaceId` into any document queries or interfaces.

---

## 4. Numbered Execution Order

1. **Step 1**: Edit `prisma/schema.prisma` → remove `status` from `DocumentItem`.
2. **Step 2**: Run `npx prisma migrate dev --name drop_document_item_status`.
3. **Step 3**: Edit `prisma/seed.ts` → remove status from `documents` array.
4. **Step 4**: Edit `src/types/index.ts` → delete `DocumentStatus` and remove `status` from `DocumentItem`.
5. **Step 5**: Delete `src/lib/marcom/documentTaxonomy.ts` and `src/lib/marcom/documentTaxonomy.test.ts`.
6. **Step 6**: Edit `src/app/api/marcom/documents/route.ts` & `[id]/route.ts`.
7. **Step 7**: Edit `src/lib/marcom/documentWorkflow.ts`.
8. **Step 8**: Edit `DocumentCreateModal.tsx`, `DocumentDrawer.tsx`, `DocumentCardsView.tsx`, and `DocumentsView.tsx`.
9. **Step 9**: Edit `src/components/views/DocumentsView/documentDrawer.test.ts` & `src/lib/marcom/documentWorkflow.test.ts`.
10. **Step 10**: Run `npx prisma db seed`.
11. **Step 11**: Run verification gates: `npm run drift:check`, `npm run build:check`, and `npm test`.

---

## 5. Acceptance Criteria Checklist

- [ ] `prisma/schema.prisma` has no `status` on `DocumentItem`.
- [ ] Migration `drop_document_item_status` created and applied.
- [ ] `src/types/index.ts` has no `DocumentStatus` and `DocumentItem` has no `status`.
- [ ] `documentTaxonomy.ts` and `documentTaxonomy.test.ts` deleted.
- [ ] `POST` and `PATCH /api/marcom/documents` accept clean payloads without `status`.
- [ ] `DocumentDrawer.tsx` and `DocumentCreateModal.tsx` have no status inputs.
- [ ] `DocumentCardsView.tsx` has no status pill badges.
- [ ] `DocumentsView.tsx` has no status column and KPI card 3 displays "Penyimpanan Cloud".
- [ ] `npx prisma db seed` seeds database without errors.
- [ ] `npm run drift:check` passes with `✅ No drift detected`.
- [ ] `npm run build:check` passes with 0 TypeScript compilation errors.
- [ ] `npm test` passes with 0 failures across all suites.




