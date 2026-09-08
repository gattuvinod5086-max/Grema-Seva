import { useState, useCallback, useMemo } from 'react';
import { Link, Navigate } from 'react-router';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Crown,
  Users,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Phone,
  Calendar,
} from 'lucide-react';
import { useApi } from '@web/hooks/useApi';
import { useRealtimeEvent } from '@web/context/RealtimeContext';
import type { OfficialRecord, User } from '@shared/types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'declined';
type TierFilter = 'all' | 'mandal' | 'panchayat';
type SubRoleFilter = 'all' | 'sarpanch' | 'ward_member';

interface DeclineModalState {
  id: string;
  name: string;
  role: string;
}

/**
 * Super admin and admin console: review official registrations for
 * Mandal Level (Mandal Officers) and Panchayat Level (Sarpanches & Ward Members).
 */
export default function AdminOfficials() {
  const { data: meData, isLoading: meLoading, error: meError } = useApi<{ user: User }>('/api/users/me');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [panchayatSubRole, setPanchayatSubRole] = useState<SubRoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [declineModal, setDeclineModal] = useState<DeclineModalState | null>(null);
  const [declineReason, setDeclineReason] = useState('Credentials could not be verified');

  const me = meData?.user;
  const canManage = me?.role === 'super_admin' || me?.role === 'admin';

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (tierFilter === 'mandal') {
      params.set('role', 'admin');
    } else if (tierFilter === 'panchayat') {
      if (panchayatSubRole !== 'all') {
        params.set('role', panchayatSubRole);
      } else {
        params.set('role', 'panchayat');
      }
    }
    const str = params.toString();
    return `/api/admin/officials${str ? `?${str}` : ''}`;
  }, [statusFilter, tierFilter, panchayatSubRole]);

  const officialsApi = useApi<{ officials: OfficialRecord[] }>(queryUrl, {
    enabled: canManage,
  });

  useRealtimeEvent('all', () => {
    void officialsApi.refetch();
  });

  const officials = useMemo(() => officialsApi.data?.officials ?? [], [officialsApi.data]);

  const stats = useMemo(() => {
    const pending = officials.filter((o) => o.approvalStatus === 'pending').length;
    const approved = officials.filter((o) => o.approvalStatus === 'approved').length;
    const declined = officials.filter((o) => o.approvalStatus === 'declined').length;
    const mandalCount = officials.filter((o) => o.role === 'admin').length;
    const panchayatCount = officials.filter((o) => o.role === 'sarpanch' || o.role === 'ward_member').length;
    return { pending, approved, declined, mandalCount, panchayatCount, total: officials.length };
  }, [officials]);

  const filteredOfficials = useMemo(() => {
    if (!searchQuery.trim()) return officials;
    const q = searchQuery.toLowerCase().trim();
    return officials.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.phone && o.phone.toLowerCase().includes(q)) ||
        (o.village && o.village.toLowerCase().includes(q)) ||
        (o.mandal && o.mandal.toLowerCase().includes(q)) ||
        (o.district && o.district.toLowerCase().includes(q)) ||
        (o.wardNumber && o.wardNumber.toLowerCase().includes(q))
    );
  }, [officials, searchQuery]);

  const decide = useCallback(
    async (id: string, action: 'approve' | 'decline', note?: string) => {
      setBusyId(id);
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/officials/${id}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(action === 'decline' ? { note: note || 'Registration declined by administrator' } : {}),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setNotice({ type: 'error', message: body?.error?.message ?? 'Action failed.' });
          return;
        }
        setNotice({
          type: 'success',
          message:
            action === 'approve'
              ? 'Official registration approved and privileges activated.'
              : 'Official registration declined.',
        });
        void officialsApi.refetch();
      } catch {
        setNotice({ type: 'error', message: 'Network error occurred while submitting decision.' });
      } finally {
        setBusyId(null);
        setDeclineModal(null);
      }
    },
    [officialsApi]
  );

  if (meLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#67001A]" />
        <p className="text-sm font-semibold">Loading Governance Terminal…</p>
      </div>
    );
  }

  if (meError || !me) return <Navigate to="/login" replace />;

  if (!canManage) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Access Restricted</h2>
        <p className="text-sm text-slate-600">
          This terminal is restricted to administrators and Mandal governance officials to review and approve official registrations.
        </p>
        <Link
          to="/board"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#67001A] text-white font-bold text-sm shadow hover:bg-[#520015] transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Hero Header Card */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-r from-[#67001A] via-[#520015] to-[#400010] text-white shadow-xl relative overflow-hidden border border-[#CCB252]/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCB252]/20 border border-[#CCB252]/50 text-[#CCB252] text-xs font-black uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Official Governance Terminal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-white">
              Official Verification & Approvals
            </h1>
            <p className="text-white/80 text-xs md:text-sm leading-relaxed">
              Authorize and govern credentials for <strong>Mandal Level Officers</strong> and{' '}
              <strong>Gram Panchayat Sarpanches & Ward Members</strong> across Telangana.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => void officialsApi.refetch()}
              disabled={officialsApi.isLoading}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all"
              title="Refresh Queue"
            >
              <RefreshCw size={14} className={officialsApi.isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              to="/sarpanches"
              className="px-4 py-2.5 rounded-2xl bg-[#CCB252] hover:bg-[#bfa243] text-[#67001A] text-xs font-black uppercase tracking-wider shadow-md transition-all"
            >
              Panchayat Directory
            </Link>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#CCB252]/10 blur-3xl pointer-events-none" />
      </div>

      {/* Governance Level Scope Info */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Approval Scope:</strong> Administrators verify official accounts at two designated governance levels:
          <span className="font-semibold text-amber-950"> Mandal Level</span> (Mandal Officers) and
          <span className="font-semibold text-amber-950"> Gram Panchayat Level</span> (Sarpanches & Ward Members).
          Citizens report issues directly and do not require administrative verification.
        </div>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm shadow-sm transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Pending Review</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-900 tabular-nums">{stats.pending}</p>
          <p className="text-[10px] text-amber-700 mt-1 font-medium">Awaiting official verification</p>
        </div>

        <div
          onClick={() => {
            setTierFilter('mandal');
            setStatusFilter('all');
          }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
            tierFilter === 'mandal'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/40 shadow-md'
              : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Mandal Level</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Building2 size={15} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-blue-900 tabular-nums">{stats.mandalCount}</p>
          <p className="text-[10px] text-blue-700 mt-1 font-medium">Mandal officers & admins</p>
        </div>

        <div
          onClick={() => {
            setTierFilter('panchayat');
            setStatusFilter('all');
          }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
            tierFilter === 'panchayat'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Panchayat Level</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Crown size={15} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-900 tabular-nums">{stats.panchayatCount}</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-medium">Sarpanches & ward members</p>
        </div>

        <div
          onClick={() => {
            setTierFilter('all');
            setStatusFilter('approved');
          }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-slate-50 border-[#67001A] ring-2 ring-[#67001A]/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#67001A]">Active & Approved</span>
            <div className="w-7 h-7 rounded-xl bg-[#67001A]/10 text-[#67001A] flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-[#67001A] tabular-nums">{stats.approved}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Authorized officials</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Tier Selector Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#67001A]">
              Select Governance Level
            </p>
            <p className="text-xs text-slate-500">Filter officials by administrative jurisdiction level</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTierFilter('all');
                setPanchayatSubRole('all');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                tierFilter === 'all'
                  ? 'bg-[#67001A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              All Officials ({officials.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setTierFilter('mandal');
                setPanchayatSubRole('all');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition-all ${
                tierFilter === 'mandal'
                  ? 'bg-[#67001A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 size={13} />
              <span>Mandal Level</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTierFilter('panchayat');
                setPanchayatSubRole('all');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition-all ${
                tierFilter === 'panchayat'
                  ? 'bg-[#67001A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Crown size={13} />
              <span>Panchayat Level</span>
            </button>
          </div>
        </div>

        {/* Status + Sub-role + Search Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
            {(
              [
                { id: 'all', label: 'All Status' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'approved', label: 'Approved' },
                { id: 'declined', label: 'Declined' },
              ] as { id: StatusFilter; label: string }[]
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === s.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {tierFilter === 'panchayat' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Role:</span>
              {(
                [
                  { id: 'all', label: 'All Panchayat' },
                  { id: 'sarpanch', label: '👑 Sarpanches' },
                  { id: 'ward_member', label: '👥 Ward Members' },
                ] as { id: SubRoleFilter; label: string }[]
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setPanchayatSubRole(sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    panchayatSubRole === sub.id
                      ? 'bg-[#CCB252] text-[#67001A] font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative min-w-[240px] lg:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, village..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#67001A]/30 focus:border-[#67001A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Records List */}
      <div className="space-y-3">
        {officialsApi.isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#67001A]" />
            <p className="text-slate-600 text-sm font-semibold mt-3">Loading official records…</p>
          </div>
        ) : filteredOfficials.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No official records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No officials matched "${searchQuery}". Try clearing your search query.`
                : statusFilter !== 'all'
                ? `There are no official registrations marked as ${statusFilter}.`
                : 'No officials have registered in this governance category yet.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredOfficials.map((o) => {
            const isMandal = o.role === 'admin';
            const isSarpanch = o.role === 'sarpanch';
            const isWardMember = o.role === 'ward_member';

            return (
              <div
                key={o.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 md:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      isSarpanch
                        ? 'bg-amber-100 text-amber-800 ring-2 ring-[#CCB252]/40'
                        : isMandal
                        ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300'
                        : 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                    }`}
                  >
                    {isSarpanch ? (
                      <Crown className="w-6 h-6 text-[#67001A]" />
                    ) : isMandal ? (
                      <Building2 className="w-6 h-6 text-blue-700" />
                    ) : (
                      <Users className="w-6 h-6 text-emerald-700" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-heading font-black text-slate-900 text-base md:text-lg truncate">
                        {o.name}
                      </h3>

                      {isMandal && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                          <Building2 size={11} />
                          Mandal Level Official
                        </span>
                      )}
                      {isSarpanch && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          <Crown size={11} />
                          Panchayat Sarpanch
                        </span>
                      )}
                      {isWardMember && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Users size={11} />
                          Ward Member {o.wardNumber ? `(Ward ${o.wardNumber})` : ''}
                        </span>
                      )}

                      {o.approvalStatus === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                          <CheckCircle2 size={10} />
                          Approved & Active
                        </span>
                      )}
                      {o.approvalStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          <Clock size={10} />
                          Pending Review
                        </span>
                      )}
                      {o.approvalStatus === 'declined' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                          <XCircle size={10} />
                          Declined
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      {o.phone && (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Phone size={12} className="text-slate-400" />
                          {o.phone}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin size={12} className="text-[#67001A]" />
                        <strong>
                          {o.village ? `${o.village}, ` : ''}
                          {o.mandal ? `${o.mandal} Mandal, ` : ''}
                          {o.district ?? 'Telangana'}
                        </strong>
                      </span>

                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Calendar size={12} />
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {o.approvalStatus === 'declined' && o.approvalNote && (
                      <div className="mt-1 p-2 rounded-xl bg-red-50/80 border border-red-200/80 text-[11px] text-red-800">
                        <strong>Decline Reason:</strong> {o.approvalNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  {o.approvalStatus === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => decide(o.id, 'approve')}
                        disabled={busyId === o.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                        title="Approve Official Credentials"
                      >
                        {busyId === o.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeclineModal({
                            id: o.id,
                            name: o.name,
                            role: isSarpanch ? 'Sarpanch' : isMandal ? 'Mandal Official' : 'Ward Member',
                          })
                        }
                        disabled={busyId === o.id}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all disabled:opacity-50"
                        title="Decline Official Registration"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : o.approvalStatus === 'approved' ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDeclineModal({
                          id: o.id,
                          name: o.name,
                          role: isSarpanch ? 'Sarpanch' : isMandal ? 'Mandal Official' : 'Ward Member',
                        })
                      }
                      disabled={busyId === o.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-all disabled:opacity-50"
                      title="Revoke / Decline Official"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => decide(o.id, 'approve')}
                      disabled={busyId === o.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                      title="Re-Approve Official"
                    >
                      {busyId === o.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Re-Approve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decline Reason Modal */}
      {declineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-black text-base">
                <XCircle size={20} />
                <span>Decline Registration</span>
              </div>
              <button
                type="button"
                onClick={() => setDeclineModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to decline official credentials for{' '}
              <strong>{declineModal.name}</strong> ({declineModal.role})?
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Rejection Note / Reason
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining (e.g. Jurisdiction mismatch, invalid paperwork...)"
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => decide(declineModal.id, 'decline', declineReason)}
                disabled={busyId === declineModal.id}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {busyId === declineModal.id && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
