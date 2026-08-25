import type { CSSProperties, ReactNode } from "react";

export function TerminalGlassCard({
  children,
  className = "",
  onClick,
  style,
}: {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-white border border-[#E5E7EB] shadow-sm rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children?: ReactNode;
  variant?: "default" | "maroon" | "gold" | "emerald" | "amber" | "blue" | "critical";
}) {
  const styles: Record<string, string> = {
    default: "bg-slate-50 text-slate-600 border-slate-200",
    maroon: "bg-[#67001A]/8 text-[#67001A] border-[#67001A]/15",
    gold: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    critical: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${styles[variant] ?? styles.default}`}
    >
      {children}
    </span>
  );
}
