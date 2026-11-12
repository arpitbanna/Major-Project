import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

function SetupOverview() {
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', message: 'Checking backend status...' });

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

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slateText">Project Initialization (Phase 2)</h2>
        <p className="text-sm text-slateText-secondary mt-1">
          Coal Mine Productivity & Safety Management System — Semester 3 Major Project
        </p>
      </div>

      <div className="bg-white border border-borderLight rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-borderLight pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-slateText">System Components Status</h3>
          </div>
          <button
            onClick={checkHealth}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium px-2.5 py-1 rounded border border-borderLight hover:bg-primary-light"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recheck</span>
          </button>
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
              <span className="text-sm font-medium text-slateText">Backend Service</span>
            </div>
            <p className="text-xs text-slateText-secondary">
              {backendHealth.message}
            </p>
            {backendHealth.details && (
              <p className="text-[11px] text-slateText-muted mt-1 font-mono">
                {typeof backendHealth.details === 'object'
                  ? `Environment: ${backendHealth.details.environment || 'development'}`
                  : backendHealth.details}
              </p>
            )}
          </div>
        </div>

        {/* Setup Checklist */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slateText uppercase tracking-wider mb-2">
            Phase 2 Scope Completed
          </h4>
          <ul className="text-xs text-slateText-secondary space-y-1.5 list-disc list-inside">
            <li>Frontend initialized with React, Vite, and Tailwind CSS.</li>
            <li>Backend initialized with Express.js and Supabase client configuration.</li>
            <li>REST API health endpoint configured at <code className="bg-slate-100 px-1 py-0.5 rounded text-slateText">/api/health</code>.</li>
            <li>Minimal responsive industrial application shell created.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<SetupOverview />} />
          <Route
            path="/handover"
            element={
              <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary">
                <h3 className="text-base font-semibold text-slateText mb-2">Digital Shift Handover Module</h3>
                <p>This module will be implemented in Phase 5 according to the development roadmap.</p>
              </div>
            }
          />
          <Route
            path="/smp"
            element={
              <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary">
                <h3 className="text-base font-semibold text-slateText mb-2">Safety Management Plan Module</h3>
                <p>This module will be implemented in Phase 6 according to the development roadmap.</p>
              </div>
            }
          />
          <Route
            path="/reports"
            element={
              <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary">
                <h3 className="text-base font-semibold text-slateText mb-2">Reports & Audit Module</h3>
                <p>This module will be implemented alongside handover and SMP reporting phases.</p>
              </div>
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
