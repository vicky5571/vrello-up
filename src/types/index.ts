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
  role?: "admin" | "staff" | "viewer";
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

export interface TaskAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  type: "video" | "image" | "document" | "other";
  url: string;
  uploadedAt: string;
  source?: "local" | "gdrive";
  driveFileId?: string;
  thumbnailUrl?: string;
  isSharedFolder?: boolean;
  embedUrl?: string;
}

export interface TaskCommentAttachment {
  id: string;
  name: string;
  size: string;
  url?: string;
  type?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  attachments?: TaskCommentAttachment[];
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  createdAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

export type PostPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "facebook"
  | "twitter"
  | "blog"
  | "press";

export type PostFormat = "reel" | "carousel" | "image" | "story" | "article" | "thread";

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
  comments?: TaskComment[];
  activities?: ActivityLog[];
  dependencies?: string[]; // IDs of tasks this task depends on (blocking)
  progress?: number; // 0 to 100 manual or calculated progress
  postPlatform?: PostPlatform;
  postFormat?: PostFormat;
  mediaUrl?: string;
  attachments?: TaskAttachment[];
  relatedMarcomId?: string;
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

export type AppMode = "tasks" | "marcom";

export type ViewMode =
  | "home"
  | "list"
  | "board"
  | "table"
  | "calendar"
  | "gantt"
  | "channel"
  | "content"
  | "content-planner"
  | "branches"
  | "outlets"
  | "placements"
  | "mous"
  | "events"
  | "documents"
  | "reports"
  | "analytics";

export type PostStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "REVISION"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface ContentPostItem {
  id: string;
  workspaceId?: string;
  title: string;
  platform: PostPlatform;
  format: PostFormat;
  publishDate?: string | null;
  status: PostStatus;
  caption?: string;
  mediaUrl?: string;
  branchName?: string;
  picName?: string;
  revisionNotes?: string;
  subtasks?: { id: string; title: string; completed?: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}

export type ContentPost = ContentPostItem;

export type EventStatus = "UPCOMING" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface EventFootage {
  id: string;
  eventId?: string;
  fieldEventId?: string;
  title: string;
  filePath: string;
  duration?: string;
}

export interface FieldEventItem {
  id: string;
  workspaceId?: string;
  name: string;
  eventType: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string;
  branchName?: string;
  picName?: string;
  status: EventStatus;
  budget: number;
  targetAttendee: number;
  attendeeCount: number;
  notes?: string;
  date?: string | null;
  mediaUrl?: string | null;
  footage?: EventFootage[];
  createdAt?: string;
  updatedAt?: string;
}

export type FieldEvent = FieldEventItem;
export type MarcomEvent = FieldEventItem;

export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";

export interface Placement {
  id: string;
  workspaceId?: string;
  outletId: string;
  materialId: string;
  status: PlacementStatus;
  brand?: "IM3" | "3" | string;
  date?: string | null;
  picName?: string;
  photoUrl?: string;
  photoUrls?: string[];
  dimensions?: string;
  cost?: number;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string;
  locationNotes?: string;
  outlet?: { id: string; code: string; name: string; brand?: string };
  material?: { id: string; type: string; name: string };
}

export type PlacementItem = Placement;

export type MouStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DONE";

export interface Mou {
  id: string;
  workspaceId?: string;
  branchId: string;
  outletName?: string;
  partnerName: string;
  mouType: string;
  submissionDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: MouStatus;
  picName?: string;
  picPhone?: string;
  docPath?: string;
  compensationValue?: number;
  notes?: string;
  branch?: { id: string; code: string; name: string };
}

export type MouItem = Mou;

export type DocFileType = "PDF" | "XLSX" | "DOCX" | "ZIP" | "CSV" | "MP4" | "PNG" | "JPG";

export interface DocumentItem {
  id: string;
  workspaceId?: string;
  name: string;
  category: string;
  period?: string;
  branchName?: string;
  ownerPic?: string;
  status?: string;
  fileType: DocFileType | string;
  fileSizeMb?: number;
  filePath: string;
  description?: string;
}

export interface MonthlyReport {
  id: string;
  workspaceId?: string;
  month: string;
  year: number;
  summary?: { totalActivities?: number; completionRate?: number } | Record<string, unknown>;
  activities?: unknown[];
  achievements?: unknown[];
  keyIssues?: unknown[];
  actionPlans?: unknown[];
}

export type MonthlyReportItem = MonthlyReport;

export type GroupByOption = "status" | "priority" | "assignee";

export interface FilterOptions {
  search: string;
  statusIds: string[];
  priorities: Priority[];
  assigneeIds: string[];
  tagIds: string[];
  showClosed: boolean;
  groupBy: GroupByOption;
}

export type ViewDensity = "compact" | "standard" | "relaxed";

export interface VisibleFields {
  assignees: boolean;
  priority: boolean;
  dueDate: boolean;
  tags: boolean;
  subtasks: boolean;
}

export interface ViewPreferences {
  density: ViewDensity;
  visibleFields: VisibleFields;
}

export type AutomationTrigger =
  | "mou:approved"
  | "event:in_3_days"
  | "task:priority_urgent"
  | "task:status_done"
  | "task:subtasks_completed"
  | "task:overdue";

export type AutomationAction =
  | "create_field_ops_task"
  | "notify_marcom_lead_high"
  | "assign_lead_architect_today"
  | "advance_status_review";

export interface CustomAutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  enabled: boolean;
  runCount: number;
  createdAt: string;
}
