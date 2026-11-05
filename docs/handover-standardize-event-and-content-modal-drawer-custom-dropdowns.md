# Handover: Standardize Event & Content Modal/Drawer Form CustomDropdowns

- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-standardize-event-and-content-modal-drawer-custom-dropdowns.md`
- **ADR:** `docs/adr/0037-standardize-event-and-content-modal-drawer-custom-dropdowns.md`

---

## 1. File Manifest & Exact Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `src/components/views/EventsView/EventDrawer.tsx` | Field Event Edit Drawer: replace 4 native `<select>` tags (`eventType`, `eventBranchName`, `eventOutletId`, `picMemberId`) with `<CustomDropdown>` |
| `src/components/views/EventsView/EventCreateModal.tsx` | Field Event Create Modal: replace 4 native `<select>` tags (`eventType`, `eventBranchName`, `eventOutletId`, `picMemberId`) with `<CustomDropdown>` |
| `src/components/views/ContentPlannerView/ContentPostModal.tsx` | Content Planner Schedule New Post Modal: replace 4 native `<select>` tags (`platform`, `format`, `status`, `outletId`) with `<CustomDropdown>` |
| `src/components/views/EventsView/eventDrawerCustomDropdown.test.ts` | Test suite verifying elimination of native selects and wiring of `CustomDropdown` |

---

## 2. Explicit "Do Not Touch" List

1. **`ContentDrawer.tsx`:** Explicitly deferred per user instruction. Do NOT touch this file in this task.
2. **Prisma schemas & API routes:** Pure presentation-layer refactoring. Do NOT modify any database models, API route contracts, or form submission payloads.
3. **Form submission state & event handlers:** Preserve existing handlers (`handleSave`, `handleSubmit`, `handleDelete`, `onClose`) and validation logic.
4. **Custom PIC input reveal:** The conditional `<input>` for `picMemberId === "custom"` must remain intact across both `EventDrawer` and `EventCreateModal`.
5. **Autofill venue location side-effect:** When choosing an outlet, if `eventLocation` is empty, autofill `found.name`.

---

## 3. Step-by-Step Execution Order

### Step 1 (TDD Red): Create Test Suite `eventDrawerCustomDropdown.test.ts`
- **File:** `src/components/views/EventsView/eventDrawerCustomDropdown.test.ts`
- **Purpose:** Asserts that `EventDrawer.tsx`, `EventCreateModal.tsx`, and `ContentPostModal.tsx` import `CustomDropdown` and have eliminated all raw `<select` tags.

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("CustomDropdown form standardization", () => {
  it("EventDrawer.tsx imports CustomDropdown and eliminates raw selects", () => {
    const filePath = path.resolve(process.cwd(), "src/components/views/EventsView/EventDrawer.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('import { CustomDropdown } from "@/components/ui/CustomDropdown"') ||
      content.includes("import { CustomDropdown } from '@/components/ui/CustomDropdown'"),
      "EventDrawer must import CustomDropdown"
    );

    // Should not have native <select for activation type, branch, outlet, or PIC
    const selectCount = (content.match(/<select/g) || []).length;
    // Only status dropdown may remain if styled separately, or 0
    assert.ok(selectCount <= 1, `Expected <= 1 select tag in EventDrawer, found ${selectCount}`);
  });

  it("EventCreateModal.tsx imports CustomDropdown and eliminates raw selects", () => {
    const filePath = path.resolve(process.cwd(), "src/components/views/EventsView/EventCreateModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('import { CustomDropdown } from "@/components/ui/CustomDropdown"'),
      "EventCreateModal must import CustomDropdown"
    );

    const selectCount = (content.match(/<select/g) || []).length;
    assert.strictEqual(selectCount, 0, `Expected 0 select tags in EventCreateModal, found ${selectCount}`);
  });

  it("ContentPostModal.tsx imports CustomDropdown and eliminates raw selects", () => {
    const filePath = path.resolve(process.cwd(), "src/components/views/ContentPlannerView/ContentPostModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('import { CustomDropdown } from "@/components/ui/CustomDropdown"'),
      "ContentPostModal must import CustomDropdown"
    );

    const selectCount = (content.match(/<select/g) || []).length;
    assert.strictEqual(selectCount, 0, `Expected 0 select tags in ContentPostModal, found ${selectCount}`);
  });
});
```

