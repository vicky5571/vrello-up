import type {
  MarcomWorkItem,
  ProjectsFilterState,
} from "@/types";
import {
  getWorkItemColumn,
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
} from "./workItems";

export const DEFAULT_PROJECTS_FILTERS: ProjectsFilterState = {
  search: "",
  types: [],
  columns: [],
  branches: [],
  pics: [],
  dateFrom: null,
  dateTo: null,
};

export function applyProjectsFilters(
  items: MarcomWorkItem[],
  filters: ProjectsFilterState,
): MarcomWorkItem[] {
  return items.filter((item) => {
    // 1. Search (Title or context)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const title = getWorkItemTitle(item).toLowerCase();
      const pic = (getWorkItemPic(item) || "").toLowerCase();
      let extra = "";
      if (item._type === "content") {
        extra = `${item.platform} ${item.format} ${item.caption || ""}`.toLowerCase();
      } else if (item._type === "event") {
        extra = `${item.eventType} ${item.location || ""} ${item.branchName || ""}`.toLowerCase();
      } else if (item._type === "placement") {
        extra = `${item.dimensions || ""} ${item.outlet?.name || ""}`.toLowerCase();
      }

      if (!title.includes(q) && !pic.includes(q) && !extra.includes(q)) {
        return false;
      }
    }

    // 2. Types
    if (filters.types.length > 0 && !filters.types.includes(item._type)) {
      return false;
    }

    // 3. Columns / Status
    if (filters.columns.length > 0) {
      const col = getWorkItemColumn(item);
      if (!filters.columns.includes(col)) {
        return false;
      }
    }

    // 4. Branch
    if (filters.branches.length > 0) {
      let branchName = "";
      if (item._type === "content" || item._type === "event") {
        branchName = item.branchName || "";
      } else if (item._type === "placement") {
        branchName = item.outlet?.branchId || "";
      }
      if (!filters.branches.includes(branchName)) {
        return false;
      }
    }

    // 5. PIC
    if (filters.pics.length > 0) {
      const pic = getWorkItemPic(item) || "";
      if (!filters.pics.includes(pic)) {
        return false;
      }
    }

    // 6. Date Range
    const dateStr = getWorkItemDate(item);
    if (filters.dateFrom) {
      if (!dateStr || dateStr.slice(0, 10) < filters.dateFrom) {
        return false;
      }
    }
    if (filters.dateTo) {
      if (!dateStr || dateStr.slice(0, 10) > filters.dateTo) {
        return false;
      }
    }

    return true;
  });
}

