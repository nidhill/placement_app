import React, { useState, useEffect } from 'react';
import { 
  StudentProfile, 
  JobApplication, 
  JobMatchResult, 
  RejectionCategory 
} from '../../types.ts';
import { api } from '../../lib/api.ts';
import { 
  EligibilityBadge, 
  ApplicationStatusBadge, 
  MatchVerdictBadge, 
  SourceChannelBadge 
} from '../common/StatusBadge.tsx';
import { 
  Lock, 
  Sparkles, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  Send, 
  Clock, 
  GraduationCap,
  MessageSquare,
  Globe,
  Linkedin
} from 'lucide-react';

interface StudentDashboardProps {
  currentStudentId: string;
  onRefreshData?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentStudentId, onRefreshData }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<JobMatchResult[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGated, setIsGated] = useState(false);
  const [gateReason, setGateReason] = useState('');

  // Editable Profile Links
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linksSaved, setLinksSaved] = useState(false);

  // Mandatory Rejection Feedback Modal
  const [rejectionModalApp, setRejectionModalApp] = useState<JobApplication | null>(null);
  const [rejectionCategory, setRejectionCategory] = useState<RejectionCategory>('TECHNICAL_SKILL_GAP');
  const [rejectionDetails, setRejectionDetails] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const pRes = await api.getStudent(currentStudentId);
      setProfile(pRes.student);
      setResumeUrl(pRes.student.resumeUrl || '');
      setPortfolioUrl(pRes.student.portfolioUrl || '');
      setLinkedinUrl(pRes.student.linkedinUrl || '');

      const eligible = pRes.student.eligibilityStatus === 'ELIGIBLE' || pRes.student.eligibilityStatus === 'ADMIN_OVERRIDE';
      if (!eligible) {
        setIsGated(true);
        setGateReason(
          pRes.student.evaluationNotes || 
          'Student is awaiting placement eligibility approval by Admin.'
        );
        return;
      }

      setIsGated(false);

      // Load applications and recommended jobs
      const [appRes, recRes] = await Promise.all([
        api.getApplications({ studentId: currentStudentId }),
        api.getStudentRecommendations(currentStudentId)
      ]);

      setApplications(appRes.applications);
      setRecommendations(recRes.recommendations);
    } catch (err: any) {
      if (err.status === 403 || err.data?.error?.includes('GATED')) {
        setIsGated(true);
        setGateReason(err.data?.reason || err.data?.error || 'Student placement access is locked.');
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [currentStudentId]);

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await api.updateStudent(profile.id, {
        resumeUrl,
        portfolioUrl,
        linkedinUrl
      });
      setLinksSaved(true);
      setTimeout(() => setLinksSaved(false), 3000);
    } catch (err: any) {
      alert(`Error updating profile: ${err.message}`);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!profile) return;
    try {
      await api.applyForJob(jobId, profile.id);
      loadStudentData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to apply: ${err.message}`);
    }
  };

  const handleSubmitRejectionFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalApp || !rejectionDetails) return;

    try {
      await api.submitRejectionFeedback({
        applicationId: rejectionModalApp.id,
        category: rejectionCategory,
        details: rejectionDetails,
        remedialActionNeeded: 'SSHO remedial session requested by student candidate.'
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackSuccess(false);
        setRejectionModalApp(null);
        setRejectionDetails('');
      }, 1500);
      loadStudentData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Error submitting feedback: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
        Authenticating candidate profile and verifying mentor eligibility gate...
      </div>
    );
  }

  // -------------------------------------------------------------
  // GATED ACCESS STATE: PRD SECTION 1 & 2 REQUIREMENT
  // -------------------------------------------------------------
  if (isGated && profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Prominent Gated Screen */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-md p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Access Gated (403 Forbidden)</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Placement Portal Locked</h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2">
              Hello <strong className="text-slate-900">{profile.fullName}</strong>. Student accounts require Placement Eligibility approval by Main Admin before jobs can be viewed or applied for.
            </p>
          </div>

          <div className="inline-block">
            <EligibilityBadge status={profile.eligibilityStatus} className="text-sm px-3.5 py-1.5" />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left max-w-lg mx-auto space-y-2 text-xs">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Administrative Eligibility Remarks:
            </div>
            <p className="text-slate-700 italic bg-white p-2.5 rounded border border-slate-200">
              "{gateReason}"
            </p>
          </div>
        </div>

        {/* Academic Eligibility Audit Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Your Academic Criteria Audit</h3>
          <p className="text-xs text-slate-500">
            Compare your current LMS indicators against the placement eligibility criteria:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Attendance Rate</span>
              <span className={`text-xl font-bold mt-1 block ${profile.academic.attendancePercentage < 85 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {profile.academic.attendancePercentage}%
              </span>
              <span className="text-[11px] text-slate-400">
                {profile.academic.attendancePercentage < 85 ? '⚠️ Below 85% minimum cutoff' : '✓ Meets requirement'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Academic Grade</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {profile.academic.scores.gpaOrPercentage}%
              </span>
              <span className="text-[11px] text-slate-400">
                Assignments: {profile.academic.scores.assignmentsCompleted} / {profile.academic.scores.totalAssignments}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Capstone Projects</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {profile.academic.projects.length} Submitted
              </span>
              <span className="text-[11px] text-slate-400">
                Requires mentor code review
              </span>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // APPROVED & ELIGIBLE STUDENT DASHBOARD
  // -------------------------------------------------------------
  if (!profile) return null;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Candidate Workspace
              </span>
              <EligibilityBadge status={profile.eligibilityStatus} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome, {profile.fullName}</h1>
            <p className="text-slate-600 text-xs">
              {profile.school} • {profile.program} • Batch {profile.batch} ({profile.registrationNo})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-medium block uppercase">Active Applications</span>
              <span className="text-lg font-bold text-slate-900">{applications.length}</span>
            </div>
            <div className="px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-medium block uppercase">Offers / Placed</span>
              <span className="text-lg font-bold text-emerald-800">
                {applications.filter(a => a.status === 'SELECTED' || a.status === 'JOINED' || a.status === 'OFFER_RECEIVED').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Recommended Jobs & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Rule-Based Recommended Jobs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Recommended Job Opportunities
                </h3>
                <p className="text-xs text-slate-500">
                  Matches derived deterministically from your program and verified skills
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">{recommendations.length} Matched Leads</span>
            </div>

            <div className="divide-y divide-slate-200">
              {recommendations.map(rec => {
                const isAlreadyApplied = applications.some(a => a.jobId === rec.job.id);

                return (
                  <div key={rec.job.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{rec.job.title}</span>
                        <span className="text-xs text-slate-500 ml-1.5 font-medium">@ {rec.job.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SourceChannelBadge channel={rec.job.sourceChannel} />
                        <MatchVerdictBadge verdict={rec.verdict} score={rec.matchScore} />
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      <span>{rec.job.location}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">{rec.job.salaryRange}</span>
                      <span>•</span>
                      <span>{rec.job.experienceRequirement}</span>
                    </div>

                    {/* Match Explanation */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900 block mb-0.5">Match Analysis:</span>
                      {rec.explanation}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {rec.matchedSkills.map(sk => (
                          <span key={sk} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            ✓ {sk}
                          </span>
                        ))}
                        {rec.missingSkills.map(sk => (
                          <span key={sk} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium border border-rose-200">
                            Missing: {sk}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleApply(rec.job.id)}
                        disabled={isAlreadyApplied}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${isAlreadyApplied ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'}`}
                      >
                        {isAlreadyApplied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> 1-Click Apply
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Applications & Interview Schedule */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">My Active Applications ({applications.length})</h3>
                <p className="text-xs text-slate-500">Live recruitment progress and scheduled interviews</p>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  You have not submitted any applications yet. Review your recommended jobs above to apply!
                </div>
              ) : (
                applications.map(app => {
                  const isRejected = app.status === 'REJECTED';

                  return (
                    <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{app.jobTitle}</span>
                          <span className="text-xs text-slate-500 ml-1.5">@ {app.company}</span>
                        </div>
                        <ApplicationStatusBadge status={app.status} />
                      </div>

                      {/* Scheduled Interviews */}
                      {app.interviewDates.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
                          <span className="font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-teal-700" /> Scheduled Interview Rounds:
                          </span>
                          {app.interviewDates.map((iv, idx) => (
                            <div key={idx} className="text-[11px] pl-5">
                              • Round {iv.round}: {new Date(iv.date).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rejection Feedback Action Prompt */}
                      {isRejected && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold block">Application Not Selected</span>
                            <span className="text-[11px] text-rose-700">
                              HACA requires rejection feedback to arrange remedial SSHO sessions for you.
                            </span>
                          </div>
                          <button
                            onClick={() => setRejectionModalApp(app)}
                            className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold whitespace-nowrap self-start sm:self-center"
                          >
                            Submit Rejection Feedback
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Profile Links & Academic Portfolio */}
        <div className="space-y-6">
          
          {/* Profile Links Editor */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Placement Profile Links</h3>
              <p className="text-xs text-slate-500 mt-0.5">Shared directly with recruiters when you apply</p>
            </div>

            <form onSubmit={handleSaveLinks} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Resume / CV Link (Drive / PDF)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={resumeUrl}
                  onChange={e => setResumeUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-500" /> Portfolio Website
                </label>
                <input
                  type="url"
                  placeholder="https://myportfolio.dev"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5 text-slate-500" /> LinkedIn Profile
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                {linksSaved ? '✓ Profile Links Saved' : 'Update Portfolio Links'}
              </button>
            </form>
          </div>

          {/* Academic LMS Profile Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" /> Verified LMS Record
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Synchronized from HACA LMS</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Attendance</span>
                  <span className="font-bold text-sm text-slate-900">{profile.academic.attendancePercentage}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Grade / Score</span>
                  <span className="font-bold text-sm text-slate-900">{profile.academic.scores.gpaOrPercentage}%</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold mb-1 uppercase">Acquired Skills</span>
                <div className="flex flex-wrap gap-1">
                  {profile.academic.skills.map(sk => (
                    <span key={sk} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block font-semibold mb-1 uppercase">Verified Capstones</span>
                <div className="space-y-1.5">
                  {profile.academic.projects.map(p => (
                    <div key={p.id} className="p-2 rounded bg-slate-50 border border-slate-200">
                      <div className="font-semibold text-slate-900 text-[11px]">{p.title}</div>
                      <div className="text-slate-500 text-[10px] line-clamp-1">{p.description}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* MANDATORY REJECTION FEEDBACK MODAL */}
      {rejectionModalApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-rose-700 uppercase">Mandatory Feedback Loop</span>
                <h3 className="font-bold text-slate-900 text-base">Rejection Diagnostic Form</h3>
              </div>
              <button onClick={() => setRejectionModalApp(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Provide feedback on your interview/application with <strong>{rejectionModalApp.jobTitle}</strong> @ {rejectionModalApp.company}. This directly guides the placement team in scheduling tailored support.
            </p>

            {feedbackSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                ✓ Feedback recorded! The placement team will review this for remedial support.
              </div>
            ) : (
              <form onSubmit={handleSubmitRejectionFeedback} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Root Cause Category</label>
                  <select
                    value={rejectionCategory}
                    onChange={e => setRejectionCategory(e.target.value as RejectionCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="TECHNICAL_SKILL_GAP">Technical Skill Gap (Coding / Concepts)</option>
                    <option value="COMMUNICATION_GAP">Communication / Soft Skills Gap</option>
                    <option value="PROJECT_GAP">Project / Portfolio Depth Gap</option>
                    <option value="EXPERIENCE_GAP">Prior Work Experience Gap</option>
                    <option value="EXPECTATION_MISMATCH">Compensation / Role Expectation Mismatch</option>
                    <option value="OTHER">Other Institutional Factor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Detailed Notes (What questions or challenges did you encounter?)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Interviewer asked advanced questions about database indexing and state machines which were not covered in my capstone..."
                    value={rejectionDetails}
                    onChange={e => setRejectionDetails(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectionModalApp(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold"
                  >
                    Submit Rejection Diagnostic
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
