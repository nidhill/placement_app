import React, { useState, useEffect } from 'react';
import { StudentProfile, JobListing, JobApplication, RejectionCategory, ApplicationStatus, ApplicationDeclineReason, HelpStatus } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { ApplicationStatusBadge, HelpStatusBadge } from '../common/StatusBadge.tsx';
import { NavigationItem } from '../common/Sidebar.tsx';
import { 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Briefcase, 
  Calendar, 
  FileText, 
  Send,
  Sparkles,
  Link as LinkIcon,
  Clock,
  X,
  Search,
  Check,
  User as UserIcon,
  ShieldCheck,
  Bell,
  MapPin,
  Building2,
  Filter,
  Layers,
  Award,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  PlayCircle,
  UploadCloud,
  Download,
  Trash2,
  Eye,
  FileCheck,
  RefreshCw,
  Paperclip,
  HelpCircle
} from 'lucide-react';

const DECLINE_REASON_OPTIONS: { value: ApplicationDeclineReason; label: string }[] = [
  { value: 'NOT_INTERESTED', label: '1. Not interested in this role or company' },
  { value: 'NOT_ELIGIBLE', label: '2. I do not meet the eligibility requirements' },
  { value: 'SKILLS_DONT_MATCH', label: '3. Required technical skills do not match my profile' },
  { value: 'EXPERIENCE_REQUIREMENT', label: '4. Required experience is too high' },
  { value: 'SALARY_NOT_SUITABLE', label: '5. Salary / compensation package is not suitable' },
  { value: 'LOCATION_NOT_SUITABLE', label: '6. Job location / work arrangement (relocation/onsite) not suitable' },
  { value: 'ALREADY_APPLIED_PREVIOUSLY', label: '7. Already applied directly on company site previously' },
  { value: 'PORTAL_PROBLEM', label: '8. Company application portal had technical issues / broken link' },
  { value: 'NEED_PLACEMENT_HELP', label: '9. Need guidance/help from Placement Team before applying' },
  { value: 'NEED_RESUME_HELP', label: '10. Need resume / CV review help before applying' },
  { value: 'NEED_JOB_CLARIFICATION', label: '11. Need clarification on job description or requirements' },
  { value: 'OTHER', label: '12. Other reason (specified in comments below)' }
];

interface StudentPortalViewProps {
  currentStudentId?: string;
  activeTab?: NavigationItem;
  onNavigate?: (tab: NavigationItem) => void;
  onRefreshData?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  currentStudentId = 'student-tech-1',
  activeTab = 'student_dashboard',
  onNavigate,
  onRefreshData
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<JobListing[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGated, setIsGated] = useState(false);
  const [gatedReason, setGatedReason] = useState<string | null>(null);

  // Profile links state
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [savingLinks, setSavingLinks] = useState(false);
  const [linksMessage, setLinksMessage] = useState<string | null>(null);

