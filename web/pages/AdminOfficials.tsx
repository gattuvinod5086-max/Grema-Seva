import { useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router';
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';
import { useApi } from '@web/hooks/useApi';
import { UserProfileCapsule, UserRoleBadge } from '@web/components/ui/UserRoleBadge';
import type { OfficialRecord, User } from '@shared/types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'declined';
type RoleFilter = 'all' | 'sarpanch' | 'ward_member' | 'admin';

/**
 * Super admin and admin console: review official registrations (sarpanches,
 * ward members, and admins) and approve or decline them.
 */
export default function AdminOfficials() {
  const { data: meData, isLoading: meLoading, error: meError } = useApi<{ user: User }>('/api/users/me');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const me = meData?.user;
  const canManage = me?.role === 'super_admin' || me?.role === 'admin';

  const queryUrl = (() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    const str = params.toString();
    return `/api/admin/officials${str ? `?${str}` : ''}`;
  })();

  const officialsApi = useApi<{ officials: OfficialRecord[] }>(queryUrl, {
    enabled: canManage,
  });

  const decide = useCallback(
    async (id: string, action: 'approve' | 'decline') => {
      setBusyId(id);
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/officials/${id}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(action === 'decline' ? { note: 'Registration declined by administrator' } : {}),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setNotice(body?.error?.message ?? 'Action failed.');
          return;
        }
        setNotice(action === 'approve' ? 'Official registration approved successfully!' : 'Official registration declined.');
        void officialsApi.refetch();
      } catch {
        setNotice('Network error.');
      } finally {
        setBusyId(null);
      }
    },
    [officialsApi]
  );

  if (meLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }
  if (meError || !me) return <Navigate to="/login" replace />;
  if (!canManage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-600">
        <ShieldAlert className="w-10 h-10 text-red-600" />
        <p className="font-semibold">Administrator access required.</p>
        <Link to="/board" className="text-sm underline text-[#67001A]">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Official Registrations</h1>
              <p className="text-xs text-slate-500">Approve or decline sarpanch, ward member and admin sign-ups</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <UserProfileCapsule user={me} />
              <Link
                to="/sarpanches"
                className="px-3 py-2 rounded-lg border border-[#CCB252] text-sm font-semibold text-[#67001A] hover:bg-amber-50/70"
              >
                Village Sarpanches
              </Link>
              <Link
                to="/board"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Issue board
              </Link>
            </div>
          </div>

          {/* Filter bars: Role & Status */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
            {/* Role Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { id: 'all', label: 'All Roles' },
                  { id: 'sarpanch', label: 'Sarpanches' },
                  { id: 'ward_member', label: 'Ward Members' },
                  { id: 'admin', label: 'Admins' },
                ] as { id: RoleFilter; label: string }[]
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoleFilter(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    roleFilter === r.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', 'pending', 'approved', 'declined'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    statusFilter === s ? 'bg-[#67001A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {notice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm">{notice}</div>
        )}

        {officialsApi.isLoading ? (
          <div className="text-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : (officialsApi.data?.officials.length ?? 0) === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            {statusFilter === 'all' ? 'No official registrations found.' : `No ${statusFilter} registrations.`}
          </div>
        ) : (
          officialsApi.data!.officials.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{o.name}</h3>
                  <UserRoleBadge role={o.role} size="xs" />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {o.phone ?? '—'} · {o.village ? `${o.village}, ${o.mandal}, ${o.district}` : 'No jurisdiction'}
                  {o.wardNumber ? ` · Ward ${o.wardNumber}` : ''}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Requested {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {o.approvalNote ? ` · ${o.approvalNote}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {o.approvalStatus === 'approved' ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Approved</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => decide(o.id, 'decline')}
                      disabled={busyId === o.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Decline / Revoke Official"
                    >
                      {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Decline</span>
                    </button>
                  </div>
                ) : o.approvalStatus === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Pending
                    </span>
                    <button
                      type="button"
                      onClick={() => decide(o.id, 'approve')}
                      disabled={busyId === o.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                    >
                      {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(o.id, 'decline')}
                      disabled={busyId === o.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Decline</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Declined</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => decide(o.id, 'approve')}
                      disabled={busyId === o.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-colors"
                    >
                      {busyId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Re-Approve</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
