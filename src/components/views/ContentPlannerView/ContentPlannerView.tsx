"use client";

import { useState, useMemo } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { PostPlatform, PostFormat } from "@/types";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  Video,
  Image as ImageIcon,
  Layers,
  FileText,
  Play,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { AvatarGroup } from "@/components/ui/UserAvatar";
import { toast } from "sonner";

const PLATFORM_CONFIG: Record<
  PostPlatform,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  instagram: {
    label: "Instagram",
    bg: "bg-pink-500/10 dark:bg-pink-500/20",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/30",
    icon: "📸",
  },
  tiktok: {
    label: "TikTok",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/30",
    icon: "🎵",
  },
  youtube: {
    label: "YouTube",
    bg: "bg-red-500/10 dark:bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    icon: "▶️",
  },
  linkedin: {
    label: "LinkedIn",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: "💼",
  },
  facebook: {
    label: "Facebook",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    icon: "👥",
  },
  press: {
    label: "Press Release",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: "📰",
  },
};

const FORMAT_ICONS: Record<PostFormat, typeof Video> = {
  reel: Video,
  carousel: Layers,
  image: ImageIcon,
  story: Clock,
  article: FileText,
};

export function ContentPlannerView() {
  const {
    tasks,
    setSelectedTaskId,
    createTask,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
  } = useWorkspaceStore();

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = currentWorkspace?.members || [];
  const currentSpace = currentWorkspace?.spaces.find((s) => s.id === activeSpaceId);
  const statuses = currentSpace?.statuses || [];

  const [selectedPlatform, setSelectedPlatform] = useState<PostPlatform | "all">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Post Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<PostPlatform>("instagram");
  const [format, setFormat] = useState<PostFormat>("reel");
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [mediaUrl, setMediaUrl] = useState("");

  // Filter tasks that have postPlatform or belong to content lists
  const contentPosts = useMemo(() => {
    return tasks.filter((t) => {
      const isContent =
        Boolean(t.postPlatform) || t.listId === "list-content-planner";
      if (!isContent) return false;
      if (selectedPlatform !== "all" && t.postPlatform !== selectedPlatform) {
        return false;
      }
      return true;
    });
  }, [tasks, selectedPlatform]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a post title");
      return;
    }

    const targetListId = activeListId || "list-sprint-tasks";
    const defaultStatus = statuses[0]?.id || "status-todo";
    const newPost = createTask({
      listId: targetListId,
      title: title.trim(),
      description: description.trim()
        ? `<p>${description.trim()}</p>`
        : "<p>Draft post copy...</p>",
      statusId: defaultStatus,
      priority: "normal",
      assignees: members[0] ? [members[0]] : [],
      dueDate: scheduledDate,
      postPlatform: platform,
      postFormat: format,
      mediaUrl: mediaUrl.trim() || undefined,
      tags: [],
      subtasks: [
        {
          id: `sub-${Date.now()}-1`,
          title: "Write caption & copy",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `sub-${Date.now()}-2`,
          title: "Visual asset production / video cut",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `sub-${Date.now()}-3`,
          title: "Stakeholder approval & schedule",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      orderIndex: contentPosts.length,
    });

    toast.success("Content post added to schedule!");
    setTitle("");
    setDescription("");
    setMediaUrl("");
    setIsCreateModalOpen(false);
    setSelectedTaskId(newPost.id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFBFC] dark:bg-[#121316]">
      {/* View Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#18191B]/60 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Content & Post Planner
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {contentPosts.length} posts
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Schedule social campaigns, track creative task progress, and curate media assets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Platform Filter Chips */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setSelectedPlatform("all")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                selectedPlatform === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
              )}
            >
              All
            </button>
            {(Object.keys(PLATFORM_CONFIG) as PostPlatform[]).map((p) => {
              const conf = PLATFORM_CONFIG[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
                    selectedPlatform === p
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                  )}
                >
                  <span>{conf.icon}</span>
                  <span className="hidden sm:inline">{conf.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of Planned Content Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        {contentPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
            <span className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-500 mb-3">
              <Sparkles className="w-6 h-6" />
            </span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No content posts scheduled
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
              Plan Instagram reels, TikTok cutdowns, and press announcements with integrated task progress checklists.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors shadow-xs cursor-pointer"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contentPosts.map((post) => {
              const platformKey = post.postPlatform || "instagram";
              const conf = PLATFORM_CONFIG[platformKey] || PLATFORM_CONFIG.instagram;
              const FormatIcon = post.postFormat
                ? FORMAT_ICONS[post.postFormat] || Video
                : Video;

              const totalSubtasks = post.subtasks.length;
              const completedSubtasks = post.subtasks.filter((s) => s.completed).length;
              const progressPct =
                totalSubtasks > 0
                  ? Math.round((completedSubtasks / totalSubtasks) * 100)
                  : 0;

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedTaskId(post.id)}
                  className="group flex flex-col rounded-xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-pink-500/40 dark:hover:border-pink-500/40 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Media Visual Preview (if available) */}
                  {post.mediaUrl ? (
                    <div className="relative w-full h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {post.mediaUrl.endsWith(".mp4") ? (
                        <>
                          <video
                            src={post.mediaUrl}
                            preload="metadata"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-xs">
                              <Play className="w-4 h-4 fill-white" />
                            </span>
                          </div>
                        </>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/60 backdrop-blur-md text-white">
                        <FormatIcon className="w-3 h-3" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 pb-0 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          conf.bg,
                          conf.text,
                          conf.border,
                        )}
                      >
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <FormatIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] capitalize font-medium">
                          {post.postFormat || "post"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                        {post.title}
                      </h3>
                      <div
                        className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1"
                        dangerouslySetInnerHTML={{
                          __html: post.description || "No copy draft yet.",
                        }}
                      />
                    </div>

                    {/* Task Progress Bar */}
                    {totalSubtasks > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-teal-500" />
                            <span>
                              {completedSubtasks}/{totalSubtasks} tasks
                            </span>
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(post.dueDate)}</span>
                      </div>
                      <AvatarGroup users={post.assignees} size="sm" max={2} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Schedule New Content Post
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Post Title / Concept *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Behind-the-Scenes: Field Officer Solo Roadshow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as PostPlatform)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="press">Press Release</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as PostFormat)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="reel">Reel / Video</option>
                    <option value="carousel">Carousel</option>
                    <option value="image">Single Image</option>
                    <option value="story">Story</option>
                    <option value="article">Article / Press</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publish / Target Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Media / Thumbnail URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Draft Copy / Hashtags
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter draft caption, hook, and campaign hashtags..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors shadow-xs cursor-pointer"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