### Step 2: Implement Changes in `EventDrawer.tsx`
- **File:** `src/components/views/EventsView/EventDrawer.tsx`
- **Imports:** Add `import { CustomDropdown } from "@/components/ui/CustomDropdown";`
- **Tipe Aktivasi:**
  ```tsx
  <CustomDropdown
    value={eventType}
    onChange={(newType) => {
      setEventType(newType);
      if (eventSubtasks.length === 0) {
        setEventSubtasks(
          getEventChecklistTemplate(newType).map((t, i) => ({
            id: `sub-init-${i}`,
            title: t,
            completed: false,
          }))
        );
      }
    }}
    options={[
      { value: "Roadshow", label: "Mall Roadshow" },
      { value: "Launch", label: "Store Launch" },
      { value: "Booth", label: "Pop-up Booth" },
      { value: "Exhibition", label: "Exhibition / Expo" },
      { value: "Workshop", label: "Workshop" },
      { value: "Community", label: "Community Meetup" },
    ]}
    size="md"
    className="w-full"
    menuClassName="w-full min-w-full"
  />
  ```
- **Cabang Penyelenggara:**
  ```tsx
  <CustomDropdown
    value={eventBranchName}
    onChange={(val) => setEventBranchName(val)}
    options={
      branches.length > 0
        ? branches.map((b) => ({ value: b.name, label: b.name }))
        : [
            { value: "Jakarta Central", label: "Jakarta Central" },
            { value: "Surabaya West", label: "Surabaya West" },
            { value: "Bandung Dago", label: "Bandung Dago" },
            { value: "Bali Kuta", label: "Bali Kuta" },
          ]
    }
    size="md"
    searchable={branches.length >= 6}
    searchPlaceholder="Cari cabang..."
    className="w-full"
    menuClassName="w-full min-w-full"
  />
  ```
- **Outlet Terkait (Opsional):**
  ```tsx
  <CustomDropdown
    value={eventOutletId}
    onChange={(chosenId) => {
      setEventOutletId(chosenId);
      if (chosenId && !eventLocation) {
        const found = outlets.find((o) => o.id === chosenId);
        if (found) setEventLocation(found.name);
      }
    }}
    options={[
      { value: "", label: "-- Tidak Terikat Outlet Khusus --" },
      ...filteredOutlets.map((o) => ({
        value: o.id,
        label: formatOutletSelectLabel(o),
      })),
    ]}
    size="md"
    searchable
    searchPlaceholder="Cari kode atau nama outlet..."
    className="w-full"
    menuClassName="w-full min-w-full max-w-lg"
    placeholder="-- Tidak Terikat Outlet Khusus --"
  />
  ```
- **Person in Charge (PIC):**
  ```tsx
  <CustomDropdown
    value={picMemberId}
    onChange={(val) => {
      setPicMemberId(val);
      if (val !== "custom") {
        const m = members.find((mem) => mem.id === val);
        if (m) setEventPicName(m.name);
      }
    }}
    options={[
      ...members.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.email})`,
      })),
      { value: "custom", label: "Custom PIC Name..." },
    ]}
    size="md"
    searchable={members.length >= 6}
    searchPlaceholder="Cari anggota tim PIC..."
    className="w-full"
    menuClassName="w-full min-w-full max-w-md"
  />
  ```

### Step 3: Implement Changes in `EventCreateModal.tsx`
- **File:** `src/components/views/EventsView/EventCreateModal.tsx`
- **Imports:** Add `import { CustomDropdown } from "@/components/ui/CustomDropdown";`
- **Activation Type:**
  ```tsx
  <CustomDropdown
    value={eventType}
    onChange={(newType) => {
      setEventType(newType);
      setEventSubtasks(
        getEventChecklistTemplate(newType).map((t, i) => ({
          id: `sub-init-${i}`,
          title: t,
          completed: false,
        }))
      );
    }}
    options={[
      { value: "Roadshow", label: "Mall Roadshow" },
      { value: "Launch", label: "Store Launch" },
      { value: "Booth", label: "Pop-up Booth" },
      { value: "Exhibition", label: "Exhibition / Expo" },
      { value: "Workshop", label: "Workshop" },
      { value: "Community", label: "Community Meetup" },
    ]}
    size="md"
    className="w-full"
    menuClassName="w-full min-w-full"
  />
  ```
- **Organizing Branch:**
  ```tsx
  <CustomDropdown
    value={eventBranchName}
    onChange={(val) => setEventBranchName(val)}
    options={
      branches.length > 0
        ? branches.map((b) => ({ value: b.name, label: b.name }))
        : [
            { value: "Jakarta Central", label: "Jakarta Central" },
            { value: "Surabaya West", label: "Surabaya West" },
            { value: "Bandung Dago", label: "Bandung Dago" },
            { value: "Bali Kuta", label: "Bali Kuta" },
          ]
    }
    size="md"
    searchable={branches.length >= 6}
    searchPlaceholder="Cari cabang..."
    className="w-full"
    menuClassName="w-full min-w-full"
  />
  ```
- **Associated Outlet:**
  ```tsx
  <CustomDropdown
    value={eventOutletId}
    onChange={(chosenId) => {
      setEventOutletId(chosenId);
      if (chosenId && !eventLocation) {
        const found = outlets.find((o) => o.id === chosenId);
        if (found) setEventLocation(found.name);
      }
    }}
    options={[
      { value: "", label: "-- None (Branch-Wide / Non-Store Event) --" },
      ...filteredOutlets.map((o) => ({
        value: o.id,
        label: formatOutletSelectLabel(o),
      })),
    ]}
    size="md"
    searchable
    searchPlaceholder="Cari kode atau nama outlet..."
    className="w-full"
    menuClassName="w-full min-w-full max-w-lg"
    placeholder="-- None (Branch-Wide / Non-Store Event) --"
  />
  ```
- **Person in Charge:**
  ```tsx
  <CustomDropdown
    value={picMemberId}
    onChange={(val) => {
      setPicMemberId(val);
      if (val !== "custom") {
        const m = members.find((mem) => mem.id === val);
        if (m) setEventPicName(m.name);
      }
    }}
    options={[
      ...members.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.email})`,
      })),
      { value: "custom", label: "Custom PIC Name..." },
    ]}
    size="md"
    searchable={members.length >= 6}
    searchPlaceholder="Cari anggota tim PIC..."
    className="w-full"
    menuClassName="w-full min-w-full max-w-md"
  />
  ```

