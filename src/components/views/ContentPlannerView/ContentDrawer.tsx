"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Sparkles,
  Copy,
  Trash2,
  ExternalLink,
  Play,
  Film,
  Video,
  AlertCircle,
  RefreshCw,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";
import { PlatformIcon } from "@/components/ui/BrandIcons";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import {
  getContentStatusMeta,
} from "@/lib/marcom/contentWorkflow";
import {
  ContentPostItem,
  PostPlatform,
  PostFormat,
  PostStatus,
  TaskAttachment,
} from "@/types";
import { cn } from "@/lib/utils";

interface ContentDrawerProps {
  post: ContentPostItem | null;
  onClose: () => void;
  onUpdatePost: (updated: ContentPostItem) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  onNavigateToTask?: (post: ContentPostItem) => void;
  onOpenDrivePicker?: (options: {
    onSelect: (attachments: TaskAttachment[]) => void;
    defaultKind?: "all" | "video";
  }) => void;
  onPreviewMedia?: (media: { title: string; mediaUrl: string; platform?: string; format?: string }) => void;
}

const PLATFORM_CONFIG: Record<
  PostPlatform,
  { label: string; maxChars?: number }
> = {
  instagram: { label: "Instagram", maxChars: 2200 },
  tiktok: { label: "TikTok", maxChars: 2200 },
  youtube: { label: "YouTube", maxChars: 5000 },
  facebook: { label: "Facebook", maxChars: 63206 },
  linkedin: { label: "LinkedIn", maxChars: 3000 },
  twitter: { label: "X (Twitter)", maxChars: 280 },
  blog: { label: "Blog / SEO", maxChars: 10000 },
  press: { label: "Press Release", maxChars: 8000 },
};

const ALL_STATUSES: PostStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "REVISION",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

