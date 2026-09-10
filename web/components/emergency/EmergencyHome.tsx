import { useState } from "react";
import { Search, AlertTriangle, Navigation } from "lucide-react";
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
  isDemoMode: _isDemoMode,
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
    <div className="space-y-6 animate-in">
      {backLink}

      {/* Demo Guidance & Warning Banners */}
      <div className="space-y-2.5">
        <div className="rounded-xl border border-blue-200 bg-[#EFF6FF] px-4 py-3 text-center text-xs text-blue-900 font-medium">
          Showing demo contacts for {location.village || "Bhongir City"}. Log in to the terminal for contacts matched to your village.
        </div>

        <div className="rounded-xl border border-amber-300 bg-[#FEFCE8] px-4 py-3 text-center text-xs font-bold text-amber-900">
          ⚠️ DEMO DATA — LOCAL EMERGENCY CONTACTS ARE PLACEHOLDERS. NATIONAL NUMBERS (112, 108) ARE OFFICIAL REFERENCES — VERIFY BEFORE PRODUCTION.
        </div>
      </div>

      {/* Emergency alerts if any active */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#67001A] flex items-center gap-2">
            <AlertTriangle size={18} /> Emergency Alerts
          </h2>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 shadow-xs"
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

      {/* Location card */}
      <section className="rounded-3xl border border-amber-200/60 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> YOUR LOCATION
            </p>
            <h2 className="font-black text-2xl text-slate-900">
              {location.village || "Bhongir City"}, {location.mandal || "Bhongir"}
            </h2>
            <p className="text-sm font-medium text-slate-600">{location.district || "Yadadri Bhuvanagiri"} District</p>
            {location.ward && (
              <p className="text-xs text-slate-500 mt-0.5">Ward {location.ward}</p>
            )}
          </div>
          {onUseGps && (
            <button
              type="button"
              onClick={onUseGps}
              disabled={gpsLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#008A3B] text-[#008A3B] font-bold text-xs uppercase hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Navigation size={15} />
              {gpsLoading ? "Locating…" : "USE MY CURRENT LOCATION"}
            </button>
          )}
        </div>
      </section>

      {/* Immediate emergency */}
      <section>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-3">
          <span>🚨</span> Immediate Emergency
        </h2>
        <EmergencyQuickActions national={NATIONAL_EMERGENCY_SERVICES} />
        <p className="text-xs text-slate-500 mt-3 text-center">
          For life-threatening emergencies, call immediately. GPS is not required.
        </p>
      </section>

      {/* National services */}
      <section>
        <h2
          className="text-xl font-black text-slate-900 mb-4"
          style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
        >
          National Emergency Services
        </h2>
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
            <h3 className="font-bold text-slate-800 flex items-center gap-2">🏥 Health Emergency</h3>
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
            <h3 className="font-bold text-slate-800 flex items-center gap-2">🏛️ Panchayat</h3>
            {bundle.panchayat.map((p) => (
              <EmergencyContactCard key={p.id} contact={p} callLabel="Call Panchayat Office" />
            ))}
            {bundle.panchayatLeaders.map((leader) => (
              <div
                key={leader.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <p className="font-bold text-slate-900 text-base">{leader.name}</p>
                <p className="text-xs text-slate-500 uppercase font-black tracking-wider mt-0.5">{leader.role}{leader.ward !== "All" ? ` • Ward ${leader.ward}` : ""}</p>
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
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <span>🆘</span> Other Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WOMEN_CHILD_SUPPORT_SERVICES.map((svc) => (
            <NationalServiceCard key={svc.id} {...svc} urgent={false} />
          ))}
        </div>
      </section>

      {/* Footer weather & disaster disclaimer */}
      <div className="text-center pt-2 pb-6 text-xs text-slate-500 font-normal">
        Disaster and weather alerts will appear here when connected to a verified official source. No live alerts are shown without verification.
      </div>

      {showManageLink && onManage && (
        <div className="text-center pt-2">
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