### Step 4: Implement Changes in `ContentPostModal.tsx`
- **File:** `src/components/views/ContentPlannerView/ContentPostModal.tsx`
- **Imports:** Add `import { CustomDropdown } from "@/components/ui/CustomDropdown";`
- **Platform:**
  ```tsx
  <CustomDropdown<PostPlatform>
    value={platform}
    onChange={(val) => setPlatform(val)}
    options={Object.keys(PLATFORM_CONFIG).map((p) => ({
      value: p as PostPlatform,
      label: PLATFORM_CONFIG[p as PostPlatform].label,
    }))}
    size="md"
    className="w-full"
    menuClassName="w-full min-w-full"
  />
  ```
- **Format:**
  ```tsx
  <CustomDropdown<PostFormat>
    value={format}
    onChange={(val) => setFormat(val)}
    options={[
      { value: "reel", label: "Reel / Video" },
      { value: "carousel", label: "Carousel" },
      { value: "image", label: "Single Image" },
      { value: "story", label: "Story" },
      { value: "article", label: "Article / Press" },
      { value: "thread", label: "Thread" },
    ]}
    size="md"
    className="w-full"
    menuClassName="w-full min-w-full"
  />
  ```
- **Status:**
  ```tsx
  <CustomDropdown<PostStatus>
    value={status}
    onChange={(val) => setStatus(val)}
    options={[
      { value: "DRAFT", label: "DRAFT (Konsep)" },
      { value: "IN_REVIEW", label: "IN_REVIEW (Menunggu Review)" },
      { value: "REVISION", label: "REVISION (Perlu Revisi)" },
      { value: "APPROVED", label: "APPROVED (Disetujui)" },
      { value: "SCHEDULED", label: "SCHEDULED (Terjadwal)" },
      { value: "PUBLISHED", label: "PUBLISHED (Sudah Tayang)" },
      { value: "ARCHIVED", label: "ARCHIVED (Diarsipkan)" },
    ]}
    size="md"
    className="w-full"
    menuClassName="w-full min-w-full"
  />
  ```
- **Associated Outlet:**
  ```tsx
  <CustomDropdown
    value={outletId || ""}
    onChange={(val) => setOutletId?.(val)}
    options={[
      { value: "", label: "-- None (Brand / General Social Post) --" },
      ...outlets.map((o: OutletOption) => ({
        value: o.id,
        label: formatOutletSelectLabel(o),
      })),
    ]}
    size="md"
    searchable
    searchPlaceholder="Cari kode atau nama outlet..."
    className="w-full"
    menuClassName="w-full min-w-full max-w-lg"
    placeholder="-- None (Brand / General Social Post) --"
  />
  ```

---

## 4. Acceptance Criteria & Verification Commands

```bash
# 1. Run unit test for dropdown form standardization
node --test --import ./test/register-alias.mjs src/components/views/EventsView/eventDrawerCustomDropdown.test.ts

# 2. Run architectural invariants check (must report 64 paired specs)
npm run drift:check

# 3. Verify TypeScript build
npm run build:check

# 4. Verify full test suite
npm test
```



