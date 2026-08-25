import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2 } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import type { User } from '@/shared/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireLocation?: boolean;
}

export default function ProtectedRoute({ children, requireLocation = true }: ProtectedRouteProps) {
  const { user: authUser, isPending: authPending } = useAuth();
  const location = useLocation();
  const { data: user, isLoading: userLoading } = useApi<User>('/api/users/me', {
    enabled: !!authUser,
  });

  if (authPending || (authUser && userLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="w-12 h-12 text-green-600" />
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs to complete registration
  if (requireLocation && user && !user.village && location.pathname !== '/registration') {
    return <Navigate to="/registration" replace />;
  }

  // Redirect to home if trying to access registration but already registered
  if (!requireLocation && user && user.village && location.pathname === '/registration') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
