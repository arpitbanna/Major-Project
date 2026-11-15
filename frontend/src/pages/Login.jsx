import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle, isConfigured, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Target path to redirect after successful login
  const from = location.state?.from?.pathname || '/';

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Check if redirected with an OAuth error
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const errorDesc = params.get('error_description') || hashParams.get('error_description');
    const errorMsg = params.get('error') || hashParams.get('error');

    if (errorDesc || errorMsg) {
      setErrorMessage(`Google Sign-In failed: ${decodeURIComponent(errorDesc || errorMsg)}`);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env'
      );
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');

    if (!isConfigured) {
      setErrorMessage(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env'
      );
      return;
    }

    setGoogleSubmitting(true);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback`;
      await loginWithGoogle(callbackUrl);
    } catch (err) {
      setErrorMessage(err.message || 'Google authentication could not be initiated.');
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-borderLight rounded p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 mx-auto rounded bg-primary text-white flex items-center justify-center font-bold text-base mb-2">
            CM
          </div>
          <h2 className="text-xl font-bold text-slateText">Sign in to Coal Mine System</h2>
          <p className="text-xs text-slateText-secondary">
            Ministry of Coal / CMPDI — Shift & Safety Management
          </p>
        </div>

        {/* Configuration notice if Supabase credentials are missing */}
        {!isConfigured && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Supabase Configuration Required</p>
              <p className="mt-0.5 text-amber-700">
                To enable live authentication, update <code className="font-mono bg-amber-100 px-1 rounded">frontend/.env</code> and <code className="font-mono bg-amber-100 px-1 rounded">backend/.env</code> with your project URL and API keys.
              </p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-status-danger flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slateText mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. manager@mine.gov.in"
              className="w-full px-3 py-2 border border-borderLight rounded text-sm text-slateText placeholder-slateText-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slateText mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-borderLight rounded text-sm text-slateText placeholder-slateText-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slateText-secondary hover:text-slateText"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Subtle OR Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-borderLight"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2.5 text-slateText-muted uppercase tracking-wider text-[10px] font-semibold">
              OR
            </span>
          </div>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting || googleSubmitting || !isConfigured}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slateText border border-borderLight hover:border-slate-300 py-2 px-4 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Continue with Google"
        >
          {googleSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to Google...</span>
            </span>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.07.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.39 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Demo Viva Accounts Quick Autofill (DEMO ONLY) */}
        <div className="border-t border-borderLight pt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slateText">Quick Demo Fill</span>
            <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">
              DEMO ONLY
            </span>
          </div>
          <p className="text-[11px] text-slateText-secondary leading-snug">
            Select a role to populate standard test credentials for examination demonstration:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@colliery.in');
                setPassword('CoalSafe@2026');
                setErrorMessage('');
              }}
              className="p-2 border border-borderLight hover:border-purple-300 rounded text-left hover:bg-purple-50 transition-colors"
            >
              <span className="font-semibold text-purple-700 block text-[11px]">Admin</span>
              <span className="text-[10px] text-slateText-muted block truncate">admin@colliery.in</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('manager@colliery.in');
                setPassword('CoalSafe@2026');
                setErrorMessage('');
              }}
              className="p-2 border border-borderLight hover:border-blue-300 rounded text-left hover:bg-blue-50 transition-colors"
            >
              <span className="font-semibold text-primary block text-[11px]">Mine Manager</span>
              <span className="text-[10px] text-slateText-muted block truncate">manager@colliery.in</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('incharge@colliery.in');
                setPassword('CoalSafe@2026');
                setErrorMessage('');
              }}
              className="p-2 border border-borderLight hover:border-emerald-300 rounded text-left hover:bg-emerald-50 transition-colors"
            >
              <span className="font-semibold text-status-success block text-[11px]">Shift In-charge</span>
              <span className="text-[10px] text-slateText-muted block truncate">incharge@colliery.in</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('supervisor@colliery.in');
                setPassword('CoalSafe@2026');
                setErrorMessage('');
              }}
              className="p-2 border border-borderLight hover:border-slate-300 rounded text-left hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-slateText block text-[11px]">Supervisor</span>
              <span className="text-[10px] text-slateText-muted block truncate">supervisor@colliery.in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
