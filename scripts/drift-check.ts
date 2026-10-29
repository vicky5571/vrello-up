#!/usr/bin/env tsx
/**
 * drift-check.ts — Architectural invariant verifier for vrello-up
 *
 * Checks:
 *  1. No workspace-scoped patterns in src/ (single-tenant invariant)
 *  2. No inline domain type exports outside src/types/index.ts (SSOT invariant)
 *  3. Coordinator files under 250 LOC (god-file invariant)
 *  4. Every spec file has a matching plan file (spec-plan pairing invariant)
 *
 * Exit 0 → clean. Exit 1 → drift detected.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname ?? process.cwd(), "..");

function rg(pattern: string, dir: string, extra = ""): string {
  try {
    return execSync(
      `grep -rn --include="*.ts" --include="*.tsx" "${pattern}" ${extra} ${dir}`,
      { encoding: "utf8", cwd: ROOT }
    ).trim();
  } catch {
    return ""; // grep exits 1 when no match → treat as empty
  }
}

function countLines(filePath: string): number {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) return 0;
  return fs.readFileSync(abs, "utf8").split("\n").length;
}

function exists(filePath: string): boolean {
  return fs.existsSync(path.join(ROOT, filePath));
}

let failures = 0;

function fail(message: string): void {
  console.error(`  ❌ ${message}`);
  failures++;
}

function pass(message: string): void {
  console.log(`  ✅ ${message}`);
}

function section(title: string): void {
  console.log(`\n── ${title}`);
}

// ---------------------------------------------------------------------------
// Check 1: No workspace-scoped patterns (single-tenant invariant)
// ---------------------------------------------------------------------------

section("Check 1: Single-tenant invariant (no workspace-scoped patterns)");

const WORKSPACE_PATTERNS = [
  "requireWorkspaceAccess",
  "activeWorkspaceId",
  "switchWorkspace",
  "workspaces\\.find.*activeWorkspaceId",
];

for (const pattern of WORKSPACE_PATTERNS) {
  const result = rg(pattern, "src/");
  if (result) {
    fail(`Found forbidden workspace pattern "${pattern}":\n${result}`);
  } else {
    pass(`No "${pattern}" in src/`);
  }
}

// workspaceId is only flagged if used in non-migration TS/TSX files
const workspaceIdResult = rg("workspaceId", "src/");
if (workspaceIdResult) {
  fail(`Found "workspaceId" references in src/ (single-tenant violation):\n${workspaceIdResult}`);
} else {
  pass(`No "workspaceId" in src/`);
}

// ---------------------------------------------------------------------------
// Check 2: SSOT — canonical domain entity types must not be redeclared outside src/types/index.ts
//
// We check for exact canonical names only (Task, Placement, Mou, Outlet, Branch, Space, List,
// Folder, Subtask). Props interfaces (TaskDrawerProps), slice types (TaskSlice), helper
// types (TaskLike, PlacementLike), and sub-types (Outlet360Data) are legitimate and excluded.
// Pattern: "^export interface <ExactName> {" or "^interface <ExactName> {"
// ---------------------------------------------------------------------------

section("Check 2: SSOT — canonical domain entity interfaces must not be redeclared outside src/types/index.ts");

// Exact canonical names that must only be defined in src/types/index.ts
const CANONICAL_NAMES = ["Task", "Placement", "Mou", "Outlet", "Branch", "Space", "Folder", "Subtask"];
const SSOT_VIOLATIONS: string[] = [];

for (const name of CANONICAL_NAMES) {
  // Match "export interface Task {" or "interface Task {" but NOT "interface TaskSlice", "interface TaskLike", etc.
  // Use -P (Perl regex) for the alternation, fallback to two separate greps
  const patternExact = `interface ${name} `;
  const raw = rg(patternExact, "src/", `--exclude-dir=types`);
  // Filter: only lines where the word boundary is respected (name followed by space then {)
  const lines = raw
    .split("\n")
    .filter((l) => new RegExp(`\\binterface ${name}\\s*\\{`).test(l));
  if (lines.length > 0) {
    SSOT_VIOLATIONS.push(`Canonical interface "${name}" redeclared outside src/types/index.ts:\n${lines.join("\n")}`);
  }
}

if (SSOT_VIOLATIONS.length > 0) {
  for (const v of SSOT_VIOLATIONS) fail(v);
} else {
  pass("No canonical domain entity interfaces redeclared outside src/types/index.ts");
}

// ---------------------------------------------------------------------------
// Check 3: Coordinator file LOC limits (≤250 lines)
// ---------------------------------------------------------------------------

section("Check 3: Coordinator file size (≤250 LOC)");

// src/app/page.tsx is currently 442 LOC — known pre-existing violation.
// Tracked for refactor but excluded from hard-fail until a dedicated plan exists.
// See: Strangler Pattern — extract view coordinator out of page.tsx.
const COORDINATOR_FILES = [
  { path: "src/lib/store/useWorkspaceStore.ts", hardFail: true },
  { path: "src/app/page.tsx", hardFail: false }, // known violation, warn only
  { path: "src/app/layout.tsx", hardFail: true },
];

for (const { path: file, hardFail } of COORDINATOR_FILES) {
  const loc = countLines(file);
  if (!exists(file)) {
    pass(`${file} — not found (skipped)`);
    continue;
  }
  if (loc > 250) {
    if (hardFail) {
      fail(`${file} is ${loc} LOC (limit: 250) — apply Strangler Pattern`);
    } else {
      console.log(`  ⚠️  ${file} is ${loc} LOC (limit: 250) — known violation, warn only`);
    }
  } else {
    pass(`${file} — ${loc} LOC (OK)`);
  }
}

// ---------------------------------------------------------------------------
// Check 4: Spec-plan pairing
// ---------------------------------------------------------------------------

section("Check 4: Spec-plan pairing");

const SPECS_DIR = path.join(ROOT, "docs/superpowers/specs");
const PLANS_DIR = path.join(ROOT, "docs/superpowers/plans");

if (!fs.existsSync(SPECS_DIR) || !fs.existsSync(PLANS_DIR)) {
  fail("docs/superpowers/specs/ or docs/superpowers/plans/ directory missing");
} else {
  const specFiles = fs
    .readdirSync(SPECS_DIR)
    .filter((f) => f.endsWith("-design.md"));

  const planFiles = fs.readdirSync(PLANS_DIR).filter((f) => f.endsWith(".md"));

  let pairingOk = true;
  for (const spec of specFiles) {
    // spec: YYYY-MM-DD-<name>-design.md
    // Accepted plan names: YYYY-MM-DD-<name>.md OR YYYY-MM-DD-<name>-plan.md
    const base = spec.replace(/-design\.md$/, "");
    const candidates = [`${base}.md`, `${base}-plan.md`];
    const matched = candidates.some((c) => planFiles.includes(c));
    if (!matched) {
      fail(`Spec "${spec}" has no matching plan (expected: ${candidates.join(" or ")})`);
      pairingOk = false;
    }
  }
  if (pairingOk) pass(`All ${specFiles.length} spec(s) have matching plan files`);
}

// ---------------------------------------------------------------------------
// Check 5: Required documentation artifacts exist
// ---------------------------------------------------------------------------

section("Check 5: Required documentation artifacts");

const REQUIRED_FILES = [
  "AGENTS.md",
  "docs/SESSION_STATE.md",
  "docs/architecture-system-invariants.md",
  "docs/superpowers/specs/README.md",
  "docs/superpowers/plans/README.md",
  "CHANGELOG.md",
];

for (const file of REQUIRED_FILES) {
  if (exists(file)) {
    pass(`${file} — exists`);
  } else {
    fail(`${file} — MISSING`);
  }
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

console.log("\n" + "─".repeat(60));
if (failures === 0) {
  console.log("✅ No drift detected. All invariants pass.");
  process.exit(0);
} else {
  console.error(`\n❌ Drift detected — ${failures} violation(s). Fix before proceeding.`);
  process.exit(1);
}
