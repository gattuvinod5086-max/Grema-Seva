import { useState, useMemo } from 'react';
import {
  Plus,
  ClipboardList,
  Building2,
  MapPin,
  Crown,
  Bell,
  Siren,
  Award,
  Leaf,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import IssueList from '@web/components/IssueList';
import IssueForm from '@web/components/IssueForm';
import IssueDetailModal from '@web/components/IssueDetailModal';
import VillageScoreCard from '@web/components/ui/VillageScoreCard';
import { GsCard } from '@web/components/ui/GsCard';
import { UserRoleBadge } from '@web/components/ui/UserRoleBadge';
import { useRealtimeEvent } from '@web/context/RealtimeContext';
import { UI } from '@web/constants/design';
import { useApi } from '@web/hooks/useApi';
import { computeVillageAnalytics } from '@shared/services/analytics';
import { getDistrictNames, getMandalNames, getVillageNames } from '@shared/data/telangana';
import type { IssueDetail, IssueListResponse, User, VillageIssueStats } from '@shared/types';
import { ISSUE_CATEGORIES } from '@shared/constants/governance';
import { ISSUE_STATUSES } from '@shared/types';

function QuickAction({
  icon,
  label,
  sublabel,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  accent?: 'emergency';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-3 p-4 rounded-xl border text-left min-h-[88px] w-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67001A]/30 ${
        accent === 'emergency'
          ? 'bg-red-50 border-red-200 hover:border-red-300 hover:shadow-sm'
          : 'bg-white border-[#E5E7EB] hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <span
        className={`flex items-center justify-center w-10 h-10 rounded-lg ${
          accent === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-[#67001A]/8 text-[#67001A]'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-[#1F2937]">{label}</span>
        {sublabel && <span className="block text-xs text-[#64748B] mt-0.5">{sublabel}</span>}
      </span>
    </button>
  );
}

export default function CitizenDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);
  const [, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<'village' | 'mine'>('village');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [locationMandal, setLocationMandal] = useState('');
  const [locationVillage, setLocationVillage] = useState('');
  const navigate = useNavigate();

  const { data: user, error: userError, isLoading: userLoading, refetch: refetchUser } =
    useApi<{ user: User }>('/api/users/me');

  const issuesApiUrl = useMemo(() => {
    const p = new URLSearchParams({ limit: '100' });
    if (categoryFilter) p.set('category', categoryFilter);
    if (locationDistrict) p.set('district', locationDistrict);
    if (locationMandal) p.set('mandal', locationMandal);
    if (locationVillage) p.set('village', locationVillage);
    return `/api/issues?${p.toString()}`;
  }, [categoryFilter, locationDistrict, locationMandal, locationVillage]);

  const statsApiUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (locationDistrict) p.set('district', locationDistrict);
    if (locationMandal) p.set('mandal', locationMandal);
    if (locationVillage) p.set('village', locationVillage);
    const str = p.toString();
    return `/api/issues/stats${str ? `?${str}` : ''}`;
  }, [locationDistrict, locationMandal, locationVillage]);

  const { data: issuesData, error: issuesError, isLoading: issuesLoading, refetch: refetchIssues } =
    useApi<IssueListResponse>(issuesApiUrl);
  const { data: stats } = useApi<VillageIssueStats>(statsApiUrl);

  // Realtime updates: automatically refresh dashboard whenever an issue, notice, or news is posted/updated
  useRealtimeEvent('all', () => {
    void refetchIssues();
  });

  const issues = useMemo(() => issuesData?.issues ?? [], [issuesData]);
  const me = user?.user ?? null;

  const filteredIssues = useMemo(() => {
    let list = issues;
    if (categoryFilter) list = list.filter((i) => i.category === categoryFilter);
    if (locationDistrict) list = list.filter((i) => i.district?.toLowerCase() === locationDistrict.toLowerCase());
    if (locationMandal) list = list.filter((i) => i.mandal?.toLowerCase() === locationMandal.toLowerCase());
    if (locationVillage) list = list.filter((i) => i.village?.toLowerCase() === locationVillage.toLowerCase());
    if (tab === 'mine') list = list.filter((i) => i.reporterId != null && i.reporterId === me?.id);
    return list;
  }, [issues, categoryFilter, locationDistrict, locationMandal, locationVillage, tab, me?.id]);

  const openIssueDetail = async (issueId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, { credentials: 'same-origin' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setSelectedIssue(body.issue as IssueDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  const activeIssues = useMemo(
    () => filteredIssues.filter((i) => !['Resolved', 'Closed'].includes(i.status)),
    [filteredIssues]
  );

  const villageScore = useMemo(() => {
    if (!me?.village || !issues) return null;
    return computeVillageAnalytics(me.village, issues).developmentScore;
  }, [me?.village, issues]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const scrollToIssues = () => {
    document.getElementById('my-issues')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
        {/* Pending official notice */}
        {me && me.role !== 'citizen' && me.role !== 'super_admin' && me.role !== 'admin' && me.approvalStatus === 'pending' && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <strong>Your official registration is awaiting approval.</strong> You currently have
            citizen-level access. Once an administrator approves you, sarpanch/official controls
            will appear here automatically.
          </div>
        )}

        {/* Greeting & village identity */}
        <section className="space-y-2">
          <p className="text-sm text-[#64748B]">{greeting()},</p>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-heading text-[#1F2937]">
              {me?.name ?? 'Citizen'}
            </h2>
            {me && <UserRoleBadge role={me.role} size="sm" />}
            {me && me.approvalStatus && me.role !== 'citizen' && me.role !== 'super_admin' && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  me.approvalStatus === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : me.approvalStatus === 'pending'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {me.approvalStatus}
              </span>
            )}
          </div>
          {(me?.role === 'super_admin' || me?.role === 'admin') ? (
            <GsCard padding="p-4" className="flex items-start gap-3 bg-amber-50/60 border-amber-200">
              <MapPin size={18} className="text-[#67001A] shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className={UI.label}>Administrative Scope</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  All Villages & Mandals
                </p>
                <p className="text-sm text-[#64748B]">Telangana State ({me?.role === 'super_admin' ? 'Super Admin' : 'Admin'} Oversight)</p>
              </div>
            </GsCard>
          ) : me?.village ? (
            <GsCard padding="p-4" className="flex items-start gap-3">
              <MapPin size={18} className="text-[#008A3B] shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className={UI.label}>Your village</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  {me.village}, {me.mandal}
                </p>
                <p className="text-sm text-[#64748B]">{me.district} District</p>
              </div>
            </GsCard>
          ) : null}
        </section>

        {/* Primary action (citizens report issues for their village, officials do NOT report) */}
        {me?.role === 'citizen' && (
          me?.village && me?.name && me.name !== 'New User' ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={`w-full flex items-center justify-center gap-3 py-5 text-lg ${UI.btnPrimary}`}
            >
              <Plus size={24} strokeWidth={2.5} aria-hidden />
              Report a Problem
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="font-bold text-amber-900 text-sm">Profile Details Required to Report Issues</p>
                <p className="text-xs text-amber-700 mt-0.5">Please provide your village location and personal details before reporting village grievances.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/registration')}
                className="px-4 py-2 bg-[#67001A] text-white rounded-xl text-xs font-bold whitespace-nowrap hover:opacity-95 shadow-sm transition-all"
              >
                Complete Profile Details
              </button>
            </div>
          )
        )}

        {/* Dedicated Sarpanch governance banner */}
        {me?.role === 'sarpanch' && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#67001A]/10 via-amber-500/10 to-[#67001A]/5 border border-[#67001A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#CCB252]" />
                <h3 className="font-bold text-slate-900 text-base">Village Sarpanch Governance Portal</h3>
              </div>
              <p className="text-xs text-slate-600">
                You are registered as the Sarpanch for <strong>{me.village}</strong>. Citizens submit civic complaints to you for review, acknowledgment, assignment, and resolution.
              </p>
            </div>
            <button
              type="button"
              onClick={scrollToIssues}
              className="px-4 py-2.5 rounded-xl bg-[#67001A] text-white font-bold text-xs hover:bg-[#520015] shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-center transition-all"
            >
              <ClipboardList size={16} />
              <span>Review Complaints ({activeIssues.length})</span>
            </button>
          </div>
        )}

        {/* Quick actions (temporarily hidden; change false to true to revert) */}
        {false && (
          <section>
            <p className={UI.label + ' mb-3'}>Quick actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <QuickAction
                icon={<ClipboardList size={20} />}
                label="Village Logs"
                sublabel={`${activeIssues.length} active`}
                onClick={scrollToIssues}
              />
              <QuickAction
                icon={<Crown size={20} />}
                label="Panchayat"
                sublabel="Village directory"
                onClick={() => navigate('/sarpanches')}
              />
              <QuickAction
                icon={<Bell size={20} className="text-[#CCB252]" />}
                label="News & Announcements"
                sublabel="Village board"
                onClick={() => navigate('/notices')}
              />
              {me?.village ? (
                <QuickAction
                  icon={<Building2 size={20} />}
                  label="Ward Directory"
                  sublabel="Ward & leaders"
                  onClick={() => navigate('/ward-members')}
                />
              ) : (me?.role === 'super_admin' || me?.role === 'admin') ? (
                <QuickAction
                  icon={<Building2 size={20} />}
                  label="Registrations"
                  sublabel="Official approvals"
                  onClick={() => navigate('/admin/officials')}
                />
              ) : null}
              <QuickAction
                icon={<Siren size={20} className="text-red-600" />}
                label="Emergency & Help"
                sublabel="24x7 Direct Lines"
                onClick={() => navigate('/emergency')}
                accent="emergency"
              />
              <QuickAction
                icon={<Award size={20} className="text-[#CCB252]" />}
                label="Welfare Hub"
                sublabel="Telangana Hub"
                onClick={() => navigate('/schemes')}
              />
              <QuickAction
                icon={<Leaf size={20} className="text-emerald-600" />}
                label="Krishi AI"
                sublabel="Soil & Crop AI"
                onClick={() => navigate('/krishi')}
              />
            </div>
          </section>
        )}

        {/* Village score */}
        {villageScore && (
          <section>
            <VillageScoreCard score={villageScore} />
          </section>
        )}

        {/* Village issue board: stats + filters + list */}
        <section id="my-issues" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1F2937]">
              {me?.village ? `${me.village} Logs` : (me?.role === 'super_admin' || me?.role === 'admin' ? 'Statewide Logs' : 'Village Logs')}
            </h3>
            <span className="text-xs font-semibold text-[#64748B]">{activeIssues.length} open</span>
          </div>

          {/* Status counts */}
          {stats && (
            <div className="flex flex-wrap gap-2">
              {ISSUE_STATUSES.map((s) =>
                stats.byStatus[s] ? (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#E5E7EB] text-[#1F2937]"
                  >
                    {s}: <strong>{stats.byStatus[s]}</strong>
                  </span>
                ) : null
              )}
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#67001A] text-white">
                Total: {stats.total}
              </span>
            </div>
          )}

          {/* Tabs + category filter + location filter */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tabs: Village Logs vs My Reports */}
              <div className="flex rounded-xl border border-[#E5E7EB] overflow-hidden shrink-0">
                {(['village', 'mine'] as const)
                  .filter((t) => t === 'village' || me?.role === 'citizen')
                  .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 text-xs md:text-sm font-bold transition-colors ${
                      tab === t ? 'bg-[#67001A] text-white' : 'bg-white text-[#64748B] hover:bg-slate-50'
                    }`}
                  >
                    {t === 'village'
                      ? me?.role === 'super_admin' || me?.role === 'admin'
                        ? 'Statewide Logs'
                        : 'Village Logs'
                      : 'My reports'}
                  </button>
                ))}
              </div>

              {/* Filters Container */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] bg-white shadow-2xs"
                  aria-label="Filter by category"
                >
                  <option value="">All categories</option>
                  {ISSUE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Location Filter: District */}
                <select
                  value={locationDistrict}
                  onChange={(e) => {
                    setLocationDistrict(e.target.value);
                    setLocationMandal('');
                    setLocationVillage('');
                  }}
                  className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] bg-white shadow-2xs"
                  aria-label="Filter by district"
                >
                  <option value="">All Districts</option>
                  {getDistrictNames().map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Location Filter: Mandal */}
                {locationDistrict && (
                  <select
                    value={locationMandal}
                    onChange={(e) => {
                      setLocationMandal(e.target.value);
                      setLocationVillage('');
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] bg-white shadow-2xs animate-in"
                    aria-label="Filter by mandal"
                  >
                    <option value="">All Mandals ({locationDistrict})</option>
                    {getMandalNames(locationDistrict).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}

                {/* Location Filter: Village */}
                {locationDistrict && locationMandal && (
                  <select
                    value={locationVillage}
                    onChange={(e) => setLocationVillage(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] bg-white shadow-2xs animate-in"
                    aria-label="Filter by village"
                  >
                    <option value="">All Villages ({locationMandal})</option>
                    {getVillageNames(locationDistrict, locationMandal).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}

                {/* Clear Location Filter */}
                {(locationDistrict || locationMandal || locationVillage) && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationDistrict('');
                      setLocationMandal('');
                      setLocationVillage('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 flex items-center gap-1 transition-colors"
                    title="Clear location filter"
                  >
                    <X size={13} />
                    <span>Reset Location</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active location filter pill */}
            {(locationDistrict || locationMandal || locationVillage) && (
              <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200/70 text-amber-900 px-3 py-1.5 rounded-xl w-fit">
                <MapPin size={13} className="text-[#67001A]" />
                <span>
                  Filtered by location:{' '}
                  <strong>
                    {[locationDistrict, locationMandal, locationVillage].filter(Boolean).join(' → ')}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {issuesLoading ? (
            <GsCard className="text-center py-10">
              <div className="animate-spin w-8 h-8 border-2 border-[#67001A] border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-[#64748B] mt-3">Loading issues…</p>
            </GsCard>
          ) : issuesError ? (
            <GsCard className="text-center py-8">
              <p className="font-semibold text-red-700">Couldn&apos;t load issues</p>
              <p className="text-sm text-[#64748B] mt-1">{issuesError.message}</p>
              <button type="button" onClick={() => { refetchUser(); refetchIssues(); }} className={`mt-4 ${UI.btnPrimary}`}>
                Retry
              </button>
              {(userLoading || userError) && (
                <p className="text-xs text-[#64748B] mt-2">
                  {userLoading ? 'Checking session…' : 'Profile unavailable.'}
                </p>
              )}
            </GsCard>
          ) : filteredIssues.length === 0 ? (
            <GsCard className="text-center py-10">
              <ClipboardList size={32} className="mx-auto text-[#64748B] mb-3" aria-hidden />
              <p className="font-semibold text-[#1F2937]">
                {tab === 'mine' ? 'You haven&apos;t reported anything yet' : 'No issues match the filter'}
              </p>
              <p className="text-sm text-[#64748B] mt-1">
                {me?.role === 'citizen'
                  ? 'Tap "Report a Problem" when you need help.'
                  : 'Civic grievances reported by citizens will appear here.'}
              </p>
            </GsCard>
          ) : (
            <IssueList issues={filteredIssues} onSelectIssue={(i) => void openIssueDetail(i.id)} />
          )}
        </section>

      {showForm && me?.role === 'citizen' && (
        <IssueForm
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            setShowForm(false);
            refetchIssues();
          }}
        />
      )}

      {selectedIssue && me && (
        <IssueDetailModal
          issue={selectedIssue}
          me={me}
          onClose={() => setSelectedIssue(null)}
          onChanged={() => {
            void openIssueDetail(selectedIssue.id);
            refetchIssues();
          }}
        />
      )}
    </div>
  );
}
