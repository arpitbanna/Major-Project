import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading, isConfigured } = useAuth();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slateText-secondary">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to login with return path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check if allowedRoles are specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="bg-white border border-borderLight rounded p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-status-danger rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slateText">Access Restricted</h3>
          <p className="text-xs text-slateText-secondary mt-1">
            Your current role (<span className="font-semibold text-slateText">{role || 'Unassigned'}</span>) does not have permission to view this section.
          </p>
          <p className="text-[11px] text-slateText-muted mt-2">
            Required role(s): {allowedRoles.join(', ')}
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slateText hover:text-primary px-3 py-1.5 border border-borderLight rounded hover:bg-background transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
