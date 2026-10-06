import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, RejectionCategory, HelpStatus, StudentProfile } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { applyLink } from '../../lib/text.ts';
import { ApplicationStatusBadge, SourceChannelBadge, HelpStatusBadge, EligibilityBadge } from '../common/StatusBadge.tsx';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  ChevronDown,
  UserCheck,
  FileText,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  Check,
  User as UserIcon,
  Download,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  ArrowDownUp
} from 'lucide-react';

interface ApplicationsTrackerProps {
  onRefreshData?: () => void;
}

export type DateFilterRange = 'ALL' | 'WEEK' | 'MONTH' | 'YEAR';
export type DateSortOrder = 'DESC' | 'ASC';

export const ApplicationsTracker: React.FC<ApplicationsTrackerProps> = ({ onRefreshData }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [helpFilter, setHelpFilter] = useState<string>('ALL');
  const [jobSourceFilter, setJobSourceFilter] = useState<'ALL' | 'HACA'>('ALL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterRange>('ALL');
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>('DESC');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail modal
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<JobApplication | null>(null);

  // Interview modal
  const [selectedAppForInterview, setSelectedAppForInterview] = useState<JobApplication | null>(null);
  const [interviewRoundTitle, setInterviewRoundTitle] = useState('Technical Screening Round 1');
  const [interviewDate, setInterviewDate] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Rejection modal
  const [selectedAppForRejection, setSelectedAppForRejection] = useState<JobApplication | null>(null);
  const [rejectionCategory, setRejectionCategory] = useState<RejectionCategory>('TECHNICAL_SKILL_GAP');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [remedialAction, setRemedialAction] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Student Profile & CV modal
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleOpenStudentProfile = async (app: JobApplication) => {
    setLoadingProfile(true);
    // Instant fallback profile from application data so modal opens immediately
    const fallbackProfile: StudentProfile = {
      id: app.studentId,
      registrationNo: app.studentId,
      fullName: app.studentName,
      email: app.studentEmail || '',
      phone: '',
      school: app.school,
      program: app.program,
      batch: app.batch,
      mentorId: '',
      mentorName: '',
      eligibilityStatus: 'ELIGIBLE',
      academic: {
        course: app.program,
        scores: { gpaOrPercentage: 0, assignmentsCompleted: 0, totalAssignments: 0 },
        attendancePercentage: 0,
        skills: [],
        projects: [],
        readinessGaps: { missingSkills: [], missingProjects: [], attendanceWarning: false }
      },
      inactivityFlags: { hasNotApplied: false, consecutiveRejections: 0, noInterviewFollowUp: false },
      createdAt: new Date().toISOString()
    };
    setSelectedStudentForProfile(fallbackProfile);

    try {
      if (app.studentId) {
        const res = await api.getStudent(app.studentId);
        if (res?.student) {
          setSelectedStudentForProfile(res.student);
          return;
        }
      }
    } catch {
      // Fallback: search in getStudents()
      try {
        const listRes = await api.getStudents();
        const found = listRes.students?.find(
          s => s.id === app.studentId || 
               s.fullName.toLowerCase() === app.studentName.toLowerCase() || 
               (s.email && app.studentEmail && s.email.toLowerCase() === app.studentEmail.toLowerCase())
        );
        if (found) {
          setSelectedStudentForProfile(found);
          return;
        }
      } catch (err2) {
        console.error('Failed to load student profile:', err2);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.getApplications();
      setApplications(res.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleUpdateHelpStatus = async (appId: string, helpStatus: HelpStatus) => {
    setApplications(prev => prev.map(a => a.id === appId ? {
      ...a,
      helpStatus,
      needsHelp: helpStatus !== 'RESOLVED'
    } : a));
    try {
      await api.updateHelpStatus(appId, helpStatus);
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to update help status: ${err.message}`);
      loadApplications();
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForInterview || !interviewDate) return;
    setScheduling(true);
    try {
      await api.scheduleInterview(selectedAppForInterview.id, {
        round: (selectedAppForInterview.interviewDates?.length || 0) + 1,
        title: interviewRoundTitle,
        date: new Date(interviewDate).toISOString()
      });
      setSelectedAppForInterview(null);
      setInterviewDate('');
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to schedule interview: ${err.message}`);
    } finally {
      setScheduling(false);
    }
  };

  const handleSubmitRejectionFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForRejection) return;
    setSubmittingFeedback(true);
    try {
      await api.submitRejectionFeedback(selectedAppForRejection.id, {
        category: rejectionCategory,
        details: rejectionNotes || 'Feedback noted during debrief.',
        remedialActionNeeded: remedialAction || 'Follow-up remedial coaching session.'
      });
      setSelectedAppForRejection(null);
      setRejectionNotes('');
      setRemedialAction('');
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to submit feedback: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Date filter evaluation helper
  const isApplicationInDateRange = (app: JobApplication, range: DateFilterRange): boolean => {
    if (range === 'ALL') return true;
    const timestamp = app.appliedAt || app.startedAt || app.confirmedAt || app.updatedAt;
    if (!timestamp) return false;
    const appDate = new Date(timestamp);
    if (isNaN(appDate.getTime())) return false;

    const now = new Date();
    if (range === 'WEEK') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return appDate >= startOfWeek || appDate >= sevenDaysAgo;
    }
    if (range === 'MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return appDate >= startOfMonth || appDate >= thirtyDaysAgo;
    }
    if (range === 'YEAR') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return appDate >= startOfYear || appDate >= yearAgo;
    }
    return true;
  };

  // Helper to distinguish HACA direct/internal jobs from third-party scraped/ATS tech jobs
  const isHacaApplication = (a: JobApplication): boolean => {
    if (a.sourceChannel) {
      return a.sourceChannel !== 'AI_JOB_SCRAPER' && a.sourceChannel !== 'ATS_JOB_API';
    }
    if (a.jobSource) {
      const src = a.jobSource.toLowerCase();
      if (src.includes('scraper') || src.includes('apify') || src.includes('ats')) {
        return false;
      }
    }
    return true;
  };

  // Applications scoped by active date timeframe and job source channel
  const baseScopedApps = applications.filter(a => {
    if (!isApplicationInDateRange(a, dateFilter)) return false;
    if (jobSourceFilter === 'HACA' && !isHacaApplication(a)) return false;
    return true;
  });

  // Pipeline counts (scoped to selected date timeframe and job source)
  const countStarted = baseScopedApps.filter(a => a.status === 'APPLICATION_STARTED').length;
  const countApplied = baseScopedApps.filter(a => a.status === 'APPLIED').length;
  const countNotApplied = baseScopedApps.filter(a => a.status === 'NOT_APPLIED').length;
  const countShortlisted = baseScopedApps.filter(a => a.status === 'SHORTLISTED').length;
  const countInterview = baseScopedApps.filter(a => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEWED').length;
  const countOffer = baseScopedApps.filter(a => a.status === 'OFFER_RECEIVED' || a.status === 'SELECTED').length;
  // Helper to check if an application has an active, unresolved help request
  const isHelpPending = (a: JobApplication): boolean => {
    if (a.helpStatus === 'RESOLVED') return false;
    if (a.helpStatus === 'HELP_REQUESTED' || a.helpStatus === 'IN_PROGRESS') return true;
    if (a.needsHelp && (!a.helpStatus || a.helpStatus === 'NONE')) return true;
    return false;
  };

  const countPlaced = baseScopedApps.filter(a => a.status === 'JOINED').length;
  const countHelpRequested = baseScopedApps.filter(a => isHelpPending(a)).length;

  const filteredApps = baseScopedApps.filter(a => {
    if (stageFilter !== 'ALL') {
      if (stageFilter === 'APPLICATION_STARTED' && a.status !== 'APPLICATION_STARTED') return false;
      if (stageFilter === 'APPLIED' && a.status !== 'APPLIED') return false;
      if (stageFilter === 'NOT_APPLIED' && a.status !== 'NOT_APPLIED') return false;
      if (stageFilter === 'SHORTLISTED' && a.status !== 'SHORTLISTED') return false;
      if (stageFilter === 'INTERVIEW' && a.status !== 'INTERVIEW_SCHEDULED' && a.status !== 'INTERVIEWED') return false;
      if (stageFilter === 'OFFER' && a.status !== 'OFFER_RECEIVED' && a.status !== 'SELECTED') return false;
      if (stageFilter === 'JOINED' && a.status !== 'JOINED') return false;
    }

    if (helpFilter !== 'ALL') {
      if (helpFilter === 'HELP_REQUESTED') {
        if (!isHelpPending(a)) return false;
      } else if (helpFilter === 'IN_PROGRESS' && a.helpStatus !== 'IN_PROGRESS') {
        return false;
      } else if (helpFilter === 'RESOLVED' && a.helpStatus !== 'RESOLVED') {
        return false;
      }
    }

    if (courseFilter !== 'ALL') {
      const prog = (a.program || '').toLowerCase();
      if (courseFilter === 'PYTHON') {
        if (!prog.includes('python')) return false;
      } else if (courseFilter === 'DATA_ANALYST') {
        if (!prog.includes('data') && !prog.includes('analyst')) return false;
      } else if (courseFilter === 'MERN') {
        if (!prog.includes('mern') && !prog.includes('react') && !prog.includes('node') && !prog.includes('full stack web')) return false;
      } else {
        if (!prog.includes(courseFilter.toLowerCase())) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.studentName.toLowerCase().includes(q);
      const matchJob = a.jobTitle.toLowerCase().includes(q);
      const matchComp = a.company.toLowerCase().includes(q);
      const matchBatch = a.batch ? a.batch.toLowerCase().includes(q) : false;
      const matchReason = a.declineReason ? a.declineReason.toLowerCase().includes(q) : false;
      if (!matchName && !matchJob && !matchComp && !matchBatch && !matchReason) return false;
    }
    return true;
  });

  // Helper to extract application date timestamp for chronological sorting
  const getApplicationTimestamp = (app: JobApplication): number => {
    const timestamp = app.appliedAt || app.confirmedAt || app.startedAt || app.createdAt || app.updatedAt;
    if (!timestamp) return 0;
    const time = new Date(timestamp).getTime();
    return isNaN(time) ? 0 : time;
  };

  // Chronologically sorted applications based on selected dateSortOrder (Last to First or First to Last)
  const sortedFilteredApps = [...filteredApps].sort((a, b) => {
    const timeA = getApplicationTimestamp(a);
    const timeB = getApplicationTimestamp(b);
    if (dateSortOrder === 'DESC') {
      return timeB - timeA;
    }
    return timeA - timeB;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Application Pipeline & External Tracking</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor student external job application progress, decline feedback, and assist students needing placement support.
        </p>
      </div>

      {/* Action Required Banner for Help Requests */}
      {countHelpRequested > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-xs">
                {countHelpRequested} Student Placement Help Request{countHelpRequested > 1 ? 's' : ''} Pending
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Students flagged that they need assistance with eligibility, resume, or portal issues while applying.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setHelpFilter('HELP_REQUESTED');
              setStageFilter('ALL');
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            View Pending Help Requests
          </button>
        </div>
      )}

      {/* Pipeline Stage Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <button
          onClick={() => {
            setHelpFilter('ALL');
            setStageFilter(stageFilter === 'APPLICATION_STARTED' && helpFilter === 'ALL' ? 'ALL' : 'APPLICATION_STARTED');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            stageFilter === 'APPLICATION_STARTED' && helpFilter === 'ALL' ? 'bg-primary text-white border-slate-900 shadow-sm' : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'APPLICATION_STARTED' && helpFilter === 'ALL' ? 'text-amber-400' : 'text-slate-500'}`}>
            Started
          </span>
          <span className="text-xl font-black mt-1 block">
            {countStarted}
          </span>
        </button>

        <button
          onClick={() => {
            setHelpFilter('ALL');
            setStageFilter(stageFilter === 'APPLIED' && helpFilter === 'ALL' ? 'ALL' : 'APPLIED');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            stageFilter === 'APPLIED' && helpFilter === 'ALL' ? 'bg-primary text-white border-slate-900 shadow-sm' : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'APPLIED' && helpFilter === 'ALL' ? 'text-blue-400' : 'text-slate-500'}`}>
            Applied
          </span>
          <span className="text-xl font-black mt-1 block">
            {countApplied}
          </span>
        </button>

        <button
          onClick={() => {
            setHelpFilter('ALL');
            setStageFilter(stageFilter === 'NOT_APPLIED' && helpFilter === 'ALL' ? 'ALL' : 'NOT_APPLIED');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            stageFilter === 'NOT_APPLIED' && helpFilter === 'ALL' ? 'bg-primary text-white border-slate-900 shadow-sm' : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'NOT_APPLIED' && helpFilter === 'ALL' ? 'text-rose-400' : 'text-slate-500'}`}>
            Not Applied
          </span>
          <span className="text-xl font-black mt-1 block text-rose-600">
            {countNotApplied}
          </span>
        </button>

        <button
          onClick={() => {
            setHelpFilter('ALL');
            setStageFilter(stageFilter === 'SHORTLISTED' && helpFilter === 'ALL' ? 'ALL' : 'SHORTLISTED');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            stageFilter === 'SHORTLISTED' && helpFilter === 'ALL' ? 'bg-primary text-white border-slate-900 shadow-sm' : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'SHORTLISTED' && helpFilter === 'ALL' ? 'text-blue-400' : 'text-slate-500'}`}>
            Shortlisted
          </span>
          <span className="text-xl font-black mt-1 block">
            {countShortlisted}
          </span>
        </button>

        <button
          onClick={() => {
            setHelpFilter('ALL');
            setStageFilter(stageFilter === 'INTERVIEW' && helpFilter === 'ALL' ? 'ALL' : 'INTERVIEW');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            stageFilter === 'INTERVIEW' && helpFilter === 'ALL' ? 'bg-primary text-white border-slate-900 shadow-sm' : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'INTERVIEW' && helpFilter === 'ALL' ? 'text-purple-400' : 'text-slate-500'}`}>
            Interview
          </span>
          <span className="text-xl font-black mt-1 block">
            {countInterview}
          </span>
        </button>

        <button
          onClick={() => {
            setHelpFilter('ALL');
            setStageFilter(stageFilter === 'OFFER' && helpFilter === 'ALL' ? 'ALL' : 'OFFER');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            stageFilter === 'OFFER' && helpFilter === 'ALL' ? 'bg-primary text-white border-slate-900 shadow-sm' : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'OFFER' && helpFilter === 'ALL' ? 'text-emerald-400' : 'text-slate-500'}`}>
            Offer
          </span>
          <span className="text-xl font-black mt-1 block text-emerald-600">
            {countOffer}
          </span>
        </button>

        <button
          onClick={() => {
            setHelpFilter('ALL');
            setStageFilter(stageFilter === 'JOINED' && helpFilter === 'ALL' ? 'ALL' : 'JOINED');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            stageFilter === 'JOINED' && helpFilter === 'ALL' ? 'bg-primary text-white border-slate-900 shadow-sm' : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'JOINED' && helpFilter === 'ALL' ? 'text-emerald-400' : 'text-slate-500'}`}>
            Placed
          </span>
          <span className="text-xl font-black mt-1 block text-emerald-700">
            {countPlaced}
          </span>
        </button>

        {/* 8. Help Requested */}
        <button
          onClick={() => {
            if (helpFilter === 'HELP_REQUESTED') {
              setHelpFilter('ALL');
            } else {
              setHelpFilter('HELP_REQUESTED');
              setStageFilter('ALL');
            }
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            helpFilter === 'HELP_REQUESTED'
              ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/40'
              : countHelpRequested > 0
              ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400 text-amber-950'
              : 'bg-white border-border hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold block ${
              helpFilter === 'HELP_REQUESTED' ? 'text-amber-200' : countHelpRequested > 0 ? 'text-amber-900' : 'text-slate-500'
            }`}>
              Help Requested
            </span>
            {countHelpRequested > 0 && helpFilter !== 'HELP_REQUESTED' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <span className={`text-xl font-black mt-1 block ${
            helpFilter === 'HELP_REQUESTED' ? 'text-white' : countHelpRequested > 0 ? 'text-amber-950 font-black' : 'text-slate-700'
          }`}>
            {countHelpRequested}
          </span>
        </button>
      </div>

      {/* Filters Bar: Search, Stage Filter, Help Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, batch, job..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
            />
          </div>

          {/* Job Type / Source Filter Dropdown: All Technology Jobs vs HACA Jobs */}
          <div className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={jobSourceFilter}
              onChange={e => setJobSourceFilter(e.target.value as 'ALL' | 'HACA')}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Technology Jobs</option>
              <option value="HACA">HACA Jobs</option>
            </select>
          </div>

          {/* Course / Program Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Courses</option>
              <option value="PYTHON">Python Full Stack</option>
              <option value="DATA_ANALYST">Data Analyst</option>
              <option value="MERN">MERN Stack</option>
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilterRange)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Dates (Full History)</option>
              <option value="WEEK">This Week (Last 7 Days)</option>
              <option value="MONTH">This Month (Last 30 Days)</option>
              <option value="YEAR">This Year (Academic Cycle)</option>
            </select>
          </div>

          {/* Application Date Sort Filter Dropdown (Last to First / First to Last) */}
          <div className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={dateSortOrder}
              onChange={e => setDateSortOrder(e.target.value as DateSortOrder)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="DESC">Last to First (Newest)</option>
              <option value="ASC">First to Last (Oldest)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-700">{filteredApps.length}</strong> of {applications.length} applications
            {jobSourceFilter !== 'ALL' && (
              <span className="ml-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                HACA Jobs
              </span>
            )}
            {courseFilter !== 'ALL' && (
              <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {courseFilter === 'PYTHON' ? 'Python Full Stack' : courseFilter === 'DATA_ANALYST' ? 'Data Analyst' : 'MERN Stack'}
              </span>
            )}
            {dateFilter !== 'ALL' && (
              <span className="ml-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {dateFilter === 'WEEK' ? 'Week' : dateFilter === 'MONTH' ? 'Month' : 'Year'}
              </span>
            )}
            {dateSortOrder === 'ASC' && (
              <span className="ml-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                First to Last
              </span>
            )}
            {helpFilter === 'HELP_REQUESTED' && (
              <span className="ml-1.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Help Requested Only
              </span>
            )}
          </span>

          {(stageFilter !== 'ALL' || helpFilter !== 'ALL' || jobSourceFilter !== 'ALL' || courseFilter !== 'ALL' || dateFilter !== 'ALL' || dateSortOrder !== 'DESC' || searchQuery) && (
            <button
              onClick={() => {
                setStageFilter('ALL');
                setHelpFilter('ALL');
                setJobSourceFilter('ALL');
                setCourseFilter('ALL');
                setDateFilter('ALL');
                setDateSortOrder('DESC');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 border-b border-border text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Job Opportunity</th>
                <th className="py-3 px-4">Status & Help State</th>
                <th className="py-3 px-4">Application Date / Notes</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {sortedFilteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No applications match the current filter criteria.
                  </td>
                </tr>
              ) : (
                sortedFilteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-muted/60 transition-colors">
                    
                    {/* Candidate */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{app.studentName}</div>
                      <div className="text-[11px] text-slate-400">{app.program}</div>
                    </td>

                    {/* Batch Number */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {app.batch || '—'}
                    </td>

                    {/* Job */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-bold">{app.jobTitle}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span>{app.company}</span>
                        {isHacaApplication(app) ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">
                            HACA Job
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px]">
                            External
                          </span>
                        )}
                        {!applyLink({ applicationUrl: app.applicationUrl }) && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                            Direct Drive
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status dropdown & Help badge */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          value={app.status}
                          onChange={e => handleUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                          className="text-xs bg-muted border border-border rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                          <option value="APPLICATION_STARTED">Application Started</option>
                          <option value="APPLIED">Applied</option>
                          <option value="NOT_APPLIED">Not Applied</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                          <option value="INTERVIEWED">Interviewed</option>
                          <option value="OFFER_RECEIVED">Offer Received</option>
                          <option value="JOINED">Placed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>

                      {app.helpStatus && app.helpStatus !== 'NONE' && (
                        <div className="pt-0.5">
                          <HelpStatusBadge status={app.helpStatus} />
                        </div>
                      )}
                    </td>

                    {/* Reason / Notes */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.declineReason ? (
                        <div className="space-y-0.5 max-w-xs">
                          <span className="font-semibold text-rose-900 block text-[11px]">
                            {app.declineReason.replace(/_/g, ' ')}
                          </span>
                          {app.studentComment && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                              "{app.studentComment}"
                            </p>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {new Date(app.updatedAt || app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-slate-600 text-[11px] font-medium block">
                            {app.status === 'APPLIED' ? 'Applied' : app.status === 'APPLICATION_STARTED' ? 'Application Started' : app.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            {new Date(app.appliedAt || app.startedAt || app.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4">
                      <SourceChannelBadge channel={app.sourceChannel} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSelectedAppForDetail(app)}
                          title="View application audit details"
                          className="p-1.5 text-slate-600 hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Help status management buttons */}
                        {isHelpPending(app) && (
                          <div className="flex items-center gap-1">
                            {app.helpStatus !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleUpdateHelpStatus(app.id, 'IN_PROGRESS')}
                                className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer"
                                title="Mark help request as in progress"
                              >
                                In Progress
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateHelpStatus(app.id, 'RESOLVED')}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                              title="Mark help request as resolved"
                            >
                              Resolve
                            </button>
                          </div>
                        )}

                        {app.helpStatus === 'RESOLVED' && (
                          <button
                            onClick={() => handleUpdateHelpStatus(app.id, 'HELP_REQUESTED')}
                            className="px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                            title="Reopen help request"
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenStudentProfile(app)}
                          title="View student profile & get CV"
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-foreground bg-muted hover:bg-secondary rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>Profile</span>
                        </button>

                        {app.status === 'REJECTED' && (
                          <button
                            onClick={() => setSelectedAppForRejection(app)}
                            title="Submit rejection diagnostic feedback"
                            className="px-2 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                          >
                            Feedback
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedAppForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Audit Details</span>
                <h3 className="text-base font-bold text-foreground mt-0.5">{selectedAppForDetail.jobTitle}</h3>
                <p className="text-xs text-slate-500">{selectedAppForDetail.company} · Candidate: <strong>{selectedAppForDetail.studentName}</strong></p>
              </div>
              <button
                onClick={() => setSelectedAppForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Status</span>
                  <div className="mt-1">
                    <ApplicationStatusBadge status={selectedAppForDetail.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Placement Support</span>
                  <div className="mt-1">
                    {selectedAppForDetail.helpStatus && selectedAppForDetail.helpStatus !== 'NONE' ? (
                      <HelpStatusBadge status={selectedAppForDetail.helpStatus} />
                    ) : (
                      <span className="text-slate-500 text-[11px]">No help requested</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedAppForDetail.declineReason && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-bold text-rose-950 block text-xs">Decline Reason:</span>
                  <p className="text-rose-900 font-semibold">{selectedAppForDetail.declineReason.replace(/_/g, ' ')}</p>
                  {selectedAppForDetail.studentComment && (
                    <p className="text-slate-700 italic text-[11px] pt-1">
                      "{selectedAppForDetail.studentComment}"
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-muted rounded-xl space-y-1 text-[11px] text-slate-600">
                {selectedAppForDetail.startedAt && (
                  <div>• Application Started: <strong>{new Date(selectedAppForDetail.startedAt).toLocaleString()}</strong></div>
                )}
                {selectedAppForDetail.confirmedAt && (
                  <div>• Candidate Confirmed Applied: <strong>{new Date(selectedAppForDetail.confirmedAt).toLocaleString()}</strong></div>
                )}
                <div>• Initial Record Date: <strong>{new Date(selectedAppForDetail.appliedAt).toLocaleString()}</strong></div>
                {applyLink({ applicationUrl: selectedAppForDetail.applicationUrl }) ? (
                  <div className="pt-1">
                    • External Apply Link:{' '}
                    <a
                      href={applyLink({ applicationUrl: selectedAppForDetail.applicationUrl })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline font-semibold hover:text-blue-900"
                    >
                      View Job Portal ↗
                    </a>
                  </div>
                ) : (
                  <div className="pt-1 text-emerald-700 font-medium">
                    • Drive Type: Direct HACA Placement Drive (Managed internally)
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/70 flex items-center justify-between">
              {(selectedAppForDetail.needsHelp || (selectedAppForDetail.helpStatus && selectedAppForDetail.helpStatus !== 'NONE')) ? (
                <div className="flex items-center gap-2">
                  {selectedAppForDetail.helpStatus !== 'RESOLVED' ? (
                    <>
                      {selectedAppForDetail.helpStatus !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => {
                            handleUpdateHelpStatus(selectedAppForDetail.id, 'IN_PROGRESS');
                            setSelectedAppForDetail(prev => prev ? { ...prev, helpStatus: 'IN_PROGRESS' } : null);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Take Request (In Progress)
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleUpdateHelpStatus(selectedAppForDetail.id, 'RESOLVED');
                          setSelectedAppForDetail(prev => prev ? { ...prev, helpStatus: 'RESOLVED', needsHelp: false } : null);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleUpdateHelpStatus(selectedAppForDetail.id, 'HELP_REQUESTED');
                        setSelectedAppForDetail(prev => prev ? { ...prev, helpStatus: 'HELP_REQUESTED', needsHelp: true } : null);
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reopen Help Request
                    </button>
                  )}
                </div>
              ) : <div></div>}

              <button
                onClick={() => setSelectedAppForDetail(null)}
                className="px-4 py-1.5 bg-muted hover:bg-secondary text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {selectedAppForInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleScheduleInterview}>
              <div className="p-4 px-5 border-b border-border/70 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Schedule Interview Round</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAppForInterview(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="p-3 bg-muted rounded-lg border border-border/70">
                  <div className="font-semibold text-foreground">{selectedAppForInterview.studentName}</div>
                  <div className="text-slate-500 mt-0.5">{selectedAppForInterview.jobTitle} · {selectedAppForInterview.company}</div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Interview Round Title</label>
                  <input
                    type="text"
                    required
                    value={interviewRoundTitle}
                    onChange={e => setInterviewRoundTitle(e.target.value)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={interviewDate}
                    onChange={e => setInterviewDate(e.target.value)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="p-4 px-5 border-t border-border/70 bg-muted flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAppForInterview(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border text-slate-600 hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION FEEDBACK MODAL */}
      {selectedAppForRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSubmitRejectionFeedback}>
              <div className="p-4 px-5 border-b border-border/70 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Mandatory Rejection Feedback</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAppForRejection(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100 text-rose-900">
                  <div className="font-semibold">{selectedAppForRejection.studentName}</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">{selectedAppForRejection.jobTitle} at {selectedAppForRejection.company}</div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reason Category</label>
                  <select
                    value={rejectionCategory}
                    onChange={e => setRejectionCategory(e.target.value as RejectionCategory)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="TECHNICAL_SKILL_GAP">Technical Skill Gap</option>
                    <option value="COMMUNICATION_GAP">Communication Gap</option>
                    <option value="PROJECT_GAP">Project Gap</option>
                    <option value="EXPERIENCE_GAP">Experience Gap</option>
                    <option value="EXPECTATION_MISMATCH">Expectation Mismatch</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Interview Debrief Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate struggled with system design questions..."
                    value={rejectionNotes}
                    onChange={e => setRejectionNotes(e.target.value)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Recommended Remedial Action</label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule mock technical interview or coding workshop"
                    value={remedialAction}
                    onChange={e => setRemedialAction(e.target.value)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="p-4 px-5 border-t border-border/70 bg-muted flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAppForRejection(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border text-slate-600 hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-1.5 rounded-lg bg-rose-700 text-white font-medium hover:bg-rose-800 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE & CV MODAL */}
      {selectedStudentForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-border/70 flex items-start justify-between bg-muted/30">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  {selectedStudentForProfile.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Candidate Profile & Placement CV</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-base font-bold text-foreground">{selectedStudentForProfile.fullName}</h3>
                    <EligibilityBadge status={selectedStudentForProfile.eligibilityStatus} />
                    {loadingProfile && (
                      <span className="text-[10px] font-medium text-slate-400 animate-pulse">Syncing...</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedStudentForProfile.program} · Batch <strong className="text-slate-700">{selectedStudentForProfile.batch}</strong> · {selectedStudentForProfile.school}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                    {selectedStudentForProfile.registrationNo && (
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border text-[10px]">
                        {selectedStudentForProfile.registrationNo}
                      </span>
                    )}
                    {selectedStudentForProfile.email && (
                      <a href={`mailto:${selectedStudentForProfile.email}`} className="flex items-center gap-1 text-slate-600 hover:text-blue-600">
                        <Mail className="w-3 h-3" /> {selectedStudentForProfile.email}
                      </a>
                    )}
                    {selectedStudentForProfile.phone && (
                      <a href={`tel:${selectedStudentForProfile.phone}`} className="flex items-center gap-1 text-slate-600 hover:text-blue-600">
                        <Phone className="w-3 h-3" /> {selectedStudentForProfile.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForProfile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              
              {/* 1. CV / Resume Access Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Curriculum Vitae (CV) & Resume
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {(selectedStudentForProfile.resumeFileName || selectedStudentForProfile.resumeUrl || selectedStudentForProfile.resumeDataUrl) ? (
                          <>
                            File: <strong>{selectedStudentForProfile.resumeFileName || `${selectedStudentForProfile.fullName.replace(/\s+/g, '_')}_CV.pdf`}</strong>
                            {selectedStudentForProfile.resumeFileUploadedAt && (
                              <span className="text-slate-400 ml-1.5">
                                · Uploaded {new Date(selectedStudentForProfile.resumeFileUploadedAt).toLocaleDateString()}
                              </span>
                            )}
                          </>
                        ) : (
                          'No custom CV file uploaded yet by the student.'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {(selectedStudentForProfile.resumeDataUrl || selectedStudentForProfile.resumeUrl) ? (
                      <>
                        <a
                          href={selectedStudentForProfile.resumeDataUrl || selectedStudentForProfile.resumeUrl}
                          download={selectedStudentForProfile.resumeFileName || `${selectedStudentForProfile.fullName.replace(/\s+/g, '_')}_CV.pdf`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download CV</span>
                        </a>
                        <a
                          href={selectedStudentForProfile.resumeDataUrl || selectedStudentForProfile.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border text-slate-700 text-xs font-semibold rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View CV</span>
                        </a>
                      </>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-100/70 border border-amber-200 px-2.5 py-1 rounded-md">
                        Pending Student Upload
                      </span>
                    )}
                  </div>
                </div>

                {/* Embedded CV Document Preview (if available) */}
                {(selectedStudentForProfile.resumeDataUrl || selectedStudentForProfile.resumeUrl) && (
                  <div className="mt-3.5 rounded-lg border border-border overflow-hidden bg-white">
                    <div className="px-3 py-1.5 bg-muted/60 border-b border-border flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Document Preview</span>
                      <span className="font-mono text-[10px]">PDF Viewer</span>
                    </div>
                    <iframe
                      src={selectedStudentForProfile.resumeDataUrl || selectedStudentForProfile.resumeUrl}
                      className="w-full h-72 border-0"
                      title="CV Preview"
                    />
                  </div>
                )}
              </div>

              {/* 2. Academic & Placement Performance Overview */}
              <div>
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mb-2.5">
                  Academic Progress & Evaluation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-muted rounded-xl border border-border/70">
                    <span className="text-[11px] text-slate-400 block font-medium">GPA / Progress</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudentForProfile.academic?.scores?.gpaOrPercentage ? `${selectedStudentForProfile.academic.scores.gpaOrPercentage}%` : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-muted rounded-xl border border-border/70">
                    <span className="text-[11px] text-slate-400 block font-medium">Attendance</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudentForProfile.academic?.attendancePercentage ? `${selectedStudentForProfile.academic.attendancePercentage}%` : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-muted rounded-xl border border-border/70">
                    <span className="text-[11px] text-slate-400 block font-medium">Assignments</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudentForProfile.academic?.scores?.assignmentsCompleted ?? 0} / {selectedStudentForProfile.academic?.scores?.totalAssignments ?? 0}
                    </span>
                  </div>

                  <div className="p-3 bg-muted rounded-xl border border-border/70">
                    <span className="text-[11px] text-slate-400 block font-medium">Capstone</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudentForProfile.academic?.scores?.capstoneScore ? `${selectedStudentForProfile.academic.scores.capstoneScore}%` : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Acquired Technical Skills */}
              {selectedStudentForProfile.academic?.skills && selectedStudentForProfile.academic.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mb-2">
                    Acquired Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudentForProfile.academic.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-muted text-slate-800 text-[11px] font-semibold border border-border">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Projects Portfolio */}
              {selectedStudentForProfile.academic?.projects && selectedStudentForProfile.academic.projects.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mb-2">
                    Projects Portfolio ({selectedStudentForProfile.academic.projects.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedStudentForProfile.academic.projects.map((proj, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-border/70 bg-white shadow-xs flex items-start justify-between">
                        <div>
                          <div className="font-bold text-foreground">{proj.title}</div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{proj.description}</p>
                          {proj.githubUrl && (
                            <a
                              href={proj.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 text-[10px] mt-1 font-medium"
                            >
                              <span>Repository</span> <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ml-2 ${
                          proj.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Mentor & Evaluation Notes */}
              {(selectedStudentForProfile.mentorName || selectedStudentForProfile.evaluationNotes) && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  {selectedStudentForProfile.mentorName && (
                    <div className="text-[11px] font-medium text-slate-500 mb-0.5">
                      Assigned Mentor: <strong className="text-slate-800">{selectedStudentForProfile.mentorName}</strong>
                    </div>
                  )}
                  {selectedStudentForProfile.evaluationNotes && (
                    <p className="text-[11px] text-slate-600 italic">
                      "{selectedStudentForProfile.evaluationNotes}"
                    </p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3 px-5 border-t border-border/70 bg-muted/40 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Placement & Student Record System
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentForProfile(null)}
                className="px-4 py-1.5 rounded-lg border border-border text-slate-700 hover:bg-muted font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
