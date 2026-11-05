import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Registration Route Branch Validation Invariants (ADR-0043)", async (t) => {
  const routePath = path.join(
    process.cwd(),
    "src/app/api/auth/register/route.ts"
  );
  assert.ok(fs.existsSync(routePath), "Register route file must exist");
  const routeContent = fs.readFileSync(routePath, "utf-8");

  await t.test("verifies registerSchema mandates branchId", () => {
    assert.match(
      routeContent,
      /branchId:\s*z\.string\(\)\.min\(1/,
      "registerSchema must validate branchId as a required non-empty string"
    );
  });

  await t.test("verifies branch existence check in Prisma before user creation", () => {
    assert.match(
      routeContent,
      /prisma\.branch\.findUnique/,
      "Must check branch existence in prisma.branch"
    );
  });

  await t.test("verifies assignedBranchIds array initialized with branchId", () => {
    assert.match(
      routeContent,
      /assignedBranchIds:\s*\[branchId\]/,
      "Must initialize user assignedBranchIds with the selected branchId"
    );
  });
});

test("Register Form CustomDropdown Invariants (ADR-0043)", async (t) => {
  const formPath = path.join(
    process.cwd(),
    "src/components/auth/RegisterForm.tsx"
  );
  assert.ok(fs.existsSync(formPath), "RegisterForm.tsx must exist");
  const formContent = fs.readFileSync(formPath, "utf-8");

  await t.test("verifies CustomDropdown imported and mounted for branch selection", () => {
    assert.match(
      formContent,
      /import\s*\{\s*CustomDropdown\s*\}\s*from\s*["']@\/components\/ui\/CustomDropdown["']/,
      "Must import CustomDropdown"
    );
    assert.match(
      formContent,
      /<CustomDropdown<string>/,
      "Must mount typed CustomDropdown<string> for branch selection"
    );
    assert.match(
      formContent,
      /searchable=\{true\}/,
      "Branch CustomDropdown must have searchable enabled"
    );
  });

  await t.test("verifies client validation includes branchId check", () => {
    assert.match(
      formContent,
      /errors\.branchId\s*=\s*["']Cabang penugasan wajib dipilih\.["']/,
      "Must enforce client validation error when branchId is omitted"
    );
  });
});

