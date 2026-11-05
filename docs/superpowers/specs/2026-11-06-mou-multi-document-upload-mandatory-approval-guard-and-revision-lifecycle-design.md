# Spec: MoU Multi-Document Upload, Mandatory Approval Guard, and Revision Lifecycle

- **Status:** APPROVED
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0051-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md`

---

## 1. Executive Summary & Problem Scope

This specification defines the complete technical architecture and UI workflows for Memorandum of Understanding (`Mou`) document governance and revision management:
1. **Multi-Document Ingestion (`docPaths`)**: Enables field staff to upload either a single consolidated `.pdf` file **OR** 1–5 mobile photos (`.jpg`, `.png`) of physical paper contract sheets.
2. **Mandatory Document Approval Guard**: Blocks transitioning any MoU to `APPROVED` or `DONE` unless at least one valid document file is attached, while keeping upload optional for `DRAFT` and `SUBMITTED` stages.
3. **First-Class `REVISION` Status**: Extends `MouStatus` enum with `REVISION` to distinguish between permanent commercial rejection and administrative document/price corrections.
4. **In-Place Revision Loop**: Eliminates the dead-end rejection bug in `MouExpandedRow.tsx` and `MouDetailDrawer.tsx`, providing explicit in-place revision actions without duplicating database rows.
5. **Pipeline Cockpit Integration**: Updates `pipelineEngine.ts` to recognize `REVISION` as a first-class status, displaying an orange `"Perlu Revisi"` badge, evaluating `isHealthy = false`, and surfacing pending permanent POSM as Bottlenecks.
6. **Fresh Seed Generation**: Updates `prisma/seed.ts` with multi-document contracts and representative `REVISION` records.

---

## 2. State Machine & Transitions

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOU STATUS LIFECYCLE                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [DRAFT] ──────────────(Submit for Review)─────────────> [SUBMITTED]  │
│      ▲                                                        │        │
│      │                                                        │        │
│  (Revise to Draft)                                            │        │
│      │                                                        │        │
│  [REJECTED] <───────────(Reject - Final)──────────────────────┤        │
│                                                               │        │
│  [REVISION] <───────────(Request Corrections)─────────────────┤        │
│      │                                                        │        │
│      └────────(Resubmit Revised Data & Docs)──────────────────┤        │
│                                                               │        │
│                                                   (Approve - Guarded)  │
│                                                   [Must have document] │
│                                                               ▼        │
│                                                          [APPROVED]    │
│                                                               │        │
│                                                   (Mark Done - Guarded)│
│                                                   [Must have document] │
│                                                               ▼        │
│                                                            [DONE]      │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 State Transition Matrix (`src/lib/marcom/mouMachine.ts`)

| From Status | Allowed Target Statuses | Guard Condition / Trigger Rule |
| :--- | :--- | :--- |
| **`DRAFT`** | `SUBMITTED` | Target branch, partner name, and mouType required. Document is optional. |
| **`SUBMITTED`** | `APPROVED`, `REVISION`, `REJECTED`, `DRAFT` | • Transition to `APPROVED` requires at least 1 document (`docPaths.length > 0 \|\| Boolean(docPath)`).<br>• `REVISION` can be requested by approvers with feedback notes.<br>• `REJECTED` permanently declines the proposal. |
| **`REVISION`** | `SUBMITTED`, `DRAFT` | Staf can edit data and resubmit directly to `SUBMITTED` on the same row. |
| **`REJECTED`** | `DRAFT` | Staf can pull back rejected proposal to `DRAFT` for in-place re-negotiation. |
| **`APPROVED`** | `DONE` | Requires active document on file. Final contract completion. |
| **`DONE`** | *(None)* | Terminal state. |

---

## 3. Data Contracts & Schema Invariants

### 3.1 Prisma Schema Changes (`prisma/schema.prisma`)
```prisma
enum MouStatus {
  DRAFT
  SUBMITTED
  REVISION
  APPROVED
  REJECTED
  DONE
}

