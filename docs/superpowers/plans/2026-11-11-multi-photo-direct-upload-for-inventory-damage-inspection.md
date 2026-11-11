# Implementation Plan: Multi-Photo Direct Upload for Inventory Damage Inspection

- **Date:** 2026-11-11
- **Status:** IMPLEMENTATION COMPLETE
- **Spec:** [2026-11-11-multi-photo-direct-upload-for-inventory-damage-inspection-design.md](../specs/2026-11-11-multi-photo-direct-upload-for-inventory-damage-inspection-design.md)
- **ADR:** [ADR-0105](../../adr/0105-multi-photo-direct-upload-for-inventory-damage-inspection.md)

---

## 1. Executive Summary & File Manifest

This plan implements direct multi-photo upload from device camera/storage for physical equipment damage inspection in [`ReturnProcessModal.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/InventoryView/ReturnProcessModal.tsx). It eliminates the passive URL input and its silent failure, introduces client-side compression via `compressImage`, authorizes `inventory-damage` in `/api/marcom/uploads`, and provides an interactive thumbnail preview deck with individual photo removal.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/app/api/marcom/uploads/route.ts` | Edit | Register `"inventory-damage"` and `"inventory-proofs"` in `VALID_KINDS`, `BUCKET_MAP`, `KIND_PREFIX`, and `PERMISSION_MAP`. | ~18 lines edited |
| `src/app/api/marcom/uploads/uploadsApi.test.ts` | Edit | Add tests verifying `"inventory-damage"` and `"inventory-proofs"` upload kind authorization. | ~25 lines added |
| `src/components/views/InventoryView/ReturnProcessModal.tsx` | Edit | Replace URL input with hidden file picker, `+ Unggah Foto Kerusakan` button, client-side compression loop, and thumbnail deck. | ~60 lines edited |
| `src/components/views/InventoryView/BorrowSettlementModal.tsx` | Edit | Pass `id: record.id` in `FormData`, client image compression, and extract `data.filePath \|\| data.url`. | ~20 lines edited |
| `src/components/views/InventoryView/returnProcessModal.test.ts` | Edit | Add unit test verifying direct multi-file input and elimination of URL input. | ~30 lines added |
| `docs/SESSION_STATE.md` | Edit | Update feature status and verification history. | ~20 lines edited |

### Prerequisites & Dependencies
- Zero database migrations (Prisma `BorrowRecord.damagePhotos` already stores `String[]`).
- Relies on existing `compressImage` utility in `src/lib/marcom/imageCompression.ts`.

---

## 2. Phase 1: Backend Storage & Authorization Mapping (`/api/marcom/uploads`)

- [x] **Task 1.1: Extend `VALID_KINDS` and Storage Maps**
  - File: `src/app/api/marcom/uploads/route.ts`
  - Add `"inventory-damage"` to `VALID_KINDS`.
  - Add `"inventory-damage": "inventory-damage"` to `BUCKET_MAP`.
  - Add `"inventory-damage": "damage"` to `KIND_PREFIX`.
  - Add `"inventory-damage": "PROCESS_RETURN"` to `PERMISSION_MAP`.
- [x] **Task 1.2: Add Upload Authorization Test**
  - File: `src/app/api/marcom/uploads/uploadsApi.test.ts`
  - Add unit test verifying `inventory-damage` is accepted and guarded by `PROCESS_RETURN`.
- [x] **Task 1.3: Verify Phase 1**
  - Run: `node --test --import ./test/register-alias.mjs src/app/api/marcom/uploads/uploadsApi.test.ts`

---

## 3. Phase 2: Frontend Multi-Photo Direct Upload Deck (`ReturnProcessModal.tsx`)

- [x] **Task 2.1: Update State & Handlers**
  - File: `src/components/views/InventoryView/ReturnProcessModal.tsx`
  - Remove `photoInputUrl` and `setPhotoInputUrl`.
  - Add `isUploading` and `uploadStatus` state.
  - Add `fileInputRef = useRef<HTMLInputElement>(null)`.
  - Implement `handleFileSelect(e: React.ChangeEvent<HTMLInputElement>)`:
    - Loop over files, compress using `compressImage`, post to `/api/marcom/uploads` with `kind="inventory-damage"`.
    - Append resulting URLs to `damagePhotos`.
    - Provide user-facing toast feedback and status updates.
- [x] **Task 2.2: Replace Passive URL Input with Active File Picker Deck**
  - Mount hidden `<input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" />`.
  - Render "+ Unggah Foto Kerusakan" button with loading spinner when `isUploading`.
  - Render thumbnail cards for all `damagePhotos` with `handleRemovePhoto(index)`.

---

## 4. Phase 3: Alignment of Settlement Proof Uploads (`BorrowSettlementModal.tsx` & `inventory-proofs`)

- [x] **Task 3.1: Register `inventory-proofs` in Uploads API**
  - File: `src/app/api/marcom/uploads/route.ts`
  - Register `"inventory-proofs"` in `VALID_KINDS`.
  - Map `"inventory-proofs"` to bucket `"inventory-damage"` with prefix `"settlement"` and permission `"PROCESS_RETURN"`.
- [x] **Task 3.2: Fix FormData and Compression in `BorrowSettlementModal.tsx`**
  - File: `src/components/views/InventoryView/BorrowSettlementModal.tsx`
  - Append `formData.append("id", record.id)`.
  - Add client image compression (`compressImage`) before upload.
  - Read `data.filePath || data.url` from response.
- [x] **Task 3.3: Verify Settlement Upload Invariants**
  - File: `src/app/api/marcom/uploads/uploadsApi.test.ts`
  - File: `src/components/views/InventoryView/borrowSettlementModal.test.ts`

---

## 5. Phase 4: Integration Testing & Verification Gates

- [x] **Task 4.1: Unit Test `ReturnProcessModal.tsx` Multi-Photo Invariants**
  - File: `src/components/views/InventoryView/returnProcessModal.test.ts`
  - Assert hidden file input with `multiple` and `accept="image/*"` exists.
  - Assert raw URL input and placeholder are eliminated.
  - Assert thumbnail rendering and photo removal functions exist.
- [x] **Task 4.2: Verify Modal Tests**
  - Run: `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/returnProcessModal.test.ts`
- [x] **Task 4.3: Drift Check**
  - Run `npm run drift:check` (must pass with 132/132 pairs).
- [x] **Task 4.4: Full Test Suite**
  - Run `npm test` (all tests passing with 0 failures).
- [x] **Task 4.5: Build Check**
  - Run `npm run build:check` (0 TypeScript / Next.js errors).
- [x] **Task 4.6: Update SESSION_STATE.md**




