import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { computeSlaInfo } from "@/shared/services/sla";
import { useLanguage } from "@/react-app/context/LanguageContext";

interface SlaDisplayProps {
  createdAt: string;
  priority?: string | null;
  slaDueAt?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  status?: string | null;
  compact?: boolean;
}

export default function SlaDisplay({
  createdAt,
  priority,
  slaDueAt,
  acknowledgedAt,
  resolvedAt,
  status,
  compact,
}: SlaDisplayProps) {
  const { t } = useLanguage();
  const sla = computeSlaInfo({
    createdAt,
    priority,
    slaDueAt,
    acknowledgedAt,
    resolvedAt,
    status,
  });

  const statusColors = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-800 border-red-200",
  };

  const statusLabel =
    sla.status === "red"
      ? t.sla.breached
      : sla.status === "amber"
        ? t.sla.approaching
        : t.sla.withinSla;

  const Icon =
    sla.status === "red" ? AlertTriangle : sla.status === "amber" ? Clock : CheckCircle2;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${statusColors[sla.status]}`}>
        <Icon size={12} />
        {sla.timeRemainingLabel}
      </span>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 ${statusColors[sla.status]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">{statusLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[9px] font-black uppercase opacity-70">{t.sla.label}</p>
          <p className="font-black">{sla.slaHours} {t.sla.hours}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase opacity-70">{t.sla.timeRemaining}</p>
          <p className="font-black">{sla.timeRemainingLabel}</p>
        </div>
      </div>
    </div>
  );
}
