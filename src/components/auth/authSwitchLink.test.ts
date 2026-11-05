import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("AuthSwitchLink Component Contract & Invariants (ADR-0044)", async (t) => {
  const componentPath = path.join(
    process.cwd(),
    "src/components/auth/AuthSwitchLink.tsx"
  );
  assert.ok(fs.existsSync(componentPath), "AuthSwitchLink.tsx must exist");
  const content = fs.readFileSync(componentPath, "utf-8");

  await t.test("exports AuthSwitchLink component function and props interface", () => {
    assert.match(
      content,
      /export\s+interface\s+AuthSwitchLinkProps/,
      "Must export AuthSwitchLinkProps interface"
    );
    assert.match(
      content,
      /export\s+function\s+AuthSwitchLink/,
      "Must export AuthSwitchLink component function"
    );
  });

  await t.test("uses React useTransition and Next.js useRouter for concurrent navigation", () => {
    assert.match(
      content,
      /useTransition/,
      "Must use React useTransition"
    );
    assert.match(
      content,
      /useRouter/,
      "Must use Next.js useRouter"
    );
    assert.match(
      content,
      /router\.push\(href\)/,
      "Must navigate via router.push(href) inside transition"
    );
  });

  await t.test("renders Loader2 spinner and blocks pointer events during transition", () => {
    assert.match(
      content,
      /Loader2/,
      "Must render Loader2 spinner during pending transition"
    );
    assert.match(
      content,
      /pointer-events-none/,
      "Must block pointer events when transition is pending"
    );
    assert.match(
      content,
      /disabled=\{isPending\}/,
      "Must disable button when transition is pending"
    );
  });
});

test("LoginForm and RegisterForm AuthSwitchLink Integration Invariants", async (t) => {
  const loginPath = path.join(process.cwd(), "src/components/auth/LoginForm.tsx");
  const registerPath = path.join(process.cwd(), "src/components/auth/RegisterForm.tsx");

  assert.ok(fs.existsSync(loginPath), "LoginForm.tsx must exist");
  assert.ok(fs.existsSync(registerPath), "RegisterForm.tsx must exist");

  const loginContent = fs.readFileSync(loginPath, "utf-8");
  const registerContent = fs.readFileSync(registerPath, "utf-8");

  await t.test("LoginForm integrates AuthSwitchLink targeting /register", () => {
    assert.match(
      loginContent,
      /import\s*\{\s*AuthSwitchLink\s*\}\s*from\s*["']\.\/AuthSwitchLink["']/,
      "LoginForm must import AuthSwitchLink"
    );
    assert.match(
      loginContent,
      /<AuthSwitchLink[\s\S]*href="\/register"[\s\S]*label="Daftar sekarang"[\s\S]*loadingLabel="Membuka pendaftaran\.\.\."/,
      "LoginForm must render AuthSwitchLink targeting /register"
    );
  });

  await t.test("RegisterForm integrates AuthSwitchLink targeting /login", () => {
    assert.match(
      registerContent,
      /import\s*\{\s*AuthSwitchLink\s*\}\s*from\s*["']\.\/AuthSwitchLink["']/,
      "RegisterForm must import AuthSwitchLink"
    );
    assert.match(
      registerContent,
      /<AuthSwitchLink[\s\S]*href="\/login"[\s\S]*label="Masuk sekarang"[\s\S]*loadingLabel="Membuka halaman masuk\.\.\."/,
      "RegisterForm must render AuthSwitchLink targeting /login"
    );
  });
});
