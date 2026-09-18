export type UserRole = 
  | 'MAIN_ADMIN' 
  | 'STUDENT' 
  | 'MENTOR' 
  | 'PLACEMENT_OFFICER' 
  | 'MANAGEMENT';

export type EligibilityStatus = 
  | 'NOT_EVALUATED' 
  | 'PENDING_MENTOR_APPROVAL' 
  | 'ELIGIBLE' 
  | 'NOT_ELIGIBLE' 
  | 'ADMIN_OVERRIDE';

export type JobSourceChannel = 
  | 'AI_JOB_SCRAPER' 
  | 'ATS_JOB_API'
  | 'STAFF_REFERRAL' 
  | 'PLACEMENT_DIRECT'
  | 'INBOUND'
  | 'OUTREACH'
  | 'REPEATED_PARTNER'
  | 'SOCIAL_MEDIA';

export type ApplicationStatus = 
  | 'APPLICATION_STARTED'   // Student clicked Apply, external portal opened
  | 'APPLIED'               // Student confirmed they completed the external application
  | 'NOT_APPLIED'           // Student confirmed they did NOT complete the external application
  | 'SHORTLISTED'           // Recruiter shortlisted after APPLIED
  | 'INTERVIEW_SCHEDULED' 
  | 'INTERVIEWED' 
  | 'SELECTED' 
  | 'REJECTED' 
  | 'OFFER_RECEIVED' 
  | 'JOINED';

export type HelpStatus =
  | 'NONE'
  | 'HELP_REQUESTED'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export type ApplicationDeclineReason =
  | 'NOT_INTERESTED'
  | 'NOT_ELIGIBLE'
  | 'SKILLS_DONT_MATCH'
  | 'EXPERIENCE_REQUIREMENT'
  | 'SALARY_NOT_SUITABLE'
  | 'LOCATION_NOT_SUITABLE'
  | 'ALREADY_APPLIED_PREVIOUSLY'
  | 'PORTAL_PROBLEM'
  | 'NEED_PLACEMENT_HELP'
  | 'NEED_RESUME_HELP'
  | 'NEED_JOB_CLARIFICATION'
  | 'OTHER';

export type RejectionCategory = 
  | 'TECHNICAL_SKILL_GAP' 
  | 'COMMUNICATION_GAP' 
  | 'PROJECT_GAP' 
  | 'EXPERIENCE_GAP' 
  | 'EXPECTATION_MISMATCH' 
  | 'OTHER';

export type MatchVerdict = 'MATCHED' | 'PARTIALLY_MATCHED' | 'NOT_MATCHED';

export type HealthStatus = 'RED' | 'YELLOW' | 'GREEN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StudentAcademicRecord {
  course: string;
  scores: {
    gpaOrPercentage: number;
    assignmentsCompleted: number;
    totalAssignments: number;
    capstoneScore?: number;
  };
  attendancePercentage: number;
  skills: string[];
  projects: {
    id: string;
    title: string;
    description: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING_REVIEW';
    grade?: string;
    githubUrl?: string;
  }[];
  readinessGaps: {
    missingSkills: string[];
    missingProjects: string[];
    attendanceWarning: boolean;
  };
}

export interface StudentProfile {
  id: string; // matches user.id
  registrationNo: string;
  fullName: string;
  email: string;
  phone: string;
  school: string; // e.g. "School of Tech", "School of Design", "School of Marketing"
  program: string; // e.g. "Full Stack Web Development", "UI/UX Product Design"
  designation?: string; // Student primary professional role / designation e.g. "Full Stack Developer", "Data Analyst"
  yearsOfExperience?: number; // e.g. 0.5 (6 months), 1, 2
  batch: string; // e.g. "2025-Q4", "2026-Q1"
  mentorId: string;
  mentorName: string;
  eligibilityStatus: EligibilityStatus;
  eligibilityUpdatedAt?: string;
  eligibilityUpdatedBy?: string;
  overrideReason?: string;
  evaluationNotes?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeFileSize?: number;
  resumeFileType?: string;
  resumeFileUploadedAt?: string;
  resumeDataUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  academic: StudentAcademicRecord;
  inactivityFlags: {
    hasNotApplied: boolean;
    consecutiveRejections: number;
    noInterviewFollowUp: boolean;
  };
  createdAt: string;
}

export interface JobListing {
  id: string;
  jobCode: string;
  title: string;
  company: string;
  location: string;
  countryCode?: string; // 'IN' for India
  employmentType: 'FULL_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'PART_TIME';
  experienceRequirement: string; // e.g. "0-1 years", "Fresh Graduate"
  minExperienceYears: number;
  salaryRange: string; // e.g. "$65,000 - $80,000" or "PKR 120,000 - 180,000"
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string[];
  eligibleSchools: string[];
  eligiblePrograms: string[];
  category?: string; // e.g. "Software Development", "Frontend Development", "Data Analytics"
  normalizedDesignation?: string; // e.g. "Full Stack Developer", "Backend Developer"
  sourceChannel: JobSourceChannel;
  referralSourceName?: string; // e.g., "Haris", "Rizwan" if STAFF_REFERRAL
  externalUrl?: string;       // URL to the job posting page
  applicationUrl?: string;    // Direct URL to apply for this job externally
  deadline: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;
  externalJobId?: string;
  source?: string;
  sourceUrl?: string;
  postedDate?: string;
  scrapedDate?: string;
}

