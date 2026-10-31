# Spec — Core Web Vitals Next.js Image Optimization

**Date:** 2026-11-01  
**Status:** DRAFT  
**Scope:** Media delivery architecture, `next.config.ts`, `AppImage` primitive (`src/components/ui/AppImage.tsx`, `src/components/ui/appImageHelpers.ts`), and 16 consuming UI components  
**Refs:** Issue 7 — Optimasi Core Web Vitals (Next.js Image Warning)

---

## 1. Executive Summary

The application currently has 22 raw HTML `<img>` elements scattered across 16 components covering physical outlet documentation, media placement proofs, event footage, marketing content previews, and user profile avatars. Using unoptimized `<img>` tags on field connections (mobile/tablet devices used by regional branch coordinators and PICs) causes:
1. **Severe Cumulative Layout Shift (CLS):** Browser paints empty containers before raw image dimensions arrive over high-latency 4G/3G networks, shifting adjacent content.
2. **Excessive Network Bandwidth & Slower Largest Contentful Paint (LCP):** Heavy raw camera photos (often 3MB–8MB from modern smartphones) are transferred without modern WebP/AVIF format transcoding or responsive width downscaling.
3. **Next.js ESLint Warnings:** 22 warnings emitted under `@next/next/no-img-element`.

This specification establishes a unified image delivery architecture using `next/image` via a resilient `<AppImage />` primitive, configures production-ready remote patterns in `next.config.ts`, and migrates all 16 components with zero regression.

---

## 2. Architecture & Design Principles

```
                  ┌──────────────────────────────────────────┐
                  │            Image Source (src)            │
                  └────────────────────┬─────────────────────┘
                                       │
                    Is blob:, data:, SVG, or unlisted domain?
                                      / \
                                    YES  NO
                                    /     \
                  ┌──────────────────┐   ┌───────────────────────┐
                  │ unoptimized=true │   │ next/image Optimizer  │
                  │ (zero pipeline   │   │ - WebP/AVIF transform │
                  │  failure on blob)│   │ - Responsive srcset   │
                  └─────────┬────────┘   └───────────┬───────────┘
                            │                        │
                            └───────────┬────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │   <AppImage /> Component    │
                         │ - CLS prevention (fill/dim) │
                         │ - Graceful onError fallback │
                         │ - Native lazy loading       │
                         └─────────────────────────────┘
```

1. **`next.config.ts` Remote Host Patterns:**
   - Whitelist trusted external image providers: `images.unsplash.com`, `lh3.googleusercontent.com`, `*.googleusercontent.com`, and Supabase storage domains `*.supabase.co`.
2. **Resilient `<AppImage />` Component:**
   - Automatically determines whether an image must bypass optimizer (`blob:`, `data:`, SVG) to prevent runtime crashes during client-side photo picking.
   - Requires explicit aspect ratio geometry (either `fill` inside a positioned parent or explicit `width` & `height`), eliminating CLS.
   - Manages internal error recovery: if an image URL returns 404/403/CORS error, renders a subtle placeholder rather than a broken image icon.
3. **Avatar Standardization:**
   - Components rendering user avatars (`UsersActiveTab`, `UsersPendingTab`, `UsersRejectedTab`, `EventCardsView`, `UserMenuDropdown`) migrate to `<UserAvatar />` or `<AppImage />`.

---

## 3. Pure Logic Contracts (`appImageHelpers.ts`)

```typescript
export type ImageSizePreset = "avatar" | "thumbnail" | "card" | "lightbox" | "full";

export function shouldBypassOptimization(src?: string | null): boolean;

export function resolveImageSizes(preset?: ImageSizePreset | string): string;
```

* `shouldBypassOptimization`:
  - Returns `true` if `src` begins with `blob:`, `data:`, is an `.svg`, or is empty.
  - Returns `false` for standard HTTP/HTTPS URLs and static internal assets.
