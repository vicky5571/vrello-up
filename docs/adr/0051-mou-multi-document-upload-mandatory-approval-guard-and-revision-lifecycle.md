# ADR 0051: MoU Multi-Document Upload, Mandatory Approval Guard, and Revision Lifecycle

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In Vrello Up's marcom architecture, **Memorandums of Understanding (`Mou`)** represent foundational legal master agreements established between Indosat/Tri regional marcom branches and partner retail outlets (`Outlet`). These agreements legally authorize the installation of permanent promotional assets (`Placement`), establish annual store compensation fees, and bind parties to commercial terms.

A comprehensive operational and architectural audit revealed four critical friction points and governance gaps in the current implementation:

1. **Absence of Mandatory Contract Guard on Approval & Completion:**  
   Currently, `PATCH /api/marcom/mous/[id]` allows any authorized approver (Supervisor or Admin) to transition an MoU from `SUBMITTED` to `APPROVED` and subsequently to `DONE` even when `docPath` is completely empty. Consequently, store compensation funds can be disbursed and expensive permanent fixtures (e.g., Shopblind, Neon Box) installed without any signed physical contract or Berita Acara on record, exposing the enterprise to severe legal and audit liabilities.

2. **Single-File Schema Constraint vs Field Reality (Multi-Page Mobile Photos):**  
   The `Mou` data model currently holds a single scalar string `docPath String @default("")`. In field operations, staff visiting physical retail kiosks rarely carry portable scanners. Agreements are printed on 2–4 physical pages, signed on-site with physical materai, and captured sheet-by-sheet via smartphone camera (multiple JPG/PNG files). Because the schema only accepts a single file, staff can only upload page 1 (clipping contractual clauses and signature pages) or are forced to use third-party merge tools, leading to compliance abandonment.

