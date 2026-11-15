import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../utils/usePageTitle';
import { apiRequest } from '../utils/api';
import {
  FileText,
  Save,
  Send,
  ArrowLeft,
  AlertCircle,
  Clock,
  Layers,
  ShieldAlert,
  Wrench,
  CheckCircle2
} from 'lucide-react';

export default function CreateHandover() {
  usePageTitle('New Shift Handover');
  const { session, profile, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [shiftDate, setShiftDate] = useState(today);
  const [shiftType, setShiftType] = useState('Shift 1 (Morning)');
  const [mineSection, setMineSection] = useState(profile?.mine_section || 'Section A');
  const [incomingInchargeId, setIncomingInchargeId] = useState('');
  const [productionSummary, setProductionSummary] = useState('');
  const [equipmentStatus, setEquipmentStatus] = useState('');
  const [safetyObservations, setSafetyObservations] = useState('');
  const [pendingWork, setPendingWork] = useState('');
  const [remarks, setRemarks] = useState('');

  // Staff list for incoming in-charge dropdown
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch active staff list
  useEffect(() => {
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const token = session?.access_token;
        const json = await apiRequest('/api/handover/staff', { token });
        // Filter out current user from being incoming in-charge
        const eligibleStaff = (json.data || []).filter(
          (s) => s.id !== user?.id
        );
        setStaffList(eligibleStaff);
      } catch (err) {
        console.warn('[CreateHandover] Staff list note:', err.message);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [session?.access_token, user?.id]);

  const handleSubmit = async (submitImmediately = false) => {
    setErrorMessage('');

    // Client Validation
    if (!mineSection.trim()) {
      setErrorMessage('Please enter the mine section/district.');
      return;
    }
    if (!shiftDate) {
      setErrorMessage('Please select the shift date.');
      return;
    }
    if (!shiftType) {
      setErrorMessage('Please select the shift type.');
      return;
    }

    setSubmitting(true);
    try {
      const token = session?.access_token;
      const payload = {
        mine_section: mineSection.trim(),
        shift_date: shiftDate,
        shift_type: shiftType,
        incoming_incharge_id: incomingInchargeId || null,
        production_summary: productionSummary.trim(),
        equipment_status: equipmentStatus.trim(),
        safety_observations: safetyObservations.trim(),
        pending_work: pendingWork.trim(),
        remarks: remarks.trim(),
        submitImmediately,
      };

      const result = await apiRequest('/api/handover', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });

      if (submitImmediately) {
        toast.success('Handover record submitted successfully');
      } else {
        toast.success('Handover draft saved successfully');
      }

      // Redirect to the newly created handover details page
      if (result.data?.id) {
        navigate(`/handover/${result.data.id}`);
      } else {
        navigate('/handover');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-borderLight rounded p-5">
        <div className="flex items-center gap-3">
          <Link
            to="/handover"
            className="p-1.5 text-slateText-secondary hover:text-slateText rounded hover:bg-background border border-borderLight"
            title="Back to handovers list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slateText">
              Create Shift Handover Record
            </h1>
            <p className="text-xs text-slateText-secondary mt-0.5">
              Outgoing shift logbook entry & operational status
            </p>
          </div>
        </div>

        <div className="text-xs text-slateText-secondary self-start sm:self-auto bg-background px-3 py-1.5 rounded border border-borderLight">
          <span>Outgoing In-charge: </span>
          <span className="font-semibold text-slateText">
            {profile?.full_name || user?.email}
          </span>
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-borderLight rounded p-6 space-y-6">
        {/* Section 1: Shift Header Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-borderLight pb-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
              Shift Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slateText mb-1" htmlFor="shiftDate">
                Shift Date <span className="text-status-danger">*</span>
              </label>
              <input
                id="shiftDate"
                type="date"
                required
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1" htmlFor="shiftType">
                Shift Type / Timing <span className="text-status-danger">*</span>
              </label>
              <select
                id="shiftType"
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value)}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary bg-white"
              >
                <option value="Shift 1 (Morning)">Shift 1 (Morning) — 06:00 to 14:00</option>
                <option value="Shift 2 (Afternoon)">Shift 2 (Afternoon) — 14:00 to 22:00</option>
                <option value="Shift 3 (Night)">Shift 3 (Night) — 22:00 to 06:00</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1" htmlFor="mineSection">
                Mine Section / District <span className="text-status-danger">*</span>
              </label>
              <input
                id="mineSection"
                type="text"
                required
                placeholder="e.g. Seam 3 Face A, West District"
                value={mineSection}
                onChange={(e) => setMineSection(e.target.value)}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1" htmlFor="incomingIncharge">
              Relieving In-charge (Incoming Shift)
            </label>
            <select
              id="incomingIncharge"
              value={incomingInchargeId}
              onChange={(e) => setIncomingInchargeId(e.target.value)}
              className="w-full sm:w-1/2 px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary bg-white"
            >
              <option value="">— Select Relieving Personnel (or assign later) —</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.full_name} ({st.role} • {st.designation})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slateText-muted mt-1">
              Select the relieving supervisor who will inspect and acknowledge this shift record.
            </p>
          </div>
        </div>

        {/* Section 2: Operational & Production Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-borderLight pb-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
              Production & Operations
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1" htmlFor="productionSummary">
              Production Summary & Face Progress
            </label>
            <textarea
              id="productionSummary"
              rows={3}
              placeholder="e.g. Coal extracted: 450 Tonnes. Face advancement: 3.2m. Blasting completed at 11:30. Conveyor belt operating at full capacity."
              value={productionSummary}
              onChange={(e) => setProductionSummary(e.target.value)}
              className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary leading-relaxed"
            />
          </div>
        </div>

        {/* Section 3: Equipment Status & Maintenance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-borderLight pb-2">
            <Wrench className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
              Equipment Status & Machinery
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1" htmlFor="equipmentStatus">
              Machinery & Equipment Log
            </label>
            <textarea
              id="equipmentStatus"
              rows={3}
              placeholder="e.g. Dumper D-04 under scheduled greasing. Auxiliary ventilation fan #2 operational. Main sump pump running smoothly. LHD #1 hydraulic hose checked."
              value={equipmentStatus}
              onChange={(e) => setEquipmentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary leading-relaxed"
            />
          </div>
        </div>

        {/* Section 4: Safety Observations & Statutory Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-borderLight pb-2">
            <ShieldAlert className="w-4 h-4 text-status-warning" />
            <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
              Safety Observations & Strata Status
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1" htmlFor="safetyObservations">
              Safety Inspections & Atmospheric Checks
            </label>
            <textarea
              id="safetyObservations"
              rows={3}
              placeholder="e.g. Methane CH4 test at face: 0.15% (normal). CO test: Nil. Strata roof supports intact in gallery 4. Water accumulation near dip heading handled by auxiliary pump. Zero injuries reported."
              value={safetyObservations}
              onChange={(e) => setSafetyObservations(e.target.value)}
              className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary leading-relaxed"
            />
          </div>
        </div>

        {/* Section 5: Pending Work & Relieving Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-borderLight pb-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider">
              Pending Work & Instructions for Relieving Shift
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slateText mb-1" htmlFor="pendingWork">
                Pending Work to be Continued
              </label>
              <textarea
                id="pendingWork"
                rows={3}
                placeholder="e.g. Extend conveyor belt structure by 2 sections. Complete roof bolting in Level 2 heading before next drilling."
                value={pendingWork}
                onChange={(e) => setPendingWork(e.target.value)}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1" htmlFor="remarks">
                Special Remarks / Statutory Instructions
              </label>
              <textarea
                id="remarks"
                rows={3}
                placeholder="e.g. Ensure ventilation curtain check at 15:00. Maintain communication with lamp room."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-4 border-t border-borderLight flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/handover"
            className="text-xs text-slateText-secondary hover:text-slateText font-medium"
          >
            Cancel and Return
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-borderLight hover:bg-background text-slateText rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Handover'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
