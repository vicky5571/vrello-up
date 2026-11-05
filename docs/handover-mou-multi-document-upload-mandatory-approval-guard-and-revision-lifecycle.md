# Handover: MoU Multi-Document Upload, Mandatory Approval Guard, and Revision Lifecycle

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-06
- **ADR Reference:** `docs/adr/0051-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-06-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-06-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md`

---

## 1. Executive Summary & Context

This handover guide provides execution-ready instructions to implement ADR-0051. It addresses three primary operational challenges:
1. **Multi-Page Physical Contract Capture**: Field staff photographing physical agreements sheet-by-sheet need to upload 1–5 image files or a single consolidated PDF without requiring manual merging.
2. **Contract Enforceability & Approval Guard**: Prevent accidental or premature approval of an MoU (`APPROVED` or `DONE`) without a verified physical or digital signed contract on file, while keeping document upload optional for `DRAFT` and `SUBMITTED`.
3. **In-Place Revision Lifecycle**: Add a first-class `REVISION` status in `MouStatus` and state machine transitions, eliminating the dead-end rejection UX in `MouExpandedRow.tsx` and `MouDetailDrawer.tsx` where staff had to abandon rejected rows and create duplicate rows from scratch.
4. **Pipeline Cockpit Visibility**: Ensure `pipelineEngine.ts` treats `REVISION` as active work requiring attention (badge: orange `"Perlu Revisi"` with `RotateCcw` icon, `isHealthy = false`, and permanent POSM flagged as Bottlenecks).

---

## 2. Exact File Manifest & Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `prisma/schema.prisma` | Add `REVISION` to `MouStatus` enum and `docPaths String[] @default([])` to `Mou` model. |
| `src/types/index.ts` | SSOT domain updates for `MouStatus`, `Mou`, `MarcomMou`, and `OutletPipelineRow.mouSummary`. |
| `src/lib/marcom/mouMachine.ts` | Add `REVISION` to `MOU_STATUSES` and define transitions (`SUBMITTED -> REVISION/REJECTED/DRAFT/APPROVED`, `REVISION -> SUBMITTED/DRAFT`, `REJECTED -> DRAFT`). |
| `src/lib/marcom/mouMachine.test.ts` | Unit tests asserting valid and blocked state transitions for `REVISION` and `REJECTED`. |
| `src/app/api/marcom/mous/[id]/route.ts` | Add `docPaths` to patchable fields, synchronize `docPath`, and enforce mandatory document guard for `APPROVED`/`DONE`. |
| `src/app/api/marcom/mous/route.ts` | Accept `docPaths` in creation payload and set default values. |
| `src/components/views/MousView/mouApi.test.ts` | Automated tests for document guard (HTTP 422 fail-closed) and revision transitions. |
| `src/lib/marcom/pipelineEngine.ts` | Map `REVISION` in `normalizeMouStatus`, preserve `isHealthy = false` and bottleneck alert for permanent POSM. |
| `src/lib/marcom/pipelineEngine.test.ts` | Automated test asserting pipeline engine status mapping and bottleneck detection on `REVISION`. |
| `src/components/views/PipelineView/PipelineMatrixTable.tsx` | Render orange badge `Perlu Revisi` with `RotateCcw` icon for `REVISION` status. |
| `src/components/views/PipelineView/PipelineCockpitCardList.tsx` | Render orange badge `Perlu Revisi` for mobile cockpit card list. |
| `src/components/views/MousView/mouSortingHelpers.ts` | Add `REVISION` to `MOU_STATUS_ORDER` (rank 2 or 3). |
| `src/components/views/MousView/mouColumns.tsx` | Add badge style for `REVISION`, disable Quick Approve when document is missing. |
| `src/components/views/MousView/MousView.tsx` | Add `Revision` filter chip tab in MoU filter bar. |
| `src/components/views/MousView/MouExpandedRow.tsx` | Add "Minta Revisi", "Submit Ulang", "Kembalikan ke Draft", and disabled tooltip for approval without document. |
| `src/components/mous/MouDetailDrawer.tsx` | Slide-over drawer parity: revision action buttons, reject, resubmit, and document approval guard. |
| `src/components/views/MousView/MouFormModal.tsx` | Support multi-file upload (`multiple`), attachment deck list with delete buttons. |
| `src/components/views/MousView/MouDocumentViewerModal.tsx` | Multi-sheet navigation controls (*"Berkas X dari Y"*) with previous/next buttons. |
| `prisma/seed.ts` | Seed multi-document contracts and representative `REVISION` test records. |

