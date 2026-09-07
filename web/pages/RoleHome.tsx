import { Navigate } from 'react-router';
import ProtectedRoute from '@web/components/ProtectedRoute';
import CitizenDashboard from '@web/pages/CitizenDashboard';
import { useApi } from '@web/hooks/useApi';
import type { User } from '@shared/types';

function HomeByRole() {
  const { data, error } = useApi<{ user: User }>('/api/users/me');
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

