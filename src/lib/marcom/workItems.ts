import type {
  MarcomWorkItemType,
  MarcomWorkItem,
  ProjectsColumn,
} from "@/types";

export type { MarcomWorkItemType, MarcomWorkItem, ProjectsColumn };

export const PROJECTS_COLUMN_ORDER: ProjectsColumn[] = [
  "Upcoming",
  "To Do",
  "In Progress",
  "Ready",
  "Done",
  "Blocked",
  "Cancelled",
  "Archived",
];

export function getWorkItemColumn(item: MarcomWorkItem): ProjectsColumn {
  switch (item._type) {
    case "content":
      if (["DRAFT", "IN_REVIEW", "REVISION"].includes(item.status)) return "In Progress";
      if (["APPROVED", "SCHEDULED"].includes(item.status)) return "Ready";
      if (item.status === "PUBLISHED") return "Done";
      return "Archived";
    case "event":
      if (item.status === "UPCOMING") return "Upcoming";
      if (item.status === "ON_PROGRESS") return "In Progress";
      if (item.status === "COMPLETED") return "Done";
      return "Cancelled";
    case "placement":
      if (item.status === "NOT_STARTED") return "To Do";
      if (item.status === "ON_PROGRESS") return "In Progress";
      if (item.status === "DONE") return "Done";
      return "Blocked";
  }
}

export function mapColumnToStatus(
  type: MarcomWorkItemType,
  column: ProjectsColumn,
): string | null {
  switch (type) {
    case "content":
      if (column === "In Progress") return "IN_REVIEW";
      if (column === "Ready") return "APPROVED";
      if (column === "Done") return "PUBLISHED";
      if (column === "Archived") return "ARCHIVED";
      return null;
    case "event":
      if (column === "Upcoming") return "UPCOMING";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done") return "COMPLETED";
      if (column === "Cancelled") return "CANCELLED";
      return null;
    case "placement":
      if (column === "To Do") return "NOT_STARTED";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done") return "DONE";
      if (column === "Blocked") return "ISSUE";
      return null;
  }
}

export function getWorkItemTitle(item: MarcomWorkItem): string {
  if (item._type === "content") return item.title;
  if (item._type === "event") return item.name;
  return `${item.material?.name ?? "Placement"} @ ${item.outlet?.name ?? ""}`;
}

export function getWorkItemDate(item: MarcomWorkItem): string | null | undefined {
  if (item._type === "content") return item.publishDate;
  if (item._type === "event") return item.startDate ?? item.date;
  return item.date;
}

export function getWorkItemPic(item: MarcomWorkItem): string | undefined {
  return item.picName ?? undefined;
}

