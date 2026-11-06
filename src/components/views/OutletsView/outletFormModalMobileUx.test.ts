import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const modalPath = path.resolve(
  process.cwd(),
  "src/components/views/OutletsView/OutletFormModal.tsx"
);
const globalsPath = path.resolve(process.cwd(), "src/app/globals.css");

function readGpsBlock(): string {
  const source = fs.readFileSync(modalPath, "utf-8");
  const start = source.indexOf("{/* GPS Coordinates Picker Block */}");
  const end = source.indexOf('id="outlet-quick-paste"');
  assert.ok(start >= 0 && end > start, "GPS picker block must exist in OutletFormModal");
  return source.slice(start, end);
}

describe("OutletFormModal mobile GPS layout", () => {
  it("keeps the View on Maps link inside the header row on desktop", () => {
    const gpsBlock = readGpsBlock();
    assert.ok(
      gpsBlock.includes("hidden sm:inline-flex"),
      "Desktop View on Maps link must stay in the GPS header row and hide on mobile"
    );
  });

  it("renders a dedicated mobile-only View on Maps row below the header", () => {
    const gpsBlock = readGpsBlock();
    assert.equal(
      (gpsBlock.match(/View on Maps/g) ?? []).length,
      2,
      "Expected one desktop link and one mobile link"
    );
    assert.ok(
      gpsBlock.includes("sm:hidden"),
      "Mobile View on Maps link must be visible only below the sm breakpoint"
    );
  });

  it("places the mobile link after the GPS header row", () => {
    const gpsBlock = readGpsBlock();
    const headerTitleIndex = gpsBlock.indexOf("GPS Coordinates");
    const desktopLinkIndex = gpsBlock.indexOf("hidden sm:inline-flex");
    const mobileLinkIndex = gpsBlock.indexOf("sm:hidden");

    assert.ok(headerTitleIndex >= 0, "GPS header title must exist");
    assert.ok(desktopLinkIndex > headerTitleIndex, "Desktop link must be in the header row");
    assert.ok(mobileLinkIndex > desktopLinkIndex, "Mobile link must render after the header row");
  });

  it("prevents the GPS title from wrapping on narrow phones", () => {
    const gpsBlock = readGpsBlock();
    assert.ok(
      gpsBlock.includes("whitespace-nowrap"),
      "GPS header title must not wrap into multiple lines on mobile"
    );
  });
});

describe("GPS toast touch resilience", () => {
  it("disables pointer interaction on the GPS toast so taps pass through to the modal", () => {
    const source = fs.readFileSync(modalPath, "utf-8");
    assert.ok(
      source.includes("const GPS_TOAST_ID"),
      "GPS toast must use a stable identifier"
    );
    assert.ok(
      source.includes('pointerEvents: "none"'),
      "GPS toast must ignore pointer events to prevent Sonner hover-pause on touch"
    );
  });

  it("dismisses the GPS toast when the modal unmounts", () => {
    const source = fs.readFileSync(modalPath, "utf-8");
    assert.ok(
      source.includes("toast.dismiss(GPS_TOAST_ID)"),
      "GPS toast must be dismissed on modal unmount"
    );
  });

  it("makes the Sonner toaster container pass-through while keeping toasts interactive", () => {
    const css = fs.readFileSync(globalsPath, "utf-8");
    assert.match(
      css,
      /\[data-sonner-toaster\]\s*\{[^}]*pointer-events:\s*none/,
      "Toaster container must not capture taps in its empty area"
    );
    assert.match(
      css,
      /\[data-sonner-toast\]\s*\{[^}]*pointer-events:\s*auto/,
      "Individual toasts must remain interactive by default"
    );
  });
});
