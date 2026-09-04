"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Plus,
  Folder,
  Layout,
  LayoutGrid,
  Code2,
  Palette,
  Rocket,
  Target,
  Zap,
  Layers,
  LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPACE_COLORS = [
  "#0D9488", // Teal
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#6366F1", // Indigo
  "#EF4444", // Red
];

const SPACE_ICON_MAP: Record<string, LucideIcon> = {
  Folder,
  Layout,
  LayoutGrid,
  Code2,
  Palette,
  Sparkles,
  Rocket,
  Target,
  Zap,
  Layers,
};

const SPACE_ICONS = Object.keys(SPACE_ICON_MAP);

export function CreateSpaceModal({ isOpen, onClose }: CreateSpaceModalProps) {
  const { createSpace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(SPACE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(SPACE_ICONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Space name is required");
      return;
    }

    createSpace(name.trim(), selectedIcon, selectedColor);
    toast.success(`Space "${name}" created!`);
    setName("");
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                Create New Space
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Space Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Space Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mobile Apps, Marketing Ops"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Space Icon Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Icon
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPACE_ICONS.map((icon) => {
                    const IconComponent = SPACE_ICON_MAP[icon] || Layers;
                    return (
                      <button
                        type="button"
                        key={icon}
                        onClick={() => setSelectedIcon(icon)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selectedIcon === icon
                            ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/50 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Space Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {SPACE_COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        selectedColor === color
                          ? "scale-110 border-slate-900 dark:border-white shadow-xs"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Space
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
