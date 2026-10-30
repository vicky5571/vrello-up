import {
  Kanban,
  List,
  Calendar,
  Sparkles,
  CalendarDays,
  MapPin,
  FileSignature,
  Building2,
  Store,
  Layers,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import type { ViewMode } from "@/types";

export interface NavItem {
  id: ViewMode;
  label: string;
  icon: typeof Kanban;
  iconColor?: string;
  badge?: string;
}

export const PROJECTS_NAV_ITEMS: NavItem[] = [
  { id: "board", label: "Kanban Board", icon: Kanban, iconColor: "text-blue-500" },
  { id: "list", label: "List", icon: List, iconColor: "text-slate-500" },
  { id: "calendar", label: "Calendar", icon: Calendar, iconColor: "text-emerald-500" },
];

export const MARCOM_WORK_ITEMS: NavItem[] = [
  { id: "pipeline", label: "Pipeline & Status", icon: Layers, iconColor: "text-indigo-500" },
  { id: "content-planner", label: "Content Planner", icon: Sparkles, iconColor: "text-pink-500" },
  { id: "events", label: "Field Events", icon: CalendarDays, iconColor: "text-blue-500" },
  { id: "placements", label: "Media Placements", icon: MapPin, iconColor: "text-emerald-500" },
  { id: "mous", label: "MOU & Partnerships", icon: FileSignature, iconColor: "text-amber-500" },
];

export const MARCOM_MASTER_DATA: NavItem[] = [
  { id: "branches", label: "Branches", icon: Building2, iconColor: "text-cyan-500" },
  { id: "outlets", label: "Outlets Directory", icon: Store, iconColor: "text-violet-500" },
  { id: "documents", label: "Legal & Docs", icon: FileText, iconColor: "text-teal-500" },
  { id: "reports", label: "Reports & Exports", icon: BarChart3, iconColor: "text-orange-500" },
  { id: "analytics", label: "Analytics & ROI", icon: TrendingUp, iconColor: "text-rose-500" },
];

