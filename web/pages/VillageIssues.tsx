import { useMemo, useState } from "react";
import { ArrowLeft, AlertCircle, RefreshCw, Bell, MapPin, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useApi } from "@web/hooks/useApi";
import IssueList from "@web/components/IssueList";
import IssuesMap from "@web/components/map/IssuesMap";
import { UserProfileCapsule } from "@web/components/ui/UserRoleBadge";
import { useRealtimeEvent, LiveIndicator } from "@web/context/RealtimeContext";
import NotificationBell from "@web/components/NotificationBell";
import { getDistrictNames, getMandalNames, getVillageNames } from "@shared/data/telangana";
import type { IssueListResponse, User } from "@shared/types";
import { ISSUE_CATEGORIES } from "@shared/constants/governance";
import { ISSUE_STATUSES } from "@shared/types";

export default function VillageIssues() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: meData } = useApi<{ user: User }>('/api/users/me');
  const me = meData?.user ?? null;

  const district = searchParams.get("district")?.trim() ?? "";
  const mandal = searchParams.get("mandal")?.trim() ?? "";
  const village = searchParams.get("village")?.trim() ?? "";

  const updateLocation = (newDistrict: string, newMandal = "", newVillage = "") => {
    const p = new URLSearchParams(searchParams);
    if (newDistrict) p.set("district", newDistrict);
    else p.delete("district");
    if (newMandal) p.set("mandal", newMandal);
    else p.delete("mandal");
    if (newVillage) p.set("village", newVillage);
    else p.delete("village");
    setSearchParams(p);
  };

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (district) params.set("district", district);
    if (mandal) params.set("mandal", mandal);
    if (village) params.set("village", village);
    return `/api/issues?${params.toString()}`;
  }, [statusFilter, categoryFilter, district, mandal, village]);

  const { data, isLoading, error, refetch } = useApi<IssueListResponse>(apiUrl);
  const issues = data?.issues ?? [];

  // Automatically refresh issue list on any real-time issue event
  useRealtimeEvent(['issue'], () => {
    void refetch();
  });

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const i of issues) byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
    return byStatus;
  }, [issues]);

  const title = village || mandal || district || "Issues";
  const subtitle = [district, mandal, village].filter(Boolean).join(" • ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/telangana")}
              className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl shadow hover:shadow-md transition-all text-gray-700 font-bold text-xs border border-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Districts & Villages</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <LiveIndicator />
              <NotificationBell />
              <UserProfileCapsule user={me} />
              {village && (
                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams();
                    if (district) p.set("district", district);
                    if (mandal) p.set("mandal", mandal);
                    if (village) p.set("village", village);
                    p.set("type", "notice");
                    navigate(`/notices?${p.toString()}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-all"
                  title="View official notices for this village"
                >
                  <Bell className="w-3.5 h-3.5 text-[#CCB252]" />
                  <span>Village Notices</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:shadow-md transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Location filter: District */}
          <select
            value={district}
            onChange={(e) => updateLocation(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            aria-label="Filter by district"
          >
            <option value="">All Districts</option>
            {getDistrictNames().map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Location filter: Mandal */}
          {district && (
            <select
              value={mandal}
              onChange={(e) => updateLocation(district, e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white animate-in"
              aria-label="Filter by mandal"
            >
              <option value="">All Mandals ({district})</option>
              {getMandalNames(district).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Location filter: Village */}
          {district && mandal && (
            <select
              value={village}
              onChange={(e) => updateLocation(district, mandal, e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white animate-in"
              aria-label="Filter by village"
            >
              <option value="">All Villages ({mandal})</option>
              {getVillageNames(district, mandal).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}

          {/* Clear location filter */}
          {(district || mandal || village) && (
            <>
              <button
                type="button"
                onClick={() => updateLocation("", "", "")}
                className="px-2.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 flex items-center gap-1 transition-colors"
                title="Clear location filter"
              >
                <X size={13} />
                <span>Reset Location</span>
              </button>
              <div className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200/70 text-amber-900 px-3 py-1.5 rounded-xl">
                <MapPin size={13} className="text-[#67001A]" />
                <span>
                  Location:{' '}
                  <strong>{[district, mandal, village].filter(Boolean).join(' → ')}</strong>
                </span>
              </div>
            </>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {Object.entries(stats).map(([s, n]) => (
              <span key={s} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                {s}: <strong>{n}</strong>
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Map view</h2>
          <IssuesMap issues={issues} />
        </section>

        <section>
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-pink-200">
            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 text-lg mt-4">Loading issues…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-red-700 text-lg font-bold">Couldn’t load issues</p>
                <p className="text-gray-600 text-sm mt-1 break-words">{error.message}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : !issues ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-pink-200">
            <p className="text-gray-700 text-lg font-semibold">No data available yet</p>
            <p className="text-gray-500 text-sm mt-2">Try refreshing.</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl shadow-xl p-8 text-center border-2 border-pink-200">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">No issues found for {title}</p>
            <p className="text-gray-500 text-sm">
              There are currently no civic complaints reported in {subtitle || title}.
            </p>
          </div>
        ) : (
          <IssueList issues={issues} />
        )}
        </section>
      </div>
    </div>
  );
}

