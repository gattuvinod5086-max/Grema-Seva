import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
import { AppSessionProvider } from "@/react-app/context/AppSessionContext";
import Login from "@/react-app/pages/Login";
import AuthCallback from "@/react-app/pages/AuthCallback";
import CitizenDashboard from "@/react-app/pages/CitizenDashboard";
import TelanganaAdmin from "@/react-app/pages/TelanganaAdmin";
import VillageIssues from "@/react-app/pages/VillageIssues";
import Registration from "@/react-app/pages/Registration";
import { WardMembers } from "@/react-app/pages/WardMembers";
import GramaSevaTerminal from "@/react-app/pages/GramaSevaTerminal";

import NewsIndexPage from "@/react-app/pages/news/NewsIndexPage";
import NewsDetailPage from "@/react-app/pages/news/NewsDetailPage";
import NewsCreatePage from "@/react-app/pages/news/NewsCreatePage";
import NewsManagePage from "@/react-app/pages/news/NewsManagePage";
import NewsLivePage from "@/react-app/pages/news/NewsLivePage";
import EmergencyHomePage from "@/react-app/pages/emergency/EmergencyHomePage";
import EmergencyManagePage from "@/react-app/pages/emergency/EmergencyManagePage";

export default function App() {
  // Local dev (npm run dev): no Cloudflare worker/API. Send users to /app terminal
  // which works offline; keep /login available for officials flow.
  if (__GRAMA_LOCAL_DEV__) {
    return (
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signin" element={<Login />} />
            <Route path="/signup" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/app"
              element={
                <AppSessionProvider>
                  <GramaSevaTerminal />
                </AppSessionProvider>
              }
            />
            <Route path="/news" element={<NewsIndexPage />} />
            <Route path="/news/live" element={<NewsLivePage />} />
            <Route path="/news/create" element={<NewsCreatePage />} />
            <Route path="/news/manage" element={<NewsManagePage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/emergency" element={<EmergencyHomePage />} />
            <Route path="/emergency/manage" element={<EmergencyManagePage />} />
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    );
  }

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
          <Route
            path="/app"
            element={
              <AppSessionProvider>
                <GramaSevaTerminal />
              </AppSessionProvider>
            }
          />
          <Route path="/news" element={<NewsIndexPage />} />
          <Route path="/news/live" element={<NewsLivePage />} />
          <Route
            path="/news/create"
            element={
              <ProtectedRoute requireLocation={false}>
                <NewsCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news/manage"
            element={
              <ProtectedRoute requireLocation={false}>
                <NewsManagePage />
              </ProtectedRoute>
            }
          />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/emergency" element={<EmergencyHomePage />} />
          <Route
            path="/emergency/manage"
            element={
              <ProtectedRoute requireLocation={false}>
                <EmergencyManagePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