---

## 3. Explicit "Do Not Touch" List & Rationale

1. **`docPath` String Column in Database (`prisma/schema.prisma`)**:
   - **Do NOT delete or rename `docPath`**.
   - **Reason**: Multiple legacy components, reports, and API callers read `docPath` as a direct URL string. We keep `docPath String @default("")` and automatically synchronize it to `docPaths[0]` to ensure 100% backward compatibility.
2. **`isHealthy` Calculation Rule (`src/lib/marcom/pipelineEngine.ts`)**:
   - **Do NOT modify `const isHealthy = latestMouStatus === "APPROVED";` to include `REVISION`**.
   - **Reason**: An outlet with an MoU under revision does NOT have an active, signed contract. Material installations cannot legally proceed without an `APPROVED` MoU.
3. **Mandatory Guard on Draft or Submission**:
   - **Do NOT enforce document upload during `DRAFT` or `SUBMITTED` stages**.
   - **Reason**: Field staff frequently start drafting MoUs before the partner physically signs the paper contract. Forcing document upload upfront would cause staff to upload dummy or blank files just to save the form.
4. **`canTransitionMou` Whitelist Structure (`src/lib/marcom/mouMachine.ts`)**:
   - **Do NOT allow direct transition from `DRAFT -> APPROVED` or `REVISION -> APPROVED`**.
   - **Reason**: All proposals and revised proposals MUST pass through `SUBMITTED` review by an authorized PIC/Admin before approval.
5. **Private Proxy Storage Overhaul**:
   - **Do NOT refactor Supabase storage buckets into private proxy streams**.
   - **Reason**: The existing Supabase public bucket configuration with UUID filenames provides sufficient operational pragmatism and zero-complexity download URLs without breaking image rendering in modals or attachments.

---

## 4. Verbatim Code Snippets & Exact Changes

### 4.1 `prisma/schema.prisma`

**Current Snippet (Lines 17–23 & 212–217):**
```prisma
enum MouStatus {
  DRAFT
  SUBMITTED
  DONE
  REJECTED
  APPROVED
}

model Mou {
  // ...
  status            MouStatus  @default(DRAFT)
  picName           String     @default("")
  picPhone          String     @default("")
  docPath           String     @default("")
  compensationValue Float      @default(0)
  notes             String     @default("")
```

**Change Instruction:**
Add `REVISION` to `enum MouStatus` and `docPaths String[] @default([])` to `model Mou`:
```prisma
enum MouStatus {
  DRAFT
  SUBMITTED
  REVISION
  DONE
  REJECTED
  APPROVED
}

model Mou {
  // ...
  status            MouStatus  @default(DRAFT)
  picName           String     @default("")
  picPhone          String     @default("")
  docPath           String     @default("")
  docPaths          String[]   @default([])
  compensationValue Float      @default(0)
  notes             String     @default("")
```

After modifying the schema, apply with:
```bash
npx prisma db push
```

---

### 4.2 `src/types/index.ts`

**Current Snippet (Lines 426, 441, 463, 659):**
```ts
export type MouStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DONE";

export interface Mou {
  // ...
  docPath?: string;
  compensationValue?: number;
  notes?: string;
}

export type MarcomMou = Mou & {
  // ...
  docPath: string;
  compensationValue: number;
  notes: string;
}

export interface OutletPipelineRow {
  // ...
  mouSummary: {
    total: number;
    latestStatus: "APPROVED" | "DONE" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE" | "UNKNOWN";
```

