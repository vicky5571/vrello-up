"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gem, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlanTier {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  isPopular?: boolean;
  description: string;
  features: string[];
}

const PLANS: PlanTier[] = [
  {
    id: "free",
    name: "Free Forever",
    price: "$0",
    period: "forever",
    description: "Best for personal productivity and small tasks.",
    features: [
      "Up to 100MB Storage",
      "Unlimited tasks & spaces",
      "List & Board Views",
      "ClickUp 3.0 Theme",
      "Standard Brain² offline AI",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$7",
    period: "/user /month",
    badge: "Popular",
    isPopular: true,
    description: "For fast-moving engineering and product teams.",
    features: [
      "Everything in Free, plus:",
      "Interactive Gantt & Timeline Dependencies",
      "Full Table View & Column Resizing",
      "Unlimited Brain² AI Prompts",
      "Custom Statuses & Workspace Tags",
      "Advanced Multi-Filter Controls",
    ],
  },
  {
    id: "business",
    name: "Business Plus",
    price: "$12",
    period: "/user /month",
    description: "For scaling companies needing advanced security.",
    features: [
      "Everything in Unlimited, plus:",
      "Custom Role-Based Permissions (RBAC)",
      "Automated Sprint & Velocity Reports",
      "Priority 24/7 SLA Support",
      "Custom Branding & White Labeling",
    ],
  },
];

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("unlimited");

  const handleUpgrade = (planName: string) => {
    toast.success(`Successfully upgraded to ${planName} plan! All features unlocked.`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center shadow-xs">
                  <Gem className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Upgrade Your Vrello-Up Workspace
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-600 dark:text-amber-400">
                      30-Day Money Back Guarantee
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Supercharge team workflows with Gantt dependencies, TanStack Table, and Brain² AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isPopular = !!plan.isPopular;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#7B68EE] ring-2 ring-[#7B68EE]/30 bg-gradient-to-b from-[#7B68EE]/5 to-transparent dark:from-[#7B68EE]/10 shadow-lg shadow-[#7B68EE]/10"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7B68EE] text-white shadow-xs">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {plan.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 min-h-[32px]">
                        {plan.description}
                      </p>

                      <div className="flex items-baseline gap-1 my-4">
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                          {plan.price}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {plan.period}
                        </span>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                        {plan.features.map((feat, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpgrade(plan.name);
                        }}
                        className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          plan.id === "free"
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                            : isPopular
                            ? "bg-[#7B68EE] hover:bg-[#6C57ED] text-white shadow-md shadow-[#7B68EE]/20"
                            : "bg-[#111318] dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100"
                        }`}
                      >
                        {plan.id === "free"
                          ? "Current Plan"
                          : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer Assurance */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Enterprise SOC2 Type II Certified & End-to-End Encrypted</span>
              </div>
              <span>Cancel or change plans anytime with zero penalty.</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
