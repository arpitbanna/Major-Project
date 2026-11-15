import React from 'react';

/**
 * 5x5 Risk Assessment Matrix Component
 * Aligned with standard mining risk assessment methodology (DGMS SMP guidelines)
 *
 * Likelihood: 1 (Rare) to 5 (Almost Certain)
 * Severity:   1 (Insignificant) to 5 (Catastrophic)
 */
export default function RiskMatrix({
  selectedLikelihood,
  selectedSeverity,
  onSelectCell,
  readOnly = false
}) {
  const likelihoodLabels = [
    { level: 5, label: '5. Almost Certain' },
    { level: 4, label: '4. Likely' },
    { level: 3, label: '3. Possible' },
    { level: 2, label: '2. Unlikely' },
    { level: 1, label: '1. Rare' }
  ];

  const severityLabels = [
    { level: 1, label: '1. Insignificant' },
    { level: 2, label: '2. Minor' },
    { level: 3, label: '3. Moderate' },
    { level: 4, label: '4. Major' },
    { level: 5, label: '5. Catastrophic' }
  ];

  // Helper to determine cell styling based on score
  const getCellMeta = (l, s) => {
    const score = l * s;
    if (score >= 17) {
      return {
        level: 'Extreme',
        bg: 'bg-red-500 hover:bg-red-600 text-white',
        border: 'border-red-600'
      };
    } else if (score >= 10) {
      return {
        level: 'High',
        bg: 'bg-orange-400 hover:bg-orange-500 text-white',
        border: 'border-orange-500'
      };
    } else if (score >= 5) {
      return {
        level: 'Medium',
        bg: 'bg-amber-300 hover:bg-amber-400 text-amber-950',
        border: 'border-amber-400'
      };
    } else {
      return {
        level: 'Low',
        bg: 'bg-emerald-400 hover:bg-emerald-500 text-emerald-950',
        border: 'border-emerald-500'
      };
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="p-2 border border-borderLight bg-slate-100 text-slateText-muted font-semibold text-[10px] uppercase w-24">
                Likelihood ↓ / Severity →
              </th>
              {severityLabels.map((sev) => (
                <th
                  key={sev.level}
                  className="p-2 border border-borderLight bg-slate-100 text-slateText font-medium text-[11px]"
                >
                  {sev.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {likelihoodLabels.map((lik) => (
              <tr key={lik.level}>
                <td className="p-2 border border-borderLight bg-slate-50 text-slateText font-medium text-[11px] text-left">
                  {lik.label}
                </td>
                {severityLabels.map((sev) => {
                  const score = lik.level * sev.level;
                  const meta = getCellMeta(lik.level, sev.level);
                  const isSelected =
                    Number(selectedLikelihood) === lik.level &&
                    Number(selectedSeverity) === sev.level;

                  return (
                    <td
                      key={sev.level}
                      onClick={() => {
                        if (!readOnly && onSelectCell) {
                          onSelectCell(lik.level, sev.level);
                        }
                      }}
                      className={`p-3 border border-white font-bold transition-transform relative select-none ${
                        meta.bg
                      } ${!readOnly ? 'cursor-pointer' : 'cursor-default'} ${
                        isSelected ? 'ring-4 ring-slate-900 ring-offset-1 z-10 scale-105 shadow-md' : ''
                      }`}
                      title={`Likelihood ${lik.level} × Severity ${sev.level} = ${score} (${meta.level})`}
                    >
                      <span className="text-sm block">{score}</span>
                      <span className="text-[9px] font-normal tracking-tight block opacity-90">
                        {meta.level}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend & Action Bands */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
          <span className="w-3 h-3 rounded bg-emerald-500 shrink-0"></span>
          <div>
            <span className="font-semibold text-emerald-950 block text-[11px]">Low (1–4)</span>
            <span className="text-[10px] text-emerald-800 leading-tight block">Routine supervision</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
          <span className="w-3 h-3 rounded bg-amber-400 shrink-0"></span>
          <div>
            <span className="font-semibold text-amber-950 block text-[11px]">Medium (5–9)</span>
            <span className="text-[10px] text-amber-800 leading-tight block">Planned mitigation</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
          <span className="w-3 h-3 rounded bg-orange-500 shrink-0"></span>
          <div>
            <span className="font-semibold text-orange-950 block text-[11px]">High (10–16)</span>
            <span className="text-[10px] text-orange-800 leading-tight block">Urgent action</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
          <span className="w-3 h-3 rounded bg-red-600 shrink-0"></span>
          <div>
            <span className="font-semibold text-red-950 block text-[11px]">Extreme (17–25)</span>
            <span className="text-[10px] text-red-800 leading-tight block">Immediate stoppage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
