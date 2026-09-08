import { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ArrowLeft,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
  Crown,
  Users,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { useApi } from '@web/hooks/useApi';
import { UserProfileCapsule } from '@web/components/ui/UserRoleBadge';
import type { SarpanchListResponse, SarpanchRecord, VillageDetailResponse, User } from '@shared/types';
import {
  getDistrictNames,
  getMandalNames,
  getVillageNames,
} from '@shared/data/telangana';

type StatusFilter = 'all' | 'approved' | 'pending' | 'declined';

export default function SarpanchDirectory() {
  const navigate = useNavigate();
  const { data: meData } = useApi<{ user: User }>('/api/users/me');
  const me = meData?.user;
  const canManage = me?.role === 'super_admin' || me?.role === 'admin';

  // Filters
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected village for detail modal
  const [selectedVillageJurisdictionId, setSelectedVillageJurisdictionId] = useState<string | null>(null);
  const [selectedVillageGeo, setSelectedVillageGeo] = useState<{ district: string; mandal: string; village: string } | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Cascading Telangana dropdown data
  const districtList = useMemo(() => getDistrictNames(), []);
  const mandalList = useMemo(() => (district ? getMandalNames(district) : []), [district]);
  const villageList = useMemo(() => (district && mandal ? getVillageNames(district, mandal) : []), [district, mandal]);

  // Query URL
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (district) params.set('district', district);
    if (mandal) params.set('mandal', mandal);
    if (village) params.set('village', village);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    const str = params.toString();
    return `/api/sarpanches${str ? `?${str}` : ''}`;
  }, [district, mandal, village, statusFilter, searchQuery]);

  const { data, isLoading, refetch } = useApi<SarpanchListResponse>(queryUrl);

  // Village detail query
  const villageDetailUrl = useMemo(() => {
    if (me?.role === 'citizen') {
      return '/api/sarpanches/village';
    }
    if (selectedVillageJurisdictionId) {
      return `/api/sarpanches/village?jurisdictionId=${selectedVillageJurisdictionId}`;
    }
    if (selectedVillageGeo) {
      const p = new URLSearchParams(selectedVillageGeo);
      return `/api/sarpanches/village?${p.toString()}`;
    }
    return null;
  }, [me?.role, selectedVillageJurisdictionId, selectedVillageGeo]);

  const { data: villageDetail, isLoading: villageDetailLoading, refetch: refetchVillageDetail } =
    useApi<VillageDetailResponse>(villageDetailUrl ?? '/api/sarpanches/village', {
      enabled: villageDetailUrl !== null,
    });

  const clearFilters = () => {
    setDistrict('');
    setMandal('');
    setVillage('');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const openVillageModal = (sarpanch: SarpanchRecord) => {
    setActionNotice(null);
    if (sarpanch.jurisdictionId) {
      setSelectedVillageJurisdictionId(sarpanch.jurisdictionId);
      setSelectedVillageGeo(null);
    } else if (sarpanch.district && sarpanch.mandal && sarpanch.village) {
      setSelectedVillageJurisdictionId(null);
      setSelectedVillageGeo({
        district: sarpanch.district,
        mandal: sarpanch.mandal,
        village: sarpanch.village,
      });
    }
  };

  const closeVillageModal = () => {
    setSelectedVillageJurisdictionId(null);
    setSelectedVillageGeo(null);
    setActionNotice(null);
  };

  // Super admin inline approval / decline action inside details modal
  const handleDecision = useCallback(
    async (officialId: string, action: 'approve' | 'decline') => {
      setActionBusyId(officialId);
      setActionNotice(null);
      try {
        const res = await fetch(`/api/admin/officials/${officialId}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(action === 'decline' ? { note: 'Declined from Sarpanch Directory' } : {}),
        });
        const resBody = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionNotice(resBody?.error?.message ?? 'Action failed.');
          return;
        }
        setActionNotice(action === 'approve' ? 'Official approved successfully!' : 'Official registration declined.');
        void refetch();
        void refetchVillageDetail();
      } catch {
        setActionNotice('Network error. Please try again.');
      } finally {
        setActionBusyId(null);
      }
    },
    [refetch, refetchVillageDetail]
  );

  const overview = data?.overview ?? {
    totalSarpanches: 0,
    approvedSarpanches: 0,
    pendingSarpanches: 0,
    declinedSarpanches: 0,
    villagesCovered: 0,
  };

  const sarpanches = data?.sarpanches ?? [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-[#67001A] leading-tight flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#CCB252]" />
                <span>Village Sarpanch Directory</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-telugu telugu-text">తెలంగాణ రాష్ట్ర గ్రామ సర్పంచుల జాబితా</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <UserProfileCapsule user={me} />
            {canManage && (
              <Link
                to="/admin/officials"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs md:text-sm font-semibold text-[#67001A] hover:bg-slate-50 transition-colors"
              >
                Approvals Console
              </Link>
            )}
            <Link
              to="/board"
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Issue Board
            </Link>
            <button
              type="button"
              onClick={() => void refetch()}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {me?.role === 'citizen' ? (
          <div className="space-y-6">
            {/* Village Identity Banner */}
            <div
              className="p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden border-2 border-[#CCB252]"
              style={{ background: 'linear-gradient(135deg, #67001A 0%, #8A1538 50%, #4d0012 100%)' }}
            >
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#CCB252] uppercase tracking-wider mb-3">
                  <MapPin size={14} /> Your Village Gram Panchayat
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
                  {me.village || 'Your Village'}, {me.mandal} Mandal
                </h2>
                <p className="text-xs sm:text-sm text-[#CCB252] font-telugu telugu-text mt-1 font-bold">
                  గ్రామ స్వపరిపాలన ప్రజాప్రతినిధులు · {me.district} District
                </p>
                <p className="text-xs sm:text-sm text-white/90 mt-2">
                  Official elected representatives and local panchayat members serving your village.
                </p>
              </div>
            </div>

            {villageDetailLoading ? (
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-16 text-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#67001A] mb-2" />
                <p className="text-sm font-semibold">Loading your village panchayat representatives…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Village Sarpanch Card */}
                <div className="md:col-span-1 bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#67001A] uppercase tracking-wider">
                        <Crown className="w-4 h-4 text-[#CCB252]" />
                        <span>Village Sarpanch</span>
                      </div>
                      {villageDetail?.sarpanch && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            villageDetail.sarpanch.approvalStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {villageDetail.sarpanch.approvalStatus === 'approved' ? 'Active' : villageDetail.sarpanch.approvalStatus}
                        </span>
                      )}
                    </div>

                    {villageDetail?.sarpanch ? (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-[#67001A] text-white font-bold flex items-center justify-center text-xl shadow">
                          {villageDetail.sarpanch.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 leading-tight">
                            {villageDetail.sarpanch.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-telugu telugu-text mt-0.5">సర్పంచ్, {me.village}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                          {villageDetail.sarpanch.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-[#008A3B] shrink-0" />
                              <a
                                href={`tel:${villageDetail.sarpanch.phone}`}
                                className="font-semibold text-slate-900 hover:text-[#67001A]"
                              >
                                {villageDetail.sarpanch.phone}
                              </a>
                            </div>
                          )}
                          {villageDetail.sarpanch.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                              <a
                                href={`mailto:${villageDetail.sarpanch.email}`}
                                className="font-semibold text-slate-900 hover:text-[#67001A] truncate"
                              >
                                {villageDetail.sarpanch.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-2">
                        <Crown className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">No Sarpanch Registered</p>
                        <p className="text-xs text-slate-500">
                          No official Sarpanch profile has been registered yet for {me.village}.
                        </p>
                      </div>
                    )}
                  </div>

                  {villageDetail?.sarpanch?.phone && (
                    <a
                      href={`tel:${villageDetail.sarpanch.phone}`}
                      className="w-full py-2.5 rounded-xl bg-[#67001A] text-white font-bold text-xs hover:bg-[#520015] transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone size={14} /> Call Sarpanch
                    </a>
                  )}
                </div>

                {/* 2. Ward Members Section */}
                <div className="md:col-span-2 bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#67001A]" />
                        <h3 className="font-bold text-slate-900 text-base">
                          Ward Members (వార్డు సభ్యులు)
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {villageDetail?.wardMembers?.length ?? 0} Registered
                      </span>
                    </div>

                    {villageDetail?.wardMembers && villageDetail.wardMembers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                        {villageDetail.wardMembers.map((w) => (
                          <div
                            key={w.id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[#67001A]/10 text-[#67001A] font-black text-[10px] uppercase mb-1">
                                Ward {w.wardNumber ?? '—'}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 truncate">{w.name}</h4>
                              {w.phone && (
                                <p className="text-xs text-slate-500 font-medium">{w.phone}</p>
                              )}
                            </div>
                            {w.phone && (
                              <a
                                href={`tel:${w.phone}`}
                                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#008A3B] flex items-center justify-center hover:bg-emerald-50 transition-colors shrink-0 shadow-xs"
                                title={`Call ${w.name}`}
                              >
                                <Phone size={14} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-2">
                        <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">No Ward Members Registered</p>
                        <p className="text-xs text-slate-500">
                          Ward members for {me.village} have not registered in the terminal yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Village Grievance Snapshot */}
                  {villageDetail?.issuesSummary && (
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Village Grievances Status</p>
                        <Link to="/board" className="text-xs font-bold text-[#67001A] hover:underline">
                          View Issue Board &rarr;
                        </Link>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-100">
                          <p className="text-base font-bold text-slate-900">{villageDetail.issuesSummary.total}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Total</p>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                          <p className="text-base font-bold">{villageDetail.issuesSummary.open}</p>
                          <p className="text-[10px] uppercase font-semibold">Open</p>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                          <p className="text-base font-bold">{villageDetail.issuesSummary.inProgress}</p>
                          <p className="text-[10px] uppercase font-semibold">In Progress</p>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <p className="text-base font-bold">{villageDetail.issuesSummary.resolved}</p>
                          <p className="text-[10px] uppercase font-semibold">Resolved</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 1. Overview Metric Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#67001A]/10 text-[#67001A] flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-slate-900 tabular-nums">
                {overview.totalSarpanches}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Sarpanches</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-emerald-700 tabular-nums">
                {overview.approvedSarpanches}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approved / Active</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-amber-800 tabular-nums">
                {overview.pendingSarpanches}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Review</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-blue-700 tabular-nums">
                {overview.villagesCovered}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Villages Covered</p>
            </div>
          </div>
        </section>

        {/* 2. Filter & Search Controls */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#67001A]" />
              <h2 className="text-base font-bold text-slate-800">Filter by Geography & Status</h2>
            </div>
            {(district || mandal || village || statusFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 self-start md:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                Reset all filters
              </button>
            )}
          </div>

          {/* Cascading dropdown selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setMandal('');
                  setVillage('');
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-[#67001A] outline-none"
              >
                <option value="">All Districts ({districtList.length})</option>
                {districtList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mandal</label>
              <select
                value={mandal}
                disabled={!district}
                onChange={(e) => {
                  setMandal(e.target.value);
                  setVillage('');
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-[#67001A] outline-none disabled:bg-slate-50 disabled:opacity-60"
              >
                <option value="">{district ? `All Mandals in ${district}` : 'Select District first'}</option>
                {mandalList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Village</label>
              <select
                value={village}
                disabled={!mandal}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-[#67001A] outline-none disabled:bg-slate-50 disabled:opacity-60"
              >
                <option value="">{mandal ? `All Villages in ${mandal}` : 'Select Mandal first'}</option>
                {villageList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick search input + Status Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Sarpanch name, village, mandal, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-[#67001A] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['all', 'approved', 'pending', 'declined'] as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-[#67001A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Village-wise Sarpanch Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Registered Village Sarpanches
              <span className="ml-2 text-xs font-semibold text-slate-500">({sarpanches.length} listed)</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#67001A] mb-3" />
              <p className="text-sm">Loading village sarpanch directory…</p>
            </div>
          ) : sarpanches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-base font-semibold text-slate-800">No sarpanches found matching your criteria.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try clearing or relaxing your search filters, or check if the official registration was submitted under a different spelling.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sarpanches.map((s) => (
                <div
                  key={s.id}
                  onClick={() => openVillageModal(s)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#67001A]/40 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-3">
                    {/* Village & Location Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-[#008A3B]" />
                          <span>{s.district ?? 'Telangana'}</span>
                          <span>•</span>
                          <span>{s.mandal ?? 'Mandal'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#67001A] transition-colors mt-0.5">
                          {s.village ?? 'Unspecified Village'}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          s.approvalStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : s.approvalStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.approvalStatus}
                      </span>
                    </div>

                    {/* Sarpanch Personal Profile */}
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-[#67001A] text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {s.name ? s.name.slice(0, 2).toUpperCase() : 'SP'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.phone ?? 'No phone recorded'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Issues and Action */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    {s.issuesCount ? (
                      <span className="text-slate-500 font-medium">
                        <strong>{s.issuesCount.open}</strong> open / {s.issuesCount.total} complaints
                      </span>
                    ) : (
                      <span className="text-slate-400">Village details</span>
                    )}
                    <div className="flex items-center gap-2">
                      {canManage && (
                        s.approvalStatus === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : s.approvalStatus === 'pending' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDecision(s.id, 'approve');
                            }}
                            disabled={actionBusyId === s.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1 shadow-xs transition-colors"
                            title="Quick Approve Sarpanch"
                          >
                            {actionBusyId === s.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>Approve</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDecision(s.id, 'approve');
                            }}
                            disabled={actionBusyId === s.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1 shadow-xs transition-colors"
                            title="Re-Approve Sarpanch"
                          >
                            {actionBusyId === s.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>Re-Approve</span>
                          </button>
                        )
                      )}
                      <span className="text-[#67001A] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View details</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
          </>
        )}
      </main>

      {/* 4. Village & Sarpanch Details Modal */}
      {(selectedVillageJurisdictionId || selectedVillageGeo) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#67001A]" />
                <h2 className="text-lg font-bold text-slate-900">
                  {villageDetail?.jurisdiction?.village ?? 'Village & Sarpanch Details'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeVillageModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {actionNotice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionNotice}</span>
                </div>
              )}

              {villageDetailLoading ? (
                <div className="py-16 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#67001A] mb-3" />
                  <p className="text-sm">Fetching village and sarpanch details…</p>
                </div>
              ) : !villageDetail ? (
                <div className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                  <p>Could not load village information.</p>
                </div>
              ) : (
                <>
                  {/* Village Geography Header */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gram Panchayat</div>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">{villageDetail.jurisdiction.village}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Mandal: <strong>{villageDetail.jurisdiction.mandal}</strong> • District: <strong>{villageDetail.jurisdiction.district}</strong>
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#67001A]/10 text-[#67001A]">
                      Telangana State
                    </span>
                  </div>

                  {/* Primary Sarpanch Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-[#CCB252]" />
                        <span>Gram Panchayat Sarpanch</span>
                      </h4>
                      {villageDetail.sarpanch && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            villageDetail.sarpanch.approvalStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : villageDetail.sarpanch.approvalStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {villageDetail.sarpanch.approvalStatus}
                        </span>
                      )}
                    </div>

                    {villageDetail.sarpanch ? (
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-[#67001A] text-white text-lg font-bold flex items-center justify-center shrink-0">
                            {villageDetail.sarpanch.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-bold text-slate-900">{villageDetail.sarpanch.name}</h4>
                            <p className="text-xs text-slate-500 font-telugu">గ్రామ సర్పంచ్ (Village Head)</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-700">
                              {villageDetail.sarpanch.phone && (
                                <a
                                  href={`tel:${villageDetail.sarpanch.phone}`}
                                  className="flex items-center gap-1 text-[#67001A] font-semibold hover:underline bg-[#67001A]/5 px-2.5 py-1 rounded-lg"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{villageDetail.sarpanch.phone}</span>
                                </a>
                              )}
                              {villageDetail.sarpanch.email && (
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{villageDetail.sarpanch.email}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              Registered on {new Date(villageDetail.sarpanch.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {villageDetail.sarpanch.approvalNote && ` • Note: ${villageDetail.sarpanch.approvalNote}`}
                            </p>
                          </div>
                        </div>

                        {/* Admin Decision Controls inside Modal */}
                        {canManage && (
                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                            {villageDetail.sarpanch.approvalStatus === 'approved' ? (
                              <>
                                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                  <span>Approved Official Sarpanch</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(villageDetail.sarpanch!.id, 'decline')}
                                  disabled={actionBusyId === villageDetail.sarpanch.id}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                                  title="Revoke / Decline registration"
                                >
                                  {actionBusyId === villageDetail.sarpanch.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  Decline Registration
                                </button>
                              </>
                            ) : villageDetail.sarpanch.approvalStatus === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(villageDetail.sarpanch!.id, 'approve')}
                                  disabled={actionBusyId === villageDetail.sarpanch.id}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                                >
                                  {actionBusyId === villageDetail.sarpanch.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                  Approve as Official Sarpanch
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(villageDetail.sarpanch!.id, 'decline')}
                                  disabled={actionBusyId === villageDetail.sarpanch.id}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                                >
                                  {actionBusyId === villageDetail.sarpanch.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  Decline Registration
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs font-bold">
                                  <XCircle className="w-4 h-4" />
                                  <span>Registration Declined</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(villageDetail.sarpanch!.id, 'approve')}
                                  disabled={actionBusyId === villageDetail.sarpanch.id}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                                >
                                  {actionBusyId === villageDetail.sarpanch.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                  Re-Approve as Sarpanch
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 bg-slate-50 rounded-xl">
                        <Crown className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        <p className="text-sm font-semibold">No Sarpanch registered yet for this village.</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Sarpanches can register directly via the Official Portal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Other Sarpanch Registrations / Candidates (if more than 1) */}
                  {villageDetail.allSarpanches && villageDetail.allSarpanches.length > 1 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span>Other Sarpanch Applications ({villageDetail.allSarpanches.length - 1})</span>
                      </h4>
                      <div className="divide-y divide-slate-100">
                        {villageDetail.allSarpanches
                          .filter((s) => s.id !== villageDetail.sarpanch?.id)
                          .map((other) => (
                            <div key={other.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 text-sm">{other.name}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      other.approvalStatus === 'approved'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : other.approvalStatus === 'pending'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {other.approvalStatus}
                                  </span>
                                </div>
                                <p className="text-slate-500 mt-1 flex items-center gap-2">
                                  {other.phone && <span>{other.phone}</span>}
                                  <span>• Registered {new Date(other.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </p>
                              </div>

                              {canManage && (
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  {other.approvalStatus === 'approved' ? (
                                    <>
                                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                        <span>Approved</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDecision(other.id, 'decline')}
                                        disabled={actionBusyId === other.id}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  ) : other.approvalStatus === 'pending' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleDecision(other.id, 'approve')}
                                        disabled={actionBusyId === other.id}
                                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                                      >
                                        {actionBusyId === other.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        )}
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDecision(other.id, 'decline')}
                                        disabled={actionBusyId === other.id}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                                        Declined
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDecision(other.id, 'approve')}
                                        disabled={actionBusyId === other.id}
                                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                                      >
                                        Re-Approve
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Village Ward Members */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-600" />
                      <span>Ward Members ({villageDetail.wardMembers.length})</span>
                    </h4>
                    {villageDetail.wardMembers.length === 0 ? (
                      <p className="text-xs text-slate-400">No ward members registered yet for this village.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {villageDetail.wardMembers.map((w) => (
                          <div key={w.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">{w.name}</span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                  Ward {w.wardNumber ?? '—'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    w.approvalStatus === 'approved'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : w.approvalStatus === 'pending'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {w.approvalStatus}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-slate-500">
                                {w.phone && (
                                  <a href={`tel:${w.phone}`} className="text-[#67001A] font-semibold hover:underline flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{w.phone}</span>
                                  </a>
                                )}
                                {w.email && <span>{w.email}</span>}
                                <span>• Registered {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                {w.approvalNote && <span className="text-slate-400">({w.approvalNote})</span>}
                              </div>
                            </div>

                            {canManage && (
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {w.approvalStatus === 'approved' ? (
                                  <>
                                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                      <span>Approved</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDecision(w.id, 'decline')}
                                      disabled={actionBusyId === w.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                      Decline
                                    </button>
                                  </>
                                ) : w.approvalStatus === 'pending' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDecision(w.id, 'approve')}
                                      disabled={actionBusyId === w.id}
                                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                                    >
                                      {actionBusyId === w.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      )}
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDecision(w.id, 'decline')}
                                      disabled={actionBusyId === w.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                      Decline
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                                      Declined
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDecision(w.id, 'approve')}
                                      disabled={actionBusyId === w.id}
                                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                                    >
                                      Re-Approve
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Village Complaints / Issues Summary */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-[#67001A]" />
                        <span>Village Governance Issues</span>
                      </h4>
                      <Link
                        to="/board"
                        className="text-xs text-[#67001A] font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Open Board</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center py-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-lg font-bold text-slate-900">{villageDetail.issuesSummary.total}</p>
                        <p className="text-[10px] uppercase font-semibold text-slate-500">Total</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-lg font-bold text-amber-800">{villageDetail.issuesSummary.open}</p>
                        <p className="text-[10px] uppercase font-semibold text-amber-700">Open</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-lg font-bold text-blue-800">{villageDetail.issuesSummary.inProgress}</p>
                        <p className="text-[10px] uppercase font-semibold text-blue-700">In Progress</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-lg font-bold text-emerald-800">{villageDetail.issuesSummary.resolved + villageDetail.issuesSummary.closed}</p>
                        <p className="text-[10px] uppercase font-semibold text-emerald-700">Resolved</p>
                      </div>
                    </div>

                    {villageDetail.recentIssues.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-600">Recent Complaints in this Village:</p>
                        {villageDetail.recentIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#67001A] text-[10px]">{issue.code}</span>
                              <span className="font-semibold text-slate-800">{issue.category}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                              {issue.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
