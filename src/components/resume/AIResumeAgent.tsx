// ──────────────────────────────────────────────────────────────────────────────
// AI Resume Agent — Main Page Component
// ──────────────────────────────────────────────────────────────────────────────
// Split layout: Editor (left) + Live Preview (right). Manages resume state,
// version switching, auto-save, template selection, and PDF download.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudentProfile } from '../../types';
import {
  ResumeData,
  ResumeVersion,
  ResumeTemplate,
  SaveStatus,
  ATSAnalysisResult,
} from './types';
import {
  loadAllVersions,
  createVersion,
  updateVersion,
  deleteVersion,
  prefillFromProfile,
  calculateCompleteness,
} from './resumeStore';
import { analyzeResume } from './aiService';

// Section editors
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { SummarySection } from './sections/SummarySection';
import { EducationSection } from './sections/EducationSection';
import { SkillsSection } from './sections/SkillsSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { CertificationsSection } from './sections/CertificationsSection';
import { AchievementsSection } from './sections/AchievementsSection';
import { LanguagesSection } from './sections/LanguagesSection';

// Preview & Analysis
import { ResumePreview } from './ResumePreview';
import { ATSAnalyzer } from './ATSAnalyzer';
import { JobTailorModal } from './JobTailorModal';

import {
  FileText,
  Download,
  ShieldCheck,
  Eye,
  EyeOff,
  Palette,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Target,
  Save
} from 'lucide-react';

interface Props {
  studentId: string;
  profile: StudentProfile;
  onBack?: () => void;
}

