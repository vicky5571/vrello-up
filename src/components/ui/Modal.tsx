"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "./useFocusTrap";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name announced by screen readers. */
  label: string;
  children: React.ReactNode;
  /** Show the built-in dismiss button in the header row. Default true. */
  showCloseButton?: boolean;
  /** Extra classes for the dialog panel (e.g. max-w). */
  panelClassName?: string;
}

/**
 * Shared accessible modal primitive: focus trap, return-focus, Escape to
 * close, backdrop click to close, and `role="dialog"` + `aria-modal`.
 * Prefer this over hand-rolled fixed overlays for every new dialog.
 */
export function Modal({
  isOpen,
  onClose,
  label,
  children,
  showCloseButton = true,
  panelClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap, Escape-to-close, and return-focus on unmount.
  useFocusTrap(panelRef, isOpen, { onEscape: onClose });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={cn(
              "relative z-10 w-full rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden focus:outline-hidden",
              panelClassName ?? "max-w-lg",
            )}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${label}`}
                className="absolute top-3 right-3 z-10 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
