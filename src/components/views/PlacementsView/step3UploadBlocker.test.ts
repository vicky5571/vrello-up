import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Step 3 Photo Upload Navigation Blocker & State Lifting (ADR-0082)", async (t) => {
  const uploaderPath = path.join(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementPhotoUploader.tsx"
  );
  const step3Path = path.join(
    process.cwd(),
    "src/components/views/PlacementsView/wizard/Step3PhotoNotes.tsx"
  );
  const modalPath = path.join(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementFormModal.tsx"
  );
  const footerPath = path.join(
    process.cwd(),
    "src/components/views/PlacementsView/wizard/WizardFooter.tsx"
  );

  const uploaderContent = fs.readFileSync(uploaderPath, "utf-8");
  const step3Content = fs.readFileSync(step3Path, "utf-8");
  const modalContent = fs.readFileSync(modalPath, "utf-8");
  const footerContent = fs.readFileSync(footerPath, "utf-8");

  await t.test("PlacementPhotoUploader exposes onUploadingChange and triggers it in try/finally", () => {
    assert.match(
      uploaderContent,
      /onUploadingChange\?:\s*\(isUploading:\s*boolean\)\s*=>\s*void/,
      "PlacementPhotoUploaderProps must declare onUploadingChange callback"
    );
    assert.match(
      uploaderContent,
      /onUploadingChange\?\.?\(\s*true\s*\)/,
      "handleFiles must call onUploadingChange(true) when upload starts"
    );
    assert.match(
      uploaderContent,
      /finally\s*\{[\s\S]*?onUploadingChange\?\.?\(\s*false\s*\)/,
      "handleFiles must call onUploadingChange(false) inside a finally block"
    );
  });

  await t.test("Step3PhotoNotes forwards onUploadingChange to PlacementPhotoUploader", () => {
    assert.match(
      step3Content,
      /onUploadingChange\?:\s*\(isUploading:\s*boolean\)\s*=>\s*void/,
      "Step3PhotoNotesProps must declare onUploadingChange callback"
    );
    assert.match(
      step3Content,
      /<PlacementPhotoUploader[\s\S]*?onUploadingChange=\{onUploadingChange\}/,
      "Step3PhotoNotes must forward onUploadingChange to PlacementPhotoUploader"
    );
  });

  await t.test("PlacementFormModal manages isPhotoUploading state and passes to Step3 and WizardFooter", () => {
    assert.match(
      modalContent,
      /const\s*\[\s*isPhotoUploading\s*,\s*setIsPhotoUploading\s*\]\s*=\s*useState\(\s*false\s*\)/,
      "PlacementFormModal must declare isPhotoUploading state"
    );
    assert.match(
      modalContent,
      /<Step3PhotoNotes[\s\S]*?onUploadingChange=\{setIsPhotoUploading\}/,
      "PlacementFormModal must pass setIsPhotoUploading to Step3PhotoNotes"
    );
    assert.match(
      modalContent,
      /<WizardFooter[\s\S]*?isPhotoUploading=\{isPhotoUploading\}/,
      "PlacementFormModal must pass isPhotoUploading to WizardFooter"
    );
    const modalLines = modalContent.split("\n").length;
    assert.ok(
      modalLines <= 350,
      `PlacementFormModal.tsx exceeds limit: ${modalLines} lines (max 350)`
    );
  });

  await t.test("WizardFooter disables Lanjut, Simpan Cepat, and Kembali during photo upload", () => {
    assert.match(
      footerContent,
      /isPhotoUploading\?:\s*boolean/,
      "WizardFooterProps must accept isPhotoUploading optional boolean"
    );

    // Kembali disabled check
    assert.match(
      footerContent,
      /disabled=\{isSaving\s*\|\|\s*Boolean\(isPhotoUploading\)\}/,
      "Kembali button must be disabled when isPhotoUploading is true"
    );

    // Simpan Cepat disabled check
    assert.match(
      footerContent,
      /<button[\s\S]*?disabled=\{isSaving\s*\|\|\s*Boolean\(isPhotoUploading\)\}[\s\S]*?Simpan Cepat/,
      "Simpan Cepat button must be disabled when isPhotoUploading is true"
    );

    // Lanjut disabled check
    assert.match(
      footerContent,
      /<button[\s\S]*?key="wizard-btn-next"[\s\S]*?disabled=\{!canAdvance\s*\|\|\s*isSaving\s*\|\|\s*Boolean\(isPhotoUploading\)\}/,
      "Lanjut button must be disabled when isPhotoUploading is true"
    );
  });

  await t.test("WizardFooter preserves Batal button as active escape hatch during photo upload", () => {
    // Batal button should NOT check isPhotoUploading
    assert.match(
      footerContent,
      /<button[\s\S]*?onClick=\{onClose\}[\s\S]*?disabled=\{isSaving\}[\s\S]*?>[\s\S]*?Batal/,
      "Batal button must remain enabled during upload and only disabled by isSaving"
    );
    assert.doesNotMatch(
      footerContent,
      /<button[^>]*?onClick=\{onClose\}[^>]*?isPhotoUploading/,
      "Batal button must not be disabled by isPhotoUploading"
    );
  });
});
