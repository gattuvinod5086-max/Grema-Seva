import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  LogOut,
  Siren,
  Newspaper,
  HandHeart,
  ClipboardList,
  Building2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import IssueList from '@/react-app/components/IssueList';
import IssueForm from '@/react-app/components/IssueForm';
import DashboardNewsSection from '@/react-app/components/DashboardNewsSection';
import VillageScoreCard from '@/react-app/components/ui/VillageScoreCard';
import { GsCard } from '@/react-app/components/ui/GsCard';
import { UI } from '@/react-app/constants/design';
import { BRANDING } from '@/react-app/constants/branding';
import { useApi } from '@/react-app/hooks/useApi';
import { computeVillageAnalytics } from '@/shared/services/analytics';
import type { Issue, User, News, LiveNewsItem } from '@/shared/types';

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
  const [formPreset, setFormPreset] = useState<{ category?: string; priority?: string }>({});
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: user, error: userError, isLoading: userLoading, refetch: refetchUser } =
    useApi<User>('/api/users/me');
  const { data: issues, error: issuesError, isLoading: issuesLoading, refetch: refetchIssues } =
    useApi<Issue[]>('/api/issues');
  const { data: newsItems } = useApi<News[]>('/api/news');
  const { data: liveNewsData } = useApi<{ items: LiveNewsItem[]; available: boolean; message?: string }>(
    '/api/news/live'
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const priority = params.get('priority');
    if (category || priority) {
      setFormPreset({ category: category ?? undefined, priority: priority ?? undefined });
      setShowForm(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const activeIssues = useMemo(
    () => (issues ?? []).filter((i) => !['Resolved', 'Closed'].includes(i.status)),
    [issues]
  );

  const villageScore = useMemo(() => {
    if (!user?.village || !issues) return null;
    return computeVillageAnalytics(user.village, issues).developmentScore;
  }, [user?.village, issues]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const scrollToIssues = () => {
    document.getElementById('my-issues')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={UI.page}>
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={BRANDING.logoEmblem}
              alt=""
              className="w-9 h-9 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = BRANDING.logoFallback; }}
            />
            <div className="min-w-0">
              <h1 className="text-lg font-heading text-[#67001A] leading-tight truncate">GramSeva</h1>
              <p className="text-[10px] font-telugu text-[#64748B] truncate telugu-text">గ్రామ సేవ</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#67001A] text-white flex items-center justify-center text-xs font-bold">
              {getInitials(user?.name ?? null)}
            </div>
            <button
              type="button"
              onClick={() => navigate('/telangana')}
              className="p-2 rounded-lg border border-[#E5E7EB] text-[#64748B] hover:bg-slate-50"
              aria-label="Telangana admin map"
            >
              <MapPin size={18} />
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="p-2 rounded-lg border border-[#E5E7EB] text-[#64748B] hover:bg-slate-50"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting & village identity */}
        <section className="space-y-2">
          <p className="text-sm text-[#64748B]">{greeting()},</p>
          <h2 className="text-2xl md:text-3xl font-heading text-[#1F2937]">
            {user?.name?.split(' ')[0] ?? 'Citizen'}
          </h2>
          {user?.village && (
            <GsCard padding="p-4" className="flex items-start gap-3">
              <MapPin size={18} className="text-[#008A3B] shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className={UI.label}>Your village</p>
                <p className="font-semibold text-[#1F2937] mt-0.5">
                  {user.village}, {user.mandal}
                </p>
                <p className="text-sm text-[#64748B]">{user.district} District</p>
              </div>
            </GsCard>
          )}
        </section>

        {/* Primary action */}
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className={`w-full flex items-center justify-center gap-3 py-5 text-lg ${UI.btnPrimary}`}
        >
          <Plus size={24} strokeWidth={2.5} aria-hidden />
          Report a Problem
        </button>

        {/* Quick actions */}
        <section>
          <p className={UI.label + ' mb-3'}>Quick actions</p>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon={<Siren size={20} />}
              label="Emergency & Help"
              sublabel="Police, ambulance, fire"
              accent="emergency"
              onClick={() => navigate('/emergency')}
            />
            <QuickAction
              icon={<Newspaper size={20} />}
              label="News"
              sublabel="Village announcements"
              onClick={() => navigate('/news')}
            />
            <QuickAction
              icon={<HandHeart size={20} />}
              label="Welfare Schemes"
              sublabel="Telangana programs"
              onClick={() => navigate('/app')}
            />
            <QuickAction
              icon={<ClipboardList size={20} />}
              label="My Issues"
              sublabel={`${activeIssues.length} active`}
              onClick={scrollToIssues}
            />
            <QuickAction
              icon={<Building2 size={20} />}
              label="Panchayat"
              sublabel="Ward & leaders"
              onClick={() => navigate('/ward-members')}
            />
            <QuickAction
              icon={<Sparkles size={20} />}
              label="AI Assistant"
              sublabel="Vikas Sahayak"
              onClick={() => navigate('/app')}
            />
          </div>
        </section>

        {/* Village score */}
        {villageScore && (
          <section>
            <VillageScoreCard score={villageScore} />
          </section>
        )}

        {/* News */}
        <DashboardNewsSection
          announcements={newsItems ?? []}
          liveNews={liveNewsData?.items}
          liveAvailable={liveNewsData?.available}
          liveMessage={liveNewsData?.message}
        />

        {/* My issues */}
        <section id="my-issues" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1F2937]">My active issues</h3>
            {(issues?.length ?? 0) > 0 && (
              <span className="text-xs font-semibold text-[#64748B]">{activeIssues.length} open</span>
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
          ) : activeIssues.length === 0 ? (
            <GsCard className="text-center py-10">
              <ClipboardList size={32} className="mx-auto text-[#64748B] mb-3" aria-hidden />
              <p className="font-semibold text-[#1F2937]">No active issues</p>
              <p className="text-sm text-[#64748B] mt-1">Tap &quot;Report a Problem&quot; when you need help.</p>
            </GsCard>
          ) : (
            <IssueList issues={activeIssues} />
          )}
        </section>
      </main>

      {showForm && (
        <IssueForm
          onClose={() => setShowForm(false)}
          onSubmit={() => { setShowForm(false); refetchIssues(); }}
          initialCategory={formPreset.category}
          initialPriority={formPreset.priority}
        />
      )}
    </div>
  );
}
