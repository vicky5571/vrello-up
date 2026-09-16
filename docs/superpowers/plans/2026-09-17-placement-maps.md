# Placement Maps & Shareloc Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement map location tracking for marketing placements, allowing field teams to input shareloc (via Google Maps URL paste, device GPS, or interactive map pin) and visualize all placement locations on an interactive Leaflet/OpenStreetMap Map View with status color-coding and rich action popups.

**Architecture:** Leaflet + OpenStreetMap tiles integrated dynamically with `ssr: false` in Next.js 15 App Router. Prisma schema extension adds `latitude`, `longitude`, `shareLocationUrl`, and `locationNotes` to `Placement`. Pure location parsing utilities extract coordinates from diverse Google Maps links, device GPS, or raw coordinates. PlacementsView gains a view switcher between Table View and Map View with synchronized status filters.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Prisma 6 (PostgreSQL), Leaflet + @types/leaflet, OpenStreetMap, Tailwind CSS v4, Lucide React, Node test runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-17-placement-maps-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-17-placement-maps-design.md)

## Global Constraints

- Use Leaflet directly with React `useRef` (do NOT use `react-leaflet` to avoid React 19 peer-dependency conflicts).
- Dynamic import with `ssr: false` for all Leaflet map rendering components to prevent `window is not defined` during SSR.
- Keep `useWorkspaceStore.ts` clean — do not add large new blocks of logic directly inside it; place modular utilities in `src/lib/marcom/locationUtils.ts`.
- Zero external API keys or paid services required (use free OpenStreetMap tiles).
- Preserve existing 105+ unit tests passing (`npm test`).

---

### Task 1: Install Leaflet & Update Schema/Types

**Files:**
- Modify: `package.json`
- Modify: `prisma/schema.prisma:122-140`
- Modify: `src/types/index.ts:240-260`

**Interfaces:**
- Produces: `Placement` interface with optional `latitude?: number | null`, `longitude?: number | null`, `shareLocationUrl?: string`, `locationNotes?: string`.
- Produces: Prisma Client with updated `Placement` model fields.

- [ ] **Step 1: Install Leaflet and TypeScript types**

Run:
```bash
npm install leaflet
npm install -D @types/leaflet
```

- [ ] **Step 2: Update Prisma Schema**

In `prisma/schema.prisma`, add `latitude`, `longitude`, `shareLocationUrl`, and `locationNotes` to model `Placement`:
```prisma
model Placement {
  id               String          @id @default(cuid())
  workspaceId      String          @default("ws-main")
  workspace        WorkspaceItem   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  outletId         String
  outlet           Outlet          @relation(fields: [outletId], references: [id], onDelete: Cascade)
  materialId       String
  material         Material        @relation(fields: [materialId], references: [id])
  status           PlacementStatus @default(NOT_STARTED)
  date             DateTime?
  picName          String          @default("")
  photoUrl         String          @default("")
  dimensions       String          @default("")
  cost             Float           @default(0)
  notes            String          @default("")

  // Location & Shareloc:
  latitude         Float?
  longitude        Float?
  shareLocationUrl String          @default("")
  locationNotes    String          @default("")

  @@index([workspaceId])
}
```

- [ ] **Step 3: Push schema update and regenerate Prisma Client**

Run:
```bash
npx prisma db push
```

- [ ] **Step 4: Update Domain Types in `src/types/index.ts`**

Update `export interface Placement`:
```typescript
export interface Placement {
  id: string;
  workspaceId?: string;
  outletId: string;
  materialId: string;
  status: PlacementStatus;
  date?: string | null;
  picName?: string;
  photoUrl?: string;
  dimensions?: string;
  cost?: number;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string;
  locationNotes?: string;
  outlet?: { id: string; code: string; name: string };
  material?: { id: string; type: string; name: string };
}
```

- [ ] **Step 5: Run existing tests to verify zero breakage**

