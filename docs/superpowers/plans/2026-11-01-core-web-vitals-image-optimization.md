# Core Web Vitals Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all Next.js `no-img-element` ESLint warnings and prevent Cumulative Layout Shift (CLS) on field connections by migrating 22 raw `<img>` tags across 16 components to `next/image` via a resilient `<AppImage />` primitive with remote image patterns.

**Architecture:** Configure `remotePatterns` in `next.config.ts` for trusted external domains. Create `appImageHelpers.ts` with pure URL and layout helpers, tested with built-in `node:test`. Build `<AppImage />` in `src/components/ui/AppImage.tsx` handling aspect ratio, responsive `sizes`, automatic `unoptimized` fallback for local `blob:`/`data:` URLs, and load error fallbacks. Systematically migrate avatars, outlet/placement photos, event media, and content thumbnails across all 16 target components.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-01-core-web-vitals-image-optimization-design.md`

## Global Constraints

- Coordinator files must remain strictly $\le 250$ LOC. Do not introduce oversized coordinators during migration.
- Single Source of Truth: No duplicate domain interfaces outside `src/types/index.ts`. Helper types stay strictly in `appImageHelpers.ts`.
- Zero raw `any` types without explicit `// @ts-expect-error: <reason>`.
- All verification gates (`npm run drift:check`, `npm run build:check`, `npm test`, `next lint`) must pass with 0 errors and 0 `@next/next/no-img-element` warnings.

---

### Task 1: Remote Patterns in `next.config.ts` and `appImageHelpers` Test Suite

**Files:**
- Modify: `next.config.ts`
- Create: `src/components/ui/appImageHelpers.ts`
- Create: `src/components/ui/appImageHelpers.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type ImageSizePreset = "avatar" | "thumbnail" | "card" | "lightbox" | "full";
  export function shouldBypassOptimization(src?: string | null): boolean;
  export function resolveImageSizes(preset?: ImageSizePreset | string): string;
  ```

- [ ] **Step 1: Configure `next.config.ts` remotePatterns**

Update `next.config.ts` to allow Unsplash, Google User Content, and Supabase storage:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Write failing unit test in `src/components/ui/appImageHelpers.test.ts`**

```typescript
// src/components/ui/appImageHelpers.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldBypassOptimization, resolveImageSizes } from "./appImageHelpers";

describe("appImageHelpers: shouldBypassOptimization", () => {
  it("identifies local blob URLs as unoptimized", () => {
    assert.equal(shouldBypassOptimization("blob:http://localhost:3000/1234-abcd"), true);
  });

  it("identifies base64 data URLs as unoptimized", () => {
    assert.equal(shouldBypassOptimization("data:image/png;base64,iVBORw0KGgo..."), true);
  });

  it("identifies SVG files as unoptimized to preserve vector rendering", () => {
    assert.equal(shouldBypassOptimization("https://example.com/logo.svg"), true);
    assert.equal(shouldBypassOptimization("/icons/badge.svg"), true);
  });

  it("allows standard remote HTTPS images to be optimized", () => {
    assert.equal(shouldBypassOptimization("https://images.unsplash.com/photo-1234"), false);
    assert.equal(shouldBypassOptimization("https://lh3.googleusercontent.com/avatar.jpg"), false);
    assert.equal(shouldBypassOptimization("https://xyz.supabase.co/storage/v1/object/public/outlets/photo.jpg"), false);
  });

  it("safely handles null, undefined, and empty string", () => {
    assert.equal(shouldBypassOptimization(null), true);
    assert.equal(shouldBypassOptimization(undefined), true);
    assert.equal(shouldBypassOptimization(""), true);
  });
});

describe("appImageHelpers: resolveImageSizes", () => {
  it("maps presets to responsive viewport expressions", () => {
    assert.equal(resolveImageSizes("avatar"), "36px");
    assert.equal(resolveImageSizes("thumbnail"), "(max-width: 640px) 64px, 96px");
    assert.equal(resolveImageSizes("card"), "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw");
    assert.equal(resolveImageSizes("lightbox"), "(max-width: 1024px) 100vw, 1200px");
    assert.equal(resolveImageSizes("full"), "100vw");
  });

  it("preserves custom sizes string verbatim", () => {
    assert.equal(resolveImageSizes("120px"), "120px");
    assert.equal(resolveImageSizes("(max-width: 768px) 50vw, 25vw"), "(max-width: 768px) 50vw, 25vw");
  });

  it("defaults to 100vw when preset is omitted", () => {
    assert.equal(resolveImageSizes(), "100vw");
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `node --test --import ./test/register-alias.mjs src/components/ui/appImageHelpers.test.ts`  
Expected: FAIL with `Cannot find module './appImageHelpers'`

- [ ] **Step 4: Implement `src/components/ui/appImageHelpers.ts`**

```typescript
// src/components/ui/appImageHelpers.ts

