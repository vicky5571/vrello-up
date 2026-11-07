import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Step 4 Location Verification Emoji Sanitization & Map Label Simplification (ADR-0081)", async (t) => {
  const step4Path = path.join(
    process.cwd(),
    "src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx"
  );
  const locationPickerPath = path.join(
    process.cwd(),
    "src/components/views/PlacementsView/LocationPicker.tsx"
  );

  const step4Content = fs.readFileSync(step4Path, "utf-8");
  const pickerContent = fs.readFileSync(locationPickerPath, "utf-8");

  await t.test("Step4LocationVerification.tsx contains 0 raw Unicode emojis", () => {
    assert.doesNotMatch(
      step4Content,
      /👆/,
      "Step4LocationVerification must not contain finger pointing emoji (👆)"
    );
    assert.doesNotMatch(
      step4Content,
      /🔒/,
      "Step4LocationVerification must not contain lock emoji (🔒)"
    );
  });

  await t.test("LocationPicker.tsx contains 0 raw Unicode emojis", () => {
    assert.doesNotMatch(
      pickerContent,
      /ℹ️|ℹ/,
      "LocationPicker must not contain info emoji"
    );
    assert.doesNotMatch(
      pickerContent,
      /⚠️/,
      "LocationPicker must not contain warning emoji (⚠️)"
    );
    assert.doesNotMatch(
      pickerContent,
      /📍/,
      "LocationPicker must not contain round pin emoji (📍)"
    );
    assert.doesNotMatch(
      pickerContent,
      /🗺️|🗺/,
      "LocationPicker must not contain map emoji (🗺️)"
    );
  });

  await t.test("Developer parentheticals '(Mode Hemat RAM/Data)' and '(Preview Radius 100m)' are completely eliminated", () => {
    assert.doesNotMatch(
      pickerContent,
      /\(Mode Hemat RAM\/Data\)/,
      "LocationPicker must not contain developer jargon '(Mode Hemat RAM/Data)'"
    );
    assert.doesNotMatch(
      pickerContent,
      /\(Preview Radius 100m\)/,
      "LocationPicker must not contain redundant parenthetical '(Preview Radius 100m)'"
    );
  });

  await t.test("Map toggle button renders clean, single-line action labels", () => {
    assert.match(
      pickerContent,
      /"Tutup Peta Interaktif"/,
      "LocationPicker must render simplified label 'Tutup Peta Interaktif'"
    );
    assert.match(
      pickerContent,
      /"Sesuaikan Titik di Peta"/,
      "LocationPicker must render simplified label 'Sesuaikan Titik di Peta'"
    );
    assert.match(
      pickerContent,
      /"Buka Peta Pinpoint \(Opsional\)"/,
      "LocationPicker must render label 'Buka Peta Pinpoint (Opsional)' without raw emoji"
    );
  });

  await t.test("Lucide SVG icons are rendered for mobile scroll guard and geofence badges", () => {
    // Scroll guard in Step4LocationVerification
    assert.match(
      step4Content,
      /<MousePointerClick\s+className=/,
      "Step4LocationVerification must render MousePointerClick icon"
    );
    assert.match(
      step4Content,
      /<Lock\s+className=/,
      "Step4LocationVerification must render Lock icon"
    );

    // Geofence badges in LocationPicker
    assert.match(
      pickerContent,
      /<Info\s+className=/,
      "LocationPicker must render Info icon for missing outlet coords"
    );
    assert.match(
      pickerContent,
      /<AlertTriangle\s+className=/,
      "LocationPicker must render AlertTriangle icon for geofence deviation"
    );
    assert.match(
      pickerContent,
      /<CheckCircle2\s+className=/,
      "LocationPicker must render CheckCircle2 icon when inside geofence"
    );
  });

  await t.test("Coordinator and file size limits are preserved", () => {
    const step4Lines = step4Content.split("\n").length;
    assert.ok(
      step4Lines <= 150,
      `Step4LocationVerification.tsx should stay <= 150 LOC, got ${step4Lines}`
    );
  });
});
