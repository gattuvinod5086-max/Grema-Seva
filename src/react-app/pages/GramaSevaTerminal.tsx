import { useState, useEffect } from "react";
import {
  Home,
  PlusCircle,
  ClipboardList,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  Search,
  Contact,
  Award,
  Bot,
  Sparkles,
  FileText,
  Newspaper,
  Siren,
} from "lucide-react";
import { DB_KEYS, MockDB } from "@/react-app/data/terminalData";
import type { AppUser, VillageIssue } from "@/react-app/data/terminalData";
import { TerminalAuth } from "@/react-app/pages/terminal/TerminalAuth";
import { TerminalHome } from "@/react-app/pages/terminal/TerminalHome";
import { TerminalReport } from "@/react-app/pages/terminal/TerminalReport";
import { TerminalIssues } from "@/react-app/pages/terminal/TerminalIssues";
import { TerminalPanchayat } from "@/react-app/pages/terminal/TerminalPanchayat";
import { TerminalWelfare } from "@/react-app/pages/terminal/TerminalWelfare";
import { TerminalSchemeApply } from "@/react-app/pages/terminal/TerminalSchemeApply";
import { TerminalChat } from "@/react-app/pages/terminal/TerminalChat";
import { TerminalKrishi } from "@/react-app/pages/terminal/TerminalKrishi";
import OfficialDashboard from "@/react-app/components/OfficialDashboard";
import VillageAnalytics from "@/react-app/components/VillageAnalytics";
import { LanguageToggle } from "@/react-app/context/LanguageContext";
import { createLocalIssue, processLocalEscalations, persistLocalIssue } from "@/react-app/services/localGovernance";
import { TerminalNews } from "@/react-app/pages/terminal/TerminalNews";
import { TerminalNewsEditor } from "@/react-app/pages/terminal/TerminalNewsEditor";
import { TerminalNewsDetail } from "@/react-app/pages/terminal/TerminalNewsDetail";
import { TerminalNewsManage } from "@/react-app/pages/terminal/TerminalNewsManage";
import { NewsMockDB } from "@/react-app/data/newsData";
import { EmergencyMockDB } from "@/react-app/data/emergencyData";
import { TerminalEmergency } from "@/react-app/pages/terminal/TerminalEmergency";
import { TerminalEmergencyManage } from "@/react-app/pages/terminal/TerminalEmergencyManage";
import { BRANDING } from "@/react-app/constants/branding";

const SIDEBAR_ICON_SIZE = 22;

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : ""}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl md:rounded-2xl transition-all relative group ${
        active
          ? "bg-tg-gold/30 text-white shadow-md border border-tg-gold/60"
          : "text-white/80 hover:text-white hover:bg-white/15 border border-transparent"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${
          active ? "bg-tg-gold text-tg-maroon" : "text-tg-gold/80 group-hover:bg-tg-gold/25 group-hover:text-tg-gold"
        }`}
      >
        {icon}
      </div>
      {!collapsed && (
        <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-left transition-opacity duration-300 ${active ? "text-white" : "text-white/90"}`}>
          {label}
        </span>
      )}
      {active && <div className="absolute left-0 w-1 h-8 rounded-r-full bg-tg-gold" />}
    </button>
  );
}

