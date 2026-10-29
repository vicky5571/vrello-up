import type {
  MarcomWorkItemType,
  MarcomWorkItem,
  ProjectsColumn,
  PostStatus,
  EventStatus,
  PlacementStatus,
  WorkItemSubStatus,
} from "@/types";

export type { MarcomWorkItemType, MarcomWorkItem, ProjectsColumn, WorkItemSubStatus };

export const PROJECTS_COLUMN_ORDER: ProjectsColumn[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
  "Blocked",
  "Cancelled",
];

export const PROJECTS_COLUMN_ORDER_WITH_ARCHIVED: ProjectsColumn[] = [
  ...PROJECTS_COLUMN_ORDER,
  "Archived",
];

export function getWorkItemColumn(item: MarcomWorkItem): ProjectsColumn {
  switch (item._type) {
    case "content":
      switch (item.status) {
        case "DRAFT":     return "To Do";
        case "IN_REVIEW": return "In Review";
        case "REVISION":  return "In Progress";
        case "APPROVED":  return "In Review";
        case "SCHEDULED": return "In Review";
        case "PUBLISHED": return "Done";
        case "ARCHIVED":  return "Archived";
        default:          return "To Do";
      }
    case "event":
      switch (item.status) {
        case "UPCOMING":    return "To Do";
        case "ON_PROGRESS": return "In Progress";
        case "COMPLETED":   return "Done";
        case "CANCELLED":   return "Cancelled";
        default:            return "To Do";
      }
    case "placement":
      switch (item.status) {
        case "NOT_STARTED": return "To Do";
        case "ON_PROGRESS": return "In Progress";
        case "DONE":        return "Done";
        case "ISSUE":       return "Blocked";
        default:            return "To Do";
      }
  }
}

export function mapColumnToStatus(
  type: MarcomWorkItemType,
  column: ProjectsColumn,
): string | null {
  switch (type) {
    case "content":
      if (column === "To Do")       return "DRAFT";
      if (column === "In Progress") return "REVISION";
      if (column === "In Review")   return "IN_REVIEW";
      if (column === "Done")        return "PUBLISHED";
      if (column === "Archived")    return "ARCHIVED";
      return null;
    case "event":
      if (column === "To Do")       return "UPCOMING";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done")        return "COMPLETED";
      if (column === "Cancelled")   return "CANCELLED";
      return null;
    case "placement":
      if (column === "To Do")       return "NOT_STARTED";
      if (column === "In Progress") return "ON_PROGRESS";
      if (column === "Done")        return "DONE";
      if (column === "Blocked")     return "ISSUE";
      return null;
  }
}

const CONTENT_SUB_STATUS: Record<PostStatus, WorkItemSubStatus> = {
  DRAFT:     { label: "Draft",             color: "#64748B" },
  IN_REVIEW: { label: "Menunggu Review",   color: "#F59E0B" },
  REVISION:  { label: "Perlu Revisi",      color: "#EF4444" },
  APPROVED:  { label: "Approved",          color: "#3B82F6" },
  SCHEDULED: { label: "Terjadwal",         color: "#8B5CF6" },
  PUBLISHED: { label: "Published",         color: "#10B981" },
  ARCHIVED:  { label: "Arsip",             color: "#94A3B8" },
};

const EVENT_SUB_STATUS: Record<EventStatus, WorkItemSubStatus> = {
  UPCOMING:    { label: "Akan Datang",        color: "#3B82F6" },
  ON_PROGRESS: { label: "Sedang Berlangsung", color: "#F59E0B" },
  COMPLETED:   { label: "Selesai",            color: "#10B981" },
  CANCELLED:   { label: "Dibatalkan",         color: "#EF4444" },
};

const PLACEMENT_SUB_STATUS: Record<PlacementStatus, WorkItemSubStatus> = {
  NOT_STARTED: { label: "Belum Dipasang",  color: "#64748B" },
  ON_PROGRESS: { label: "Sedang Dipasang", color: "#F59E0B" },
  DONE:        { label: "Terpasang",       color: "#10B981" },
  ISSUE:       { label: "Ada Kendala",     color: "#EF4444" },
};

export function getWorkItemSubStatus(item: MarcomWorkItem): WorkItemSubStatus {
  switch (item._type) {
    case "content":
      return CONTENT_SUB_STATUS[item.status] ?? { label: item.status, color: "#64748B" };
    case "event":
      return EVENT_SUB_STATUS[item.status] ?? { label: item.status, color: "#64748B" };
    case "placement":
      return PLACEMENT_SUB_STATUS[item.status] ?? { label: item.status, color: "#64748B" };
  }
}

export const VALID_COLUMNS_BY_TYPE: Record<MarcomWorkItemType, ProjectsColumn[]> = {
  content:   ["To Do", "In Progress", "In Review", "Done", "Archived"],
  event:     ["To Do", "In Progress", "Done", "Cancelled"],
  placement: ["To Do", "In Progress", "Done", "Blocked"],
};

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
