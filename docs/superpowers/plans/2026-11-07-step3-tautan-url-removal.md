# Plan: Step 3 Direct Physical Photo Upload Enforcement and Tautan URL Removal

- **Status:** In Progress
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0079-step3-tautan-url-removal.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-step3-tautan-url-removal-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts` | Create | Unit test suite asserting absence of Tautan URL & preservation of camera/gallery upload | +75 LOC |
| `src/components/views/PlacementsView/PlacementPhotoUploader.tsx` | Modify | Remove Tautan URL button, collapsible URL input box, state, handlers, and unused Lucide icons | -42 LOC |
| `docs/handover-step3-tautan-url-removal.md` | Create | Execution-ready handover guide with exact code diffs and non-touch boundaries | +90 LOC |
| `docs/SESSION_STATE.md` | Modify | Track active feature planning completion and handover instructions | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness & Baseline Verification (TDD First)
- [ ] Create `src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts`:
  - [ ] Test 1: Assert `PlacementPhotoUploader.tsx` source does not contain string `"Tautan URL"`.
  - [ ] Test 2: Assert `PlacementPhotoUploader.tsx` source does not contain `showManualUrl`, `manualUrlInput`, or `handleAddManualUrl`.
  - [ ] Test 3: Assert `PlacementPhotoUploader.tsx` source does not render collapsible input with `type="url"`.
  - [ ] Test 4: Assert camera upload button (`Ambil Foto (Kamera)`) with `capture="environment"` is preserved.
  - [ ] Test 5: Assert gallery upload button (`Pilih dari Galeri`) with `multiple` is preserved.
  - [ ] Test 6: Assert label `"Foto Bukti Pemasangan"` and dynamic count badge `"{photos.length} Foto Terlampir"` are preserved in header row.
- [ ] Run test suite: `node --import tsx --test src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts` (verify RED baseline failure).

### Phase 2: Component Refactor (`PlacementPhotoUploader.tsx`)
- [ ] Purge unused Lucide icon imports:
  - Remove `Link as LinkIcon`, `ChevronDown`, `ChevronUp`, `Plus`.
- [ ] Eliminate local manual URL states and handlers:
  - Remove `showManualUrl`, `setShowManualUrl`.
  - Remove `manualUrlInput`, `setManualUrlInput`.
  - Remove `handleAddManualUrl` function.
- [ ] Update header row layout:
  - Remove `<button onClick={() => setShowManualUrl(...) }>` element.
  - Keep `<label>` and conditional `{photos.length > 0 && <span>...</span>}` count badge.
- [ ] Eliminate collapsible URL input container:
  - Remove `{showManualUrl && ( ... )}` JSX block.

### Phase 3: Verification & Invariant Enforcement
- [ ] Run targeted test suite:
  ```bash
  node --import tsx --test src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts
  ```
  Ensure all 6 tests pass (GREEN).
- [ ] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 106/106 paired specs and architectural invariants pass.
- [ ] Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Ensure 0 compilation errors.
- [ ] Run full smoke suite:
  ```bash
  npm run test:smoke
  ```
  Ensure all smoke tests pass.
- [ ] Run full test suite:
  ```bash
  npm test
  ```
  Ensure 0 regressions.

### Phase 4: Documentation & Session Handoff
- [ ] Update `CHANGELOG.md` with entry for ADR-0079.
- [ ] Update `docs/SESSION_STATE.md` with feature status and handover reference.
- [ ] Git commit planning artifacts.

