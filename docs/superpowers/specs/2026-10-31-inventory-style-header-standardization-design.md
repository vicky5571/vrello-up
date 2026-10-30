# Design Spec: Inventory-Style Header Standardization Across Marcom Views

**Date:** 2026-10-31  
**Author:** Critical Senior Software Engineer  
**Status:** Approved  
**Affected Views:** Media Placements (`PlacementsView.tsx`), Content Planner (`ContentPlannerView.tsx`), Field Events (`EventsView.tsx`), Pipeline (`PipelineView.tsx`)

---

## 1. Executive Summary

The header on the **Equipment Inventory & Loans** page provides a unified, cohesive top zone (`border-b bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`) integrating the title row, primary actions, 4 KPI cards, and sub-navigation controls. This contrasts with the disconnected floating card-banner pattern previously on Media Placements and Content Planner.

This specification standardizes the header architecture of both **Media Placements** and **Content Planner** to mirror the **Equipment Inventory** header design language:
1. Unified top header zone with backdrop blur, subtle background tint, and border bottom divider.
2. Clean inline icon + title (unboxed, text-xl font-bold) and concise subtitle.
3. Standardized top-right action buttons (Refresh icon button, primary action button, secondary actions).
4. Direct integration of KPI summary cards within the header zone.
5. Bottom controls row (view switchers and filter pills with Framer Motion animated sliding pills).
6. Main content container below `border-b` with `p-4 sm:p-6 flex-1 min-h-0`.

---

## 2. UX & Visual Architecture

### A. Media Placements
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header Zone (bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm pb-2 border-b)│
│  [MapPin] Media Placements [6 placements]      [ ⟳ ] [ Export ] [ + Add Placement ] │
│  Physical media asset tracking, retail visibility, and quarterly recap.      │
│                                                                        │
│  [ KPI 1 ]         [ KPI 2 ]          [ KPI 3 ]          [ KPI 4 ]     │
│                                                                        │
│  [ Table | Map View | Rekap Kuartal ]                                  │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Content Area (p-4 sm:p-6 flex-1 min-h-0)                               │
│  [ Table Shell / Map Canvas / Quarterly Recap Tab ]                    │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Content Planner
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header Zone (bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm pb-2 border-b)│
│  [Sparkles] Content Planner [4 posts]               [ ⟳ ] [ + Schedule Post ]   │
│  Social media calendar, video formats, copywriting, and digital pipeline.     │
│                                                                        │
│  [ KPI 1 ]         [ KPI 2 ]          [ KPI 3 ]          [ KPI 4 ]     │
│                                                                        │
│  [ All Platforms | IG | TikTok | YT... ]       [ Search... ] [ Cards | Table ]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Content Area (p-4 sm:p-6 flex-1 min-h-0)                               │
│  [ Cards Grid / MarcomTableShell ]                                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture & Invariants

1. **Coordinator File LOC Invariant:**
   - `PlacementsView.tsx` MUST remain $\le 250$ LOC. Header logic resides in `PlacementsHeader.tsx`.
   - `ContentPlannerView.tsx` decomposes its header into `ContentPlannerHeader.tsx` to improve modularity.
2. **SSOT Invariant:**
   - All entity models (`MarcomPlacement`, `ContentPostItem`, etc.) remain imported exclusively from `src/types/index.ts`.
3. **Accessibility & Reduced Motion:**
   - Animated view switchers preserve `useReducedMotion()` and Framer Motion spring physics.
4. **Single-Tenant Invariant:**
   - No workspace-scoped abstractions or multi-tenant leaks.

---

## 4. Verification Checklist

- [ ] Drift check passes: `npm run drift:check`
- [ ] TypeScript compilation passes: `npm run build:check`
- [ ] Test suite passes: `npm test` (0 failures)
- [ ] Visual verification of Media Placements and Content Planner matches Equipment Inventory design
