export type Priority = "urgent" | "high" | "normal" | "low" | "none";

export type StatusCategory =
  | "open"
  | "in_progress"
  | "review"
  | "done"
  | "closed";

export interface Status {
  id: string;
  name: string;
  color: string;
  category: StatusCategory;
  order: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string;
  statusId: string;
  priority: Priority;
  assignees: User[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  tags: Tag[];
  subtasks: Subtask[];
  dependencies?: string[]; // IDs of tasks this task depends on (blocking)
  progress?: number; // 0 to 100 manual or calculated progress
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  spaceId: string;
  folderId?: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface Folder {
  id: string;
  spaceId: string;
  name: string;
  lists: List[];
}

export interface Space {
  id: string;
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
  statuses: Status[];
  folders: Folder[];
  lists: List[];
}

export interface Workspace {
  id: string;
  name: string;
  avatar?: string;
  spaces: Space[];
  members: User[];
}

export type ViewMode = "board" | "table" | "calendar" | "gantt";

export interface FilterOptions {
  search: string;
  statusIds: string[];
  priorities: Priority[];
  assigneeIds: string[];
  tagIds: string[];
}
