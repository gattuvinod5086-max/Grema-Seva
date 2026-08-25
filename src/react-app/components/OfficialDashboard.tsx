import { useMemo, useState } from "react";
import { Filter, BarChart3 } from "lucide-react";
import { computeDashboardStats, filterIssues } from "@/shared/services/analytics";
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/shared/constants/governance";
import { useLanguage } from "@/react-app/context/LanguageContext";
import SlaDisplay from "@/react-app/components/SlaDisplay";
import type { VillageIssue } from "@/react-app/data/terminalData";

interface OfficialDashboardProps {
  issues: VillageIssue[];
  districts?: string[];
  mandals?: string[];
  villages?: string[];
}

export default function OfficialDashboard({ issues }: OfficialDashboardProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    category: "",
    priority: "",
    status: "",
    slaStatus: "" as "" | "green" | "amber" | "red" | "breached",
  });

  const stats = useMemo(
    () => computeDashboardStats(issues, { isDemoData: issues.length < 5 }),
    [issues]
  );

  const filtered = useMemo(
    () =>
      filterIssues(
        issues.map((i) => ({
          ...i,
          created_at: i.createdAt,
          priority: i.priority?.toUpperCase(),
          sla_due_at: i.slaDueAt,
          acknowledged_at: i.acknowledgedAt,
          resolved_at: i.resolvedAt,
          estimated_affected_citizens: i.estimatedAffectedCitizens,
        })),
        {
          category: filters.category || undefined,
          priority: filters.priority || undefined,
          status: filters.status || undefined,
          slaStatus: filters.slaStatus || undefined,
        }
      ),
    [issues, filters]
  );

  const priorityIssues = issues.filter(
    (i) => ["HIGH", "CRITICAL"].includes((i.priority ?? "").toUpperCase()) && i.status !== "Resolved" && i.status !== "Closed"
  );

  const slaBreached = issues.filter((i) => {
    if (i.status === "SLA_BREACHED") return true;
    return false;
  });

  const statCards = [
    { label: t.dashboard.totalIssues, val: stats.total },
    { label: t.dashboard.pending, val: stats.pending },
    { label: t.dashboard.inProgress, val: stats.inProgress },
    { label: t.dashboard.resolved, val: stats.resolved },
    { label: t.dashboard.slaBreached, val: stats.slaBreached },
    { label: t.dashboard.critical, val: stats.critical },
    {
      label: t.dashboard.avgResolution,
      val: stats.avgResolutionHours != null ? `${stats.avgResolutionHours}h` : "—",
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-tg-maroon" size={28} />
          <h2 className="text-2xl font-black text-slate-900 uppercase italic">
            Official <span className="text-tg-maroon">Dashboard</span>
          </h2>
        </div>
        {stats.isDemoData && (
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
            {t.dashboard.demoData}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xl font-black text-tg-maroon">{s.val}</p>
            <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-slate-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filters</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            className="p-3 rounded-xl border text-sm font-medium"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All categories</option>
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="p-3 rounded-xl border text-sm font-medium"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All priorities</option>
            {ISSUE_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            className="p-3 rounded-xl border text-sm font-medium"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="p-3 rounded-xl border text-sm font-medium"
            value={filters.slaStatus}
            onChange={(e) => setFilters({ ...filters, slaStatus: e.target.value as typeof filters.slaStatus })}
          >
            <option value="">All SLA</option>
            <option value="green">Within SLA</option>
            <option value="amber">Approaching</option>
            <option value="breached">Breached</option>
          </select>
        </div>
        <p className="text-xs text-slate-500 mt-3">{filtered.length} issues match filters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title={t.dashboard.priorityIssues} items={priorityIssues} />
        <Section title={t.dashboard.slaBreached} items={slaBreached} />
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: VillageIssue[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">None</p>
      ) : (
        <ul className="space-y-3">
          {items.slice(0, 5).map((i) => (
            <li key={i.id} className="p-3 rounded-xl bg-slate-50 flex justify-between items-start gap-3">
              <div>
                <p className="font-bold text-sm">{i.category}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{i.description}</p>
              </div>
              <SlaDisplay
                compact
                createdAt={i.createdAt}
                priority={i.priority}
                slaDueAt={i.slaDueAt}
                status={i.status}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
