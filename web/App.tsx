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
import AppLayout from "@web/components/layout/AppLayout";
import { RealtimeProvider } from "@web/context/RealtimeContext";

export default function App() {
  return (
    <Router>
      <RealtimeProvider>
        <Routes>
          {/* Public & Entry Routes */}
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
            <Route path="/" element={<RoleHome />} />
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
