import React, { useState, useEffect } from 'react';
import { StudentProfile, JobListing, JobApplication, RejectionCategory, ApplicationStatus, ApplicationDeclineReason, HelpStatus } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { plainText, applyLink, getDisplayExperience } from '../../lib/text.ts';
import { ApplicationStatusBadge, HelpStatusBadge } from '../common/StatusBadge.tsx';
import { NavigationItem } from '../common/Sidebar.tsx';
import { AIResumeAgent } from '../resume/AIResumeAgent.tsx';
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
  Edit3,
  Paperclip,
  HelpCircle,
  Wand2
} from 'lucide-react';
import { extractResumeDataFromFile } from '../resume/aiService.ts';
import { loadAllVersions } from '../resume/resumeStore.ts';
import { ResumeData } from '../resume/types.ts';
import { normalizeRole } from '../../lib/jobMatching.ts';

export function getDisplayJobCategory(job: any): string {
  const norm = normalizeRole(job.title || job.normalizedDesignation);
  if (norm.domain === 'MARKETING_SALES') {
    return 'Digital Marketing';
  }
  if (norm.domain === 'SALES_OPERATIONS') {
    return 'Sales & Operations';
  }
  if (norm.domain === 'FULL_STACK') {
    return 'Full Stack Development';
  }
  if (norm.domain === 'FRONTEND') {
    return 'Frontend Development';
  }
  if (norm.domain === 'BACKEND') {
    return 'Backend Development';
  }
  if (norm.domain === 'DATA_ANALYTICS') {
    return 'Data Analytics';
  }
  if (norm.domain === 'DATA_ENGINEERING') {
    return 'Data Engineering';
  }
  if (norm.domain === 'AI_ML') {
    return 'AI / Machine Learning';
  }
  return job.category || 'Technology';
}

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

