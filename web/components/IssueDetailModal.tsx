import { useState } from 'react';
import { X, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import SlaDisplay from '@web/components/SlaDisplay';
import IssueTimeline from '@web/components/IssueTimeline';
import { GsCard } from '@web/components/ui/GsCard';
import { IssueStatusBadge, PriorityBadge } from '@web/components/ui/StatusBadge';
import type { IssueDetail } from '@shared/types';

interface IssueDetailModalProps {
  issue: IssueDetail;
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Citizen view of a single complaint: full status, SLA, official progress
 * notes and evidence, plus confirm / reopen actions for the reporter.
 */
export default function IssueDetailModal({ issue, onClose, onChanged }: IssueDetailModalProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (path: string, body?: unknown) => {
    setBusy(path);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issue.id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(resBody?.error?.message ?? 'Action failed.');
        return;
      }
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
            <p className="text-xs text-slate-500">
              <strong>Location:</strong> {issue.addressText}
              {issue.latitude != null && issue.longitude != null
                ? ` (${issue.latitude.toFixed(5)}, ${issue.longitude.toFixed(5)})`
                : ''}
            </p>
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

          {issue.status === 'Resolved' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act('confirm')}
                className="flex-1 py-3 rounded-xl bg-tg-green text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Issue Resolved — Confirm
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act('reopen', { reason: 'Not actually resolved' })}
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
