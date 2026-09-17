import React, { useState, useEffect } from 'react';
import { JobListing, StudentProfile, JobMatchResult } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { EligibilityBadge, MatchVerdictBadge } from '../common/StatusBadge.tsx';
import { 
  Briefcase, 
  Users, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  Send, 
  Building2, 
  MapPin, 
  GraduationCap,
  ExternalLink
} from 'lucide-react';

interface CandidateMatchingViewProps {
  onRefreshData?: () => void;
}

export const CandidateMatchingView: React.FC<CandidateMatchingViewProps> = ({ onRefreshData }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<{ student: StudentProfile; match: JobMatchResult }[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [applyingStudentId, setApplyingStudentId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const res = await api.getJobs();
        const active = res.jobs.filter(j => j.status === 'ACTIVE');
        setJobs(active);
        if (active.length > 0) {
          setSelectedJobId(active[0].id);
        }
      } catch (err) {
        console.error('Failed to load jobs for matching:', err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // Load candidate matches for selected job
  useEffect(() => {
    if (!selectedJobId) return;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      setActionSuccess(null);
      try {
        const res = await api.getJobCandidates(selectedJobId);
        setCandidates(res.candidates || []);
      } catch (err) {
        console.error('Failed to load candidates for job:', err);
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, [selectedJobId]);

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const handleForwardCandidate = async (student: StudentProfile) => {
    if (!selectedJob) return;
    setApplyingStudentId(student.id);
    try {
      await api.applyForJob(selectedJob.id, student.id);
      setActionSuccess(`Application submitted for ${student.fullName} to ${selectedJob.company}`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setApplyingStudentId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Candidate Matching
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic skill & criteria alignment between eligible candidates and active job requisitions
        </p>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Job Selector Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select Technology Requisition / Active Job Opening:
        </label>
        
        <div className="relative">
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 appearance-none pr-10 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
          >
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                [{job.category || 'Technology'}] {job.title} — {job.company} ({job.location})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {selectedJob && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-600 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-900">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {selectedJob.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedJob.location} · {selectedJob.employmentType || 'FULL_TIME'}
              </span>
              {selectedJob.category && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100 text-[10px]">
                  {selectedJob.category}
                </span>
              )}
              {selectedJob.normalizedDesignation && (
                <span className="text-[11px] text-slate-500">
                  Target Role: <strong className="text-slate-700">{selectedJob.normalizedDesignation}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-slate-400">Required Skills:</span>
              {selectedJob.requiredSkills.map(s => (
                <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommended Candidates List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recommended Candidates</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by Designation (40%), Skills (35%), Program (15%), and Experience (10%)
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
            {candidates.length} Matches Found
          </span>
        </div>

        {loadingCandidates ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Calculating student compatibility scores...
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No candidates matched the required criteria for this requisition.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {candidates.map(({ student, match }) => {
              const isApplying = applyingStudentId === student.id;
              const matchScore = match.matchScore ?? 75;
              const matchLevel = match.matchLevel ?? (matchScore >= 80 ? 'Excellent Match' : matchScore >= 65 ? 'Good Match' : 'Partial Match');

              return (
                <div key={student.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Candidate Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{student.fullName}</span>
                      <span className="text-xs text-slate-400">({student.registrationNo})</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Role: {student.designation || 'Designation not available'}
                      </span>
                      <EligibilityBadge status={student.eligibilityStatus} />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        matchScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        matchScore >= 65 ? 'bg-blue-100 text-blue-800' :
                        matchScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {matchLevel}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      {student.school} · <span className="text-slate-700 font-medium">{student.program}</span>
                    </div>

                    {/* 4-Factor Transparent Match Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Designation ({match.designationScore ?? 0}/40)</span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {match.designationExplanation || (match.designationMatch ? '✓ Aligned Role' : 'Partial Match')}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Skills ({match.skillsScore ?? 0}/35)</span>
                        <span className="font-semibold text-emerald-700 truncate block mt-0.5">
                          ✓ {(match.matchedSkills || []).slice(0, 3).join(', ') || 'Aligned'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Program ({match.programScore ?? 0}/15)</span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {match.programExplanation || student.program}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Experience ({match.experienceScore ?? 0}/10)</span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {match.experienceExplanation || '✓ Suitable for 0-1 yr'}
                        </span>
                      </div>
                    </div>

                    {/* Skills pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
                      {match.matchedSkills && match.matchedSkills.length > 0 && (
                        <span className="text-emerald-700 font-medium">
                          Matched: {match.matchedSkills.join(', ')}
                        </span>
                      )}
                      {match.missingSkills && match.missingSkills.length > 0 && (
                        <span className="text-amber-700 font-medium ml-2">
                          ⚠ Missing: {match.missingSkills.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Score & Action */}
                  <div className="shrink-0 flex sm:flex-col items-end justify-between gap-3 sm:gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-black ${
                        matchScore >= 80 ? 'text-emerald-700' : matchScore >= 65 ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {matchScore}%
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Match</span>
                    </div>

                    <button
                      disabled={isApplying}
                      onClick={() => handleForwardCandidate(student)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isApplying ? 'Submitting...' : 'Forward to Recruiter'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
