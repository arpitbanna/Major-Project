import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../utils/usePageTitle';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function AuthCallback() {
  usePageTitle('Authenticating');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Check for URL error query or hash parameters from OAuth redirect
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
    const errorMsg = searchParams.get('error') || hashParams.get('error');

    if (errorDesc || errorMsg) {
      setError(decodeURIComponent(errorDesc || errorMsg));
      return;
    }

    // 2. If user already established in context, redirect to Dashboard
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    // 3. Complete authentication session check
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
        if (sessionError) {
          setError(sessionError.message);
        } else if (session) {
          navigate('/', { replace: true });
        } else {
          // Timeout fallback
          const timer = setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
          return () => clearTimeout(timer);
        }
      });
    }
  }, [location, user, navigate]);

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-red-200 rounded p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-status-danger rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slateText">Authentication Failed</h3>
          <p className="text-xs text-status-danger">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slateText">Completing secure authentication...</p>
        <p className="text-xs text-slateText-secondary">Verifying Google identity with CoalSafe</p>
      </div>
    </div>
  );
}