3. **Absence of `REVISION` Status & Inefficient Row Duplication:**  
   The current `MouStatus` enum comprises `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, and `DONE`. There is no distinction between permanent rejection (e.g., store permanently unsuitable or uncooperative) and an administrative correction request (e.g., adjust rental fee, re-photograph blurry document). Furthermore, while `mouMachine.ts` technically permitted `REJECTED -> DRAFT`, the UI (`MouExpandedRow.tsx` and `MouDetailDrawer.tsx`) lacked action buttons for rejected records. As a result, rejected rows became dead ends, forcing field staff to create an entirely new row from scratch via "+ Buat MoU Baru", cluttering the database with duplicate records and severing audit history.

4. **Pipeline View Synchronization & Health Integrity:**  
   In `src/lib/marcom/pipelineEngine.ts`, `normalizeMouStatus` only recognized the 5 legacy statuses, falling back to `"UNKNOWN"` with console warnings for any new status. To prevent pipeline drift, any new status must be handled explicitly: maintaining `isHealthy === false`, continuing to flag permanent POSM lacking approved MoUs as Bottlenecks, and rendering a distinct visual badge in the pipeline matrix table.

---

## 2. Decision Drivers

1. **Legal Governance & Audit Accountability**: An MoU represents commercial liability. Transitioning to `APPROVED` or `DONE` must be fail-closed: blocked by the backend API and disabled in the UI if no document is attached.
2. **Pragmatic Field UX (Zero Dummy Uploads)**: Document upload must remain **optional** during initial `DRAFT` and `SUBMITTED` stages so staff are not forced into uploading dummy files before physical signing occurs.
3. **Multi-Page Mobile Document Ingestion**: Support uploading a single consolidated `.pdf` file **OR** 1–5 mobile photos (`.jpg`, `.png`) of physical paper contract sheets.
4. **Clean In-Place Revision Lifecycle**: Distinguish between permanent rejection (`REJECTED`) and revision request (`REVISION`), with clear UI action buttons to revise records in-place without duplicating database rows.
5. **Airtight Pipeline Integrity**: `pipelineEngine.ts` must treat `REVISION` as a first-class status, displaying an orange `"Perlu Revisi"` badge, evaluating `isHealthy = false`, and accurately flagging pending POSM as Bottlenecks.
6. **100% Backward Compatibility**: Existing database records with single `docPath` must remain functional without data migration breakage.

---

## 3. Options Considered

### Option 1: Unified MoU Governance — Multi-Document Upload, Mandatory Approval Guard, & First-Class `REVISION` (Chosen)
- **Data Model & Schema**:
  - Add `REVISION` to `enum MouStatus` in `prisma/schema.prisma`.
  - Add `docPaths String[] @default([])` (PostgreSQL native array) to `model Mou`. Keep `docPath String @default("")` synchronized to the primary file for backward compatibility.
- **State Machine (`mouMachine.ts`)**:
  - `DRAFT -> SUBMITTED`
  - `SUBMITTED -> APPROVED | REVISION | REJECTED | DRAFT`
  - `REVISION -> SUBMITTED`
  - `REJECTED -> DRAFT`
  - `APPROVED -> DONE`
- **Validation Guard (`PATCH /api/marcom/mous/[id]`)**:
  - If requested status is `APPROVED` or `DONE`, assert `(mou.docPaths.length > 0 || Boolean(mou.docPath))`. Reject with HTTP 422 if empty.
  - In UI, disable *"Approve MOU"*, *"Quick Approve"*, and *"Mark Done"* buttons with helpful tooltips when no document is attached.
- **In-Place UI Controls**:
  - Add *"Minta Revisi"* button for approvers on `SUBMITTED` rows.
  - Add *"Kirim Ulang Revisi"* button on `REVISION` rows.
  - Add *"Kembalikan ke Draft"* button on `REJECTED` rows.
- **Multi-File Upload & Viewer**:
  - Update `MouFormModal.tsx` to accept multiple files, displaying an attachment list with individual removal.
  - Update `MouDocumentViewerModal.tsx` with page navigation (*"Halaman X dari Y"* with Prev/Next buttons).
- **Pipeline Integration (Jalur 2)**:
  - Add `REVISION` to `normalizeMouStatus` in `pipelineEngine.ts`.
  - Render orange badge `Perlu Revisi` in `PipelineMatrixTable.tsx` and `PipelineCockpitCardList.tsx`.
- **Pros**:
  - Solves legal risk, mobile photo usability, and database clutter simultaneously.
  - Seamless in-place workflow eliminates dead-end rejections.
  - Transparent pipeline monitoring for field operations.
- **Cons**: Requires adding one enum value to Prisma schema and updating table UI columns.

### Option 2: Minimalist Zero-Enum Fallback
- Do not modify Prisma `MouStatus` enum.
- Re-use `REJECTED -> DRAFT` as the only revision mechanism.
- Keep `docPath` as single scalar string.
- Only add backend guard for `APPROVED`.
- **Pros**: Zero Prisma enum migrations.
- **Cons**: No operational distinction between dead rejections and actionable revisions; field staff cannot upload multi-page phone photos.

### Option 3: Full Digital Signature (e-Sign) & Legal ERP Integration
- Integrate third-party e-signature APIs (e.g., PrivyID, DocuSign, or PERURI e-meterai) directly into the app.
- **Pros**: Paperless corporate workflow.
- **Cons**: Extreme over-engineering; retail kiosk owners in suburban/rural areas do not possess corporate digital IDs or smartphone app setups for third-party e-sign.

---

## 4. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1: Unified Governance (Chosen) | Option 2: Minimalist Fallback | Option 3: Digital e-Sign Integration |
| :--- | :--- | :--- | :--- |
| **Legal Audit & Compliance** | **Airtight**: Zero MoUs approved without verified document attachments. | **High**: Guards approval, but documents remain single-file. | **Airtight**: Cryptographically signed digital contracts. |
| **Field Operational Usability** | **Excellent**: Staf can snap 2–3 photos from smartphone on-site without needing scanner or PDF merger. | **Poor**: Staff blocked if they have multiple photo sheets. | **Unusable**: Kiosk owners cannot navigate digital identity verification. |
| **Database Hygiene & Audit Trail** | **Clean**: In-place revision loop eliminates duplicate rows. | **Moderate**: Staf still confused by "REJECTED" label. | **Clean**: Integrated transaction log. |
| **Pipeline Visibility** | **Exact**: Dedicated orange "Perlu Revisi" badge; bottleneck detection active. | **Opaque**: Labeled as DRAFT or REJECTED. | **Exact**: But adds external network dependencies. |
| **Engineering Cost & Blast Radius** | **Pragmatic**: 1 enum addition, 1 column array, pure component enhancements. | **Minimal**: ~20 LOC in route handler. | **Very High**: External API integration, webhook callbacks, user verification. |

---

## 5. Decision & Explicit System Architecture

We adopt **Option 1: Unified MoU Governance — Multi-Document Upload, Mandatory Approval Guard, & First-Class `REVISION` Lifecycle**.

### 5.1 Data Model Changes (`prisma/schema.prisma`)
1. **Extend `MouStatus` Enum**:
   ```prisma
   enum MouStatus {
     DRAFT
     SUBMITTED
     REVISION
     APPROVED
     REJECTED
     DONE
   }
   ```
2. **Add `docPaths` Array to `model Mou`**:
   ```prisma
   model Mou {
     // ... existing fields ...
     docPath   String   @default("")    // Primary/fallback document path
     docPaths  String[] @default([])   // Full array of uploaded file paths (PDF or multi-photos)
     // ...
   }
   ```

### 5.2 SSOT Domain Types (`src/types/index.ts`)
```ts
export type MouStatus = "DRAFT" | "SUBMITTED" | "REVISION" | "APPROVED" | "REJECTED" | "DONE";

