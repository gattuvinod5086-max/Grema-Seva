import { useState, useMemo } from "react";
import { Award, Building2, MapPin, X } from "lucide-react";
import VillageAnalytics from "@web/components/VillageAnalytics";
import { useApi } from "@web/hooks/useApi";
import type { IssueListResponse, User } from "@shared/types";
import { BRANDING } from "@web/constants/branding";
import {
  getDistrictNames,
  getMandalNames,
  getVillageNames,
} from "@shared/data/telangana";

export default function VillageAnalyticsPage() {
  const { data: userResp } = useApi<{ user: User }>("/api/users/me");
  const user = userResp?.user;
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isMandal = user?.role === "mandal_official";
  const isWardMember = user?.role === "ward_member";
  const isVillageScoped =
    user?.role === "citizen" ||
    user?.role === "sarpanch" ||
    user?.role === "ward_member";

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMandal, setSelectedMandal] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  // Build the API URL respecting hierarchy
  const issuesApiUrl = useMemo(() => {
    const p = new URLSearchParams({ limit: "100" });
    if (isAdmin) {
      if (selectedDistrict) p.set("district", selectedDistrict);
      if (selectedMandal) p.set("mandal", selectedMandal);
      if (selectedVillage) p.set("village", selectedVillage);
    } else if (isMandal) {
      if (user?.district) p.set("district", user.district);
      if (user?.mandal) p.set("mandal", user.mandal);
      if (selectedVillage) p.set("village", selectedVillage);
    } else if (isVillageScoped && user) {
      if (user.district) p.set("district", user.district);
      if (user.mandal) p.set("mandal", user.mandal);
      if (user.village) p.set("village", user.village);
      if (isWardMember && user.wardNumber) p.set("wardNumber", user.wardNumber);
    }
    const str = p.toString();
    return `/api/issues${str ? `?${str}` : ""}`;
  }, [isAdmin, isMandal, isVillageScoped, isWardMember, user, selectedDistrict, selectedMandal, selectedVillage]);

  const { data: issuesData, isLoading } = useApi<IssueListResponse>(issuesApiUrl);
  const issues = useMemo(() => issuesData?.issues ?? [], [issuesData]);

  // Determine active context and labels
  const { contextName, cardTitle, bannerTitle, bannerSubtitle } = useMemo(() => {
    if (selectedVillage) {
      return {
        contextName: selectedVillage,
        cardTitle: `${selectedVillage} Development Score`,
        bannerTitle: `${selectedVillage} Development Score & Analytics`,
        bannerSubtitle: `Real-time grievance redressal velocity, SLA compliance, and civic infrastructure metrics for ${selectedVillage}.`,
      };
    }
    if (selectedMandal) {
      return {
        contextName: `${selectedMandal} Mandal`,
        cardTitle: `${selectedMandal} Mandal Civic Health Index`,
        bannerTitle: `${selectedMandal} Mandal Civic Analytics`,
        bannerSubtitle: `Consolidated grievance redressal velocity, SLA compliance, and civic metrics across ${selectedMandal} Mandal.`,
      };
    }
    if (selectedDistrict) {
      return {
        contextName: `${selectedDistrict} District`,
        cardTitle: `${selectedDistrict} District Civic Health Index`,
        bannerTitle: `${selectedDistrict} District Civic Analytics`,
        bannerSubtitle: `State-level district performance metrics and civic infrastructure status for ${selectedDistrict} District.`,
      };
    }
    if (isMandal) {
      const mandalName = user?.mandal || "Mandal";
      return {
        contextName: `${mandalName} Mandal`,
        cardTitle: `${mandalName} Mandal Civic Health Index`,
        bannerTitle: `${mandalName} Mandal Civic Analytics`,
        bannerSubtitle: `Consolidated grievance redressal velocity, SLA compliance, and civic metrics across all villages in ${mandalName} Mandal.`,
      };
    }
    if (isAdmin) {
      return {
        contextName: "Telangana Statewide",
        cardTitle: "Telangana Statewide Civic Health Index",
        bannerTitle: "Statewide Civic Health & Analytics",
        bannerSubtitle: "Real-time grievance redressal velocity, SLA compliance, and civic infrastructure health across all 33 Telangana districts.",
      };
    }
    const villageName = user?.village || "Village";
    if (isWardMember && user?.wardNumber) {
      return {
        contextName: `Ward ${user.wardNumber} (${villageName})`,
        cardTitle: `Ward ${user.wardNumber} (${villageName}) Development Score`,
        bannerTitle: `Ward ${user.wardNumber} (${villageName}) Development Score & Analytics`,
        bannerSubtitle: `Real-time grievance redressal velocity, SLA compliance, and ward-level civic infrastructure metrics for Ward ${user.wardNumber} in ${villageName}.`,
      };
    }
    return {
      contextName: villageName,
      cardTitle: `${villageName} Development Score`,
      bannerTitle: `${villageName} Village Development Score & Analytics`,
      bannerSubtitle: `Real-time grievance redressal velocity, SLA compliance, and civic infrastructure metrics for ${villageName}.`,
    };
  }, [selectedVillage, selectedMandal, selectedDistrict, isMandal, isAdmin, isWardMember, user?.wardNumber, user?.mandal, user?.village]);

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border-2 border-[#CCB252]"
        style={{ background: "linear-gradient(135deg, #67001A 0%, #8A1538 50%, #4d0012 100%)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#CCB252] uppercase tracking-wider mb-3">
            <Award size={14} /> Palle Pragathi Metrics
          </div>
          <p className="text-xs font-telugu text-[#CCB252] font-semibold telugu-text">గ్రామ అభివృద్ధి కొలమానం</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2 mb-3 leading-tight">
            {bannerTitle}
          </h1>
          <p className="text-sm md:text-base text-white/90 leading-relaxed">
            {bannerSubtitle}
          </p>
        </div>
        <img
          src={BRANDING.bgMap}
          className="absolute -right-20 -bottom-20 w-[350px] opacity-[0.06] pointer-events-none"
          alt=""
          aria-hidden
        />
      </div>

      {/* Analytics Card with Location Drill-Down Filter */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-sm space-y-6">
        {/* Admin Location Selector */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[#67001A]" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Jurisdiction Filter:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* District */}
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedMandal("");
                  setSelectedVillage("");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="">All Telangana (33 Districts)</option>
                {getDistrictNames().map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Mandal */}
              {selectedDistrict && (
                <select
                  value={selectedMandal}
                  onChange={(e) => {
                    setSelectedMandal(e.target.value);
                    setSelectedVillage("");
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="">All Mandals ({selectedDistrict})</option>
                  {getMandalNames(selectedDistrict).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}

              {/* Village */}
              {selectedDistrict && selectedMandal && (
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="">All Villages ({selectedMandal})</option>
                  {getVillageNames(selectedDistrict, selectedMandal).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              )}

              {/* Reset Filter */}
              {(selectedDistrict || selectedMandal || selectedVillage) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDistrict("");
                    setSelectedMandal("");
                    setSelectedVillage("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 flex items-center gap-1 transition-colors"
                >
                  <X size={13} />
                  <span>Statewide</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mandal Official Location Selector */}
        {isMandal && (
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-indigo-700" />
              <span className="text-xs font-bold text-indigo-900">
                {user?.mandal} Mandal ({user?.district})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="">All Villages in Mandal</option>
                {user?.district && user?.mandal && getVillageNames(user.district, user.mandal).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {selectedVillage && (
                <button
                  type="button"
                  onClick={() => setSelectedVillage("")}
                  className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 flex items-center gap-1"
                >
                  <X size={13} />
                  <span>All Villages</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Citizen / Village Leader Fixed Location Badge */}
        {!isAdmin && !isMandal && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 w-fit text-xs font-semibold text-slate-700">
            <MapPin size={14} className="text-[#67001A]" />
            <span>
              Jurisdiction: <strong>{user?.village || "Registered Village"}</strong>
              {isWardMember && user?.wardNumber ? ` (Ward ${user.wardNumber})` : ""}, {user?.mandal} ({user?.district})
            </span>
          </div>
        )}

        {/* Analytics component with dynamic score title */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 font-semibold text-sm">
            Calculating civic health analytics for {contextName}…
          </div>
        ) : (
          <VillageAnalytics
            village={selectedVillage || (isAdmin || isMandal ? "All Villages" : (isWardMember && user?.wardNumber ? `Ward ${user.wardNumber} - ${user?.village}` : (user?.village || "")))}
            issues={issues}
            title={cardTitle}
          />
        )}
      </div>
    </div>
  );
}
