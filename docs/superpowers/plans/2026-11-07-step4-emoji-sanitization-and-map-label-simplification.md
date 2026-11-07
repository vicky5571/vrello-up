# Plan: Step 4 Location Verification Emoji Sanitization and Map Label Simplification

- **Status:** Completed
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0081-step4-emoji-sanitization-and-map-label-simplification.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-step4-emoji-sanitization-and-map-label-simplification-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/PlacementsView/step4EmojiSanitization.test.ts` | Create | Unit test suite asserting 0 raw emojis & absence of developer parenthetical text | +75 LOC |
| `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx` | Modify | Replace raw emojis (`👆`, `🔒`) with Lucide icons (`MousePointerClick`, `Lock`) | +6 LOC / -3 LOC |
| `src/components/views/PlacementsView/LocationPicker.tsx` | Modify | Replace badge emojis (`ℹ️`, `⚠️`, `📍`, `🗺️`) and simplify map toggle text | +15 LOC / -10 LOC |
| `docs/handover-step4-emoji-sanitization-and-map-label-simplification.md` | Create | Execution-ready handover guide with exact code diffs and non-touch boundaries | +85 LOC |
| `docs/SESSION_STATE.md` | Modify | Track active feature planning completion | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness & Baseline Verification (TDD First)
- [x] Create `src/components/views/PlacementsView/step4EmojiSanitization.test.ts`:
  - [x] Test 1: Assert `Step4LocationVerification.tsx` contains 0 raw Unicode emojis.
  - [x] Test 2: Assert `LocationPicker.tsx` contains 0 raw Unicode emojis.
  - [x] Test 3: Assert string `(Mode Hemat RAM/Data)` does not exist in any Step 4 file.
  - [x] Test 4: Assert string `(Preview Radius 100m)` does not exist in any Step 4 file.
  - [x] Test 5: Assert map toggle button renders simplified labels (`"Tutup Peta Interaktif"`, `"Sesuaikan Titik di Peta"`, `"Buka Peta Pinpoint (Opsional)"`).
  - [x] Test 6: Assert Lucide SVG icons are rendered for mobile scroll guard and geofence badges.
- [x] Run test suite: `node --import tsx --test src/components/views/PlacementsView/step4EmojiSanitization.test.ts` (verify RED baseline failure).

### Phase 2: Refactor `Step4LocationVerification.tsx`
- [x] Import `MousePointerClick`, `Lock` from `lucide-react`.
- [x] Replace `<span>👆 Ketuk untuk geser pin peta</span>` with:
  ```tsx
  <MousePointerClick className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
  <span>Ketuk untuk geser pin peta</span>
  ```
- [x] Replace `<span>🔒 Kunci Scroll Modal</span>` with:
  ```tsx
  <Lock className="w-3 h-3 text-slate-700 dark:text-slate-300" />
  <span>Kunci Scroll Modal</span>
  ```
- [x] Verify file limit remains $\le 150$ LOC (currently 127 LOC).

### Phase 3: Refactor `LocationPicker.tsx`
- [x] Ensure `Info`, `AlertTriangle`, `MapPin` are imported from `lucide-react`.
- [x] In geofence status badges:
  - Replace `ℹ️ Koordinat outlet belum terdaftar` with `<Info className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" /> <span>Koordinat outlet belum terdaftar</span>`.
  - Replace `⚠️ Melebihi radius 100m ({dev}m)` with `<AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" /> <span>Melebihi radius 100m ({dev}m)</span>`.
  - Replace `📍 Menunggu titik GPS` with `<MapPin className="w-3 h-3 text-slate-500 shrink-0" /> <span>Menunggu titik GPS</span>`.
- [x] In map toggle button:
  - When `showInteractiveMap` is true: render `"Tutup Peta Interaktif"`.
  - When `showInteractiveMap` is false: render `"Sesuaikan Titik di Peta"` (or `"Buka Peta Pinpoint (Opsional)"` when no coordinates).
  - Purge `🗺️` emoji.
- [x] Verify file compiles cleanly.

### Phase 4: Full Invariant Verification & Session Handoff
- [x] Run targeted test suite:
  ```bash
  node --import tsx --test src/components/views/PlacementsView/step4EmojiSanitization.test.ts
  ```
  Ensure all tests pass (GREEN).
- [x] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 108/108 paired specs pass.
- [x] Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Ensure 0 errors.
- [x] Run smoke suite:
  ```bash
  npm run test:smoke
  ```
- [x] Run full test suite:
  ```bash
  npm test
  ```
- [x] Update `CHANGELOG.md` with ADR-0081 entry.
- [x] Update `docs/SESSION_STATE.md`.
- [x] Git commit planning artifacts.

