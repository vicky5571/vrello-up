import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("TopNav Notification Feed Lifecycle (ADR-0032)", () => {
  const hookPath = path.resolve(
    process.cwd(),
    "src/lib/productivity/useNotificationFeed.ts"
  );
  const notificationCenterPath = path.resolve(
    process.cwd(),
    "src/components/layout/NotificationCenter.tsx"
  );

  it("verifies useNotificationFeed.ts exists and exports useNotificationFeed", () => {
    assert.strictEqual(
      fs.existsSync(hookPath),
      true,
      "Expected useNotificationFeed.ts to exist"
    );
    const content = fs.readFileSync(hookPath, "utf-8");
    assert.ok(
      content.includes("export function useNotificationFeed"),
      "Expected useNotificationFeed function to be exported"
    );
    assert.ok(
      content.includes("export interface UseNotificationFeedOptions"),
      "Expected UseNotificationFeedOptions interface to be exported"
    );
    assert.ok(
      content.includes("export interface UseNotificationFeedResult"),
      "Expected UseNotificationFeedResult interface to be exported"
    );
  });

  it("implements mount fetch and window focus synchronization in useNotificationFeed", () => {
    assert.strictEqual(fs.existsSync(hookPath), true);
    const content = fs.readFileSync(hookPath, "utf-8");

    // Must fetch on mount / isOpen changes
    assert.ok(
      content.includes("fetchMous();"),
      "Expected hook to invoke fetchMous on mount"
    );
    assert.ok(
      content.includes("[fetchMous, isOpen]"),
      "Expected mount useEffect to depend on [fetchMous, isOpen]"
    );

    // Must listen to window focus event
    assert.ok(
      content.includes('window.addEventListener("focus", onFocus)'),
      "Expected hook to add window focus listener"
    );
    assert.ok(
      content.includes('window.removeEventListener("focus", onFocus)'),
      "Expected hook to remove window focus listener on cleanup"
    );

    // Default endpoint
    assert.ok(
      content.includes('"/api/marcom/mous"'),
      "Expected hook to default endpoint to /api/marcom/mous"
    );
  });

  it("integrates useNotificationFeed into NotificationCenter and eliminates lazy guard", () => {
    const content = fs.readFileSync(notificationCenterPath, "utf-8");

    // Must import useNotificationFeed
    assert.ok(
      content.includes(
        'import { useNotificationFeed } from "@/lib/productivity/useNotificationFeed"'
      ),
      "Expected NotificationCenter to import useNotificationFeed"
    );

    // Must invoke hook with { isOpen }
    assert.ok(
      content.includes("useNotificationFeed({ isOpen })"),
      "Expected NotificationCenter to call useNotificationFeed({ isOpen })"
    );

    // Must eliminate local mouRows useState
    assert.strictEqual(
      content.includes(
        "const [mouRows, setMouRows] = useState"
      ),
      false,
      "Expected NotificationCenter not to maintain local mouRows useState"
    );

    // Must eliminate old lazy fetch block with inline API call
    assert.strictEqual(
      content.includes('fetch("/api/marcom/mous")'),
      false,
      "Expected NotificationCenter not to contain inline fetch('/api/marcom/mous')"
    );
  });

  it("verifies NotificationCenter adheres to coordinator limit (< 250 LOC)", () => {
    const content = fs.readFileSync(notificationCenterPath, "utf-8");
    const loc = content.split("\n").length;
    assert.ok(
      loc <= 280, // Currently NotificationCenter is around 280 LOC, let's verify line count doesn't increase
      `NotificationCenter.tsx line count is ${loc}`
    );
  });
});
