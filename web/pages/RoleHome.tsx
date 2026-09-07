import { Navigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@web/components/ProtectedRoute';
import CitizenDashboard from '@web/pages/CitizenDashboard';
import { useApi } from '@web/hooks/useApi';
import type { User } from '@shared/types';

function HomeByRole() {
  // IMPORTANT: wait for isLoading — data is null on first render, and
  // treating that as "not logged in" bounces every user back to /login.
  const { data, error, isLoading } = useApi<{ user: User }>('/api/users/me');
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#67001A]" />
      </div>
    );
  }
  if (error || !data) return <Navigate to="/login" replace />;
  // The super admin's home is the approvals console; everyone else gets
  // the issue dashboard.
  return data.user.role === 'super_admin' ? (
    <Navigate to="/admin/officials" replace />
  ) : (
    <CitizenDashboard />
  );
}

/** "/" is a role router: each role lands where it can actually work. */
export default function RoleHome() {
  return (
    <ProtectedRoute key="home">
      <HomeByRole />
    </ProtectedRoute>
  );
}

