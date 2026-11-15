import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../utils/usePageTitle';
import {
  FileText,
  Download,
  ShieldAlert,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function Reports() {
  usePageTitle('Reports & Audits');
  const { session } = useAuth();
  const toast = useToast();
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleDownload = async (endpoint, defaultFilename) => {
    setDownloading(defaultFilename);
    setError(null);
    setSuccess(null);
    try {
      const token = session?.access_token;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        let errorMsg = 'Failed to generate PDF report from server.';
        try {
          const text = await res.text();
          if (text) {
            const parsed = JSON.parse(text);
            errorMsg = parsed.message || errorMsg;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`Report "${defaultFilename}" generated successfully.`);
      toast.success(`Generated and downloaded ${defaultFilename}`);
    } catch (err) {
      console.error('[Reports] Download error:', err.message);
      setError(err.message);
      toast.error(err.message || 'Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  const reportsList = [
    {
      id: 'handover-summary',
      title: 'Shift Handover Logbook Register',
      category: 'Statutory Operational Logging',
      icon: FileText,
      iconColor: 'text-primary',
      iconBg: 'bg-blue-50',
      description:
        'Consolidated register of daily shift handovers across all active colliery sections. Contains outgoing in-charge submissions, incoming acknowledgements, and timestamps.',
      endpoint: '/api/reports/handovers/pdf',
      filename: `CoalSafe_Shift_Handovers_Logbook_${new Date().toISOString().split('T')[0]}.pdf`
    },
    {
      id: 'smp-hazards',
      title: 'Safety Management Plan (SMP) Hazard Register',
      category: 'DGMS Statutory Safety Audit',
      icon: ShieldAlert,
      iconColor: 'text-status-danger',
      iconBg: 'bg-red-50',
      description:
        'Official workplace hazard register with 5×5 risk matrix evaluation (Likelihood × Severity), assigned corrective mitigation actions, and Mine Manager verification trails.',
      endpoint: '/api/reports/hazards/pdf',
      filename: `CoalSafe_SMP_Hazard_Register_${new Date().toISOString().split('T')[0]}.pdf`
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-borderLight rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
              Statutory Documentation Center
            </span>
          </div>
          <h1 className="text-xl font-bold text-slateText">
            Reports & Statutory PDF Generation
          </h1>
          <p className="text-xs text-slateText-secondary mt-1">
            Download certified PDF logbooks compliant with DGMS safety requirements and CMPDI guidelines.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-status-success flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          const isDownloadingThis = downloading === rep.filename;
          return (
            <div
              key={rep.id}
              className="bg-white border border-borderLight rounded p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded ${rep.iconBg} ${rep.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slateText-secondary border border-borderLight px-2 py-0.5 rounded">
                    {rep.category}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slateText">
                    {rep.title}
                  </h2>
                  <p className="text-xs text-slateText-secondary mt-1.5 leading-relaxed">
                    {rep.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-borderLight flex items-center justify-between">
                <span className="text-[11px] text-slateText-muted flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>DGMS Compliant Format</span>
                </span>

                <button
                  onClick={() => handleDownload(rep.endpoint, rep.filename)}
                  disabled={Boolean(downloading)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isDownloadingThis ? 'animate-bounce' : ''}`} />
                  <span>{isDownloadingThis ? 'Generating...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Note Callout */}
      <div className="p-4 bg-slate-50 border border-borderLight rounded text-xs text-slateText-secondary space-y-1">
        <p className="font-semibold text-slateText">Statutory Compliance Note:</p>
        <p className="text-[11px] leading-relaxed">
          PDF reports generated through this module represent digital reproductions of physical logbooks maintained under the Coal Mines Regulations (CMR). Sign-off records contain immutable user identification keys and exact timestamps.
        </p>
      </div>
    </div>
  );
}
