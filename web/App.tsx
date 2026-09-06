import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import ProtectedRoute from "@web/components/ProtectedRoute";
import Login from "@web/pages/Login";
import PhoneLogin from "@web/pages/PhoneLogin";
import OfficialRegister from "@web/pages/OfficialRegister";
import AdminOfficials from "@web/pages/AdminOfficials";
import CitizenDashboard from "@web/pages/CitizenDashboard";
import TelanganaAdmin from "@web/pages/TelanganaAdmin";
import VillageIssues from "@web/pages/VillageIssues";
import Registration from "@web/pages/Registration";
import { WardMembers } from "@web/pages/WardMembers";

/**
 * `key` per route: without it React keeps ONE ProtectedRoute instance
 * across route changes, which keeps serving the previous route's fetched
 * user and bounces users back to /registration after they complete it.
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/phone" element={<PhoneLogin />} />
        <Route path="/register/official" element={<OfficialRegister />} />
        <Route
          path="/admin/officials"
          element={
            <ProtectedRoute key="admin-officials" requireLocation={false}>
              <AdminOfficials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registration"
          element={
            <ProtectedRoute key="registration" requireLocation={false}>
              <Registration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute key="home">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telangana"
          element={
            <ProtectedRoute key="telangana">
              <TelanganaAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telangana/issues"
          element={
            <ProtectedRoute key="telangana-issues">
              <VillageIssues />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ward-members"
          element={
            <ProtectedRoute key="ward-members">
              <WardMembers />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
