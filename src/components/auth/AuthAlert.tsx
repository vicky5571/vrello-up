import type { ReactNode } from "react";
import { AlertCircle, Clock, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthAlertTone = "error" | "warning" | "info";

const TONE_STYLES: Record<AuthAlertTone, { wrap: string; icon: LucideIcon }> = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    icon: AlertCircle,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    icon: Clock,
  },
  info: {
    wrap: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300",
    icon: Info,
  },
};

interface AuthAlertProps {
  tone?: AuthAlertTone;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function AuthAlert({
  tone = "error",
  children,
  icon,
  className,
}: AuthAlertProps) {
  const style = TONE_STYLES[tone];
  const Icon = icon ?? style.icon;

  return (
    <div
      role={tone === "info" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-relaxed",
        style.wrap,
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
