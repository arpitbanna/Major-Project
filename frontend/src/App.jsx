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
import SmpList from './pages/SmpList';
import CreateHazard from './pages/CreateHazard';
import HazardDetail from './pages/HazardDetail';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
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
                  <SmpList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/smp/new"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor']}>
                  <CreateHazard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/smp/:id"
              element={
                <ProtectedRoute>
                  <HazardDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Mine Manager', 'Shift In-charge']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminUsers />
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
