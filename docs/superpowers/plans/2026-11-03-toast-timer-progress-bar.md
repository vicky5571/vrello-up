# Plan — Toast Notifications Timer Progress Bar

**Status:** Complete  
**Date:** 2026-11-03  
**Estimated time:** 5 minutes  
**Risk:** None — pure CSS enhancement on Sonner toast container

---

## Objective

Add a thin, smooth countdown timer progress bar at the bottom of active toast notifications so users have clear visual feedback on how long until the toast auto-dismisses.

---

## Design Specifications

1. **Appearance:**
   - Position: Placed at the very bottom edge of each active toast (`position: absolute; bottom: 0; left: 0`).
   - Thickness: Thin line (`height: 2px`).
   - Color: Uses `currentColor` with `opacity: 0.45` so it automatically inherits the semantic color of the toast in `richColors` mode (green for success, red for error, blue for info, amber for warning, text-color for default).
   - Corner Radius: Inherits bottom corner radii (`border-bottom-left-radius: inherit; border-bottom-right-radius: inherit`).

2. **Animation Behavior:**
   - Shrinks from right to left (`transform-origin: left; transform: scaleX(1) → scaleX(0)`).
   - Duration: Exactly matches Sonner's auto-dismiss timer (4000ms).
   - Easing: Linear countdown (`linear`).
   - Pause on Hover: When user hovers over the toast, the animation pauses (`animation-play-state: paused`), matching Sonner's auto-dismiss timer pause behavior.

3. **Exclusions:**
   - Not shown on loading/in-progress toasts (`:not([data-type='loading']):not([data-type='promise'])`). When a loading toast completes and transforms into a success/error toast, the bar starts cleanly.
   - Disabled when user prefers reduced motion (`@media (prefers-reduced-motion: reduce)`).

---

## File Changes

### 1. `src/app/layout.tsx`
Explicitly set `duration={4000}` on `<Toaster />` to guarantee exact synchronization between Sonner's timer and the CSS animation duration:
```tsx
<Toaster richColors position="top-right" duration={4000} />
```

### 2. `src/app/globals.css`
Add the timer bar styles at the end of `globals.css`:
```css
/* Sonner Toast: Thin countdown timer bar at bottom */
[data-sonner-toast]:not([data-type='loading']):not([data-type='promise']):not([data-removed='true'])::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: currentColor;
  opacity: 0.45;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  transform-origin: left;
  animation: sonner-timer-bar 4000ms linear forwards;
  pointer-events: none;
}

[data-sonner-toast]:hover::after {
  animation-play-state: paused;
}

@keyframes sonner-timer-bar {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-sonner-toast]::after {
    display: none !important;
  }
}
```

---

## Execution Checklist

```
[x] 1. Edit src/app/layout.tsx: add duration={4000} to <Toaster />
[x] 2. Edit src/app/globals.css: add toast timer bar styles & animation
[x] 3. Run npm run build:check → 0 TypeScript errors
[x] 4. Run npm run drift:check → All invariants pass
[x] 5. Run npm run test:smoke  → 101 tests pass
[x] 6. Run npm test            → 742 tests pass
```
