import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await exchangeCodeForSessionToken();
        // Success - navigate to home or registration
        navigate('/');
      } catch (error) {
        console.error('Authentication failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Authentication failed: ${errorMessage}`);
        setIsLoading(false);
        // Don't navigate immediately - show error first
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-red-800 font-semibold mb-2">Possible causes:</p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>API key not configured in .dev.vars</li>
                <li>Invalid or expired authorization code</li>
                <li>Network connection issue</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-700 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </button>
              <p className="text-xs text-gray-500">Redirecting automatically in 5 seconds...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin mb-4 inline-block">
          <Loader2 className="w-12 h-12 text-green-600" />
        </div>
        <p className="text-xl font-semibold text-gray-900">Signing you in...</p>
        <p className="text-sm text-gray-600 mt-2">Please wait</p>
      </div>
    </div>
  );
}
