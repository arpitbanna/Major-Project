import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, ShieldAlert, LogOut, User, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onToggleSidebar }) {
  const { user, profile, role, logout } = useAuth();

  const getRoleBadgeStyle = (userRole) => {
    switch (userRole) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Mine Manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shift In-charge':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Supervisor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-borderLight px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slateText-secondary hover:text-slateText hover:bg-background rounded"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-sm">
            CM
          </div>
          <div>
            <h1 className="text-base font-semibold text-slateText leading-tight">
              Coal Mine Management
            </h1>
            <p className="text-xs text-slateText-secondary">
              Productivity & Safety System
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slateText leading-tight">
                {profile?.full_name || user.email?.split('@')[0]}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getRoleBadgeStyle(role)}`}>
                  {role || 'Staff'}
                </span>
                {profile?.mine_section && (
                  <span className="text-[10px] text-slateText-muted">
                    • {profile.mine_section}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1 text-xs text-slateText-secondary hover:text-status-danger px-2.5 py-1.5 rounded border border-borderLight hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover px-3 py-1.5 rounded transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
