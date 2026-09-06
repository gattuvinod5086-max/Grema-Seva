import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import ProtectedRoute from "@web/components/ProtectedRoute";
import Login from "@web/pages/Login";
import AuthCallback from "@web/pages/AuthCallback";
import CitizenDashboard from "@web/pages/CitizenDashboard";
import TelanganaAdmin from "@web/pages/TelanganaAdmin";
import VillageIssues from "@web/pages/VillageIssues";
import Registration from "@web/pages/Registration";
import { WardMembers } from "@web/pages/WardMembers";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
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
    </AuthProvider>
  );
}
