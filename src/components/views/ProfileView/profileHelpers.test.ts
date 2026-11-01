import test from "node:test";
import assert from "node:assert/strict";
import {
  formatBranchBadges,
  validatePasswordForm,
  sanitizeAvatarUrl,
} from "./profileHelpers";

const mockBranches = [
  { id: "branch-1", name: "Jakarta Selatan" },
  { id: "branch-2", name: "Bandung" },
  { id: "branch-3", name: "Surabaya" },
];

test("formatBranchBadges returns national scope label for admin role", () => {
  const result = formatBranchBadges([], mockBranches, "admin");
  assert.deepEqual(result, ["Semua Cabang (Nasional)"]);

  const uppercaseResult = formatBranchBadges(["branch-1"], mockBranches, "ADMIN");
  assert.deepEqual(uppercaseResult, ["Semua Cabang (Nasional)"]);
});

test("formatBranchBadges maps assignedBranchIds to corresponding branch names", () => {
  const result = formatBranchBadges(["branch-1", "branch-3"], mockBranches, "supervisor");
  assert.deepEqual(result, ["Jakarta Selatan", "Surabaya"]);
});

test("formatBranchBadges falls back to raw ID when branch is not in directory", () => {
  const result = formatBranchBadges(["branch-unknown"], mockBranches, "staff");
  assert.deepEqual(result, ["branch-unknown"]);
});

test("formatBranchBadges returns fallback when no branches are assigned", () => {
  const emptyResult = formatBranchBadges([], mockBranches, "staff");
  assert.deepEqual(emptyResult, ["Belum Ada Penugasan Cabang"]);

  const nullResult = formatBranchBadges(undefined as unknown as string[], mockBranches, "viewer");
  assert.deepEqual(nullResult, ["Belum Ada Penugasan Cabang"]);
});

test("validatePasswordForm passes when all fields are valid and match", () => {
  const result = validatePasswordForm("oldPass123", "newPass456", "newPass456");
  assert.deepEqual(result, { valid: true });
});

test("validatePasswordForm rejects missing current password", () => {
  const result = validatePasswordForm("", "newPass456", "newPass456");
  assert.equal(result.valid, false);
  assert.match(result.error ?? "", /saat ini/);
});

test("validatePasswordForm rejects new password shorter than 8 characters", () => {
  const result = validatePasswordForm("oldPass123", "short", "short");
  assert.equal(result.valid, false);
  assert.match(result.error ?? "", /minimal 8 karakter/);
});

test("validatePasswordForm rejects mismatched confirmation password", () => {
  const result = validatePasswordForm("oldPass123", "newPass456", "different789");
  assert.equal(result.valid, false);
  assert.match(result.error ?? "", /tidak cocok/);
});

test("sanitizeAvatarUrl preserves valid http(s) and data URI strings", () => {
  assert.equal(
    sanitizeAvatarUrl("  https://images.unsplash.com/photo-1  "),
    "https://images.unsplash.com/photo-1",
  );
  assert.equal(
    sanitizeAvatarUrl("data:image/webp;base64,abc123=="),
    "data:image/webp;base64,abc123==",
  );
});

test("sanitizeAvatarUrl returns null for invalid or empty values", () => {
  assert.equal(sanitizeAvatarUrl(""), null);
  assert.equal(sanitizeAvatarUrl(null), null);
  assert.equal(sanitizeAvatarUrl(undefined), null);
  assert.equal(sanitizeAvatarUrl("   "), null);
  assert.equal(sanitizeAvatarUrl("javascript:alert(1)"), null);
});