export const AIResumeAgent: React.FC<Props> = ({ studentId, profile, onBack }) => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate>('classic');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showPreview, setShowPreview] = useState(true);
  const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [showNewVersionInput, setShowNewVersionInput] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ─── Load / Init ────────────────────────────────────────────────────────────

  useEffect(() => {
    const allVersions = loadAllVersions(studentId);
    if (allVersions.length === 0) {
      // First time: create a default version pre-filled from profile
      const initialData = prefillFromProfile(profile);
      const v = createVersion(studentId, 'General Resume', profile.designation || 'General', 'classic', initialData);
      setVersions([v]);
      setActiveVersionId(v.id);
      setResumeData(v.data);
      setTemplate(v.template);
    } else {
      setVersions(allVersions);
      const defaultV = allVersions.find(v => v.isDefault) || allVersions[0];
      setActiveVersionId(defaultV.id);
      setResumeData(defaultV.data);
      setTemplate(defaultV.template);
    }
  }, [studentId]);

  // ─── Auto-Save ──────────────────────────────────────────────────────────────

  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('unsaved');
    saveTimerRef.current = setTimeout(() => {
      if (!activeVersionId || !resumeData) return;
      try {
        const allVersions = loadAllVersions(studentId);
        const idx = allVersions.findIndex(v => v.id === activeVersionId);
        if (idx >= 0) {
          allVersions[idx] = { ...allVersions[idx], data: resumeData, template, updatedAt: new Date().toISOString() };
          localStorage.setItem(`haca_resume_${studentId}`, JSON.stringify(allVersions));
          setVersions(allVersions);
        }
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 800);
  }, [activeVersionId, resumeData, template, studentId]);

  useEffect(() => {
    if (resumeData && activeVersionId) {
      scheduleAutoSave();
    }
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [resumeData, template]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const updateData = (updater: (prev: ResumeData) => ResumeData) => {
    setResumeData(prev => prev ? updater(prev) : prev);
  };

  const switchVersion = (versionId: string) => {
    const v = versions.find(ver => ver.id === versionId);
    if (!v) return;
    setActiveVersionId(v.id);
    setResumeData(v.data);
    setTemplate(v.template);
    setShowVersionMenu(false);
  };

  const handleCreateVersion = () => {
    const title = newVersionTitle.trim() || 'New Resume';
    const initialData = prefillFromProfile(profile);
    const v = createVersion(studentId, title, profile.designation || '', template, initialData);
    setVersions(loadAllVersions(studentId));
    switchVersion(v.id);
    setNewVersionTitle('');
    setShowNewVersionInput(false);
  };

  const handleDeleteVersion = (versionId: string) => {
    if (versions.length <= 1) return;
    if (!confirm('Delete this resume version?')) return;
    deleteVersion(studentId, versionId);
    const remaining = loadAllVersions(studentId);
    setVersions(remaining);
    if (activeVersionId === versionId && remaining.length > 0) {
      switchVersion(remaining[0].id);
    }
  };

  const handleAnalyze = () => {
    if (!resumeData) return;
    const result = analyzeResume(resumeData);
    setAtsResult(result);
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  // ─── Completeness ───────────────────────────────────────────────────────────
  const completeness = resumeData ? calculateCompleteness(resumeData) : { percentage: 0, missing: [] };
  const activeVersion = versions.find(v => v.id === activeVersionId);

  if (!resumeData) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading AI Resume Agent...
      </div>
    );
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #resume-preview-content, #resume-preview-content * { visibility: visible !important; }
          #resume-preview-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 20mm 18mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            transform: none !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* ─── Top Action Bar ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3">
              {onBack && (
                <button onClick={onBack} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-800">AI Resume Agent</h1>
                  <p className="text-[10px] text-slate-500">Build an ATS-friendly resume from your profile</p>
                </div>
              </div>
            </div>

            {/* Center: Version Selector */}
            <div className="relative">
              <button
                onClick={() => setShowVersionMenu(!showVersionMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[150px] truncate">{activeVersion?.title || 'Resume'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {showVersionMenu && (
                <div className="absolute top-full mt-1 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1">
                  {versions.map(v => (
                    <div key={v.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                      <button
                        onClick={() => switchVersion(v.id)}
                        className={`flex-1 text-left text-xs font-medium truncate ${v.id === activeVersionId ? 'text-primary font-bold' : 'text-slate-700'}`}
                      >
                        {v.title}
                        {v.isDefault && <span className="ml-1 text-[9px] text-slate-400">(Default)</span>}
                      </button>
                      {versions.length > 1 && (
                        <button onClick={() => handleDeleteVersion(v.id)} className="p-1 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1 px-2 pb-2">
                    {showNewVersionInput ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Resume title..."
                          value={newVersionTitle}
                          onChange={e => setNewVersionTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleCreateVersion(); }}
                          autoFocus
                        />
                        <button onClick={handleCreateVersion} className="px-2 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg">Create</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewVersionInput(true)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" /> New Version
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Save Status */}
              <span className="flex items-center gap-1 text-[10px] font-medium">
                {saveStatus === 'saved' && <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">Saved</span></>}
                {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 text-slate-400 animate-spin" /><span className="text-slate-500">Saving...</span></>}
                {saveStatus === 'unsaved' && <><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-amber-600">Unsaved</span></>}
                {saveStatus === 'error' && <><AlertCircle className="w-3 h-3 text-red-500" /><span className="text-red-600">Error</span></>}
              </span>

              {/* Completeness */}
              <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                completeness.percentage >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : completeness.percentage >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {completeness.percentage}%
              </span>

              {/* Template Toggle */}
              <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setTemplate('classic')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${template === 'classic' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                >
                  Classic
                </button>
                <button
                  onClick={() => setTemplate('modern')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${template === 'modern' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                >
                  Modern
                </button>
              </div>

              {/* Mobile preview toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="lg:hidden p-1.5 text-slate-500 hover:text-primary border border-slate-200 rounded-lg"
                title={showPreview ? 'Hide Preview' : 'Show Preview'}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              {/* Analyze */}
              <button
                onClick={() => setShowTailorModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
              >
                <Target className="w-3.5 h-3.5" /> Tailor for Job
              </button>

              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> ATS Check
              </button>

              {/* Download PDF */}
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Split Layout ──────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* LEFT: Editor */}
          <div className={`w-full ${showPreview ? 'lg:w-[45%]' : 'lg:w-full'} space-y-3 overflow-y-auto`} style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <PersonalInfoSection
              data={resumeData.personal}
              onChange={personal => updateData(d => ({ ...d, personal }))}
            />
            <SummarySection
              summary={resumeData.summary}
              resumeData={resumeData}
              onChange={summary => updateData(d => ({ ...d, summary }))}
            />
            <EducationSection
              education={resumeData.education}
              onChange={education => updateData(d => ({ ...d, education }))}
            />
            <SkillsSection
              skills={resumeData.skills}
              onChange={skills => updateData(d => ({ ...d, skills }))}
            />
            <ExperienceSection
              experience={resumeData.experience}
              onChange={experience => updateData(d => ({ ...d, experience }))}
            />
            <ProjectsSection
              projects={resumeData.projects}
              onChange={projects => updateData(d => ({ ...d, projects }))}
            />
            <CertificationsSection
              certifications={resumeData.certifications}
              onChange={certifications => updateData(d => ({ ...d, certifications }))}
            />
            <AchievementsSection
              achievements={resumeData.achievements}
              onChange={achievements => updateData(d => ({ ...d, achievements }))}
            />
            <LanguagesSection
              languages={resumeData.languages}
              onChange={languages => updateData(d => ({ ...d, languages }))}
            />
          </div>

          {/* RIGHT: Live Preview */}
          {showPreview && (
            <div
              className="w-full lg:w-[55%] overflow-y-auto bg-slate-100 rounded-2xl p-4"
              style={{ maxHeight: 'calc(100vh - 200px)', ['--resume-scale' as any]: '0.55' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Preview</p>
                <div className="flex items-center gap-2">
                  <div className="sm:hidden flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => setTemplate('classic')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${template === 'classic' ? 'bg-primary text-white' : 'text-slate-500'}`}
                    >
                      Classic
                    </button>
                    <button
                      onClick={() => setTemplate('modern')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${template === 'modern' ? 'bg-primary text-white' : 'text-slate-500'}`}
                    >
                      Modern
                    </button>
                  </div>
                </div>
              </div>
              <ResumePreview ref={previewRef} data={resumeData} template={template} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {atsResult && <ATSAnalyzer result={atsResult} onClose={() => setAtsResult(null)} />}
      {showTailorModal && (
        <JobTailorModal
          studentId={studentId}
          resumeData={resumeData}
          onClose={() => setShowTailorModal(false)}
          onTailored={(versionId) => {
            setVersions(loadAllVersions(studentId));
            switchVersion(versionId);
            setShowTailorModal(false);
          }}
        />
      )}
    </>
  );
};
