# ADR-0073: Mobile Field Event Media Section Upload Action Layout & Header Stabilization

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). In `EventCreateModal.tsx`, field marketing teams configure brand activations and attach digital assets (event roadshow banners, venue stage photos, teaser clips, raw Drive folders) using `EventMediaSection.tsx`.

On mobile viewports (< 640px, e.g. 360px - 390px smartphone displays), the media section displays significant lateral text cramping and awkward wrapping in the section header:
1. **Header Crowding Collision:** The header contains both the section title (`Media & Dokumentasi Event`) and the upload button (`Upload dari Perangkat`) in a single flex row (`flex items-center justify-between`). In a ~320px mobile card, the available width is insufficient, forcing the title into 2 lines (`Media &` \n `Dokumentasi Event`) and the button text into 2 lines (`Upload dari` \n `Perangkat`).
2. **Ergonomic Mismatch for Touch Devices:** The button at the top right of the section header is small and positioned outside the primary thumb-reach zone. Furthermore, in the empty state, the dashed dropzone area below it also triggers the file selector, creating redundant adjacent triggers. Conversely, once files are uploaded, the dropzone disappears and only the cramped header button remains to add subsequent files.

## Options Considered

### Option A: Dedicated Full-Width Mobile Upload Button Positioned Below Media Content (Chosen)
- Hide the upload button from the section header on mobile using `hidden sm:flex`, allowing the title `Media & Dokumentasi Event` to span 100% width on a single line.
- Render a dedicated full-width action button below the media dropzone / attachment list on mobile using `w-full sm:hidden`.
- On desktop viewports ($\ge 640\text{px}$), maintain the header button with `sm:flex sm:items-center` and hide the bottom button with `sm:hidden`.
- *Trade-Offs:*
  - *Pros:* Completely eliminates header text wrapping; provides an unmistakable, high-contrast full-width touch target for field personnel on mobile; guarantees 100% desktop presentation invariance.
  - *Cons:* Minimal redundancy with the dashed dropzone during empty state on mobile, which is acceptable as it clarifies upload capability for users unfamiliar with tapping dashed boxes.

### Option B: Conditional Bottom Upload Button Only When Files Exist
- Keep the header button hidden on mobile (`hidden sm:flex`).
- Rely strictly on the dashed dropzone card during empty state.
- Render the full-width button only when `mediaAttachments.length > 0` below the thumbnail list.
- *Trade-Offs:*
  - *Pros:* Zero redundancy during empty state.
  - *Cons:* Less obvious call-to-action for field operators who may not realize the dashed border card is an interactive tap target.

## Decision

We adopt **Option A: Dedicated Full-Width Mobile Upload Button Positioned Below Media Content**.

Specifically:
1. **Header Layout Stabilization (`EventMediaSection.tsx`):**
   - Title: `flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100` spans cleanly on a single row on mobile.
   - Header Upload Button: Append `hidden sm:flex` so it renders exclusively on desktop ($\ge 640\text{px}$).
2. **Mobile Bottom Action Button (`EventMediaSection.tsx`):**
   - Insert a full-width mobile action button directly beneath the dropzone / attachment list:
     ```tsx
     <button
       type="button"
       onClick={() => fileInputRef.current?.click()}
       disabled={isUploading}
       className="w-full sm:hidden py-2.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 border border-blue-200/60 dark:border-blue-900/40 transition-colors disabled:opacity-50 cursor-pointer"
     >
       <Upload className="w-4 h-4" />
       <span>Upload dari Perangkat</span>
     </button>
     ```
3. **Desktop Invariant Preserved:**
   - Desktop layout remains 100% byte-for-byte unaffected: header button retains existing desktop classes (`sm:flex sm:items-center ...`), and the bottom button is hidden via `sm:hidden`.

## Consequences

### Positive Consequences
1. **Pristine Header Typography:** The section title `Media & Dokumentasi Event` no longer wraps into 2 lines on any mobile device.
2. **Superior Mobile Tap Ergonomics:** The full-width button provides an unobstructed 44px+ touch target for field staff uploading photos/videos.
3. **Seamless Multi-Asset Addition:** After initial files are uploaded and the dropzone collapses into thumbnails, operators have an intuitive, prominent button to add further documentation.
4. **Desktop Zero-Regression:** 100% visual parity preserved on desktop screens.
5. **No State/API Changes:** Zero changes to upload hooks, Google Drive integration, or form submission payloads.

### Negative Consequences / Accepted Technical Debt
1. None. The change is strictly a responsive layout enhancement.



