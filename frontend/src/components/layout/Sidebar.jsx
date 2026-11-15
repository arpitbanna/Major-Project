import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  FileBarChart,
  Users,
  X,
  User,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CoalSafeLogo from '../common/CoalSafeLogo';

export default function Sidebar({ isOpen, onClose }) {
  const { user, profile, role } = useAuth();

  // Navigation configuration with explicit role permissions
  const operationalNav = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      allowedRoles: null // public to all
    },
    {
      name: 'Shift Handover',
      path: '/handover',
      icon: FileText,
      allowedRoles: ['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor']
    },
    {
      name: 'Safety Management',
      path: '/smp',
      icon: ShieldAlert,
      allowedRoles: ['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor']
    },
  ];

  const managementNav = [
    {
      name: 'Reports & Audits',
      path: '/reports',
      icon: FileBarChart,
      allowedRoles: ['Admin', 'Mine Manager', 'Shift In-charge']
    },
  ];

  const adminNav = [
    {
      name: 'User Management',
      path: '/admin/users',
      icon: Users,
      allowedRoles: ['Admin']
    },
  ];

  // Role filter helper
  const isItemVisible = (item) => {
    if (!item.allowedRoles) return true;
    if (!user) return false;
    return item.allowedRoles.includes(role);
  };

  const renderNavLinks = (items) => {
    const visibleItems = items.filter(isItemVisible);
    if (visibleItems.length === 0) return null;

    return (
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                    : 'text-slateText-secondary hover:text-slateText hover:bg-background'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-borderLight flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile brand & close button */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-borderLight md:hidden">
            <div className="flex items-center gap-2">
              <CoalSafeLogo size={28} />
              <span className="text-sm font-bold text-slateText">
                Coal<span className="text-primary">Safe</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slateText-secondary hover:text-slateText rounded hover:bg-background"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: Operational */}
          <div className="px-3 py-4 space-y-4">
            <div>
              <p className="px-3 text-[11px] font-semibold text-slateText-muted uppercase tracking-wider mb-2">
                Operations
              </p>
              {renderNavLinks(operationalNav)}
            </div>

            {/* Section: Management (Manager / Admin / In-charge) */}
            {user && (role === 'Mine Manager' || role === 'Admin' || role === 'Shift In-charge') && (
              <div>
                <p className="px-3 text-[11px] font-semibold text-slateText-muted uppercase tracking-wider mb-2">
                  Management
                </p>
                {renderNavLinks(managementNav)}
              </div>
            )}

            {/* Section: System Administration (Admin only) */}
            {user && role === 'Admin' && (
              <div>
                <p className="px-3 text-[11px] font-semibold text-slateText-muted uppercase tracking-wider mb-2">
                  Administration
                </p>
                {renderNavLinks(adminNav)}
              </div>
            )}
          </div>
        </div>

        {/* Footer info & User section */}
        <div className="p-4 border-t border-borderLight text-xs text-slateText-secondary space-y-2">
          {user ? (
            <div className="bg-slate-50 border border-borderLight p-2.5 rounded">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-slateText truncate text-[11px]">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-[10px] text-slateText-muted truncate">
                    {role || 'Staff'} • {profile?.mine_section || 'Sec-A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <NavLink
              to="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full bg-slate-50 hover:bg-slate-100 border border-borderLight text-slateText p-2 rounded text-xs font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in to System</span>
            </NavLink>
          )}

          <div className="pt-1 text-[11px] text-slateText-muted flex items-center justify-between">
            <span>CoalSafe v1.0 • CMPDI</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-status-success font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
              Live
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
