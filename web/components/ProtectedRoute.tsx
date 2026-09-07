import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { useApi, ApiError } from '@web/hooks/useApi';
import type { User } from '@shared/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireLocation?: boolean;
}

/**
 * Gate for authenticated routes. Resolves the session server-side;
 * unauthenticated users go to /login, citizens without a completed
 * profile go to /registration.
 *
 * Transient failures (network blips, API restarts) do NOT bounce the
 * user to /login — that used to wipe in-progress flows like
 * registration. Only a definitive 401 ends the session here; anything
 * else shows a retry screen.
 */
export default function ProtectedRoute({ children, requireLocation = true }: ProtectedRouteProps) {
  const location = useLocation();
  const { data, isLoading, error, refetch } = useApi<{ user: User }>('/api/users/me');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="w-12 h-12 text-green-600" />
        </div>
      </div>
    );
  }

  const isAuthError = error instanceof ApiError && error.status === 401;

  if (isAuthError) {
    return <Navigate to="/login" replace />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <WifiOff className="w-10 h-10 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-800">Connection problem</p>
          <p className="text-sm text-slate-500 mt-1">
            We couldn&apos;t reach the server. Your progress is safe — try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#67001A] text-white font-semibold hover:opacity-95"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  const user = data.user;

  // Only citizens need a completed location profile. Super admins and
  // officials (even pending ones) must pass through to their own views.
  if (requireLocation && user.needsRegistration && location.pathname !== '/registration') {
    return <Navigate to="/registration" replace />;
  }

  if (!requireLocation && user.needsRegistration === false && user.role === 'citizen' && user.village && location.pathname === '/registration') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
