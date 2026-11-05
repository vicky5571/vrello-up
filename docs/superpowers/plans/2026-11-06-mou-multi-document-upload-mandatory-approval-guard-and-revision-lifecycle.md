# Implementation Plan: MoU Multi-Document Upload, Mandatory Approval Guard, and Revision Lifecycle

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle-design.md`
- **ADR Reference:** `docs/adr/0051-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md`

---

## 1. Executive Summary & File Manifest

This plan implements comprehensive legal governance and in-place revision management for Marcom Memorandums of Understanding (`Mou`). It establishes multi-document support (`docPaths`), enforces a mandatory physical contract guard for `APPROVED` and `DONE` states, integrates a first-class `REVISION` status into the state machine and pipeline cockpit, eliminates destructive row duplication on rejected records, and provides fresh database seed data.

### File Manifest with Estimated LOC

| Action | File Path | Estimated LOC Diff | Responsibility |
| :--- | :--- | :---: | :--- |
| **Modify** | `prisma/schema.prisma` | ~10 | Add `REVISION` to `MouStatus` enum and `docPaths` array to `Mou` model |
| **Modify** | `src/types/index.ts` | ~15 | SSOT updates: `MouStatus`, `Mou`, `MarcomMou`, `OutletPipelineRow` |
| **Modify** | `src/lib/marcom/mouMachine.ts` | ~20 | Add `REVISION` to `MOU_STATUSES` and transition rules |
| **Modify** | `src/lib/marcom/mouMachine.test.ts` | ~25 | Unit tests for `REVISION` transition loops |
| **Modify** | `src/app/api/marcom/mous/[id]/route.ts` | ~30 | Add mandatory document guard for `APPROVED`/`DONE`, support `docPaths` in patch |
| **Modify** | `src/app/api/marcom/mous/route.ts` | ~10 | Accept `docPaths` in POST handler and synchronize `docPath` |
| **Modify** | `src/components/views/MousView/mouApi.test.ts` | ~45 | API integration tests for document guard and revision transitions |
| **Modify** | `src/lib/marcom/pipelineEngine.ts` | ~15 | Recognize `REVISION` in `normalizeMouStatus` |
| **Modify** | `src/lib/marcom/pipelineEngine.test.ts` | ~20 | Verify pipeline normalization and bottleneck evaluation |
| **Modify** | `src/components/views/PipelineView/PipelineMatrixTable.tsx` | ~15 | Render orange `Perlu Revisi` badge |
| **Modify** | `src/components/views/PipelineView/PipelineCockpitCardList.tsx` | ~15 | Render orange `Perlu Revisi` badge |
| **Modify** | `src/components/views/MousView/mouSortingHelpers.ts` | ~5 | Add `REVISION` sorting rank (rank 2) |
| **Modify** | `src/components/views/MousView/mouColumns.tsx` | ~20 | Add `REVISION` badge styling, disable quick-approve if document missing |
| **Modify** | `src/components/views/MousView/MousView.tsx` | ~15 | Add `Revision` filter pill tab |
| **Modify** | `src/components/views/MousView/MouExpandedRow.tsx` | ~35 | Add "Minta Revisi", "Submit Ulang", "Kembalikan ke Draft", and guard tooltips |
| **Modify** | `src/components/mous/MouDetailDrawer.tsx` | ~35 | Drawer parity: revision action buttons and approval guards |
| **Modify** | `src/components/views/MousView/MouFormModal.tsx` | ~45 | Multi-file upload support, attachment deck list with delete buttons |
| **Modify** | `src/components/views/MousView/MouDocumentViewerModal.tsx` | ~40 | Multi-sheet navigation controls (*"Halaman X dari Y"*) |
| **Modify** | `prisma/seed.ts` | ~30 | Seed multi-document contracts and representative `REVISION` records |

---

## 2. Phased Implementation Roadmap

### Phase 1: Database Schema & SSOT Domain Types
- [ ] **Step 1.1: Update Prisma Schema (`prisma/schema.prisma`)**
  - Add `REVISION` to `enum MouStatus`.
  - Add `docPaths String[] @default([])` to `model Mou`.
- [ ] **Step 1.2: Apply Schema via Prisma DB Push**
  - Execute `npx prisma db push` to synchronize local database schema cleanly.
- [ ] **Step 1.3: Update SSOT Domain Types (`src/types/index.ts`)**
  - Update `MouStatus`: `"DRAFT" | "SUBMITTED" | "REVISION" | "APPROVED" | "REJECTED" | "DONE"`.
  - Update `Mou` and `MarcomMou` to include `docPaths?: string[]`.
  - Update `OutletPipelineRow.mouSummary.latestStatus` union to include `"REVISION"`.
- [ ] **Verification Gate Phase 1**: Run `npm run build:check` to assert zero TypeScript errors.

---

### Phase 2: State Machine & Backend API Route Guard
- [ ] **Step 2.1: Update State Machine (`src/lib/marcom/mouMachine.ts`)**
  - Add `"REVISION"` to `MOU_STATUSES`.
  - Update `ALLOWED_TRANSITIONS`:
    - `SUBMITTED: ["APPROVED", "REVISION", "REJECTED", "DRAFT"]`
    - `REVISION: ["SUBMITTED", "DRAFT"]`
    - `REJECTED: ["DRAFT"]`
- [ ] **Step 2.2: Unit Tests for State Machine (`src/lib/marcom/mouMachine.test.ts`)**
  - Verify `canTransitionMou("SUBMITTED", "REVISION") === true`.
  - Verify `canTransitionMou("REVISION", "SUBMITTED") === true`.
  - Verify `canTransitionMou("REJECTED", "DRAFT") === true`.
- [ ] **Step 2.3: Implement Backend Approval & Completion Guard (`src/app/api/marcom/mous/[id]/route.ts`)**
  - Add `"docPaths"` to `PATCHABLE_FIELDS`.
  - If `data.status === "APPROVED"` or `data.status === "DONE"`:
    - Assert `existing.docPaths.length > 0 || Boolean(existing.docPath?.trim()) || (Array.isArray(data.docPaths) && data.docPaths.length > 0) || Boolean(data.docPath)`.
    - If no document is attached, return `HTTP 422 Unprocessable Entity` ("Dokumen kontrak/MoU fisik wajib diunggah sebelum disetujui (APPROVED) atau dituntaskan (DONE).").
  - Synchronize `docPath = data.docPaths[0]` if `data.docPaths` is passed.
- [ ] **Step 2.4: Support `docPaths` in POST Route (`src/app/api/marcom/mous/route.ts`)**
  - Accept `docPaths` array and persist.
- [ ] **Step 2.5: Automated API Tests (`src/components/views/MousView/mouApi.test.ts`)**
  - Test `PATCH` to `APPROVED` without document returns HTTP 422.
  - Test `PATCH` to `APPROVED` with document returns HTTP 200.
  - Test `PATCH` to `REVISION` updates status successfully.
- [ ] **Verification Gate Phase 2**: Run `node --test src/lib/marcom/mouMachine.test.ts`.

---

### Phase 3: Pipeline View & Cockpit Integration
- [ ] **Step 3.1: Update Pipeline Engine Normalizer (`src/lib/marcom/pipelineEngine.ts`)**
  - In `normalizeMouStatus`: add `if (upper === "REVISION") return "REVISION";`.
  - Ensure `isHealthy = latestMouStatus === "APPROVED"` remains strictly false for `REVISION`.
  - Ensure `hasApprovedMou` remains false if only a `REVISION` MoU exists, triggering Bottleneck alerts on permanent materials.
- [ ] **Step 3.2: Render `REVISION` Badge in Pipeline Matrix Table (`PipelineMatrixTable.tsx`)**
  - Add `case "REVISION":` returning orange badge with `RotateCcw` icon and label `"Perlu Revisi"`.
- [ ] **Step 3.3: Render `REVISION` Badge in Cockpit Card List (`PipelineCockpitCardList.tsx`)**
  - Add `case "REVISION":` parity for mobile/card view.
- [ ] **Step 3.4: Automated Pipeline Engine Tests (`src/lib/marcom/pipelineEngine.test.ts`)**
  - Verify `normalizeMouStatus("REVISION") === "REVISION"`.
  - Verify an outlet with `REVISION` MoU evaluates to `isHealthy = false`.
- [ ] **Verification Gate Phase 3**: Run `node --test src/lib/marcom/pipelineEngine.test.ts`.

---

### Phase 4: MousView UI Multi-File & In-Place Revision Controls
- [ ] **Step 4.1: Status Styling & Sorting (`mouSortingHelpers.ts` & `mouColumns.tsx`)**
  - In `mouSortingHelpers.ts`: assign `REVISION: 2` in `MOU_STATUS_ORDER`.
  - In `mouColumns.tsx`: define `STATUS_STYLES.REVISION = "bg-orange-500/10 text-orange-600 dark:text-orange-400"`.
  - In `mouColumns.tsx`: disable Quick Approve button if MoU lacks documents, rendering warning tooltip.
- [ ] **Step 4.2: Filter Tab Chip in `MousView.tsx`**
  - Add `{ label: "Revision", value: "REVISION" }` to filter tabs.
- [ ] **Step 4.3: In-Place Revision Actions in Expanded Row (`MouExpandedRow.tsx`)**
  - If `status === "SUBMITTED"`: render *"Minta Revisi"* button calling `onStatusTransition(mou, "REVISION")`.
  - If `status === "REVISION"`: render *"Submit Ulang"* button calling `onStatusTransition(mou, "SUBMITTED")`.
  - If `status === "REJECTED"`: render *"Kembalikan ke Draft"* button calling `onStatusTransition(mou, "DRAFT")`.
  - If `!hasDoc`, disable *"Approve MOU"* with title *"Wajib ada dokumen kontrak terunggah"*.
- [ ] **Step 4.4: In-Place Revision Actions in Detail Drawer (`MouDetailDrawer.tsx`)**
  - Replicate identical action button matrix and approval guards in the slide-over detail drawer.
- [ ] **Step 4.5: Multi-File Ingestion in Form Modal (`MouFormModal.tsx`)**
  - Add `multiple` to `<input type="file" accept="application/pdf,image/*" multiple />`.
  - Handle concurrent upload of multiple files and append to `modalMou.docPaths`.
  - Render an attachment deck showing each file's clean name, format icon, and individual delete button.
- [ ] **Step 4.6: Multi-Sheet In-App Viewer (`MouDocumentViewerModal.tsx`)**
  - Support array of document paths.
  - Render pagination bar (*"Berkas X dari Y"*) with previous/next navigation buttons when multiple files are attached.

---

### Phase 5: Fresh Seed Generation & Verification Gates
- [ ] **Step 5.1: Update Database Seed (`prisma/seed.ts`)**
  - Seed multi-page documents for `mou-hlth-004` (`docPaths: [page1Url, page2Url]`).
  - Seed a representative `REVISION` record (`mou-rev-007`) with actionable notes.
- [ ] **Step 5.2: Execute Re-Seed Database**
  - Run `npm run db:seed` to repopulate local database with clean test fixtures.
- [ ] **Step 5.3: Execute Non-Negotiable Verification Gates**
  - Run `npm run drift:check` (must pass 78/78 pairs, 0 drift).
  - Run `npm run build:check` (0 errors).
  - Run `npm test` (0 failures).


