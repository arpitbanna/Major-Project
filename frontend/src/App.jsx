import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  User,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

function SetupOverview() {
  const { user, profile, role, session, isConfigured } = useAuth();
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', message: 'Checking backend status...' });
  const [roleTestResult, setRoleTestResult] = useState(null);
  const [testingRole, setTestingRole] = useState(false);

  const checkHealth = async () => {
    setBackendHealth({ status: 'checking', message: 'Connecting to backend...' });
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBackendHealth({
        status: 'online',
        message: data.message || 'Backend operational',
        details: data
      });
    } catch (err) {
      setBackendHealth({
        status: 'error',
        message: 'Could not connect to backend API (/api/health)',
        details: err.message
      });
    }
  };

  const testManagerAccess = async () => {
    setTestingRole(true);
    setRoleTestResult(null);
    try {
      const token = session?.access_token;
      const response = await fetch('/api/auth/test-manager', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      setRoleTestResult({
        statusCode: response.status,
        data
      });
    } catch (err) {
      setRoleTestResult({
        statusCode: 500,
        data: { message: err.message }
      });
    } finally {
      setTestingRole(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slateText">System Status & Access Control</h2>
          <p className="text-xs text-slateText-secondary mt-0.5">
            Phase 3: Authentication & Role-Based Authorization
          </p>
        </div>

        <button
          onClick={checkHealth}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium px-2.5 py-1.5 rounded border border-borderLight hover:bg-primary-light transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Auth Status Banner */}
      <div className="bg-white border border-borderLight rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-borderLight pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-slateText">Authentication State</h3>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded font-medium border ${
            user
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {user ? 'Authenticated Session' : 'Unauthenticated / Guest'}
          </span>
        </div>

        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-borderLight rounded">
              <span className="text-slateText-muted block text-[11px]">Logged in as</span>
              <span className="font-semibold text-slateText truncate block mt-0.5">
                {profile?.full_name || user.email}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-borderLight rounded">
              <span className="text-slateText-muted block text-[11px]">Assigned Role</span>
              <span className="font-semibold text-primary block mt-0.5">
                {role || 'Supervisor'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-borderLight rounded">
              <span className="text-slateText-muted block text-[11px]">Designation</span>
              <span className="font-medium text-slateText block mt-0.5">
                {profile?.designation || 'Mining Sirdar'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-borderLight rounded">
              <span className="text-slateText-muted block text-[11px]">Mine Section</span>
              <span className="font-medium text-slateText block mt-0.5">
                {profile?.mine_section || 'Section A'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-borderLight rounded">
            <div className="text-xs text-slateText-secondary">
              <p className="font-medium text-slateText">No active user session</p>
              <p className="mt-0.5">Sign in to test role-based access for Shift Handover, SMP, and Auditing.</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Go to Login</span>
            </Link>
          </div>
        )}

        {/* Backend Role Enforcement Test */}
        <div className="pt-2 border-t border-borderLight">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-semibold text-slateText">Backend Role Verification Test</h4>
              <p className="text-[11px] text-slateText-secondary mt-0.5">
                Tests server endpoint <code className="bg-slate-100 px-1 py-0.5 rounded text-slateText">/api/auth/test-manager</code> requiring 'Mine Manager' or 'Admin' role.
              </p>
            </div>
            <button
              onClick={testManagerAccess}
              disabled={testingRole}
              className="self-start sm:self-auto text-xs font-medium px-3 py-1.5 rounded border border-borderLight hover:bg-background text-slateText disabled:opacity-50"
            >
              {testingRole ? 'Testing...' : 'Test Manager Permission'}
            </button>
          </div>

          {roleTestResult && (
            <div className={`mt-3 p-3 rounded border text-xs ${
              roleTestResult.statusCode === 200
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : roleTestResult.statusCode === 403
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-status-danger'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                <span>Response HTTP {roleTestResult.statusCode}</span>
                <span>•</span>
                <span>{roleTestResult.statusCode === 200 ? 'Access Granted' : 'Access Denied'}</span>
              </div>
              <p className="mt-1 text-[11px] font-mono">
                {roleTestResult.data.message || JSON.stringify(roleTestResult.data)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Services Health */}
      <div className="bg-white border border-borderLight rounded p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-borderLight pb-3">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-slateText">Services Health & Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frontend Card */}
          <div className="p-4 rounded border border-borderLight bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm font-medium text-slateText">Frontend Application</span>
            </div>
            <p className="text-xs text-slateText-secondary">
              React + Vite + Tailwind CSS shell running properly.
            </p>
          </div>

          {/* Backend Card */}
          <div className="p-4 rounded border border-borderLight bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              {backendHealth.status === 'online' ? (
                <CheckCircle2 className="w-4 h-4 text-status-success" />
              ) : backendHealth.status === 'checking' ? (
                <RefreshCw className="w-4 h-4 text-status-warning animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4 text-status-danger" />
              )}
              <span className="text-sm font-medium text-slateText">Backend Express Service</span>
            </div>
            <p className="text-xs text-slateText-secondary">
              {backendHealth.message}
            </p>
          </div>
        </div>

        {/* Phase 3 Checklist */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slateText uppercase tracking-wider mb-2">
            Phase 3 Implementation Completed
          </h4>
          <ul className="text-xs text-slateText-secondary space-y-1.5 list-disc list-inside">
            <li>Supabase Auth client configured with persistence and token refreshing.</li>
            <li>Backend JWT verification middleware (<code className="bg-slate-100 px-1 py-0.5 rounded text-slateText">requireAuth</code>) via official Supabase client.</li>
            <li>Role authorization middleware (<code className="bg-slate-100 px-1 py-0.5 rounded text-slateText">requireRole</code>) checking trusted database profiles.</li>
            <li>Protected frontend route wrapper (<code className="bg-slate-100 px-1 py-0.5 rounded text-slateText">ProtectedRoute</code>) redirecting unauthenticated users.</li>
            <li>Responsive Login UI with password visibility toggle, validation, and error states.</li>
            <li>SQL schema script ready in <code className="bg-slate-100 px-1 py-0.5 rounded text-slateText">backend/src/db/schema.sql</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<SetupOverview />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/handover"
              element={
                <ProtectedRoute>
                  <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary">
                    <h3 className="text-base font-semibold text-slateText mb-2">Digital Shift Handover Module</h3>
                    <p>Protected route accessible to authenticated mining personnel. Scheduled for Phase 5.</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/smp"
              element={
                <ProtectedRoute>
                  <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary">
                    <h3 className="text-base font-semibold text-slateText mb-2">Safety Management Plan Module</h3>
                    <p>Protected route accessible to authenticated mining personnel. Scheduled for Phase 6.</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Mine Manager', 'Shift In-charge']}>
                  <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary">
                    <h3 className="text-base font-semibold text-slateText mb-2">Reports & Audit Module</h3>
                    <p>Protected route restricted to Admin, Mine Manager, and Shift In-charge roles.</p>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
