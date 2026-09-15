"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Video,
  Play,
  X,
  ExternalLink,
  Clock,
  Building2,
  Calendar,
  Folder,
} from "lucide-react";
import type { FieldEventItem, EventFootage } from "@/types";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import { formatDate } from "@/lib/utils";

interface EventFootageModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FieldEventItem | null;
  initialClipIndex?: number;
}

export function EventFootageModal({
  isOpen,
  onClose,
  event,
  initialClipIndex = 0,
}: EventFootageModalProps) {
  const [activeClipIndex, setActiveClipIndex] = useState(initialClipIndex);

  useEffect(() => {
    setActiveClipIndex(initialClipIndex);
  }, [initialClipIndex, isOpen]);

  // Keyboard Escape dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const clips: EventFootage[] = event.footage && event.footage.length > 0
    ? event.footage
    : event.mediaUrl
    ? [
        {
          id: "primary-media",
          eventId: event.id,
          title: "Main Event Documentation",
          filePath: event.mediaUrl,
          duration: "Highlight",
        },
      ]
    : [];

  const activeClip = clips[activeClipIndex] || clips[0];
  const parsedDrive = activeClip?.filePath ? parseGoogleDriveUrl(activeClip.filePath) : null;
  const isVideoFile =
    activeClip?.filePath &&
    (activeClip.filePath.endsWith(".mp4") ||
      activeClip.filePath.endsWith(".mov") ||
      activeClip.filePath.endsWith(".webm") ||
      activeClip.filePath.includes("mixkit.co") ||
      activeClip.filePath.includes("assets."));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Film className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {event.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    {event.branchName || "Main Branch"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {event.startDate || event.date ? formatDate(event.startDate || event.date) : "Event Date"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content: Player + Playlist */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            {/* Player Area */}
            <div className="lg:col-span-2 p-4 flex flex-col justify-between bg-black/40">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
                {!activeClip ? (
                  <div className="text-center p-6 text-slate-500">
                    <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No video clips added yet.</p>
                  </div>
                ) : parsedDrive && parsedDrive.isValid && parsedDrive.embedUrl ? (
                  <iframe
                    src={parsedDrive.embedUrl}
                    title={activeClip.title}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen"
                  />
                ) : isVideoFile ? (
                  <video
                    key={activeClip.filePath}
                    src={activeClip.filePath}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                      <Play className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {activeClip.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm truncate mx-auto">
                        {activeClip.filePath}
                      </p>
                    </div>
                    <a
                      href={activeClip.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Media in New Tab</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Active Clip Details & External Actions */}
              {activeClip && (
                <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800/80">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-100 truncate">
                      {activeClip.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      {activeClip.duration && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {activeClip.duration}
                        </span>
                      )}
                      {parsedDrive?.isValid ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          Google Drive
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                          Direct Video
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={activeClip.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Source ↗</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Sidebar */}
            <div className="p-4 flex flex-col justify-between bg-slate-900/60 max-h-[460px] overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Clips List ({clips.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Select clip to watch
                  </span>
                </div>

                {clips.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No footage clips uploaded for this event yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clips.map((clip, idx) => {
                      const isActive = idx === activeClipIndex;
                      return (
                        <button
                          key={clip.id || idx}
                          type="button"
                          onClick={() => setActiveClipIndex(idx)}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            isActive
                              ? "bg-blue-600/15 border-blue-500/50 text-white shadow-2xs"
                              : "bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300"
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                              isActive
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate leading-tight">
                              {idx + 1}. {clip.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                              <span>{clip.duration || "01:30"}</span>
                              <span>•</span>
                              <span className="truncate opacity-75">
                                {clip.filePath.includes("drive.google")
                                  ? "Drive"
                                  : "MP4 / Cloud"}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Documentation Storage Archive Folder Link if provided */}
              {event.mediaUrl && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
                    Field Documentation Archive Folder
                  </span>
                  <a
                    href={event.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Open Raw Footage Folder (Drive)</span>
                    </span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
