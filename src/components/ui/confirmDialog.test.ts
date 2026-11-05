import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("ConfirmDialog Component Architecture Invariants (ADR-0040)", () => {
  const componentPath = path.resolve(
    process.cwd(),
    "src/components/ui/ConfirmDialog.tsx"
  );

  it("verifies ConfirmDialog.tsx exists and wraps Modal primitive", () => {
    assert.ok(
      fs.existsSync(componentPath),
      "src/components/ui/ConfirmDialog.tsx must exist"
    );
    const content = fs.readFileSync(componentPath, "utf-8");

    assert.ok(
      content.includes('import { Modal } from "./Modal"') ||
      content.includes('import { Modal } from "@/components/ui/Modal"'),
      "ConfirmDialog must wrap the native <dialog> Modal primitive"
    );
    assert.ok(
      content.includes("export function ConfirmDialog"),
      "ConfirmDialog must export ConfirmDialog component"
    );
    assert.ok(
      content.includes("export interface ConfirmDialogProps"),
      "ConfirmDialog must export ConfirmDialogProps interface"
    );
  });

  it("verifies ConfirmDialog supports danger variant and tactile icons", () => {
    if (!fs.existsSync(componentPath)) return;
    const content = fs.readFileSync(componentPath, "utf-8");

    assert.ok(
      content.includes("AlertTriangle"),
      "ConfirmDialog must import AlertTriangle for danger variant"
    );
    assert.ok(
      content.includes("bg-rose-600"),
      "ConfirmDialog danger variant must apply bg-rose-600 to confirm button"
    );
    assert.ok(
      content.includes("Loader2"),
      "ConfirmDialog must import Loader2 for asynchronous loading state"
    );
    assert.ok(
      content.includes("animate-spin"),
      "ConfirmDialog must apply animate-spin class to Loader2 when isLoading is true"
    );
  });

  it("verifies ConfirmDialog renders contextual itemDetails card and disabled button guard", () => {
    if (!fs.existsSync(componentPath)) return;
    const content = fs.readFileSync(componentPath, "utf-8");

    assert.ok(
      content.includes("itemDetails"),
      "ConfirmDialog must accept and render itemDetails"
    );
    assert.ok(
      content.includes("disabled={isLoading}"),
      "Action buttons must be disabled when isLoading is true"
    );
  });
});
