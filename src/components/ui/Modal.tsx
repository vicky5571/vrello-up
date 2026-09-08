"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * Native HTML <dialog> modal primitive.
 * Provides browser-managed Top Layer promotion, automatic focus trapping,
 * background inerting, native Escape dismissal, and ::backdrop styling.
 */
export function Modal({
  isOpen,
  onClose,
  label,
  children,
  showCloseButton = true,
  panelClassName,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onCloseRef.current();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onCloseRef.current();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-label={label}
      className={cn(
        "backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs",
        "fixed inset-0 m-auto z-50 p-0 rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden focus:outline-hidden",
        "open:animate-in open:fade-in-0 open:zoom-in-95 duration-150",
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
    </dialog>
  );
}
