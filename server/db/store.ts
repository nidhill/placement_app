import { 
  User, 
  StudentProfile, 
  JobListing, 
  JobApplication, 
  RejectionFeedbackRecord, 
  AuditLog, 
  ApifyScraperConfig, 
  LmsSyncConfig,
  AtsSyncConfig,
  EligibilityStatus,
  UserRole,
  RejectionCategory,
  ApplicationStatus,
  ApplicationDeclineReason,
  HelpStatus
} from '../../src/types.ts';
import { 
  INITIAL_USERS, 
  INITIAL_STUDENTS, 
  INITIAL_JOBS, 
  INITIAL_APPLICATIONS, 
  INITIAL_REJECTION_FEEDBACK, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_APIFY_CONFIG, 
  INITIAL_LMS_CONFIG,
  INITIAL_ATS_CONFIG 
} from './seedData.ts';
import { TechJobClassifier } from '../services/techClassifier.ts';
import { DesignationNormalizer } from '../services/designationNormalizer.ts';
import { IndiaLocationFilter } from '../services/indiaLocationFilter.ts';

class DatabaseStore {
  private users: Map<string, User> = new Map();
  private students: Map<string, StudentProfile> = new Map();
  private jobs: Map<string, JobListing> = new Map();
  private applications: Map<string, JobApplication> = new Map();
  private rejectionFeedback: Map<string, RejectionFeedbackRecord> = new Map();
  private auditLogs: AuditLog[] = [];
  private apifyConfig: ApifyScraperConfig = { ...INITIAL_APIFY_CONFIG };
  private lmsConfig: LmsSyncConfig = { ...INITIAL_LMS_CONFIG };
  private atsConfig: AtsSyncConfig = { ...INITIAL_ATS_CONFIG };

  constructor() {
    this.seed();
  }

  private seed() {
    INITIAL_USERS.forEach(u => this.users.set(u.id, { ...u }));
    INITIAL_STUDENTS.forEach(s => this.students.set(s.id, { ...s }));
    INITIAL_JOBS.forEach(j => {
      // 1. Enforce India-Only Filter on Seed Jobs
      const locCheck = IndiaLocationFilter.evaluateLocation({
        location: j.location,
        countryCode: j.countryCode
      });
      if (!locCheck.isIndia) return;

      const check = TechJobClassifier.classify({
        title: j.title,
        description: j.description,
        skills: j.requiredSkills
      });
      if (check.isTechJob) {
        const freshDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        this.jobs.set(j.id, {
          ...j,
          location: locCheck.normalizedLocation,
          countryCode: 'IN',
          postedDate: freshDate,
          discoveredAt: freshDate,
          createdAt: freshDate,
          category: j.category || check.category,
          normalizedDesignation: j.normalizedDesignation || DesignationNormalizer.normalize(j.title)
        });
      }
    });
    INITIAL_APPLICATIONS.forEach(a => this.applications.set(a.id, { ...a }));
    INITIAL_REJECTION_FEEDBACK.forEach(f => this.rejectionFeedback.set(f.id, { ...f }));
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
  }