export default function GramaSevaTerminal() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [view, setView] = useState("home");
  const [newsDetailId, setNewsDetailId] = useState<string | null>(null);
  const [editNewsId, setEditNewsId] = useState<string | null>(null);
  const [reportPreset, setReportPreset] = useState<{ category?: string; priority?: string } | null>(null);
  const [issues, setIssues] = useState<VillageIssue[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const sessionID = localStorage.getItem(DB_KEYS.SESSION);
    if (sessionID) {
      const stored = MockDB.getUserByPhone(sessionID);
      if (stored) {
        MockDB.seedDemoIssues(stored.village);
        NewsMockDB.seedDemo(stored.village, stored.district, stored.mandal);
        EmergencyMockDB.seedDemo(stored.village, stored.district, stored.mandal);
        setUser(stored);
        const raw = MockDB.getIssuesByVillage(stored.village);
        const processed = processLocalEscalations(raw);
        processed.forEach((i) => MockDB.updateIssue(i));
        setIssues(processed);
      }
    }
  }, []);

  useEffect(() => {
    if (user && view === "list") {
      setIssues(MockDB.getIssuesByVillage(user.village));
    }
  }, [user, view]);

  const refreshIssues = () => {
    if (!user) return;
    const raw = MockDB.getIssuesByVillage(user.village);
    const processed = processLocalEscalations(raw);
    processed.forEach((i) => MockDB.updateIssue(i));
    setIssues(processed);
  };

  const handleLoginSuccess = (u: AppUser) => {
    MockDB.seedDemoIssues(u.village);
    NewsMockDB.seedDemo(u.village, u.district, u.mandal);
    EmergencyMockDB.seedDemo(u.village, u.district, u.mandal);
    setUser(u);
    localStorage.setItem(DB_KEYS.SESSION, u.phone);
    refreshIssues();
    setView("home");
  };

  /* Telangana theme: emblem green + gold + cultural warmth (royal blue / red-orange hints) */
  const gradientBg = "var(--tg-bg)";
  useEffect(() => {
    if (!user) return;
    const prev = document.body.style.background;
    document.body.style.background = gradientBg;
    return () => { document.body.style.background = prev; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const priority = params.get("priority");
    if (category || priority) {
      setReportPreset({
        category: category ?? undefined,
        priority: priority ?? undefined,
      });
      setView("report");
      window.history.replaceState({}, "", "/app");
    }
  }, [user]);

  if (!user) return <TerminalAuth onLoginSuccess={handleLoginSuccess} />;

  return (
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{ background: gradientBg }}
    >
      <div
        className={`fixed inset-0 z-40 transition-opacity lg:hidden backdrop-blur-sm ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(103, 0, 26, 0.5)" }}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed lg:sticky top-0 h-screen p-6 md:p-10 flex flex-col z-50 transition-all duration-500 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-28" : "w-[280px] md:w-80"} border-r-[3px] border-tg-gold`}
        style={{
          background: "var(--tg-gradient-sidebar)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(204,178,82,0.2)",
        }}
      >
        <div className="flex items-center gap-4 mb-16 md:mb-20 px-4 relative">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-tg-gold bg-white/10">
            <img
              src={BRANDING.logoEmblem}
              className="w-6 md:w-8 brightness-0 invert object-contain"
              alt="Government of Telangana"
              onError={(e) => {
                (e.target as HTMLImageElement).src = BRANDING.logoFallback;
              }}
            />
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter drop-shadow-sm">
                గ్రామ సేవ
              </h1>
              <p className="text-[8px] md:text-[10px] font-black text-tg-gold uppercase tracking-widest mt-0.5">
                జై తెలంగాణ · TG Terminal
              </p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform text-tg-maroon bg-tg-gold"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 min-h-0 space-y-2 md:space-y-4 overflow-y-auto no-scrollbar">
          <SidebarItem
            icon={<Home size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Home"
            active={view === "home"}
            onClick={() => setView("home")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<PlusCircle size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Report Issue"
            active={view === "report"}
            onClick={() => setView("report")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<ClipboardList size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Village Logs"
            active={view === "list"}
            onClick={() => setView("list")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Contact size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Panchayat"
            active={view === "panchayat"}
            onClick={() => setView("panchayat")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Award size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Welfare Hub"
            active={view === "schemes"}
            onClick={() => setView("schemes")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<FileText size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Telangana Welfare Schemes"
            active={view === "apply-schemes"}
            onClick={() => setView("apply-schemes")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Newspaper size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="News & Announcements"
            active={view === "news" || view === "news-detail" || view === "news-create" || view === "news-manage"}
            onClick={() => { setView("news"); setNewsDetailId(null); }}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Bot size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Krishi AI"
            active={view === "krishi"}
            onClick={() => setView("krishi")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Sparkles size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="AI Assistant"
            active={view === "vikas"}
            onClick={() => setView("vikas")}
            collapsed={isCollapsed}
          />
          {(user.role === "Sarpanch" || user.role === "Ward Member" || user.role === "Admin") && (
            <SidebarItem
              icon={<ClipboardList size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
              label="Official Dashboard"
              active={view === "official"}
              onClick={() => setView("official")}
              collapsed={isCollapsed}
            />
          )}
          <SidebarItem
            icon={<Award size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Village Analytics"
            active={view === "analytics"}
            onClick={() => setView("analytics")}
            collapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Siren size={SIDEBAR_ICON_SIZE} strokeWidth={2.25} />}
            label="Emergency & Help"
            active={view === "emergency" || view === "emergency-manage"}
            onClick={() => setView("emergency")}
            collapsed={isCollapsed}
          />
        </nav>

        <div className="mt-auto pt-10 border-t border-tg-gold/30">
          <div
            className={`flex items-center gap-4 p-4 rounded-3xl bg-white/10 group transition-all ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shrink-0 bg-tg-gold text-tg-maroon">
              {user.name[0]}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden transition-opacity duration-300">
                <p className="text-xs font-black text-white truncate">{user.name}</p>
                <p className="text-[8px] font-bold text-tg-gold/90 uppercase tracking-widest truncate">
                  {user.mandal} • {user.village}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={() => {
                  localStorage.removeItem(DB_KEYS.SESSION);
                  setUser(null);
                }}
                className="text-white/60 hover:text-tg-gold transition-colors"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main
        className="flex-1 min-w-0 p-4 md:p-14 overflow-y-auto relative custom-scrollbar transition-all duration-500"
        style={{ background: gradientBg }}
      >
        {/* Subtle map watermark */}
        <div
          className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-[0.03]"
          style={{ backgroundImage: `url(${BRANDING.bgMap})` }}
          aria-hidden
        />
        <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-1">
          <div className="flex items-center justify-between gap-4 w-full md:w-auto">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0 p-3 rounded-lg border border-[#E5E7EB] bg-white text-[#67001A] shadow-sm"
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={2.25} />
            </button>
            <div className="min-w-0 flex-1 md:flex-initial">
              <p className="text-[10px] font-semibold text-[#008A3B] uppercase tracking-wide mb-1 font-telugu telugu-text">
                జై తెలంగాణ
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-heading text-[#67001A] truncate">
                GramSeva Terminal
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5 truncate">{user.village}, {user.mandal}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="relative hidden xl:block">
              <input
                className="bg-white border border-[#E5E7EB] rounded-lg py-3 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-[#67001A]/10 focus:border-[#67001A]/30"
                placeholder="Search…"
                aria-label="Search"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={16} />
            </div>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto">
          {view === "home" && (
            <TerminalHome user={user} issues={issues} setView={setView} />
          )}
          {view === "report" && (
            <TerminalReport
              user={user}
              existingIssues={issues}
              initialCategory={reportPreset?.category}
              initialPriority={reportPreset?.priority}
              onSubmit={(data) => {
                const issue = createLocalIssue({
                  citizenId: user.id,
                  citizenName: user.name,
                  category: data.category ?? "Water",
                  description: data.description ?? "",
                  priority: data.priority,
                  ward: user.ward,
                  village: user.village,
                  district: user.district,
                  mandal: user.mandal,
                  photo: data.photo,
                  isOnline: navigator.onLine,
                });
                if (data.assignedToMemberName) issue.assignedToMemberName = data.assignedToMemberName;
                persistLocalIssue(issue);
                refreshIssues();
                setReportPreset(null);
                setView("home");
              }}
              onCancel={() => {
                setReportPreset(null);
                setView("home");
              }}
              onViewIssue={() => setView("list")}
            />
          )}
          {view === "list" && (
            <TerminalIssues
              issues={issues}
              user={user}
              onRefresh={refreshIssues}
            />
          )}
          {view === "official" && <OfficialDashboard issues={issues} />}
          {view === "analytics" && (
            <VillageAnalytics village={user.village} issues={issues} isDemoData={issues.length < 5} />
          )}
          {view === "panchayat" && <TerminalPanchayat user={user} />}
          {view === "vikas" && <TerminalChat user={user} issues={issues} />}
          {view === "schemes" && <TerminalWelfare />}
          {view === "apply-schemes" && <TerminalSchemeApply />}
          {view === "krishi" && <TerminalKrishi user={user} />}
          {view === "emergency" && (
            <TerminalEmergency
              user={user}
              onReportIssue={(category, priority) => {
                setReportPreset({ category, priority });
                setView("report");
              }}
              onManage={() => setView("emergency-manage")}
            />
          )}
          {view === "emergency-manage" && (
            <TerminalEmergencyManage />
          )}
          {view === "news" && (
            <TerminalNews
              user={user}
              onOpenDetail={(id) => { setNewsDetailId(id); setView("news-detail"); }}
              onCreate={() => { setEditNewsId(null); setView("news-create"); }}
              onManage={() => setView("news-manage")}
            />
          )}
          {view === "news-detail" && newsDetailId && (
            <TerminalNewsDetail id={newsDetailId} onBack={() => setView("news")} />
          )}
          {view === "news-create" && (
            <TerminalNewsEditor
              user={user}
              existing={editNewsId ? NewsMockDB.getById(editNewsId) : undefined}
              onSave={() => setView("news-manage")}
              onCancel={() => setView("news")}
            />
          )}
          {view === "news-manage" && (
            <TerminalNewsManage
              user={user}
              onEdit={(id) => { setEditNewsId(id); setView("news-create"); }}
              onBack={() => setView("news")}
            />
          )}
        </div>
      </main>
    </div>
  );
}
