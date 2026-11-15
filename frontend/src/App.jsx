import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import HandoverList from './pages/HandoverList';
import CreateHandover from './pages/CreateHandover';
import HandoverDetail from './pages/HandoverDetail';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/handover"
              element={
                <ProtectedRoute>
                  <HandoverList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/handover/new"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor']}>
                  <CreateHandover />
                </ProtectedRoute>
              }
            />
            <Route
              path="/handover/:id"
              element={
                <ProtectedRoute>
                  <HandoverDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/smp"
              element={
                <ProtectedRoute>
                  <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary space-y-2">
                    <h2 className="text-base font-semibold text-slateText">Safety Management Plan Module</h2>
                    <p>Protected area for hazard identification and risk control tracking. Scheduled for Phase 6.</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Mine Manager', 'Shift In-charge']}>
                  <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary space-y-2">
                    <h2 className="text-base font-semibold text-slateText">Reports & Audit Center</h2>
                    <p>Protected reporting and PDF generation center restricted to supervisory and management roles.</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <div className="bg-white border border-borderLight rounded p-6 text-sm text-slateText-secondary space-y-2">
                    <h2 className="text-base font-semibold text-slateText">User Management</h2>
                    <p>Administrator console for managing mine personnel, designations, and role assignments.</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
