import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'New Shift Handover',
      subtitle: 'Create outgoing shift log entry',
      path: '/handover/new',
      icon: PlusCircle,
      iconColor: 'text-primary',
      iconBg: 'bg-blue-50',
      badge: 'Available',
      badgeStyle: 'bg-emerald-50 text-status-success border-emerald-200',
    },
    {
      title: 'View Shift Logs',
      subtitle: 'Review & acknowledge handovers',
      path: '/handover',
      icon: FileText,
      iconColor: 'text-slateText',
      iconBg: 'bg-slate-100',
      badge: 'Logbook',
      badgeStyle: 'bg-slate-100 text-slateText-secondary border-borderLight',
    },
    {
      title: 'Report Safety Hazard',
      subtitle: 'Log on-site risks & control measures',
      path: '/smp',
      icon: AlertTriangle,
      iconColor: 'text-status-warning',
      iconBg: 'bg-amber-50',
      badge: 'Phase 6 Form',
      badgeStyle: 'bg-amber-50 text-status-warning border-amber-200',
    },
    {
      title: 'Safety Management Plan',
      subtitle: 'Track hazard register & actions',
      path: '/smp',
      icon: ShieldCheck,
      iconColor: 'text-status-success',
      iconBg: 'bg-emerald-50',
      badge: 'Protected',
      badgeStyle: 'bg-emerald-50 text-status-success border-emerald-200',
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
        Operational Shortcuts
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act, index) => {
          const Icon = act.icon;
          return (
            <Link
              key={index}
              to={act.path}
              className="group bg-white border border-borderLight rounded p-4 flex flex-col justify-between hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded ${act.iconBg} ${act.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${act.badgeStyle}`}>
                  {act.badge}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm font-semibold text-slateText group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{act.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </p>
                <p className="text-[11px] text-slateText-secondary mt-0.5">
                  {act.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