model Mou {
  id                String     @id @default(cuid())
  branchId          String
  branch            Branch     @relation(fields: [branchId], references: [id], onDelete: Cascade)
  outletId          String?
  outlet            Outlet?    @relation(fields: [outletId], references: [id], onDelete: SetNull)
  outletName        String     @default("")
  partnerName       String
  mouType           String
  submissionDate    DateTime?
  startDate         DateTime?
  endDate           DateTime?
  status            MouStatus  @default(DRAFT)
  picName           String     @default("")
  picPhone          String     @default("")
  docPath           String     @default("")   // Primary/first document path (preserves backwards compatibility)
  docPaths          String[]   @default([])  // Full array of uploaded contract documents/photos
  compensationValue Float      @default(0)
  notes             String     @default("")

  placements Placement[]

  @@index([outletId])
  @@index([branchId])
}
```

### 3.2 SSOT Domain Types (`src/types/index.ts`)
```ts
export type MouStatus = "DRAFT" | "SUBMITTED" | "REVISION" | "APPROVED" | "REJECTED" | "DONE";

export interface Mou {
  id: string;
  branchId: string;
  outletId?: string | null;
  outletName?: string;
  partnerName: string;
  mouType: string;
  submissionDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: MouStatus;
  picName?: string;
  picPhone?: string;
  docPath?: string;
  docPaths?: string[];
  compensationValue?: number;
  notes?: string;
  branch?: { id: string; code: string; name: string };
  outlet?: { id: string; code: string; name: string } | null;
}

export type MarcomMou = Mou & {
  branch?: { id: string; code: string; name: string };
  outlet?: { id: string; code: string; name: string };
  placements?: Array<{
    id: string;
    mouId?: string | null;
    status: string;
    material: string;
    cost: number;
    dimensions?: string;
    storeType?: string;
  }>;
};

