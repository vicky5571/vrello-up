# Specification: Complete Elimination of Overengineered Document Status Field & Supabase Storage Focus

## Status
IMPLEMENTED (ADR-0025)

## Date
2026-11-05

## 1. Executive Summary
This specification defines the complete, full-stack elimination of the orphaned and overengineered `status` field (`"DRAFT" | "ACTIVE" | "ARCHIVED"`) from the Documents & Asset Library (`DocumentItem`), spanning PostgreSQL database schema, Prisma migrations, seeder data, TypeScript SSoT types, REST API endpoints, and user interface components.

Because the system is in pre-operational staging, no backward-compatibility compromise is retained. The Documents module is streamlined as a pure Digital Asset Management (DAM) repository (brand guidelines, SOPs, agreements, and templates) backed directly by Supabase Storage (`marcom-documents` bucket), completely eliminating Google Drive dependency and zombie database columns.

---

## 2. Problem Statement & Architectural Alignment

### What Was Wrong
1. **Speculative Abstraction**: Unlike `Mou` (legal lifecycle), `ContentPost` (publishing pipeline), and `FieldEvent` (logistical realization), documents have no multi-stage workflow. A file uploaded to the DAM is either available for the team or it is removed.
2. **Dead Filtering Logic**: In `DocumentsView.tsx`, the status filter was permanently hardcoded to `"ALL"` (`const [selectedStatus] = useState<string>("ALL")`), with zero status filter controls provided in `DocumentsHeader.tsx`.
3. **Cognitive Burden**: Operators uploading a logo book or agreement archive were forced to navigate a meaningless dropdown in `DocumentCreateModal` and `DocumentDrawer`.
4. **Visual Noise**: Document cards and tables displayed redundant `ACTIVE` or `DRAFT` pill badges that had no operational meaning.
5. **Storage Decoupling**: File uploads in Documents belong in dedicated application object storage (Supabase Storage `marcom-documents` bucket), avoiding Google Drive token expiration, personal rate limits, and abuse heuristics.

