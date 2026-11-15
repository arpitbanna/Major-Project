import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { usePageTitle } from '../utils/usePageTitle';
import {
  ShieldAlert,
  Plus,
  Filter,
  Grid,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import RiskMatrix from '../components/smp/RiskMatrix';

export default function SmpList() {
  usePageTitle('Safety Management Plan');
  const { session } = useAuth();

  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Matrix modal
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  const fetchHazards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.append('status', filterStatus);
      if (filterRisk !== 'All') params.append('risk_level', filterRisk);
      if (filterCategory !== 'All') params.append('category', filterCategory);

      const url = `/api/smp/hazards${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiRequest(url, { token });
      setHazards(result.data || []);
    } catch (err) {
      console.warn('[SmpList] Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
  }, [filterStatus, filterRisk, filterCategory, session?.access_token]);

  // Risk badge styling helper
  const getRiskBadge = (level, score) => {
    switch (level) {
      case 'Extreme':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slateText-secondary border-borderLight';
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Closed':
        return 'bg-slate-100 text-slateText-secondary border-borderLight';
      case 'Action Completed':
        return 'bg-emerald-50 text-status-success border-emerald-200';
      case 'Action Assigned':
        return 'bg-blue-50 text-primary border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-status-warning border-amber-200';
      case 'Open':
      default:
        return 'bg-red-50 text-status-danger border-red-200';
    }
  };

  // Calculate quick summary metrics
  const totalCount = hazards.length;
  const openCount = hazards.filter((h) => h.status !== 'Closed').length;
  const criticalCount = hazards.filter(
    (h) => (h.risk_level === 'High' || h.risk_level === 'Extreme') && h.status !== 'Closed'
  ).length;
  const closedCount = hazards.filter((h) => h.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-borderLight rounded p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-status-danger"></span>
            <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
              DGMS Safety Management Plan (SMP)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slateText">
            Workplace Hazard & Risk Management
          </h1>
          <p className="text-xs text-slateText-secondary mt-1">
            Hazard identification, 5x5 matrix risk evaluation, and corrective action tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowMatrixModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-borderLight text-slateText hover:bg-background rounded text-xs font-medium transition-colors"
          >
            <Grid className="w-3.5 h-3.5 text-primary" />
            <span>Risk Matrix Guide</span>
          </button>
          <Link
            to="/smp/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Hazard</span>
          </Link>
        </div>
      </div>

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-borderLight rounded p-3.5">
          <p className="text-[11px] text-slateText-muted font-medium">Total Recorded</p>
          <p className="text-xl font-bold text-slateText mt-1">{totalCount}</p>
        </div>
        <div className="bg-white border border-borderLight rounded p-3.5">
          <p className="text-[11px] text-slateText-muted font-medium">Active / Open</p>
          <p className="text-xl font-bold text-status-warning mt-1">{openCount}</p>
        </div>
        <div className="bg-white border border-borderLight rounded p-3.5">
          <p className="text-[11px] text-slateText-muted font-medium">High / Extreme Risk</p>
          <p className="text-xl font-bold text-status-danger mt-1">{criticalCount}</p>
        </div>
        <div className="bg-white border border-borderLight rounded p-3.5">
          <p className="text-[11px] text-slateText-muted font-medium">Mitigated & Closed</p>
          <p className="text-xl font-bold text-status-success mt-1">{closedCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-borderLight rounded p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slateText-muted mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px] uppercase tracking-wider">Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-borderLight rounded bg-white text-slateText text-xs focus:outline-none focus:border-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="Action Assigned">Action Assigned</option>
            <option value="Action Completed">Action Completed</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-2.5 py-1.5 border border-borderLight rounded bg-white text-slateText text-xs focus:outline-none focus:border-primary"
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Extreme">Extreme Risk</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 border border-borderLight rounded bg-white text-slateText text-xs focus:outline-none focus:border-primary"
          >
            <option value="All">All Hazard Categories</option>
            <option value="Strata Control">Strata Control</option>
            <option value="Ventilation & Mine Gases">Ventilation & Gases</option>
            <option value="Inundation & Water">Inundation & Water</option>
            <option value="Haulage & Transport">Haulage & Transport</option>
            <option value="Machinery & Electrical">Machinery & Electrical</option>
            <option value="Fire & Spontaneous Combustion">Fire & Combustion</option>
            <option value="Dust & Airborne Hazards">Dust & Airborne</option>
            <option value="General / Other">General / Other</option>
          </select>
        </div>

        <button
          onClick={fetchHazards}
          disabled={loading}
          className="text-slateText-secondary hover:text-slateText p-1.5 rounded hover:bg-background border border-transparent hover:border-borderLight transition-colors"
          title="Refresh hazards list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hazards Data List */}
      <div className="bg-white border border-borderLight rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slateText-secondary space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading workplace hazard records...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-status-danger space-y-2">
            <AlertTriangle className="w-6 h-6 mx-auto text-status-danger" />
            <p>{error}</p>
          </div>
        ) : hazards.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-borderLight flex items-center justify-center mx-auto text-slateText-muted">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slateText">No workplace hazards found</p>
            <p className="text-[11px] text-slateText-secondary max-w-sm mx-auto">
              No hazards match the active filter criteria. Report workplace observations to track them through mitigation.
            </p>
            <div className="pt-1">
              <Link
                to="/smp/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report New Hazard</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-borderLight">
            {hazards.map((item) => (
              <Link
                key={item.id}
                to={`/smp/${item.id}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors block text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(
                        item.risk_level,
                        item.risk_score
                      )}`}
                    >
                      Score {item.risk_score} • {item.risk_level}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <span className="text-[11px] text-slateText-muted">
                      {item.hazard_category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slateText text-sm hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-slateText-secondary line-clamp-1">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slateText-muted pt-0.5">
                    <span>Section: <strong className="text-slateText font-medium">{item.mine_section}</strong></span>
                    <span>•</span>
                    <span>Reported by: <strong className="text-slateText font-medium">{item.reported_by?.full_name || 'Staff'}</strong></span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center shrink-0">
                  {item.totalActions > 0 && (
                    <span className="text-[11px] bg-slate-100 border border-borderLight text-slateText px-2 py-1 rounded">
                      {item.completedActions}/{item.totalActions} actions
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slateText-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Risk Matrix Guide Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white rounded-lg border border-borderLight shadow-lg max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-borderLight pb-3">
              <div>
                <h3 className="text-sm font-bold text-slateText">
                  5×5 Risk Assessment Matrix Guide
                </h3>
                <p className="text-xs text-slateText-secondary mt-0.5">
                  Standard mining risk evaluation methodology conforming to DGMS guidelines
                </p>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-slateText-muted hover:text-slateText p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RiskMatrix readOnly={true} />

            <div className="flex justify-end pt-2 border-t border-borderLight">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slateText text-xs font-medium rounded transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
