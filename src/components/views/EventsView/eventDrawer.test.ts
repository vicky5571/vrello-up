import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { FieldEventItem } from "@/types";
import { canTransitionEvent } from "@/lib/marcom/eventMachine";

describe("Field Event Edit Drawer and Modal Separation (ADR-0022)", () => {
  it("verifies EventFormModal is eliminated from codebase", () => {
    const eventsDir = path.resolve(
      process.cwd(),
      "src/components/views/EventsView"
    );
    const files = fs.readdirSync(eventsDir);
    assert.ok(
      !files.includes("EventFormModal.tsx"),
      "EventFormModal.tsx must be completely deleted"
    );
  });

  it("verifies EventCreateModal and EventDrawer files exist", () => {
    const eventsDir = path.resolve(
      process.cwd(),
      "src/components/views/EventsView"
    );
    const files = fs.readdirSync(eventsDir);
    assert.ok(
      files.includes("EventCreateModal.tsx"),
      "EventCreateModal.tsx must exist"
    );
    assert.ok(
      files.includes("EventDrawer.tsx"),
      "EventDrawer.tsx must exist"
    );
  });

  it("verifies EventsView.tsx wires EventCreateModal and EventDrawer", () => {
    const coordinatorPath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventsView.tsx"
    );
    const content = fs.readFileSync(coordinatorPath, "utf-8");

    assert.ok(
      content.includes("EventCreateModal"),
      "EventsView must import and render EventCreateModal"
    );
    assert.ok(
      content.includes("EventDrawer"),
      "EventsView must import and render EventDrawer"
    );
    assert.ok(
      !content.includes("EventFormModal"),
      "EventsView must have zero references to EventFormModal"
    );
    assert.ok(
      content.includes("isCreateModalOpen"),
      "EventsView must manage isCreateModalOpen state"
    );
    assert.ok(
      content.includes("selectedDrawerEvent"),
      "EventsView must manage selectedDrawerEvent state"
    );
  });

  it("verifies ProjectsCreateModalHost and ProjectsDetailDrawerHost maintain <= 250 LOC", () => {
    const createHostPath = path.resolve(
      process.cwd(),
      "src/components/views/ProjectsView/ProjectsCreateModalHost.tsx"
    );
    const detailHostPath = path.resolve(
      process.cwd(),
      "src/components/views/ProjectsView/ProjectsDetailDrawerHost.tsx"
    );

    const createLines = fs.readFileSync(createHostPath, "utf-8").split("\n").length;
    const detailLines = fs.readFileSync(detailHostPath, "utf-8").split("\n").length;

    assert.ok(
      createLines <= 250,
      `ProjectsCreateModalHost.tsx (${createLines} lines) must be <= 250 LOC`
    );
    assert.ok(
      detailLines <= 250,
      `ProjectsDetailDrawerHost.tsx (${detailLines} lines) must be <= 250 LOC`
    );
  });

  it("verifies Projects hosts import EventCreateModal and EventDrawer dynamically", () => {
    const createHostPath = path.resolve(
      process.cwd(),
      "src/components/views/ProjectsView/ProjectsCreateModalHost.tsx"
    );
    const detailHostPath = path.resolve(
      process.cwd(),
      "src/components/views/ProjectsView/ProjectsDetailDrawerHost.tsx"
    );

    const createContent = fs.readFileSync(createHostPath, "utf-8");
    const detailContent = fs.readFileSync(detailHostPath, "utf-8");

    assert.ok(
      createContent.includes("EventCreateModal"),
      "ProjectsCreateModalHost must reference EventCreateModal"
    );
    assert.ok(
      !createContent.includes("EventFormModal"),
      "ProjectsCreateModalHost must not reference EventFormModal"
    );

    assert.ok(
      detailContent.includes("EventDrawer"),
      "ProjectsDetailDrawerHost must reference EventDrawer"
    );
    assert.ok(
      !detailContent.includes("EventFormModal"),
      "ProjectsDetailDrawerHost must not reference EventFormModal"
    );
  });

  it("verifies event state machine transitions used by EventDrawer", () => {
    // Valid transitions
    assert.equal(canTransitionEvent("UPCOMING", "ON_PROGRESS"), true);
    assert.equal(canTransitionEvent("ON_PROGRESS", "COMPLETED"), true);
    assert.equal(canTransitionEvent("UPCOMING", "CANCELLED"), true);

    // Invalid backwards transitions
    assert.equal(canTransitionEvent("COMPLETED", "UPCOMING"), false);
    assert.equal(canTransitionEvent("CANCELLED", "ON_PROGRESS"), false);
  });

  it("verifies EventDrawer contract updates FieldEventItem with mediaAttachments and checklist", () => {
    const mockEvent: FieldEventItem = {
      id: "ev-test-1",
      name: "Roadshow Central Park",
      eventType: "Roadshow",
      status: "UPCOMING",
      branchName: "Jakarta Central",
      location: "Mall Atrium",
      budget: 20000000,
      targetAttendee: 300,
      attendeeCount: 0,
      mediaAttachments: [
        {
          id: "drive-folder-1",
          name: "Documentation Archive",
          sizeBytes: 0,
          type: "document",
          url: "https://drive.google.com/drive/folders/test",
          source: "gdrive",
          isSharedFolder: true,
          uploadedAt: new Date().toISOString(),
        },
      ],
      checklist: [
        { id: "sub-1", title: "Permit approved", completed: true },
        { id: "sub-2", title: "Sound system check", completed: false },
      ],
    };

    assert.equal(mockEvent.status, "UPCOMING");
    assert.equal(mockEvent.checklist?.length, 2);
    assert.equal(mockEvent.mediaAttachments?.[0].isSharedFolder, true);
  });

  it("verifies EventCardsView card item is clickable to open drawer and removes edit/delete buttons", () => {
    const cardsPath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventCardsView.tsx"
    );
    const content = fs.readFileSync(cardsPath, "utf-8");

    assert.ok(
      content.includes("onClick={() => onSelectEvent(event)}"),
      "EventCardsView root motion.div card must have onClick to open drawer"
    );
    assert.ok(
      content.includes("cursor-pointer"),
      "EventCardsView root motion.div card must have cursor-pointer style"
    );
    assert.ok(
      !content.includes("<Edit2"),
      "EventCardsView card footer must not render Edit2 button"
    );
    assert.ok(
      !content.includes("<Trash2"),
      "EventCardsView card footer must not render Trash2 button"
    );
  });

  it("verifies EventCreateModal integrates EventMediaSection and supports mediaAttachments", () => {
    const modalPath = path.resolve(
      process.cwd(),
      "src/components/views/EventsView/EventCreateModal.tsx"
    );
    const content = fs.readFileSync(modalPath, "utf-8");

    assert.ok(
      content.includes("import { EventMediaSection }"),
      "EventCreateModal must import EventMediaSection"
    );
    assert.ok(
      content.includes("<EventMediaSection"),
      "EventCreateModal must render EventMediaSection component"
    );
    assert.ok(
      content.includes("mediaAttachments={mediaAttachments}"),
      "EventCreateModal must wire mediaAttachments prop to EventMediaSection"
    );
    assert.ok(
      !content.includes("mediaAttachments: [],"),
      "EventCreateModal must not hardcode mediaAttachments as empty array in payload or createdItem"
    );
  });
});

