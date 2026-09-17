import React, { useState, useEffect } from 'react';
import { 
  JobListing, 
  StudentProfile, 
  JobApplication, 
  RejectionFeedbackRecord, 
  JobSourceChannel,
  ApplicationStatus 
} from '../../types.ts';
import { api } from '../../lib/api.ts';
import { 
  SourceChannelBadge, 
  EligibilityBadge, 
  ApplicationStatusBadge,
  MatchVerdictBadge 
} from '../common/StatusBadge.tsx';
import { 
  Briefcase, 
  Filter, 
  Search, 
  Plus, 
  Users, 
  AlertTriangle, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Building2, 
  Sparkles,
  ExternalLink,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface PlacementOperationsProps {
  onRefreshData?: () => void;
}

export const PlacementOperations: React.FC<PlacementOperationsProps> = ({ onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'applications' | 'rejections'>('candidates');

  // Data
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [rejections, setRejections] = useState<RejectionFeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Hierarchical Filters: School -> Program -> Batch -> Student Search
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [inactivityOnly, setInactivityOnly] = useState<boolean>(false);

  // Candidate Match Drawer
  const [matchingJob, setMatchingJob] = useState<JobListing | null>(null);
  const [rankedCandidates, setRankedCandidates] = useState<{ student: StudentProfile; match: any }[]>([]);

  // Create Job Modal
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Kochi, Kerala, India (Hybrid)');
  const [newSourceChannel, setNewSourceChannel] = useState<JobSourceChannel>('PLACEMENT_DIRECT');
  const [newReferralName, setNewReferralName] = useState('');
  const [newRequiredSkills, setNewRequiredSkills] = useState('React, Node.js, PostgreSQL');
  const [newSalary, setNewSalary] = useState('₹8,00,000 - ₹12,00,000 / annum');
  const [newDescription, setNewDescription] = useState('');

  // Interview Scheduling Modal
  const [schedulingApp, setSchedulingApp] = useState<JobApplication | null>(null);
  const [interviewTitle, setInterviewTitle] = useState('Technical Round 1');
  const [interviewDate, setInterviewDate] = useState('2026-03-05T14:00');

  const loadData = async () => {
    setLoading(true);
    try {
      const [jRes, sRes, aRes, rRes] = await Promise.all([
        api.getJobs(),
        api.getStudents(),
        api.getApplications(),
        api.getRejectionFeedbacks()
      ]);
      setJobs(jRes.jobs);
      setStudents(sRes.students);
      setApplications(aRes.applications);
      setRejections(rRes.feedbackRecords);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter eligible students
  const eligibleCandidates = students.filter(s => 
    s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE'
  );

  // Distinct Filter options
  const schools = Array.from(new Set(eligibleCandidates.map(s => s.school)));
  const programs = Array.from(
    new Set(
      eligibleCandidates
        .filter(s => selectedSchool === 'ALL' || s.school === selectedSchool)
        .map(s => s.program)
    )
  );
  const batches = Array.from(
    new Set(
      eligibleCandidates
        .filter(s => (selectedSchool === 'ALL' || s.school === selectedSchool) && (selectedProgram === 'ALL' || s.program === selectedProgram))
        .map(s => s.batch)
    )
  );

  // Filtered student list
  const filteredCandidates = eligibleCandidates.filter(s => {
    if (selectedSchool !== 'ALL' && s.school !== selectedSchool) return false;
    if (selectedProgram !== 'ALL' && s.program !== selectedProgram) return false;
    if (selectedBatch !== 'ALL' && s.batch !== selectedBatch) return false;
    if (studentSearch && !s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) && !s.academic.skills.some(sk => sk.toLowerCase().includes(studentSearch.toLowerCase()))) {
      return false;
    }
    if (inactivityOnly) {
      const hasApps = applications.some(a => a.studentId === s.id);
      const consecutiveRejections = s.inactivityFlags?.consecutiveRejections || 0;
      return !hasApps || consecutiveRejections > 0;
    }
    return true;
  });

  const handleOpenMatching = async (job: JobListing) => {
    setMatchingJob(job);
    try {
      const res = await api.getJobCandidates(job.id);
      setRankedCandidates(res.candidates);
    } catch (err: any) {
      alert(`Error loading candidates: ${err.message}`);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newCompany) return;

    try {
      const skillsArray = newRequiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const loc = newLocation.trim() || 'Kochi, Kerala, India';
      const finalLoc = /india/i.test(loc) ? loc : `${loc}, India`;

      await api.createJob({
        title: newJobTitle,
        company: newCompany,
        location: finalLoc,
        countryCode: 'IN',
        sourceChannel: newSourceChannel,
        referralSourceName: newSourceChannel === 'STAFF_REFERRAL' ? (newReferralName || 'Instructor Referral') : undefined,
        requiredSkills: skillsArray,
        preferredSkills: ['Git', 'Communication'],
        salaryRange: newSalary || '₹8,00,000 - ₹12,00,000 / annum',
        description: newDescription || `Exciting opportunity at ${newCompany}.`,
        eligibleSchools: selectedSchool !== 'ALL' ? [selectedSchool] : ['School of Tech'],
        eligiblePrograms: selectedProgram !== 'ALL' ? [selectedProgram] : ['Full Stack Web Development']
      });

      setShowCreateJob(false);
      setNewJobTitle('');
      setNewCompany('');
      setNewDescription('');
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Error creating job: ${err.message}`);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingApp) return;

    try {
      await api.scheduleInterview(schedulingApp.id, interviewTitle, interviewDate);
      setSchedulingApp(null);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Error scheduling interview: ${err.message}`);
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      await api.updateApplicationStatus(appId, status);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200 mb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-teal-600" />
              Career Operations Suite
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Team Dashboard</h1>
            <p className="text-slate-600 text-sm max-w-2xl mt-0.5">
              Source and tag jobs by channel, audit eligible candidate pools, match students using rule-based criteria, and track recruitment funnels.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCreateJob(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Post New Job Lead
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'candidates' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Users className="w-4 h-4" /> Eligible Candidate Pool ({eligibleCandidates.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'jobs' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Briefcase className="w-4 h-4" /> Job Leads & Channels ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'applications' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <BarChart3 className="w-4 h-4" /> Pipeline & Interviews ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('rejections')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'rejections' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <MessageSquare className="w-4 h-4" /> Rejection Feedback & Remedial ({rejections.length})
        </button>
      </div>

      {/* 1. CANDIDATES & MULTI-TIER FILTERING */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          
          {/* Multi-Tier Filter Bar: School -> Program -> Batch */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              Multi-Tier Candidate Hierarchy Filters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* School Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">1. School</label>
                <select
                  value={selectedSchool}
                  onChange={e => {
                    setSelectedSchool(e.target.value);
                    setSelectedProgram('ALL');
                    setSelectedBatch('ALL');
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="ALL">All Schools ({schools.length})</option>
                  {schools.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Program Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">2. Program</label>
                <select
                  value={selectedProgram}
                  onChange={e => {
                    setSelectedProgram(e.target.value);
                    setSelectedBatch('ALL');
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="ALL">All Programs ({programs.length})</option>
                  {programs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Batch Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">3. Batch / Cohort</label>
                <select
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="ALL">All Batches ({batches.length})</option>
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Search by Student / Skill */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">4. Student or Skill</label>
                <input
                  type="text"
                  placeholder="e.g. React, Ali..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Inactivity Audit Toggle */}
              <div className="flex items-end">
                <label className="w-full flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 text-xs">
                  <input
                    type="checkbox"
                    checked={inactivityOnly}
                    onChange={e => setInactivityOnly(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Flag Inactive / At-Risk
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Candidate Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                Showing {filteredCandidates.length} Active Eligible Candidates
              </span>
              <span className="text-slate-500">Only placement-eligible students are shown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">School & Program</th>
                    <th className="px-4 py-3">Academic & Attendance</th>
                    <th className="px-4 py-3">Key Skills</th>
                    <th className="px-4 py-3">Risk Audit</th>
                    <th className="px-4 py-3 text-right">Placement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCandidates.map(st => {
                    const studentApps = applications.filter(a => a.studentId === st.id);
                    const isPlaced = studentApps.some(a => a.status === 'SELECTED' || a.status === 'JOINED' || a.status === 'OFFER_RECEIVED');
                    const consecutiveRejections = st.inactivityFlags?.consecutiveRejections || 0;
                    const hasNeverApplied = studentApps.length === 0;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{st.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{st.registrationNo}</div>
                          <div className="text-[10px] text-slate-400">{st.email}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{st.school}</div>
                          <div className="text-[11px] text-slate-600">{st.program}</div>
                          <div className="text-[10px] text-teal-700 font-medium">Batch: {st.batch}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">Score: {st.academic.scores.gpaOrPercentage}%</div>
                          <div className={`text-[11px] ${st.academic.attendancePercentage < 85 ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                            Attendance: {st.academic.attendancePercentage}%
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {st.academic.skills.slice(0, 4).map(sk => (
                              <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {sk}
                              </span>
                            ))}
                            {st.academic.skills.length > 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                +{st.academic.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {hasNeverApplied ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Never applied (Eligible)
                            </span>
                          ) : consecutiveRejections > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> {consecutiveRejections} Rejections
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active Pipeline ({studentApps.length} apps)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isPlaced ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PLACED
                            </span>
                          ) : (
                            <EligibilityBadge status={st.eligibilityStatus} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. JOB LEADS & SOURCING CHANNELS */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Channel metric quick cards */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-800">Placement Team Direct</span>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold">Highest Conversion</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {jobs.filter(j => j.sourceChannel === 'PLACEMENT_DIRECT').length} Opportunities
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Direct corporate partnerships and recruiter outreach</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-800">Staff Referrals</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold">High Intent</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {jobs.filter(j => j.sourceChannel === 'STAFF_REFERRAL').length} Opportunities
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Leads provided by internal instructors (Haris, Rizwan)</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-800">AI Job Scraper Agent</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">Apify Automated</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {jobs.filter(j => j.sourceChannel === 'AI_JOB_SCRAPER').length} Opportunities
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Scraped leads from LinkedIn, Rozee.pk, and Indeed</p>
            </div>
          </div>

          {/* Job Listings Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Active Job Directory</span>
              <span className="text-slate-500">{jobs.length} Opportunities Tracked</span>
            </div>

            <div className="divide-y divide-slate-200">
              {jobs.map(job => (
                <div key={job.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{job.title}</span>
                      <span className="text-xs text-slate-500 font-medium">@ {job.company}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({job.jobCode})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-800">{job.salaryRange}</span>
                      <span>•</span>
                      <span>{job.experienceRequirement}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <SourceChannelBadge channel={job.sourceChannel} />
                      {job.referralSourceName && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                          Ref: {job.referralSourceName}
                        </span>
                      )}
                      <span className="text-slate-300">|</span>
                      {job.requiredSkills.map(sk => (
                        <span key={sk} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenMatching(job)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Match Candidates
                    </button>
                    {job.externalUrl && (
                      <a
                        href={job.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="View external link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PIPELINE & INTERVIEWS */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Live Application Tracking Pipeline</span>
            <span className="text-slate-500">{applications.length} Submissions Across Cohorts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Application Status</th>
                  <th className="px-4 py-3">Interview Schedule</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{app.studentName}</div>
                      <div className="text-[11px] text-slate-500">{app.school} • {app.batch}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{app.jobTitle}</div>
                      <div className="text-[11px] text-slate-500">{app.company}</div>
                    </td>

                    <td className="px-4 py-3">
                      <SourceChannelBadge channel={app.sourceChannel} />
                    </td>

                    <td className="px-4 py-3">
                      <ApplicationStatusBadge status={app.status} />
                    </td>

                    <td className="px-4 py-3">
                      {app.interviewDates.length > 0 ? (
                        <div className="space-y-1">
                          {app.interviewDates.map((iv, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3 text-teal-600" />
                              Round {iv.round}: {new Date(iv.date).toLocaleDateString()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No interviews yet</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setSchedulingApp(app)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold hover:underline"
                      >
                        + Schedule Round
                      </button>

                      <select
                        value={app.status}
                        onChange={e => handleUpdateAppStatus(app.id, e.target.value as ApplicationStatus)}
                        className="text-[11px] border border-slate-300 rounded px-1.5 py-1 bg-white"
                      >
                        <option value="APPLIED">Applied</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                        <option value="INTERVIEWED">Interviewed</option>
                        <option value="SELECTED">Selected / Offer</option>
                        <option value="JOINED">Joined (Placed)</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. REJECTION FEEDBACK & REMEDIAL PLANNING */}
      {activeTab === 'rejections' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Mandatory Rejection Feedback & Remedial Planning</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Rejection feedback allows placement officers to diagnose skill gaps and organize remedial sessions.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
            {rejections.map(rf => (
              <div key={rf.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rf.studentName}</span>
                    <span className="text-xs text-slate-500">applied to <strong className="text-slate-800">{rf.jobTitle}</strong> @ {rf.company}</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200">
                    Category: {rf.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700 border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Student Rejection Feedback:</strong>
                  "{rf.details}"
                </div>

                <div className="bg-blue-50/50 p-3 rounded-lg text-xs text-blue-900 border border-blue-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-blue-950">Targeted Remedial Intervention:</strong>
                    {rf.remedialActionNeeded}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CANDIDATE MATCH DRAWER / MODAL */}
      {matchingJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Rule-Based Candidate Match</span>
                <h3 className="text-base font-bold">{matchingJob.title} @ {matchingJob.company}</h3>
                <div className="text-xs text-slate-300">Required: {matchingJob.requiredSkills.join(', ')}</div>
              </div>
              <button onClick={() => setMatchingJob(null)} className="text-slate-400 hover:text-white text-sm">✕ Close</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <p className="text-xs text-slate-500">
                Candidates ranked using Phase 1 deterministic rule evaluation: School & Program alignment, skill overlap, and academic indicators.
              </p>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                {rankedCandidates.map(({ student, match }) => (
                  <div key={student.id} className="p-3.5 hover:bg-slate-50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
                        <span className="text-slate-500 ml-1.5">({student.school} • {student.program})</span>
                      </div>
                      <MatchVerdictBadge verdict={match.verdict} score={match.matchScore} />
                    </div>

                    <p className="text-slate-600 text-[11px]">{match.explanation}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                      <span className="text-emerald-700 font-semibold">
                        Matched: {match.matchedSkills.join(', ') || 'None'}
                      </span>
                      {match.missingSkills.length > 0 && (
                        <span className="text-rose-700 font-semibold">
                          Missing: {match.missingSkills.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setMatchingJob(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close Match View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST NEW JOB MODAL */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Post New Job Lead</h3>
              <button onClick={() => setShowCreateJob(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineer"
                    value={newJobTitle}
                    onChange={e => setNewJobTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Careem Technologies"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mandatory Source Channel</label>
                  <select
                    value={newSourceChannel}
                    onChange={e => setNewSourceChannel(e.target.value as JobSourceChannel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="PLACEMENT_DIRECT">Placement Team Direct</option>
                    <option value="STAFF_REFERRAL">Staff Referral (Haris, Rizwan, etc.)</option>
                    <option value="AI_JOB_SCRAPER">AI Job Scraper Agent (Apify)</option>
                  </select>
                </div>
                {newSourceChannel === 'STAFF_REFERRAL' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Staff Referrer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Haris (Senior Instructor)"
                      value={newReferralName}
                      onChange={e => setNewReferralName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Location / Mode</label>
                    <input
                      type="text"
                      placeholder="e.g. Kochi, Kerala / Bangalore (Hybrid)"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Tailwind CSS, PostgreSQL"
                  value={newRequiredSkills}
                  onChange={e => setNewRequiredSkills(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salary / Stipend (INR)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹8,00,000 - ₹12,00,000 / annum"
                  value={newSalary}
                  onChange={e => setNewSalary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of duties and candidate profile..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateJob(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold"
                >
                  Save & Tag Job Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {schedulingApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Schedule Interview Round</h3>
            <p className="text-xs text-slate-500">
              For {schedulingApp.studentName} applying to {schedulingApp.jobTitle} @ {schedulingApp.company}
            </p>

            <form onSubmit={handleScheduleInterview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interview Round Title</label>
                <input
                  type="text"
                  placeholder="e.g. Technical Round 1 - Live Coding"
                  value={interviewTitle}
                  onChange={e => setInterviewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={e => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSchedulingApp(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold"
                >
                  Confirm Interview Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