  // ==========================================
  // 1. MAIN ADMIN & USER GOVERNANCE
  // ==========================================

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === normalized);
  }

  public getMainAdminCount(): number {
    return Array.from(this.users.values()).filter(u => u.role === 'MAIN_ADMIN').length;
  }

  /**
   * Provision User
   * ENFORCES FR-01: Exactly ONE Main Admin can exist in the platform.
   */
  public provisionUser(
    userData: Omit<User, 'id' | 'createdAt'>, 
    actor: { id: string; name: string; role: UserRole }
  ): User {
    if (userData.role === 'MAIN_ADMIN') {
      const existingAdminCount = this.getMainAdminCount();
      if (existingAdminCount >= 1) {
        throw new Error('SECURITY VIOLATION: There can only be ONE Main Admin account in the entire system. No second Main Admin can be created.');
      }
    }

    // Check duplicate email
    if (this.getUserByEmail(userData.email)) {
      throw new Error(`User with email "${userData.email}" already exists.`);
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    this.users.set(newUser.id, newUser);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'USER_PROVISIONED',
      entityType: 'USER',
      entityId: newUser.id,
      details: `Provisioned user "${newUser.fullName}" (${newUser.email}) with role ${newUser.role}.`
    });

    return newUser;
  }

  public revokeUser(id: string, actor: { id: string; name: string; role: UserRole }): User {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    if (user.role === 'MAIN_ADMIN') {
      throw new Error('SECURITY VIOLATION: The single Main Admin root account cannot be revoked.');
    }

    user.isActive = false;
    this.users.set(user.id, user);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'USER_REVOKED',
      entityType: 'USER',
      entityId: user.id,
      details: `Revoked access for user "${user.fullName}" (${user.email}).`
    });

    return user;
  }

  // ==========================================
  // 2. STUDENT & ELIGIBILITY GATE SYSTEM
  // ==========================================

  public getAllStudents(): StudentProfile[] {
    return Array.from(this.students.values());
  }

  public getStudentById(id: string): StudentProfile | undefined {
    return this.students.get(id);
  }

  public getStudentsByMentor(mentorId: string): StudentProfile[] {
    return Array.from(this.students.values()).filter(s => s.mentorId === mentorId);
  }

  /**
   * Evaluates if student can enter placement portal
   * Gate rule: ONLY 'ELIGIBLE' or 'ADMIN_OVERRIDE'
   */
  public isStudentEligible(studentId: string): boolean {
    const student = this.students.get(studentId);
    if (!student) return false;
    return student.eligibilityStatus === 'ELIGIBLE' || student.eligibilityStatus === 'ADMIN_OVERRIDE';
  }

  /**
   * Mentor toggles student eligibility
   */
  public toggleMentorEligibility(
    studentId: string, 
    isEligible: boolean, 
    notes: string, 
    actor: { id: string; name: string; role: UserRole }
  ): StudentProfile {
    const student = this.students.get(studentId);
    if (!student) throw new Error('Student not found');

    const previousStatus = student.eligibilityStatus;
    const newStatus: EligibilityStatus = isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE';

    student.eligibilityStatus = newStatus;
    student.eligibilityUpdatedAt = new Date().toISOString();
    student.eligibilityUpdatedBy = actor.name;
    student.evaluationNotes = notes;

    this.students.set(student.id, student);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MENTOR_ELIGIBILITY_TOGGLE',
      entityType: 'STUDENT',
      entityId: student.id,
      details: `Mentor changed status of ${student.fullName} from ${previousStatus} to ${newStatus}. Notes: ${notes}`
    });

    return student;
  }

  /**
   * Main Admin emergency override of student eligibility
   */
  public adminEmergencyOverride(
    studentId: string, 
    newStatus: EligibilityStatus, 
    reason: string, 
    actor: { id: string; name: string; role: UserRole }
  ): StudentProfile {
    if (actor.role !== 'MAIN_ADMIN') {
      throw new Error('Unauthorized: Only the Main Admin can execute emergency student eligibility overrides.');
    }

    const student = this.students.get(studentId);
    if (!student) throw new Error('Student not found');

    const previousStatus = student.eligibilityStatus;
    student.eligibilityStatus = newStatus;
    student.overrideReason = reason;
    student.eligibilityUpdatedAt = new Date().toISOString();
    student.eligibilityUpdatedBy = `${actor.name} (Main Admin Emergency Override)`;

    this.students.set(student.id, student);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ADMIN_EMERGENCY_OVERRIDE',
      entityType: 'STUDENT',
      entityId: student.id,
      details: `Emergency override executed by Main Admin for ${student.fullName}. Status changed from ${previousStatus} to ${newStatus}. Reason: ${reason}`
    });

    return student;
  }

  public updateStudentProfile(
    studentId: string, 
    updateData: Partial<StudentProfile>, 
    actor: { id: string; name: string; role: UserRole }
  ): StudentProfile {
    const student = this.students.get(studentId);
    if (!student) throw new Error('Student not found');

    // Never allow non-admins/mentors to mutate eligibility status directly via profile update
    if (updateData.eligibilityStatus && actor.role === 'STUDENT') {
      delete updateData.eligibilityStatus;
    }

    const updated = { ...student, ...updateData };
    this.students.set(studentId, updated);
    return updated;
  }

  // ==========================================
  // 3. JOB OPPORTUNITIES & SOURCING CHANNELS
  // ==========================================

  private ensureJobUrls(job: JobListing): JobListing {
    const externalUrl = job.externalUrl || job.applicationUrl || job.sourceUrl || (job as any).url || `https://www.google.com/search?q=${encodeURIComponent(job.company + ' ' + job.title + ' apply')}`;
    const applicationUrl = job.applicationUrl || externalUrl;
    return {
      ...job,
      externalUrl,
      applicationUrl
    };
  }

  public getAllJobs(): JobListing[] {
    return Array.from(this.jobs.values())
      .filter(job => {
        if (job.countryCode === 'IN') return true;
        const locCheck = IndiaLocationFilter.evaluateLocation({ location: job.location, countryCode: job.countryCode });
        return locCheck.isIndia;
      })
      .map(job => this.ensureJobUrls(job))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getJobById(id: string): JobListing | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const locCheck = IndiaLocationFilter.evaluateLocation({ location: job.location, countryCode: job.countryCode });
    if (!locCheck.isIndia && job.countryCode !== 'IN') return undefined;
    return this.ensureJobUrls(job);
  }

  public removeAllDemoJobs(): void {
    // Purges all dummy/demo jobs, keeping ONLY real jobs from external APIs (AI_JOB_SCRAPER, ATS_JOB_API)
    for (const [id, job] of this.jobs.entries()) {
      if ((job.sourceChannel !== 'AI_JOB_SCRAPER' && job.sourceChannel !== 'ATS_JOB_API') || id.startsWith('job-haca-')) {
        this.jobs.delete(id);
      }
    }
  }

  public createJob(
    jobData: Omit<JobListing, 'id' | 'jobCode' | 'createdAt' | 'updatedAt'>,
    actor: { id: string; name: string; role: UserRole }
  ): JobListing {
    // Enforce India-Only Validation
    const locCheck = IndiaLocationFilter.evaluateLocation({
      location: jobData.location,
      countryCode: jobData.countryCode
    });

    if (!locCheck.isIndia) {
      throw new Error(`JOB CREATION REJECTED: Location "${jobData.location || 'Unknown'}" is outside India. The HACA Placement Platform strictly accepts only jobs located in India.`);
    }

    const id = `job-haca-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const codeNumber = this.jobs.size + 1;
    const jobCode = `JOB-2026-${String(codeNumber).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const externalUrl = jobData.externalUrl || jobData.applicationUrl || jobData.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(jobData.company + ' ' + jobData.title + ' apply')}`;
    const applicationUrl = jobData.applicationUrl || externalUrl;

    const newJob: JobListing = {
      ...jobData,
      location: locCheck.normalizedLocation,
      countryCode: 'IN',
      externalUrl,
      applicationUrl,
      id,
      jobCode,
      createdAt: now,
      updatedAt: now,
      discoveredAt: jobData.discoveredAt || now
    };

    this.jobs.set(id, newJob);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'JOB_CREATED',
      entityType: 'JOB',
      entityId: id,
      details: `Created job listing "${newJob.title}" at "${newJob.company}" via channel "${newJob.sourceChannel}".`
    });

    return newJob;
  }

  public updateJob(
    id: string, 
    updates: Partial<JobListing>, 
    actor: { id: string; name: string; role: UserRole }
  ): JobListing {
    const job = this.jobs.get(id);
    if (!job) throw new Error('Job not found');

    const updatedJob: JobListing = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.jobs.set(id, updatedJob);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'JOB_UPDATED',
      entityType: 'JOB',
      entityId: id,
      details: `Updated job "${updatedJob.title}".`
    });

    return updatedJob;
  }

  /**
   * Delete a manually-created job (Placement Team / Staff Referral only).
   * NEVER allows deletion of external API-scraped jobs.
   */
  public deleteJob(
    id: string,
    actor: { id: string; name: string; role: UserRole }
  ): boolean {
    const job = this.jobs.get(id);
    if (!job) throw new Error('Job not found');

    // SECURITY: Prevent deletion of external/API-sourced jobs
    if (job.sourceChannel === 'AI_JOB_SCRAPER' || job.sourceChannel === 'ATS_JOB_API') {
      throw new Error('PERMISSION DENIED: External API-sourced jobs cannot be deleted. Only manually-created Placement Team or Staff Referral jobs can be removed.');
    }

    this.jobs.delete(id);

    // Also remove any applications linked to this job
    for (const [appId, app] of this.applications.entries()) {
      if (app.jobId === id) {
        this.applications.delete(appId);
      }
    }

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'JOB_DELETED',
      entityType: 'JOB',
      entityId: id,
      details: `Deleted manually-created job "${job.title}" at "${job.company}" (source: ${job.sourceChannel}).`
    });

    return true;
  }

  // ==========================================
  // 4. APPLICATIONS & INTERVIEWS
  // ==========================================

  public getAllApplications(): JobApplication[] {
    return Array.from(this.applications.values());
  }

  public getApplicationById(id: string): JobApplication | undefined {
    return this.applications.get(id);
  }

  public getApplicationsByStudent(studentId: string): JobApplication[] {
    return Array.from(this.applications.values()).filter(a => a.studentId === studentId);
  }

  public createApplication(
    jobId: string, 
    studentId: string, 
    actor: { id: string; name: string; role: UserRole }
  ): { application: JobApplication; isNew: boolean } {
    const student = this.students.get(studentId);
    if (!student) throw new Error('Student record not found');
    if (!this.isStudentEligible(studentId)) {
      throw new Error('ACCESS DENIED: Student is not marked as Eligible for Placement by Mentor or Admin.');
    }

    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job listing not found');

    // IDEMPOTENT: Return existing application if one already exists for this student+job
    const existing = Array.from(this.applications.values()).find(
      a => a.jobId === jobId && a.studentId === studentId
    );
    if (existing) {
      return { application: existing, isNew: false };
    }

    const id = `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Determine human-readable source label
    const sourceLabel = job.sourceChannel === 'AI_JOB_SCRAPER' 
      ? 'AI Job Scraper (Apify)'
      : job.sourceChannel === 'ATS_JOB_API'
      ? 'ATS Public API'
      : job.sourceChannel === 'STAFF_REFERRAL'
      ? 'Staff & Faculty Referral'
      : job.sourceChannel === 'INBOUND'
      ? 'Inbound'
      : job.sourceChannel === 'OUTREACH'
      ? 'Outreach'
      : job.sourceChannel === 'REPEATED_PARTNER'
      ? 'Repeated Partner'
      : job.sourceChannel === 'SOCIAL_MEDIA'
      ? 'Social Media'
      : 'Placement Team Direct';

    // Resolve the external application URL from job fields
    const applicationUrl = job.applicationUrl || job.externalUrl || job.sourceUrl || undefined;

    const application: JobApplication = {
      id,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      studentId: student.id,
      studentName: student.fullName,
      studentEmail: student.email,
      school: student.school,
      program: student.program,
      batch: student.batch,
      sourceChannel: job.sourceChannel,
      jobSource: sourceLabel,
      applicationUrl,
      status: 'APPLICATION_STARTED',
      startedAt: now,
      createdAt: now,
      appliedAt: now,
      updatedAt: now,
      interviewDates: []
    };

    this.applications.set(id, application);

    // Update inactivity flag
    student.inactivityFlags.hasNotApplied = false;
    this.students.set(student.id, student);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPLICATION_STARTED',
      entityType: 'APPLICATION',
      entityId: id,
      details: `${student.fullName} started external application for "${job.title}" at "${job.company}".`
    });

    return { application, isNew: true };
  }

  /**
   * Student confirms they completed the external application.
   * Sets status = APPLIED, records confirmedAt.
   */
  public confirmApplication(
    id: string,
    actor: { id: string; name: string; role: UserRole }
  ): JobApplication {
    const application = this.applications.get(id);
    if (!application) throw new Error('Application not found');

    // If already Applied, return as-is (idempotent)
    if (application.status === 'APPLIED') {
      return application;
    }

    const now = new Date().toISOString();
    application.status = 'APPLIED';
    application.confirmedAt = now;
    application.updatedAt = now;
    this.applications.set(id, application);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPLICATION_CONFIRMED',
      entityType: 'APPLICATION',
      entityId: id,
      details: `${application.studentName} confirmed completed application for "${application.jobTitle}" at "${application.company}".`
    });

    return application;
  }

  /**
   * Student reports they did NOT complete the external application.
   * Sets status = NOT_APPLIED, records reason, optionally flags help needed.
   */
  public declineApplication(
    id: string,
    declineReason: ApplicationDeclineReason,
    studentComment: string,
    needsHelp: boolean,
    actor: { id: string; name: string; role: UserRole }
  ): JobApplication {
    const application = this.applications.get(id);
    if (!application) throw new Error('Application not found');

    const now = new Date().toISOString();
    application.status = 'NOT_APPLIED';
    application.declineReason = declineReason;
    application.studentComment = studentComment || undefined;
    application.needsHelp = needsHelp;
    application.helpStatus = needsHelp ? 'HELP_REQUESTED' : 'NONE';
    if (needsHelp) {
      application.helpUpdatedAt = now;
    }
    application.updatedAt = now;
    this.applications.set(id, application);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPLICATION_DECLINED',
      entityType: 'APPLICATION',
      entityId: id,
      details: `${application.studentName} reported NOT applying for "${application.jobTitle}" at "${application.company}". Reason: ${declineReason}. Needs help: ${needsHelp}.`
    });

    return application;
  }

  /**
   * Placement Officer updates the help status for a student's application.
   * Does NOT change the ApplicationStatus — those are separate fields.
   */
  public updateHelpStatus(
    id: string,
    helpStatus: HelpStatus,
    actor: { id: string; name: string; role: UserRole }
  ): JobApplication {
    const application = this.applications.get(id);
    if (!application) throw new Error('Application not found');

    const now = new Date().toISOString();
    application.helpStatus = helpStatus;
    application.helpUpdatedAt = now;
    application.helpUpdatedBy = actor.name;
    application.updatedAt = now;
    this.applications.set(id, application);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'HELP_STATUS_UPDATED',
      entityType: 'APPLICATION',
      entityId: id,
      details: `Help status for ${application.studentName}'s application to "${application.jobTitle}" updated to ${helpStatus} by ${actor.name}.`
    });

    return application;
  }

  public withdrawApplication(
    id: string,
    actor: { id: string; name: string; role: UserRole }
  ): boolean {
    const application = this.applications.get(id);
    if (!application) throw new Error('Application not found');

    this.applications.delete(id);

    // If student has no more applications, update hasNotApplied flag
    const student = this.students.get(application.studentId);
    if (student) {
      const remaining = Array.from(this.applications.values()).filter(a => a.studentId === student.id);
      if (remaining.length === 0) {
        student.inactivityFlags.hasNotApplied = true;
        this.students.set(student.id, student);
      }
    }

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPLICATION_WITHDRAWN',
      entityType: 'APPLICATION',
      entityId: id,
      details: `${actor.name} withdrew application for "${application.jobTitle}" at "${application.company}".`
    });

    return true;
  }

  public updateApplicationStatus(
    id: string, 
    newStatus: ApplicationStatus, 
    actor: { id: string; name: string; role: UserRole }
  ): JobApplication {
    const application = this.applications.get(id);
    if (!application) throw new Error('Application not found');

    const previousStatus = application.status;
    application.status = newStatus;
    application.updatedAt = new Date().toISOString();

    // If rejected, increment consecutive rejections on student profile
    const student = this.students.get(application.studentId);
    if (student) {
      if (newStatus === 'REJECTED') {
        student.inactivityFlags.consecutiveRejections += 1;
      } else if (newStatus === 'SELECTED' || newStatus === 'JOINED') {
        student.inactivityFlags.consecutiveRejections = 0;
      }
      this.students.set(student.id, student);
    }

    this.applications.set(id, application);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPLICATION_STATUS_CHANGE',
      entityType: 'APPLICATION',
      entityId: id,
      details: `Status of application for ${application.studentName} at ${application.company} changed from ${previousStatus} to ${newStatus}.`
    });

    return application;
  }

  public recordInterviewSchedule(
    applicationId: string,
    roundTitle: string,
    dateString: string,
    actor: { id: string; name: string; role: UserRole }
  ): JobApplication {
    const application = this.applications.get(applicationId);
    if (!application) throw new Error('Application not found');

    const roundNum = application.interviewDates.length + 1;
    application.interviewDates.push({
      round: roundNum,
      title: roundTitle,
      date: dateString,
      completed: false
    });
    application.status = 'INTERVIEW_SCHEDULED';
    application.updatedAt = new Date().toISOString();

    this.applications.set(applicationId, application);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'APPLICATION',
      entityId: applicationId,
      details: `Round ${roundNum} (${roundTitle}) scheduled for ${application.studentName} on ${dateString}.`
    });

    return application;
  }

  // ==========================================
  // 5. REJECTION FEEDBACK (MANDATORY LOOP)
  // ==========================================

  public getAllRejectionFeedback(): RejectionFeedbackRecord[] {
    return Array.from(this.rejectionFeedback.values()).sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  public submitRejectionFeedback(
    applicationId: string,
    category: RejectionCategory,
    details: string,
    remedialActionNeeded: string,
    actor: { id: string; name: string; role: UserRole }
  ): RejectionFeedbackRecord {
    const application = this.applications.get(applicationId);
    if (!application) throw new Error('Application not found');

    const id = `fb-${Date.now()}`;
    const now = new Date().toISOString();

    const record: RejectionFeedbackRecord = {
      id,
      applicationId,
      jobId: application.jobId,
      jobTitle: application.jobTitle,
      company: application.company,
      studentId: application.studentId,
      studentName: application.studentName,
      school: application.school,
      program: application.program,
      batch: application.batch,
      category,
      details,
      remedialActionNeeded: remedialActionNeeded || 'Mentor review scheduled for remedial intervention',
      submittedAt: now
    };

    this.rejectionFeedback.set(id, record);

    // Attach to application
    application.rejectionFeedback = {
      id,
      category,
      details,
      remedialActionNeeded: record.remedialActionNeeded,
      submittedAt: now
    };
    this.applications.set(applicationId, application);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REJECTION_FEEDBACK_SUBMITTED',
      entityType: 'FEEDBACK',
      entityId: id,
      details: `Mandatory feedback logged for ${application.studentName} on ${application.company} application: ${category}.`
    });

    return record;
  }

  // ==========================================
  // 6. AUDIT LOGGING
  // ==========================================

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public logAudit(logData: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...logData,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    // Keep max 500 records in memory
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }

  // ==========================================
  // 7. SYSTEM CONFIGS (LMS & APIFY)
  // ==========================================

  public getApifyConfig(): ApifyScraperConfig {
    return { ...this.apifyConfig };
  }

  public updateApifyConfig(updates: Partial<ApifyScraperConfig>, actor: { id: string; name: string; role: UserRole }): ApifyScraperConfig {
    this.apifyConfig = { ...this.apifyConfig, ...updates };
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APIFY_CONFIG_UPDATED',
      entityType: 'INTEGRATION',
      entityId: 'APIFY',
      details: 'Apify scraper settings updated.'
    });
    return this.apifyConfig;
  }

  public getLmsConfig(): LmsSyncConfig {
    return { ...this.lmsConfig };
  }

  public updateLmsConfig(updates: Partial<LmsSyncConfig>, actor: { id: string; name: string; role: UserRole }): LmsSyncConfig {
    this.lmsConfig = { ...this.lmsConfig, ...updates };
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'LMS_CONFIG_UPDATED',
      entityType: 'INTEGRATION',
      entityId: 'LMS',
      details: 'LMS integration configuration updated.'
    });
    return this.lmsConfig;
  }

  public getAtsConfig(): AtsSyncConfig {
    return { ...this.atsConfig };
  }

  public updateAtsConfig(updates: Partial<AtsSyncConfig>, actor: { id: string; name: string; role: UserRole }): AtsSyncConfig {
    this.atsConfig = { ...this.atsConfig, ...updates };
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ATS_CONFIG_UPDATED',
      entityType: 'INTEGRATION',
      entityId: 'ATS',
      details: 'Public ATS integration settings updated.'
    });
    return this.atsConfig;
  }

  /**
   * Reset store back to initial seed data for testing
   */
  public resetToSeed(): void {
    this.users.clear();
    this.students.clear();
    this.jobs.clear();
    this.applications.clear();
    this.rejectionFeedback.clear();
    this.auditLogs = [];
    this.apifyConfig = { ...INITIAL_APIFY_CONFIG };
    this.lmsConfig = { ...INITIAL_LMS_CONFIG };
    this.seed();
  }
}

export const dbStore = new DatabaseStore();
