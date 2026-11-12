import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldAlert, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function RecentActivity({ recentData, loading }) {
  const handovers = recentData?.handovers || [];
  const hazards = recentData?.hazards || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Acknowledged':
        return 'bg-emerald-50 text-status-success border-emerald-200';
      case 'Submitted':
        return 'bg-amber-50 text-status-warning border-amber-200';
      case 'Open':
        return 'bg-red-50 text-status-danger border-red-200';
      case 'Closed':
        return 'bg-slate-100 text-slateText-secondary border-borderLight';
      default:
        return 'bg-slate-100 text-slateText-secondary border-borderLight';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Recent Shift Handovers Panel */}
      <div className="bg-white border border-borderLight rounded p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-borderLight pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-slateText">
                Recent Shift Handover Logs
              </h2>
            </div>
            <Link
              to="/handover"
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slateText-muted">
              Loading recent shift handovers...
            </div>
          ) : handovers.length > 0 ? (
            <div className="divide-y divide-borderLight">
              {handovers.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slateText">
                      {item.shift_type || 'Shift'} • {item.shift_date}
                    </p>
                    <p className="text-[11px] text-slateText-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString() : 'Pending'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <div className="w-9 h-9 bg-slate-50 text-slateText-muted rounded-full flex items-center justify-center mx-auto border border-borderLight">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slateText">
                No shift handovers logged yet
              </p>
              <p className="text-[11px] text-slateText-secondary max-w-xs mx-auto">
                Shift records created and acknowledged during daily operations will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-borderLight mt-4 flex items-center justify-between text-[11px] text-slateText-muted">
          <span>Logbook requirement: DGMS / CMPDI Shift handover</span>
          <Link to="/handover" className="text-primary hover:underline font-medium">
            Go to Handovers
          </Link>
        </div>
      </div>

      {/* 2. Recent Hazards & SMP Activity Panel */}
      <div className="bg-white border border-borderLight rounded p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-borderLight pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-status-warning" />
              <h2 className="text-sm font-semibold text-slateText">
                Recent Safety & Hazard Activity
              </h2>
            </div>
            <Link
              to="/smp"
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
            >
              <span>View SMP</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slateText-muted">
              Loading recent safety activity...
            </div>
          ) : hazards.length > 0 ? (
            <div className="divide-y divide-borderLight">
              {hazards.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slateText">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slateText-muted mt-0.5">
                      {item.hazard_category || 'General'} • Risk Score: {item.risk_score || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <div className="w-9 h-9 bg-emerald-50 text-status-success rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slateText">
                No active workplace hazards reported
              </p>
              <p className="text-[11px] text-slateText-secondary max-w-xs mx-auto">
                Workplace hazards and safety control measures identified on-site will be tracked here.
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-borderLight mt-4 flex items-center justify-between text-[11px] text-slateText-muted">
          <span>Safety Management Plan compliance tracking</span>
          <Link to="/smp" className="text-primary hover:underline font-medium">
            Go to Safety Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
