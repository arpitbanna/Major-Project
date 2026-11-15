import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { usePageTitle } from '../utils/usePageTitle';
import {
  FileText,
  PlusCircle,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function HandoverList() {
  usePageTitle('Shift Handover');
  const { session, role } = useAuth();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const fetchHandovers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      let url = '/api/handover';
      const params = new URLSearchParams();

      if (statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      if (dateFilter) {
        params.append('date', dateFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const result = await apiRequest(url, { token });
      setHandovers(result.data || []);
    } catch (err) {
      console.warn('[HandoverList] Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, [statusFilter, dateFilter, session?.access_token]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Acknowledged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-status-success border border-emerald-200">
            <Lock className="w-3 h-3" />
            <span>Acknowledged</span>
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-status-warning border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Submitted</span>
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slateText-secondary border border-borderLight">
            <span>Draft</span>
          </span>
        );
    }
  };

  const canCreate = ['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor'].includes(role);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-borderLight rounded p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
              Shift Records Logbook
            </span>
          </div>
          <h1 className="text-xl font-bold text-slateText">
            Digital Shift Handover System
          </h1>
          <p className="text-xs text-slateText-secondary mt-0.5">
            Operational and statutory shift-change logs with digital verification
          </p>
        </div>

        {canCreate && (
          <Link
            to="/handover/new"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded text-xs font-medium transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Shift Handover</span>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-borderLight rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slateText-secondary">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter by:</span>
          </div>

          {/* Status Tabs */}
          <div className="inline-flex rounded border border-borderLight p-0.5 bg-background">
            {['All', 'Submitted', 'Acknowledged', 'Draft'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-primary font-semibold shadow-sm'
                    : 'text-slateText-secondary hover:text-slateText'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1 border border-borderLight rounded bg-white text-slateText focus:outline-none focus:border-primary text-xs"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slateText-muted hover:text-slateText underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <button
          onClick={fetchHandovers}
          disabled={loading}
          className="flex items-center gap-1 text-slateText-secondary hover:text-slateText self-end sm:self-auto px-2.5 py-1 border border-borderLight rounded hover:bg-background transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content Area */}
      {error ? (
        <div className="bg-white border border-red-200 rounded p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-status-danger mx-auto" />
          <p className="text-sm font-semibold text-slateText">Unable to load shift handovers</p>
          <p className="text-xs text-slateText-secondary max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchHandovers}
            className="text-xs text-primary font-medium hover:underline pt-2"
          >
            Retry Fetch
          </button>
        </div>
      ) : loading ? (
        <div className="bg-white border border-borderLight rounded p-12 text-center text-xs text-slateText-secondary space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Loading shift handovers from database...</p>
        </div>
      ) : handovers.length > 0 ? (
        <div className="bg-white border border-borderLight rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-borderLight text-slateText-muted uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date & Shift</th>
                  <th className="px-4 py-3 font-semibold">Section</th>
                  <th className="px-4 py-3 font-semibold">Outgoing In-charge</th>
                  <th className="px-4 py-3 font-semibold">Incoming In-charge</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {handovers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slateText">{item.shift_date}</p>
                      <p className="text-[11px] text-slateText-muted mt-0.5">{item.shift_type}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slateText">
                      {item.mine_section}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slateText">
                        {item.outgoing?.full_name || 'Staff Member'}
                      </p>
                      <p className="text-[10px] text-slateText-muted">
                        {item.outgoing?.designation || 'In-charge'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {item.incoming?.full_name ? (
                        <>
                          <p className="font-medium text-slateText">{item.incoming.full_name}</p>
                          <p className="text-[10px] text-slateText-muted">{item.incoming.designation || 'Reliever'}</p>
                        </>
                      ) : (
                        <span className="text-[11px] text-slateText-muted italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/handover/${item.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-medium text-xs px-2.5 py-1 rounded hover:bg-primary-light transition-colors"
                      >
                        <span>View Log</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-borderLight rounded p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-50 text-slateText-muted rounded-full flex items-center justify-center mx-auto border border-borderLight">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slateText">No shift handovers found</h3>
            <p className="text-xs text-slateText-secondary mt-1 max-w-sm mx-auto">
              {statusFilter !== 'All' || dateFilter
                ? 'No records match the current filter criteria. Try clearing your filters.'
                : 'No shift handover records have been created in the system yet.'}
            </p>
          </div>
          {canCreate && (
            <div className="pt-2">
              <Link
                to="/handover/new"
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded text-xs font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Shift Handover</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
