import CallButton from "./CallButton";
import type { NationalEmergencyService } from "@shared/constants/emergency";

interface EmergencyQuickActionsProps {
  national: NationalEmergencyService[];
  onSelectService?: (serviceType: string) => void;
}

export default function EmergencyQuickActions({ national, onSelectService: _onSelectService }: EmergencyQuickActionsProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {unique.map((svc) => (
        <div
          key={svc.id}
          className="rounded-2xl border border-rose-100 bg-[#FFF5F5] p-4 flex flex-col items-center text-center gap-1.5 shadow-xs"
        >
          <span className="text-3xl mb-0.5" aria-hidden>{icons[svc.service_type] ?? "🚨"}</span>
          <p className="font-bold text-sm text-slate-900">{labels[svc.service_type] ?? "Emergency"}</p>
          <p className="text-[9px] font-black uppercase tracking-wider text-red-700">Immediate Emergency</p>
          <div className="w-full mt-2">
            <CallButton
              phone={svc.number}
              label="Call Now"
              urgent
              className="w-full text-xs py-2 min-h-[36px] rounded-xl bg-[#8B0000] hover:bg-[#67001A]"
              showNumberOnDesktop={false}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