Run: `npm test`
Expected: 105+ tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma src/types/index.ts
git commit -m "feat(marcom): add leaflet dependency and location fields to placement model"
```

---

### Task 2: Location Utilities & API Endpoints

**Files:**
- Create: `src/lib/marcom/locationUtils.ts`
- Create: `src/lib/marcom/locationUtils.test.ts`
- Create: `src/app/api/marcom/resolve-location/route.ts`
- Modify: `src/app/api/marcom/placements/route.ts`
- Modify: `src/app/api/marcom/placements/[id]/route.ts`

**Interfaces:**
- Produces: `parseCoordinatesFromText(text: string): { latitude: number; longitude: number } | null`
- Produces: `parseGoogleMapsUrl(url: string): { latitude: number; longitude: number } | null`
- Produces: `isValidCoordinate(lat: number, lng: number): boolean`
- Produces: `buildGoogleMapsUrl(lat: number, lng: number): string`
- Produces: `GET /api/marcom/resolve-location?url=...` returning `{ latitude: number, longitude: number, resolvedUrl: string }`

- [ ] **Step 1: Write failing unit tests for `locationUtils.ts`**

Create `src/lib/marcom/locationUtils.test.ts`:
```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseCoordinatesFromText,
  parseGoogleMapsUrl,
  isValidCoordinate,
  buildGoogleMapsUrl,
} from "./locationUtils";

