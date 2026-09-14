"use client";

import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { type Space } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Edit2,
  Trash2,
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
  LucideIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface EditSpaceModalProps {
  isOpen: boolean;
  space: Space | null;
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

export function EditSpaceModal({ isOpen, space, onClose }: EditSpaceModalProps) {
  const { updateSpace, deleteSpace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(SPACE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(SPACE_ICONS[0]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (space) {
      setName(space.name);
      setSelectedColor(space.color || SPACE_COLORS[0]);
      setSelectedIcon(space.icon || SPACE_ICONS[0]);
      setIsConfirmingDelete(false);
    }
  }, [space, isOpen]);

  if (!space) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Space name cannot be empty");
      return;
    }

    updateSpace(space.id, {
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
    toast.success(`Space "${name}" updated!`);
    onClose();
  };

  const handleDelete = () => {
    deleteSpace(space.id);
    toast.success(`Space "${space.name}" deleted`);
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
            exit={{ opacity: 0, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-500" />
                Edit Space
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Design & Product"
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

              {/* Danger Zone: Delete */}
              <div className="pt-2">
                {!isConfirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete this Space
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Confirm deletion? All lists & tasks will be removed.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
                  Save Changes
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
