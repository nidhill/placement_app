// ──────────────────────────────────────────────────────────────────────────────
// Job Tailor Modal — AI Resume Agent
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeData, JobTailorResult } from './types';
import { extractAndMatchKeywords, tailorResumeToJob, isAIConfigured } from './aiService';
import { createVersion } from './resumeStore';
import { X, Target, Loader2, Wand2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  studentId: string;
  resumeData: ResumeData;
  onClose: () => void;
  onTailored: (versionId: string) => void;
}

export const JobTailorModal: React.FC<Props> = ({ studentId, resumeData, onClose, onTailored }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobTailorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please provide job title and description');
      return;
    }
    setError(null);
    setAnalyzing(true);
    
    // Simulate slight delay for UX
    setTimeout(() => {
      const skills = requiredSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const result = extractAndMatchKeywords(jobDescription, skills, [], resumeData);
      setAnalysisResult({ ...result, suggestions: [] });
      setAnalyzing(false);
    }, 600);
  };

  const handleTailor = async () => {
    if (!isAIConfigured()) {
      setError('AI is not configured (VITE_GEMINI_API_KEY missing)');
      return;
    }
    
    setTailoring(true);
    setError(null);
    
    try {
      const skills = requiredSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const tailoredSummary = await tailorResumeToJob(resumeData, jobTitle, jobDescription, skills);
      
      if (tailoredSummary) {
        // Create new tailored version
        const newTitle = `Tailored: ${jobTitle}`;
        const newData = { ...resumeData, summary: tailoredSummary };
        const newVersion = createVersion(studentId, newTitle, jobTitle, 'modern', newData);
        
        onTailored(newVersion.id);
      } else {
        setError('Failed to generate tailored summary');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to tailor resume');
    } finally {
      setTailoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Tailor Resume for Job</h2>
              <p className="text-[10px] text-slate-500">Analyze description and create a targeted version</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Required Skills (Comma separated)</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={requiredSkillsStr}
                onChange={e => setRequiredSkillsStr(e.target.value)}
                placeholder="e.g. React, TypeScript, Tailwind"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Job Description *</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={4}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </div>

          {!analysisResult ? (
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !jobTitle.trim() || !jobDescription.trim()}
              className="w-full py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {analyzing ? 'Analyzing Match...' : 'Analyze Match'}
            </button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">Keyword Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <h4 className="text-[11px] font-bold text-emerald-800 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.matchedSkills.length > 0 ? analysisResult.matchedSkills.map(s => (
                      <span key={s} className="px-2 py-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded">{s}</span>
                    )) : <span className="text-[10px] text-emerald-600/70">None</span>}
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <h4 className="text-[11px] font-bold text-amber-800 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.missingSkills.length > 0 ? analysisResult.missingSkills.map(s => (
                      <span key={s} className="px-2 py-1 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">{s}</span>
                    )) : <span className="text-[10px] text-amber-600/70">None</span>}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
                <h4 className="text-xs font-bold text-violet-900 mb-1">AI Tailoring</h4>
                <p className="text-[10px] text-violet-700 mb-3">
                  Generate a new resume version specifically tailored for this job. AI will rewrite your professional summary to highlight your most relevant skills for this position.
                </p>
                <button
                  onClick={handleTailor}
                  disabled={tailoring || !isAIConfigured()}
                  className="w-full py-2 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {tailoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {tailoring ? 'Generating Tailored Resume...' : 'Create Tailored Version'}
                </button>
                {!isAIConfigured() && (
                  <p className="text-center text-[10px] text-red-500 mt-2">Requires Gemini API Key in .env</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
