import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { findMemberForPic } from "@/lib/marcom/eventChecklist";
import type { User } from "@/types";

describe("Content Planner Card Item Styling Parity with Field Events", () => {
  const mockUsers: User[] = [
    {
      id: "u-1",
      name: "Rian Maulana",
      email: "rian@example.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      role: "MEMBER",
      brand: "TRI",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "u-2",
      name: "Siti Rahma",
      email: "siti@example.com",
      role: "ADMIN",
      brand: "IM3",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  it("verifies findMemberForPic correctly resolves user with avatar for Content Planner cards", () => {
    const member = findMemberForPic(mockUsers, "Rian Maulana");
    assert.ok(member, "Member should be found by name");
    assert.equal(member.avatar, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100");

    const fallbackMember = findMemberForPic(mockUsers, "u-2");
    assert.ok(fallbackMember, "Member should be found by ID");
    assert.equal(fallbackMember.avatar, undefined);

    const unknownMember = findMemberForPic(mockUsers, "Unknown");
    assert.equal(unknownMember, undefined);
  });

  it("verifies ContentBoardCard.tsx moves release date up below title and formats PIC with AppImage avatar", () => {
    const cardPath = path.resolve(
      process.cwd(),
      "src/components/views/ContentPlannerView/ContentBoardCard.tsx"
    );
    const content = fs.readFileSync(cardPath, "utf-8");

    // 1. Release date moved up below title
    assert.ok(
      content.includes("Release Date moved up below title"),
      "ContentBoardCard must have section for release date below title"
    );
    assert.ok(
      content.includes("text-blue-500"),
      "Calendar icon must use text-blue-500 matching Field Events"
    );

    // 2. PIC with AppImage profile photo and name
    assert.ok(
      content.includes("findMemberForPic"),
      "ContentBoardCard must resolve PIC member via findMemberForPic"
    );
    assert.ok(
      content.includes("<AppImage"),
      "ContentBoardCard must render AppImage for member avatar"
    );
    assert.ok(
      content.includes("sizes=\"avatar\""),
      "ContentBoardCard must use sizes avatar"
    );
    assert.ok(
      content.includes("containerClassName=\"w-4 h-4 rounded-full bg-slate-200 shrink-0\""),
      "ContentBoardCard must use 16x16 circular container for avatar"
    );
  });

  it("verifies ContentPlannerView.tsx cards view moves release date up below title and formats PIC with AppImage avatar", () => {
    const viewPath = path.resolve(
      process.cwd(),
      "src/components/views/ContentPlannerView/ContentPlannerView.tsx"
    );
    const content = fs.readFileSync(viewPath, "utf-8");

    // 1. Release date moved up below title
    assert.ok(
      content.includes("Release Date moved up below title"),
      "ContentPlannerView cards view must have section for release date below title"
    );

    // 2. PIC with AppImage profile photo and name in footer
    assert.ok(
      content.includes("const picMember = findMemberForPic(members, post.picName);"),
      "ContentPlannerView cards view must resolve PIC member via findMemberForPic"
    );
    assert.ok(
      content.includes("<AppImage"),
      "ContentPlannerView cards view must render AppImage for member avatar"
    );
    assert.ok(
      content.includes("containerClassName=\"w-4 h-4 rounded-full bg-slate-200 shrink-0\""),
      "ContentPlannerView cards view must use 16x16 circular container for avatar"
    );
  });
});