const formatChannelName = (channel?: string) => {
  switch (channel) {
    case 'AI_JOB_SCRAPER': return 'AI Job Scraper';
    case 'ATS_JOB_API': return 'ATS Public API';
    case 'STAFF_REFERRAL': return 'Staff Referral';
    case 'PLACEMENT_DIRECT': return 'Placement Team Direct';
    case 'INBOUND': return 'Inbound';
    case 'OUTREACH': return 'Outreach';
    case 'REPEATED_PARTNER': return 'Repeated Partner';
    case 'SOCIAL_MEDIA': return 'Social Media';
    default: return (channel || '').replaceAll('_', ' ');
  }
};

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
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState<string | null>(null);
  const [previewResumeModalOpen, setPreviewResumeModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Extracted AI Resume Data
  const [extractedResume, setExtractedResume] = useState<ResumeData | null>(null);

  useEffect(() => {
    if (currentStudentId) {
      try {
        const extracted = localStorage.getItem(`extracted_resume_${currentStudentId}`);
        if (extracted) {
          setExtractedResume(JSON.parse(extracted));
        } else {
          setExtractedResume(null);
        }
      } catch (e) {
        console.error('Failed to parse extracted resume:', e);
      }
    }
  }, [currentStudentId, activeTab, resumeUploadSuccess]); // Re-run when view changes or upload completes

  // Job search, sub-tabs and detail modal
  const [jobSearch, setJobSearch] = useState('');
  const [jobsViewTab, setJobsViewTab] = useState<'recommended' | 'all'>('recommended');
  const [jobCategoryFilter, setJobCategoryFilter] = useState('ALL');
  const [jobDesignationFilter, setJobDesignationFilter] = useState('');
  const [jobLocationFilter, setJobLocationFilter] = useState('');
  const [jobWorkModeFilter, setJobWorkModeFilter] = useState('ALL');
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobListing | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
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

  // ── Weekly Check-In Flow ──────────────────────────────────────────────────
  interface CheckInState {
    nextCheckInAt: string;     // ISO timestamp when next popup should appear
    snoozedCount: number;      // How many times student said "no response yet"
    stage: 'awaiting_response' | 'awaiting_next_stage';
  }

  const CHECKIN_DAYS = 7;  // days between check-ins
  const CHECKIN_LS_KEY = (appId: string) => `haca_checkin_${appId}`;

  const getCheckInState = (appId: string): CheckInState | null => {
    try {
      const raw = localStorage.getItem(CHECKIN_LS_KEY(appId));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const setCheckInState = (appId: string, state: CheckInState) => {
    try { localStorage.setItem(CHECKIN_LS_KEY(appId), JSON.stringify(state)); } catch { /* ignore */ }
  };

  const clearCheckInState = (appId: string) => {
    try { localStorage.removeItem(CHECKIN_LS_KEY(appId)); } catch { /* ignore */ }
  };

  // Compute nextCheckInAt for a freshly-applied application (7 days from appliedAt)
  const initCheckInForApp = (app: JobApplication) => {
    const existing = getCheckInState(app.id);
    if (existing) return; // already initialised
    const appliedDate = new Date(app.confirmedAt || app.appliedAt || app.updatedAt || Date.now());
    const nextAt = new Date(appliedDate.getTime() + CHECKIN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    setCheckInState(app.id, { nextCheckInAt: nextAt, snoozedCount: 0, stage: 'awaiting_response' });
  };

  // Check-in modal state
  const [checkInApp, setCheckInApp] = useState<JobApplication | null>(null);
  const [checkInSelectedStatus, setCheckInSelectedStatus] = useState<ApplicationStatus | ''>('');
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);

  // Scan applications after load to find any that are due for check-in
  useEffect(() => {
    if (!myApplications.length) return;
    const eligibleStatuses: ApplicationStatus[] = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'];
    const now = Date.now();
    for (const app of myApplications) {
      if (!eligibleStatuses.includes(app.status)) continue;
      initCheckInForApp(app);
      const state = getCheckInState(app.id);
      if (!state) continue;
      if (now >= new Date(state.nextCheckInAt).getTime()) {
        setCheckInApp(app);
        break; // show one at a time
      }
    }
  }, [myApplications]);

  const handleCheckInSnooze = () => {
    if (!checkInApp) return;
    const state = getCheckInState(checkInApp.id);
    const snoozed = state ? state.snoozedCount + 1 : 1;
    const next = new Date(Date.now() + CHECKIN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    setCheckInState(checkInApp.id, { nextCheckInAt: next, snoozedCount: snoozed, stage: 'awaiting_response' });
    setCheckInApp(null);
  };

  const handleCheckInSubmit = async () => {
    if (!checkInApp || !checkInSelectedStatus) return;
    setCheckInSubmitting(true);
    try {
      await api.updateApplicationStatus(checkInApp.id, checkInSelectedStatus as ApplicationStatus);
      setMyApplications(prev => prev.map(a => a.id === checkInApp.id ? { ...a, status: checkInSelectedStatus as ApplicationStatus, updatedAt: new Date().toISOString() } : a));
      clearCheckInState(checkInApp.id);
      // If status still in progress, set up next check-in in 7 days
      const progressStatuses: ApplicationStatus[] = ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'];
      if (progressStatuses.includes(checkInSelectedStatus as ApplicationStatus)) {
        const next = new Date(Date.now() + CHECKIN_DAYS * 24 * 60 * 60 * 1000).toISOString();
        setCheckInState(checkInApp.id, { nextCheckInAt: next, snoozedCount: 0, stage: 'awaiting_next_stage' });
      }
      setCheckInApp(null);
      setCheckInSelectedStatus('');
      setApplySuccessMessage(`Application status updated to ${(checkInSelectedStatus as string).replaceAll('_', ' ')}. Thank you for the update!`);
      setTimeout(() => setApplySuccessMessage(null), 5000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setCheckInSubmitting(false);
    }
  };

  // Demo: force check-in popup for a specific application immediately
  const handleDemoCheckIn = (app: JobApplication) => {
    // Override the next check-in to now so the popup triggers
    setCheckInState(app.id, { nextCheckInAt: new Date(0).toISOString(), snoozedCount: 0, stage: 'awaiting_response' });
    setCheckInSelectedStatus('');
    setCheckInApp(app);
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── Manual Status Update Flow ─────────────────────────────────────────────
  const [manualUpdateApp, setManualUpdateApp] = useState<JobApplication | null>(null);
  const [manualSelectedStatus, setManualSelectedStatus] = useState<ApplicationStatus | ''>('');
  const [manualUpdateSubmitting, setManualUpdateSubmitting] = useState(false);

  const handleOpenManualUpdate = (app: JobApplication) => {
    setManualUpdateApp(app);
    setManualSelectedStatus(app.status);
  };

  const handleManualStatusSubmit = async () => {
    if (!manualUpdateApp || !manualSelectedStatus) return;
    setManualUpdateSubmitting(true);
    try {
      await api.updateApplicationStatus(manualUpdateApp.id, manualSelectedStatus as ApplicationStatus);
      setMyApplications(prev => prev.map(a => a.id === manualUpdateApp.id ? { ...a, status: manualSelectedStatus as ApplicationStatus, updatedAt: new Date().toISOString() } : a));
      
      // Update check-in state:
      const progressStatuses: ApplicationStatus[] = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'];
      if (progressStatuses.includes(manualSelectedStatus as ApplicationStatus)) {
        const next = new Date(Date.now() + CHECKIN_DAYS * 24 * 60 * 60 * 1000).toISOString();
        setCheckInState(manualUpdateApp.id, { 
          nextCheckInAt: next, 
          snoozedCount: 0, 
          stage: manualSelectedStatus === 'APPLIED' ? 'awaiting_response' : 'awaiting_next_stage' 
        });
      } else {
        clearCheckInState(manualUpdateApp.id);
      }

      const updatedTitle = manualUpdateApp.jobTitle;
      const statusLabel = (manualSelectedStatus as string).replaceAll('_', ' ');
      setManualUpdateApp(null);
      setManualSelectedStatus('');
      setApplySuccessMessage(`Status for "${updatedTitle}" successfully updated to ${statusLabel}!`);
      setTimeout(() => setApplySuccessMessage(null), 5000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setManualUpdateSubmitting(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

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
        setGatedReason('Your mentor has not marked you placement-eligible yet.');
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
            setGatedReason('Your mentor has not marked you placement-eligible yet.');
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

  const handleExpressInterest = async (job: JobListing) => {
    if (!profile) return;
    setApplyingJobId(job.id);
    setApplyError(null);
    try {
      const res = await api.applyForJob(job.id, currentStudentId);
      const appId = res?.application?.id;
      if (appId) {
        await api.confirmApplication(appId);
      }
      setSelectedJobForModal(null);
      setApplySuccessMessage(`Interest Registered! Your profile & CV have been submitted to the HACA Placement Team for "${job.title}". The placement team will review your application for next steps.`);
      setTimeout(() => setApplySuccessMessage(null), 6000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setApplyError(err?.message || "Couldn't register your interest. Please try again.");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleExternalApply = async (job: JobListing) => {
    if (!profile) return;
    const targetUrl = applyLink(job);
    if (!targetUrl) {
      return handleExpressInterest(job);
    }
    setApplyError(null);

    // 1. Immediately open the official application URL in a new browser tab (synchronous during click to avoid popup blocker)
    window.open(targetUrl, '_blank');

    // 2. Immediately close the job detail modal
    setSelectedJobForModal(null);
    setApplyingJobId(job.id);
    setApplySuccessMessage(null);

    // 3. Immediately show the existing "Official Portal Opened" confirmation modal
    const existing = myApplications.find(a => a.jobId === job.id);
    const initialModalApp: JobApplication = existing || {
      id: `pending-${job.id}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      studentId: currentStudentId,
      studentName: profile.fullName,
      studentEmail: profile.email,
      school: profile.school,
      program: profile.program,
      batch: profile.batch,
      sourceChannel: job.sourceChannel,
      jobSource: formatChannelName(job.sourceChannel) || 'Placement Team Direct',
      applicationUrl: targetUrl,
      status: 'APPLICATION_STARTED',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interviewDates: []
    };

    setConfirmationApp(initialModalApp);

    // 4. Create or update the shared application record in the backend (status = APPLICATION_STARTED)
    try {
      const res = await api.applyForJob(job.id, currentStudentId);
      if (res?.application) {
        setConfirmationApp(prev => (prev && prev.jobId === job.id ? res.application : prev));
      }
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      // The external tab is already open; tell the student we could not
      // track it so they can retry rather than wonder why it vanished.
      setApplyError(err?.message || "Couldn't record this application. Please try again.");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleContinueExternalApply = (app: JobApplication) => {
    const targetUrl = applyLink(app as any);
    if (targetUrl) window.open(targetUrl, '_blank');
    setConfirmationApp(app);
  };

  const handleConfirmApplication = async (appId: string) => {
    setSubmittingConfirmDecline(true);
    try {
      let targetId = appId;
      if (targetId.startsWith('pending-')) {
        const jobId = targetId.replace('pending-', '');
        const res = await api.applyForJob(jobId, currentStudentId);
        targetId = res.application.id;
      }
      await api.confirmApplication(targetId);
      setConfirmationApp(null);
      setApplySuccessMessage('Great job! Your application status has been confirmed as APPLIED.');
      setTimeout(() => setApplySuccessMessage(null), 5000);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setApplyError(`Couldn't confirm the application: ${err.message}`);
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
      let targetId = declineApp.id;
      if (targetId.startsWith('pending-')) {
        const jobId = targetId.replace('pending-', '');
        const res = await api.applyForJob(jobId, currentStudentId);
        targetId = res.application.id;
      }
      await api.declineApplication(targetId, {
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
      setApplyError(`Couldn't save your response: ${err.message}`);
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
          
          // AI Extraction
          try {
            setIsExtractingResume(true);
            const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            const mimeType = file.type || 'application/pdf';
            const extractedData = await extractResumeDataFromFile(base64Data, mimeType);
            localStorage.setItem(`extracted_resume_${currentStudentId}`, JSON.stringify(extractedData));
            if (extractedData.personal?.targetRole) {
              try {
                await api.updateStudent(currentStudentId, { designation: extractedData.personal.targetRole });
              } catch (syncErr) {
                console.warn('Could not sync student designation:', syncErr);
              }
            }
            setResumeUploadSuccess(`"${file.name}" uploaded and AI analyzed successfully! Job matches have been updated.`);
          } catch (aiErr: any) {
            console.error('AI Extraction error:', aiErr);
            setResumeUploadSuccess(null); // Clear success toast
            setResumeUploadError(`AI Extraction failed: ${aiErr.message || 'Please check your Groq API key and model.'}`);
          } finally {
            setIsExtractingResume(false);
          }

          setTimeout(() => setResumeUploadSuccess(null), 5000);
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
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{applySuccessMessage}</span>
          </div>
          <button onClick={() => setApplySuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {applyError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{applyError}</span>
          </div>
          <button onClick={() => setApplyError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {withdrawMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
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
        <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-border shadow-sm">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading student profile & placement records...</p>
        </div>
      )}

      {/* Fallback state if profile failed */}
      {!loading && !profile && (
        <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-slate-500">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Student Profile</h3>
            <p className="text-xs text-slate-500 mt-1">
              Could not load profile records for active student ({currentStudentId}).
            </p>
          </div>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
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
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Student Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
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
                    {isEligible ? 'Can browse and apply to active positions' : 'Mentor approval pending'}
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
              className="bg-white p-5 rounded-2xl border border-border shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Profile Completion</span>
                <UserIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground">
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
              className="bg-white p-5 rounded-2xl border border-border shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Recommended Jobs</span>
                <Briefcase className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground">
                  {recommendedJobs.filter(r => r.designationMatch && r.verdict !== 'NOT_MATCHED' && (r.matchScore ?? 0) >= 40).length}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">Matching Profile</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {allJobs.length} total positions in directory
              </p>
            </div>

            {/* Active Applications */}
            <div 
              onClick={() => onNavigate && onNavigate('student_applications')}
              className="bg-white p-5 rounded-2xl border border-border shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Applications</span>
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground">{myApplications.length}</span>
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
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Recommended Jobs</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Matched with your skills & program ({recommendedJobs.filter(r => r.designationMatch && r.verdict !== 'NOT_MATCHED' && (r.matchScore ?? 0) >= 40).length} jobs available)
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigate && onNavigate('student_jobs')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Browse All ({recommendedJobs.filter(r => r.designationMatch && r.verdict !== 'NOT_MATCHED' && (r.matchScore ?? 0) >= 40).length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const dashboardRecs = recommendedJobs.filter(r => r.designationMatch && r.verdict !== 'NOT_MATCHED' && (r.matchScore ?? 0) >= 40);
                    if (dashboardRecs.length === 0) {
                      return (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No matching job recommendations currently found for your domain. Explore all open jobs under Find Jobs.
                        </div>
                      );
                    }
                    return dashboardRecs.slice(0, 50).map(rec => {
                      const job = rec.job;
                      const matchScore = rec.matchScore ?? 0;
                      const matched = rec.matchedSkills || [];
                      const missing = rec.missingSkills || [];

                      return (
                        <div key={job.id} className="p-3.5 bg-muted/60 rounded-xl border border-border space-y-2.5 hover:border-primary/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-foreground text-xs sm:text-sm">{job.title}</h4>
                                {getDisplayJobCategory(job) && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                    {getDisplayJobCategory(job)}
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
                              <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                                matchScore >= 70 ? 'bg-emerald-100 text-emerald-800' :
                                matchScore >= 40 ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {matchScore}% Match
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                {rec.matchLevel || 'Low Match'}
                              </span>
                            </div>
                          </div>

                          {/* Skills badges */}
                          <div className="flex flex-wrap gap-1">
                            {job.requiredSkills.map((sk: string) => (
                              <span key={sk} className="px-2 py-0.5 bg-white border border-border rounded text-slate-700 text-[10px] font-medium">
                                {sk}
                              </span>
                            ))}
                          </div>

                          {/* "Why this job matches you" breakdown */}
                          <div className="p-2.5 bg-white rounded-lg border border-border/70 text-[11px] space-y-1.5">
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
                              className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                            >
                              Job Details
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Upcoming Interviews</h3>
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
                            <div className="font-semibold text-foreground">{app.jobTitle}</div>
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
          <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
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
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-border rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No active job applications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore open tech opportunities and apply directly to employer pipelines.</p>
                <button
                  onClick={() => onNavigate && onNavigate('student_jobs')}
                  className="mt-3 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Browse Tech Jobs <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {myApplications.map(app => (
                  <div key={app.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs">{app.jobTitle}</span>
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

                    <div className="flex items-center gap-2 shrink-0">
                      <ApplicationStatusBadge status={app.status} />
                      <button
                        id={`btn-dash-update-status-${app.id}`}
                        onClick={() => handleOpenManualUpdate(app)}
                        className="px-2 py-1 text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Manually update this application's status"
                      >
                        <Edit3 className="w-3 h-3 text-violet-600" />
                        <span>Update Status</span>
                      </button>
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
          <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Student Activity</h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Placement eligibility approved by your mentor.</span>
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
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-base font-bold text-foreground mb-4">Student Profile</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="text-foreground font-bold text-sm mt-0.5 block">{profile.fullName}</span>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Number</span>
                <span className="text-foreground font-bold text-sm mt-0.5 block">{profile.registrationNo}</span>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">School</span>
                <span className="text-foreground font-semibold mt-0.5 block">{profile.school}</span>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Program & Batch</span>
                <span className="text-foreground font-semibold mt-0.5 block">{profile.program} ({profile.batch})</span>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-5 pt-4 border-t border-border/70">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Verified Technical Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {(profile.academic?.skills || (profile as any).skills || []).map((s: string) => (
                  <span key={s} className="px-2.5 py-1 bg-muted text-slate-800 rounded-lg text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Resume Upload Section */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Resume upload</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    Placement Credential
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your official CV or resume document (.pdf, .doc, .docx). Campus placement coordinators and recruiting partners use this file during applicant screening.
                </p>
              </div>

              <div className="flex flex-col gap-2 items-end sm:items-end sm:justify-start">
                {(profile.resumeFileName || profile.resumeDataUrl) && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-end">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verified CV On File</span>
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={() => onNavigate('student_resume_builder')}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-200 transition-colors whitespace-nowrap self-start sm:self-end flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  Don't have a resume?
                </button>
              </div>
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
              <div className="mb-4 p-4 rounded-xl bg-muted border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-200/80 flex items-center justify-center shrink-0 text-red-600 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        {profile.resumeFileName || `${profile.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                      </span>
                      <span className="px-1.5 py-0.5 bg-secondary text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
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
                      className="px-3 py-1.5 bg-white border border-border hover:bg-muted text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Preview
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadResume}
                    className="px-3 py-1.5 bg-white border border-border hover:bg-muted text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingResume || isExtractingResume}
                    className="px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${(isUploadingResume || isExtractingResume) ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{isUploadingResume ? 'Uploading...' : isExtractingResume ? 'Analyzing...' : 'Replace File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteResume}
                    disabled={isUploadingResume || isExtractingResume}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Remove uploaded CV document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}

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

            {/* Drag and Drop Zone (Only show if no resume exists) */}
            {!(profile.resumeFileName || profile.resumeDataUrl) && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 scale-[1.005]' 
                    : 'border-border hover:border-primary/50 bg-muted/60 hover:bg-muted'
                }`}
              >
                <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-slate-600 mb-3 shadow-sm">
                  {(isUploadingResume || isExtractingResume) ? (
                    isExtractingResume ? <Wand2 className="w-6 h-6 text-violet-600 animate-pulse" /> : <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                  )}
                </div>

                {isExtractingResume ? (
                  <div>
                    <p className="text-xs font-bold text-violet-700">AI is analyzing your resume...</p>
                    <p className="text-[11px] text-violet-600/70 mt-0.5">Extracting skills and experience for smart job matching</p>
                  </div>
                ) : isUploadingResume ? (
                  <div>
                    <p className="text-xs font-bold text-foreground">Processing and uploading your CV file...</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Encrypting and attaching document to student profile</p>
                  </div>
                ) : isDragging ? (
                  <div>
                    <p className="text-xs font-bold text-blue-900">Release document to upload</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">PDF or Word document format (.pdf, .doc, .docx)</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag and drop your CV / Resume here, or click to browse files
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Accepts <strong>PDF (.pdf)</strong> and <strong>Word (.doc, .docx)</strong> up to 15MB
                    </p>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border shadow-sm rounded-lg text-xs font-semibold text-slate-700 hover:bg-muted transition-colors">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Choose File from Computer
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Resume Details inside Upload Card */}
            {extractedResume && (
              <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-bold text-foreground">Extracted CV Details</h3>
              </div>

              {/* Personal Info & Target Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 pb-5 border-b border-border/70 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Personal Information</span>
                  <div className="space-y-1 text-slate-700">
                    <p><strong className="text-slate-800">Name:</strong> {extractedResume.personal?.fullName || 'N/A'}</p>
                    <p><strong className="text-slate-800">Email:</strong> {extractedResume.personal?.email || 'N/A'}</p>
                    <p><strong className="text-slate-800">Phone:</strong> {extractedResume.personal?.phone || 'N/A'}</p>
                    <p><strong className="text-slate-800">Location:</strong> {extractedResume.personal?.location || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Professional Target</span>
                  <div className="space-y-1 text-slate-700">
                    <p><strong className="text-slate-800">Target Role:</strong> {extractedResume.personal?.targetRole || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {extractedResume.summary && (
                <div className="mb-5 pb-5 border-b border-border/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Professional Summary</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{extractedResume.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Experience */}
                {extractedResume.experience && extractedResume.experience.length > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-2">Experience</span>
                    <div className="space-y-3">
                      {extractedResume.experience.map((exp: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                          <strong className="block text-slate-800 text-[13px]">{exp.jobTitle}</strong>
                          <span className="text-slate-600 font-medium">{exp.company}</span>
                          <span className="text-slate-400 block mt-1">{exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {extractedResume.education && extractedResume.education.length > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-2">Education</span>
                    <div className="space-y-3">
                      {extractedResume.education.map((edu: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                          <strong className="block text-slate-800 text-[13px]">{edu.degree}</strong>
                          <span className="text-slate-600 font-medium">{edu.institution}</span>
                          <span className="text-slate-400 block mt-1">{edu.startDate} - {edu.endDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              {extractedResume.skills && Object.values(extractedResume.skills).flat().length > 0 && (
                <div className="mt-5 pt-5 border-t border-border/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-2">Extracted Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(extractedResume.skills).flat().filter(Boolean).map((skill: any, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Profile Links Form */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-1">Portfolio & Professional Profiles</h3>
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
                  className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Portfolio / GitHub URL:</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile:</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <button
                type="submit"
                disabled={savingLinks}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingLinks ? 'Saving...' : 'Save Profile Links'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          2B. SUB-VIEW: AI RESUME AGENT
          ========================================================= */}
      {activeTab === 'student_resume_builder' && (
        <AIResumeAgent
          studentId={currentStudentId}
          profile={profile}
          onBack={() => onNavigate('student_profile')}
        />
      )}

      {/* =========================================================
          3. SUB-VIEW: FIND JOBS (student_jobs)
          ========================================================= */}
      {(currentView === 'student_jobs' || currentView === 'jobs' || currentView === 'recommended_jobs') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Technology Opportunities</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified IT & technology positions ranked against your program ({profile?.program || 'your course'}) & skills
              </p>
            </div>

            {/* Tab Switcher: Recommended vs All Tech */}
            <div className="flex items-center p-1 bg-muted rounded-xl text-xs font-semibold">
              <button
                onClick={() => setJobsViewTab('recommended')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  jobsViewTab === 'recommended'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-slate-600 hover:text-foreground'
                }`}
              >
                Recommended for You ({recommendedJobs.filter(r => r.designationMatch && r.verdict !== 'NOT_MATCHED' && (r.matchScore ?? 0) >= 40).length})
              </button>
              <button
                onClick={() => setJobsViewTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  jobsViewTab === 'all'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-slate-600 hover:text-foreground'
                }`}
              >
                HACA Jobs ({allJobs.filter(j => j.status === 'ACTIVE' && j.sourceChannel !== 'AI_JOB_SCRAPER' && j.sourceChannel !== 'ATS_JOB_API').length})
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-border shadow-sm flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job title, company, skill..."
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={jobCategoryFilter}
                onChange={e => setJobCategoryFilter(e.target.value)}
                className="appearance-none bg-muted border border-border text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer font-medium"
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
                className="w-full px-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
              />
            </div>

            {/* Location Finding Bar */}
            <div className="relative w-40">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Location (city/state)..."
                value={jobLocationFilter}
                onChange={e => setJobLocationFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
              />
            </div>

            {/* Work Mode Filter */}
            <div className="relative">
              <select
                value={jobWorkModeFilter}
                onChange={e => setJobWorkModeFilter(e.target.value)}
                className="appearance-none bg-muted border border-border text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer font-medium"
              >
                <option value="ALL">Work Mode: All</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-site / In-Office</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(jobSearch || jobCategoryFilter !== 'ALL' || jobDesignationFilter || jobLocationFilter || jobWorkModeFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setJobSearch('');
                  setJobCategoryFilter('ALL');
                  setJobDesignationFilter('');
                  setJobLocationFilter('');
                  setJobWorkModeFilter('ALL');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Results Summary Banner */}
          {(() => {
            const compatibleRecs = recommendedJobs.filter(r => r.designationMatch && r.verdict !== 'NOT_MATCHED' && (r.matchScore ?? 0) >= 40);
            const filteredRecs = compatibleRecs.filter(rec => {
              const job = rec.job;
              if (job.status !== 'ACTIVE') return false;
              if (jobCategoryFilter !== 'ALL' && getDisplayJobCategory(job) !== jobCategoryFilter && job.category !== jobCategoryFilter) return false;
              if (jobDesignationFilter.trim()) {
                const df = jobDesignationFilter.toLowerCase().trim();
                const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                   job.title.toLowerCase().includes(df);
                if (!desigMatch) return false;
              }
              if (jobLocationFilter.trim()) {
                const locQ = jobLocationFilter.toLowerCase().trim();
                if (!(job.location || '').toLowerCase().includes(locQ)) return false;
              }
              if (jobWorkModeFilter !== 'ALL') {
                const combined = `${job.location || ''} ${job.title || ''} ${job.description || ''}`.toLowerCase();
                const isRemote = combined.includes('remote') || combined.includes('work from home') || combined.includes('wfh');
                const isHybrid = combined.includes('hybrid');
                if (jobWorkModeFilter === 'REMOTE' && !isRemote) return false;
                if (jobWorkModeFilter === 'HYBRID' && !isHybrid) return false;
                if (jobWorkModeFilter === 'ON_SITE' && (isRemote || isHybrid)) return false;
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
              if (job.sourceChannel === 'AI_JOB_SCRAPER' || job.sourceChannel === 'ATS_JOB_API') return false;
              if (jobCategoryFilter !== 'ALL' && getDisplayJobCategory(job) !== jobCategoryFilter && job.category !== jobCategoryFilter) return false;
              if (jobDesignationFilter.trim()) {
                const df = jobDesignationFilter.toLowerCase().trim();
                const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                   job.title.toLowerCase().includes(df);
                if (!desigMatch) return false;
              }
              if (jobLocationFilter.trim()) {
                const locQ = jobLocationFilter.toLowerCase().trim();
                if (!(job.location || '').toLowerCase().includes(locQ)) return false;
              }
              if (jobWorkModeFilter !== 'ALL') {
                const combined = `${job.location || ''} ${job.title || ''} ${job.description || ''}`.toLowerCase();
                const isRemote = combined.includes('remote') || combined.includes('work from home') || combined.includes('wfh');
                const isHybrid = combined.includes('hybrid');
                if (jobWorkModeFilter === 'REMOTE' && !isRemote) return false;
                if (jobWorkModeFilter === 'HYBRID' && !isHybrid) return false;
                if (jobWorkModeFilter === 'ON_SITE' && (isRemote || isHybrid)) return false;
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

            const totalHacaJobs = allJobs.filter(j => j.status === 'ACTIVE' && j.sourceChannel !== 'AI_JOB_SCRAPER' && j.sourceChannel !== 'ATS_JOB_API');
            const currentCount = jobsViewTab === 'recommended' ? filteredRecs.length : filteredAll.length;
            const totalCount = jobsViewTab === 'recommended' 
              ? compatibleRecs.length
              : totalHacaJobs.length;

            return (
              <div className="flex items-center justify-between px-1 py-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {jobsViewTab === 'recommended' ? (
                    <span>Showing <strong>{currentCount}</strong> of <strong>{totalCount}</strong> matching opportunities for your profile</span>
                  ) : (
                    <span>Showing <strong>{currentCount}</strong> of <strong>{totalCount}</strong> verified HACA placement opportunities</span>
                  )}
                </span>
                {jobSearch && (
                  <span className="text-[11px] text-slate-400">Search results for "{jobSearch}"</span>
                )}
              </div>
            );
          })()}

          {/* Job listings (Recommended Tab) */}
          {jobsViewTab === 'recommended' && (() => {
            const compatibleRecs = recommendedJobs.filter(r => r.designationMatch && r.verdict !== 'NOT_MATCHED' && (r.matchScore ?? 0) >= 40);
            const displayRecs = compatibleRecs.filter(rec => {
              const job = rec.job;
              if (job.status !== 'ACTIVE') return false;

              if (jobCategoryFilter !== 'ALL' && getDisplayJobCategory(job) !== jobCategoryFilter && job.category !== jobCategoryFilter) return false;

              if (jobDesignationFilter.trim()) {
                const df = jobDesignationFilter.toLowerCase().trim();
                const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                   job.title.toLowerCase().includes(df);
                if (!desigMatch) return false;
              }

              if (jobLocationFilter.trim()) {
                const locQ = jobLocationFilter.toLowerCase().trim();
                if (!(job.location || '').toLowerCase().includes(locQ)) return false;
              }

              if (jobWorkModeFilter !== 'ALL') {
                const combined = `${job.location || ''} ${job.title || ''} ${job.description || ''}`.toLowerCase();
                const isRemote = combined.includes('remote') || combined.includes('work from home') || combined.includes('wfh');
                const isHybrid = combined.includes('hybrid');
                if (jobWorkModeFilter === 'REMOTE' && !isRemote) return false;
                if (jobWorkModeFilter === 'HYBRID' && !isHybrid) return false;
                if (jobWorkModeFilter === 'ON_SITE' && (isRemote || isHybrid)) return false;
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

            if (displayRecs.length === 0) {
              return (
                <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-foreground text-sm">No Matching Recommendations Found</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    We filtered out non-matching positions so you only see roles aligned with your field. Switch to <strong>HACA Jobs</strong> to browse internal placement drives.
                  </p>
                  <button
                    onClick={() => setJobsViewTab('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    View HACA Jobs
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayRecs.map(rec => {
                  const job = rec.job;
                  const alreadyApplied = myApplications.some(a => a.jobId === job.id && a.status === 'APPLIED');
                  const matchScore = rec.matchScore ?? 0;

                  return (
                    <div key={job.id} className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors space-y-3">
                      <div className="space-y-2">
                        {/* Title & Match Score Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-foreground text-sm">{job.title}</h3>
                              {getDisplayJobCategory(job) && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                  {getDisplayJobCategory(job)}
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
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                              matchScore >= 70 ? 'bg-emerald-100 text-emerald-800' :
                              matchScore >= 40 ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {matchScore}% Match
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                              {rec.matchLevel || 'Low Match'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {job.location} · {job.employmentType || 'FULL_TIME'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {getDisplayExperience(job)}</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {plainText(job.description)}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {job.requiredSkills.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-muted border border-border text-slate-600 text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>

                        {/* Match Explanation Box */}
                        <div className="p-2.5 bg-muted rounded-lg border border-border/70 text-[11px] space-y-1 mt-2">
                          <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                            {rec.verdict === 'NOT_MATCHED' ? 'Role & Domain Alignment:' : 'Why this job matches you:'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
                            <div className={`flex items-center gap-1 font-medium ${rec.designationMatch ? 'text-slate-800' : 'text-amber-700'}`}>
                              {rec.designationMatch ? (
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              )}
                              <span>Role: {rec.designationExplanation || job.normalizedDesignation || 'Role assessment'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-800 font-medium">
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Program: {rec.programExplanation || 'Curriculum assessment'}</span>
                            </div>
                            {(rec.matchedSkills || []).map((sk: string) => (
                              <div key={sk} className="flex items-center gap-1 text-emerald-700 font-medium">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{sk}</span>
                              </div>
                            ))}
                            {(rec.missingSkills || []).map((sk: string) => (
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

                      <div className="pt-3 mt-3 border-t border-border/70 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Source: <strong className="text-slate-700">{formatChannelName(job.sourceChannel)}</strong>
                        </span>

                        {alreadyApplied ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedJobForModal(job)}
                            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                          >
                            Job Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Job listings (HACA Jobs Tab) */}
          {jobsViewTab === 'all' && (() => {
            const hacaJobs = allJobs.filter(job => {
              if (job.status !== 'ACTIVE') return false;
              if (job.sourceChannel === 'AI_JOB_SCRAPER' || job.sourceChannel === 'ATS_JOB_API') return false;
              if (jobCategoryFilter !== 'ALL' && getDisplayJobCategory(job) !== jobCategoryFilter && job.category !== jobCategoryFilter) return false;

              if (jobDesignationFilter.trim()) {
                const df = jobDesignationFilter.toLowerCase().trim();
                const desigMatch = (job.normalizedDesignation || '').toLowerCase().includes(df) ||
                                   job.title.toLowerCase().includes(df);
                if (!desigMatch) return false;
              }

              if (jobLocationFilter.trim()) {
                const locQ = jobLocationFilter.toLowerCase().trim();
                if (!(job.location || '').toLowerCase().includes(locQ)) return false;
              }

              if (jobWorkModeFilter !== 'ALL') {
                const combined = `${job.location || ''} ${job.title || ''} ${job.description || ''}`.toLowerCase();
                const isRemote = combined.includes('remote') || combined.includes('work from home') || combined.includes('wfh');
                const isHybrid = combined.includes('hybrid');
                if (jobWorkModeFilter === 'REMOTE' && !isRemote) return false;
                if (jobWorkModeFilter === 'HYBRID' && !isHybrid) return false;
                if (jobWorkModeFilter === 'ON_SITE' && (isRemote || isHybrid)) return false;
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

            if (hacaJobs.length === 0) {
              return (
                <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-foreground text-sm">No HACA Jobs Found</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No exclusive HACA campus drives or referral positions match your current search and filters.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hacaJobs.map(job => {
                  const alreadyApplied = myApplications.some(a => a.jobId === job.id && a.status === 'APPLIED');
                  const matchingRec = recommendedJobs.find(r => r.job.id === job.id);

                  return (
                    <div key={job.id} className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-foreground text-sm">{job.title}</h3>
                              {getDisplayJobCategory(job) && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                  {getDisplayJobCategory(job)}
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
                            <span className={`px-2 py-0.5 rounded-md text-xs font-black shrink-0 ${
                              (matchingRec.matchScore ?? 0) >= 70 ? 'bg-emerald-100 text-emerald-800' :
                              (matchingRec.matchScore ?? 0) >= 40 ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {matchingRec.matchScore}% Match
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {job.location} · {job.employmentType || 'FULL_TIME'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {getDisplayExperience(job)}</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {plainText(job.description)}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {job.requiredSkills.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-muted border border-border text-slate-600 text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>

                        {/* Match Explanation Box (Added for HACA Jobs tab too) */}
                        {matchingRec && (
                          <div className="p-2.5 bg-muted rounded-lg border border-border/70 text-[11px] space-y-1 mt-2">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                              {matchingRec.verdict === 'NOT_MATCHED' ? 'Role & Domain Alignment:' : 'Why this job matches you:'}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
                              <div className={`flex items-center gap-1 font-medium ${matchingRec.designationMatch ? 'text-slate-800' : 'text-amber-700'}`}>
                                {matchingRec.designationMatch ? (
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                                <span>Role: {matchingRec.designationExplanation || job.normalizedDesignation || 'Role assessment'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-800 font-medium">
                                {matchingRec.designationMatch ? (
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                                <span>Program: {matchingRec.programExplanation || 'Curriculum assessment'}</span>
                              </div>
                              {(matchingRec.matchedSkills || []).map((sk: string) => (
                                <div key={sk} className="flex items-center gap-1 text-emerald-700 font-medium">
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{sk}</span>
                                </div>
                              ))}
                              {(matchingRec.missingSkills || []).map((sk: string) => (
                                <div key={sk} className="flex items-center gap-1 text-amber-700">
                                  <span className="text-amber-500 font-bold text-xs shrink-0">⚠</span>
                                  <span>Missing: {sk}</span>
                                </div>
                              ))}
                              {matchingRec.experienceExplanation && (
                                <div className="flex items-center gap-1 text-slate-600 sm:col-span-2 text-[10px]">
                                  <span>Experience: {matchingRec.experienceExplanation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-border/70 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Source: <strong className="text-slate-700">{formatChannelName(job.sourceChannel)}</strong>
                        </span>

                        {alreadyApplied ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedJobForModal(job)}
                            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                          >
                            Job Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>
      )}

      {/* =========================================================
          5. SUB-VIEW: MY APPLICATIONS (student_applications)
          ========================================================= */}
      {(currentView === 'student_applications' || currentView === 'applications' || currentView === 'my_applications') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Application Pipeline Tracking</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time progression through recruitment milestones</p>
            </div>
            {/* Weekly Check-In Info Banner */}
            {myApplications.some(a => a.status === 'APPLIED') && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>We'll check in weekly on applications awaiting a response.</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {myApplications.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-border text-xs text-slate-400">
                You have not submitted any job applications yet. Go to "Find Jobs" to start applying!
              </div>
            ) : (
              myApplications.map(app => (
                <div key={app.id} className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-4">
                  
                  {/* App Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{app.jobTitle}</h3>
                      <p className="text-xs text-slate-500">{app.company || (app as any).companyName} · Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ApplicationStatusBadge status={app.status} />
                      {app.helpStatus && app.helpStatus !== 'NONE' && (
                        <HelpStatusBadge status={app.helpStatus} />
                      )}

                      {/* Manual Update Status Button */}
                      <button
                        id={`btn-manual-update-status-${app.id}`}
                        onClick={() => handleOpenManualUpdate(app)}
                        title="Manually update this application's status"
                        className="px-2.5 py-1 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-violet-600" />
                        <span>Update Status</span>
                      </button>

                      {/* Demo Check-In Trigger */}
                      {(app.status === 'APPLIED' || app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED' || app.status === 'INTERVIEWED') && (
                        <button
                          onClick={() => handleDemoCheckIn(app)}
                          title="Demo: Trigger weekly check-in popup now"
                          className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Bell className="w-3 h-3 text-slate-500" />
                          <span>Test Check-In</span>
                        </button>
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
                    <div className="p-3 bg-muted border border-border rounded-xl text-xs space-y-1">
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
                  <div className="bg-muted p-3 rounded-xl border border-border/70">
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
                                ? 'bg-primary ring-2 ring-slate-900/20' 
                                : isReached 
                                ? 'bg-emerald-500' 
                                : 'bg-secondary'
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
              <h2 className="text-xl font-bold text-foreground tracking-tight">Scheduled Interviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">Direct recruiter rounds and technical assessments</p>
            </div>
            <span className="text-xs text-slate-400 bg-muted px-3 py-1 rounded-lg">
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
                <div key={app.id} className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{app.company || (app as any).companyName}</span>
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
            <h2 className="text-xl font-bold text-foreground tracking-tight">Notifications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Important announcements, schedule changes, and application updates</p>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border/70 text-xs">
            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">Placement Eligibility Granted</div>
                <div className="text-slate-500 mt-0.5">
                  Your academic records and placement eligibility have been reviewed and approved by your mentor.
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Yesterday at 4:30 PM</div>
              </div>
            </div>

            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">New Requisition Matched: ABC Technologies</div>
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
                <div className="font-semibold text-foreground">Mock Interview Round Scheduled</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-border/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Position Details</span>
                <h3 className="text-base font-bold text-foreground mt-0.5">{selectedJobForModal.title}</h3>
                <p className="text-xs text-slate-500">{selectedJobForModal.company} · {selectedJobForModal.location}</p>
              </div>
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Role Description:</span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{plainText(selectedJobForModal.description)}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Eligibility Criteria:</span>
                <div className="p-3 bg-muted rounded-xl space-y-1 text-[11px] text-slate-600">
                  <div>• Target Schools: <strong>{(selectedJobForModal.eligibleSchools && selectedJobForModal.eligibleSchools.length > 0) ? selectedJobForModal.eligibleSchools.join(', ') : (selectedJobForModal as any).targetSchool || 'All Schools'}</strong></div>
                  <div>• Target Programs: <strong>{(selectedJobForModal.eligiblePrograms && selectedJobForModal.eligiblePrograms.length > 0) ? selectedJobForModal.eligiblePrograms.join(', ') : (selectedJobForModal as any).targetProgram || 'All Programs'}</strong></div>
                  <div>• Experience: <strong>{getDisplayExperience(selectedJobForModal)}</strong></div>
                  <div>• Compensation: <strong>{selectedJobForModal.salaryRange || 'Competitive'}</strong></div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Required Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedJobForModal.requiredSkills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-muted text-slate-800 text-[11px]">
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
                    <span className="font-bold text-foreground">Attached CV / Resume: </span>
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
              {/* Direct HACA Drive Banner when no external link */}
              {!applyLink(selectedJobForModal) && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-950 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-900">Direct HACA Placement Drive</span>
                    <span className="text-emerald-800">
                      This opportunity is managed directly by the HACA Placement Team. When you click "Express Interest", your profile & verified CV will be submitted to the placement team for direct shortlisting and interview rounds.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 px-5 border-t border-border/70 bg-muted flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="px-3.5 py-1.5 bg-white border border-border text-slate-700 rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {(() => {
                  const appliedApp = myApplications.find(a => a.jobId === selectedJobForModal.id);
                  const isApplying = applyingJobId === selectedJobForModal.id;
                  const targetUrl = applyLink(selectedJobForModal);

                  if (appliedApp) {
                    if (appliedApp.status === 'APPLICATION_STARTED') {
                      if (!targetUrl) {
                        return (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirmApplication(appliedApp.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Interest</span>
                            </button>
                            <button
                              id={`btn-withdraw-modal-${appliedApp.id}`}
                              disabled={withdrawingAppId === appliedApp.id}
                              onClick={() => handleWithdrawApplication(appliedApp.id, selectedJobForModal.title)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Withdraw</span>
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedJobForModal(null);
                              handleContinueExternalApply(appliedApp);
                            }}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
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
                          disabled={isApplying}
                          onClick={() => targetUrl ? handleExternalApply(selectedJobForModal) : handleExpressInterest(selectedJobForModal)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                        >
                          {targetUrl ? <ExternalLink className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{targetUrl ? 'Apply Again ↗' : 'Express Interest Again'}</span>
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{targetUrl ? '✓ Applied' : '✓ Interest Registered (Direct Drive)'}</span>
                        </div>
                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-muted hover:bg-secondary text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
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
                        disabled={isApplying}
                        onClick={() => handleExpressInterest(selectedJobForModal)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>{isApplying ? 'Submitting Interest...' : 'Express Interest to Placement Team'}</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      disabled={isApplying}
                      onClick={() => handleExternalApply(selectedJobForModal)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-200" />
                      <span>{isApplying ? 'Opening Portal...' : 'Apply on Official Job Portal ↗'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Log Student Rejection Feedback</h3>
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
                  className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground"
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
                  className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actionable Remedial Plan:</label>
                <input
                  type="text"
                  value={remedialAction}
                  onChange={e => setRemedialAction(e.target.value)}
                  placeholder="e.g., Attend coding workshop, refine capstone repository..."
                  className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForFeedback(null)}
                  className="px-3.5 py-1.5 bg-muted text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-1.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 px-6 border-b border-border/70 flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-tight">
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
                  className="px-3 py-1.5 bg-white border border-border hover:bg-muted text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewResumeModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-muted flex items-center justify-center min-h-[440px]">
              {((profile.resumeDataUrl || profile.resumeUrl)?.startsWith('data:application/pdf') || 
                (profile.resumeFileName && profile.resumeFileName.toLowerCase().endsWith('.pdf'))) ? (
                <iframe
                  src={profile.resumeDataUrl || profile.resumeUrl}
                  className="w-full h-[68vh] rounded-2xl shadow-sm bg-white border border-border"
                  title="CV Document Preview"
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-border text-center max-w-md shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <FileCheck className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-foreground text-base mb-1">
                    {profile.resumeFileName || 'CV Document Attached'}
                  </h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    This document is securely attached to your placement profile. Word documents (.doc/.docx) can be downloaded and opened in your native editor.
                  </p>
                  <button
                    onClick={handleDownloadResume}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download Document
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 px-6 border-t border-border/70 bg-white flex items-center justify-between text-xs text-slate-500">
              <span>Attached to <strong>{profile.fullName}</strong> ({profile.registrationNo})</span>
              <button
                type="button"
                onClick={() => setPreviewResumeModalOpen(false)}
                className="px-4 py-1.5 bg-muted hover:bg-secondary text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
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
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmationApp(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  ↗
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Official Portal Opened</h3>
                  <p className="text-[11px] text-slate-500">{confirmationApp.jobTitle} · {confirmationApp.company}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmationApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-muted"
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
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, I Applied</span>
              </button>

              <button
                disabled={submittingConfirmDecline}
                onClick={() => handleOpenDeclineModal(confirmationApp)}
                className="w-full py-2.5 bg-white border border-slate-300 hover:bg-muted text-slate-700 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Reason for Not Applying</h3>
                <p className="text-xs text-slate-500">{declineApp.jobTitle} · {declineApp.company}</p>
              </div>
              <button
                onClick={() => setDeclineApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted"
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
                  className="w-full p-2.5 bg-muted border border-border rounded-2xl text-xs text-foreground font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  className="w-full p-2.5 bg-muted border border-border rounded-2xl text-xs text-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                {needsHelp && (
                  <p className="text-[11px] text-amber-800">
                    Flagging this will notify Placement Teams to assist you with eligibility, skill gaps, or application issues.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeclineApp(null)}
                  className="px-4 py-2 border border-border rounded-xl text-slate-700 font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConfirmDecline}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors disabled:opacity-60"
                >
                  {submittingConfirmDecline ? 'Submitting...' : 'Save Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          WEEKLY CHECK-IN MODAL
          ========================================================= */}
      {checkInApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-r from-violet-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Application Follow-Up</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Weekly check-in · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="p-3 bg-muted rounded-xl">
                <p className="text-xs font-semibold text-foreground">{checkInApp.jobTitle}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{checkInApp.company}</p>
              </div>

              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Did you receive any response from <strong className="text-foreground">{checkInApp.company}</strong> regarding this application?
              </p>

              {/* Response Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition-colors">
                  <input
                    type="radio"
                    name="checkin_response"
                    value="YES"
                    checked={checkInSelectedStatus !== '' && checkInSelectedStatus !== 'NO_RESPONSE'}
                    onChange={() => setCheckInSelectedStatus('SHORTLISTED')}
                    className="accent-violet-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">Yes, I received a response!</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:border-slate-300 hover:bg-muted/60 transition-colors">
                  <input
                    type="radio"
                    name="checkin_response"
                    value="NO"
                    checked={checkInSelectedStatus === 'NO_RESPONSE'}
                    onChange={() => setCheckInSelectedStatus('NO_RESPONSE' as any)}
                    className="accent-slate-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">No response yet from the company</span>
                </label>
              </div>

              {/* Status selector — shown only when "Yes" is selected */}
              {checkInSelectedStatus !== '' && checkInSelectedStatus !== 'NO_RESPONSE' && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-slate-700">Great! What's the current stage?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'SHORTLISTED', label: 'Shortlisted', color: 'emerald' },
                      { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'blue' },
                      { value: 'INTERVIEWED', label: 'Interviewed', color: 'purple' },
                      { value: 'SELECTED', label: 'Selected / Offer', color: 'amber' },
                      { value: 'REJECTED', label: 'Rejected', color: 'rose' },
                      { value: 'JOINED', label: 'Joined Company', color: 'green' },
                    ] as { value: ApplicationStatus; label: string; color: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setCheckInSelectedStatus(opt.value)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                          checkInSelectedStatus === opt.value
                            ? 'border-violet-500 bg-violet-50 text-violet-800 shadow-sm'
                            : 'border-border text-slate-600 hover:border-violet-300 hover:bg-violet-50/40'
                        } cursor-pointer`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Snooze message */}
              {checkInSelectedStatus === 'NO_RESPONSE' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>No worries! We'll check in again in <strong>7 days</strong>. Keep applying to more positions in the meantime.</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              <button
                onClick={handleCheckInSnooze}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-muted border border-border rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
              <div className="flex items-center gap-2">
                {checkInSelectedStatus === 'NO_RESPONSE' && (
                  <button
                    onClick={handleCheckInSnooze}
                    className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    OK, Snooze 7 Days
                  </button>
                )}
                {checkInSelectedStatus !== '' && checkInSelectedStatus !== 'NO_RESPONSE' && (
                  <button
                    onClick={handleCheckInSubmit}
                    disabled={checkInSubmitting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {checkInSubmitting ? 'Saving...' : 'Save Status Update'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MANUAL STATUS UPDATE MODAL
          ========================================================= */}
      {manualUpdateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border/60 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Update Application Status</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {manualUpdateApp.jobTitle} · <span className="font-semibold text-slate-700">{manualUpdateApp.company || (manualUpdateApp as any).companyName}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setManualUpdateApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="px-6 pt-4 pb-1">
              <div className="flex items-center justify-between p-3 bg-muted/60 border border-border/80 rounded-xl text-xs">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <ApplicationStatusBadge status={manualUpdateApp.status} />
              </div>
            </div>

            {/* Status Options */}
            <div className="px-6 py-3 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">
                Select New Status:
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { 
                    value: 'APPLIED', 
                    label: 'Applied', 
                    desc: 'Awaiting recruiter response / screening' 
                  },
                  { 
                    value: 'SHORTLISTED', 
                    label: 'Shortlisted', 
                    desc: 'Resume shortlisted for review' 
                  },
                  { 
                    value: 'INTERVIEW_SCHEDULED', 
                    label: 'Interview Scheduled', 
                    desc: 'Assessment or interview date confirmed' 
                  },
                  { 
                    value: 'INTERVIEWED', 
                    label: 'Interviewed', 
                    desc: 'Interview rounds completed' 
                  },
                  { 
                    value: 'SELECTED', 
                    label: 'Selected / Offer', 
                    desc: 'Selected or offer letter received' 
                  },
                  { 
                    value: 'JOINED', 
                    label: 'Joined Company', 
                    desc: 'Offer accepted and onboarding' 
                  },
                  { 
                    value: 'REJECTED', 
                    label: 'Rejected', 
                    desc: 'Did not clear screening or interview' 
                  },
                ].map(opt => {
                  const isSelected = manualSelectedStatus === opt.value;
                  const isCurrent = manualUpdateApp.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setManualSelectedStatus(opt.value as ApplicationStatus)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/80 ring-2 ring-violet-500/20 shadow-xs'
                          : 'border-border hover:border-violet-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {opt.label}
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        ) : isCurrent ? (
                          <span className="text-[10px] text-slate-400 font-medium">(current)</span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Informative Note */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-blue-600 shrink-0" />
                <span>Updating your status keeps your placement mentor and dashboard tracking in sync. Active stages will continue to be monitored weekly.</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setManualUpdateApp(null)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-slate-700 hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={manualUpdateSubmitting || !manualSelectedStatus || manualSelectedStatus === manualUpdateApp.status}
                onClick={handleManualStatusSubmit}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
              >
                {manualUpdateSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
