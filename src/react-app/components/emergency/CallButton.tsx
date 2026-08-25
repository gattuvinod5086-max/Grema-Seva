import { Phone } from "lucide-react";
import { formatTelLink } from "@/shared/services/emergencyLookup";

interface CallButtonProps {
  phone: string;
  label: string;
  urgent?: boolean;
  className?: string;
  showNumberOnDesktop?: boolean;
}

export default function CallButton({
  phone,
  label,
  urgent,
  className = "",
  showNumberOnDesktop = true,
}: CallButtonProps) {
  const href = formatTelLink(phone);

  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all min-h-[48px] ${
        urgent
          ? "bg-red-700 text-white hover:bg-red-800 shadow-sm"
          : "bg-[#008A3B] text-white hover:opacity-95"
      } ${className}`}
    >
      <Phone size={18} strokeWidth={2.5} aria-hidden />
      <span>{label}</span>
      {showNumberOnDesktop && (
        <span className="hidden md:inline text-white/80 font-bold normal-case tracking-normal text-xs">
          ({phone})
        </span>
      )}
    </a>
  );
}