// In OutletPipelineRow.mouSummary:
export interface OutletPipelineRow {
  // ...
  mouSummary: {
    total: number;
    latestStatus: "APPROVED" | "DONE" | "SUBMITTED" | "REVISION" | "DRAFT" | "REJECTED" | "NONE" | "UNKNOWN";
    compensationValue: number;
    isHealthy: boolean;
    daysLeft?: number;
    isExpiringSoon?: boolean;
    isExpired?: boolean;
    daysPendingApproval?: number;
  };
  // ...
}
```

### 3.3 Core Invariants
1. **Mandatory Document Invariant**: A transition to `status === "APPROVED"` or `status === "DONE"` is rejected fail-closed with HTTP 422 Unprocessable Entity if:
   $$\text{docPaths.length} = 0 \quad \text{AND} \quad (\text{docPath} = \text{""} \lor \text{docPath} = \text{null})$$
2. **Primary Sync Invariant**: Whenever `docPaths` array is provided, `docPath` is synchronized to `docPaths[0]` to ensure that any single-string readers receive a valid URL without code breakage.
3. **Pipeline Health Invariant**: In `pipelineEngine.ts`, `isHealthy` evaluates to `true` if and only if `latestStatus === "APPROVED"`. Any MoU with `status === "REVISION"` evaluates to `isHealthy = false`.
4. **Bottleneck Realization Invariant**: In `pipelineEngine.ts`, any permanent material placement on an outlet with a `REVISION` or `SUBMITTED` MoU triggers `isBlockedItem = true` and surfaces in the Bottleneck filter.

---

## 4. API Endpoints & Contracts

### 4.1 `PATCH /api/marcom/mous/[id]`
* **Updatable Fields**: Adds `"docPaths"` to `PATCHABLE_FIELDS`.
* **Status Guard Implementation**:
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
* **Payload Normalization**:
  If `Array.isArray(data.docPaths)`:
  - If `data.docPaths.length > 0 && !data.docPath`: set `data.docPath = data.docPaths[0]`.
  - If `data.docPaths.length === 0`: set `data.docPath = ""`.

### 4.2 `POST /api/marcom/mous`
* Accepts `docPaths?: string[]`.
* If provided, sets `docPaths` and syncs `docPath = docPaths[0]`.

---

## 5. UI Component & UX Specifications

### 5.1 Multi-File Upload in `MouFormModal.tsx`
* **File Input Upgrade**: Add `multiple` attribute to `<input type="file" accept="application/pdf,image/*" multiple />`.
* **Multi-File Handling**:
  - Uploads all selected files in parallel via `Promise.all(files.map(f => uploadMouDocument(f, id)))`.
  - Appends resulting URLs to `modalMou.docPaths`.
  - Sets `modalMou.docPath = modalMou.docPaths[0] || ""`.
* **Attachment Deck List**:
  - Renders each file as a discrete item showing clean filename and format icon (`FileText` for PDF, `ImageIcon` for photos).
  - Each item includes an individual *"Hapus"* button to remove that specific page/file without wiping the entire document collection.

### 5.2 Multi-Document In-App Viewer (`MouDocumentViewerModal.tsx`)
* Accepts `docPaths?: string[]` (falling back to `[docPath]` if empty).
* If total files $> 1$:
  - Renders a top navigation bar: *"Berkas {currentIndex + 1} dari {totalFiles}"*.
  - Provides intuitive `Previous` and `Next` buttons with keyboard arrow navigation.

### 5.3 In-Place Revision Actions (`MouExpandedRow.tsx` & `MouDetailDrawer.tsx`)
* **`SUBMITTED` Actions (For Approvers)**:
  - *"Approve MOU"*: Active only if document exists; disabled with tooltip if no document is attached.
  - *"Minta Revisi"*: Calls `onStatusTransition(mou, "REVISION")`.
  - *"Tolak"*: Calls `onStatusTransition(mou, "REJECTED")`.
* **`REVISION` Actions (For Field Staff & Approvers)**:
  - *"Submit Ulang"*: Calls `onStatusTransition(mou, "SUBMITTED")`.
  - *"Edit MOU"*: Opens modal to modify terms or add missing documents.
* **`REJECTED` Actions**:
  - *"Kembalikan ke Draft"*: Calls `onStatusTransition(mou, "DRAFT")`.
  - *"Edit MOU"*: Opens modal to review data.

### 5.4 Pipeline View Badge (`PipelineMatrixTable.tsx` & `PipelineCockpitCardList.tsx`)
* Renders `case "REVISION":`
  ```tsx
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
    <RotateCcw className="w-2.5 h-2.5 text-orange-500" />
    Perlu Revisi
  </span>
  ```

---

## 6. Seed Data Strategy (`prisma/seed.ts`)

Re-seeding ensures clean operational data without legacy artifacts:
1. Update `mousData`:
   - `mou-hlth-004` (APPROVED): Seed with `docPaths: ["https://.../mou_hal1.jpg", "https://.../mou_hal2.jpg"]`.
   - `mou-rev-007` (New REVISION record):
     - `partnerName: "Toko Sinar Rejeki"`
     - `status: "REVISION"`
     - `notes: "Revisi nilai kompensasi menjadi Rp3.500.000 dan unggah foto lembar tanda tangan."`
2. Run database synchronization and seed:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

---

## 7. Verification & Testing Matrix

| Test Suite / File | Test Case Description | Target Gate |
| :--- | :--- | :---: |
| `src/lib/marcom/mouMachine.test.ts` | 1. Asserts `canTransitionMou("SUBMITTED", "REVISION") === true`<br>2. Asserts `canTransitionMou("REVISION", "SUBMITTED") === true`<br>3. Asserts `canTransitionMou("REJECTED", "DRAFT") === true` | `npm test` |
| `src/app/api/marcom/mous/mouApi.test.ts` | 1. Asserts 422 rejected when approving without documents<br>2. Asserts 200 permitted when approving with valid `docPaths`<br>3. Asserts transition to `REVISION` updates database row | `npm test` |
| `src/lib/marcom/pipelineEngine.test.ts` | 1. Asserts `normalizeMouStatus("REVISION") === "REVISION"`<br>2. Asserts `isHealthy === false` for `REVISION`<br>3. Asserts permanent POSM without approved MoU triggers bottleneck | `npm test` |
| Full verification | `npm run drift:check`, `npm run build:check`, `npm test` | **0 failures** |



