// ──────────────────────────────────────────────────────────────────────────────
// Professional Summary Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeData } from '../types';
import { generateSummary, improveSummary, isAIConfigured } from '../aiService';
import { ChevronDown, ChevronRight, AlignLeft, Sparkles, Wand2, Loader2 } from 'lucide-react';

interface Props {
  summary: string;
  resumeData: ResumeData;
  onChange: (summary: string) => void;
}

export const SummarySection: React.FC<Props> = ({ summary, resumeData, onChange }) => {
  const [expanded, setExpanded] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setAiError(null);
    try {
      const result = await generateSummary(resumeData);
      if (result) onChange(result);
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!summary.trim()) return;
    setImproving(true);
    setAiError(null);
    try {
      const result = await improveSummary(summary, resumeData);
      if (result) onChange(result);
    } catch (err: any) {
      setAiError(err.message || 'Failed to improve summary');
    } finally {
      setImproving(false);
    }
  };

  const aiAvailable = isAIConfigured();

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <AlignLeft className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">Professional Summary</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <textarea
            className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            rows={4}
            value={summary}
            onChange={e => onChange(e.target.value)}
            placeholder="Write a concise professional summary highlighting your skills, experience, and career goals..."
          />

          {aiError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || improving || !aiAvailable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generating ? 'Generating...' : 'AI Generate'}
            </button>
            <button
              type="button"
              onClick={handleImprove}
              disabled={improving || generating || !summary.trim() || !aiAvailable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-all border border-slate-200"
            >
              {improving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              {improving ? 'Improving...' : 'AI Improve'}
            </button>
            {!aiAvailable && (
              <span className="text-[10px] text-amber-600 self-center">Set VITE_GEMINI_API_KEY to enable AI</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
