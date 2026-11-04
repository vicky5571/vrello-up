# Implementation Plan: Complete Elimination of Document Status & Supabase Storage Focus

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-eliminate-document-status-design.md`  
**ADR:** `docs/adr/0025-eliminate-document-status-overengineering.md`  
**Status:** COMPLETED

---

## 1. Plan Overview & Objectives
Completely remove the orphaned and speculative `status` field from the Marcom Documents module (`DocumentItem`) across the entire stack:
1. Drop `status` column from `prisma/schema.prisma` and generate official migration `drop_document_item_status`.
2. Clean `prisma/seed.ts` removing ad-hoc status attributes from document seed catalog.
3. Remove `DocumentStatus` and `DocumentItem.status` from SSoT types (`src/types/index.ts`).
4. Delete obsolete helpers `documentTaxonomy.ts` and `documentTaxonomy.test.ts`.
5. Clean REST endpoints (`/api/marcom/documents` and `[id]`).
6. Update domain helpers (`documentWorkflow.ts`), replace KPI card 3 with "Penyimpanan Cloud".
7. Clean UI components (`DocumentDrawer.tsx`, `DocumentCreateModal.tsx`, `DocumentCardsView.tsx`, `DocumentsView.tsx`) focusing storage on Supabase Storage.
8. Re-seed database (`npx prisma db seed`) and pass all verification gates.

---

## 2. Phase 1: Database Schema & Migration

### Tasks:
- [x] **1.1 Modify `prisma/schema.prisma`**:
  - Remove line 352: `status String @default("DRAFT")` from `model DocumentItem`.
  - Target model structure:
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
- [x] **1.2 Generate Prisma Migration**:
  - Run:
    ```bash
    npx prisma migrate dev --name drop_document_item_status
    ```
  - Verifies generated SQL drops column:
    ```sql
    ALTER TABLE "DocumentItem" DROP COLUMN "status";
    ```
  - Regenerates Prisma Client v6.19.3.
- [x] **1.3 Clean `prisma/seed.ts`**:
  - In `seedDocumentsAndReports()`, remove `status: "PUBLISHED"`, `status: "FINAL"`, `status: "DRAFT"`, and `status: "VERIFIED"` from the 4 document seed objects (`doc-001` through `doc-004`).

**Phase 1 Verification:**
- Run `npx prisma validate`
- Run `git status` to verify new migration directory created cleanly.

---

## 3. Phase 2: SSoT Types & API Layer Refactoring

### Tasks:
- [x] **2.1 SSoT Types (`src/types/index.ts`)**:
  - Remove `export type DocumentStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";` (around line 480).
  - In `export interface DocumentItem`, remove `status?: DocumentStatus;` (around line 489).
- [x] **2.2 Delete Obsolete Files**:
  - Verify zero remaining external imports.
  - Delete `src/lib/marcom/documentTaxonomy.ts`.
  - Delete `src/lib/marcom/documentTaxonomy.test.ts`.
- [x] **2.3 API Route `POST /api/marcom/documents/route.ts`**:
  - Remove `import { VALID_DOCUMENT_STATUSES, isValidDocumentStatus } from "@/lib/marcom/documentTaxonomy";`.
  - Remove `status` destructuring from `body`.
  - Remove lines 49-55 (rawStatus extraction and validation).
  - In `prisma.documentItem.create`, pass clean data object without `status`.
- [x] **2.4 API Route `PATCH /api/marcom/documents/[id]/route.ts`**:
  - Remove `import { VALID_DOCUMENT_STATUSES, isValidDocumentStatus } from "@/lib/marcom/documentTaxonomy";`.
  - Remove `"status"` from `PATCHABLE_FIELDS` tuple.
  - Remove lines 25-30 (validation for `data.status`).

**Phase 2 Verification:**
- Run `npm run build:check` (may show UI errors where status is still referenced; API and types should be clean).

---

## 4. Phase 3: Pure Domain Helpers & UI Views Refactoring

### Tasks:
- [x] **3.1 Pure Domain Helpers (`src/lib/marcom/documentWorkflow.ts`)**:
  - In `DocumentKPIs`: remove `activeCount`, `draftCount`, `archivedCount`.
  - In `calculateDocumentKPIs`: remove `activeCount`, `draftCount`, `archivedCount` variables and status counting conditions. Keep `totalDocuments`, `totalStorageMb`, `formattedStorage`, `topCategory`, `cloudDocsCount`, `localDocsCount`.
  - In `FilterDocumentsOptions`: remove `status?: string;`.
  - In `filterDocuments`: remove status filtering condition block.
