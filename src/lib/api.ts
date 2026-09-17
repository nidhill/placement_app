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

class ApiClient {
  private activeUserId: string = 'user-root-admin';
  private activeUserRole: UserRole = 'MAIN_ADMIN';

  public setActiveUser(user: User) {
    this.activeUserId = user.id;
    this.activeUserRole = user.role;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': this.activeUserId,
      'x-user-role': this.activeUserRole,
      ...(options.headers as Record<string, string> || {})
    };

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || data.reason || `HTTP Error ${response.status}`;
      const err = new Error(errorMsg) as any;
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  // Auth & Users
  public async login(email: string): Promise<{ user: User; studentProfile?: StudentProfile; token: string }> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  public async getUsers(): Promise<{ users: User[] }> {
    return this.request('/api/v1/auth/users');
  }

  // Admin
  public async provisionUser(userData: { email: string; fullName: string; role: UserRole; department: string }): Promise<{ user: User; message: string }> {
    return this.request('/api/v1/admin/users/provision', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  public async revokeUser(userId: string): Promise<{ user: User; message: string }> {
    return this.request(`/api/v1/admin/users/${userId}/revoke`, {
      method: 'POST'
    });
  }

  public async overrideEligibility(studentId: string, newStatus: EligibilityStatus, reason: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request('/api/v1/admin/override-eligibility', {
      method: 'POST',
      body: JSON.stringify({ studentId, newStatus, reason })
    });
  }

  public async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return this.request('/api/v1/admin/audit-logs');
  }

  // Integrations
  public async getLmsConfig(): Promise<LmsSyncConfig> {
    return this.request('/api/v1/admin/integrations/lms');
  }

  public async updateLmsConfig(updates: Partial<LmsSyncConfig>): Promise<LmsSyncConfig> {
    return this.request('/api/v1/admin/integrations/lms', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async syncLms(): Promise<{ syncedCount: number; updatedCount: number; newStudents: string[] }> {
    return this.request('/api/v1/admin/integrations/lms/sync', {
      method: 'POST'
    });
  }

  public async getApifyConfig(): Promise<ApifyScraperConfig> {
    return this.request('/api/v1/admin/integrations/apify');
  }

  public async updateApifyConfig(updates: Partial<ApifyScraperConfig>): Promise<ApifyScraperConfig> {
    return this.request('/api/v1/admin/integrations/apify', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async runApifyScraper(): Promise<{ ingestedCount: number; skippedDuplicatesCount: number; newJobTitles: string[] }> {
    return this.request('/api/v1/admin/integrations/apify/run', {
      method: 'POST'
    });
  }

  public async getApifyStatus(): Promise<ApifyConnectionStatus> {
    return this.request('/api/v1/admin/integrations/apify/status');
  }

  public async testApifyConnection(): Promise<{ success: boolean; status: ApifyConnectionStatus; message: string }> {
    return this.request('/api/v1/admin/integrations/apify/test', {
      method: 'POST'
    });
  }

  public async fetchApifyJobs(options?: { limit?: number }): Promise<ApifyFetchResult> {
    return this.request('/api/v1/admin/integrations/apify/fetch', {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }

  // --- PUBLIC ATS JOB API INTEGRATION ---
  public async getAtsConfig(): Promise<AtsSyncConfig> {
    return this.request('/api/v1/admin/integrations/ats');
  }

  public async updateAtsConfig(updates: Partial<AtsSyncConfig>): Promise<AtsSyncConfig> {
    return this.request('/api/v1/admin/integrations/ats', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async getAtsStatus(): Promise<AtsConnectionStatus> {
    return this.request('/api/v1/admin/integrations/ats/status');
  }

  public async testAtsConnection(): Promise<{ success: boolean; status: AtsConnectionStatus; message: string }> {
    return this.request('/api/v1/admin/integrations/ats/test', {
      method: 'POST'
    });
  }

  public async fetchAtsJobs(options?: { limit?: number }): Promise<AtsJobFetchResult> {
    return this.request('/api/v1/admin/integrations/ats/fetch', {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }

  // Mentors
  public async getMentorStudents(mentorId?: string): Promise<{ students: StudentProfile[] }> {
    const query = mentorId ? `?mentorId=${mentorId}` : '';
    return this.request(`/api/v1/mentor/students${query}`);
  }

  public async toggleEligibility(studentId: string, isEligible: boolean, evaluationNotes: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request(`/api/v1/mentor/students/${studentId}/eligibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isEligible, evaluationNotes })
    });
  }

  public async setAdminStudentEligibility(studentId: string, isEligible: boolean, evaluationNotes?: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request(`/api/v1/admin/students/${studentId}/eligibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isEligible, evaluationNotes })
    });
  }

  // Students
  public async getStudent(id: string): Promise<{ student: StudentProfile }> {
    return this.request(`/api/v1/students/${id}`);
  }

  public async updateStudent(id: string, updates: Partial<StudentProfile>): Promise<{ student: StudentProfile }> {
    return this.request(`/api/v1/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async getStudentRecommendations(id: string): Promise<{ recommendations: JobMatchResult[] }> {
    return this.request(`/api/v1/students/${id}/recommendations`);
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
    return this.request(`/api/v1/jobs${qs}`);
  }

  public async createJob(jobData: any): Promise<{ job: JobListing; message: string }> {
    return this.request('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
  }

  public async deleteJob(jobId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/v1/jobs/${jobId}`, {
      method: 'DELETE'
    });
  }

  public async getJobCandidates(jobId: string): Promise<{ job: JobListing; candidates: { student: StudentProfile; match: JobMatchResult }[] }> {
    return this.request(`/api/v1/jobs/${jobId}/candidates`);
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
    return this.request(`/api/v1/applications${qs}`);
  }

  public async applyForJob(jobId: string, studentId?: string): Promise<{
    application: JobApplication;
    applicationUrl?: string;
    isNew: boolean;
    message: string;
  }> {
    return this.request('/api/v1/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, studentId })
    });
  }

  public async confirmApplication(applicationId: string): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/v1/applications/${applicationId}/confirm`, {
      method: 'POST'
    });
  }

  public async declineApplication(applicationId: string, data: {
    declineReason: ApplicationDeclineReason;
    studentComment?: string;
    needsHelp: boolean;
  }): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/v1/applications/${applicationId}/decline`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateHelpStatus(applicationId: string, helpStatus: HelpStatus): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/v1/applications/${applicationId}/help-status`, {
      method: 'PATCH',
      body: JSON.stringify({ helpStatus })
    });
  }

  public async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<{ application: JobApplication; message: string }> {
    return this.request(`/api/v1/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  public async withdrawApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/v1/applications/${applicationId}`, {
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
    return this.request(`/api/v1/applications/${applicationId}/interviews`, {
      method: 'POST',
      body: JSON.stringify({ roundTitle, date })
    });
  }

  // Feedback
  public async getRejectionFeedbacks(): Promise<{ feedbackRecords: RejectionFeedbackRecord[] }> {
    return this.request('/api/v1/feedback/rejection');
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
    return this.request('/api/v1/feedback/rejection', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Analytics
  public async getAnalytics(): Promise<ManagementKPIs> {
    return this.request('/api/v1/analytics/overview');
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
    return this.request(`/api/v1/students/${studentId}/resume`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async deleteStudentResume(studentId: string): Promise<{ student: StudentProfile; message: string }> {
    return this.request(`/api/v1/students/${studentId}/resume`, {
      method: 'DELETE'
    });
  }

  // Reset
  public async resetSystem(): Promise<{ message: string }> {
    return this.request('/api/v1/system/reset', {
      method: 'POST'
    });
  }
}

export const api = new ApiClient();