export type ImageSizePreset = "avatar" | "thumbnail" | "card" | "lightbox" | "full";

const SIZE_PRESETS: Record<ImageSizePreset, string> = {
  avatar: "36px",
  thumbnail: "(max-width: 640px) 64px, 96px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  lightbox: "(max-width: 1024px) 100vw, 1200px",
  full: "100vw",
};

/**
 * Determines whether Next.js image optimization pipeline should be bypassed.
 * Returns true for blob:, data:, SVG vectors, or invalid/empty URLs.
 */
export function shouldBypassOptimization(src?: string | null): boolean {
  if (!src) return true;
  const trimmed = src.trim().toLowerCase();
  if (!trimmed) return true;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return true;
  if (trimmed.endsWith(".svg") || trimmed.includes(".svg?")) return true;
  return false;
}

/**
 * Resolves standard responsive sizes attributes based on component layout context.
 */
export function resolveImageSizes(preset?: ImageSizePreset | string): string {
  if (!preset) return "100vw";
  if (preset in SIZE_PRESETS) {
    return SIZE_PRESETS[preset as ImageSizePreset];
  }
  return preset;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test --import ./test/register-alias.mjs src/components/ui/appImageHelpers.test.ts`  
Expected: PASS (8 passed)

- [ ] **Step 6: Commit Task 1**

```bash
git add next.config.ts src/components/ui/appImageHelpers.ts src/components/ui/appImageHelpers.test.ts
git commit -m "feat(config): add image remotePatterns and appImageHelpers"
```

---

### Task 2: Create Reusable `<AppImage />` Primitive

**Files:**
- Create: `src/components/ui/AppImage.tsx`

**Interfaces:**
- Consumes:
  - `Image` from `next/image`
  - `shouldBypassOptimization`, `resolveImageSizes`, `ImageSizePreset` from `@/components/ui/appImageHelpers`
  - `cn` from `@/lib/utils`
- Produces:
  ```typescript
  export interface AppImageProps {
    src: string;
    alt: string;
    fill?: boolean;
    width?: number;
    height?: number;
    sizes?: ImageSizePreset | string;
    className?: string;
    priority?: boolean;
    unoptimized?: boolean;
    fallbackIcon?: React.ReactNode;
    onError?: () => void;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }
  export function AppImage(props: AppImageProps): React.JSX.Element;
  ```

- [ ] **Step 1: Implement `src/components/ui/AppImage.tsx`**

```tsx
// src/components/ui/AppImage.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  shouldBypassOptimization,
  resolveImageSizes,
  type ImageSizePreset,
} from "./appImageHelpers";

