import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ShieldAlert, FileBarChart, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Shift Handover', path: '/handover', icon: FileText },
  { name: 'Safety Management', path: '/smp', icon: ShieldAlert },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, profile, role } = useAuth();

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
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-borderLight flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-borderLight md:hidden">
          <span className="text-sm font-semibold text-slateText">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slateText-secondary hover:text-slateText rounded hover:bg-background"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section title */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-slateText-muted uppercase tracking-wider">
            Navigation
          </p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary border-l-2 border-primary'
                      : 'text-slateText-secondary hover:text-slateText hover:bg-background'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & User section */}
        <div className="p-4 border-t border-borderLight text-xs text-slateText-secondary space-y-2">
          {user ? (
            <div className="bg-slate-50 border border-borderLight p-2.5 rounded">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-medium text-slateText truncate text-[11px]">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-[10px] text-slateText-muted truncate">
                    {role} • {profile?.mine_section || 'General'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-medium text-slateText">CMPDI Problem Statement</p>
              <p className="text-[11px] text-slateText-muted mt-0.5">Coal Mine Safety System v1.0</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
