import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router";
import {
  Home,
  PlusCircle,
  ClipboardList,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Contact,
  Award,
  Bot,
  Sparkles,
  Newspaper,
  Siren,
  BarChart3,
  Building2,
  Crown,
} from "lucide-react";
import { BRANDING } from "@web/constants/branding";
import { LanguageToggle, useLanguage } from "@web/context/LanguageContext";
import { LiveIndicator } from "@web/context/RealtimeContext";
import NotificationBell from "@web/components/NotificationBell";
import { UserRoleBadge } from "@web/components/ui/UserRoleBadge";
import { useApi } from "@web/hooks/useApi";
import type { User } from "@shared/types";
import IssueForm from "@web/components/IssueForm";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  badge?: string;
  urgent?: boolean;
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  collapsed,
  badge,
  urgent,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : ""}
      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all relative group text-left ${
        urgent
          ? "bg-red-700/80 text-white hover:bg-red-700 shadow-md border border-red-400/60"
          : active
          ? "bg-[#CCB252]/25 text-white shadow-md border border-[#CCB252]/60"
          : "text-white/80 hover:text-white hover:bg-white/10 border border-transparent"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
          urgent
            ? "bg-white text-red-700 font-bold"
            : active
            ? "bg-[#CCB252] text-[#67001A]"
            : "text-[#CCB252] group-hover:bg-[#CCB252]/20"
        }`}
      >
        {icon}
      </div>

      {!collapsed && (
        <span
          className={`flex-1 text-[11px] font-black uppercase tracking-[0.08em] truncate ${
            active ? "text-white" : "text-white/90"
          }`}
        >
          {label}
        </span>
      )}

      {!collapsed && badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#CCB252] text-[#67001A]">
          {badge}
        </span>
      )}

      {active && !urgent && (
        <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#CCB252]" />
      )}
    </button>
  );
}

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: userResp } = useApi<{ user: User }>("/api/users/me");
  const user = userResp?.user;
  const { t } = useLanguage();

  const pathname = location.pathname;

  // Close mobile sidebar on route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { credentials: "same-origin" });
    navigate("/login");
  };

  const isOfficial =
    user?.role === "sarpanch" ||
    user?.role === "ward_member" ||
    user?.role === "admin" ||
    user?.role === "super_admin";

  return (
    <div
      className="flex min-h-screen overflow-x-hidden relative"
      style={{ background: "var(--tg-bg)" }}
    >
      {/* Mobile drawer backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity lg:hidden backdrop-blur-sm ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(103, 0, 26, 0.6)" }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Sidebar (Deep Telangana Maroon + Gold Border) */}
      <aside
        className={`fixed lg:sticky top-0 h-screen p-4 md:p-6 flex flex-col z-50 transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-24" : "w-[280px] md:w-80"} border-r-[3px] border-[#CCB252]`}
        style={{
          background: "linear-gradient(180deg, #67001A 0%, #4d0012 100%)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(204,178,82,0.2)",
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 px-2 relative">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-[#CCB252] bg-white/10 shadow-sm">
            <img
              src={BRANDING.logoEmblem}
              className="w-7 md:w-8 brightness-0 invert object-contain"
              alt="Government of Telangana"
              onError={(e) => {
                (e.target as HTMLImageElement).src = BRANDING.logoFallback;
              }}
            />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-tight truncate">
                గ్రామ సేవ
              </h1>
              <p className="text-[9px] font-black text-[#CCB252] uppercase tracking-widest truncate">
                జై తెలంగాణ · TG Terminal
              </p>
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-7 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform text-[#67001A] bg-[#CCB252] border border-white/40"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1.5 rounded-lg text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 min-h-0 space-y-1.5 overflow-y-auto no-scrollbar pr-1">
          <SidebarItem
            icon={<Home size={18} strokeWidth={2.5} />}
            label={t.nav.home ?? "Home"}
            active={pathname === "/" || pathname === "/board"}
            onClick={() => navigate("/")}
            collapsed={isCollapsed}
          />

          {user?.role === "citizen" && user?.village && (
            <SidebarItem
              icon={<PlusCircle size={18} strokeWidth={2.5} />}
              label={t.nav.reportIssue ?? "Report Issue"}
              active={false}
              onClick={() => setShowReportModal(true)}
              collapsed={isCollapsed}
              badge="New"
            />
          )}

          <SidebarItem
            icon={<ClipboardList size={18} strokeWidth={2.5} />}
            label={t.nav.villageLogs ?? "Village Logs"}
            active={pathname === "/issues" || pathname === "/telangana/issues"}
            onClick={() => navigate("/issues")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            icon={<Contact size={18} strokeWidth={2.5} />}
            label={t.nav.panchayat ?? "Panchayat"}
            active={pathname === "/sarpanches" || pathname === "/admin/sarpanches"}
            onClick={() => navigate("/sarpanches")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            icon={<Building2 size={18} strokeWidth={2.5} />}
            label={t.nav.districtsAndVillages ?? "Districts & Villages"}
            active={pathname === "/telangana"}
            onClick={() => navigate("/telangana")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            icon={<Award size={18} strokeWidth={2.5} />}
            label={t.nav.welfareHub ?? "Welfare Hub"}
            active={pathname === "/schemes"}
            onClick={() => navigate("/schemes")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            icon={<Newspaper size={18} strokeWidth={2.5} />}
            label={t.nav.news ?? "News & Announcements"}
            active={pathname === "/notices" || pathname === "/news"}
            onClick={() => navigate("/notices")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            icon={<Siren size={18} strokeWidth={2.5} />}
            label={t.nav.emergency ?? "Emergency & Help"}
            active={pathname === "/emergency"}
            onClick={() => navigate("/emergency")}
            collapsed={isCollapsed}
            urgent
          />

          <SidebarItem
            icon={<Bot size={18} strokeWidth={2.5} />}
            label={t.nav.krishiAi ?? "Krishi AI"}
            active={pathname === "/krishi"}
            onClick={() => navigate("/krishi")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            icon={<Sparkles size={18} strokeWidth={2.5} />}
            label={t.nav.aiAssistant ?? "AI Assistant"}
            active={pathname === "/vikas"}
            onClick={() => navigate("/vikas")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            icon={<BarChart3 size={18} strokeWidth={2.5} />}
            label={t.nav.analytics ?? "Village Analytics"}
            active={pathname === "/analytics"}
            onClick={() => navigate("/analytics")}
            collapsed={isCollapsed}
          />

          {isOfficial && (
            <div className="pt-2 mt-2 border-t border-white/10 space-y-1.5">
              <p className={`text-[9px] font-black uppercase tracking-wider text-[#CCB252] px-3 ${isCollapsed ? "hidden" : "block"}`}>
                Governance & Admin
              </p>

              {(user?.role === "super_admin" || user?.role === "admin") && (
                <SidebarItem
                  icon={<Crown size={18} strokeWidth={2.5} />}
                  label="Official Approvals"
                  active={pathname === "/admin/officials"}
                  onClick={() => navigate("/admin/officials")}
                  collapsed={isCollapsed}
                />
              )}

              <SidebarItem
                icon={<Building2 size={18} strokeWidth={2.5} />}
                label="Ward Members"
                active={pathname === "/ward-members"}
                onClick={() => navigate("/ward-members")}
                collapsed={isCollapsed}
              />
            </div>
          )}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="mt-auto pt-4 border-t border-[#CCB252]/30">
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl bg-white/10 group transition-all ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md shrink-0 bg-[#CCB252] text-[#67001A]">
              {user?.name?.[0] ?? "U"}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-black text-white truncate">{user?.name ?? "Citizen"}</p>
                <p className="text-[9px] font-bold text-[#CCB252] uppercase tracking-wider truncate">
                  {user?.village || "Telangana"} • {user?.mandal || "Citizen"}
                </p>
                {user?.role && (
                  <div className="mt-1">
                    <UserRoleBadge role={user.role} size="sm" />
                  </div>
                )}
              </div>
            )}

            {!isCollapsed && (
              <button
                type="button"
                onClick={() => void logout()}
                className="text-white/70 hover:text-[#CCB252] p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main App Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E5E7EB] px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-[#67001A] hover:bg-slate-50"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#008A3B] uppercase tracking-wider font-telugu telugu-text">
                జై తెలంగాణ
              </p>
              <h1 className="text-lg md:text-xl font-heading text-[#67001A] truncate leading-tight">
                GramSeva Terminal
              </h1>
              <p className="text-xs text-[#64748B] truncate">
                {user?.village ? `${user.village}, ${user.mandal}` : "Telangana Digital Village Governance"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/emergency"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700 text-white font-bold text-xs uppercase hover:bg-red-800 shadow-sm transition-colors"
            >
              <Siren size={14} />
              <span>Emergency</span>
            </Link>
            <LiveIndicator />
            <NotificationBell />
            <LanguageToggle />
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto relative min-w-0">
          {/* Subtle Map Watermark */}
          <div
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-[0.03]"
            style={{ backgroundImage: `url(${BRANDING.bgMap})` }}
            aria-hidden
          />

          <div className="relative z-10">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      {/* Global Issue Report Modal (Citizens only) */}
      {showReportModal && user?.role === "citizen" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <IssueForm
              onSubmitted={() => {
                setShowReportModal(false);
                navigate("/issues");
              }}
              onClose={() => setShowReportModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
