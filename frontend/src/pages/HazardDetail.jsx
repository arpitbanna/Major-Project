import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  Check,
  Clock,
  User,
  Wrench,
  Grid,
  FileText,
  Calendar,
  X,
  ShieldCheck
} from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RiskMatrix from '../components/smp/RiskMatrix';

export default function HazardDetail() {
  const { id } = useParams();
  const { session, user, role } = useAuth();

  const [hazard, setHazard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showReassessModal, setShowReassessModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Add Action Form state
  const [actionForm, setActionForm] = useState({
    action_description: '',
    action_type: 'Engineering Control',
    assigned_to_id: '',
    due_date: ''
  });

  // Re-assess Risk Form state
  const [reassessForm, setReassessForm] = useState({
    likelihood: 1,
    severity: 1,
    assessment_notes: ''
  });

  // Verification Form state
  const [verifyNotes, setVerifyNotes] = useState('');

  // Personnel list for assigning actions
  const [staffList, setStaffList] = useState([]);

  const fetchHazardDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/smp/hazards/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to load hazard record.');
      }

      const result = await res.json();
      setHazard(result.data);
      setReassessForm({
        likelihood: result.data.likelihood || 1,
        severity: result.data.severity || 1,
        assessment_notes: result.data.initial_assessment_notes || ''
      });
    } catch (err) {
      console.warn('[HazardDetail] Error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = session?.access_token;
      const res = await fetch('/api/handover/staff', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const result = await res.json();
        setStaffList(result.data || []);
      }
    } catch (err) {
      console.warn('[HazardDetail] Staff lookup note:', err.message);
    }
  };

  useEffect(() => {
    fetchHazardDetail();
    fetchStaff();
  }, [id, session]);

  // Re-assess Risk Submission
  const handleReassessSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/smp/hazards/${id}/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(reassessForm)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to re-assess risk.');
      setSuccessMessage(result.message);
      setShowReassessModal(false);
      fetchHazardDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Add Action Submission
  const handleAddActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionForm.action_description.trim()) {
      setError('Please provide action description.');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/smp/hazards/${id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(actionForm)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to assign action.');
      setSuccessMessage('Corrective action assigned.');
      setShowAddActionModal(false);
      setActionForm({
        action_description: '',
        action_type: 'Engineering Control',
        assigned_to_id: '',
        due_date: ''
      });
      fetchHazardDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Action Status (e.g. In Progress or Completed)
  const handleUpdateActionStatus = async (actionId, newStatus) => {
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/smp/actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          completion_remarks: `Marked as ${newStatus} by user`
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update action status.');
      setSuccessMessage(result.message);
      fetchHazardDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Manager Verification Submission
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/smp/hazards/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ verification_notes: verifyNotes })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to verify hazard.');
      setSuccessMessage('Hazard control measures verified.');
      setShowVerifyModal(false);
      fetchHazardDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Close Hazard Request
  const requestCloseHazard = () => {
    setConfirmConfig({
      title: 'Close Hazard & Lock Record',
      message:
        'Are you sure you want to close this hazard? Once closed, this record becomes an immutable statutory audit entry and cannot be modified.',
      confirmText: 'Close & Lock Hazard',
      confirmVariant: 'danger',
      onConfirm: executeCloseHazard
    });
  };

  const executeCloseHazard = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/smp/hazards/${id}/close`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to close hazard.');
      setSuccessMessage('Hazard closed and locked for audit.');
      setConfirmConfig(null);
      fetchHazardDetail();
    } catch (err) {
      setError(err.message);
      setConfirmConfig(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-borderLight rounded p-12 text-center text-xs text-slateText-secondary space-y-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Loading workplace hazard record...</p>
      </div>
    );
  }

  if (error && !hazard) {
    return (
      <div className="bg-white border border-red-200 rounded p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
        <h2 className="text-sm font-semibold text-slateText">Unable to load record</h2>
        <p className="text-xs text-slateText-secondary max-w-md mx-auto">{error}</p>
        <div className="pt-2">
          <Link
            to="/smp"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Safety Management Plan</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!hazard) return null;

  // Role permissions
  const isManager = role === 'Mine Manager' || role === 'Admin';
  const isSupervisorOrAbove = ['Admin', 'Mine Manager', 'Shift In-charge', 'Supervisor'].includes(
    role
  );
  const isClosed = hazard.status === 'Closed';

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Extreme':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-borderLight rounded p-5">
        <div className="flex items-center gap-3">
          <Link
            to="/smp"
            className="p-1.5 text-slateText-secondary hover:text-slateText rounded hover:bg-background border border-borderLight"
            title="Back to SMP"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
                Workplace Hazard Record
              </span>
              <span className="text-[11px] font-mono text-slateText-muted">
                #{hazard.id.substring(0, 8)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slateText mt-0.5">{hazard.title}</h1>
          </div>
        </div>

        {/* Status & Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border ${getRiskBadge(
              hazard.risk_level
            )}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Score: {hazard.risk_score} ({hazard.risk_level})</span>
          </span>

          {isClosed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-slate-100 text-slateText-secondary border border-borderLight">
              <Lock className="w-3.5 h-3.5" />
              <span>Closed & Locked</span>
            </span>
          ) : (
            <span className="px-2.5 py-1.5 rounded text-xs font-semibold bg-blue-50 text-primary border border-blue-200">
              {hazard.status}
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-status-success flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Closed Banner */}
      {isClosed && (
        <div className="p-3 bg-slate-50 border border-borderLight rounded text-xs text-slateText-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>
              Hazard resolved and locked on{' '}
              <strong className="text-slateText font-medium">
                {new Date(hazard.closed_at).toLocaleString()}
              </strong>
              . Statutory record preserved.
            </span>
          </div>
        </div>
      )}

      {/* Operational Actions Toolbar (Manager & In-charge) */}
      {!isClosed && (
        <div className="p-4 bg-slate-50 border border-borderLight rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-slateText">Hazard Control Actions</p>
            <p className="text-slateText-secondary mt-0.5">
              Assign corrective engineering/administrative measures or re-evaluate risk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowReassessModal(true)}
              className="px-3 py-1.5 bg-white border border-borderLight rounded hover:bg-background text-slateText font-medium text-xs flex items-center gap-1.5"
            >
              <Grid className="w-3.5 h-3.5 text-primary" />
              <span>Re-assess Risk</span>
            </button>

            {isSupervisorOrAbove && (
              <button
                onClick={() => setShowAddActionModal(true)}
                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded font-medium text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Action</span>
              </button>
            )}

            {isManager && (
              <>
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify Controls</span>
                </button>
                <button
                  onClick={requestCloseHazard}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-status-danger hover:bg-red-700 text-white rounded font-medium text-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Hazard</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="bg-white border border-borderLight rounded p-6 space-y-6">
        {/* Meta Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-borderLight text-xs">
          <div className="p-3 bg-slate-50 rounded border border-borderLight">
            <span className="text-[10px] text-slateText-muted uppercase tracking-wider block font-semibold">
              Mine Section & Location
            </span>
            <span className="font-semibold text-slateText text-sm block mt-1">
              {hazard.mine_section}
            </span>
            <span className="text-[10px] text-slateText-secondary block mt-0.5">
              {hazard.location_details || 'No chainage recorded'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-borderLight">
            <span className="text-[10px] text-slateText-muted uppercase tracking-wider block font-semibold">
              Hazard Category
            </span>
            <span className="font-semibold text-slateText text-sm block mt-1">
              {hazard.hazard_category}
            </span>
            <span className="text-[10px] text-slateText-secondary block mt-0.5">
              DGMS SMP Framework
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-borderLight">
            <span className="text-[10px] text-slateText-muted uppercase tracking-wider block font-semibold">
              Reported By
            </span>
            <span className="font-semibold text-slateText text-sm block mt-1">
              {hazard.reported_by?.full_name || 'Staff Member'}
            </span>
            <span className="text-[10px] text-slateText-secondary block mt-0.5">
              {hazard.reported_by?.role || 'Supervisor'} • {hazard.reported_by?.designation}
            </span>
          </div>
        </div>

        {/* Hazard Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
              Observation & Physical Condition
            </h2>
          </div>
          <div className="bg-slate-50 border border-borderLight rounded p-4 text-xs text-slateText leading-relaxed whitespace-pre-wrap">
            {hazard.description}
          </div>
        </div>

        {/* 5x5 Risk Matrix Assessment Result */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-status-danger" />
              <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                Risk Assessment (5×5 Evaluation)
              </h2>
            </div>
            <span className="text-[11px] text-slateText-muted font-medium">
              Score = Likelihood ({hazard.likelihood}) × Severity ({hazard.severity}) = {hazard.risk_score}
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-borderLight rounded space-y-3">
            <RiskMatrix
              selectedLikelihood={hazard.likelihood}
              selectedSeverity={hazard.severity}
              readOnly={true}
            />
            {hazard.initial_assessment_notes && (
              <p className="text-xs text-slateText pt-2 border-t border-borderLight">
                <strong>Precautions / Notes:</strong> {hazard.initial_assessment_notes}
              </p>
            )}
          </div>
        </div>

        {/* Corrective Actions Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                Corrective Actions & Control Measures ({hazard.actions?.length || 0})
              </h2>
            </div>
            {!isClosed && isSupervisorOrAbove && (
              <button
                onClick={() => setShowAddActionModal(true)}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Action</span>
              </button>
            )}
          </div>

          {hazard.actions?.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-borderLight rounded text-center text-xs text-slateText-secondary space-y-1">
              <p className="font-semibold text-slateText">No corrective actions assigned yet</p>
              <p className="text-[11px]">
                Supervisors and Managers should assign mitigation measures to reduce risk.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hazard.actions.map((act) => (
                <div
                  key={act.id}
                  className="p-4 bg-white border border-borderLight rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slateText-secondary border border-borderLight">
                        {act.action_type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          act.status === 'Completed'
                            ? 'bg-emerald-50 text-status-success border-emerald-200'
                            : act.status === 'In Progress'
                            ? 'bg-blue-50 text-primary border-blue-200'
                            : 'bg-amber-50 text-status-warning border-amber-200'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <p className="font-medium text-slateText text-xs mt-1">
                      {act.action_description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slateText-muted pt-1">
                      <span>Assigned to: <strong className="text-slateText">{act.assigned_to?.full_name || 'Unassigned'}</strong></span>
                      {act.due_date && <span>• Target: {act.due_date}</span>}
                      {act.completed_at && (
                        <span>• Completed: {new Date(act.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {!isClosed && act.status !== 'Completed' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {act.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateActionStatus(act.id, 'In Progress')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-white hover:bg-background border border-borderLight rounded text-[11px] text-slateText font-medium"
                        >
                          Start Work
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateActionStatus(act.id, 'Completed')}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-status-success hover:bg-emerald-700 text-white rounded text-[11px] font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Complete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager Verification Details */}
        {hazard.verified_at && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-status-success" />
              <span>Manager Verification Completed</span>
            </div>
            <p className="text-[11px] text-emerald-900">
              Verified by <strong>{hazard.verified_by?.full_name || 'Mine Manager'}</strong> on{' '}
              {new Date(hazard.verified_at).toLocaleString()}
            </p>
            {hazard.verification_notes && (
              <p className="text-xs text-emerald-950 mt-1 italic">
                "{hazard.verification_notes}"
              </p>
            )}
          </div>
        )}

        {/* Timestamps Footer */}
        <div className="pt-4 border-t border-borderLight flex flex-wrap items-center justify-between gap-3 text-[11px] text-slateText-muted">
          <span>Created: {new Date(hazard.created_at).toLocaleString()}</span>
          <span>Last Updated: {new Date(hazard.updated_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Modal: Add Corrective Action */}
      {showAddActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <form
            onSubmit={handleAddActionSubmit}
            className="bg-white rounded-lg border border-borderLight shadow-lg max-w-lg w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-borderLight pb-3">
              <h3 className="text-sm font-bold text-slateText">
                Assign Corrective Safety Action
              </h3>
              <button
                type="button"
                onClick={() => setShowAddActionModal(false)}
                className="text-slateText-muted hover:text-slateText p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Control Hierarchy Type
                </label>
                <select
                  value={actionForm.action_type}
                  onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })}
                  className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText focus:outline-none focus:border-primary"
                >
                  <option value="Elimination">Elimination (Remove hazard physically)</option>
                  <option value="Substitution">Substitution (Replace with safer method)</option>
                  <option value="Engineering Control">Engineering Control (Barriers, bolting, ventilation)</option>
                  <option value="Administrative Control">Administrative Control (Work rules, retraining)</option>
                  <option value="PPE">PPE (Personal Protective Equipment)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Action Description <span className="text-status-danger">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionForm.action_description}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, action_description: e.target.value })
                  }
                  placeholder="Specify actionable steps to mitigate the observed condition..."
                  className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Assign To Personnel
                  </label>
                  <select
                    value={actionForm.assigned_to_id}
                    onChange={(e) =>
                      setActionForm({ ...actionForm, assigned_to_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Personnel (Optional)</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={actionForm.due_date}
                    onChange={(e) => setActionForm({ ...actionForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-borderLight">
              <button
                type="button"
                onClick={() => setShowAddActionModal(false)}
                className="px-3 py-1.5 border border-borderLight rounded text-xs text-slateText hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium"
              >
                {actionLoading ? 'Assigning...' : 'Assign Action'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Re-assess Risk */}
      {showReassessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <form
            onSubmit={handleReassessSubmit}
            className="bg-white rounded-lg border border-borderLight shadow-lg max-w-xl w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-borderLight pb-3">
              <h3 className="text-sm font-bold text-slateText">
                Re-assess Hazard Risk (5×5 Matrix)
              </h3>
              <button
                type="button"
                onClick={() => setShowReassessModal(false)}
                className="text-slateText-muted hover:text-slateText p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Likelihood (1–5)
                  </label>
                  <select
                    value={reassessForm.likelihood}
                    onChange={(e) =>
                      setReassessForm({ ...reassessForm, likelihood: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText"
                  >
                    <option value={1}>1 — Rare</option>
                    <option value={2}>2 — Unlikely</option>
                    <option value={3}>3 — Possible</option>
                    <option value={4}>4 — Likely</option>
                    <option value={5}>5 — Almost Certain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slateText mb-1">
                    Severity (1–5)
                  </label>
                  <select
                    value={reassessForm.severity}
                    onChange={(e) =>
                      setReassessForm({ ...reassessForm, severity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText"
                  >
                    <option value={1}>1 — Insignificant</option>
                    <option value={2}>2 — Minor</option>
                    <option value={3}>3 — Moderate</option>
                    <option value={4}>4 — Major</option>
                    <option value={5}>5 — Catastrophic</option>
                  </select>
                </div>
              </div>

              <div>
                <RiskMatrix
                  selectedLikelihood={reassessForm.likelihood}
                  selectedSeverity={reassessForm.severity}
                  onSelectCell={(l, s) => setReassessForm({ ...reassessForm, likelihood: l, severity: s })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Re-assessment Notes & Rationale
                </label>
                <textarea
                  rows={2}
                  value={reassessForm.assessment_notes}
                  onChange={(e) =>
                    setReassessForm({ ...reassessForm, assessment_notes: e.target.value })
                  }
                  placeholder="Reason for change in risk rating (e.g. temporary supports installed)..."
                  className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-borderLight">
              <button
                type="button"
                onClick={() => setShowReassessModal(false)}
                className="px-3 py-1.5 border border-borderLight rounded text-xs text-slateText hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium"
              >
                {actionLoading ? 'Updating...' : 'Save Re-assessment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Manager Verification */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <form
            onSubmit={handleVerifySubmit}
            className="bg-white rounded-lg border border-borderLight shadow-lg max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-borderLight pb-3">
              <h3 className="text-sm font-bold text-slateText">
                Mine Manager Verification
              </h3>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-slateText-muted hover:text-slateText p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slateText-secondary">
                Confirm that you have reviewed the reported hazard and verified that the implemented control measures satisfy statutory mine safety requirements.
              </p>
              <div>
                <label className="block text-xs font-medium text-slateText mb-1">
                  Verification Comments
                </label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Inspected on-site during morning shift. Roof bolting completed as per SSR standards."
                  className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-borderLight">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-3 py-1.5 border border-borderLight rounded text-xs text-slateText hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
              >
                {actionLoading ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Dialog (Close Hazard) */}
      {confirmConfig && (
        <ConfirmDialog
          isOpen={Boolean(confirmConfig)}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          confirmVariant={confirmConfig.confirmVariant}
          loading={actionLoading}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
