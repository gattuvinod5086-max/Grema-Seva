import { useState } from "react";
import { Search, AlertTriangle, Navigation } from "lucide-react";
import EmergencyQuickActions from "./EmergencyQuickActions";
import EmergencyContactCard, { NationalServiceCard } from "./EmergencyContactCard";
import CallButton from "./CallButton";
import {
  NATIONAL_EMERGENCY_SERVICES,
  WOMEN_CHILD_SUPPORT_SERVICES,
  EMERGENCY_ISSUE_CATEGORY,
} from "@/shared/constants/emergency";
import type { UserEmergencyLocation } from "@/shared/services/emergencyLookup";
import type { EmergencyBundle } from "@/react-app/services/localEmergency";

export interface EmergencyAlertItem {
  id: string | number;
  title: string;
  description?: string;
  priority?: string;
  publishedBy?: string;
}

export interface EmergencyHomeProps {
  location: UserEmergencyLocation;
  bundle: EmergencyBundle;
  alerts?: EmergencyAlertItem[];
  isDemoMode?: boolean;
  onUseGps?: () => void;
  gpsLoading?: boolean;
  onReportIssue?: (category: string, priority: string) => void;
  onSearch?: (query: string, serviceType?: string) => void;
  searchResults?: EmergencyBundle["localContacts"];
  showManageLink?: boolean;
  onManage?: () => void;
  backLink?: React.ReactNode;
}