### Design Principles
- **YAGNI (You Aren't Gonna Need It)**: Strip pseudo-workflow abstractions that have no state transitions, guards, or filtering capability.
- **Zero Zombie Columns**: Drop the `status` column cleanly from PostgreSQL and Prisma rather than leaving dead schema debt.
- **Supabase Storage Focused**: Documents uploads stream directly to Supabase Storage with edge-cached CDN URLs.

---

## 3. UI/UX Changes & Component Manifest

| Component | File Path | Current Status Logic | Target Clean State |
| :--- | :--- | :--- | :--- |
| **`DocumentDrawer.tsx`** | `src/components/views/DocumentsView/DocumentDrawer.tsx` | Status select input, `status` state, `DOCUMENT_STATUSES` array, status in PATCH payload, Drive modal | Remove `status` state, array, & `<select>`. In `handleSave`, send clean payload without `status`. Remove Google Drive picker hook/modal in favor of direct file replacement via Supabase Storage. |
| **`DocumentCreateModal.tsx`** | `src/components/views/DocumentsView/DocumentCreateModal.tsx` | Status select input, `status` state, status in POST payload, Drive picker button & modal | Remove `status` state & `<select>` dropdown. In `handleSubmit`, send clean payload without `status`. Direct file upload sends to `/api/marcom/uploads` (Supabase Storage). Remove Drive modal dependency. |
| **`DocumentCardsView.tsx`** | `src/components/views/DocumentsView/DocumentCardsView.tsx` | Top-right status pill badge (`doc.status \|\| "DRAFT"`) with emerald/slate/amber styling | Remove status pill badge entirely. Top bar cleanly displays Category tag and File Type chip. |
| **`DocumentsView.tsx`** | `src/components/views/DocumentsView/DocumentsView.tsx` | Table column `status`, dead state `selectedStatus`, Card 3 "Dokumen Aktif" | Remove Status table column. Remove `selectedStatus` state. Convert KPI Card 3 to "Penyimpanan Cloud" (`kpiData.cloudDocsCount` Cloud vs `${kpiData.localDocsCount} Server/Lokal`). |
| **`documentWorkflow.ts`** | `src/lib/marcom/documentWorkflow.ts` | Status aggregation in `calculateDocumentKPIs`, status filter in `filterDocuments` | Remove `activeCount`, `draftCount`, `archivedCount` from `DocumentKPIs` and KPI calculation loop. Remove `status` from `FilterDocumentsOptions` and filtering loop. |
| **`documentTaxonomy.ts`** | `src/lib/marcom/documentTaxonomy.ts` | `VALID_DOCUMENT_STATUSES`, `isValidDocumentStatus` | **DELETE FILE**. Entire helper is obsolete. |
| **`documentTaxonomy.test.ts`** | `src/lib/marcom/documentTaxonomy.test.ts` | Unit tests for document taxonomy | **DELETE FILE**. |

---

## 4. Data Contracts & Database Schema

### 4.1 Prisma Schema & Database Migration (`prisma/schema.prisma`)
Remove `status String @default("DRAFT")` from `model DocumentItem`:
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

#### Migration Generation:
Run:
```bash
npx prisma migrate dev --name drop_document_item_status
```
Generates SQL:
```sql
ALTER TABLE "DocumentItem" DROP COLUMN "status";
```

### 4.2 Database Seeder (`prisma/seed.ts`)
Remove all ad-hoc `status` properties from `documents` array in `seedDocumentsAndReports()`:
```typescript
const documents = [
  {
    id: "doc-001",
    name: "Panduan Brand Guidelines IM3 2026 Versi Lengkap",
    category: "Brand Guidelines",
    period: "2026",
    branchName: "Semarang Pandanaran",
    ownerPic: "Budi Santoso",
    fileType: "PDF" as DocFileType,
    fileSizeMb: 14.8,
    filePath: "https://storage.marcom-internal.corp/guidelines/IM3_Brand_Book_2026.pdf",
    description: "Standard Operating Procedure untuk penerapan logo, palet warna kuning #FFD800, tipografi, dan tata letak kanopi outlet.",
  },
  // doc-002, doc-003, doc-004 without status
];
```

### 4.3 SSoT Interface Alignment (`src/types/index.ts`)
- Delete `export type DocumentStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";`
- Update `DocumentItem`:
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

### 4.4 API Contracts (`/api/marcom/documents`)
- **`POST /api/marcom/documents`**:
  - Drops `status` extraction and `isValidDocumentStatus` check.
  - Inserts directly into `prisma.documentItem.create` with `{ name, category, period, branchName, ownerPic, fileType, fileSizeMb, filePath, description }`.
- **`PATCH /api/marcom/documents/[id]`**:
  - Removes `"status"` from `PATCHABLE_FIELDS`.
  - Drops `data.status` validation.

---

## 5. Non-Goals (Explicitly Out of Scope)
- No removal of `status` from `ContentPost`, `FieldEvent`, `Mou`, `Placement`, or `InventoryItem`. Those entities have real, audited state machines and operational lifecycles.
- No changes to Supabase bucket structure: `marcom-documents` bucket remains the designated public storage for document files.

---

## 6. Verification Checklist & Acceptance Criteria

### Automated Unit Testing
- [ ] Update `src/components/views/DocumentsView/documentDrawer.test.ts`:
  - Assert `DocumentDrawer.tsx` does NOT render any status select dropdown or input.
  - Assert `DocumentCreateModal.tsx` does NOT render any status select dropdown or input.
  - Assert `DocumentCardsView.tsx` does NOT render status badges.
  - Assert `DocumentsView.tsx` does NOT register a `status` table column.
  - Assert `DocumentItem` conforms to SSoT without `status`.
- [ ] Update `src/lib/marcom/documentWorkflow.test.ts`:
  - Verify `calculateDocumentKPIs` runs without status fields.
  - Verify `filterDocuments` runs without status options.

### Database & Seeding Verification
- [ ] `npx prisma migrate dev --name drop_document_item_status` executes successfully.
- [ ] `npx prisma db seed` seeds catalog with 0 status errors.
- [ ] Querying `DocumentItem` returns all rows with valid schemas.

### Non-Negotiable Quality Gates
- [ ] `npm run drift:check` passes with 0 drift.
- [ ] `npm run build:check` passes with 0 compilation errors.
- [ ] `npm test` passes with 0 test failures across all suites.


