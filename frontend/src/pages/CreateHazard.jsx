import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShieldAlert, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import RiskMatrix from '../components/smp/RiskMatrix';

export default function CreateHazard() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [form, setForm] = useState({
    mine_section: profile?.mine_section || 'Colliery Sec-1',
    hazard_category: 'Strata Control',
    title: '',
    description: '',
    location_details: '',
    likelihood: 2,
    severity: 2,
    initial_assessment_notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Categories list
  const hazardCategories = [
    'Strata Control',
    'Ventilation & Mine Gases',
    'Inundation & Water',
    'Haulage & Transport',
    'Machinery & Electrical',
    'Fire & Spontaneous Combustion',
    'Dust & Airborne Hazards',
    'General / Other'
  ];

  // Helper for live risk calculation
  const getRiskMeta = (l, s) => {
    const score = l * s;
    if (score >= 17) {
      return {
        score,
        level: 'Extreme',
        badge: 'bg-red-500 text-white',
        advice: 'Immediate operational stoppage required. High priority mitigation needed before resumption.'
      };
    } else if (score >= 10) {
      return {
        score,
        level: 'High',
        badge: 'bg-orange-500 text-white',
        advice: 'Urgent remedial action needed with direct supervisory oversight.'
      };
    } else if (score >= 5) {
      return {
        score,
        level: 'Medium',
        badge: 'bg-amber-400 text-amber-950',
        advice: 'Planned mitigation measures with assigned responsibility and timeline.'
      };
    } else {
      return {
        score,
        level: 'Low',
        badge: 'bg-emerald-500 text-white',
        advice: 'Routine supervision and continuous monitoring.'
      };
    }
  };

  const riskMeta = getRiskMeta(Number(form.likelihood), Number(form.severity));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Please provide a descriptive hazard title.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please provide details on the observed hazard condition.');
      return;
    }

    setSubmitting(true);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/smp/hazards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          mine_section: form.mine_section,
          hazard_category: form.hazard_category,
          title: form.title,
          description: form.description,
          location_details: form.location_details,
          likelihood: Number(form.likelihood),
          severity: Number(form.severity),
          initial_assessment_notes: form.initial_assessment_notes
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to submit hazard record.');
      }

      navigate(`/smp/${result.data.id}`);
    } catch (err) {
      console.error('[CreateHazard] Error:', err.message);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white border border-borderLight rounded p-5">
        <Link
          to="/smp"
          className="p-1.5 text-slateText-secondary hover:text-slateText rounded hover:bg-background border border-borderLight"
          title="Back to Hazards list"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
              Safety Management Plan
            </span>
          </div>
          <h1 className="text-xl font-bold text-slateText mt-0.5">
            Report Workplace Hazard
          </h1>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-borderLight rounded p-6 space-y-6">
        {/* Section 1: Location & Classification */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider pb-2 border-b border-borderLight">
            1. Mine Location & Hazard Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Mine Section / District <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={form.mine_section}
                onChange={(e) => setForm({ ...form, mine_section: e.target.value })}
                placeholder="e.g. Panel A - Longwall Face"
                className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Hazard Category <span className="text-status-danger">*</span>
              </label>
              <select
                value={form.hazard_category}
                onChange={(e) => setForm({ ...form, hazard_category: e.target.value })}
                className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText focus:outline-none focus:border-primary"
              >
                {hazardCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1">
              Exact Location / Chainage / Pillar Details
            </label>
            <input
              type="text"
              value={form.location_details}
              onChange={(e) => setForm({ ...form, location_details: e.target.value })}
              placeholder="e.g. Gallery 3, between Pillar 12 and 13, near belt conveyor return end"
              className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Section 2: Hazard Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider pb-2 border-b border-borderLight">
            2. Hazard Description
          </h2>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1">
              Hazard Title <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Spalling and roof crack observed along tailgate roadway"
              className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1">
              Detailed Observation & Physical Condition <span className="text-status-danger">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the condition in detail: size of spalling, water seepage rate, gas detector readings, or equipment abnormality..."
              className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Section 3: 5x5 Risk Assessment Matrix */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slateText uppercase tracking-wider pb-2 border-b border-borderLight">
            3. Risk Assessment (5×5 Matrix Evaluation)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Likelihood of Occurrence (1–5)
              </label>
              <select
                value={form.likelihood}
                onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText focus:outline-none focus:border-primary"
              >
                <option value={1}>1 — Rare (Highly unlikely)</option>
                <option value={2}>2 — Unlikely (Occasional adverse conditions)</option>
                <option value={3}>3 — Possible (May occur during routine shifts)</option>
                <option value={4}>4 — Likely (Frequent or recurring)</option>
                <option value={5}>5 — Almost Certain (Continuous / Inevitable)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slateText mb-1">
                Potential Severity of Consequences (1–5)
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-borderLight rounded bg-white text-xs text-slateText focus:outline-none focus:border-primary"
              >
                <option value={1}>1 — Insignificant (First aid, negligible impact)</option>
                <option value={2}>2 — Minor (Minor injury, localized damage)</option>
                <option value={3}>3 — Moderate (Medical treatment, partial stoppage)</option>
                <option value={4}>4 — Major (Serious reportable injury, extensive failure)</option>
                <option value={5}>5 — Catastrophic (Fatality, mine-wide stoppage)</option>
              </select>
            </div>
          </div>

          {/* Interactive Matrix Selector */}
          <div className="p-4 bg-slate-50 border border-borderLight rounded space-y-2">
            <p className="text-[11px] font-semibold text-slateText-muted uppercase tracking-wider">
              Click a cell in the matrix below to set Likelihood & Severity:
            </p>
            <RiskMatrix
              selectedLikelihood={Number(form.likelihood)}
              selectedSeverity={Number(form.severity)}
              onSelectCell={(l, s) => setForm({ ...form, likelihood: l, severity: s })}
            />
          </div>

          {/* Live Calculated Risk Summary Box */}
          <div className="p-4 bg-slate-50 border border-borderLight rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slateText-muted uppercase tracking-wider font-semibold">
                Evaluated Risk Level
              </p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${riskMeta.badge}`}>
                  Score: {riskMeta.score} ({riskMeta.level} Risk)
                </span>
                <span className="text-xs text-slateText-secondary">
                  Likelihood ({form.likelihood}) × Severity ({form.severity})
                </span>
              </div>
              <p className="text-xs text-slateText mt-1">
                <strong>Recommended Control:</strong> {riskMeta.advice}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText mb-1">
              Initial Precautions Taken / Temporary Controls
            </label>
            <textarea
              rows={2}
              value={form.initial_assessment_notes}
              onChange={(e) => setForm({ ...form, initial_assessment_notes: e.target.value })}
              placeholder="e.g. Danger tape placed around pillar; workers withdrawn to safe distance; ventilation brattice adjusted..."
              className="w-full px-3 py-2 border border-borderLight rounded text-xs text-slateText focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-borderLight">
          <Link
            to="/smp"
            className="px-4 py-2 border border-borderLight rounded text-xs text-slateText hover:bg-background transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting Record...' : 'Report Workplace Hazard'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
