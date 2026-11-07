# Handover: Step 4 Location Verification Emoji Sanitization and Map Label Simplification

- **Status:** Execution-Ready
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0081-step4-emoji-sanitization-and-map-label-simplification.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-step4-emoji-sanitization-and-map-label-simplification-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-step4-emoji-sanitization-and-map-label-simplification.md`

---

## 1. Target Files & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx` | Purge raw emojis (`👆`, `🔒`) from scroll guard and lock button; import `MousePointerClick`, `Lock` |
| `src/components/views/PlacementsView/LocationPicker.tsx` | Purge status badge emojis (`ℹ️`, `⚠️`, `📍`, `🗺️`) and simplify map toggle text |
| `src/components/views/PlacementsView/step4EmojiSanitization.test.ts` | Dedicated unit test suite verifying zero raw emojis and absence of developer parentheticals |

---

## 2. Exact Current Code Snippets & Modifications

### In `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx`:

#### A. Lucide Imports (Lines 6)
**Current:**
```tsx
import { MapPin, CheckCircle2, AlertTriangle, ShieldCheck, Store, Layers } from "lucide-react";
```
**Change:**
Add `MousePointerClick` and `Lock`:
```tsx
import { MapPin, CheckCircle2, AlertTriangle, ShieldCheck, Store, Layers, MousePointerClick, Lock } from "lucide-react";
```

#### B. Scroll Guard Overlay (Lines 66–68)
**Current:**
```tsx
            <div className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[11px] font-bold shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <span>👆 Ketuk untuk geser pin peta</span>
            </div>
```
**Change:**
```tsx
            <div className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[11px] font-bold shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
              <span>Ketuk untuk geser pin peta</span>
            </div>
```

#### C. Scroll Lock Button (Lines 77–80)
**Current:**
```tsx
              className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-[10px] font-bold shadow-xs border border-slate-200 dark:border-slate-700 backdrop-blur-xs flex items-center gap-1 cursor-pointer"
            >
              <span>🔒 Kunci Scroll Modal</span>
            </button>
```
**Change:**
```tsx
              className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-[10px] font-bold shadow-xs border border-slate-200 dark:border-slate-700 backdrop-blur-xs flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-slate-700 dark:text-slate-300" />
              <span>Kunci Scroll Modal</span>
            </button>
```

---

### In `src/components/views/PlacementsView/LocationPicker.tsx`:

#### D. Lucide Imports (Lines 5–18)
Ensure `Info` and `AlertTriangle` are imported from `lucide-react`.

#### E. Geofence Status Badges (Lines 464–498)
**Current:**
```tsx
        {/* Geofence Status Badge */}
        {(() => {
          if (!hasOutletCoords) {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 rounded-full">
                ℹ️ Koordinat outlet belum terdaftar
              </span>
            );
          }

          if (hasCoords) {
            const geo = evaluateGeofenceStatus(outletCoordinates, {
              latitude: latitude as number,
              longitude: longitude as number,
            });
            const dev = geo.deviationMeters ?? 0;
            if (geo.isValid) {
              return (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                  ✓ Di Lokasi ({dev}m)
                </span>
              );
            }
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                ⚠️ Melebihi radius 100m ({dev}m)
              </span>
            );
          }

          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
              📍 Menunggu titik GPS
            </span>
          );
        })()}
```
**Change:**
```tsx
        {/* Geofence Status Badge */}
        {(() => {
          if (!hasOutletCoords) {
            return (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 rounded-full">
                <Info className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Koordinat outlet belum terdaftar</span>
              </span>
            );
          }

          if (hasCoords) {
            const geo = evaluateGeofenceStatus(outletCoordinates, {
              latitude: latitude as number,
              longitude: longitude as number,
            });
            const dev = geo.deviationMeters ?? 0;
            if (geo.isValid) {
              return (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Di Lokasi ({dev}m)</span>
                </span>
              );
            }
            return (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Melebihi radius 100m ({dev}m)</span>
              </span>
            );
          }

          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Menunggu titik GPS</span>
            </span>
          );
        })()}
```

#### F. Map Toggle Button Labels (Lines 563–570)
**Current:**
```tsx
          <span>
            {showInteractiveMap
              ? "Tutup Peta Interaktif (Mode Hemat RAM/Data)"
              : hasCoords || hasOutletCoords
                ? "🗺️ Sesuaikan Titik di Peta (Preview Radius 100m)"
                : "🗺️ Buka Peta Pinpoint (Opsional)"}
          </span>
```
**Change:**
```tsx
          <span>
            {showInteractiveMap
              ? "Tutup Peta Interaktif"
              : hasCoords || hasOutletCoords
                ? "Sesuaikan Titik di Peta"
                : "Buka Peta Pinpoint (Opsional)"}
          </span>
```

---

## 3. Explicit "Do Not Touch" List

1. **Leaflet map instantiation & lifecycle (`useEffect` in `LocationPicker.tsx`)**: Must NOT be modified.
2. **Device GPS geolocation handler (`handleGetDeviceLocation`)**: Must NOT be modified.
3. **Geofence evaluation math (`evaluateGeofenceStatus` in `locationUtils.ts`)**: Must NOT be modified.
4. **Google Maps URL builder (`buildGoogleMapsUrl`)**: Must NOT be modified.

---

## 4. Numbered Execution Order

1. **Step 1**: Write test suite `src/components/views/PlacementsView/step4EmojiSanitization.test.ts`. Run to verify RED failure.
2. **Step 2**: Apply changes A through C to `Step4LocationVerification.tsx`.
3. **Step 3**: Apply changes D through F to `LocationPicker.tsx`.
4. **Step 4**: Run unit test suite to verify GREEN.
5. **Step 5**: Run `npm run build:check` (0 errors).
6. **Step 6**: Run `npm run drift:check` (108/108 pairs, 0 drift).
7. **Step 7**: Run `npm run test:smoke` and full `npm test`.
8. **Step 8**: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
9. **Step 9**: Commit git changes.

---

## 5. Acceptance Criteria Checklist

- [ ] Zero raw Unicode emojis in `Step4LocationVerification.tsx`.
- [ ] Zero raw Unicode emojis in `LocationPicker.tsx`.
- [ ] String `(Mode Hemat RAM/Data)` completely deleted.
- [ ] String `(Preview Radius 100m)` completely deleted.
- [ ] Map toggle button renders clean, single-line text: `"Tutup Peta Interaktif"`, `"Sesuaikan Titik di Peta"`, `"Buka Peta Pinpoint (Opsional)"`.
- [ ] All verification commands (`drift:check`, `build:check`, `test:smoke`, `npm test`) pass with 0 errors.