  // Resume / CV File upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState<string | null>(null);
  const [previewResumeModalOpen, setPreviewResumeModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Job search, sub-tabs and detail modal
  const [jobSearch, setJobSearch] = useState('');
  const [jobsViewTab, setJobsViewTab] = useState<'recommended' | 'all'>('recommended');
  const [jobCategoryFilter, setJobCategoryFilter] = useState('ALL');
  const [jobDesignationFilter, setJobDesignationFilter] = useState('');
  const [jobExperienceFilter, setJobExperienceFilter] = useState('ALL');
  const [jobScoreFilter, setJobScoreFilter] = useState('ALL');
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobListing | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  // External Application Flow State
  const [confirmationApp, setConfirmationApp] = useState<JobApplication | null>(null);
  const [declineApp, setDeclineApp] = useState<JobApplication | null>(null);
  const [declineReason, setDeclineReason] = useState<ApplicationDeclineReason>('NOT_INTERESTED');
  const [declineComment, setDeclineComment] = useState('');
  const [needsHelp, setNeedsHelp] = useState(false);
  const [submittingConfirmDecline, setSubmittingConfirmDecline] = useState(false);

  // Rejection feedback state
  const [selectedAppForFeedback, setSelectedAppForFeedback] = useState<JobApplication | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<RejectionCategory>('TECHNICAL_SKILL_GAP');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [remedialAction, setRemedialAction] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Interview status test update state
  const [updatingInterviewId, setUpdatingInterviewId] = useState<string | null>(null);

  const handleWithdrawApplication = async (applicationId: string, jobTitle?: string) => {
    setWithdrawingAppId(applicationId);
    setWithdrawMessage(null);
    try {
      await api.withdrawApplication(applicationId);
      setWithdrawMessage(`Application for "${jobTitle || 'job'}" has been successfully withdrawn.`);
      setTimeout(() => setWithdrawMessage(null), 4000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Withdrawal failed: ${err.message || 'Unknown error'}`);
    } finally {
      setWithdrawingAppId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashData, jobsRes] = await Promise.all([
        api.getStudentDashboard(currentStudentId),
        api.getJobs()
      ]);
      setProfile(dashData.profile);
      setRecommendedJobs(dashData.recommendedJobs || []);
      setAllJobs(jobsRes.jobs || []);
      setMyApplications(dashData.myApplications || []);
      setResumeUrl(dashData.profile.resumeUrl || '');
      setPortfolioUrl(dashData.profile.portfolioUrl || '');
      setLinkedinUrl(dashData.profile.linkedinUrl || '');
      
      const isEligible = dashData.profile.eligibilityStatus === 'ELIGIBLE' || dashData.profile.eligibilityStatus === 'ADMIN_OVERRIDE';
      setIsGated(!isEligible);
      if (!isEligible) {
        setGatedReason('Placement portal access is currently pending Main Admin evaluation.');
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error, falling back to direct profile:', err);
      try {
        const studentRes = await api.getStudent(currentStudentId);
        if (studentRes?.student) {
          setProfile(studentRes.student);
          setResumeUrl(studentRes.student.resumeUrl || '');
          setPortfolioUrl(studentRes.student.portfolioUrl || '');
          setLinkedinUrl(studentRes.student.linkedinUrl || '');
          const isEligible = studentRes.student.eligibilityStatus === 'ELIGIBLE' || studentRes.student.eligibilityStatus === 'ADMIN_OVERRIDE';
          setIsGated(!isEligible);
          if (!isEligible) {
            setGatedReason('Placement portal access is currently pending Main Admin evaluation.');
          }
        }
      } catch (fallbackErr) {
        console.error('Failed to load fallback profile:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentStudentId]);

  const handleExternalApply = (job: JobListing) => {
    if (!profile) return;
    const targetUrl = job.applicationUrl || 
                      job.externalUrl || 
                      job.sourceUrl || 
                      (job as any).url || 
                      (job as any).link || 
                      (job as any).jobUrl || 
                      `https://www.google.com/search?q=${encodeURIComponent(job.company + ' ' + job.title + ' apply')}`;

    // Synchronous window.open MUST happen immediately during click handler execution to avoid popup blocker blocking!
    window.open(targetUrl, '_blank');

    setApplyingJobId(job.id);
    setApplySuccessMessage(null);

    api.applyForJob(job.id, currentStudentId)
      .then(res => {
        setSelectedJobForModal(null);
        setConfirmationApp(res.application);
        loadData();
        if (onRefreshData) onRefreshData();
      })
      .catch(err => {
        console.error('Application registration error:', err);
      })
      .finally(() => {
        setApplyingJobId(null);
      });
  };

  const handleContinueExternalApply = (app: JobApplication) => {
    const targetUrl = app.applicationUrl || (app as any).externalUrl || 'https://google.com';
    window.open(targetUrl, '_blank');
    setConfirmationApp(app);
  };

  const handleConfirmApplication = async (appId: string) => {
    setSubmittingConfirmDecline(true);
    try {
      await api.confirmApplication(appId);
      setConfirmationApp(null);
      setApplySuccessMessage('Great job! Your application status has been confirmed as APPLIED.');
      setTimeout(() => setApplySuccessMessage(null), 5000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to confirm application: ${err.message}`);
    } finally {
      setSubmittingConfirmDecline(false);
    }
  };

  const handleOpenDeclineModal = (app: JobApplication) => {
    setDeclineApp(app);
    setConfirmationApp(null);
    setDeclineReason('NOT_INTERESTED');
    setDeclineComment('');
    setNeedsHelp(false);
  };

  const handleDeclineApplicationSubmit = async () => {
    if (!declineApp) return;
    setSubmittingConfirmDecline(true);
    try {
      await api.declineApplication(declineApp.id, {
        declineReason,
        studentComment: declineComment,
        needsHelp
      });
      setDeclineApp(null);
      setApplySuccessMessage('Status updated to NOT APPLIED.' + (needsHelp ? ' Placement team has been notified of your help request.' : ''));
      setTimeout(() => setApplySuccessMessage(null), 5000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to save response: ${err.message}`);
    } finally {
      setSubmittingConfirmDecline(false);
    }
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLinks(true);
    setLinksMessage(null);
    try {
      await api.updateStudentProfileLinks(currentStudentId, {
        resumeUrl,
        portfolioUrl,
        linkedinUrl
      });
      setLinksMessage('Profile links saved successfully.');
      setTimeout(() => setLinksMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      alert(`Failed to update links: ${err.message}`);
    } finally {
      setSavingLinks(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Document';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileSelected = async (file: File) => {
    setResumeUploadError(null);
    setResumeUploadSuccess(null);

    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileName = file.name;
    const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase() : '';
    const validMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validExtensions.includes(ext) && !validMimes.includes(file.type)) {
      setResumeUploadError('Please upload a valid CV/Resume in PDF or Word format (.pdf, .doc, .docx).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setResumeUploadError('File size exceeds the 15MB limit. Please upload an optimized document.');
      return;
    }

    setIsUploadingResume(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          await api.uploadStudentResume(currentStudentId, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/pdf',
            dataUrl
          });
          setResumeUploadSuccess(`"${file.name}" uploaded and verified successfully!`);
          setTimeout(() => setResumeUploadSuccess(null), 4000);
          await loadData();
          if (onRefreshData) onRefreshData();
        } catch (err: any) {
          setResumeUploadError(err.message || 'Failed to save uploaded resume.');
        } finally {
          setIsUploadingResume(false);
        }
      };
      reader.onerror = () => {
        setResumeUploadError('Failed to read file from your device. Please try again.');
        setIsUploadingResume(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setResumeUploadError(err.message || 'Error processing file.');
      setIsUploadingResume(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm('Are you sure you want to remove your uploaded CV/Resume document?')) return;
    setIsUploadingResume(true);
    setResumeUploadError(null);
    try {
      await api.deleteStudentResume(currentStudentId);
      setResumeUploadSuccess('CV / Resume document removed.');
      setTimeout(() => setResumeUploadSuccess(null), 3000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setResumeUploadError(err.message || 'Failed to delete resume.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDownloadResume = () => {
    const fileSource = profile?.resumeDataUrl || profile?.resumeUrl;
    if (!fileSource) return;
    const fileName = profile?.resumeFileName || `${profile?.fullName?.replace(/\s+/g, '_') || 'Student'}_CV.pdf`;
    
    const a = document.createElement('a');
    a.href = fileSource;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForFeedback) return;
    setSubmittingFeedback(true);
    try {
      await api.submitRejectionFeedback(selectedAppForFeedback.id, {
        category: feedbackCategory,
        details: feedbackDetails,
        remedialActionNeeded: remedialAction
      });
      setSelectedAppForFeedback(null);
      setFeedbackDetails('');
      setRemedialAction('');
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Feedback submission failed: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Test interview status changer
  const handleUpdateInterviewStatus = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdatingInterviewId(appId);
    try {
      await api.updateApplicationStatus(appId, newStatus);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingInterviewId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading Student Placement Portal...
      </div>
    );
  }

  // If student profile is pending eligibility and trying to access jobs/applications
  const isEligible = profile?.eligibilityStatus === 'ELIGIBLE' || profile?.eligibilityStatus === 'ADMIN_OVERRIDE';

  // Sub-view determination based on activeTab
  const currentView = activeTab || 'student_dashboard';

  // Filtered jobs for student
  const filteredJobs = allJobs.filter(j => {
    if (j.status !== 'ACTIVE') return false;
    if (!jobSearch.trim()) return true;
    const q = jobSearch.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.requiredSkills.some(s => s.toLowerCase().includes(q));
  });

  // Pipeline stages definition
  const pipelineStagesList = [
    'APPLIED',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'SELECTED',
    'OFFER_EXTENDED',
    'JOINED'
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Toast Notification */}
      {applySuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{applySuccessMessage}</span>
          </div>
          <button onClick={() => setApplySuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {withdrawMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{withdrawMessage}</span>
          </div>
          <button onClick={() => setWithdrawMessage(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !profile && (
        <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading student profile & placement records...</p>
        </div>
      )}

      {/* Fallback state if profile failed */}
      {!loading && !profile && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Student Profile</h3>
            <p className="text-xs text-slate-500 mt-1">
              Could not load profile records for active student ({currentStudentId}).
            </p>
          </div>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* =========================================================
          1. SUB-VIEW: DASHBOARD (student_dashboard)
          ========================================================= */}
      {(currentView === 'student_dashboard' || currentView === 'dashboard') && profile && (
        <div className="space-y-6">
          
          {/* Welcome Banner & Placement Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Student Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Welcome back, {profile.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {profile.program} · {profile.school} · Reg #{profile.registrationNo}
              </p>
            </div>

            {/* Placement Status Badge */}
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                isEligible 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <div>
                  <span className="block font-bold">
                    {isEligible ? 'Eligible for Placement' : 'Placement Access Pending'}
                  </span>
                  <span className="text-[10px] font-normal opacity-80 block">
                    {isEligible ? 'Can browse and apply to active positions' : 'Main Admin evaluation pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards: Profile Completion, Recommended Jobs, Active Applications */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Profile Completion */}
            <div 
              onClick={() => onNavigate && onNavigate('student_profile')}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Profile Completion</span>
                <UserIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {((profile.resumeFileName || profile.resumeDataUrl || resumeUrl) && linkedinUrl && portfolioUrl) ? '100%' : (profile.resumeFileName || profile.resumeDataUrl || resumeUrl) ? '85%' : '60%'}
                </span>
                <span className="text-xs text-blue-600 font-semibold">
                  {((profile.resumeFileName || profile.resumeDataUrl || resumeUrl) && linkedinUrl && portfolioUrl) ? 'Complete' : (profile.resumeFileName || profile.resumeDataUrl || resumeUrl) ? 'Links Pending' : 'CV File Needed'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {(profile.resumeFileName || profile.resumeDataUrl) ? 'CV document verified and attached' : 'Upload your CV / Resume in My Profile'}
              </p>
            </div>

            {/* Matched / Recommended Jobs */}
            <div 
              onClick={() => onNavigate && onNavigate('student_jobs')}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Recommended Jobs</span>
                <Briefcase className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{recommendedJobs.length}</span>
                <span className="text-xs text-emerald-600 font-semibold">Matching Profile</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {allJobs.length} total tech positions available
              </p>
            </div>

            {/* Active Applications */}
            <div 
              onClick={() => onNavigate && onNavigate('student_applications')}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Applications</span>
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{myApplications.length}</span>
                <span className="text-xs text-purple-600 font-semibold">In Pipeline</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {myApplications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length} interview rounds scheduled
              </p>
            </div>

          </div>

          {/* Recommended Jobs & Upcoming Interviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recommended Jobs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Recommended Jobs</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Matched with your skills & program ({recommendedJobs.length} jobs available)
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigate && onNavigate('student_jobs')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Browse All ({recommendedJobs.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {recommendedJobs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching job recommendations currently found.
                    </div>
                  ) : (
                    recommendedJobs.slice(0, 50).map(rec => {
                      const job = rec.job;
                      const matchScore = rec.matchScore ?? 85;
                      const matched = rec.matchedSkills || [];
                      const missing = rec.missingSkills || [];

                      return (
                        <div key={job.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5 hover:border-slate-300 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{job.title}</h4>
                                {job.category && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                    {job.category}
                                  </span>
                                )}
                                {job.sourceChannel === 'AI_JOB_SCRAPER' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold uppercase tracking-wider">
                                    AI Job Scraper
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span>{job.company}</span>
                                <span>·</span>
                                <span>{job.location}</span>
                                {job.normalizedDesignation && (
                                  <>
                                    <span>·</span>
                                    <span className="text-slate-600 font-medium">Role: {job.normalizedDesignation}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                                {matchScore}% Match
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                {rec.matchLevel || 'Good Match'}
                              </span>
                            </div>
                          </div>

                          {/* Skills badges */}
                          <div className="flex flex-wrap gap-1">
                            {job.requiredSkills.map((sk: string) => (
                              <span key={sk} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 text-[10px] font-medium">
                                {sk}
                              </span>
                            ))}
                          </div>

                          {/* "Why this job matches you" breakdown */}
                          <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-[11px] space-y-1.5">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Why this job matches you:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
                              <div className="flex items-center gap-1 text-slate-800 font-medium">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Role: {rec.designationExplanation || job.normalizedDesignation || 'Target role match'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-800 font-medium">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Program: {rec.programExplanation || 'Compatible curriculum'}</span>
                              </div>
                              {matched.map((sk: string) => (
                                <div key={sk} className="flex items-center gap-1 text-emerald-700 font-medium">
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{sk}</span>
                                </div>
                              ))}
                              {missing.map((sk: string) => (
                                <div key={sk} className="flex items-center gap-1 text-amber-700">
                                  <span className="text-amber-500 font-bold text-xs shrink-0">⚠</span>
                                  <span>Missing: {sk}</span>
                                </div>
                              ))}
                              {rec.experienceExplanation && (
                                <div className="flex items-center gap-1 text-slate-600 sm:col-span-2 text-[10px]">
                                  <span>Experience: {rec.experienceExplanation}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-1">
                            <button
                              onClick={() => setSelectedJobForModal(job)}
                              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                            >
                              Job Details
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Upcoming Interviews</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Scheduled evaluation sessions</p>
                  </div>
                  <button 
                    onClick={() => onNavigate && onNavigate('student_interviews')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    All Schedule <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {myApplications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active interview rounds scheduled at the moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myApplications.filter(a => a.status === 'INTERVIEW_SCHEDULED').map(app => {
                      const latestInterview = app.interviewDates && app.interviewDates.length > 0
                        ? app.interviewDates[app.interviewDates.length - 1]
                        : null;
                      const roundTitle = latestInterview?.title || (app as any).interviewRound || 'Technical Assessment';
                      const roundDate = latestInterview?.date 
                        ? new Date(latestInterview.date).toLocaleString() 
                        : (app as any).interviewDate 
                        ? new Date((app as any).interviewDate).toLocaleString() 
                        : 'Tomorrow, 2:00 PM (Online)';

                      return (
                        <div key={app.id} className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{app.jobTitle}</div>
                            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                              {app.company || (app as any).companyName} · {roundTitle}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {roundDate}
                            </div>
                          </div>

                          <span className="px-2 py-1 rounded bg-purple-200/80 text-purple-900 text-[10px] font-bold">
                            Confirmed
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* My Applied Jobs Section on Dashboard */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  My Applied Jobs ({myApplications.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct overview of jobs you've applied to. You can review status or withdraw your application.
                </p>
              </div>
              {myApplications.length > 0 && (
                <button
                  onClick={() => onNavigate && onNavigate('student_applications')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  View Pipeline <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {myApplications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No active job applications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore open tech opportunities and apply directly to employer pipelines.</p>
                <button
                  onClick={() => onNavigate && onNavigate('student_jobs')}
                  className="mt-3 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Browse Tech Jobs <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myApplications.map(app => (
                  <div key={app.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{app.jobTitle}</span>
                        <span className="text-[11px] text-slate-500">· {app.company}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Applied: <strong className="text-slate-700">{new Date(app.appliedAt).toLocaleDateString()}</strong></span>
                        {app.interviewDates && app.interviewDates.length > 0 && (
                          <span className="text-purple-600 font-medium">
                            • {app.interviewDates.length} Interview Round(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <ApplicationStatusBadge status={app.status} />
                      <button
                        id={`btn-withdraw-dash-${app.id}`}
                        disabled={withdrawingAppId === app.id}
                        onClick={() => handleWithdrawApplication(app.id, app.jobTitle)}
                        className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Withdraw this application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{withdrawingAppId === app.id ? 'Withdrawing...' : 'Withdraw'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Placement Activity */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Student Activity</h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Placement eligibility clearance approved by Main Admin.</span>
                <span className="text-[10px] text-slate-400 ml-auto">2 days ago</span>
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Application submitted to <strong className="text-slate-800">ABC Technologies</strong> (Software Developer).</span>
                <span className="text-[10px] text-slate-400 ml-auto">3 days ago</span>
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Profile verified for campus recruitment season 2026.</span>
                <span className="text-[10px] text-slate-400 ml-auto">1 week ago</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================
          2. SUB-VIEW: STUDENT PROFILE (student_profile / profile)
          ========================================================= */}
      {(currentView === 'student_profile' || currentView === 'profile' || currentView === 'student_profile_details') && profile && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Student Profile & Academic Records</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.fullName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Number</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.registrationNo}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">School</span>
                <span className="text-slate-900 font-semibold mt-0.5 block">{profile.school}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Program & Batch</span>
                <span className="text-slate-900 font-semibold mt-0.5 block">{profile.program} ({profile.batch})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Attendance</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.academic.attendancePercentage}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Score (GPA)</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.academic.scores.gpaOrPercentage}</span>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Verified Technical Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {(profile.academic?.skills || (profile as any).skills || []).map(s => (
                  <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Curriculum Vitae (CV) & Resume File Upload Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Curriculum Vitae (CV) & Resume Document</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    Placement Credential
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your official CV or resume document (.pdf, .doc, .docx). Campus placement coordinators and recruiting partners use this file during applicant screening.
                </p>
              </div>

              {(profile.resumeFileName || profile.resumeDataUrl) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified CV On File</span>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {resumeUploadError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resumeUploadError}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setResumeUploadError(null)}
                  className="p-1 text-rose-400 hover:text-rose-700 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Success Banner */}
            {resumeUploadSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resumeUploadSuccess}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setResumeUploadSuccess(null)}
                  className="p-1 text-emerald-400 hover:text-emerald-700 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Active Uploaded Document Details Card */}
            {(profile.resumeFileName || profile.resumeDataUrl) ? (
              <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-200/80 flex items-center justify-center shrink-0 text-red-600 shadow-2xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {profile.resumeFileName || `${profile.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
                        {profile.resumeFileType ? (profile.resumeFileType.includes('word') ? 'DOCX' : profile.resumeFileType.split('/')[1] || 'PDF') : 'PDF'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                      <span>File Size: <strong className="text-slate-700">{formatFileSize(profile.resumeFileSize)}</strong></span>
                      <span>·</span>
                      <span>
                        Uploaded: <strong className="text-slate-700">{profile.resumeFileUploadedAt ? new Date(profile.resumeFileUploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</strong>
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Active Placement Asset
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {profile.resumeDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewResumeModalOpen(true)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Preview
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadResume}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingResume}
                    className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUploadingResume ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{isUploadingResume ? 'Uploading...' : 'Replace File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteResume}
                    disabled={isUploadingResume}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Remove uploaded CV document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 scale-[1.005]' 
                  : 'border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelected(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />

              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-3 shadow-2xs">
                {isUploadingResume ? (
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-indigo-600" />
                )}
              </div>

              {isUploadingResume ? (
                <div>
                  <p className="text-xs font-bold text-slate-900">Processing and uploading your CV file...</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Encrypting and attaching document to student profile</p>
                </div>
              ) : isDragging ? (
                <div>
                  <p className="text-xs font-bold text-indigo-900">Release document to upload</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">PDF or Word document format (.pdf, .doc, .docx)</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {(profile.resumeFileName || profile.resumeDataUrl) 
                      ? 'Drop a new file here to replace your CV, or click to browse' 
                      : 'Drag and drop your CV / Resume here, or click to browse files'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts <strong>PDF (.pdf)</strong> and <strong>Word (.doc, .docx)</strong> up to 15MB
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Choose File from Computer
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Links Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Portfolio & Professional Profiles</h3>
            <p className="text-xs text-slate-400 mb-4">Employers evaluate these external links when reviewing applications</p>

            {linksMessage && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
                {linksMessage}
              </div>
            )}

            <form onSubmit={handleSaveLinks} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resume / CV Link (PDF/Google Drive):</label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={e => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-resume.pdf"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Portfolio / GitHub URL:</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile:</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={savingLinks}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {savingLinks ? 'Saving...' : 'Save Profile Links'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          3. SUB-VIEW: FIND JOBS (student_jobs)
          ========================================================= */}
      {(currentView === 'student_jobs' || currentView === 'jobs' || currentView === 'recommended_jobs') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Technology Opportunities</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified IT & technology positions ranked against your designation ({profile?.designation || 'Full Stack Developer'}) & skills
              </p>
            </div>

            {/* Tab Switcher: Recommended vs All Tech */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setJobsViewTab('recommended')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  jobsViewTab === 'recommended'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recommended for You ({recommendedJobs.length})
              </button>
              <button
                onClick={() => setJobsViewTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  jobsViewTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Technology Jobs ({allJobs.length})
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job title, company, skill..."
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={jobCategoryFilter}
                onChange={e => setJobCategoryFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer font-medium"
              >
                <option value="ALL">Category: All Tech</option>
                <option value="Software Development">Software Development</option>
                <option value="Full Stack Development">Full Stack Development</option>
                <option value="Frontend Development">Frontend Development</option>
                <option value="Backend Development">Backend Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Data Analytics">Data Analytics</option>
                <option value="Data Engineering">Data Engineering</option>
                <option value="AI / Machine Learning">AI / Machine Learning</option>
                <option value="Cloud / DevOps">Cloud / DevOps</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="QA / Testing">QA / Testing</option>
                <option value="UI/UX / Product Design">UI/UX / Product Design</option>
                <option value="IT Support">IT Support</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Role / Designation Filter */}
            <div className="relative w-36">
              <input
                type="text"
                placeholder="Role / Designation..."
                value={jobDesignationFilter}
                onChange={e => setJobDesignationFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
            </div>

            {/* Experience Filter */}
            <div className="relative">
              <select
                value={jobExperienceFilter}
                onChange={e => setJobExperienceFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="ALL">Experience: All</option>
                <option value="ENTRY">Entry / Fresh</option>
                <option value="EXPERIENCED">Experienced</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Match Score Filter (applicable when viewing recommendations) */}
            {jobsViewTab === 'recommended' && (
              <div className="relative">
                <select
                  value={jobScoreFilter}
                  onChange={e => setJobScoreFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer font-medium"
                >
                  <option value="ALL">Match: All Levels</option>
                  <option value="80">80%+ Excellent Match</option>
                  <option value="65">65%+ Good Match</option>
                  <option value="50">50%+ Partial Match</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {(jobSearch || jobCategoryFilter !== 'ALL' || jobDesignationFilter || jobExperienceFilter !== 'ALL' || jobScoreFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setJobSearch('');
                  setJobCategoryFilter('ALL');
                  setJobDesignationFilter('');
                  setJobExperienceFilter('ALL');
                  setJobScoreFilter('ALL');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Results Summary Banner */}
          {(() => {
            const filteredRecs = recommendedJobs.filter(rec => {
              const job = rec.job;
              if (job.status !== 'ACTIVE') return false;
              if (jobCategoryFilter !== 'ALL' && job.category !== jobCategoryFilter) return false;
              if (jobDesignationFilter.trim()) {
                const df = jobDesignationFilter.toLowerCase().trim();
                const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                   job.title.toLowerCase().includes(df);
                if (!desigMatch) return false;
              }
              if (jobExperienceFilter !== 'ALL') {
                const exp = (job.experienceRequirement || '').toLowerCase();
                if (jobExperienceFilter === 'ENTRY' && !exp.includes('0') && !exp.includes('fresh') && !exp.includes('entry')) return false;
                if (jobExperienceFilter === 'EXPERIENCED' && (exp.includes('0-1') || exp.includes('fresh') || exp.includes('entry'))) return false;
              }
              if (jobScoreFilter !== 'ALL') {
                const minScore = parseInt(jobScoreFilter, 10);
                if ((rec.matchScore ?? 0) < minScore) return false;
              }
              if (jobSearch.trim()) {
                const q = jobSearch.toLowerCase();
                const inTitle = job.title.toLowerCase().includes(q);
                const inComp = job.company.toLowerCase().includes(q);
                const inLoc = job.location.toLowerCase().includes(q);
                const inSkills = job.requiredSkills.some((s: string) => s.toLowerCase().includes(q));
                if (!inTitle && !inComp && !inLoc && !inSkills) return false;
              }
              return true;
            });

            const filteredAll = allJobs.filter(job => {
              if (job.status !== 'ACTIVE') return false;
              if (jobCategoryFilter !== 'ALL' && job.category !== jobCategoryFilter) return false;
              if (jobDesignationFilter.trim()) {
                const df = jobDesignationFilter.toLowerCase().trim();
                const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                   job.title.toLowerCase().includes(df);
                if (!desigMatch) return false;
              }
              if (jobExperienceFilter !== 'ALL') {
                const exp = (job.experienceRequirement || '').toLowerCase();
                if (jobExperienceFilter === 'ENTRY' && !exp.includes('0') && !exp.includes('fresh') && !exp.includes('entry')) return false;
                if (jobExperienceFilter === 'EXPERIENCED' && (exp.includes('0-1') || exp.includes('fresh') || exp.includes('entry'))) return false;
              }
              if (jobSearch.trim()) {
                const q = jobSearch.toLowerCase();
                const inTitle = job.title.toLowerCase().includes(q);
                const inComp = job.company.toLowerCase().includes(q);
                const inLoc = job.location.toLowerCase().includes(q);
                const inSkills = job.requiredSkills.some((s: string) => s.toLowerCase().includes(q));
                if (!inTitle && !inComp && !inLoc && !inSkills) return false;
              }
              return true;
            });

            const currentCount = jobsViewTab === 'recommended' ? filteredRecs.length : filteredAll.length;
            const totalCount = jobsViewTab === 'recommended' ? recommendedJobs.length : allJobs.length;

            return (
              <div className="flex items-center justify-between px-1 py-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Showing <strong>{currentCount}</strong> of <strong>{totalCount}</strong> verified India technology jobs</span>
                </span>
                {jobSearch && (
                  <span className="text-[11px] text-slate-400">Search results for "{jobSearch}"</span>
                )}
              </div>
            );
          })()}

          {/* Job listings (Recommended Tab) */}
          {jobsViewTab === 'recommended' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedJobs
                .filter(rec => {
                  const job = rec.job;
                  if (job.status !== 'ACTIVE') return false;

                  if (jobCategoryFilter !== 'ALL' && job.category !== jobCategoryFilter) return false;

                  if (jobDesignationFilter.trim()) {
                    const df = jobDesignationFilter.toLowerCase().trim();
                    const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                       job.title.toLowerCase().includes(df);
                    if (!desigMatch) return false;
                  }

                  if (jobExperienceFilter !== 'ALL') {
                    const exp = (job.experienceRequirement || '').toLowerCase();
                    if (jobExperienceFilter === 'ENTRY' && !exp.includes('0') && !exp.includes('fresh') && !exp.includes('entry')) return false;
                    if (jobExperienceFilter === 'EXPERIENCED' && (exp.includes('0-1') || exp.includes('fresh') || exp.includes('entry'))) return false;
                  }

                  if (jobScoreFilter !== 'ALL') {
                    const minScore = parseInt(jobScoreFilter, 10);
                    if ((rec.matchScore ?? 0) < minScore) return false;
                  }

                  if (jobSearch.trim()) {
                    const q = jobSearch.toLowerCase();
                    const inTitle = job.title.toLowerCase().includes(q);
                    const inComp = job.company.toLowerCase().includes(q);
                    const inLoc = job.location.toLowerCase().includes(q);
                    const inSkills = job.requiredSkills.some((s: string) => s.toLowerCase().includes(q));
                    if (!inTitle && !inComp && !inLoc && !inSkills) return false;
                  }

                  return true;
                })
                .map(rec => {
                  const job = rec.job;
                  const alreadyApplied = myApplications.some(a => a.jobId === job.id);
                  const matchScore = rec.matchScore ?? 80;

                  return (
                    <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors space-y-3">
                      <div className="space-y-2">
                        {/* Title & Match Score Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                              {job.category && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                  {job.category}
                                </span>
                              )}
                              {job.sourceChannel === 'AI_JOB_SCRAPER' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold uppercase tracking-wider">
                                  AI Job Scraper
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                              <span>{job.company}</span>
                              {job.normalizedDesignation && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-600 font-medium">Role: {job.normalizedDesignation}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                              {matchScore}% Match
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                              {rec.matchLevel || 'Good Match'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {job.location} · {job.employmentType || 'FULL_TIME'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {job.experienceRequirement || '0–1 years'}</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {job.requiredSkills.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>

                        {/* Match Explanation Box */}
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1 mt-2">
                          <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Why this job matches you:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
                            <div className="flex items-center gap-1 text-slate-800 font-medium">
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Role: {rec.designationExplanation || job.normalizedDesignation || 'Compatible role'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-800 font-medium">
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Program: {rec.programExplanation || 'Compatible curriculum'}</span>
                            </div>
                            {(rec.matchedSkills || []).slice(0, 3).map((sk: string) => (
                              <div key={sk} className="flex items-center gap-1 text-emerald-700 font-medium">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{sk}</span>
                              </div>
                            ))}
                            {(rec.missingSkills || []).slice(0, 2).map((sk: string) => (
                              <div key={sk} className="flex items-center gap-1 text-amber-700">
                                <span className="text-amber-500 font-bold text-xs shrink-0">⚠</span>
                                <span>Missing: {sk}</span>
                              </div>
                            ))}
                            {rec.experienceExplanation && (
                              <div className="flex items-center gap-1 text-slate-600 sm:col-span-2 text-[10px]">
                                <span>Experience: {rec.experienceExplanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Source: <strong className="text-slate-700">{job.sourceChannel === 'AI_JOB_SCRAPER' ? 'AI Job Scraper' : job.sourceChannel.replace('_', ' ')}</strong>
                        </span>

                        {alreadyApplied ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedJobForModal(job)}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Job Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Job listings (All Tech Jobs Tab) */}
          {jobsViewTab === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allJobs
                .filter(job => {
                  if (job.status !== 'ACTIVE') return false;

                  if (jobCategoryFilter !== 'ALL' && job.category !== jobCategoryFilter) return false;

                  if (jobDesignationFilter.trim()) {
                    const df = jobDesignationFilter.toLowerCase().trim();
                    const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                       job.title.toLowerCase().includes(df);
                    if (!desigMatch) return false;
                  }

                  if (jobExperienceFilter !== 'ALL') {
                    const exp = (job.experienceRequirement || '').toLowerCase();
                    if (jobExperienceFilter === 'ENTRY' && !exp.includes('0') && !exp.includes('fresh') && !exp.includes('entry')) return false;
                    if (jobExperienceFilter === 'EXPERIENCED' && (exp.includes('0-1') || exp.includes('fresh') || exp.includes('entry'))) return false;
                  }

                  if (jobSearch.trim()) {
                    const q = jobSearch.toLowerCase();
                    const inTitle = job.title.toLowerCase().includes(q);
                    const inComp = job.company.toLowerCase().includes(q);
                    const inLoc = job.location.toLowerCase().includes(q);
                    const inSkills = job.requiredSkills.some((s: string) => s.toLowerCase().includes(q));
                    if (!inTitle && !inComp && !inLoc && !inSkills) return false;
                  }

                  return true;
                })
                .map(job => {
                  const alreadyApplied = myApplications.some(a => a.jobId === job.id);
                  const matchingRec = recommendedJobs.find(r => r.job.id === job.id);

                  return (
                    <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                              {job.category && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                  {job.category}
                                </span>
                              )}
                              {job.sourceChannel === 'AI_JOB_SCRAPER' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold uppercase tracking-wider">
                                  AI Job Scraper
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                              <span>{job.company}</span>
                              {job.normalizedDesignation && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-600 font-medium">Role: {job.normalizedDesignation}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {matchingRec && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black shrink-0">
                              {matchingRec.matchScore}% Match
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {job.location} · {job.employmentType || 'FULL_TIME'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {job.experienceRequirement || '0–1 years'}</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {job.requiredSkills.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Source: <strong className="text-slate-700">{job.sourceChannel === 'AI_JOB_SCRAPER' ? 'AI Job Scraper' : job.sourceChannel.replace('_', ' ')}</strong>
                        </span>

                        {alreadyApplied ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedJobForModal(job)}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Job Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

        </div>
      )}

      {/* =========================================================
          5. SUB-VIEW: MY APPLICATIONS (student_applications)
          ========================================================= */}
      {(currentView === 'student_applications' || currentView === 'applications' || currentView === 'my_applications') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Application Pipeline Tracking</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time progression through recruitment milestones</p>
          </div>

          <div className="space-y-4">
            {myApplications.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400">
                You have not submitted any job applications yet. Go to "Find Jobs" to start applying!
              </div>
            ) : (
              myApplications.map(app => (
                <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                  
                  {/* App Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{app.jobTitle}</h3>
                      <p className="text-xs text-slate-500">{app.company || (app as any).companyName} · Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ApplicationStatusBadge status={app.status} />
                      {app.helpStatus && app.helpStatus !== 'NONE' && (
                        <HelpStatusBadge status={app.helpStatus} />
                      )}

                      {app.status === 'APPLICATION_STARTED' && (
                        <button
                          onClick={() => handleContinueExternalApply(app)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Continue Application ↗</span>
                        </button>
                      )}

                      {app.status === 'NOT_APPLIED' && (
                        <button
                          onClick={() => handleContinueExternalApply(app)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Apply Again ↗</span>
                        </button>
                      )}

                      <button
                        id={`btn-withdraw-app-${app.id}`}
                        disabled={withdrawingAppId === app.id}
                        onClick={() => handleWithdrawApplication(app.id, app.jobTitle)}
                        className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Withdraw your application for this position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{withdrawingAppId === app.id ? 'Withdrawing...' : 'Withdraw'}</span>
                      </button>
                    </div>
                  </div>

                  {/* NOT APPLIED Reason Banner */}
                  {app.status === 'NOT_APPLIED' && app.declineReason && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Reason Recorded: {app.declineReason.replace(/_/g, ' ')}</span>
                      </div>
                      {app.studentComment && (
                        <p className="text-slate-600 text-[11px] pl-6 font-normal">
                          "{app.studentComment}"
                        </p>
                      )}
                      {app.needsHelp && (
                        <div className="pl-6 pt-1 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                          <span>Placement Help Request:</span>
                          <HelpStatusBadge status={app.helpStatus} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Pipeline Bar */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1.5">
                      <span>Applied</span>
                      <span>Shortlisted</span>
                      <span>Interview</span>
                      <span>Selected</span>
                      <span>Offer</span>
                      <span>Joined</span>
                    </div>

                    <div className="grid grid-cols-6 gap-1">
                      {pipelineStagesList.map((st, idx) => {
                        const currentIdx = pipelineStagesList.indexOf(app.status);
                        const isReached = currentIdx >= idx;
                        const isCurrent = app.status === st;

                        return (
                          <div 
                            key={st} 
                            className={`h-2 rounded-full transition-all ${
                              app.status === 'REJECTED' 
                                ? 'bg-rose-200' 
                                : isCurrent 
                                ? 'bg-slate-900 ring-2 ring-slate-900/20' 
                                : isReached 
                                ? 'bg-emerald-500' 
                                : 'bg-slate-200'
                            }`} 
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Rejection Feedback Action if Rejected */}
                  {app.status === 'REJECTED' && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-950 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Student Rejection Feedback
                        </span>
                        {!app.rejectionFeedback && (
                          <button
                            onClick={() => setSelectedAppForFeedback(app)}
                            className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded font-semibold text-[11px] hover:bg-rose-100"
                          >
                            Log Remedial Feedback
                          </button>
                        )}
                      </div>

                      {app.rejectionFeedback ? (
                        <div className="text-rose-900 text-xs">
                          <p><strong>Category:</strong> {app.rejectionFeedback.category.replace(/_/g, ' ')}</p>
                          <p className="mt-0.5"><strong>Details:</strong> {app.rejectionFeedback.details}</p>
                          {app.rejectionFeedback.remedialActionNeeded && (
                            <p className="mt-0.5"><strong>Remedial Plan:</strong> {app.rejectionFeedback.remedialActionNeeded}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-rose-800 text-[11px]">
                          Feedback has not been recorded yet. Submit feedback to schedule tailored coaching sessions.
                        </p>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          6. SUB-VIEW: INTERVIEWS (student_interviews)
          ========================================================= */}
      {(currentView === 'student_interviews' || currentView === 'interviews') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Scheduled Interviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">Direct recruiter rounds and technical assessments</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
              Testing Mode: Quick Status Updates
            </span>
          </div>

          <div className="space-y-4">
            {myApplications.map(app => {
              const latestInterview = app.interviewDates && app.interviewDates.length > 0
                ? app.interviewDates[app.interviewDates.length - 1]
                : null;
              const roundTitle = latestInterview?.title || (app as any).interviewRound || 'Technical Screening';
              const roundDate = latestInterview?.date
                ? new Date(latestInterview.date).toLocaleString()
                : (app as any).interviewDate
                ? new Date((app as any).interviewDate).toLocaleString()
                : 'Pending Confirmation';

              return (
                <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{app.company || (app as any).companyName}</span>
                      <span className="text-xs text-slate-400">· {app.jobTitle}</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-3">
                      <span>Round: <strong className="text-slate-800">{roundTitle}</strong></span>
                      <span>Mode: <strong className="text-slate-800">Online (Google Meet)</strong></span>
                      <span>Date: <strong className="text-slate-800">{roundDate}</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Current Status: <strong className="text-slate-700">{app.status}</strong>
                    </div>
                  </div>

                  {/* Quick Testing Status Changer */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Test Outcome:</span>
                    <button
                      disabled={updatingInterviewId === app.id}
                      onClick={() => handleUpdateInterviewStatus(app.id, 'SELECTED')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold cursor-pointer"
                    >
                      Pass Round
                    </button>
                    <button
                      disabled={updatingInterviewId === app.id}
                      onClick={() => handleUpdateInterviewStatus(app.id, 'REJECTED')}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-semibold cursor-pointer"
                    >
                      Fail Round
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          7. SUB-VIEW: NOTIFICATIONS (student_notifications)
          ========================================================= */}
      {(currentView === 'student_notifications' || currentView === 'notifications') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Important announcements, schedule changes, and application updates</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 text-xs">
            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Placement Eligibility Granted</div>
                <div className="text-slate-500 mt-0.5">
                  Your academic records and placement eligibility have been reviewed and approved by the Main Admin.
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Yesterday at 4:30 PM</div>
              </div>
            </div>

            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">New Requisition Matched: ABC Technologies</div>
                <div className="text-slate-500 mt-0.5">
                  A new role matching your skills in React and TypeScript is open for applications.
                </div>
                <div className="text-[10px] text-slate-400 mt-1">3 days ago</div>
              </div>
            </div>

            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Mock Interview Round Scheduled</div>
                <div className="text-slate-500 mt-0.5">
                  Technical interview screening scheduled for tomorrow afternoon.
                </div>
                <div className="text-[10px] text-slate-400 mt-1">4 days ago</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          JOB DETAILS & APPLICATION MODAL
          ========================================================= */}
      {selectedJobForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Position Details</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedJobForModal.title}</h3>
                <p className="text-xs text-slate-500">{selectedJobForModal.company} · {selectedJobForModal.location}</p>
              </div>
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Role Description:</span>
                <p className="text-slate-600 leading-relaxed">{selectedJobForModal.description}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Eligibility Criteria:</span>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                  <div>• Target Schools: <strong>{(selectedJobForModal.eligibleSchools && selectedJobForModal.eligibleSchools.length > 0) ? selectedJobForModal.eligibleSchools.join(', ') : (selectedJobForModal as any).targetSchool || 'All Schools'}</strong></div>
                  <div>• Target Programs: <strong>{(selectedJobForModal.eligiblePrograms && selectedJobForModal.eligiblePrograms.length > 0) ? selectedJobForModal.eligiblePrograms.join(', ') : (selectedJobForModal as any).targetProgram || 'All Programs'}</strong></div>
                  <div>• Experience: <strong>{selectedJobForModal.experienceRequirement || `${selectedJobForModal.minExperienceYears || 0} years`}</strong></div>
                  <div>• Compensation: <strong>{selectedJobForModal.salaryRange || 'Competitive'}</strong></div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Required Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedJobForModal.requiredSkills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume attachment notification */}
              <div className="p-3 bg-blue-50/80 border border-blue-200/70 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">Attached CV / Resume: </span>
                    <span className="text-slate-600 font-medium">
                      {profile?.resumeFileName || (profile?.resumeUrl ? 'Profile Document Linked' : 'No CV uploaded yet')}
                    </span>
                  </div>
                </div>
                {(!profile?.resumeFileName && !profile?.resumeUrl) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobForModal(null);
                      if (onNavigate) onNavigate('student_profile');
                    }}
                    className="text-blue-700 underline font-bold hover:text-blue-900"
                  >
                    Upload CV Now
                  </button>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attached
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {(() => {
                  const appliedApp = myApplications.find(a => a.jobId === selectedJobForModal.id);
                  const isApplying = applyingJobId === selectedJobForModal.id;
                  const targetUrl = selectedJobForModal.applicationUrl || 
                                    selectedJobForModal.externalUrl || 
                                    selectedJobForModal.sourceUrl || 
                                    (selectedJobForModal as any).url || 
                                    (selectedJobForModal as any).link || 
                                    (selectedJobForModal as any).jobUrl || 
                                    `https://www.google.com/search?q=${encodeURIComponent(selectedJobForModal.company + ' ' + selectedJobForModal.title + ' apply')}`;

                  if (appliedApp) {
                    if (appliedApp.status === 'APPLICATION_STARTED') {
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedJobForModal(null);
                              handleContinueExternalApply(appliedApp);
                            }}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Continue Application ↗</span>
                          </button>
                          <button
                            id={`btn-withdraw-modal-${appliedApp.id}`}
                            disabled={withdrawingAppId === appliedApp.id}
                            onClick={() => handleWithdrawApplication(appliedApp.id, selectedJobForModal.title)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{withdrawingAppId === appliedApp.id ? 'Withdrawing...' : 'Withdraw'}</span>
                          </button>
                        </div>
                      );
                    }

                    if (appliedApp.status === 'NOT_APPLIED') {
                      return (
                        <button
                          disabled={!targetUrl || isApplying}
                          onClick={() => handleExternalApply(selectedJobForModal)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Apply Again ↗</span>
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Applied</span>
                        </div>
                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Job Portal ↗</span>
                          </a>
                        )}
                        <button
                          id={`btn-withdraw-modal-${appliedApp.id}`}
                          disabled={withdrawingAppId === appliedApp.id}
                          onClick={() => handleWithdrawApplication(appliedApp.id, selectedJobForModal.title)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                          title="Withdraw application for this job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{withdrawingAppId === appliedApp.id ? 'Withdrawing...' : 'Withdraw'}</span>
                        </button>
                      </div>
                    );
                  }

                  if (!targetUrl) {
                    return (
                      <button
                        disabled
                        className="px-4 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-medium cursor-not-allowed"
                      >
                        Application link unavailable
                      </button>
                    );
                  }

                  return (
                    <button
                      disabled={isApplying}
                      onClick={() => handleExternalApply(selectedJobForModal)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-200" />
                      <span>{isApplying ? 'Opening...' : 'Apply ↗'}</span>
                    </button>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          REJECTION FEEDBACK LOGGING MODAL
          ========================================================= */}
      {selectedAppForFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Student Rejection Feedback</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record the primary gap identified during evaluation to schedule targeted coaching.
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feedback Category:</label>
                <select
                  value={feedbackCategory}
                  onChange={e => setFeedbackCategory(e.target.value as RejectionCategory)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
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
                <label className="block font-semibold text-slate-700 mb-1">Detailed Remarks:</label>
                <textarea
                  rows={3}
                  value={feedbackDetails}
                  onChange={e => setFeedbackDetails(e.target.value)}
                  placeholder="e.g., Needs improvement in system design and data structures..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actionable Remedial Plan:</label>
                <input
                  type="text"
                  value={remedialAction}
                  onChange={e => setRemedialAction(e.target.value)}
                  placeholder="e.g., Attend coding workshop, refine capstone repository..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForFeedback(null)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          CV / RESUME DOCUMENT PREVIEW MODAL
          ========================================================= */}
      {previewResumeModalOpen && profile && (profile.resumeDataUrl || profile.resumeUrl) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    {profile.resumeFileName || `${profile.fullName.replace(/\s+/g, '_')}_CV.pdf`}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatFileSize(profile.resumeFileSize)} · Official Student Placement Document
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadResume}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewResumeModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-100/90 flex items-center justify-center min-h-[440px]">
              {((profile.resumeDataUrl || profile.resumeUrl)?.startsWith('data:application/pdf') || 
                (profile.resumeFileName && profile.resumeFileName.toLowerCase().endsWith('.pdf'))) ? (
                <iframe
                  src={profile.resumeDataUrl || profile.resumeUrl}
                  className="w-full h-[68vh] rounded-xl shadow-xs bg-white border border-slate-200"
                  title="CV Document Preview"
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                    <FileCheck className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-1">
                    {profile.resumeFileName || 'CV Document Attached'}
                  </h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    This document is securely attached to your placement profile. Word documents (.doc/.docx) can be downloaded and opened in your native editor.
                  </p>
                  <button
                    onClick={handleDownloadResume}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download Document
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 px-6 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
              <span>Attached to <strong>{profile.fullName}</strong> ({profile.registrationNo})</span>
              <button
                type="button"
                onClick={() => setPreviewResumeModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONFIRMATION MODAL (Did you complete application?)
          ========================================================= */}
      {confirmationApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  ↗
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Portal Opened</h3>
                  <p className="text-[11px] text-slate-500">{confirmationApp.jobTitle} · {confirmationApp.company}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmationApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">We opened the official application page in a new tab.</p>
              <p className="text-[11px] text-amber-800">Did you finish submitting your application on the company's website?</p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                disabled={submittingConfirmDecline}
                onClick={() => handleConfirmApplication(confirmationApp.id)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, I Applied</span>
              </button>

              <button
                disabled={submittingConfirmDecline}
                onClick={() => handleOpenDeclineModal(confirmationApp)}
                className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>No, I Didn't Apply</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              You can update your response anytime under "My Applications".
            </p>
          </div>
        </div>
      )}

      {/* =========================================================
          DECLINE REASON MODAL
          ========================================================= */}
      {declineApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reason for Not Applying</h3>
                <p className="text-xs text-slate-500">{declineApp.jobTitle} · {declineApp.company}</p>
              </div>
              <button
                onClick={() => setDeclineApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleDeclineApplicationSubmit(); }} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Why didn't you complete the application? <span className="text-rose-500">*</span>
                </label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value as ApplicationDeclineReason)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {DECLINE_REASON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Additional Comments / Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={declineComment}
                  onChange={(e) => setDeclineComment(e.target.value)}
                  placeholder="Share any specific reason or feedback..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Need placement officer help toggle */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-amber-950 text-xs">Do you need help from the Placement Team?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needsHelp}
                      onChange={(e) => setNeedsHelp(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                {needsHelp && (
                  <p className="text-[11px] text-amber-800">
                    Flagging this will notify Placement Officers to assist you with eligibility, skill gaps, or application issues.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeclineApp(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConfirmDecline}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors disabled:opacity-60"
                >
                  {submittingConfirmDecline ? 'Submitting...' : 'Save Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
