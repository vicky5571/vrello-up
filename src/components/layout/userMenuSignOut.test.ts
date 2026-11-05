import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("UserMenuDropdown sign-out contracts & invariants", async (t) => {
  const filePath = path.resolve(process.cwd(), "src/components/layout/UserMenuDropdown.tsx");
  assert.ok(fs.existsSync(filePath), "UserMenuDropdown.tsx must exist");
  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("uses hard browser redirect to /login on sign-out", () => {
    assert.ok(
      content.includes('window.location.href = "/login"') ||
      content.includes("window.location.href = '/login'"),
      "Must execute hard browser navigation to /login"
    );
  });

  await t.test("does not use router.push for sign-out navigation", () => {
    assert.ok(
      !content.includes('router.push("/login")') && !content.includes("router.push('/login')"),
      "Must not rely on soft client-side router navigation for sign-out"
    );
  });

  await t.test("renders Loader2 spinning indicator during active signout", () => {
    assert.ok(
      content.includes("<Loader2"),
      "Must render Loader2 spinner when isLoggingOut is active"
    );
    assert.ok(
      content.includes("isLoggingOut"),
      "Must track isLoggingOut state"
    );
  });
});