export function ContentDrawer({
  post,
  onClose,
  onUpdatePost,
  onDeletePost,
  onNavigateToTask,
  onOpenDrivePicker,
  onPreviewMedia,
}: ContentDrawerProps) {
  // Form State
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<PostPlatform>("instagram");
  const [format, setFormat] = useState<PostFormat>("reel");
  const [publishDate, setPublishDate] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [subtasks, setSubtasks] = useState<
    { id: string; title: string; completed?: boolean }[]
  >([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Sync state when active post changes
  useEffect(() => {
    if (!post) return;
    setTitle(post.title || "");
    setPlatform(post.platform || "instagram");
    setFormat(post.format || "reel");
    setPublishDate(
      post.publishDate ? new Date(post.publishDate).toISOString().slice(0, 10) : ""
    );
    setStatus(post.status || "DRAFT");
    setCaption(post.caption || "");
    setMediaUrl(post.mediaUrl || "");
    setRevisionNotes(post.revisionNotes || "");
    setSubtasks(
      Array.isArray(post.subtasks)
        ? post.subtasks
        : [
            { id: "sub-1", title: "Draft Copywriting & Hook", completed: false },
            { id: "sub-2", title: "Video Shoot & Assets", completed: false },
            { id: "sub-3", title: "Editing & Color Grading", completed: false },
            { id: "sub-4", title: "Final Review & Schedule", completed: false },
          ]
    );
  }, [post]);

  // Keyboard Escape dismissal
  useEffect(() => {
    if (!post) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [post, onClose]);

  // Max characters guide for current platform
  const maxChars = PLATFORM_CONFIG[platform]?.maxChars || 2200;
  const isOverLimit = caption.length > maxChars;

  // Subtask handlers
  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub-${Date.now()}`, title: trimmed, completed: false },
    ]);
    setNewSubtaskTitle("");
  };

  const handleCopyCaption = async () => {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setHasCopied(true);
      toast.success("Caption berhasil disalin ke clipboard!");
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin caption");
    }
  };

  const handleSave = async () => {
    if (!post) return;
    if (!title.trim()) {
      toast.error("Judul postingan tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      const updatedPost: ContentPostItem = {
        ...post,
        title: title.trim(),
        platform,
        format,
        publishDate: publishDate ? new Date(publishDate).toISOString() : null,
        status,
        caption: caption.trim(),
        mediaUrl: mediaUrl.trim(),
        revisionNotes: revisionNotes.trim(),
        subtasks,
      };

      await onUpdatePost(updatedPost);
      toast.success("Perubahan konten berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan perubahan konten");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!window.confirm(`Hapus postingan "${post.title}"?`)) return;

    setIsDeleting(true);
    try {
      await onDeletePost(post.id);
      toast.success("Postingan berhasil dihapus");
      onClose();
    } catch {
      toast.error("Gagal menghapus postingan");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!post) return null;

  const currentStatusMeta = getContentStatusMeta(status);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity cursor-pointer"
        />

        {/* Drawer container */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative z-50 w-full sm:w-[560px] h-full bg-white dark:bg-[#18191B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                    "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20"
                  )}
                >
                  <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
                  <span className="capitalize">{PLATFORM_CONFIG[platform]?.label || platform}</span>
                  <span className="text-[10px] opacity-70 font-normal uppercase">
                    • {format}
                  </span>
                </span>

                <span
                  className={cn(
                    "px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider",
                    currentStatusMeta.badgeClass
                  )}
                >
                  {currentStatusMeta.label}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {onNavigateToTask && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTask(post)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                    title="Buka di Kanban Board Umum"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Task Board</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editable Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul Postingan / Konsep Konten..."
              className="w-full text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-pink-500 dark:focus:border-pink-500 focus:outline-hidden transition-colors py-1"
            />
          </div>

          {/* 2. Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Status Workflow Stepper */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Status Alur Konten
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {ALL_STATUSES.map((st) => {
                  const meta = getContentStatusMeta(st);
                  const isCurrent = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={cn(
                        "px-2 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer text-center",
                        isCurrent
                          ? cn(meta.badgeClass, "ring-2 ring-pink-500/50 scale-[1.02]")
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catatan Revisi / Feedback Banner */}
            {(status === "REVISION" || revisionNotes.trim()) && (
              <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Catatan Revisi Lead
                  </span>
                  <span className="text-[10px] font-normal text-rose-500">Perlu Penyesuaian</span>
                </div>
                <textarea
                  rows={2}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Tuliskan feedback perbaikan copy, angle visual, atau audio..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
            )}

            {/* Editor Caption & Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  <span>Draft Caption & Hashtags</span>
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      isOverLimit ? "text-rose-500 font-bold" : "text-slate-400"
                    )}
                  >
                    {caption.length} / {maxChars} char
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    disabled={!caption}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/50 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tuliskan hook pembuka, draft caption utama, call-to-action, dan hashtags promo..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 leading-relaxed resize-y"
              />
            </div>

            {/* Sektor Aset Media & Google Drive */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-500" />
                  <span>Aset Media / Video Footage</span>
                </label>
                {onOpenDrivePicker && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenDrivePicker({
                        defaultKind: "video",
                        onSelect: (atts) => {
                          if (atts[0]) {
                            setMediaUrl(atts[0].url);
                            toast.success("Tautan Google Drive berhasil disematkan");
                          }
                        },
                      })
                    }
                    className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Pilih dari Google Drive</span>
                  </button>
                )}
              </div>

              {mediaUrl ? (
                <div className="space-y-2">
                  {/* Poster Thumbnail & Preview Trigger */}
                  <div
                    onClick={() => {
                      if (onPreviewMedia) {
                        onPreviewMedia({
                          title,
                          mediaUrl,
                          platform,
                          format,
                        });
                      }
                    }}
                    className="group/player relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer shadow-xs hover:border-pink-500/50 transition-all flex items-center justify-center"
                    title="Klik untuk memutar / preview media"
                  >
                    {(() => {
                      const parsed = parseGoogleDriveUrl(mediaUrl);
                      const isVideo =
                        mediaUrl.endsWith(".mp4") ||
                        mediaUrl.endsWith(".mov") ||
                        mediaUrl.endsWith(".webm");

                      if (parsed.isValid) {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-pink-950/20 to-slate-900 p-4 text-center">
                            <Film className="w-8 h-8 text-pink-400 mb-1 opacity-80 group-hover/player:scale-110 transition-transform" />
                            <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
                              {title || "Google Drive Video"}
                            </span>
                            <span className="text-[10px] text-pink-400/90 mt-0.5 font-medium">
                              Google Drive Media
                            </span>
                          </div>
                        );
                      }

                      if (isVideo) {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 p-4 text-center">
                            <Video className="w-8 h-8 text-purple-400 mb-1 opacity-80 group-hover/player:scale-110 transition-transform" />
                            <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
                              {title || "Video File"}
                            </span>
                            <span className="text-[10px] text-purple-400/90 mt-0.5 font-medium">
                              File Video (.MP4/.MOV)
                            </span>
                          </div>
                        );
                      }

                      return (
                        <img
                          src={mediaUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      );
                    })()}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover/player:bg-black/15 flex items-center justify-center transition-colors">
                      <div className="w-11 h-11 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-lg group-hover/player:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* URL Input field */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaUrl("")}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Belum ada video atau visual yang disematkan ke postingan ini.
                  </p>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Tempel URL Google Drive atau video di sini..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-mono text-center"
                  />
                </div>
              )}
            </div>

            {/* Checklist Subtask Produksi */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-teal-500" />
                  <span>Subtask Produksi Tim Kreatif</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {subtasks.filter((s) => s.completed).length}/{subtasks.length} Selesai
                </span>
              </div>

              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleToggleSubtask(st.id)}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-xl border transition-colors cursor-pointer text-xs",
                      st.completed
                        ? "bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-slate-400 line-through"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    )}
                  >
                    {st.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="flex-1 select-none">{st.title}</span>
                  </div>
                ))}
              </div>

              {/* Add Subtask Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  placeholder="+ Tambah to-do produksi..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Metadata Jadwal & Format */}
            <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pengaturan Jadwal & Format
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="block text-[10px] text-slate-500 mb-1">Target Rilis</span>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  />
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 mb-1">Platform</span>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as PostPlatform)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    {Object.keys(PLATFORM_CONFIG).map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_CONFIG[p as PostPlatform].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 mb-1">Format</span>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as PostFormat)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="reel">Reel / Video</option>
                    <option value="carousel">Carousel</option>
                    <option value="image">Single Image</option>
                    <option value="story">Story</option>
                    <option value="article">Article / Press</option>
                    <option value="thread">Thread</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              {isDeleting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Hapus Post</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