export default function EmergencyHome({
  location,
  bundle,
  alerts = [],
  isDemoMode,
  onUseGps,
  gpsLoading,
  onReportIssue,
  onSearch,
  searchResults,
  showManageLink,
  onManage,
  backLink,
}: EmergencyHomeProps) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  const displayContacts = searchResults ?? bundle.localContacts;

  const handleSearch = (q: string, type?: string) => {
    setQuery(q);
    if (type !== undefined) setFilterType(type);
    onSearch?.(q, type || undefined);
  };

  const nearestHospital = bundle.health.nearest;

  return (
    <div className="space-y-8 animate-in">
      {backLink}

      {isDemoMode && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-center">
          <p className="text-xs font-black uppercase text-amber-900">
            ⚠️ DEMO DATA — Local emergency contacts are placeholders. National numbers (112, 108) are official references — verify before production.
          </p>
        </div>
      )}

      {/* Emergency alerts from verified news source only */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-tg-maroon flex items-center gap-2">
            <AlertTriangle size={18} /> Emergency Alerts
          </h2>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 shadow-md"
            >
              <p className="text-[10px] font-black uppercase text-red-700">🚨 {a.priority ?? "URGENT"}</p>
              <p className="font-black text-slate-900 mt-1">{a.title}</p>
              {a.description && <p className="text-sm text-slate-700 mt-1">{a.description}</p>}
              {a.publishedBy && (
                <p className="text-xs text-slate-500 mt-2">Published by: {a.publishedBy}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Location header */}
      <section className="rounded-2xl border-2 border-tg-gold/40 bg-white p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-tg-maroon mb-1">
              📍 Your Location
            </p>
            <p className="font-black text-xl text-slate-900">
              {location.village ?? "—"}, {location.mandal ?? "—"}
            </p>
            <p className="text-sm text-slate-600">{location.district ?? "—"} District</p>
            {location.ward && (
              <p className="text-xs text-slate-500 mt-1">Ward {location.ward}</p>
            )}
          </div>
          {onUseGps && (
            <button
              type="button"
              onClick={onUseGps}
              disabled={gpsLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-tg-green/40 text-tg-green font-bold text-xs uppercase hover:bg-tg-green/5 disabled:opacity-50"
            >
              <Navigation size={16} />
              {gpsLoading ? "Locating…" : "Use my current location"}
            </button>
          )}
        </div>
      </section>

      {/* Immediate emergency */}
      <section>
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <span>🚨</span> Immediate Emergency
        </h2>
        <EmergencyQuickActions national={NATIONAL_EMERGENCY_SERVICES} />
        <p className="text-xs text-slate-500 mt-3 text-center">
          For life-threatening emergencies, call immediately. GPS is not required.
        </p>
      </section>

      {/* National services */}
      <section>
        <h2 className="text-lg font-black text-slate-900 mb-4">National Emergency Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NATIONAL_EMERGENCY_SERVICES.map((svc) => (
            <NationalServiceCard key={svc.id} {...svc} />
          ))}
        </div>
      </section>

      {/* Search */}
      {onSearch && (
        <section className="rounded-2xl bg-white border-2 border-slate-100 p-4 shadow-md">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => handleSearch(e.target.value, filterType)}
                placeholder="Search emergency contacts…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-tg-gold/50 font-medium"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => handleSearch(query, e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm"
            >
              <option value="">All services</option>
              <option value="POLICE">Police</option>
              <option value="PHC">PHC</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="FIRE">Fire</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="WATER">Water</option>
              <option value="PANCHAYAT">Panchayat</option>
            </select>
          </div>
        </section>
      )}

      {/* Local contacts */}
      <section>
        <h2 className="text-lg font-black text-slate-900 mb-4">📍 Your Local Contacts</h2>
        <div className="space-y-4">
          {/* Police */}
          {bundle.police && (
            <EmergencyContactCard
              contact={{
                ...bundle.police,
                service_type: "POLICE",
                phone: bundle.police.phone,
              }}
              callLabel="Call Police Station"
              urgent
            />
          )}

          {/* Health */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-800 flex items-center gap-2">🏥 Health Emergency</h3>
            <NationalServiceCard
              name="Emergency Ambulance (108)"
              number="108"
              description="State ambulance and emergency medical services."
              availability="24/7"
              source="Telangana EMRI — verify before production"
            />
            {bundle.health.phc && (
              <EmergencyContactCard contact={bundle.health.phc} callLabel="Call PHC" />
            )}
            {bundle.health.hospital && (
              <EmergencyContactCard contact={bundle.health.hospital} callLabel="Call Hospital" />
            )}
            {nearestHospital && (
              <EmergencyContactCard
                contact={nearestHospital}
                callLabel="Call Nearest Facility"
              />
            )}
          </div>

          {/* Fire */}
          {bundle.fire && (
            <EmergencyContactCard contact={bundle.fire} callLabel="Call Fire Station" urgent />
          )}

          {/* Electricity */}
          {bundle.electricity && (
            <EmergencyContactCard
              contact={bundle.electricity}
              callLabel="Call Electricity Emergency"
              onReportIssue={
                onReportIssue
                  ? () => {
                      const cfg = EMERGENCY_ISSUE_CATEGORY.ELECTRICITY;
                      onReportIssue(cfg.category, cfg.priority);
                    }
                  : undefined
              }
              reportLabel="Report Electricity Issue"
            />
          )}

          {/* Water */}
          {bundle.water && (
            <EmergencyContactCard
              contact={bundle.water}
              callLabel="Call Water Contact"
              onReportIssue={
                onReportIssue
                  ? () => {
                      const cfg = EMERGENCY_ISSUE_CATEGORY.WATER;
                      onReportIssue(cfg.category, cfg.priority);
                    }
                  : undefined
              }
              reportLabel="Report Water Problem"
            />
          )}

          {/* Panchayat leaders */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-800 flex items-center gap-2">🏛 Panchayat</h3>
            {bundle.panchayat.map((p) => (
              <EmergencyContactCard key={p.id} contact={p} callLabel="Call Panchayat Office" />
            ))}
            {bundle.panchayatLeaders.map((leader) => (
              <div
                key={leader.id}
                className="rounded-2xl border-2 border-tg-gold/20 bg-white p-4 shadow-md"
              >
                <p className="font-black text-slate-900">{leader.name}</p>
                <p className="text-xs text-slate-500 uppercase font-bold">{leader.role}{leader.ward !== "All" ? ` • Ward ${leader.ward}` : ""}</p>
                <div className="mt-3">
                  <CallButton phone={leader.phone} label={`Call ${leader.role}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Search results / extra local */}
          {displayContacts
            .filter((c) => !["POLICE", "PHC", "HOSPITAL", "FIRE", "ELECTRICITY", "WATER", "PANCHAYAT"].includes(c.service_type) || query)
            .map((c) => (
              <EmergencyContactCard key={c.id} contact={c} />
            ))}
        </div>
      </section>

      {/* Other support */}
      <section>
        <h2 className="text-lg font-black text-slate-900 mb-4">🆘 Other Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WOMEN_CHILD_SUPPORT_SERVICES.map((svc) => (
            <NationalServiceCard key={svc.id} {...svc} urgent={false} />
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Disaster and weather alerts will appear here when connected to a verified official source. No live alerts are shown without verification.
        </p>
      </section>

      {showManageLink && onManage && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onManage}
            className="text-xs font-black uppercase text-tg-maroon underline"
          >
            Manage Emergency Contacts (Admin)
          </button>
        </div>
      )}
    </div>
  );
}
