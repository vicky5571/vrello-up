"use client";

import React from "react";
import { Store, Layers, Camera, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WIZARD_STEPS,
  type WizardStepId,
} from "./placementWizardHelpers";

interface WizardStepperHeaderProps {
  currentStep: WizardStepId;
  onSelectStep: (step: WizardStepId) => void;
  completionStatus: Record<WizardStepId, boolean>;
}

const STEP_ICONS: Record<WizardStepId, React.ComponentType<{ className?: string }>> = {
  1: Store,
  2: Layers,
  3: Camera,
  4: MapPin,
};

export function WizardStepperHeader({
  currentStep,
  onSelectStep,
  completionStatus,
}: WizardStepperHeaderProps) {
  return (
    <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
      {/* 4 Step Pills */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {WIZARD_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.step];
          const isCurrent = currentStep === s.step;
          const isCompleted = completionStatus[s.step];
          const isClickable = isCompleted || s.step <= currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(s.step)}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-xl border text-left transition-all text-xs font-semibold",
                isCurrent
                  ? "bg-lime-500/10 text-lime-800 dark:text-lime-300 border-lime-500/40 ring-2 ring-lime-500/20 shadow-xs"
                  : isCompleted
                  ? "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                  isCurrent
                    ? "bg-lime-600 text-white shadow-2xs"
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
          className="h-full bg-lime-500 transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}
