"use client";

import React from "react";
import { User, Calendar, Package, ClipboardCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BORROW_WIZARD_STEPS,
  type BorrowWizardStepId,
} from "./borrowWizardHelpers";

interface BorrowStepperHeaderProps {
  currentStep: BorrowWizardStepId;
  onSelectStep: (step: BorrowWizardStepId) => void;
  completionStatus: Record<BorrowWizardStepId, boolean>;
}

const STEP_ICONS: Record<
  BorrowWizardStepId,
  React.ComponentType<{ className?: string }>
> = {
  1: User,
  2: Calendar,
  3: Package,
  4: ClipboardCheck,
};

export function BorrowStepperHeader({
  currentStep,
  onSelectStep,
  completionStatus,
}: BorrowStepperHeaderProps) {
  return (
    <div className="space-y-2.5 pt-3 pb-1 border-t border-slate-100 dark:border-slate-800">
      {/* 4 Step Pills */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {BORROW_WIZARD_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.step];
          const isCurrent = currentStep === s.step;
          const isCompleted = s.step < 4 && completionStatus[s.step];
          const isStep4Ready =
            s.step === 4 &&
            completionStatus[1] &&
            completionStatus[2] &&
            completionStatus[3];
          const isClickable = isCompleted || isStep4Ready || s.step <= currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(s.step)}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-xl border text-left transition-all text-xs font-semibold",
                isCurrent
                  ? "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/40 ring-2 ring-blue-500/20 shadow-xs"
                  : isClickable
                  ? "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                  isCurrent
                    ? "bg-blue-600 text-white shadow-2xs"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  s.step
                )}
              </span>

              {/* Label */}
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="truncate text-[11px] leading-tight font-bold">
                  {s.shortLabel}
                </span>
                <span className="truncate text-[9px] opacity-75 font-normal">
                  Langkah {s.step}
                </span>
              </div>

              {/* Mobile icon only */}
              <Icon className="w-3.5 h-3.5 sm:hidden shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}