export interface ApifyFetchResult {
  totalReceived: number;
  indiaJobsCount?: number;
  foreignJobsRejectedCount?: number;
  techJobsCount: number;
  nonTechFilteredCount: number;
  newIngested: number;
  duplicatesCount: number;
  invalidCount: number;
  newJobTitles: string[];
  sampleJob?: Partial<JobListing>;
}

export interface ApifyConnectionStatus {
  provider: 'Apify';
  connected: boolean;
  actorConfigured: boolean;
  actorId?: string;
  actorTitle?: string;
  username?: string;
  lastFetch?: string;
  jobsFetched?: number;
  error?: string;
}

export interface AtsJobFetchResult {
  totalReceived: number;
  indiaJobsCount?: number;
  foreignJobsRejectedCount?: number;
  techJobsCount: number;
  nonTechFilteredCount: number;
  newIngested: number;
  duplicatesCount: number;
  invalidCount: number;
  newJobTitles: string[];
  sampleJob?: Partial<JobListing>;
}

export interface AtsConnectionStatus {
  provider: 'Public ATS API (Greenhouse/Lever/Ashby)';
  connected: boolean;
  activeConnectors: string[];
  companiesConfigured: number;
  lastFetch?: string;
  jobsFetched?: number;
  error?: string;
}

export interface JobMatchResult {
  job: JobListing;
  verdict: MatchVerdict;
  matchScore: number; // 0 to 100
  matchLevel: 'Excellent Match' | 'Good Match' | 'Partial Match' | 'Low Match';
  designationScore: number; // 0 to 40
  skillsScore: number; // 0 to 35
  programScore: number; // 0 to 15
  experienceScore: number; // 0 to 10
  matchedSkills: string[];
  missingSkills: string[];
  schoolMatch: boolean;
  programMatch: boolean;
  designationMatch: boolean;
  experienceMatch: 'COMPATIBLE' | 'PARTIAL' | 'LOW' | 'UNKNOWN';
  explanation: string;
  designationExplanation?: string;
  programExplanation?: string;
  experienceExplanation?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location?: string;           // Job location, copied from job at creation
  studentId: string;
  studentName: string;
  studentEmail: string;
  school: string;
  program: string;
  batch: string;
  sourceChannel: JobSourceChannel;
  jobSource?: string;          // Human-readable source label e.g. "AI Job Scraper", "Staff Referral"
  applicationUrl?: string;     // External URL the student used to apply (copied from job)
  status: ApplicationStatus;
  // --- External application tracking ---
  startedAt?: string;          // When student first clicked "Apply" (APPLICATION_STARTED)
  confirmedAt?: string;        // When student confirmed they applied (APPLIED)
  // --- Decline / Not Applied fields ---
  declineReason?: ApplicationDeclineReason;  // Why student did not complete external application
  studentComment?: string;     // Free text from student explaining situation
  needsHelp?: boolean;         // Student flagged they need Placement Team support
  helpStatus?: HelpStatus;     // Placement Team help tracking
  helpUpdatedAt?: string;      // Last time helpStatus was updated
  helpUpdatedBy?: string;      // Name of Placement Team who updated helpStatus
  // --- Existing fields ---
  appliedAt: string;           // Keep for backward compat (same as startedAt)
  createdAt?: string;          // Timestamp when application was created
  updatedAt: string;
  interviewDates: {
    round: number;
    title: string;
    date: string;
    completed: boolean;
    notes?: string;
  }[];
  rejectionFeedback?: {
    id: string;
    category: RejectionCategory;
    details: string;
    remedialActionNeeded: string;
    submittedAt: string;
  };
}

export interface RejectionFeedbackRecord {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  studentId: string;
  studentName: string;
  school: string;
  program: string;
  batch: string;
  category: RejectionCategory;
  details: string;
  remedialActionNeeded: string;
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ManagementKPIs {
  overallPlacementRate: number; // Percentage
  healthStatus: HealthStatus; // RED (<50%), YELLOW (50-59%), GREEN (>=60%)
  totalStudents: number;
  totalEligible: number;
  totalPlaced: number;
  totalActiveApplications: number;
  totalInterviews: number;
  totalOffers: number;
  totalRejections: number;
  schoolMetrics: {
    school: string;
    totalEligible: number;
    placed: number;
    rate: number;
    healthStatus: HealthStatus;
  }[];
  programMetrics: {
    program: string;
    school: string;
    totalEligible: number;
    placed: number;
    rate: number;
    healthStatus: HealthStatus;
  }[];
  batchMetrics: {
    batch: string;
    program: string;
    totalEligible: number;
    placed: number;
    rate: number;
    healthStatus: HealthStatus;
  }[];
  channelMetrics: {
    channel: JobSourceChannel;
    label: string;
    jobsDiscovered: number;
    applications: number;
    interviews: number;
    placements: number;
    conversionRate: number; // placements / applications %
    isLowPerforming: boolean; // Flagged for removal if < 15%
  }[];
}

export interface ApifyScraperConfig {
  actorId: string;
  apiKey: string;
  targetBoards: string[];
  scheduleCron: string;
  isEnabled: boolean;
  lastRunTimestamp?: string;
  leadsProcessedTotal: number;
}

export interface LmsSyncConfig {
  endpoint: string;
  apiKey: string;
  autoSyncIntervalMinutes: number;
  lastSyncTimestamp?: string;
  totalRecordsSynced: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

export interface AtsSyncConfig {
  isEnabled: boolean;
  greenhouseBoards: string[];
  leverCompanies: string[];
  ashbyCompanies: string[];
  lastRunTimestamp?: string;
  leadsProcessedTotal: number;
}

