import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import SlaDisplay from '@web/components/SlaDisplay';
import { GsCard } from '@web/components/ui/GsCard';
import { IssueStatusBadge, PriorityBadge } from '@web/components/ui/StatusBadge';
import { getCategoryIcon } from '@web/constants/design';
import type { Issue } from '@shared/types';

interface IssueListProps {
  issues: Issue[];
  onSelectIssue?: (issue: Issue) => void;
}

export default function IssueList({ issues, onSelectIssue }: IssueListProps) {
  return (
    <div className="space-y-3">
      {issues.map((issue) => {
        const CategoryIcon = getCategoryIcon(issue.category);
        return (
          <GsCard
            key={issue.id}
            padding="p-0"
            onClick={onSelectIssue ? () => onSelectIssue(issue) : undefined}
            className="overflow-hidden"
          >
            {issue.photoKey && (
              <div className="w-full h-40 bg-slate-100">
                <img src={`/api/files/${issue.photoKey}`} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#67001A]/8 flex items-center justify-center shrink-0">
                  <CategoryIcon size={20} className="text-[#67001A]" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#1F2937]">{issue.category}</span>
                    <IssueStatusBadge status={issue.status} />
                    {issue.priority && <PriorityBadge priority={issue.priority} />}
                  </div>
                  <p className="text-sm text-[#64748B] line-clamp-2">{issue.description}</p>
                </div>
                {onSelectIssue && (
                  <ChevronRight size={18} className="text-[#64748B] shrink-0 mt-1" aria-hidden />
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                <SlaDisplay
                  compact
                  createdAt={issue.createdAt}
                  priority={issue.priority}
                  slaDueAt={issue.slaDueAt}
                  acknowledgedAt={issue.acknowledgedAt}
                  resolvedAt={issue.resolvedAt}
                  status={issue.status}
                />
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#64748B]">
                {issue.village && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} aria-hidden />
                    {issue.village}
                    {issue.wardNumber ? ` · Ward ${issue.wardNumber}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={12} aria-hidden />
                  {new Date(issue.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </GsCard>
        );
      })}
    </div>
  );
}
