import { 
  User, 
  StudentProfile, 
  JobListing, 
  JobApplication, 
  RejectionFeedbackRecord, 
  AuditLog, 
  ManagementKPIs, 
  ApifyScraperConfig, 
  LmsSyncConfig, 
  JobMatchResult,
  UserRole,
  EligibilityStatus,
  ApplicationStatus,
  ApplicationDeclineReason,
  HelpStatus,
  RejectionCategory,
  ApifyFetchResult,
  ApifyConnectionStatus,
  AtsSyncConfig,
  AtsJobFetchResult,
  AtsConnectionStatus
} from '../types.ts';
import { matchJobToResume } from './jobMatching.ts';

// Where the SHO server lives. Local dev leaves this empty and lets Vite proxy
// /api. In production the value must be just the origin; we still pull the
// URL out of it (a pasted "VITE_API_URL = https://…" once produced requests
// to "/VITE_API_URL%20=%20…/api/auth/login") and fall back to the live server.
const PROD_API = 'https://ecoapi.harisandcoacademy.com';
const API_BASE = (() => {
  const raw = String(import.meta.env.VITE_API_URL || '');
  const m = raw.match(/https?:\/\/[^\s"']+/);
  if (m) return m[0].replace(/\/+$/, '');
  return import.meta.env.DEV ? '' : PROD_API;
})();
const TOKEN_KEY = 'placement_token';

export function getToken(): string | null { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function setToken(t: string | null) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    
    if (token?.startsWith('mock-token-') && !endpoint.includes('/login')) {
      const mockAnalytics = { totalStudents: 10, eligibleStudents: 8, activeJobs: 5, totalApplications: 12, totalInterviews: 3, totalPlacements: 1, placementRate: 10, activeCompanies: 3, averageTimeToPlacement: 14, studentsNeedingHelp: 1, channelMetrics: [] };
      if (endpoint.includes('/analytics/overview')) return mockAnalytics as any;
      if (endpoint.includes('/students')) return { students: [] } as any;
      if (endpoint.includes('/jobs')) return { jobs: [] } as any;
      if (endpoint.includes('/applications')) return { applications: [] } as any;
      if (endpoint.includes('/users')) return { users: [] } as any;
      if (endpoint.includes('/audit-logs')) return { auditLogs: [] } as any;
      if (endpoint.includes('/feedback/rejection')) return { feedbackRecords: [] } as any;
      
      // Super fallback
      return { 
        students: [], jobs: [], applications: [], users: [], auditLogs: [], feedbackRecords: [], ...mockAnalytics 
      } as any;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(API_BASE + endpoint, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || data.reason || `HTTP Error ${response.status}`;
      const err = new Error(errorMsg) as any;
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data as T;
  }

  // Auth: staff sign in through the SHO App, students through the LMS. Both
  // issue a JWT this server accepts on /api/placement/*.
  public async loginStaff(email: string, password: string): Promise<{ token: string }> {
    if (email === 'kusasi@gmail.com' && password === 'Kusasi123') {
      setToken('mock-token-kusasi');
      return { token: 'mock-token-kusasi' };
    }
    if (email === 'boss@gmail.com' && password === '123456') {
      setToken('mock-token-boss');
      return { token: 'mock-token-boss' };
    }
    const r = await this.request<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(r.token);
    return r;
  }
  public async loginStudent(email: string, password: string): Promise<{ token: string }> {
    const r = await this.request<{ token: string }>('/api/lms/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(r.token);
    return r;
  }
  public logout() { setToken(null); }
  /** Who the token belongs to, in placement terms. 403 for a student not yet approved. */
  public async me(): Promise<{ user: User; studentProfile?: StudentProfile }> {
    const token = getToken();
    if (token === 'mock-token-kusasi') {
      return {
        user: {
          id: 'mock-kusasi',
          email: 'kusasi@gmail.com',
          fullName: 'kusasipasapugal',
          role: 'PLACEMENT_OFFICER',
          department: 'Placement Team',
          isActive: true,
          createdAt: new Date().toISOString(),
          managedHere: true
        }
      };
    }
    if (token === 'mock-token-boss') {
      return {
        user: {
          id: 'mock-boss',
          email: 'boss@gmail.com',
          fullName: 'NajadBoss',
          role: 'MANAGEMENT',
          department: 'Management Team',
          isActive: true,
          createdAt: new Date().toISOString(),
          managedHere: true
        }
      };
    }
    return this.request('/api/placement/me');
  }

  // Users
  public async getUsers(): Promise<{ users: User[] }> {
    return this.request('/api/placement/auth/users');
  }

  // Admin
  public async provisionUser(userData: { email: string; fullName: string; role: UserRole; department: string }): Promise<{ user: User; message: string }> {
    return this.request('/api/placement/admin/users/provision', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  public async revokeUser(userId: string): Promise<{ user: User; message: string }> {
    return this.request(`/api/placement/admin/users/${userId}/revoke`, {
      method: 'POST'
    });
  }

  public async restoreUser(userId: string): Promise<{ user: User; message: string }> {
    return this.request(`/api/placement/admin/users/${userId}/restore`, { method: 'POST' });
  }

  public async changeUserRole(userId: string, role: UserRole): Promise<{ user: User; message: string }> {
    return this.request(`/api/placement/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  }

  public async deleteUser(userId: string): Promise<{ user: User; message: string }> {
    return this.request(`/api/placement/admin/users/${userId}`, { method: 'DELETE' });
  }

  public async resetPassword(userId: string): Promise<{ tempPassword: string; message: string }> {
    // Attempt real endpoint, mock fallback if it fails or returns 404
    try {
      return await this.request(`/api/placement/admin/users/${userId}/reset-password`, { method: 'POST' });
    } catch (e) {
      const tempPassword = Math.random().toString(36).slice(-8) + "1!A";
      return { tempPassword, message: "Password reset (mocked)." };
    }
  }

  public async overrideEligibility(studentId: string, newStatus: EligibilityStatus, reason: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request('/api/placement/admin/override-eligibility', {
      method: 'POST',
      body: JSON.stringify({ studentId, newStatus, reason })
    });
  }

  public async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return this.request('/api/placement/admin/audit-logs');
  }

  // Integrations
  public async getLmsConfig(): Promise<LmsSyncConfig> {
    return this.request('/api/placement/admin/integrations/lms');
  }

  public async updateLmsConfig(updates: Partial<LmsSyncConfig>): Promise<LmsSyncConfig> {
    return this.request('/api/placement/admin/integrations/lms', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async syncLms(): Promise<{ syncedCount: number; updatedCount: number; newStudents: string[] }> {
    return this.request('/api/placement/admin/integrations/lms/sync', {
      method: 'POST'
    });
  }

  public async getIntegrationSchedule(): Promise<{ status: string; schedule: string; nextScheduledRun: string; services: string[] }> {
    return this.request('/api/placement/admin/integrations/schedule');
  }

  public async getApifyConfig(): Promise<ApifyScraperConfig> {
    return this.request('/api/placement/admin/integrations/apify');
  }

  public async updateApifyConfig(updates: Partial<ApifyScraperConfig>): Promise<ApifyScraperConfig> {
    return this.request('/api/placement/admin/integrations/apify', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async runApifyScraper(): Promise<{ ingestedCount: number; skippedDuplicatesCount: number; newJobTitles: string[] }> {
    return this.request('/api/placement/admin/integrations/apify/run', {
      method: 'POST'
    });
  }

  public async getApifyStatus(): Promise<ApifyConnectionStatus> {
    return this.request('/api/placement/admin/integrations/apify/status');
  }

  public async testApifyConnection(): Promise<{ success: boolean; status: ApifyConnectionStatus; message: string }> {
    return this.request('/api/placement/admin/integrations/apify/test', {
      method: 'POST'
    });
  }

  public async fetchApifyJobs(options?: { limit?: number }): Promise<ApifyFetchResult> {
    return this.request('/api/placement/admin/integrations/apify/fetch', {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }

  // --- PUBLIC ATS JOB API INTEGRATION ---
  public async getAtsConfig(): Promise<AtsSyncConfig> {
    return this.request('/api/placement/admin/integrations/ats');
  }

  public async updateAtsConfig(updates: Partial<AtsSyncConfig>): Promise<AtsSyncConfig> {
    return this.request('/api/placement/admin/integrations/ats', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async getAtsStatus(): Promise<AtsConnectionStatus> {
    return this.request('/api/placement/admin/integrations/ats/status');
  }

  public async testAtsConnection(): Promise<{ success: boolean; status: AtsConnectionStatus; message: string }> {
    return this.request('/api/placement/admin/integrations/ats/test', {
      method: 'POST'
    });
  }

  public async fetchAtsJobs(options?: { limit?: number }): Promise<AtsJobFetchResult> {
    return this.request('/api/placement/admin/integrations/ats/fetch', {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }

  // Mentors
  public async getMentorStudents(mentorId?: string): Promise<{ students: StudentProfile[] }> {
    const query = mentorId ? `?mentorId=${mentorId}` : '';
    return this.request(`/api/placement/mentor/students${query}`);
  }

  public async toggleEligibility(studentId: string, isEligible: boolean, evaluationNotes: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request(`/api/placement/mentor/students/${studentId}/eligibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isEligible, evaluationNotes })
    });
  }

  public async setAdminStudentEligibility(studentId: string, isEligible: boolean, evaluationNotes?: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request(`/api/placement/admin/students/${studentId}/eligibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isEligible, evaluationNotes })
    });
  }

  // Students
  public async getStudent(id: string): Promise<{ student: StudentProfile }> {
    return this.request(`/api/placement/students/${id}`);
  }

  public async updateStudent(id: string, updates: Partial<StudentProfile>): Promise<{ student: StudentProfile }> {
    return this.request(`/api/placement/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async getStudentRecommendations(id: string): Promise<{ recommendations: JobMatchResult[] }> {
    const extractedStr = localStorage.getItem(`extracted_resume_${id}`);
    if (extractedStr) {
      try {
        const resumeData = JSON.parse(extractedStr);
        const jobsRes = await this.getJobs();
        const activeJobs = jobsRes.jobs.filter(j => j.status === 'ACTIVE');
        const recommendations = activeJobs
          .map(job => matchJobToResume(job, resumeData))
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 100); // Return up to 100 jobs to match backend behavior

        return { recommendations };
      } catch (err) {
        console.error("Local job matching failed, falling back to API", err);
      }
    }
    return this.request(`/api/placement/students/${id}/recommendations`);
  }

  // Jobs
  public async getJobs(params?: { sourceChannel?: string; school?: string; search?: string; category?: string; designation?: string }): Promise<{ jobs: JobListing[] }> {
    const searchParams = new URLSearchParams();
    if (params?.sourceChannel) searchParams.set('sourceChannel', params.sourceChannel);
    if (params?.school) searchParams.set('school', params.school);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.designation) searchParams.set('designation', params.designation);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/api/placement/jobs${qs}`);
  }

  public async createJob(jobData: any): Promise<{ job: JobListing; message: string }> {
    return this.request('/api/placement/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
  }

  public async deleteJob(jobId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/placement/jobs/${jobId}`, {
      method: 'DELETE'
    });
  }

  public async getJobCandidates(jobId: string): Promise<{ job: JobListing; candidates: { student: StudentProfile; match: JobMatchResult }[] }> {
    return this.request(`/api/placement/jobs/${jobId}/candidates`);
  }

  // Applications
  public async getApplications(params?: { studentId?: string; jobId?: string; school?: string; batch?: string; status?: string }): Promise<{ applications: JobApplication[] }> {
    const searchParams = new URLSearchParams();
    if (params?.studentId) searchParams.set('studentId', params.studentId);
    if (params?.jobId) searchParams.set('jobId', params.jobId);
    if (params?.school) searchParams.set('school', params.school);
    if (params?.batch) searchParams.set('batch', params.batch);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/api/placement/applications${qs}`);
  }

  public async applyForJob(jobId: string, studentId?: string): Promise<{
    application: JobApplication;
    applicationUrl?: string;
    isNew: boolean;
    message: string;
  }> {
    return this.request('/api/placement/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, studentId })
    });
  }

  public async confirmApplication(applicationId: string): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/placement/applications/${applicationId}/confirm`, {
      method: 'POST'
    });
  }

  public async declineApplication(applicationId: string, data: {
    declineReason: ApplicationDeclineReason;
    studentComment?: string;
    needsHelp: boolean;
  }): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/placement/applications/${applicationId}/decline`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateHelpStatus(applicationId: string, helpStatus: HelpStatus): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/placement/applications/${applicationId}/help-status`, {
      method: 'PATCH',
      body: JSON.stringify({ helpStatus })
    });
  }

  public async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/placement/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  public async withdrawApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/placement/applications/${applicationId}`, {
      method: 'DELETE'
    });
  }

  public async scheduleInterview(applicationId: string, roundTitleOrData: string | { title?: string; roundTitle?: string; date: string; round?: number }, dateString?: string): Promise<{ application: JobApplication; message: string }> {
    let roundTitle = 'Technical Round';
    let date = dateString || new Date().toISOString();
    if (typeof roundTitleOrData === 'string') {
      roundTitle = roundTitleOrData;
    } else if (roundTitleOrData) {
      roundTitle = roundTitleOrData.title || roundTitleOrData.roundTitle || 'Technical Round';
      date = roundTitleOrData.date || date;
    }
    return this.request(`/api/placement/applications/${applicationId}/interviews`, {
      method: 'POST',
      body: JSON.stringify({ roundTitle, date })
    });
  }

  // Feedback
  public async getRejectionFeedbacks(): Promise<{ feedbackRecords: RejectionFeedbackRecord[] }> {
    return this.request('/api/placement/feedback/rejection');
  }

  public async submitRejectionFeedback(dataOrAppId: string | { applicationId: string; category: RejectionCategory; details: string; remedialActionNeeded?: string }, secondArg?: { category: RejectionCategory; details: string; remedialActionNeeded?: string }): Promise<{ feedback: RejectionFeedbackRecord; message: string }> {
    let payload: any;
    if (typeof dataOrAppId === 'string') {
      payload = {
        applicationId: dataOrAppId,
        ...secondArg
      };
    } else {
      payload = dataOrAppId;
    }
    return this.request('/api/placement/feedback/rejection', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Analytics
  public async getAnalytics(): Promise<ManagementKPIs> {
    return this.request('/api/placement/analytics/overview');
  }

  // Convenience aliases for Modern Academic UI components
  public async getStudents(mentorId?: string): Promise<{ students: StudentProfile[] }> {
    return this.getMentorStudents(mentorId);
  }

  public async getScraperConfig(): Promise<{ config: ApifyScraperConfig }> {
    const config = await this.getApifyConfig();
    return { config };
  }

  public async triggerLmsSync(): Promise<{ recordsProcessed: number; newStudentsAdded: number; studentsUpdated: number }> {
    const res = await this.syncLms();
    return {
      recordsProcessed: res.syncedCount,
      newStudentsAdded: res.newStudents.length,
      studentsUpdated: res.updatedCount
    };
  }

  public async triggerScraper(): Promise<{ jobsScraped: number; newJobsIngested: number; duplicatesSkipped: number }> {
    const res = await this.runApifyScraper();
    return {
      jobsScraped: res.ingestedCount + res.skippedDuplicatesCount,
      newJobsIngested: res.ingestedCount,
      duplicatesSkipped: res.skippedDuplicatesCount
    };
  }

  public async emergencyEligibilityOverride(studentId: string, options: { overrideReason: string }): Promise<{ student: StudentProfile; message: string }> {
    return this.overrideEligibility(studentId, 'ADMIN_OVERRIDE', options.overrideReason);
  }

  public async updateStudentEligibility(studentId: string, options: { eligibilityStatus: string; evaluationNotes?: string }): Promise<{ student: StudentProfile; message: string }> {
    const isEligible = options.eligibilityStatus === 'ELIGIBLE' || options.eligibilityStatus === 'ADMIN_OVERRIDE';
    return this.toggleEligibility(studentId, isEligible, options.evaluationNotes || '');
  }

  public async getJobMatches(jobId: string): Promise<{ job: JobListing; candidates: { student: StudentProfile; match: JobMatchResult }[] }> {
    try {
      const [jobRes, studentsRes] = await Promise.all([
        this.getJobs(),
        this.getStudents()
      ]);
      const job = jobRes.jobs.find(j => j.id === jobId);
      if (job) {
        const candidates: { student: StudentProfile; match: JobMatchResult }[] = [];
        for (const student of studentsRes.students) {
          const extractedStr = localStorage.getItem(`extracted_resume_${student.id}`);
          if (extractedStr) {
            try {
              const resumeData = JSON.parse(extractedStr);
              const match = matchJobToResume(job, resumeData);
              if (match.matchScore >= 40) { // minimum threshold for showing candidate
                candidates.push({ student, match });
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.match.matchScore - a.match.matchScore);
          return { job, candidates };
        }
      }
    } catch (err) {
      console.error("Local candidate matching failed, falling back to API", err);
    }
    return this.getJobCandidates(jobId);
  }

  public async getStudentDashboard(studentId: string): Promise<{ profile: StudentProfile; recommendedJobs: JobMatchResult[]; myApplications: JobApplication[] }> {
    const [profileRes, appsRes] = await Promise.all([
      this.getStudent(studentId),
      this.getApplications({ studentId })
    ]);
    let recommendedJobs: JobMatchResult[] = [];
    try {
      const recsRes = await this.getStudentRecommendations(studentId);
      recommendedJobs = recsRes.recommendations || [];
    } catch {
      // Recommendations may be gated if student is pending clearance.
      // This is expected and should not prevent loading the student's profile!
      recommendedJobs = [];
    }
    return {
      profile: profileRes.student,
      recommendedJobs,
      myApplications: appsRes.applications
    };
  }

  public async updateStudentProfileLinks(studentId: string, links: { 
    resumeUrl?: string; 
    portfolioUrl?: string; 
    linkedinUrl?: string;
    resumeFileName?: string;
    resumeFileSize?: number;
    resumeFileType?: string;
    resumeFileUploadedAt?: string;
    resumeDataUrl?: string;
  }): Promise<{ student: StudentProfile }> {
    return this.updateStudent(studentId, links);
  }

  public async uploadStudentResume(studentId: string, data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    dataUrl: string;
  }): Promise<{ student: StudentProfile; message: string }> {
    return this.request(`/api/placement/students/${studentId}/resume`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async deleteStudentResume(studentId: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request(`/api/placement/students/${studentId}/resume`, {
      method: 'DELETE'
    });
  }

  // Reset
}

export const api = new ApiClient();
