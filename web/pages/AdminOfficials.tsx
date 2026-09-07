import { useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router';
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';
import { useApi } from '@web/hooks/useApi';
import type { OfficialRecord, User } from '@shared/types';

type StatusFilter = 'pending' | 'approved' | 'declined';

/**
 * Super admin console: review official registrations and approve or
 * decline them. Every decision is written to the audit log server-side.
 */
export default function AdminOfficials() {
  const { data: meData, isLoading: meLoading, error: meError } = useApi<{ user: User }>('/api/users/me');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const me = meData?.user;
  const isSuperAdmin = me?.role === 'super_admin';

  const officialsApi = useApi<{ officials: OfficialRecord[] }>(
    '/api/admin/officials?status=' + statusFilter,
    { enabled: isSuperAdmin }
  );

  const decide = useCallback(
    async (id: string, action: 'approve' | 'decline') => {
      setBusyId(id);
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/officials/${id}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(action === 'decline' ? { note: 'Registration declined by super admin' } : {}),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setNotice(body?.error?.message ?? 'Action failed.');
          return;
        }
        setNotice(action === 'approve' ? 'Registration approved.' : 'Registration declined.');
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
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-600">
        <ShieldAlert className="w-10 h-10 text-red-600" />
        <p className="font-semibold">Super admin access only.</p>
        <Link to="/" className="text-sm underline text-[#67001A]">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Official Registrations</h1>
            <p className="text-xs text-slate-500">Approve or decline sarpanch, ward member and admin sign-ups</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Issue board
            </Link>
            {(['pending', 'approved', 'declined'] as StatusFilter[]).map((s) => (
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
          <div className="text-center py-16 text-slate-500 text-sm">No {statusFilter} registrations.</div>
        ) : (
          officialsApi.data!.officials.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{o.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#67001A]/10 text-[#67001A]">
                    {o.role.replace('_', ' ')}
                  </span>
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
              {o.approvalStatus === 'pending' ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => decide(o.id, 'approve')}
                    disabled={busyId === o.id}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busyId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(o.id, 'decline')}
                    disabled={busyId === o.id}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              ) : (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${
                    o.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {o.approvalStatus}
                </span>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
