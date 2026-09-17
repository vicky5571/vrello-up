"use client";

import { useState, useMemo } from "react";
import {
  LayoutGrid,
  Smartphone,
  Sparkles,
  Layers,
  Video,
  Image as ImageIcon,
  Play,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Eye,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { ContentPostItem, PostPlatform, PostFormat } from "@/types";
import { PlatformIcon } from "@/components/ui/BrandIcons";
import { getContentStatusMeta } from "@/lib/marcom/contentWorkflow";

interface ContentFeedGridViewProps {
  posts: ContentPostItem[];
  onSelectPost: (post: ContentPostItem) => void;
  onEditPost: (post: ContentPostItem) => void;
  onAddNewPost?: () => void;
  canManage?: boolean;
}

export function ContentFeedGridView({
  posts,
  onSelectPost,
  onEditPost,
  onAddNewPost,
  canManage = false,
}: ContentFeedGridViewProps) {
  const [feedMode, setFeedMode] = useState<"instagram_grid" | "vertical_reels">("instagram_grid");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  // Filter posts suitable for feed display
  const feedPosts = useMemo(() => {
    return posts
      .filter((p) => {
        if (selectedPlatform !== "all" && p.platform !== selectedPlatform) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort descending by publishDate or createdAt
        const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
        const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [posts, selectedPlatform]);

  return (
    <div className="space-y-6">
      {/* Feed Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Feed Simulator Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFeedMode("instagram_grid")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer",
              feedMode === "instagram_grid"
                ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Instagram Feed (1:1 Grid)</span>
          </button>
          <button
            type="button"
            onClick={() => setFeedMode("vertical_reels")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer",
              feedMode === "vertical_reels"
                ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Reels & TikTok (9:16 Vertical)</span>
          </button>
        </div>

        {/* Platform & Action Filters */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedPlatform("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                selectedPlatform === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("instagram")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1",
                selectedPlatform === "instagram"
                  ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <PlatformIcon platform="instagram" className="w-3 h-3" />
              <span>Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("tiktok")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1",
                selectedPlatform === "tiktok"
                  ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <PlatformIcon platform="tiktok" className="w-3 h-3" />
              <span>TikTok</span>
            </button>
          </div>

          {onAddNewPost && (
            <button
              type="button"
              onClick={onAddNewPost}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Instagram 3x3 Grid Mode */}
      {feedMode === "instagram_grid" ? (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden p-4 sm:p-8">
          {/* Mock Instagram Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xl text-pink-600">
                  IM3
                </div>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  @indosatim3.official
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  Verified Marcom Hub
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-5 text-xs text-slate-600 dark:text-slate-400">
                <span>
                  <strong>{feedPosts.length}</strong> posts planned
                </span>
                <span>
                  <strong>1.4M</strong> followers
                </span>
                <span>
                  <strong>245</strong> following
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                Official Visual Feed Preview & Curation Engine • Cek tata letak cover, hook visual,
                dan kesinambungan warna sebelum tayang.
              </p>
            </div>
          </div>

          {/* 3-Column Square Grid */}
          {feedPosts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-pink-400 opacity-60" />
              <p className="text-xs font-semibold">Belum ada postingan yang sesuai filter.</p>
              {onAddNewPost && (
                <button
                  type="button"
                  onClick={onAddNewPost}
                  className="text-xs text-pink-600 underline font-bold cursor-pointer"
                >
                  Jadwalkan postingan pertama
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              {feedPosts.map((post) => {
                const statusMeta = getContentStatusMeta(post.status);
                const hasMedia = Boolean(post.mediaUrl && post.mediaUrl.trim());
                const isReel = post.format === "reel";
                const isCarousel = post.format === "carousel";

                return (
                  <div
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer shadow-xs border border-slate-200/50 dark:border-slate-800/80 transition-all duration-200 hover:shadow-lg"
                  >
                    {/* Media Thumbnail or Fallback */}
                    {hasMedia ? (
                      <img
                        src={post.mediaUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Hide broken image and let fallback show
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col justify-between p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850">
                        <div className="flex items-center justify-between">
                          <PlatformIcon
                            platform={post.platform as PostPlatform}
                            className="w-4 h-4 opacity-70"
                          />
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold border",
                              statusMeta.badgeClass,
                            )}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-3 leading-snug">
                            {post.title}
                          </h4>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {post.publishDate ? formatDate(post.publishDate) : "Draft"}
                        </div>
                      </div>
                    )}

                    {/* Top Right Format Badge Indicator */}
                    <div className="absolute top-2 right-2 z-10 pointer-events-none drop-shadow-md">
                      {isReel ? (
                        <div className="p-1 rounded-md bg-black/60 backdrop-blur-xs text-white">
                          <Play className="w-3 h-3 fill-white" />
                        </div>
                      ) : isCarousel ? (
                        <div className="p-1 rounded-md bg-black/60 backdrop-blur-xs text-white">
                          <Layers className="w-3 h-3" />
                        </div>
                      ) : null}
                    </div>

                    {/* Hover Overlay with Caption and Quick Actions */}
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between text-white z-20">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                            statusMeta.badgeClass,
                          )}
                        >
                          {statusMeta.label}
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPost(post);
                            }}
                            className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                            title="Edit Postingan"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold line-clamp-2 leading-snug">
                          {post.title}
                        </p>
                        {post.caption && (
                          <p className="text-[10px] text-slate-300 line-clamp-2 italic">
                            "{post.caption}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/20 text-[10px] text-slate-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-pink-400" />
                          <span>{post.publishDate ? formatDate(post.publishDate) : "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white font-semibold">
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 2. Reels & TikTok Vertical Simulator (9:16) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Vertical Reels & TikTok Simulator (9:16)
            </h3>
            <span className="text-xs text-slate-500">
              {feedPosts.filter((p) => p.format === "reel").length} video
              pendek
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {feedPosts.map((post) => {
              const statusMeta = getContentStatusMeta(post.status);
              const hasMedia = Boolean(post.mediaUrl && post.mediaUrl.trim());

              return (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="group relative aspect-[9/16] rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-xl cursor-pointer flex flex-col justify-between p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                >
                  {/* Background Video / Image */}
                  {hasMedia ? (
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-slate-900 to-slate-950" />
                  )}

                  {/* Dark gradient shading for text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

                  {/* Top Header: Platform & Approval Status */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold">
                      <PlatformIcon
                        platform={post.platform as PostPlatform}
                        className="w-3.5 h-3.5"
                      />
                      <span className="capitalize">{post.platform}</span>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md",
                        statusMeta.badgeClass,
                      )}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Play Center Indicator on Hover */}
                  <div className="relative z-10 self-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>

                  {/* Bottom: Channel Info & Hook Caption */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white flex items-center gap-1">
                          <span>@indosatim3</span>
                          <CheckCircle2 className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5 drop-shadow-sm">
                          {post.title}
                        </h4>
                        {post.caption && (
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 drop-shadow-sm">
                            {post.caption}
                          </p>
                        )}
                      </div>

                      {/* Mock Social Interactions Sidebar */}
                      <div className="flex flex-col items-center gap-3 text-white/90 shrink-0">
                        <div className="flex flex-col items-center gap-0.5">
                          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                          <span className="text-[9px] font-bold">24.5K</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-[9px] font-bold">482</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <Share2 className="w-5 h-5" />
                          <span className="text-[9px] font-bold">Share</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{post.publishDate ? formatDate(post.publishDate) : "Belum terjadwal"}</span>
                      <span className="text-pink-400 font-semibold group-hover:underline">
                        Buka Detail ›
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
