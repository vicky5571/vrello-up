# ADR-0079: Step 3 Direct Physical Photo Upload Enforcement and Tautan URL Removal

- **Status:** Accepted
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Marcom Field Operations & Audit Invariants

---

## Context & Business Problem

In the POSM Placement creation and editing wizard (`PlacementFormModal.tsx`), Step 3 (`Step3PhotoNotes.tsx`) requires field documentation photos as mandatory proof of physical installation before an execution can be transitioned to `DONE` status.

The photo uploader component (`PlacementPhotoUploader.tsx`) provides two primary physical file upload action buttons:
1. `Ambil Foto (Kamera)` with `capture="environment"` for immediate real-time mobile device camera capture.
2. `Pilih dari Galeri` with `image/*` file picker for selecting locally captured photos.

Both file upload flows automatically compress raw images client-side (`compressImage`) to optimize cellular data transmission and store them durably via `/api/marcom/uploads` into centralized cloud storage (Supabase Storage bucket).

However, in the uploader label row alongside `"Foto Bukti Pemasangan"`, there exists a legacy toggle button:
```tsx
<button onClick={() => setShowManualUrl(prev => !prev)}>
  <LinkIcon />
  <span>Tautan URL</span>
  <ChevronDown />
</button>
```
When clicked, this expands an inline text input container (`showManualUrl`) prompting the user to *"Tempel tautan gambar https://..."* with a manual `"Tambah"` action button (`handleAddManualUrl`).

### The Operational & Architectural Cost:
1. **Broken Data Integrity & Audit Bypasses**: Marcom field audits mandate authentic photographic evidence of installed POSM materials at retail partner outlets. Manually pasted web URLs bypass client compression and storage pipelines, introduce security and hotlinking risks (CORS/referrer blocks), and frequently decay into 404 broken images when external image hosts expire.
2. **Mobile UX Clutter & Misclicks**: On small viewport mobile screens, the `"Tautan URL"` toggle occupies critical horizontal space adjacent to the section title, creating visual ambiguity ("Should I upload a file or paste a web link?") and triggering unintended touch activations.
3. **Dead Legacy Code Overhead**: In field operations, officers never type or copy/paste image URLs. Maintaining the collapsible input container, local state variables, and event handlers represents ~40 LOC of dead technical debt that complicates component maintenance.

---

## Options Considered

### Option 1: Total Removal of Manual URL Input Across All Viewports (Accepted)
- Completely remove the `"Tautan URL"` trigger button from the header row.
- Completely remove the collapsible manual URL input container, input field, and `"Tambah"` button.
- Eliminate component state `showManualUrl`, `manualUrlInput`, and handler `handleAddManualUrl`.
- Purge unused Lucide icon imports (`Link as LinkIcon`, `ChevronDown`, `ChevronUp`, `Plus`).
- Enforce that all new photo attachments originate strictly from authentic file uploads (`Ambil Foto (Kamera)` or `Pilih dari Galeri`).
- Existing photo attachments stored in the database remain 100% visible and inspectable via the existing thumbnail grid and lightbox modal.

### Option 2: Hide Manual URL Input Under Advanced/Debug Accordion
- Hide the URL input field behind a collapsible "Pengaturan Lanjutan" or debug flag.
- *Rejected*: Violates YAGNI and the user's explicit directive to remove the feature across all viewports. Retains dead UI code and perpetuates uncompressed external URL security vulnerabilities.

### Option 3: Replace with Google Drive Cloud File Picker
- Replace the manual URL input with a picker interface to select photos directly from Google Drive.
- *Rejected*: Gross over-engineering. Field documentation occurs on-site from mobile device cameras. The existing upload pipeline already forwards uploaded photos to cloud storage seamlessly.

---

## Trade-Off Matrix

| Metric | Option 1 (Total Removal - Accepted) | Option 2 (Debug Accordion) | Option 3 (Drive Picker) |
| :--- | :--- | :--- | :--- |
| **Audit Authenticity & Anti-Fraud** | **High (100% authentic physical uploads)** | Low (Arbitrary external URLs still possible) | Medium (Existing files in Drive) |
| **Mobile UX Simplicity & Headroom** | **Maximum (Clean header, zero clutter)** | Low (Additional accordion complexity) | Low (Modal-in-modal picker overhead) |
| **Code Maintainability & LOC** | **Eliminates ~40 LOC dead code** | Adds conditional logic (+15 LOC) | Adds major client dependencies (+150 LOC) |
| **Hotlink / Broken Image Prevention**| **100% prevented** | Not prevented | 100% prevented |
| **Viewport Consistency** | **Identical on Mobile and Desktop** | Fragmented | Fragmented |

---

## Decision

We accept **Option 1**: Completely remove the `"Tautan URL"` trigger button, collapsible input row, state, and handlers from `src/components/views/PlacementsView/PlacementPhotoUploader.tsx` across all viewports.

The header row of `PlacementPhotoUploader` will exclusively display the section label `"Foto Bukti Pemasangan"` on the left and the optional count badge `"{N} Foto Terlampir"` on the right.

---

## Consequences

### Positive Consequences
- **Authentic Audit Trail**: Enforces direct physical photo uploads via camera or local gallery, guaranteeing client-side compression and durable centralized cloud storage.
- **Clean Responsive Layout**: The header row in Step 3 is uncluttered, eliminating mobile misclick risks and preventing visual confusion for field officers.
- **Codebase Cleanliness**: Removes unused state, handlers, and icon imports, reducing component LOC and cognitive overhead.
- **Zero Invariant Drift**: Preserves existing `MarcomPlacement.photoUrl` data schema, `parsePlacementPhotos`, `serializePlacementPhotos`, thumbnail preview grid, and lightbox modal behavior.

### Negative Consequences / Accepted Technical Debt
- Developers and automated test suites cannot paste arbitrary raw image URLs directly in the wizard UI without providing a mock File/Blob via the file input element. This is an intentional constraint to maintain production data integrity.

---

## References
- Spec: `docs/superpowers/specs/2026-11-07-step3-tautan-url-removal-design.md`
- Plan: `docs/superpowers/plans/2026-11-07-step3-tautan-url-removal.md`
- Target Component: `src/components/views/PlacementsView/PlacementPhotoUploader.tsx`

