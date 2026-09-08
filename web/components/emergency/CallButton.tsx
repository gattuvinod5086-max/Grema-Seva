import { Phone } from "lucide-react";
import { formatTelLink } from "@shared/services/emergencyLookup";

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
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] shadow-sm hover:opacity-95 ${
        urgent
          ? "bg-red-700 text-white hover:bg-red-800"
          : "bg-[#008A3B] text-white hover:bg-[#059669]"
      } ${className}`}
    >
      <Phone size={18} strokeWidth={2.5} aria-hidden />
      <span>{label}</span>
      {showNumberOnDesktop && (
        <span className="hidden md:inline text-white/90 font-bold normal-case tracking-normal text-xs">
          ({phone})
        </span>
      )}
    </a>
  );
}