**Change Instruction:**
1. Update `MouStatus` union:
```ts
export type MouStatus = "DRAFT" | "SUBMITTED" | "REVISION" | "APPROVED" | "REJECTED" | "DONE";
```
2. Add `docPaths?: string[];` to `Mou` interface and `MarcomMou` type.
3. Update `OutletPipelineRow.mouSummary.latestStatus` union:
```ts
latestStatus: "APPROVED" | "DONE" | "SUBMITTED" | "REVISION" | "DRAFT" | "REJECTED" | "NONE" | "UNKNOWN";
```

---

### 4.3 `src/lib/marcom/mouMachine.ts`

**Current Snippet (Lines 8–26):**
```ts
export const MOU_STATUSES: readonly MouStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "DONE",
];

const ALLOWED_TRANSITIONS: Record<MouStatus, readonly MouStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["DONE"],
  REJECTED: ["DRAFT"],
  DONE: [],
};
```

**Change Instruction:**
Replace with full revision loop support:
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
  APPROVED: ["DONE"],
  REJECTED: ["DRAFT"],
  DONE: [],
};
```

---

### 4.4 `src/app/api/marcom/mous/[id]/route.ts` & `src/app/api/marcom/mous/route.ts`

**In `src/app/api/marcom/mous/[id]/route.ts`:**
1. Add `"docPaths"` to `PATCHABLE_FIELDS`:
```ts
const PATCHABLE_FIELDS = [
  "branchId", "outletId", "outletName", "partnerName", "mouType",
  "submissionDate", "startDate", "endDate", "status", "picName",
  "picPhone", "docPath", "docPaths", "compensationValue", "notes"
] as const;
```
2. Insert document synchronization and fail-closed approval guard before `prisma.mou.update`:
```ts
  // Synchronize docPaths array and docPath fallback
  if (Array.isArray(data.docPaths)) {
    const cleanPaths = (data.docPaths as unknown[]).filter((p): p is string => typeof p === "string" && p.trim().length > 0);
    data.docPaths = cleanPaths;
    if (data.docPath === undefined) {
      data.docPath = cleanPaths.length > 0 ? cleanPaths[0] : "";
    }
  }

  // Mandatory document guard for APPROVED and DONE transitions
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

**In `src/app/api/marcom/mous/route.ts`:**
In `POST` handler, destructure `docPaths` and store:
```ts
  const cleanDocPaths = Array.isArray(docPaths)
    ? (docPaths as unknown[]).filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : [];
  const primaryDocPath = docPath || (cleanDocPaths.length > 0 ? cleanDocPaths[0] : "");
```
Pass `docPath: primaryDocPath` and `docPaths: cleanDocPaths` into `prisma.mou.create`.

---

### 4.5 `src/lib/marcom/pipelineEngine.ts`

**Current Snippet (Lines 66–76):**
```ts
function normalizeMouStatus(status?: string | null): "APPROVED" | "DONE" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE" | "UNKNOWN" {
  if (!status) return "NONE";
  const upper = status.trim().toUpperCase();
  if (upper === "APPROVED") return "APPROVED";
  if (upper === "DONE") return "DONE";
  if (upper === "SUBMITTED") return "SUBMITTED";
  if (upper === "REJECTED") return "REJECTED";
  if (upper === "DRAFT") return "DRAFT";

  console.warn(`[marcom/pipelineEngine] Unrecognized MouStatus encountered: "${status}"`);
  return "UNKNOWN";
}
```

**Change Instruction:**
Add `"REVISION"` to the return type union and the normalization condition:
```ts
function normalizeMouStatus(status?: string | null): "APPROVED" | "DONE" | "SUBMITTED" | "REVISION" | "DRAFT" | "REJECTED" | "NONE" | "UNKNOWN" {
  if (!status) return "NONE";
  const upper = status.trim().toUpperCase();
  if (upper === "APPROVED") return "APPROVED";
  if (upper === "DONE") return "DONE";
  if (upper === "SUBMITTED") return "SUBMITTED";
  if (upper === "REVISION") return "REVISION";
  if (upper === "REJECTED") return "REJECTED";
  if (upper === "DRAFT") return "DRAFT";

  console.warn(`[marcom/pipelineEngine] Unrecognized MouStatus encountered: "${status}"`);
  return "UNKNOWN";
}
```

