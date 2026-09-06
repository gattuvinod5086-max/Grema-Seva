import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import ProtectedRoute from "@web/components/ProtectedRoute";
import Login from "@web/pages/Login";
import PhoneLogin from "@web/pages/PhoneLogin";
import CitizenDashboard from "@web/pages/CitizenDashboard";
import TelanganaAdmin from "@web/pages/TelanganaAdmin";
import VillageIssues from "@web/pages/VillageIssues";
import Registration from "@web/pages/Registration";
import { WardMembers } from "@web/pages/WardMembers";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/phone" element={<PhoneLogin />} />
        <Route
          path="/registration"
          element={
            <ProtectedRoute requireLocation={false}>
              <Registration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telangana"
          element={
            <ProtectedRoute>
              <TelanganaAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telangana/issues"
          element={
            <ProtectedRoute>
              <VillageIssues />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ward-members"
          element={
            <ProtectedRoute>
              <WardMembers />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
