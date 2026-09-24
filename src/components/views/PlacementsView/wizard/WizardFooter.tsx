"use client";

import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { WizardStepId } from "./placementWizardHelpers";

interface WizardFooterProps {
  currentStep: WizardStepId;
  onPrevStep: () => void;
  onNextStep: () => void;
  canAdvance: boolean;
  onClose: () => void;
  isSaving: boolean;
  isEditMode: boolean;
  canSubmitDirectly: boolean;
}

export function WizardFooter({
  currentStep,
  onPrevStep,
  onNextStep,
  canAdvance,
  onClose,
  isSaving,
  isEditMode,
  canSubmitDirectly,
}: WizardFooterProps) {
  const isFinalStep = currentStep === 4;

  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
      {/* Left Action: Cancel or Back */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          Batal
        </button>

        {currentStep > 1 && (
          <button
            type="button"
            onClick={onPrevStep}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
        )}
      </div>

      {/* Right Action: Next or Submit */}
      <div className="flex items-center gap-2">
        {/* Fast-submit button if already valid before step 4 (e.g. In Progress edit) */}
        {!isFinalStep && canSubmitDirectly && (
          <button
            type="submit"
            disabled={isSaving}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-600" />
            <span>Simpan Cepat</span>
          </button>
        )}

        {!isFinalStep ? (
          <button
            type="button"
            onClick={onNextStep}
            disabled={!canAdvance || isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-lime-600 hover:bg-lime-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Lanjut</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canAdvance || isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-lime-600 hover:bg-lime-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isEditMode ? "Perbarui Eksekusi" : "Simpan Eksekusi POSM"}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
