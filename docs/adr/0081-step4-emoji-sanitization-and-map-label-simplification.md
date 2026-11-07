# ADR-0081: Step 4 Location Verification Emoji Sanitization and Map Label Simplification

- **Status:** Accepted
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Marcom Field Operations, Design System Invariants

---

## Context & Business Problem

Step 4 (`Step4LocationVerification.tsx` and `LocationPicker.tsx`) in the POSM Placement creation wizard serves as the final checkpoint for validating physical GPS coordinates against outlet geofencing thresholds (100-meter radius tolerance).

An audit of the Step 4 UI revealed multiple visual inconsistencies, platform-dependent glyph issues, and developer-centric wording:
1. **Raw Unicode Emojis**:
   Step 4 components contain 6 raw Unicode emojis:
   - `👆 Ketuk untuk geser pin peta` (scroll guard overlay in `Step4LocationVerification.tsx`)
   - `🔒 Kunci Scroll Modal` (scroll lock toggle button in `Step4LocationVerification.tsx`)
   - `ℹ️ Koordinat outlet belum terdaftar` (status pill in `LocationPicker.tsx`)
   - `⚠️ Melebihi radius 100m ({dev}m)` (geofence deviation status pill in `LocationPicker.tsx`)
   - `📍 Menunggu titik GPS` (unassigned coordinate status pill in `LocationPicker.tsx`)
   - `🗺️ Sesuaikan Titik di Peta...` and `🗺️ Buka Peta Pinpoint...` (map toggle button in `LocationPicker.tsx`)
   These raw emojis render inconsistently across operating systems (iOS, Android, Windows, macOS), clash with the project's standard Lucide SVG iconography, and degrade the enterprise aesthetic.
2. **Redundant & Jargon-Laden Labels**:
   - The map toggle button when opened displays `"Tutup Peta Interaktif (Mode Hemat RAM/Data)"`. The parenthetical phrase `(Mode Hemat RAM/Data)` represents internal engineering rationale that clutters the UI and provides no actionable value to field marketing personnel.
   - The map toggle button when closed displays `"🗺️ Sesuaikan Titik di Peta (Preview Radius 100m)"`. The parenthetical phrase `(Preview Radius 100m)` causes unwanted multi-line text wrapping on narrow mobile screens (360px–390px). Furthermore, the 100m tolerance is already clearly displayed in the geofence status alert directly above the map.

---

## Options Considered

### Option 1: Complete Emoji Sanitization with Lucide SVG Icons & Simplified Map Toggle Labels (Accepted)
- Replace all 6 raw emojis in Step 4 with appropriate Lucide SVG icons:
  - `👆` -> `<MousePointerClick className="w-3.5 h-3.5" />`
  - `🔒` -> `<Lock className="w-3 h-3" />`
  - `ℹ️` -> `<Info className="w-3 h-3" />`
  - `⚠️` -> `<AlertTriangle className="w-3 h-3" />`
  - `📍` -> `<MapPin className="w-3 h-3" />`
  - `🗺️` -> Purged completely (button already has `<Map className="w-3.5 h-3.5" />` preceding the text).
- Simplify map toggle labels:
  - When map is open: `"Tutup Peta Interaktif"` (purging `(Mode Hemat RAM/Data)`).
  - When map is closed: `"Sesuaikan Titik di Peta"` (purging `(Preview Radius 100m)`) or `"Buka Peta Pinpoint (Opsional)"`.
- *Pros*: Completely aligns Step 4 with corporate design tokens; preserves visual consistency across all mobile devices; eliminates awkward line wrapping on small viewports; purges developer jargon.
- *Cons*: Minor icon import adjustments in 2 component files.

### Option 2: Remove Parenthetical Text Only Without Touching Emojis
- Keep raw emojis and only strip `(Mode Hemat RAM/Data)` and `(Preview Radius 100m)`.
- *Rejected*: Violates the user's explicit directive ("delete emoji from step 4") and leaves fragmented emoji rendering across platforms.

### Option 3: Always Expand Leaflet Map (Eliminate Toggle Button)
- Remove the toggle button and leave Leaflet open continuously.
- *Rejected*: Severely degrades performance on low-end Android field devices, drains battery, and introduces touch scroll hijacking.

---

## Trade-Off Matrix

| Dimension | Option 1 (Full Sanitization - Accepted) | Option 2 (Text Only) | Option 3 (Always Open) |
| :--- | :--- | :--- | :--- |
| **Cross-Platform Visual Fidelity** | **100% Consistent (Lucide SVG)** | Degraded (OS emoji fonts) | Degraded |
| **Mobile Screen Real Estate** | **Optimized (Single-line actions)** | Moderate | Poor (Heavy scroll trap) |
| **Operator Clarity & Tone** | **Professional enterprise** | Cluttered with jargon | Moderate |
| **Device Performance & RAM** | **Preserved (Lazy on-demand)** | Preserved | Heavy (Always rendered) |

---

## Decision

We accept **Option 1**:
1. Purge all raw emojis from `Step4LocationVerification.tsx` and `LocationPicker.tsx`, substituting them with standard Lucide SVG icons.
2. In `LocationPicker.tsx`, update the map toggle button label:
   - When opened: render `"Tutup Peta Interaktif"`.
   - When closed: render `"Sesuaikan Titik di Peta"` (or `"Buka Peta Pinpoint (Opsional)"` when no coordinates are set).

---

## Consequences

### Positive Consequences
- **Enterprise Design Consistency**: Step 4 visual components adhere strictly to the design system established in Steps 1, 2, and 3.
- **Improved Mobile Ergonomics**: Shorter, clean button labels fit comfortably on narrow screens without wrapping or layout shifts.
- **Zero Invariant Drift**: Preserves geofencing algorithms, coordinates validation, and location notes persistence without logic alterations.

### Negative Consequences / Accepted Technical Debt
- None identified.

---

## References
- Spec: `docs/superpowers/specs/2026-11-07-step4-emoji-sanitization-and-map-label-simplification-design.md`
- Plan: `docs/superpowers/plans/2026-11-07-step4-emoji-sanitization-and-map-label-simplification.md`
- Target Components:
  - `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx`
  - `src/components/views/PlacementsView/LocationPicker.tsx`