describe("locationUtils", () => {
  it("parses raw comma-separated coordinates", () => {
    const res = parseCoordinatesFromText("-6.208763, 106.845599");
    assert.deepEqual(res, { latitude: -6.208763, longitude: 106.845599 });
  });

  it("parses raw coordinates with space or no space", () => {
    const res = parseCoordinatesFromText("-6.2088,106.8456");
    assert.deepEqual(res, { latitude: -6.2088, longitude: 106.8456 });
  });

  it("parses Google Maps URL with /@lat,lng format", () => {
    const url = "https://www.google.com/maps/@-6.2087634,106.845599,17z?entry=ttu";
    const res = parseGoogleMapsUrl(url);
    assert.ok(res);
    assert.equal(res.latitude, -6.2087634);
    assert.equal(res.longitude, 106.845599);
  });

  it("parses Google Maps URL with ?q=lat,lng query parameter", () => {
    const url = "https://maps.google.com/?q=-6.1753924,106.8271528";
    const res = parseGoogleMapsUrl(url);
    assert.ok(res);
    assert.equal(res.latitude, -6.1753924);
    assert.equal(res.longitude, 106.8271528);
  });

  it("parses Google Maps URL with ?ll=lat,lng query parameter", () => {
    const url = "https://maps.google.com/?ll=-7.2574719,112.7520883";
    const res = parseGoogleMapsUrl(url);
    assert.ok(res);
    assert.equal(res.latitude, -7.2574719);
    assert.equal(res.longitude, 112.7520883);
  });

  it("validates coordinate boundaries correctly", () => {
    assert.equal(isValidCoordinate(-6.2, 106.8), true);
    assert.equal(isValidCoordinate(91, 106.8), false);
    assert.equal(isValidCoordinate(-91, 106.8), false);
    assert.equal(isValidCoordinate(0, 181), false);
    assert.equal(isValidCoordinate(0, -181), false);
    assert.equal(isValidCoordinate(Number.NaN, 106.8), false);
  });

  it("builds valid Google Maps navigation directions link", () => {
    const link = buildGoogleMapsUrl(-6.208763, 106.845599);
    assert.equal(
      link,
      "https://www.google.com/maps/search/?api=1&query=-6.208763,106.845599",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/marcom/locationUtils.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `locationUtils.ts`**

Create `src/lib/marcom/locationUtils.ts`:
```typescript
/**
 * Utilities for parsing and validating geographic coordinates and shareloc links.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function parseCoordinatesFromText(text: string): Coordinates | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  // Match "-6.2088, 106.8456" or "-6.2088,106.8456" or "Lat: -6.2088, Lng: 106.8456"
  const match = trimmed.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match || !match[1] || !match[2]) return null;

  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (isValidCoordinate(lat, lng)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

export function parseGoogleMapsUrl(url: string): Coordinates | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // 1. Path format: /@-6.2087634,106.845599,15z or /@-6.2087634,106.845599
  const pathMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (pathMatch && pathMatch[1] && pathMatch[2]) {
    const lat = Number.parseFloat(pathMatch[1]);
    const lng = Number.parseFloat(pathMatch[2]);
    if (isValidCoordinate(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 2. Query param format: ?q=-6.2087634,106.845599 or ?ll=... or ?daddr=...
  const queryMatch = trimmed.match(/[?&](?:q|ll|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch && queryMatch[1] && queryMatch[2]) {
    const lat = Number.parseFloat(queryMatch[1]);
    const lng = Number.parseFloat(queryMatch[2]);
    if (isValidCoordinate(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 3. Fallback: try raw coordinates if pasted without URL schema
  return parseCoordinatesFromText(trimmed);
}

export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/marcom/locationUtils.test.ts`
Expected: PASS (all 6 tests passing).

- [ ] **Step 5: Create shortlink resolver API `src/app/api/marcom/resolve-location/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { parseGoogleMapsUrl, isValidCoordinate } from "@/lib/marcom/locationUtils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "URL query parameter is required" }, { status: 400 });
    }

    // First try direct parse
    const directCoords = parseGoogleMapsUrl(targetUrl);
    if (directCoords) {
      return NextResponse.json({
        latitude: directCoords.latitude,
        longitude: directCoords.longitude,
        resolvedUrl: targetUrl,
      });
    }

    // Follow redirect for short URLs (maps.app.goo.gl, goo.gl/maps)
    const response = await fetch(targetUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    const finalUrl = response.url || targetUrl;
    const resolvedCoords = parseGoogleMapsUrl(finalUrl);

    if (resolvedCoords && isValidCoordinate(resolvedCoords.latitude, resolvedCoords.longitude)) {
      return NextResponse.json({
        latitude: resolvedCoords.latitude,
        longitude: resolvedCoords.longitude,
        resolvedUrl: finalUrl,
      });
    }

    return NextResponse.json(
      { error: "Could not extract coordinates from the provided URL" },
      { status: 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve location URL" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 6: Update Placements API routes**

In `src/app/api/marcom/placements/route.ts` and `src/app/api/marcom/placements/[id]/route.ts`:
Include `latitude`, `longitude`, `shareLocationUrl`, and `locationNotes` in Prisma queries (SELECT, POST body parsing, PATCH update data).

- [ ] **Step 7: Verify with unit tests**

Run: `npm test`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/marcom/locationUtils.ts src/lib/marcom/locationUtils.test.ts src/app/api/marcom/resolve-location/route.ts src/app/api/marcom/placements/route.ts src/app/api/marcom/placements/[id]/route.ts
git commit -m "feat(marcom): add location parsing utilities and update placement API endpoints"
```

---

### Task 3: LocationPicker Component for Modal Add/Edit Placement

**Files:**
- Create: `src/components/views/PlacementsView/LocationPicker.tsx`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx`

**Interfaces:**
- Produces: `<LocationPicker latitude={...} longitude={...} shareLocationUrl={...} locationNotes={...} onChange={(loc) => ...} />`
- Consumes: `parseGoogleMapsUrl`, `isValidCoordinate`, `buildGoogleMapsUrl` from `@/lib/marcom/locationUtils`.

- [ ] **Step 1: Create `LocationPicker.tsx` component**

Include:
- Text input for pasting URL / raw coordinates with auto-parse on change or paste.
- "Ambil Lokasi GPS Saya" button using `navigator.geolocation.getCurrentPosition`.
- Dynamic Leaflet mini-map preview loaded client-side with a draggable marker that updates coordinates when moved or when the mini-map is clicked.
- Coordinates badge (`Lat: -6.2088 | Lng: 106.8456`) and "Hapus Lokasi" button.
- Location notes input field.

- [ ] **Step 2: Integrate `LocationPicker` into `PlacementsView.tsx` modal**

In `PlacementsView.tsx`:
- Include `latitude`, `longitude`, `shareLocationUrl`, and `locationNotes` in `modalPlacement` state.
- Render `<LocationPicker ... />` inside the modal form.
- Pass the location fields in `handleSavePlacement`.

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/PlacementsView/LocationPicker.tsx src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "feat(marcom): add LocationPicker to placement add/edit modal"
```

---

### Task 4: Interactive PlacementsMapView Component

**Files:**
- Create: `src/components/views/PlacementsView/PlacementsMapView.tsx`

**Interfaces:**
- Produces: `<PlacementsMapView placements={...} onEditPlacement={(p) => ...} onTrackAsTask={(p) => ...} />`
- Custom DivIcon markers with SVG pins colored by status (`NOT_STARTED` = slate, `ON_PROGRESS` = amber, `DONE` = emerald, `ISSUE` = rose).
- Auto-fit bounds on initial render and when filtering changes.
- Rich popup card on marker click:
  - Outlet code & name
  - Material name & dimensions
  - Status chip
  - PIC name & Date
  - Photo proof thumbnail
  - Action buttons: "Rute Google Maps", "Edit Placement", "Track as Task"
- Collapsible sidebar tray listing "Placements Tanpa Lokasi" with "Set Lokasi" button.

- [ ] **Step 1: Create `PlacementsMapView.tsx`**

Implement the component using client-side Leaflet with `useRef` for container and cleanup in `useEffect`. Add status-based pin coloring, custom popup HTML, and unmapped placements drawer.

- [ ] **Step 2: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/views/PlacementsView/PlacementsMapView.tsx
git commit -m "feat(marcom): implement PlacementsMapView with interactive leaflet markers and popups"
```

---

### Task 5: PlacementsView Integration & View Switching

**Files:**
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx`

**Interfaces:**
- Adds view mode state: `viewMode: "table" | "map"`
- Adds toggle buttons in header: `[ Table View ]` (`TableProperties` icon) and `[ Map View ]` (`MapPin` icon).
- Imports `leaflet/dist/leaflet.css`.
- Renders `MarcomTableShell` when `viewMode === "table"`, and `PlacementsMapView` when `viewMode === "map"`.
- Status chips and search filter seamlessly apply across both views.

- [ ] **Step 1: Update `PlacementsView.tsx` with view switching**

Add:
- State `const [viewMode, setViewMode] = useState<"table" | "map">("table");`
- Toggle buttons in header alongside Add Placement button.
- Dynamic import for `PlacementsMapView` (`ssr: false`).
- Conditional rendering: `viewMode === "table" ? <MarcomTableShell ... /> : <PlacementsMapView ... />`.

- [ ] **Step 2: Import Leaflet CSS in component or layout**

Ensure `import "leaflet/dist/leaflet.css"` is loaded.

- [ ] **Step 3: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "feat(marcom): add view switcher between table and map view in PlacementsView"
```

---

### Task 6: End-to-End Verification & Full Regression Testing

**Files:**
- Test verification across all affected files.

- [ ] **Step 1: Run full unit test suite**

Run: `npm test`
Expected: All 105+ tests PASS.

- [ ] **Step 2: TypeScript compiler validation**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Manual verification checklist**
1. Open http://localhost:3000 -> Navigate to Marcom -> Placements.
2. Click "Add Placement", verify `LocationPicker` appears.
3. Test GPS button or paste Google Maps URL (`https://maps.google.com/?q=-6.2088,106.8456`).
4. Verify mini-map pin updates and displays coordinates.
5. Save placement and verify database persists coordinates.
6. Switch to "Map View" tab. Verify pin renders at the correct coordinates with matching status color.
7. Click pin, verify popup shows details and buttons.
8. Click "Rute Google Maps" and verify navigation link opens.
9. Verify status filter chips and search bar filter the pins dynamically.
10. Check "Placements Tanpa Lokasi" tray.

- [ ] **Step 4: Final commit and summary**
```bash
git commit -m "chore(marcom): complete placement maps & shareloc feature verification"
```
