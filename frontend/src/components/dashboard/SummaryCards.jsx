import React from 'react';
import { FileText, Clock, ShieldAlert, CheckSquare, RefreshCw } from 'lucide-react';

export default function SummaryCards({ data, loading, tablesInitialized, onRefresh }) {
  const cards = [
    {
      title: "Today's Shift Handovers",
      count: data.todayHandovers ?? 0,
      description: "Shift handovers logged today",
      icon: FileText,
      iconColor: 'text-primary',
      iconBg: 'bg-blue-50',
      badge: data.todayHandovers === 0 ? 'No logs yet' : `${data.todayHandovers} logged`,
      badgeStyle: 'bg-slate-100 text-slateText-secondary',
    },
    {
      title: 'Pending Acknowledgements',
      count: data.pendingAcknowledgements ?? 0,
      description: 'Awaiting incoming shift sign-off',
      icon: Clock,
      iconColor: data.pendingAcknowledgements > 0 ? 'text-status-warning' : 'text-slateText-muted',
      iconBg: data.pendingAcknowledgements > 0 ? 'bg-amber-50' : 'bg-slate-50',
      badge: data.pendingAcknowledgements === 0 ? 'All signed off' : 'Action needed',
      badgeStyle: data.pendingAcknowledgements > 0 ? 'bg-amber-50 text-status-warning font-medium' : 'bg-slate-100 text-slateText-secondary',
    },
    {
      title: 'Open Hazards',
      count: data.openHazards ?? 0,
      description: 'Active reported workplace hazards',
      icon: ShieldAlert,
      iconColor: data.openHazards > 0 ? 'text-status-danger' : 'text-slateText-muted',
      iconBg: data.openHazards > 0 ? 'bg-red-50' : 'bg-slate-50',
      badge: data.openHazards === 0 ? 'Zero active hazards' : 'Attention required',
      badgeStyle: data.openHazards > 0 ? 'bg-red-50 text-status-danger font-medium' : 'bg-emerald-50 text-status-success font-medium',
    },
    {
      title: 'Pending Safety Actions',
      count: data.pendingSafetyActions ?? 0,
      description: 'Mitigation actions in progress',
      icon: CheckSquare,
      iconColor: data.pendingSafetyActions > 0 ? 'text-primary' : 'text-slateText-muted',
      iconBg: data.pendingSafetyActions > 0 ? 'bg-blue-50' : 'bg-slate-50',
      badge: data.pendingSafetyActions === 0 ? 'No pending tasks' : 'In progress',
      badgeStyle: 'bg-slate-100 text-slateText-secondary',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
          Operational Summary
        </h2>
        <div className="flex items-center gap-2">
          {!tablesInitialized && (
            <span className="text-[10px] bg-slate-100 text-slateText-secondary border border-borderLight px-2 py-0.5 rounded">
              Awaiting Phase 5 & 6 operational tables
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh statistics"
            className="text-slateText-secondary hover:text-slateText p-1 rounded hover:bg-white border border-transparent hover:border-borderLight transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white border border-borderLight rounded p-4 flex flex-col justify-between transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slateText-secondary">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-slateText">
                    {loading ? '—' : card.count}
                  </p>
                </div>
                <div className={`p-2.5 rounded ${card.iconBg} ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-borderLight flex items-center justify-between text-[11px]">
                <span className="text-slateText-muted truncate mr-2">
                  {card.description}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${card.badgeStyle}`}>
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
