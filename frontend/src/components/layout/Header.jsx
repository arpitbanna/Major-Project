import React from 'react';
import { Menu, ShieldAlert } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
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

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slateText-secondary bg-background px-3 py-1.5 rounded border border-borderLight">
          <span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>
          <span>System Active</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slateText font-medium bg-slate-50 border border-borderLight px-3 py-1.5 rounded">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <span>Semester 3 Project</span>
        </div>
      </div>
    </header>
  );
}
