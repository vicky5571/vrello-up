import type { VisibleFields } from "@/types";

/**
 * Single source of truth for the ListView task grid.
 * Both the column header (ListView) and every row (ListTaskRow) derive their
 * grid template from the same visible-fields map, so hiding a column collapses
 * its track in header and rows together instead of leaving a labeled void.
 *
 * Tracks: checkbox 28px, name 1fr, [assignees 110px], [dueDate 110px],
 * [priority 90px], status 130px, comments 90px, actions 60px.
 * The subtasks toggle is a badge inside the name cell, not a track.
 */
export function buildTaskGridTemplate(visibleFields: VisibleFields): {
  gridTemplateColumns: string;
  minWidth: number;
} {
  const tracks = ["28px", "1fr"];
  // Always-visible fixed tracks: checkbox + status + comments + actions.
  let fixed = 28 + 130 + 90 + 60;
  if (visibleFields.assignees) {
    tracks.push("110px");
    fixed += 110;
  }
  if (visibleFields.dueDate) {
    tracks.push("110px");
    fixed += 110;
  }
  if (visibleFields.priority) {
    tracks.push("90px");
    fixed += 90;
  }
  tracks.push("130px", "90px", "60px");
  // +32 for the px-4 horizontal padding on header/rows.
  return { gridTemplateColumns: tracks.join(" "), minWidth: fixed + 32 };
}