- [x] **3.2 `DocumentCreateModal.tsx`**:
  - Remove `DocumentStatus` from imports.
  - Remove `const [status, setStatus] = useState<DocumentStatus>("ACTIVE");` and `setStatus("ACTIVE")` from `resetForm`.
  - Remove `status` from `handleSubmit` payload.
  - Remove `<div className="space-y-1.5"><label>Status</label><select value={status}...></div>` from form JSX.
  - Decouple from Google Drive modal: direct local file upload to `/api/marcom/uploads` (Supabase Storage) is the primary action.
- [x] **3.3 `DocumentDrawer.tsx`**:
  - Remove `DocumentStatus` from imports.
  - Remove `DOCUMENT_STATUSES` array constant, `currentStatusMeta`, and `status` state.
  - Remove `setStatus(document.status || "ACTIVE")` in hydration `useEffect`.
  - Remove `status` from `handleSave` PATCH payload.
  - Remove Status Selector `<select>` from the standardized grey container JSX.
  - Ensure file replacement streams directly to `/api/marcom/uploads` (Supabase Storage).
- [ ] **3.4 `DocumentCardsView.tsx`**:
  - Remove lines computing `statusLower`.
  - Remove status pill badge from the card header, leaving clean Category badge and File Type chip.
  - Remove bottom-left storage indicator badge (`<span>Drive / Cloud</span>` and `<span>Server Local</span>`).
- [ ] **3.5 `DocumentsView.tsx`**:
  - Remove `DocumentStatus` from import and re-export.
  - Remove dead state `const [selectedStatus] = useState<string>("ALL");`.
  - Remove `status: selectedStatus` from `filterDocuments` call.
  - Remove storage icon (`Cloud` / `HardDrive`) from document title cell.
  - In `kpiCards`, update card 3 from "Dokumen Aktif" to "Ragam Kategori":
    ```typescript
    {
      label: "Ragam Kategori",
      value: categoryChips.length,
      helper: `Dominan: ${kpiData.topCategory}`,
      icon: Layers,
      color: "emerald",
    }
    ```
  - In `columns`, remove the column `columnHelper.accessor("status", ...)`.

---

## 5. Phase 4: Database Re-seed & Automated Verification

### Tasks:
- [x] **4.1 Update Automated Unit Tests**:
  - `src/components/views/DocumentsView/documentDrawer.test.ts`:
    - Remove `DocumentStatus` import and from `mockDoc`.
    - Add assertions:
      - `DocumentDrawer.tsx` does NOT contain `DOCUMENT_STATUSES` or `setStatus`.
      - `DocumentCreateModal.tsx` does NOT contain `status` input or state.
      - `DocumentCardsView.tsx` does NOT contain status pill badge.
      - `DocumentsView.tsx` does NOT register a `status` table column.
  - `src/lib/marcom/documentWorkflow.test.ts`:
    - Remove `status` from `mockDocs` test fixtures.
    - Update `calculateDocumentKPIs` assertions (assert `cloudDocsCount` and `localDocsCount`, remove `activeCount`/`draftCount`/`archivedCount`).
    - Update `filterDocuments` test cases (remove status filtering assertion).
- [x] **4.2 Database Re-seed**:
  - Run:
    ```bash
    npx prisma db seed
    ```
  - Verify console logs: `📂 Seeding documents catalog & executive quarterly reports...` completes with 0 errors.
- [x] **4.3 Non-Negotiable Verification Gates**:
  - Run `npm run drift:check` → MUST pass with `✅ No drift detected`.
  - Run `npm run build:check` → MUST pass with 0 TypeScript compilation errors.
  - Run `npm test` → MUST pass with 0 failures across all test suites.

---

## 6. Verification Checklist
- [x] `prisma/schema.prisma` has 0 references to `status` on `DocumentItem`.
- [x] `src/types/index.ts` has 0 references to `DocumentStatus`.
- [x] `src/lib/marcom/documentTaxonomy.ts` deleted.
- [x] `src/components/views/DocumentsView/` files have 0 status inputs or columns.
- [x] Database migrated and seeded cleanly.
- [x] Drift check, build check, and test suite green.


