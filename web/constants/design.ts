import {
  Droplets,
  Construction,
  Zap,
  Trash2,
  HandHeart,
  Wheat,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

/** GramSeva design tokens — Telangana government-grade UI */
export const COLORS = {
  primary: "#67001A",
  primaryLight: "#8A1538",
  gold: "#CCB252",
  green: "#008A3B",
  bg: "#FAF9F6",
  white: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#64748B",
  border: "#E5E7EB",
} as const;

export const STATUS = {
  success: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  critical: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", dot: "bg-red-500" },
  info: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", dot: "bg-blue-500" },
  neutral: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
} as const;

export const ISSUE_STATUS_STYLE: Record<string, keyof typeof STATUS> = {
  Submitted: "neutral",
  Acknowledged: "info",
  "In Progress": "warning",
  Resolved: "success",
  Closed: "success",
  Reopened: "warning",
  SLA_BREACHED: "critical",
};

export const PRIORITY_STYLE: Record<string, keyof typeof STATUS> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "critical",
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Water: Droplets,
  Roads: Construction,
  Sanitation: Trash2,
  Electricity: Zap,
  Welfare: HandHeart,
  Agriculture: Wheat,
  Other: HelpCircle,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? HelpCircle;
}

/** Shared card / button utility classes */
export const UI = {
  card: "bg-white rounded-xl border border-[#E5E7EB] shadow-sm",
  cardHover: "hover:shadow-md hover:border-slate-200 transition-shadow duration-200",
  btnPrimary: "bg-[#67001A] hover:bg-[#8A1538] text-white font-semibold rounded-lg min-h-[48px] px-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67001A]/40 focus-visible:ring-offset-2",
  btnSecondary: "bg-white hover:bg-slate-50 text-[#1F2937] font-semibold rounded-lg border border-[#E5E7EB] min-h-[48px] px-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
  btnGhost: "text-[#67001A] hover:bg-[#67001A]/5 font-semibold rounded-lg min-h-[44px] px-4 transition-colors",
  page: "min-h-screen bg-[#FAF9F6] text-[#1F2937]",
  heading: "font-heading text-[#67001A]",
  label: "text-xs font-semibold uppercase tracking-wide text-[#64748B]",
} as const;
