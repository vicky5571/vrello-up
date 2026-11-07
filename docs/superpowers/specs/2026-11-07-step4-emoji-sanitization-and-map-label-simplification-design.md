# Spec: Step 4 Location Verification Emoji Sanitization and Map Label Simplification Design

- **Status:** Approved
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0081-step4-emoji-sanitization-and-map-label-simplification.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-step4-emoji-sanitization-and-map-label-simplification.md`

---

## 1. Executive Summary

In Step 4 (`Step4LocationVerification.tsx` and `LocationPicker.tsx`) of the POSM Placement creation wizard, operators verify physical installation coordinates against outlet geofencing rules.

Currently, Step 4 exhibits visual degradation and ergonomic friction due to:
1. **Raw Unicode Emojis**: 6 emojis (`👆`, `🔒`, `ℹ️`, `⚠️`, `📍`, `🗺️`) render inconsistently across mobile device operating systems and clash with the platform's Lucide SVG icon design system.
2. **Verbose Developer Jargon**: The map toggle button displays `"Tutup Peta Interaktif (Mode Hemat RAM/Data)"` when opened and `"🗺️ Sesuaikan Titik di Peta (Preview Radius 100m)"` when closed. The parenthetical notes clutter the UI and cause awkward multi-line text wrapping on narrow mobile screens (360px–390px).

This specification establishes a clean, enterprise-grade presentation:
- Replace all raw Unicode emojis with matching Lucide SVG icons.
- Simplify map toggle labels:
  - When opened: `"Tutup Peta Interaktif"`
  - When closed: `"Sesuaikan Titik di Peta"` (or `"Buka Peta Pinpoint (Opsional)"` when unconfigured)

---

## 2. Component Design & String Mappings

### 2.1 File: `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx`

#### A. Mobile Scroll Guard Overlay (Line 67)
```tsx
// BEFORE:
<span>👆 Ketuk untuk geser pin peta</span>

// AFTER:
<MousePointerClick className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
<span>Ketuk untuk geser pin peta</span>
```

#### B. Mobile Scroll Lock Button (Line 79)
```tsx
// BEFORE:
<span>🔒 Kunci Scroll Modal</span>

// AFTER:
<Lock className="w-3 h-3 text-slate-700 dark:text-slate-300" />
<span>Kunci Scroll Modal</span>
```

#### Lucide Imports Required:
- Import `MousePointerClick`, `Lock` from `lucide-react`.

---

### 2.2 File: `src/components/views/PlacementsView/LocationPicker.tsx`

#### A. Status Badge Emojis (Lines 468, 488, 495)
1. **No Outlet Coordinates (Line 468)**:
```tsx
// BEFORE:
<span className="...">
  ℹ️ Koordinat outlet belum terdaftar
</span>

// AFTER:
<span className="inline-flex items-center gap-1.5 ...">
  <Info className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
  <span>Koordinat outlet belum terdaftar</span>
</span>
```

2. **Geofence Deviation (Line 488)**:
```tsx
// BEFORE:
<span className="...">
  ⚠️ Melebihi radius 100m ({dev}m)
</span>

// AFTER:
<span className="inline-flex items-center gap-1.5 ...">
  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
  <span>Melebihi radius 100m ({dev}m)</span>
</span>
```

3. **Pending GPS (Line 495)**:
```tsx
// BEFORE:
<span className="...">
  📍 Menunggu titik GPS
</span>

// AFTER:
<span className="inline-flex items-center gap-1.5 ...">
  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
  <span>Menunggu titik GPS</span>
</span>
```

#### B. Map Toggle Button Labels & Emojis (Lines 563–569)
```tsx
// BEFORE:
<span>
  {showInteractiveMap
    ? "Tutup Peta Interaktif (Mode Hemat RAM/Data)"
    : hasCoords || hasOutletCoords
      ? "🗺️ Sesuaikan Titik di Peta (Preview Radius 100m)"
      : "🗺️ Buka Peta Pinpoint (Opsional)"}
</span>

// AFTER:
<span>
  {showInteractiveMap
    ? "Tutup Peta Interaktif"
    : hasCoords || hasOutletCoords
      ? "Sesuaikan Titik di Peta"
      : "Buka Peta Pinpoint (Opsional)"}
</span>
```
*(Note: The toggle button already renders `<Map className="w-3.5 h-3.5 shrink-0" />` immediately before this span, so the removed `🗺️` emoji was completely redundant.)*

#### Lucide Imports Required:
- Ensure `Info`, `AlertTriangle` (or `AlertCircle`), `MapPin` are imported from `lucide-react`.

---

## 3. Data Contracts & Invariants

1. **Pure Presentation Refactor**: Zero modifications to state, event handlers, props, coordinates math, or store connections.
2. **Single-Line Button Invariant**: On 360px viewports (Samsung Galaxy A55), the simplified button label `"Sesuaikan Titik di Peta"` stays on a single line without wrapping.
3. **Coordinator Budgets**:
   - `Step4LocationVerification.tsx` remains $\le 150$ LOC (currently 127 LOC).
   - `LocationPicker.tsx` remains within safe limits.

---

## 4. Acceptance Criteria

- [ ] `Step4LocationVerification.tsx` contains ZERO raw Unicode emojis.
- [ ] `LocationPicker.tsx` contains ZERO raw Unicode emojis.
- [ ] String `(Mode Hemat RAM/Data)` does NOT appear anywhere in the codebase.
- [ ] String `(Preview Radius 100m)` does NOT appear anywhere in the codebase.
- [ ] Map toggle button renders `"Tutup Peta Interaktif"` when `showInteractiveMap` is true.
- [ ] Map toggle button renders `"Sesuaikan Titik di Peta"` when `showInteractiveMap` is false and coordinates exist.
- [ ] Map toggle button renders `"Buka Peta Pinpoint (Opsional)"` when `showInteractiveMap` is false and no coordinates exist.
- [ ] Geofence badges render standard Lucide SVG icons (`Info`, `AlertTriangle`, `MapPin`).
- [ ] Mobile scroll guard overlay renders `<MousePointerClick />` and `<Lock />` icons.
- [ ] Automated TDD test suite `src/components/views/PlacementsView/step4EmojiSanitization.test.ts` passes with 100% assertions.
- [ ] `npm run drift:check` passes with zero drift (108/108 spec-plan pairs).
- [ ] `npm run build:check`, `npm run test:smoke`, and `npm test` pass with 0 errors.

---

## 5. Non-Goals

- Modifying geofencing radius calculations or distance tolerance rules.
- Modifying Leaflet map tiles, markers, or layer rendering.

