"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Copy,
  Check,
  Monitor,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { toast } from "sonner";

interface CallModalProps {
  isOpen: boolean;
  mode: "audio" | "video";
  onClose: () => void;
}

export function CallModal({ isOpen, mode, onClose }: CallModalProps) {
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(mode === "audio");
  const [copied, setCopied] = useState(false);

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = currentWorkspace?.members || [];

  const handleCopy = () => {
    navigator.clipboard.writeText("https://vrello-up.dev/huddle/sprint-sync-42");
    setCopied(true);
    toast.success("Meeting link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    toast.info("Left meeting room");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-xl rounded-2xl bg-[#0F1115] border border-white/10 shadow-2xl p-6 text-white overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    mode === "video"
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {mode === "video" ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {mode === "video" ? "Team Video Meeting" : "Live Audio Huddle"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sprint 42 Sync • {members.length} participants active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-white/10 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? "Copied" : "Copy Link"}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Stage Grid */}
            <div className="py-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.map((member, i) => (
                <div
                  key={member.id}
                  className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all aspect-video"
                >
                  <div className="relative">
                    <UserAvatar user={member} size="lg" />
                    {i === 0 && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#0F1115]" />
                    )}
                  </div>
                  <span className="text-xs font-semibold mt-2 truncate max-w-[120px] text-slate-200">
                    {member.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {member.role || "Member"}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  toast(next ? "Microphone muted" : "Microphone unmuted");
                }}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isMuted
                    ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title={isMuted ? "Unmute mic" : "Mute mic"}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !isVideoOff;
                  setIsVideoOff(next);
                  toast(next ? "Camera turned off" : "Camera turned on");
                }}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isVideoOff
                    ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? (
                  <VideoOff className="w-4 h-4" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => toast.info("Screen sharing started")}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Share screen"
              >
                <Monitor className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleLeave}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
