# ADR-0105: Multi-Photo Direct Upload for Inventory Damage Inspection

- **Date:** 2026-11-11
- **Status:** APPROVED
- **Author:** Senior Software Engineer & Principal Systems Architect
- **Context:** Return inspection photo capture in equipment inventory borrowing lifecycle.

---

## 1. Context & Problem Statement

In the equipment borrowing subsystem (`/api/marcom/inventory/borrow/[id]/return`), when an officer returns equipment and records afkir units (e.g. `majorDamageUnits > 0` or `lostUnits > 0`), the return modal ([`ReturnProcessModal.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/InventoryView/ReturnProcessModal.tsx)) displays the Afkir Stok card with a "Bukti Foto Kerusakan" section.

However, the existing UI had two critical operational and technical flaws:
1. **Silent Failure on Empty Input:** The "+ Tambah" button only executed `handleAddPhoto()`, which checked `photoInputUrl.trim()`. Because the user had not typed or pasted a URL (the input only displayed a placeholder), clicking "+ Tambah" did absolutely nothing—leaving the user with zero feedback and no visible state change.
2. **Operational Disconnect (URL vs Physical File Upload):** Field staff and warehouse officers inspecting physically damaged assets hold camera snapshots or image files on their local mobile or desktop devices. Expecting officers to independently host their photos on third-party servers and paste public `https://...` URLs creates severe operational friction. Furthermore, officers frequently need to capture multiple photos from different angles (e.g. broken casing, cracked lens, missing accessories) in a single return inspection transaction.

---

## 2. Options Considered

### Option 1: Direct Multi-Photo File Upload via Storage API
Introduce a native file picker `<input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" />` triggered by a prominent "+ Unggah Foto Bukti" button. Selected files are compressed client-side (via `compressImage` to max 1600x1600 at 0.82 quality) and uploaded to the internal backend (`/api/marcom/uploads` with `kind: "inventory-damage"`), returning persistent storage URLs appended to `damagePhotos[]`.
- **Pros:** Directly matches real-world operational workflow; supports batch selection of multiple images; consistent with Placements, Outlets, and Settlement modules; bandwidth-friendly due to client-side compression.
- **Cons:** Requires extending `VALID_KINDS` in `/api/marcom/uploads/route.ts` to authorize inventory damage uploads.
- **Risk:** Network timeouts on slow mobile connections when uploading very large uncompressed image batches (mitigated by sequential batch upload with loading toast/spinner).

### Option 2: Dual Mode (Direct Multi-Photo Upload + Optional External URL Input) (Recommended)
Provide direct multi-file upload alongside a secondary input field for external URLs (for photos stored on Google Drive or corporate cloud storage). If the URL input is empty when "+ Tambah" is clicked, display an informative toast error (`"Silakan pilih file foto atau masukkan tautan URL terlebih dahulu"`).
- **Pros:** Maximum flexibility for both on-premise inspection photos and pre-uploaded drive links; supports multiple files simultaneously.
- **Cons:** Slightly busier modal UI within the already detailed Afkir Stok card.

### Option 3: Minimal Text URL Validation
Keep only the string URL input and add an error toast when clicking "+ Tambah" with an empty field.
- **Pros:** Zero backend changes, negligible code change.
- **Cons:** Rejects the fundamental business reality that field officers take photos on phones and cannot paste public URLs. Fails to support multi-file selection.

---

## 3. Decision

We choose **Option 1: Pure Direct Multi-Photo File Upload (Eliminating External URL Input)**:
1. Completely eliminate the text URL input and placeholder to avoid confusion and silent failures.
2. Provide a native file picker `<input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" />` triggered by a prominent button `+ Unggah Foto Kerusakan`.
3. Support batch selection of multiple images simultaneously as well as successive additions.
4. Each selected photo is compressed client-side (via `compressImage` to max 1600x1600 at 0.82 quality) and uploaded to `/api/marcom/uploads` under `kind: "inventory-damage"` (authorized with `PROCESS_RETURN`).
5. Uploaded photos are displayed in a responsive thumbnail deck with individual deletion buttons (`handleRemovePhoto(index)`).

---

## 4. Consequences & Trade-offs

### Positive Consequences
- **Zero Silent Failures:** Clicking "+ Tambah" or the upload button always yields immediate feedback (file selection dialog or validation toast).
- **Multiple Photo Support:** Officers can select multiple photos simultaneously or add photos in successive batches without wiping previously selected photos.
- **Client-Side Compression:** Images taken with modern 50MP smartphones are downsampled to max 1600x1600 before upload, minimizing bandwidth and storage overhead.
- **Data Integrity:** `damagePhotos` continues to be stored as `String[]` in PostgreSQL, maintaining 100% backward compatibility with existing return records.

### Accepted Technical Debt & Mitigations
- In isolated test environments where Supabase Storage credentials are not configured, `/api/marcom/uploads` falls back to simulated/mock responses or tests continue to pass raw URLs directly into the return endpoint payload.



