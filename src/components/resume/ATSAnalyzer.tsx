// ──────────────────────────────────────────────────────────────────────────────
// ATS Analyzer — Resume Compatibility Check
// ──────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { ATSAnalysisResult, ATSCheckItem } from './types';
import { X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  result: ATSAnalysisResult;
  onClose: () => void;
}

const CheckRow: React.FC<{ item: ATSCheckItem }> = ({ item }) => (
  <div className="flex items-start gap-2 py-1">
    {item.passed
      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
    }
    <div>
      <p className={`text-xs font-medium ${item.passed ? 'text-slate-700' : 'text-amber-800'}`}>{item.label}</p>
      {item.detail && !item.passed && <p className="text-[10px] text-slate-500 mt-0.5">{item.detail}</p>}
    </div>
  </div>
);

export const ATSAnalyzer: React.FC<Props> = ({ result, onClose }) => {
  const scoreColor = result.overallScore >= 80 ? 'text-emerald-600' : result.overallScore >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = result.overallScore >= 80 ? 'bg-emerald-50 border-emerald-200' : result.overallScore >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">ATS Resume Analysis</h2>
              <p className="text-[10px] text-slate-500">Resume Compatibility Estimate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score */}
        <div className="px-5 py-4">
          <div className={`text-center p-4 rounded-xl border ${scoreBg}`}>
            <p className={`text-3xl font-black ${scoreColor}`}>{result.overallScore}%</p>
            <p className="text-[10px] text-slate-500 mt-1">
              ATS-Oriented Compatibility Score — based on structure, formatting, and content checks.
              This is an estimate and does not represent a specific ATS vendor's score.
            </p>
          </div>
        </div>

        {/* Check Lists */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Structure Check</h3>
            <div className="space-y-0.5">
              {result.structureChecks.map((item, i) => <CheckRow key={i} item={item} />)}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Formatting Check</h3>
            <div className="space-y-0.5">
              {result.formattingChecks.map((item, i) => <CheckRow key={i} item={item} />)}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Content Check</h3>
            <div className="space-y-0.5">
              {result.contentChecks.map((item, i) => <CheckRow key={i} item={item} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