---

### 4.6 `PipelineMatrixTable.tsx` & `PipelineCockpitCardList.tsx`

**In `src/components/views/PipelineView/PipelineMatrixTable.tsx`:**
1. Import `RotateCcw` from `"lucide-react"`.
2. In `renderMouBadge(status?: string)`, add `case "REVISION":`:
```tsx
    case "REVISION":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
          <RotateCcw className="w-2.5 h-2.5 text-orange-500" />
          Perlu Revisi
        </span>
      );
```

**In `src/components/views/PipelineView/PipelineCockpitCardList.tsx`:**
1. Import `RotateCcw` from `"lucide-react"`.
2. In `renderMouBadge(status?: string)`, add `case "REVISION":`:
```tsx
    case "REVISION":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400">
          <RotateCcw className="w-2.5 h-2.5" />
          Revisi
        </span>
      );
```

---

### 4.7 `src/components/views/MousView/mouSortingHelpers.ts` & `src/components/views/MousView/mouColumns.tsx`

**In `mouSortingHelpers.ts`:**
Update `MOU_STATUS_ORDER`:
```ts
export const MOU_STATUS_ORDER: Record<MouStatus, number> = {
  DRAFT: 1,
  SUBMITTED: 2,
  REVISION: 3,
  APPROVED: 4,
  DONE: 5,
  REJECTED: 6,
};
```

**In `mouColumns.tsx`:**
1. Update `STATUS_STYLES`:
```ts
export const STATUS_STYLES: Record<MouStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  SUBMITTED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  REVISION: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  APPROVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};
```
2. In quick action column (around line 397):
```tsx
      cell: ({ row }) => {
        const isSubmitted = row.original.status === "SUBMITTED";
        const hasDoc = Boolean(row.original.docPath?.trim()) || (row.original.docPaths && row.original.docPaths.length > 0);
        const canApprove = isSubmitted && can("APPROVE_MOU", row.original.branchId);
        const isApproving = approvingMouId === row.original.id;

        return (
          <div
            className="w-full flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {canApprove && onQuickApprove && (
              <button
                type="button"
                onClick={() => hasDoc && !isApproving && onQuickApprove(row.original)}
                disabled={!hasDoc || isApproving}
                title={!hasDoc ? "Wajib unggah dokumen kontrak sebelum disetujui" : undefined}
                aria-label={`Quick Approve MOU ${row.original.partnerName}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 min-h-[30px] rounded-md text-[11px] font-bold text-white shadow-2xs transition-colors shrink-0 whitespace-nowrap",
                  !hasDoc
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                    : isApproving
                    ? "bg-emerald-600/70 cursor-wait"
                    : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                )}
              >
                {/* ... */}
              </button>
            )}
            {/* ... */}
          </div>
        );
      }
