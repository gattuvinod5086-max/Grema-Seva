import CallButton from "./CallButton";
import DirectionsButton from "./DirectionsButton";

const SERVICE_ICONS: Record<string, string> = {
  POLICE: "🚔",
  AMBULANCE: "🚑",
  HOSPITAL: "🏥",
  PHC: "🏥",
  FIRE: "🔥",
  ELECTRICITY: "⚡",
  WATER: "💧",
  PANCHAYAT: "🏛",
  WOMEN_SUPPORT: "👩",
  CHILD_SUPPORT: "👶",
  DISASTER: "⚠️",
  OTHER: "📞",
};

interface EmergencyContactCardProps {
  contact: {
    name: string;
    service_type?: string;
    phone?: string | null;
    alternate_phone?: string | null;
    address?: string | null;
    district?: string | null;
    mandal?: string | null;
    village?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    jurisdiction?: string | null;
    description?: string | null;
    source?: string | null;
    verified_at?: string | null;
    distance_km?: number;
    isDemoData?: boolean;
  };
  callLabel?: string;
  onReportIssue?: () => void;
  reportLabel?: string;
  urgent?: boolean;
}

export default function EmergencyContactCard({
  contact,
  callLabel,
  onReportIssue,
  reportLabel,
  urgent,
}: EmergencyContactCardProps) {
  const icon = SERVICE_ICONS[contact.service_type ?? "OTHER"] ?? "📞";
  const phone = contact.phone ?? contact.alternate_phone;

  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl" aria-hidden>{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 text-lg leading-tight">{contact.name}</h3>
          {(contact.mandal || contact.district) && (
            <p className="text-xs text-slate-500 mt-1">
              {[contact.mandal, contact.district].filter(Boolean).join(" • ")}
            </p>
          )}
          {contact.description && (
            <p className="text-sm text-slate-600 mt-2">{contact.description}</p>
          )}
          {contact.address && (
            <p className="text-sm text-slate-500 mt-1">📍 {contact.address}</p>
          )}
          {contact.distance_km != null && (
            <p className="text-sm font-bold text-tg-green mt-1">Distance: {contact.distance_km} km</p>
          )}
          {contact.isDemoData && (
            <p className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2 inline-block">
              DEMO DATA — not verified for production
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {phone && (
          <CallButton
            phone={phone}
            label={callLabel ?? `Call ${contact.service_type ?? "Contact"}`}
            urgent={urgent}
          />
        )}
        {onReportIssue && (
          <button
            type="button"
            onClick={onReportIssue}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-tg-maroon/30 text-tg-maroon font-black text-xs uppercase min-h-[48px] hover:bg-tg-maroon/5"
          >
            {reportLabel ?? "Report Issue"}
          </button>
        )}
      </div>

      {contact.latitude != null && contact.longitude != null && (
        <div className="mt-4">
          <DirectionsButton latitude={contact.latitude} longitude={contact.longitude} />
        </div>
      )}
    </div>
  );
}

export function NationalServiceCard({
  name,
  number,
  description,
  availability,
  source,
  urgent = true,
}: {
  name: string;
  number: string;
  description: string;
  availability?: string;
  source?: string;
  urgent?: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-tg-maroon/20 bg-gradient-to-br from-white to-rose-50/40 p-5 shadow-md">
      <h3 className="font-black text-slate-900">{name}</h3>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
      {availability && (
        <p className="text-xs text-slate-500 mt-1">Available: {availability}</p>
      )}
      {urgent && (
        <p className="text-[10px] font-black uppercase text-tg-maroon mt-2">
          Use for immediate emergency
        </p>
      )}
      <div className="mt-4">
        <CallButton phone={number} label="Call Now" urgent={urgent} />
      </div>
      {source && (
        <p className="text-[10px] text-slate-400 mt-3">Source: {source}</p>
      )}
    </div>
  );
}
