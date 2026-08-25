import CallButton from "./CallButton";
import type { NationalEmergencyService } from "@/shared/constants/emergency";

interface EmergencyQuickActionsProps {
  national: NationalEmergencyService[];
  onSelectService?: (serviceType: string) => void;
}

export default function EmergencyQuickActions({ national, onSelectService }: EmergencyQuickActionsProps) {
  const quick = [
    national.find((s) => s.service_type === "POLICE") ?? national.find((s) => s.number === "100"),
    national.find((s) => s.service_type === "AMBULANCE"),
    national.find((s) => s.service_type === "FIRE"),
    national.find((s) => s.number === "112"),
  ].filter(Boolean) as NationalEmergencyService[];

  const icons: Record<string, string> = {
    POLICE: "🚔",
    AMBULANCE: "🚑",
    FIRE: "🔥",
    OTHER: "🚨",
  };

  const labels: Record<string, string> = {
    POLICE: "Police",
    AMBULANCE: "Ambulance",
    FIRE: "Fire",
    OTHER: "Emergency",
  };

  const unique = [...new Map(quick.map((s) => [s.id, s])).values()].slice(0, 4);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {unique.map((svc) => (
        <div
          key={svc.id}
          className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col items-center text-center gap-3"
        >
          <span className="text-3xl" aria-hidden>{icons[svc.service_type] ?? "🚨"}</span>
          <p className="font-semibold text-sm text-red-900">{labels[svc.service_type] ?? "Help"}</p>
          <p className="text-[10px] font-semibold uppercase text-red-700/80">Immediate emergency</p>
          <CallButton phone={svc.number} label="Call Now" urgent className="w-full text-xs py-2.5 min-h-[44px]" showNumberOnDesktop={false} />
          {onSelectService && (
            <button type="button" onClick={() => onSelectService(svc.service_type)} className="text-[10px] font-semibold text-red-800 underline">
              More info
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