```

---

### 4.8 `src/components/views/MousView/MousView.tsx`

**Current Snippet (Lines 33–40):**
```ts
const MOU_STATUS_CHIPS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Done", value: "DONE" },
  { label: "Rejected", value: "REJECTED" },
];
```

**Change Instruction:**
Insert `{ label: "Revision", value: "REVISION" }`:
```ts
const MOU_STATUS_CHIPS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Revision", value: "REVISION" },
  { label: "Approved", value: "APPROVED" },
  { label: "Done", value: "DONE" },
  { label: "Rejected", value: "REJECTED" },
];
```

---

### 4.9 `src/components/views/MousView/MouExpandedRow.tsx` & `src/components/mous/MouDetailDrawer.tsx`

**In `src/components/views/MousView/MouExpandedRow.tsx`:**
1. Check document presence:
```tsx
const hasDoc = Boolean(mou.docPath?.trim()) || (mou.docPaths && mou.docPaths.length > 0);
```
2. Replace action buttons block (around lines 268–315) with complete state-aware revision loop:
```tsx
        <div className="flex items-center gap-2">
          {/* DRAFT: Staff can submit for approval */}
          {mou.status === "DRAFT" && can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusTransition(mou, "SUBMITTED");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Submit for Approval</span>
            </button>
          )}

          {/* SUBMITTED: Approvers can Approve, Request Revision, or Reject */}
          {mou.status === "SUBMITTED" && (
            can("APPROVE_MOU", mou.branchId) ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusTransition(mou, "REVISION");
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                  <span>Minta Revisi</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusTransition(mou, "REJECTED");
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tolak</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasDoc) onStatusTransition(mou, "APPROVED");
                  }}
                  disabled={!hasDoc}
                  title={!hasDoc ? "Wajib ada dokumen kontrak terunggah sebelum disetujui" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors shadow-2xs",
                    !hasDoc
                      ? "text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                      : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  )}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approve MOU</span>
                </button>
              </div>
            ) : (
              <span
                title="Persetujuan MOU memerlukan wewenang Admin atau PIC resmi Cabang terkait."
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 cursor-help select-none"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Perlu Approval PIC / Admin</span>
              </span>
            )
          )}

          {/* REVISION: Staff can resubmit directly */}
          {mou.status === "REVISION" && can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusTransition(mou, "SUBMITTED");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
              <span>Submit Ulang</span>
            </button>
          )}

          {/* REJECTED: Staff can pull back to draft */}
          {mou.status === "REJECTED" && can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusTransition(mou, "DRAFT");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Kembalikan ke Draft</span>
            </button>
          )}

          {/* APPROVED: Can transition to DONE (Guarded) */}
          {mou.status === "APPROVED" && can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasDoc) onStatusTransition(mou, "DONE");
              }}
              disabled={!hasDoc}
              title={!hasDoc ? "Wajib ada dokumen kontrak terunggah" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors shadow-2xs",
                !hasDoc
                  ? "text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                  : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
              )}
            >
              <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Mark Done</span>
            </button>
          )}

          {/* Edit action */}
          {can("CREATE_MOU", mou.branchId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(mou);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>Edit</span>
            </button>
          )}
        </div>
```

**In `src/components/mous/MouDetailDrawer.tsx`:**
Replicate the exact same button guards and actions:
1. When `mou.status === "SUBMITTED"`: provide "Minta Revisi" (`REVISION`), "Tolak" (`REJECTED`), and guarded "Approve MOU".
2. When `mou.status === "REVISION"`: provide "Submit Ulang" (`SUBMITTED`) and "Edit".
3. When `mou.status === "REJECTED"`: provide "Kembalikan ke Draft" (`DRAFT`) and "Edit".
4. Guard `APPROVED` and `DONE` buttons if `!hasDoc`.

---

### 4.10 `MouFormModal.tsx` & `MouDocumentViewerModal.tsx`

**In `src/components/views/MousView/MouFormModal.tsx`:**
1. Upgrade `<input type="file">` to accept multiple files:
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="application/pdf,image/*"
  multiple
  onChange={handleFileUpload}
  disabled={isUploading}
  className="hidden"
/>
```
2. Update `handleFileUpload` to handle multiple files in parallel:
```tsx
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0 || !modalMou) return;
    setIsUploading(true);
    try {
      const uploadedPaths = await Promise.all(
        rawFiles.map((file) => uploadMouDocument(file, modalMou.id || "new"))
      );
      setModalMou((prev) => {
        if (!prev) return prev;
        const currentPaths = prev.docPaths || (prev.docPath ? [prev.docPath] : []);
        const mergedPaths = [...currentPaths, ...uploadedPaths];
        return {
          ...prev,
          docPaths: mergedPaths,
          docPath: mergedPaths[0] || "",
        };
      });
      toast.success(`${rawFiles.length} berkas berhasil diunggah`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
```
3. Update `handleSaveMou` to include `docPaths`:
```tsx
      docPath: modalMou.docPath || (modalMou.docPaths?.[0] || ""),
      docPaths: modalMou.docPaths || (modalMou.docPath ? [modalMou.docPath] : []),
```
4. Render Attachment Deck:
Display each file as an item with an individual delete button that removes only that specific item from `docPaths` and recalculates `docPath`.

