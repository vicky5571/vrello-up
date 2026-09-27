import type {
  User,
  Status,
  Tag,
  Space,
  Task,
  ChannelMessage,
  Workspace,
} from "@/types";
import {
  MARCOM_SPACE_ID,
  PRODUCT_SPACE_ID,
  CONTENT_PLANNER_LIST_ID,
  FIELD_OPS_LIST_ID,
  DESIGN_SYSTEM_LIST_ID,
} from "@/lib/marcom/marcomIds";

// Default Seed Users
export const SEED_USERS: User[] = [
  {
    id: "user-1",
    name: "Alex Rivera",
    email: "alex@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    role: "admin",
  },
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    role: "staff",
  },
  {
    id: "user-3",
    name: "Marcus Vance",
    email: "marcus@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    role: "staff",
  },
];

// Default Statuses
export const DEFAULT_STATUSES: Status[] = [
  {
    id: "status-todo",
    name: "TO DO",
    color: "#64748B",
    category: "open",
    order: 0,
  },
  {
    id: "status-in-progress",
    name: "IN PROGRESS",
    color: "#0D9488",
    category: "in_progress",
    order: 1,
  },
  {
    id: "status-review",
    name: "IN REVIEW",
    color: "#EA580C",
    category: "review",
    order: 2,
  },
  {
    id: "status-done",
    name: "COMPLETE",
    color: "#16A34A",
    category: "done",
    order: 3,
  },
];

export const SEED_TAGS: Tag[] = [
  { id: "tag-frontend", name: "Frontend", color: "#0D9488" },
  { id: "tag-ui-ux", name: "UI/UX", color: "#8B5CF6" },
  { id: "tag-perf", name: "Performance", color: "#F59E0B" },
  { id: "tag-security", name: "Security", color: "#EF4444" },
];

