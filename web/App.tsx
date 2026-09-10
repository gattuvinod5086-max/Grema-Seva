import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import ProtectedRoute from "@web/components/ProtectedRoute";
import Login from "@web/pages/Login";
import PhoneLogin from "@web/pages/PhoneLogin";
import OfficialRegister from "@web/pages/OfficialRegister";
import AdminOfficials from "@web/pages/AdminOfficials";
import RoleHome from "@web/pages/RoleHome";
import CitizenDashboard from "@web/pages/CitizenDashboard";
import SarpanchDirectory from "@web/pages/SarpanchDirectory";
import TelanganaAdmin from "@web/pages/TelanganaAdmin";
import VillageIssues from "@web/pages/VillageIssues";
import Registration from "@web/pages/Registration";
import { WardMembers } from "@web/pages/WardMembers";
import NoticesAndNews from "@web/pages/NoticesAndNews";
import EmergencyHelp from "@web/pages/EmergencyHelp";
import WelfareSchemes from "@web/pages/WelfareSchemes";
import KrishiTerminal from "@web/pages/KrishiTerminal";
import VikasSahayak from "@web/pages/VikasSahayak";
import VillageAnalyticsPage from "@web/pages/VillageAnalyticsPage";
import TerminalLanding from "@web/pages/TerminalLanding";
import AppLayout from "@web/components/layout/AppLayout";
import { RealtimeProvider } from "@web/context/RealtimeContext";
import { useApi } from "@web/hooks/useApi";
import type { User } from "@shared/types";
import { Loader2 } from "lucide-react";

function EntryHome() {
  const { data, isLoading } = useApi<{ user: User }>("/api/users/me");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-10 h-10 animate-spin text-[#67001A]" />
      </div>
    );
  }

  if (data?.user) {
    return (
      <ProtectedRoute key="app-layout" requireLocation={true}>
        <AppLayout>
          <RoleHome />
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return <TerminalLanding />;
}

export default function App() {
  return (
    <Router>
      <RealtimeProvider>
        <Routes>
          {/* Public & Entry Routes */}
          <Route path="/" element={<EntryHome />} />
          <Route path="/app" element={<TerminalLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/phone" element={<PhoneLogin />} />
          <Route path="/register/official" element={<OfficialRegister />} />
          <Route path="/emergency" element={<EmergencyHelp />} />

          {/* User Registration / Profile Completion */}
          <Route
            path="/registration"
            element={
              <ProtectedRoute key="registration" requireLocation={false}>
                <Registration />
              </ProtectedRoute>
            }
          />

          {/* Authenticated GramaSeva Terminal Application with Sidebar Layout */}
          <Route
            element={
              <ProtectedRoute key="app-layout" requireLocation={true}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/board" element={<CitizenDashboard />} />
            <Route path="/issues" element={<CitizenDashboard />} />
            <Route path="/sarpanches" element={<SarpanchDirectory />} />
            <Route path="/admin/sarpanches" element={<SarpanchDirectory />} />
            <Route path="/notices" element={<NoticesAndNews />} />
            <Route path="/news" element={<NoticesAndNews />} />
            <Route path="/schemes" element={<WelfareSchemes />} />
            <Route path="/krishi" element={<KrishiTerminal />} />
            <Route path="/vikas" element={<VikasSahayak />} />
            <Route path="/analytics" element={<VillageAnalyticsPage />} />
            <Route path="/admin/officials" element={<AdminOfficials />} />
            <Route path="/telangana" element={<TelanganaAdmin />} />
            <Route path="/telangana/issues" element={<VillageIssues />} />
            <Route path="/ward-members" element={<WardMembers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RealtimeProvider>
    </Router>
  );
}
