# Design Spec: Inventory-Style Header Standardization Across Marcom Views

**Date:** 2026-10-31  
**Author:** Critical Senior Software Engineer  
**Status:** Approved  
**Affected Views:** Media Placements (`PlacementsView.tsx`), Content Planner (`ContentPlannerView.tsx`), Field Events (`EventsView.tsx`), Pipeline (`PipelineView.tsx`), Analytics & ROI (`AnalyticsView.tsx`), Reports & Exports (`ReportsView.tsx`), Documents & Asset Library (`DocumentsView.tsx`), Outlets Directory (`OutletsView.tsx`), Branches & Regional Hubs (`BranchesView.tsx`)

---

## 1. Executive Summary

The header on the **Equipment Inventory & Loans** page provides a unified, cohesive top zone (`border-b bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`) integrating the title row, primary actions, 4 KPI cards, and sub-navigation controls. This contrasts with the disconnected floating card-banner pattern previously on Media Placements and Content Planner.

This specification standardizes the header architecture across **Media Placements**, **Content Planner**, **Field Events**, **Pipeline**, **Analytics & ROI**, **Reports & Exports**, **Documents & Asset Library**, **Outlets Directory**, and **Branches & Regional Hubs** to mirror the **Equipment Inventory** header design language:
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

### C. Analytics & ROI Hub
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header Zone (bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm pb-2 border-b)│
│  [BarChart3] Operational Intelligence & ROI [Live Metrics]       [ ⟳ ] │
│  Metrik operasional riil: SLA perizinan, unit economics POSM, dll.    │
│                                                                        │
│  [ MOU SLA ]     [ POSM Rate ]     [ Event Cost ]     [ Content Cadence]│
│                                                                        │
│  [ Filter: Semua Branch | Kuartal | Brand Pills ]          [ Reset (N) ]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Content Area (p-4 sm:p-6 flex-1 min-h-0 space-y-6)                     │
│  [ Actionable Telemetry Mini-Strip ]                                   │
│  [ 2×2 Atomic Charts Grid: POSM Economics, MOU Aging, Event, Content ] │
└────────────────────────────────────────────────────────────────────────┘
```

### D. Reports & Exports Hub
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header Zone (bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm pb-2 border-b)│
│  [BarChart3] Reports & Exports [Executive Archive]   [ ⟳ ] [ Export Center ] [ ⚡ PDF ] │
│  Rekap eksekutif bulanan, evaluasi pencapaian, dan ekspor operasional. │
│                                                                        │
│  [ Total Laporan ]  [ Total Aktivitas ]  [ Avg Completion ]  [ Laporan Terkini ] │
│                                                                        │
│  [ Laporan Bulanan | Rekap POSM Kuartalan ]      [ + Buat Laporan Baru ]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Content Area (p-4 sm:p-6 flex-1 min-h-0 space-y-6)                     │
│  [ Form Buat Laporan Bulanan (collapsible) ]                           │
│  [ Monthly Reports List / QuarterlyPosmReportTab ]                     │
└────────────────────────────────────────────────────────────────────────┘
```

### E. Documents & Asset Library
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header Zone (bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm pb-2 border-b)│
│  [Files] Documents & Asset Library [N dokumen]      [ ⟳ ] [ + Tambah Dokumen ] │
│  Pusat repositori brand guidelines, SOP, materi master, dan kontrak.   │
│                                                                        │
│  [ Total Dokumen ]  [ Kapasitas ]  [ Dokumen Aktif ]  [ Top Kategori ] │
│                                                                        │
│  [ Category Chips: Semua | Brand Guidelines | ... ] [ Search ] [ Cards | Table ]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Content Area (p-4 sm:p-6 flex-1 min-h-0 space-y-4)                     │
│  [ DocumentCardsView / MarcomTableShell ]                              │
└────────────────────────────────────────────────────────────────────────┘
```

### F. Outlets Directory
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header Zone (bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm pb-2 border-b)│
│  [Store] Outlets Directory [N outlet]         [ ⟳ ] [ + Add Outlet ]   │
│  Pusat data jaringan outlet, integrasi MoU, riwayat branding fisik, GPS.│
│                                                                        │
│  [ Total ]    [ Branches ]    [ Brands ]    [ MoU Active ]  [ POSM ]   │
│                                                                        │
│  [ Tabel Data | Peta Sebaran | Antrean Approval (N) ]                  │
│  [ Branch: All | Store Type: All ] [ Search... ] [ Reset Filters ]     │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Content Area (p-4 sm:p-6 flex-1 min-h-0 space-y-4)                     │
│  [ MarcomTableShell / OutletMapView / OutletApprovalQueueTab ]         │
└────────────────────────────────────────────────────────────────────────┘
```

### G. Branches & Regional Hubs
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header Zone (bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm pb-2 border-b)│
│  [Building2] Branches & Regional Hubs [N branch]    [ ⟳ ] [ + Tambah Branch ] │
│  Pusat koordinasi operasional regional, tracking progres, dan outlet.   │
│                                                                        │
│  [ Total Branches ]  [ Outlets Network ]  [ MOUs ]  [ Avg Progress ]   │
│                                                                        │
│  [ Status: Semua | Done | In Progress | Pending ] [ Region: All ] [ Search ]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ Content Area (p-4 sm:p-6 flex-1 min-h-0 space-y-4)                     │
│  [ MarcomTableShell ]                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture & Invariants

1. **Coordinator File LOC Invariant:**
   - `PlacementsView.tsx` MUST remain $\le 250$ LOC. Header logic resides in `PlacementsHeader.tsx`.
   - `ContentPlannerView.tsx` decomposes its header into `ContentPlannerHeader.tsx` to improve modularity.
   - `AnalyticsView.tsx` decomposes its header into `AnalyticsHeader.tsx` and stage telemetry into `AnalyticsActionableStrip.tsx`.
   - `ReportsView.tsx` decomposes its header into `ReportsHeader.tsx`.
   - `DocumentsView.tsx` decomposes its header into `DocumentsHeader.tsx`.
   - `OutletsView.tsx` decomposes its header into `OutletsHeader.tsx`.
   - `BranchesView.tsx` decomposes its header into `BranchesHeader.tsx`.
2. **SSOT Invariant:**
   - All entity models (`MarcomPlacement`, `ContentPostItem`, `OutletItem`, `MarcomBranch`, etc.) remain imported exclusively from `src/types/index.ts`.
3. **Accessibility & Reduced Motion:**
   - Animated view switchers preserve `useReducedMotion()` and Framer Motion spring physics.
4. **Single-Tenant Invariant:**
   - No workspace-scoped abstractions or multi-tenant leaks.

---

## 4. Verification Checklist

- [ ] Drift check passes: `npm run drift:check`
- [ ] TypeScript compilation passes: `npm run build:check`
- [ ] Test suite passes: `npm test` (0 failures)
- [ ] Visual verification of all updated Marcom views matches Equipment Inventory design