export const INITIAL_SPACES: Space[] = [
  {
    id: PRODUCT_SPACE_ID,
    workspaceId: "ws-main",
    name: "Design & Product",
    icon: "Palette",
    color: "#8B5CF6",
    statuses: DEFAULT_STATUSES,
    folders: [],
    lists: [
      {
        id: DESIGN_SYSTEM_LIST_ID,
        spaceId: PRODUCT_SPACE_ID,
        name: "Design Tokens & UI Specs",
        icon: "Layers",
      },
      {
        id: "list-user-research",
        spaceId: PRODUCT_SPACE_ID,
        name: "Customer Interviews",
        icon: "Users",
      },
    ],
  },
  {
    id: MARCOM_SPACE_ID,
    workspaceId: "ws-main",
    name: "Marketing & Campaigns",
    icon: "Sparkles",
    color: "#EC4899",
    statuses: DEFAULT_STATUSES,
    folders: [],
    lists: [
      {
        id: CONTENT_PLANNER_LIST_ID,
        spaceId: MARCOM_SPACE_ID,
        name: "Social & Content Calendar",
        icon: "Calendar",
      },
      {
        id: FIELD_OPS_LIST_ID,
        spaceId: MARCOM_SPACE_ID,
        name: "Field Operations & Setup",
        icon: "Layers",
      },
    ],
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    listId: DESIGN_SYSTEM_LIST_ID,
    title: "Implement Framer Motion view transition animations",
    description:
      "<h3>Overview</h3><p>Integrate <code>layoutId</code> morphing for view indicator tabs and spring physics for the task slide-over drawer.</p><ul><li>Fluid spring curves</li><li>Accessible reduced-motion fallback</li><li>Hardware accelerated transforms</li></ul>",
    statusId: "status-in-progress",
    priority: "urgent",
    assignees: [SEED_USERS[0], SEED_USERS[1]],
    dueDate: "2026-09-02",
    startDate: "2026-08-28",
    estimatedHours: 12,
    tags: [SEED_TAGS[0], SEED_TAGS[1]],
    subtasks: [
      {
        id: "sub-1",
        title: "Add layoutId active tab indicator",
        completed: true,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-2",
        title: "Add TaskDrawer slide-over spring animation",
        completed: true,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-3",
        title: "Verify with prefers-reduced-motion",
        completed: false,
        createdAt: "2026-08-28",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "task-2",
    listId: DESIGN_SYSTEM_LIST_ID,
    title: "Build ClickUp-style interactive Table View with TanStack Table",
    description:
      "<p>Implement column sorting, status selector badges, inline title editing, and priority dropdown directly inside the tabular row grid.</p>",
    statusId: "status-todo",
    priority: "high",
    assignees: [SEED_USERS[1]],
    dueDate: "2026-09-05",
    tags: [SEED_TAGS[0]],
    subtasks: [
      {
        id: "sub-4",
        title: "Configure TanStack Table column definitions",
        completed: false,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-5",
        title: "Add inline cell editing",
        completed: false,
        createdAt: "2026-08-28",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "task-3",
    listId: DESIGN_SYSTEM_LIST_ID,
    title: "Configure Security rules and environment secret boundaries",
    description:
      "<p>Enforce <code>SECURITY.md</code> rules: strict separation of public keys vs server-only secrets, DOMPurify HTML sanitization for Tiptap editor, and RLS checks.</p>",
    statusId: "status-done",
    priority: "urgent",
    assignees: [SEED_USERS[0]],
    dueDate: "2026-08-29",
    tags: [SEED_TAGS[3]],
    subtasks: [
      {
        id: "sub-6",
        title: "Write SECURITY.md",
        completed: true,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-7",
        title: "Add DOMPurify HTML sanitizer",
        completed: true,
        createdAt: "2026-08-28",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "task-4",
    listId: DESIGN_SYSTEM_LIST_ID,
    title: "Review UI/UX Pro Max Dark Mode & Contrast Tokens",
    description:
      "<p>Ensure all text surfaces meet WCAG 2.2 AA >= 4.5:1 contrast standards, especially on deep OLED slate dark mode.</p>",
    statusId: "status-review",
    priority: "normal",
    assignees: [SEED_USERS[2]],
    dueDate: "2026-09-01",
    tags: [SEED_TAGS[1]],
    subtasks: [],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "post-1",
    listId: CONTENT_PLANNER_LIST_ID,
    title: "Launch Teaser Reel: VrelloUp 2.0 Feature Drop",
    description:
      "<p>Highlight fluid animations, ClickUp/Trello hybrid views, and real-time sprint blocker analytics. #Productivity #TechLaunch</p>",
    statusId: "status-in-progress",
    priority: "high",
    assignees: [SEED_USERS[1]],
    dueDate: "2026-09-10",
    startDate: "2026-09-08",
    postPlatform: "instagram",
    postFormat: "reel",
    mediaUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[1]],
    subtasks: [
      {
        id: "sp-1",
        title: "Record 4K 60fps screen recording",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-2",
        title: "Add motion captions and sound design",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-3",
        title: "Schedule post on Meta Business Suite",
        completed: false,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
  {
    id: "post-2",
    listId: CONTENT_PLANNER_LIST_ID,
    title: "TikTok Behind-the-Scenes: Field Officer Solo Roadshow",
    description:
      "<p>Day in the life of field marketing officers inspecting outlet branding signboards in Solo Central Java. #FieldOps #BehindTheScenes</p>",
    statusId: "status-todo",
    priority: "normal",
    assignees: [SEED_USERS[2]],
    dueDate: "2026-09-14",
    postPlatform: "tiktok",
    postFormat: "reel",
    mediaUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[0]],
    subtasks: [
      {
        id: "sp-4",
        title: "Curate event footage clips",
        completed: false,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-5",
        title: "Draft TikTok hook & trending audio",
        completed: false,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 1,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
  {
    id: "post-3",
    listId: CONTENT_PLANNER_LIST_ID,
    title: "YouTube Deep Dive: ClickUp & Trello Hybrid Workflow",
    description:
      "<p>Walkthrough comparing multi-view capabilities (List, Board, Calendar, Gantt, Table) in VrelloUp. #Tutorial #Productivity</p>",
    statusId: "status-review",
    priority: "urgent",
    assignees: [SEED_USERS[0]],
    dueDate: "2026-09-08",
    postPlatform: "youtube",
    postFormat: "carousel",
    mediaUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[1]],
    subtasks: [
      {
        id: "sp-6",
        title: "Rough cut video edit",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-7",
        title: "Chapter timestamps & thumbnail",
        completed: false,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 2,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
  {
    id: "post-4",
    listId: CONTENT_PLANNER_LIST_ID,
    title: "LinkedIn Product Update: VrelloUp Q3 Release Notes",
    description:
      "<p>Official announcement detailing sprint planning, task dependencies, and marketing integration. #SaaS #ProductUpdate</p>",
    statusId: "status-done",
    priority: "normal",
    assignees: [SEED_USERS[0], SEED_USERS[1]],
    dueDate: "2026-09-04",
    postPlatform: "linkedin",
    postFormat: "article",
    mediaUrl:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[2]],
    subtasks: [
      {
        id: "sp-8",
        title: "Copy proofreading",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-9",
        title: "Publish to company page",
        completed: true,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 3,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
];

export const INITIAL_CHANNEL_MESSAGES: ChannelMessage[] = [
  {
    id: "msg-1",
    channelId: DESIGN_SYSTEM_LIST_ID,
    userId: "user-1",
    user: SEED_USERS[0],
    content:
      "🚀 Sprint 42 kickoff is underway! We're prioritizing Framer Motion animations and Table View interactive cells.",
    createdAt: "2026-08-28T09:00:00.000Z",
  },
  {
    id: "msg-2",
    channelId: DESIGN_SYSTEM_LIST_ID,
    userId: "user-2",
    user: SEED_USERS[1],
    content:
      "I've linked the TanStack table column schemas. Testing inline cell editing now.",
    createdAt: "2026-08-28T10:15:00.000Z",
  },
  {
    id: "msg-3",
    channelId: DESIGN_SYSTEM_LIST_ID,
    userId: "user-3",
    user: SEED_USERS[2],
    content:
      "Checked the dark mode palette contrast against WCAG 2.2 AA. All OLED tokens are verified! 👍",
    createdAt: "2026-08-28T11:30:00.000Z",
  },
];

export const INITIAL_WORKSPACE: Workspace = {
  id: "ws-main",
  name: "Acme Product Workspace",
  avatar: "V",
  spaces: INITIAL_SPACES,
  members: SEED_USERS,
};
