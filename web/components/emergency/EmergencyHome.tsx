import { useState } from "react";
import { Search, AlertTriangle, Navigation, MapPin } from "lucide-react";
import EmergencyQuickActions from "./EmergencyQuickActions";
import EmergencyContactCard, { NationalServiceCard } from "./EmergencyContactCard";
import CallButton from "./CallButton";
import {
  NATIONAL_EMERGENCY_SERVICES,
  WOMEN_CHILD_SUPPORT_SERVICES,
  EMERGENCY_ISSUE_CATEGORY,
} from "@shared/constants/emergency";
import type { UserEmergencyLocation } from "@shared/services/emergencyLookup";
import type { EmergencyBundle } from "@web/services/localEmergency";

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
            ⚠️ DEMO EMERGENCY DIRECTORY — Official numbers (112, 108, 100, 101, 1912) are live. Local PHC & police numbers are representative.
          </p>
        </div>
      )}

      {/* Emergency alerts */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#67001A] flex items-center gap-2">
            <AlertTriangle size={18} /> Emergency Alerts
          </h2>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase text-red-700">🚨 {a.priority ?? "URGENT"}</p>
              <p className="font-bold text-slate-900 mt-1">{a.title}</p>
              {a.description && <p className="text-sm text-slate-700 mt-1">{a.description}</p>}
              {a.publishedBy && (
                <p className="text-xs text-slate-500 mt-2">Published by: {a.publishedBy}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Location header */}
      <section className="rounded-3xl border-2 border-[#CCB252]/40 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#67001A] mb-1 flex items-center gap-1.5">
              <MapPin size={14} className="text-[#CCB252]" /> Active Jurisdiction & Area
            </p>
            <p className="font-black text-2xl text-slate-900">
              {location.village ?? "All Villages"}, {location.mandal ?? "Telangana State"}
            </p>
            <p className="text-sm text-slate-600">{location.district ?? "Telangana"} District</p>
            {location.ward && (
              <p className="text-xs text-slate-500 mt-1">Ward {location.ward}</p>
            )}
          </div>
          {onUseGps && (
            <button
              type="button"
              onClick={onUseGps}
              disabled={gpsLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#008A3B]/40 text-[#008A3B] font-bold text-xs uppercase hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Navigation size={16} />
              {gpsLoading ? "Locating…" : "Use My Location"}
            </button>
          )}
        </div>
      </section>

      {/* Immediate emergency */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>🚨</span> Immediate Emergency Response
          </h2>
          <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full uppercase">
            24x7 Toll Free
          </span>
        </div>
        <EmergencyQuickActions national={NATIONAL_EMERGENCY_SERVICES} />
        <p className="text-xs text-slate-500 mt-3 text-center">
          For life-threatening emergencies, call immediately. No mobile app sign-in or login is required.
        </p>
      </section>

      {/* National services */}
      <section>
        <h2 className="text-lg font-black text-slate-900 mb-4">National & State Emergency Lines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NATIONAL_EMERGENCY_SERVICES.map((svc) => (
            <NationalServiceCard key={svc.id} {...svc} />
          ))}
        </div>
      </section>

      {/* Search */}
      {onSearch && (
        <section className="rounded-2xl bg-white border-2 border-slate-100 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => handleSearch(e.target.value, filterType)}
                placeholder="Search emergency services, hospitals, police..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-[#CCB252] outline-none font-medium"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => handleSearch(query, e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-sm outline-none"
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
        <h2 className="text-lg font-black text-slate-900 mb-4">📍 Your Local Emergency Contacts</h2>
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
            <h3 className="font-bold text-slate-800 flex items-center gap-2">🏥 Health & Medical Support</h3>
            <NationalServiceCard
              name="Emergency Ambulance (108)"
              number="108"
              description="Telangana State ambulance and emergency medical response."
              availability="24/7"
              source="Telangana EMRI"
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
              callLabel="Call Water Support"
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
            <h3 className="font-bold text-slate-800 flex items-center gap-2">🏛 Panchayat Contacts</h3>
            {bundle.panchayat.map((p) => (
              <EmergencyContactCard key={p.id} contact={p} callLabel="Call Panchayat Office" />
            ))}
            {bundle.panchayatLeaders.map((leader) => (
              <div
                key={leader.id}
                className="rounded-2xl border-2 border-[#CCB252]/30 bg-white p-4 shadow-sm"
              >
                <p className="font-bold text-slate-900">{leader.name}</p>
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
        <h2 className="text-lg font-black text-slate-900 mb-4">🆘 Women & Child Protection Helplines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WOMEN_CHILD_SUPPORT_SERVICES.map((svc) => (
            <NationalServiceCard key={svc.id} {...svc} urgent={false} />
          ))}
        </div>
      </section>

      {showManageLink && onManage && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onManage}
            className="text-xs font-black uppercase text-[#67001A] underline"
          >
            Manage Emergency Directory (Admin)
          </button>
        </div>
      )}
    </div>
  );
}