**In `src/components/views/MousView/MouDocumentViewerModal.tsx`:**
1. Accept `docPaths?: string[]`:
```ts
export interface MouDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  docPath?: string | null;
  docPaths?: string[];
  // ...
}
```
2. Normalize active document array:
```ts
  const paths = (docPaths && docPaths.length > 0)
    ? docPaths
    : (docPath ? [docPath] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
```
3. Render multi-sheet pagination bar when `paths.length > 1`:
Include *"Berkas {currentIndex + 1} dari {paths.length}"* and `ChevronLeft` / `ChevronRight` navigation buttons with keyboard arrow navigation.

---

### 4.11 `prisma/seed.ts`

**Update Seed Fixtures in `seedMous()`:**
1. Update `mou-hlth-004` to multi-page photos:
```ts
    {
      id: "mou-hlth-004",
      branchId: "branch-3",
      outletId: "outlet-slo-001",
      outletName: "Solo Megah Cellular Center",
      partnerName: "Kurniawan Widjaja",
      mouType: "EXCLUSIVE_BRANDING",
      submissionDate: daysAgo(90),
      startDate: daysAgo(85),
      endDate: daysFromNow(280),
      status: "APPROVED" as MouStatus,
      picName: "Rina Wijaya",
      picPhone: "+62 812-7788-9900",
      docPath: "https://storage.marcom-internal.corp/mou-documents/MOU_Solo_Megah_Branding_2026_page1.jpg",
      docPaths: [
        "https://storage.marcom-internal.corp/mou-documents/MOU_Solo_Megah_Branding_2026_page1.jpg",
        "https://storage.marcom-internal.corp/mou-documents/MOU_Solo_Megah_Branding_2026_page2.jpg",
      ],
      compensationValue: 150000000,
      notes: "Kontrak kemitraan flagship 1 tahun penuh dengan hak eksklusif branding neon box dan shopblind.",
    },
```
2. Add `mou-rev-007` (representative `REVISION` record):
```ts
    {
      id: "mou-rev-007",
      branchId: "branch-2",
      outletId: "outlet-diy-001",
      outletName: "Toko Sinar Rejeki",
      partnerName: "Heru Prasetyo",
      mouType: "BRANDING_SHOPBLIND",
      submissionDate: daysAgo(10),
      startDate: null,
      endDate: null,
      status: "REVISION" as MouStatus,
      picName: "Doni Pratama",
      picPhone: "+62 813-2233-4455",
      docPath: "https://storage.marcom-internal.corp/mou-documents/draft_kontrak_sinar_rejeki.pdf",
      docPaths: ["https://storage.marcom-internal.corp/mou-documents/draft_kontrak_sinar_rejeki.pdf"],
      compensationValue: 3500000,
      notes: "Diminta revisi nilai kompensasi dari Rp4.000.000 menjadi Rp3.500.000 serta lengkapi foto lembar tanda tangan pemilik.",
    },
```

---

## 5. Numbered Execution Order

When moving to implementation, execute in this exact sequence:

1. **Step 1: Database Schema & SSOT**
   - Update `prisma/schema.prisma` (`REVISION` enum and `docPaths String[]`).
   - Run `npx prisma db push`.
   - Update `src/types/index.ts` (`MouStatus`, `Mou`, `MarcomMou`, `OutletPipelineRow`).
   - Run `npm run build:check` (verify types compile).
2. **Step 2: State Machine & Backend API Guard**
   - Update `src/lib/marcom/mouMachine.ts` (`MOU_STATUSES` and `ALLOWED_TRANSITIONS`).
   - Update unit test `src/lib/marcom/mouMachine.test.ts` and run `node --test src/lib/marcom/mouMachine.test.ts`.
   - Update `src/app/api/marcom/mous/[id]/route.ts` (patchable fields, docPaths sync, HTTP 422 guard on approval).
   - Update `src/app/api/marcom/mous/route.ts` (accept docPaths in POST).
   - Write API regression test in `src/components/views/MousView/mouApi.test.ts`.
