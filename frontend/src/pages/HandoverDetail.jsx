import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  FileText,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Send,
  Check,
  ShieldAlert,
  Wrench,
  Layers,
  Edit3,
  Save,
  X,
  Download
} from 'lucide-react';

export default function HandoverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, user, profile, role } = useAuth();

  const [handover, setHandover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Editing state (for Drafts only)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchHandoverDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/handover/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to load handover details');
      }

      const result = await res.json();
      setHandover(result.data);
      setEditForm({
        mine_section: result.data.mine_section || '',
        shift_date: result.data.shift_date || '',
        shift_type: result.data.shift_type || '',
        production_summary: result.data.production_summary || '',
        equipment_status: result.data.equipment_status || '',
        safety_observations: result.data.safety_observations || '',
        pending_work: result.data.pending_work || '',
        remarks: result.data.remarks || '',
      });
    } catch (err) {
      console.warn('[HandoverDetail] Error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoverDetail();
  }, [id, session]);

  // Handle Download Handover PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/reports/handover/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to generate handover PDF report.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Shift_Handover_${handover.shift_date}_${handover.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handle Submit Handover (Draft -> Submitted)
  const requestSubmitConfirmation = () => {
    setConfirmConfig({
      title: 'Submit Shift Handover',
      message: 'Are you sure you want to submit this shift handover for incoming shift review? Once submitted, the draft cannot be edited until reviewed.',
      confirmText: 'Submit Handover',
      confirmVariant: 'primary',
      onConfirm: executeSubmitHandover
    });
  };

  const executeSubmitHandover = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/handover/${id}/submit`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to submit handover');
      }
      setSuccessMessage('Shift handover successfully submitted for acknowledgement.');
      setConfirmConfig(null);
      fetchHandoverDetail();
    } catch (err) {
      setError(err.message);
      setConfirmConfig(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Acknowledge Handover (Submitted -> Acknowledged)
  const requestAcknowledgeConfirmation = () => {
    setConfirmConfig({
      title: 'Acknowledge Shift Handover',
      message: 'Do you confirm that you have inspected and verified the shift conditions and accept handover? Once acknowledged, this record becomes an immutable statutory entry.',
      confirmText: 'Acknowledge & Sign Off',
      confirmVariant: 'success',
      onConfirm: executeAcknowledgeHandover
    });
  };

  const executeAcknowledgeHandover = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/handover/${id}/acknowledge`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to acknowledge handover');
      }
      setSuccessMessage('Shift handover successfully acknowledged and verified. Record is now locked.');
      setConfirmConfig(null);
      fetchHandoverDetail();
    } catch (err) {
      setError(err.message);
      setConfirmConfig(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Save Edited Draft
  const handleSaveDraft = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/handover/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to update draft');
      }
      setSuccessMessage('Draft updated successfully.');
      setIsEditing(false);
      fetchHandoverDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-borderLight rounded p-12 text-center text-xs text-slateText-secondary space-y-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Loading shift handover record...</p>
      </div>
    );
  }

  if (error && !handover) {
    return (
      <div className="bg-white border border-red-200 rounded p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
        <h2 className="text-sm font-semibold text-slateText">Unable to load record</h2>
        <p className="text-xs text-slateText-secondary max-w-md mx-auto">{error}</p>
        <div className="pt-2">
          <Link
            to="/handover"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Shift Handovers list</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!handover) return null;

  // Authorization checks for actions
  const isCreator = handover.outgoing_incharge_id === user?.id;
  const isAdmin = role === 'Admin';
  const isManager = role === 'Mine Manager';
  const isShiftInchargeRole = role === 'Shift In-charge';

  const isIncomingIncharge = handover.incoming_incharge_id === user?.id;
  const canAcknowledge =
    handover.status === 'Submitted' &&
    (isIncomingIncharge || isManager || isAdmin || (isShiftInchargeRole && !isCreator));

  const canEditDraft = handover.status === 'Draft' && (isCreator || isAdmin);
  const canSubmitDraft = handover.status === 'Draft' && (isCreator || isAdmin);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-borderLight rounded p-5">
        <div className="flex items-center gap-3">
          <Link
            to="/handover"
            className="p-1.5 text-slateText-secondary hover:text-slateText rounded hover:bg-background border border-borderLight"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
                Shift Handover Record
              </span>
              <span className="text-[11px] font-mono text-slateText-muted">
                #{handover.id.substring(0, 8)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slateText mt-0.5">
              {handover.shift_type} • {handover.shift_date}
            </h1>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-borderLight hover:bg-background text-slateText text-xs font-medium rounded transition-colors"
            title="Download Statutory PDF Report"
          >
            <Download className={`w-3.5 h-3.5 text-primary ${downloadingPdf ? 'animate-bounce' : ''}`} />
            <span>{downloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          {handover.status === 'Acknowledged' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-50 text-status-success border border-emerald-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Acknowledged & Locked</span>
            </span>
          )}
          {handover.status === 'Submitted' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-amber-50 text-status-warning border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting Acknowledgement</span>
            </span>
          )}
          {handover.status === 'Draft' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 text-slateText-secondary border border-borderLight">
              <span>Draft</span>
            </span>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-status-success flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Lifecycle Notice Callout */}
      {handover.status === 'Submitted' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-900">Submitted by Outgoing Shift</p>
            <p className="text-amber-700 mt-0.5">
              This logbook entry is pending review and sign-off by the incoming shift in-charge.
            </p>
          </div>
          {canAcknowledge && (
            <button
              onClick={requestAcknowledgeConfirmation}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-1.5 bg-status-success hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-medium transition-colors self-start sm:self-auto shrink-0 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{actionLoading ? 'Processing...' : 'Acknowledge & Sign Off Shift'}</span>
            </button>
          )}
        </div>
      )}

      {handover.status === 'Acknowledged' && (
        <div className="p-3 bg-slate-50 border border-borderLight rounded text-xs text-slateText-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>
              Record verified and locked on{' '}
              <strong className="text-slateText font-medium">
                {new Date(handover.acknowledged_at).toLocaleString()}
              </strong>{' '}
              by{' '}
              <strong className="text-slateText font-medium">
                {handover.acknowledged_by?.full_name || 'Incoming In-charge'}
              </strong>
              .
            </span>
          </div>
        </div>
      )}

      {/* Draft Action Toolbar */}
      {handover.status === 'Draft' && (
        <div className="p-4 bg-slate-50 border border-borderLight rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-slateText">Draft Shift Handover</p>
            <p className="text-slateText-secondary mt-0.5">
              Review and finalize operational notes before submitting to incoming shift.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {canEditDraft && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-background border border-borderLight text-slateText px-3 py-1.5 rounded text-xs font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Draft</span>
              </button>
            )}
            {canSubmitDraft && (
              <button
                onClick={requestSubmitConfirmation}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Handover</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white border border-borderLight rounded p-6 space-y-6">
        {/* Personnel Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-borderLight text-xs">
          <div className="p-3 bg-slate-50 rounded border border-borderLight">
            <span className="text-[10px] text-slateText-muted uppercase tracking-wider block font-semibold">
              Mine Section
            </span>
            <span className="font-semibold text-slateText text-sm block mt-1">
              {handover.mine_section}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-borderLight">
            <span className="text-[10px] text-slateText-muted uppercase tracking-wider block font-semibold">
              Outgoing In-charge
            </span>
            <span className="font-semibold text-slateText text-sm block mt-1">
              {handover.outgoing?.full_name || 'Staff Member'}
            </span>
            <span className="text-[10px] text-slateText-secondary">
              {handover.outgoing?.role} • {handover.outgoing?.designation || 'In-charge'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-borderLight">
            <span className="text-[10px] text-slateText-muted uppercase tracking-wider block font-semibold">
              Incoming / Relieving In-charge
            </span>
            <span className="font-semibold text-slateText text-sm block mt-1">
              {handover.incoming?.full_name || 'Unassigned'}
            </span>
            <span className="text-[10px] text-slateText-secondary">
              {handover.incoming?.role ? `${handover.incoming.role} • ${handover.incoming.designation}` : 'Pending assignment'}
            </span>
          </div>
        </div>

        {/* Editing Draft Form vs Read-Only Details */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-borderLight">
              <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                Editing Draft Content
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-slateText-secondary hover:text-slateText flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Mine Section / District
              </label>
              <input
                type="text"
                value={editForm.mine_section}
                onChange={(e) => setEditForm({ ...editForm, mine_section: e.target.value })}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Production Summary
              </label>
              <textarea
                rows={3}
                value={editForm.production_summary}
                onChange={(e) => setEditForm({ ...editForm, production_summary: e.target.value })}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Equipment Status
              </label>
              <textarea
                rows={3}
                value={editForm.equipment_status}
                onChange={(e) => setEditForm({ ...editForm, equipment_status: e.target.value })}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Safety Observations
              </label>
              <textarea
                rows={3}
                value={editForm.safety_observations}
                onChange={(e) => setEditForm({ ...editForm, safety_observations: e.target.value })}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Pending Work
              </label>
              <textarea
                rows={2}
                value={editForm.pending_work}
                onChange={(e) => setEditForm({ ...editForm, pending_work: e.target.value })}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Remarks / Special Instructions
              </label>
              <textarea
                rows={2}
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 border border-borderLight rounded text-xs text-slateText hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3.5 py-1.5 rounded text-xs font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        ) : (
          /* Read-only sections */
          <div className="space-y-6">
            {/* 1. Production Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                  Production & Operational Log
                </h2>
              </div>
              <div className="bg-slate-50 border border-borderLight rounded p-4 text-xs text-slateText leading-relaxed whitespace-pre-wrap">
                {handover.production_summary || 'No production details recorded.'}
              </div>
            </div>

            {/* 2. Equipment Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                  Equipment Status & Machinery
                </h2>
              </div>
              <div className="bg-slate-50 border border-borderLight rounded p-4 text-xs text-slateText leading-relaxed whitespace-pre-wrap">
                {handover.equipment_status || 'All machinery reported in standard working condition.'}
              </div>
            </div>

            {/* 3. Safety Observations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-status-warning" />
                <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                  Safety Observations & Strata Status
                </h2>
              </div>
              <div className="bg-slate-50 border border-borderLight rounded p-4 text-xs text-slateText leading-relaxed whitespace-pre-wrap">
                {handover.safety_observations || 'No safety incidents or abnormal gas levels reported.'}
              </div>
            </div>

            {/* 4. Pending Work */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                  Pending Work for Next Shift
                </h2>
              </div>
              <div className="bg-slate-50 border border-borderLight rounded p-4 text-xs text-slateText leading-relaxed whitespace-pre-wrap">
                {handover.pending_work || 'None specified.'}
              </div>
            </div>

            {/* 5. Remarks */}
            {handover.remarks && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slateText-secondary" />
                  <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
                    Remarks & Instructions
                  </h2>
                </div>
                <div className="bg-slate-50 border border-borderLight rounded p-4 text-xs text-slateText leading-relaxed whitespace-pre-wrap">
                  {handover.remarks}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timestamps Footer */}
        <div className="pt-4 border-t border-borderLight flex flex-wrap items-center justify-between gap-3 text-[11px] text-slateText-muted">
          <div>
            <span>Created: {new Date(handover.created_at).toLocaleString()}</span>
            {handover.submitted_at && (
              <span className="ml-3">
                • Submitted: {new Date(handover.submitted_at).toLocaleString()}
              </span>
            )}
          </div>
          {handover.acknowledged_at && (
            <span className="text-status-success font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Acknowledged & Locked: {new Date(handover.acknowledged_at).toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
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