export interface AppImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: ImageSizePreset | string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  unoptimized?: boolean;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function AppImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = "100vw",
  className,
  containerClassName,
  priority = false,
  unoptimized,
  fallbackIcon,
  onError,
  onClick,
}: AppImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const isBypassed = unoptimized ?? shouldBypassOptimization(src);

  if (!src || hasError) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
          fill ? "w-full h-full" : "",
          containerClassName,
        )}
        style={!fill && width && height ? { width, height } : undefined}
      >
        {fallbackIcon ?? <ImageOff className="w-5 h-5 opacity-40" />}
      </div>
    );
  }

  const resolvedSizes = resolveImageSizes(sizes);

  if (fill) {
    return (
      <div
        onClick={onClick}
        className={cn("relative w-full h-full overflow-hidden", containerClassName)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={resolvedSizes}
          priority={priority}
          unoptimized={isBypassed}
          onError={handleError}
          className={cn("object-cover", className)}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 300}
      height={height ?? 200}
      sizes={resolvedSizes}
      priority={priority}
      unoptimized={isBypassed}
      onError={handleError}
      className={className}
    />
  );
}
```

- [ ] **Step 2: Run build check to verify TypeScript compilation**

Run: `npm run build:check`  
Expected: PASS (0 errors)

- [ ] **Step 3: Commit Task 2**

```bash
git add src/components/ui/AppImage.tsx
git commit -m "feat(ui): create resilient AppImage component"
```

---

### Task 3: Migrate User Avatar Instances (4 Files)

**Files:**
- Modify: `src/components/layout/UserMenuDropdown.tsx`
- Modify: `src/components/views/UsersView/UsersActiveTab.tsx`
- Modify: `src/components/views/UsersView/UsersPendingTab.tsx`
- Modify: `src/components/views/UsersView/UsersRejectedTab.tsx`

- [ ] **Step 1: Migrate `UserMenuDropdown.tsx`**

In `src/components/layout/UserMenuDropdown.tsx`:
Replace the raw `<img>` tag with `<AppImage src={user.image} alt={user.name || "User"} fill sizes="36px" className="object-cover" />` inside the avatar container.

- [ ] **Step 2: Migrate `UsersActiveTab.tsx`**

In `src/components/views/UsersView/UsersActiveTab.tsx` (line 120-124):
Replace raw `<img>` with `<UserAvatar user={{ id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role }} size="sm" />` or `<AppImage src={user.avatar} alt={user.name} fill sizes="32px" className="object-cover" />`.

- [ ] **Step 3: Migrate `UsersPendingTab.tsx` and `UsersRejectedTab.tsx`**

In `UsersPendingTab.tsx` (line 108) and `UsersRejectedTab.tsx` (line 104):
Replace raw `<img>` with `<UserAvatar user={...} size="sm" />` or `<AppImage src={user.avatar} alt={user.name} fill sizes="32px" className="object-cover" />`.

- [ ] **Step 4: Verify build check and smoke tests**

Run: `npm run build:check && npm run test:smoke`  
Expected: PASS

- [ ] **Step 5: Commit Task 3**

```bash
git add src/components/layout/UserMenuDropdown.tsx src/components/views/UsersView/
git commit -m "refactor(users): migrate avatar img elements to next/image"
```

---

### Task 4: Migrate Outlets & Placements Media Views (5 Files)

**Files:**
- Modify: `src/components/views/OutletsView/OutletApprovalQueueTab.tsx`
- Modify: `src/components/views/OutletsView/Outlet360Drawer.tsx`
- Modify: `src/components/views/OutletsView/SubmitDraftOutletModal.tsx`
- Modify: `src/components/views/PlacementsView/PlacementPhotoUploader.tsx`
- Modify: `src/components/views/PlacementsView/PlacementPhotoGallery.tsx`

- [ ] **Step 1: Migrate `OutletApprovalQueueTab.tsx`**
  - Line 305: replace thumbnail `<img>` with `<AppImage src={photoUrl} alt="Foto Toko" fill sizes="thumbnail" className="object-cover" />`.
  - Line 610: replace zoom modal `<img>` with `<AppImage src={selectedPhotoUrl} alt="Foto Toko" fill sizes="lightbox" className="object-contain" />`.

- [ ] **Step 2: Migrate `Outlet360Drawer.tsx`**
  - Line 1273: replace placement thumbnail `<img>` with `<AppImage src={p.photoUrl} alt="POSM Photo" fill sizes="thumbnail" className="object-cover" />`.
  - Line 1781: replace drawer zoom `<img>` with `<AppImage src={zoomedImage.url} alt="Zoomed" fill sizes="lightbox" className="object-contain" />`.

- [ ] **Step 3: Migrate `SubmitDraftOutletModal.tsx`**
  - Line 403: replace local upload preview `<img>` with `<AppImage src={photoPreviewUrl} alt="Preview" fill sizes="thumbnail" unoptimized className="object-cover" />`.

- [ ] **Step 4: Migrate `PlacementPhotoUploader.tsx`**
  - Line 264 & 321: replace local photo upload previews with `<AppImage src={previewUrl} alt="Upload preview" fill sizes="thumbnail" unoptimized className="object-cover" />`.

- [ ] **Step 5: Migrate `PlacementPhotoGallery.tsx`**
  - Lines 49, 112, 146: replace hero image, thumbnail strip, and lightbox modal `<img>` with `<AppImage />` using `sizes="card"` and `sizes="lightbox"`.

- [ ] **Step 6: Verify build check and smoke tests**

Run: `npm run build:check && npm run test:smoke`  
Expected: PASS

- [ ] **Step 7: Commit Task 4**

```bash
git add src/components/views/OutletsView/ src/components/views/PlacementsView/
git commit -m "refactor(outlets,placements): migrate photo galleries and uploaders to AppImage"
```

---

### Task 5: Migrate Events, Content, Docs & Projects Media Views (7 Files)

**Files:**
- Modify: `src/components/views/EventsView/EventTableView.tsx`
- Modify: `src/components/views/EventsView/EventCardsView.tsx`
- Modify: `src/components/views/MousView/MouDocumentViewerModal.tsx`
- Modify: `src/components/views/DocumentsView/DocumentPreviewModal.tsx`
- Modify: `src/components/views/ContentPlannerView/ContentDrawer.tsx`
- Modify: `src/components/views/ContentPlannerView/ContentPlannerView.tsx`
- Modify: `src/components/views/ProjectsView/ProjectsWorkItemCard.tsx`

- [ ] **Step 1: Migrate `EventTableView.tsx` and `EventCardsView.tsx`**
  - In `EventTableView.tsx` line 230: replace footage preview `<img>` with `<AppImage src={footage.url} alt="Footage" fill sizes="thumbnail" className="object-cover" />`.
  - In `EventCardsView.tsx` line 354: replace PIC avatar `<img>` with `<AppImage src={picMember.avatar} alt={picMember.name} fill sizes="avatar" className="object-cover rounded-full" />`.

- [ ] **Step 2: Migrate `MouDocumentViewerModal.tsx` and `DocumentPreviewModal.tsx`**
  - In `MouDocumentViewerModal.tsx` line 179: replace document image `<img>` with `<AppImage src={docUrl} alt="MoU Document" fill sizes="lightbox" className="object-contain" />`.
  - In `DocumentPreviewModal.tsx` line 192: replace legal document image `<img>` with `<AppImage src={previewUrl} alt="Document Preview" fill sizes="lightbox" className="object-contain" />`.

- [ ] **Step 3: Migrate `ContentDrawer.tsx` and `ContentPlannerView.tsx`**
  - In `ContentDrawer.tsx` line 475: replace post media preview `<img>` with `<AppImage src={post.mediaUrl} alt={post.title} fill sizes="card" className="object-cover" />`.
  - In `ContentPlannerView.tsx` line 667 & 994: replace card preview & lightbox `<img>` with `<AppImage sizes="card" />` and `<AppImage sizes="lightbox" />`.

- [ ] **Step 4: Migrate `ProjectsWorkItemCard.tsx`**
  - In `ProjectsWorkItemCard.tsx` line 290: replace kanban card media thumbnail `<img>` with `<AppImage src={item.mediaUrl} alt={title} fill sizes="card" className="object-cover" />`.

- [ ] **Step 5: Verify build check and smoke tests**

Run: `npm run build:check && npm run test:smoke`  
Expected: PASS

- [ ] **Step 6: Commit Task 5**

```bash
git add src/components/views/EventsView/ src/components/views/MousView/ src/components/views/DocumentsView/ src/components/views/ContentPlannerView/ src/components/views/ProjectsView/
git commit -m "refactor(media): migrate content, events, documents, and projects images to AppImage"
```

---

### Task 6: Complete Verification Gates & Documentation

**Files:**
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/plans/README.md`
- Modify: `docs/SESSION_STATE.md`

- [ ] **Step 1: Run ESLint to verify 0 `@next/next/no-img-element` warnings**

Run: `npm run lint`  
Expected: 0 warnings for `@next/next/no-img-element`

- [ ] **Step 2: Run drift check**

Run: `npm run drift:check`  
Expected: `✅ No drift detected. All invariants pass.`

- [ ] **Step 3: Run full smoke test suite**

Run: `npm run test:smoke`  
Expected: `ℹ pass 85, fail 0`

- [ ] **Step 4: Run full test suite**

Run: `npm test`  
Expected: `ℹ pass 613+ (0 failures)`

- [ ] **Step 5: Run production build check**

Run: `npm run build:check`  
Expected: `0 TypeScript errors`

- [ ] **Step 6: Update documentation indexes and session state**

Update:
- `docs/superpowers/specs/README.md`
- `docs/superpowers/plans/README.md`
- `docs/SESSION_STATE.md`

- [ ] **Step 7: Commit documentation**

```bash
git add docs/superpowers/specs/README.md docs/superpowers/plans/README.md docs/SESSION_STATE.md
git commit -m "docs: document Core Web Vitals image optimization completion"
```