3. **Step 3: Pipeline View & Cockpit Integration**
   - Update `src/lib/marcom/pipelineEngine.ts` (`normalizeMouStatus`).
   - Update `PipelineMatrixTable.tsx` & `PipelineCockpitCardList.tsx` (orange badge "Perlu Revisi").
   - Update `src/lib/marcom/pipelineEngine.test.ts` and run `node --test src/lib/marcom/pipelineEngine.test.ts`.
4. **Step 4: MousView UI Multi-File & In-Place Revision Controls**
   - Update `mouSortingHelpers.ts` (`MOU_STATUS_ORDER`) and `mouColumns.tsx` (`STATUS_STYLES` & quick approve guard).
   - Update `MousView.tsx` (`MOU_STATUS_CHIPS`).
   - Update `MouExpandedRow.tsx` and `MouDetailDrawer.tsx` (action buttons for `REVISION` and `REJECTED`, guard for `APPROVED`).
   - Update `MouFormModal.tsx` (multi-file input & attachment deck) and `MouDocumentViewerModal.tsx` (multi-sheet pager).
5. **Step 5: Database Re-Seed & Verification**
   - Update `prisma/seed.ts` with multi-document contracts and `mou-rev-007`.
   - Run `npm run db:seed`.
   - Run `npm run drift:check` (must pass 78/78 pairs).
   - Run `npm run build:check` (0 errors).
   - Run `npm test` (0 failures).

---

## 6. Acceptance Criteria & Verification Checklist

- [ ] **Database & Types**:
  - `prisma/schema.prisma` contains `REVISION` in `MouStatus` enum and `docPaths String[] @default([])` in `Mou`.
  - `src/types/index.ts` SSOT types include `REVISION` and `docPaths`.
- [ ] **State Machine & In-Place Lifecycle**:
  - `mouMachine.ts` allows `SUBMITTED -> REVISION | REJECTED | DRAFT | APPROVED`.
  - `mouMachine.ts` allows `REVISION -> SUBMITTED | DRAFT`.
  - `mouMachine.ts` allows `REJECTED -> DRAFT`.
  - Staf can resubmit or revert rejected rows directly without creating duplicate rows.
- [ ] **Backend Document Approval Guard**:
  - Transitioning to `APPROVED` or `DONE` without any attached document in `docPath` or `docPaths` is rejected with `HTTP 422 Unprocessable Entity`.
  - Transitioning to `APPROVED` or `DONE` with a valid document succeeds.
  - Documents remain completely optional for `DRAFT` and `SUBMITTED`.
- [ ] **Multi-File Upload & In-App Viewer**:
  - `MouFormModal` allows selecting and uploading multiple image/PDF files simultaneously.
  - Uploaded files are displayed in an attachment deck with individual delete buttons.
  - `MouDocumentViewerModal` allows browsing between multiple attached document sheets (*"Berkas X dari Y"*).
- [ ] **Pipeline Cockpit Integration**:
  - `normalizeMouStatus("REVISION")` returns `"REVISION"`.
  - `PipelineMatrixTable` and `PipelineCockpitCardList` render an orange badge: 🟠 **"Perlu Revisi"**.
  - Any permanent POSM lacking an approved MoU triggers a Bottleneck alert.
- [ ] **Fresh Test Fixtures**:
  - `prisma/seed.ts` seeds multi-sheet document for `mou-hlth-004` and a valid `REVISION` record (`mou-rev-007`).
  - Database re-seed runs cleanly without errors.
- [ ] **Non-Negotiable Verification Gates**:
  - `npm run drift:check` ✅ (78/78 spec-plan pairs valid, 0 drift).
  - `npm run build:check` ✅ (0 TypeScript / Next.js errors).
  - `npm test` ✅ (100% tests pass, 0 failures).

