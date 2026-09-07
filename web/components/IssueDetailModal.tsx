import { useState } from 'react';
import { X, CheckCircle2, RotateCcw, Loader2, MapPin, Play, StickyNote } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { pinIcon } from '@web/components/map/LocationPicker';
import SlaDisplay from '@web/components/SlaDisplay';
import IssueTimeline from '@web/components/IssueTimeline';
import { GsCard } from '@web/components/ui/GsCard';
import { IssueStatusBadge, PriorityBadge } from '@web/components/ui/StatusBadge';
import type { IssueDetail, IssueStatus, User } from '@shared/types';

interface IssueDetailModalProps {
  issue: IssueDetail;
  /** Signed-in user — decides whether official controls are shown. */
  me: User | null;
  onClose: () => void;
  onChanged: () => void;
}

const ACTIVE_STATUSES: IssueStatus[] = ['Submitted', 'Acknowledged', 'In Progress', 'Reopened'];

/** Officials with real powers: approved sarpanch/ward member, admin, super admin. */
function isEmpoweredOfficial(me: User | null): boolean {
  if (!me) return false;
  return (
    me.role === 'super_admin' ||
    me.role === 'admin' ||
    (['sarpanch', 'ward_member'].includes(me.role) && me.approvalStatus === 'approved')
  );
}

/**
 * Issue view for everyone: full status, SLA, timeline and evidence.
 * Reporters get confirm/reopen; empowered officials get status actions and
 * progress notes (the sarpanch/admin working view).
 */
export default function IssueDetailModal({ issue, me, onClose, onChanged }: IssueDetailModalProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);

  const isReporter = me != null && issue.reporterId === me.id;
  const official = isEmpoweredOfficial(me) ? me : null;
  const canManage = official != null && ACTIVE_STATUSES.includes(issue.status);
  const canConfirm = isReporter && issue.status === 'Resolved';

  const act = async (path: string, method: 'POST' | 'PATCH', body?: unknown) => {
    setBusy(path);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issue.id}/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(resBody?.error?.message ?? 'Action failed.');
        return;
      }
      setProgressNote('');
      setShowNoteBox(false);
      onChanged();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(null);
    }
  };

  const photos = issue.attachments.filter((a) => a.kind === 'photo');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#67001A]">{issue.code}</p>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{issue.category}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <IssueStatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issue.department && (
              <span className="text-xs text-slate-500">· {issue.department}</span>
            )}
          </div>

          <p className="text-sm text-slate-700">{issue.description}</p>

          {issue.addressText && (
            <p className="text-xs text-slate-500 flex items-start gap-1">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              <span>
                {issue.addressText}
                {issue.latitude != null && issue.longitude != null
                  ? ` (${issue.latitude.toFixed(5)}, ${issue.longitude.toFixed(5)})`
                  : ''}
              </span>
            </p>
          )}

          {issue.latitude != null && issue.longitude != null && (
            <MapContainer
              center={[issue.latitude, issue.longitude]}
              zoom={16}
              scrollWheelZoom={false}
              className="h-44 w-full rounded-xl border border-slate-200 z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[issue.latitude, issue.longitude]} icon={pinIcon('#67001A')} />
            </MapContainer>
          )}

          <SlaDisplay
            createdAt={issue.createdAt}
            priority={issue.priority}
            slaDueAt={issue.slaDueAt}
            acknowledgedAt={issue.acknowledgedAt}
            resolvedAt={issue.resolvedAt}
            status={issue.status}
          />

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((p) => (
                <img
                  key={p.id}
                  src={`/api/files/${p.key}`}
                  alt="Report evidence"
                  className="w-full h-36 object-cover rounded-xl border border-slate-200"
                />
              ))}
            </div>
          )}

          {/* Official controls: status actions + progress note */}
          {canManage && official && (
            <GsCard padding="p-4" className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Official actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {issue.status === 'Submitted' && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => act('status', 'PATCH', { status: 'Acknowledged', note: 'Acknowledged by official' })}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-black uppercase tracking-wide disabled:opacity-50"
                  >
                    {busy === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Acknowledge
                  </button>
                )}
                {['Submitted', 'Acknowledged', 'Reopened'].includes(issue.status) && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => act('status', 'PATCH', { status: 'In Progress', note: 'Work started' })}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wide disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    Start work
                  </button>
                )}
                {issue.status !== 'Resolved' && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => act('status', 'PATCH', { status: 'Resolved', note: 'Marked resolved' })}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-tg-green text-white text-xs font-black uppercase tracking-wide disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark resolved
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setShowNoteBox((v) => !v)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wide disabled:opacity-50"
                >
                  <StickyNote className="w-4 h-4" />
                  Progress note
                </button>
              </div>

              {showNoteBox && (
                <div className="space-y-2">
                  <textarea
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    rows={3}
                    placeholder="What progress was made? (visible to the reporter and villagers)"
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-[#67001A] outline-none text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy !== null || progressNote.trim().length < 3}
                    onClick={() => act('progress', 'POST', { note: progressNote })}
                    className="px-4 py-2 rounded-xl bg-[#67001A] text-white text-xs font-black uppercase tracking-wide disabled:opacity-50"
                  >
                    {busy === 'progress' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post note'}
                  </button>
                </div>
              )}
            </GsCard>
          )}

          {/* Reporter controls */}
          {canConfirm && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act('confirm', 'POST')}
                className="flex-1 py-3 rounded-xl bg-tg-green text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Issue Resolved — Confirm
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act('reopen', 'POST', { reason: 'Not actually resolved' })}
                className="flex-1 py-3 rounded-xl bg-white border-2 border-tg-maroon text-tg-maroon font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy === 'reopen' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Not Resolved — Reopen
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>
          )}

          <GsCard padding="p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Timeline</h3>
            <IssueTimeline events={issue.timeline} />
          </GsCard>
        </div>
      </div>
    </div>
  );
}
