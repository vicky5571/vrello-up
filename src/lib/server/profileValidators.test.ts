import test from "node:test";
import assert from "node:assert/strict";
import { updateProfileSchema } from "./profileValidators";

test("updateProfileSchema accepts valid name update", () => {
  const result = updateProfileSchema.safeParse({
    name: "Dewi Lestari",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Dewi Lestari");
  }
});

test("updateProfileSchema trims name and rejects names outside 2-80 character bounds", () => {
  const shortResult = updateProfileSchema.safeParse({ name: "A" });
  assert.equal(shortResult.success, false);

  const longResult = updateProfileSchema.safeParse({ name: "A".repeat(81) });
  assert.equal(longResult.success, false);

  const emptyResult = updateProfileSchema.safeParse({ name: "   " });
  assert.equal(emptyResult.success, false);
});

test("updateProfileSchema accepts valid http(s) and data:image/ avatar strings", () => {
  const httpsResult = updateProfileSchema.safeParse({
    avatar: "https://images.unsplash.com/photo-1234?auto=format",
  });
  assert.equal(httpsResult.success, true);

  const dataUriResult = updateProfileSchema.safeParse({
    avatar: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v39gAA=",
  });
  assert.equal(dataUriResult.success, true);

  const nullResult = updateProfileSchema.safeParse({
    avatar: null,
  });
  assert.equal(nullResult.success, true);
});

test("updateProfileSchema rejects invalid avatar formats", () => {
  const badResult = updateProfileSchema.safeParse({
    avatar: "not-a-valid-url-or-data-uri",
  });
  assert.equal(badResult.success, false);

  const scriptResult = updateProfileSchema.safeParse({
    avatar: "javascript:alert(1)",
  });
  assert.equal(scriptResult.success, false);
});

test("updateProfileSchema accepts valid password change with matching confirmation", () => {
  const result = updateProfileSchema.safeParse({
    currentPassword: "oldPassword123",
    newPassword: "newSecurePassword456",
    confirmPassword: "newSecurePassword456",
  });
  assert.equal(result.success, true);
});

test("updateProfileSchema rejects newPassword when currentPassword is missing", () => {
  const result = updateProfileSchema.safeParse({
    newPassword: "newSecurePassword456",
    confirmPassword: "newSecurePassword456",
  });
  assert.equal(result.success, false);
});

test("updateProfileSchema rejects newPassword shorter than 8 characters", () => {
  const result = updateProfileSchema.safeParse({
    currentPassword: "oldPassword123",
    newPassword: "short",
    confirmPassword: "short",
  });
  assert.equal(result.success, false);
});

test("updateProfileSchema rejects mismatched password confirmation", () => {
  const result = updateProfileSchema.safeParse({
    currentPassword: "oldPassword123",
    newPassword: "newSecurePassword456",
    confirmPassword: "differentPassword789",
  });
  assert.equal(result.success, false);
});