export interface Mou {
  // ...
  docPath?: string;
  docPaths?: string[];
  // ...
}
```

### 5.3 State Machine Definition (`src/lib/marcom/mouMachine.ts`)
```ts
export const MOU_STATUSES: readonly MouStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "REVISION",
  "APPROVED",
  "REJECTED",
  "DONE",
];

const ALLOWED_TRANSITIONS: Record<MouStatus, readonly MouStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REVISION", "REJECTED", "DRAFT"],
  REVISION: ["SUBMITTED", "DRAFT"],
  REJECTED: ["DRAFT"],
  APPROVED: ["DONE"],
  DONE: [],
};
```

### 5.4 Backend Approval & Completion Guard (`src/app/api/marcom/mous/[id]/route.ts`)
In `PATCH /api/marcom/mous/[id]`:
```ts
  if (data.status === "APPROVED" || data.status === "DONE") {
    const existingDocPaths = existing.docPaths || [];
    const newDocPaths = (data.docPaths as string[]) || [];
    const hasExistingDoc = Boolean(existing.docPath?.trim()) || existingDocPaths.length > 0;
    const hasNewDoc = (typeof data.docPath === "string" && Boolean(data.docPath.trim())) || newDocPaths.length > 0;

    if (!hasExistingDoc && !hasNewDoc) {
      return NextResponse.json(
        { error: "Dokumen kontrak/MoU fisik wajib diunggah sebelum disetujui (APPROVED) atau dituntaskan (DONE)." },
        { status: 422 }
      );
    }
  }
```

### 5.5 Pipeline View Integration (`src/lib/marcom/pipelineEngine.ts`)
1. Update `normalizeMouStatus`:
   ```ts
   if (upper === "REVISION") return "REVISION";
   ```
2. Update `mouSummary.latestStatus` in `src/types/index.ts` to include `"REVISION"`.
3. In `PipelineMatrixTable.tsx` and `PipelineCockpitCardList.tsx`:
   ```tsx
   case "REVISION":
     return (
       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
         <RotateCcw className="w-2.5 h-2.5 text-orange-500" />
         Perlu Revisi
       </span>
     );
   ```

### 5.6 UI In-Place Revision & Multi-File Viewer Controls
1. **`MouExpandedRow.tsx` & `MouDetailDrawer.tsx`**:
   - For `mou.status === "REVISION"`: Show *"Submit Ulang"* and *"Edit MOU"*.
   - For `mou.status === "SUBMITTED"`: Approvers have buttons *"Minta Revisi"* (`REVISION`), *"Tolak"* (`REJECTED`), and *"Approve MOU"* (`APPROVED`).
   - For `mou.status === "REJECTED"`: Show button *"Kembalikan ke Draft"* (`RotateCcw`).
   - If document is missing on `SUBMITTED`, disable *"Approve MOU"* with warning tooltip.
2. **`MouFormModal.tsx`**: Support `input multiple`, show multi-file badge list with single-click remove. Synchronize first uploaded file into `docPath` and all files into `docPaths`.
3. **`MouDocumentViewerModal.tsx`**: If multiple files exist, render sheet pagination (*"Halaman X dari Y"* with Prev/Next buttons).

---

## 6. Explicit Consequences & Trade-offs Accepted

1. **Prisma Enum Migration Required**:
   - Adding `REVISION` to `enum MouStatus` requires executing `npx prisma db push`.
2. **Legacy Single-File Data Coexistence**:
   - Older rows where `docPaths` is empty will seamlessly fall back to `docPath`. New uploads populate both `docPath` (primary) and `docPaths` (array).

---

## 7. Verification Invariants

1. `npm run drift:check`: Invariants, SSOT, coordinator file size $\le 250$ LOC, and 78/78 spec-plan pairing pass.
2. `npm run build:check`: TypeScript compilation completes with 0 errors.
3. `mouMachine.test.ts`: Asserts valid transitions for `REVISION` (`SUBMITTED -> REVISION -> SUBMITTED`).
4. `mouApi.test.ts`: Asserts `PATCH /api/marcom/mous/[id]` rejects `APPROVED` with 422 if no document is present.
5. `pipelineLogic.test.ts`: Asserts `REVISION` evaluates to `isHealthy = false` and does not trigger unhandled status warnings.
6. `npm test`: Full test suite passes with 0 failures.



