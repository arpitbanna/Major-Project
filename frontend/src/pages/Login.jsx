import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isConfigured, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Target path to redirect after successful login
  const from = location.state?.from?.pathname || '/';

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

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

        {/* Roles information helper */}
        <div className="border-t border-borderLight pt-4 text-xs text-slateText-secondary space-y-1.5">
          <p className="font-semibold text-slateText">Supported Roles:</p>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <div>• Mine Manager</div>
            <div>• Shift In-charge</div>
            <div>• Supervisor</div>
            <div>• Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
}
