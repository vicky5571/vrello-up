"use client";

import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle, AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmDialogVariant = "danger" | "warning" | "default";

export interface ConfirmDialogItemDetails {
  name: string;
  code?: string;
  badgeText?: string;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  itemDetails?: ConfirmDialogItemDetails;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  itemDetails,
}: ConfirmDialogProps) {
  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      label={title}
      showCloseButton={!isLoading}
      panelClassName="max-w-md w-full p-6 text-left"
    >
      <div className="flex flex-col">
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              variant === "danger" &&
                "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
              variant === "warning" &&
                "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
              variant === "default" &&
                "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
            )}
          >
            {variant === "danger" && <AlertTriangle className="w-5 h-5" />}
            {variant === "warning" && <AlertCircle className="w-5 h-5" />}
            {variant === "default" && <HelpCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </div>

        {/* Contextual itemDetails card */}
        {itemDetails && (
          <div className="mt-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 truncate">
              {itemDetails.code && (
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                  [{itemDetails.code}]
                </span>
              )}
              <span
                className="text-slate-700 dark:text-slate-300 font-medium truncate"
                title={itemDetails.name}
              >
                {itemDetails.name}
              </span>
            </div>
            {itemDetails.badgeText && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                {itemDetails.badgeText}
              </span>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer",
              variant === "danger" && "bg-rose-600 hover:bg-rose-700",
              variant === "warning" && "bg-amber-600 hover:bg-amber-700",
              variant === "default" && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