* `resolveImageSizes`:
  - `"avatar"`: `"36px"`
  - `"thumbnail"`: `"(max-width: 640px) 64px, 96px"`
  - `"card"`: `"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`
  - `"lightbox"`: `"(max-width: 1024px) 100vw, 1200px"`
  - `"full"`: `"100vw"`

---

## 4. Consuming Components Manifest (16 Files)

| File | Context | Strategy |
|---|---|---|
| `src/components/layout/UserMenuDropdown.tsx` | Profile dropdown avatar | `<AppImage fill sizes="32px" />` or `<UserAvatar />` |
| `src/components/views/UsersView/UsersActiveTab.tsx` | User management active tab row avatar | `<UserAvatar size="sm" />` |
| `src/components/views/UsersView/UsersPendingTab.tsx` | User management pending tab row avatar | `<UserAvatar size="sm" />` |
| `src/components/views/UsersView/UsersRejectedTab.tsx` | User management rejected tab row avatar | `<UserAvatar size="sm" />` |
| `src/components/views/OutletsView/OutletApprovalQueueTab.tsx` | Outlet queue photo (list & modal) | `<AppImage fill sizes="thumbnail" />` & `<AppImage ... sizes="lightbox" />` |
| `src/components/views/OutletsView/Outlet360Drawer.tsx` | Outlet history & zoom modal | `<AppImage fill sizes="thumbnail" />` & `<AppImage ... sizes="lightbox" />` |
| `src/components/views/OutletsView/SubmitDraftOutletModal.tsx` | Draft outlet photo upload preview | `<AppImage fill unoptimized sizes="thumbnail" />` |
| `src/components/views/MousView/MouDocumentViewerModal.tsx` | MoU image document viewer | `<AppImage width={1000} height={1400} sizes="lightbox" />` |
| `src/components/views/DocumentsView/DocumentPreviewModal.tsx` | Legal doc image preview | `<AppImage fill sizes="lightbox" />` |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | Content post detail drawer preview | `<AppImage fill sizes="card" />` |
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | Post card thumbnail & media player | `<AppImage fill sizes="card" />` & `<AppImage ... sizes="lightbox" />` |
| `src/components/views/EventsView/EventTableView.tsx` | Event table footage thumbnail | `<AppImage fill sizes="thumbnail" />` |
| `src/components/views/EventsView/EventCardsView.tsx` | Event PIC avatar & card cover | `<AppImage fill sizes="avatar" />` & `<AppImage fill sizes="card" />` |
| `src/components/views/PlacementsView/PlacementPhotoUploader.tsx` | Uploaded photo preview & modal | `<AppImage fill unoptimized sizes="thumbnail" />` |
| `src/components/views/PlacementsView/PlacementPhotoGallery.tsx` | Gallery hero, strip & lightbox | `<AppImage fill sizes="card" />` & `<AppImage ... sizes="lightbox" />` |
| `src/components/views/ProjectsView/ProjectsWorkItemCard.tsx` | Kanban work item thumbnail | `<AppImage fill sizes="card" />` |

---

## 5. Acceptance Criteria & Verification Checklist

- [ ] `next.config.ts` includes `images.remotePatterns` for Unsplash, Google User Content, and Supabase.
- [ ] `appImageHelpers.test.ts` passes 100% with tests for `shouldBypassOptimization` and `resolveImageSizes`.
- [ ] `<AppImage />` handles load errors gracefully without broken image icons.
- [ ] Local blob URLs in photo uploaders (`PlacementPhotoUploader`, `SubmitDraftOutletModal`) preview reliably without Next.js optimizer crashes.
- [ ] Zero `@next/next/no-img-element` warnings in `next lint`.
- [ ] All verification gates pass:
  - `npm run drift:check` (clean, 0 drift).
  - `npm run test:smoke` (pass 85, fail 0).
  - `npm test` (0 failures).
  - `npm run build:check` (0 TypeScript errors).
  - `npm run build` (full Next.js production build succeeds with all pages).

---

## 6. Non-Goals

- Replacing video preview players (`<video>`).
- Rewriting third-party document viewers (e.g. Google Docs iframe / PDF renderers).

