import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useApi } from '@web/hooks/useApi';
import type { User } from '@shared/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireLocation?: boolean;
}

/**
 * Gate for authenticated routes. Resolves the session server-side;
 * unauthenticated users go to /login, citizens without a completed
 * profile go to /registration.
 */
export default function ProtectedRoute({ children, requireLocation = true }: ProtectedRouteProps) {
  const location = useLocation();
  const { data, isLoading, error } = useApi<{ user: User }>('/api/users/me');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="w-12 h-12 text-green-600" />
        </div>
      </div>
    );
  }

  const user = data?.user ?? null;

  if (error || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireLocation && (user.needsRegistration || !user.village) && location.pathname !== '/registration') {
    return <Navigate to="/registration" replace />;
  }

  if (!requireLocation && !user.needsRegistration && user.village && location.pathname === '/registration') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
