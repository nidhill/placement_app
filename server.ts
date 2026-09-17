import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/db/store.ts';
import { RuleBasedMatchingEngine, JobMatchingService } from './server/services/matchingEngine.ts';
import { DesignationNormalizer } from './server/services/designationNormalizer.ts';
import { TechJobClassifier } from './server/services/techClassifier.ts';
import { AnalyticsService } from './server/services/analyticsService.ts';
import { LmsSyncService } from './server/services/lmsService.ts';
import { ApifyScraperService } from './server/services/scraperService.ts';
import { AtsJobApiService } from './server/services/atsJobApiService.ts';
import { IndiaLocationFilter } from './server/services/indiaLocationFilter.ts';
import { UserRole, EligibilityStatus, ApplicationStatus, RejectionCategory } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // -------------------------------------------------------------
  // HELPER: Mock Auth Context Extractor (Supports headers or body)
  // -------------------------------------------------------------
  const getActorFromRequest = (req: express.Request): { id: string; name: string; role: UserRole } => {
    const headerUserId = req.headers['x-user-id'] as string;
    const headerRole = req.headers['x-user-role'] as UserRole;
    if (headerUserId) {
      const user = dbStore.getUserById(headerUserId);
      if (user) {
        return { id: user.id, name: user.fullName, role: user.role };
      }
    }
    // Fallback default to root admin for development testing if unauthenticated
    const rootAdmin = dbStore.getAllUsers().find(u => u.role === 'MAIN_ADMIN')!;
    return { id: rootAdmin.id, name: rootAdmin.fullName, role: rootAdmin.role };
  };

  // -------------------------------------------------------------
  // 0. HEALTH CHECK
  // -------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'HACA Centralized Placement Application',
      version: '1.1-single-admin',
      mainAdminCount: dbStore.getMainAdminCount()
    });
  });

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & ROOT GOVERNANCE
  // -------------------------------------------------------------

  /**
   * Login endpoint
   * Gated student access check: if user is STUDENT and not ELIGIBLE/ADMIN_OVERRIDE, return 403.
   */
  app.post('/api/v1/auth/login', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for authentication.' });
    }

    const user = dbStore.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: `User with email "${email}" not found.` });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This user account has been deactivated.' });
    }

    // Student accounts should always be able to log in to view their academic records,
    // benchmarks, and profile details. Gating applies only to submitting applications and job recommendations.
    const studentProfile = user.role === 'STUDENT' 
      ? (dbStore.getStudentById(user.id) || dbStore.getAllStudents().find(s => s.id === user.id || s.email === user.email) || dbStore.getAllStudents()[0])
      : undefined;

    return res.json({
      user,
      studentProfile,
      token: `mock-jwt-token-${user.id}-${Date.now()}`
    });
  });

  /**
   * List all system users
   */
  app.get('/api/v1/auth/users', (req, res) => {
    res.json({ users: dbStore.getAllUsers() });
  });

  // -------------------------------------------------------------
  // 2. MAIN ADMIN GOVERNANCE MODULE
  // -------------------------------------------------------------

  /**
   * Provision Staff Account (Main Admin Only)
   * STRICT CHECK: Disallows provisioning a 2nd MAIN_ADMIN
   */
  app.post('/api/v1/admin/users/provision', (req, res) => {
    const actor = getActorFromRequest(req);
    if (actor.role !== 'MAIN_ADMIN') {
      return res.status(403).json({ error: 'Only the Main Admin can provision new accounts.' });
    }

    const { email, fullName, role, department } = req.body;
    if (!email || !fullName || !role) {
      return res.status(400).json({ error: 'Email, fullName, and role are required.' });
    }

    // STRICT ARCHITECTURAL RULE: Only ONE Main Admin can exist
    if (role === 'MAIN_ADMIN') {
      return res.status(403).json({
        error: 'SECURITY VIOLATION: There can only be ONE Main Admin in the entire system. No second Main Admin can be created.'
      });
    }

    try {
      const newUser = dbStore.provisionUser({
        email,
        fullName,
        role: role as UserRole,
        department: department || 'HACA Staff',
        isActive: true
      }, actor);

      return res.status(201).json({ user: newUser, message: 'User provisioned successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Revoke User Account
   */
  app.post('/api/v1/admin/users/:id/revoke', (req, res) => {
    const actor = getActorFromRequest(req);
    if (actor.role !== 'MAIN_ADMIN') {
      return res.status(403).json({ error: 'Only the Main Admin can revoke user accounts.' });
    }

    try {
      const user = dbStore.revokeUser(req.params.id, actor);
      return res.json({ user, message: 'User revoked successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Emergency Student Eligibility Override (Main Admin Only)
   */
  app.post('/api/v1/admin/override-eligibility', (req, res) => {
    const actor = getActorFromRequest(req);
    if (actor.role !== 'MAIN_ADMIN') {
      return res.status(403).json({ error: 'Only the Main Admin can perform emergency student eligibility overrides.' });
    }

    const { studentId, newStatus, reason } = req.body;
    if (!studentId || !newStatus || !reason) {
      return res.status(400).json({ error: 'studentId, newStatus, and reason are required.' });
    }

    try {
      const student = dbStore.adminEmergencyOverride(studentId, newStatus as EligibilityStatus, reason, actor);
      return res.json({ student, message: 'Emergency eligibility override applied and logged.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Audit Logs Viewer
   */
  app.get('/api/v1/admin/audit-logs', (req, res) => {
    res.json({ auditLogs: dbStore.getAuditLogs() });
  });

  // -------------------------------------------------------------
  // 3. INTEGRATION MODULES: LMS & APIFY SCRAPER
  // -------------------------------------------------------------

  app.get('/api/v1/admin/integrations/lms', (req, res) => {
    res.json(dbStore.getLmsConfig());
  });

  app.patch('/api/v1/admin/integrations/lms', (req, res) => {
    const actor = getActorFromRequest(req);
    const updated = dbStore.updateLmsConfig(req.body, actor);
    res.json(updated);
  });

  app.post('/api/v1/admin/integrations/lms/sync', (req, res) => {
    const actor = getActorFromRequest(req);
    const result = LmsSyncService.syncFromLms(actor);
    res.json(result);
  });

  app.get('/api/v1/admin/integrations/apify', (req, res) => {
    res.json(dbStore.getApifyConfig());
  });

  app.patch('/api/v1/admin/integrations/apify', (req, res) => {
    const actor = getActorFromRequest(req);
    const updated = dbStore.updateApifyConfig(req.body, actor);
    res.json(updated);
  });

  /**
   * Get Apify Connection Status (Never exposes token)
   */
  app.get('/api/v1/admin/integrations/apify/status', async (req, res) => {
    try {
      const status = await ApifyScraperService.testConnection();
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * Test Apify Connection (Main Admin / Placement Officer)
   */
  app.post('/api/v1/admin/integrations/apify/test', async (req, res) => {
    try {
      const status = await ApifyScraperService.testConnection();
      return res.json({
        success: status.connected,
        status,
        message: status.connected 
          ? `Successfully connected to Apify (Account: ${status.username}). Actor: ${status.actorTitle || 'Configured'}.`
          : (status.error || 'Failed to connect to Apify')
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Fetch Real Jobs from Apify Scraper
   */
  app.post('/api/v1/admin/integrations/apify/fetch', async (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      const result = await ApifyScraperService.fetchAndIngestJobs(actor, req.body);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ 
        error: err.message || 'The Apify job scraper could not be reached.',
        fallbackNotice: 'Your existing demo jobs are still available.'
      });
    }
  });

  /**
   * Run Apify Scraper Ingestion (Legacy and direct run)
   */
  app.post('/api/v1/admin/integrations/apify/run', async (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      const result = await ApifyScraperService.fetchAndIngestJobs(actor, req.body);
      return res.json({
        ...result,
        ingestedCount: result.newIngested,
        skippedDuplicatesCount: result.duplicatesCount,
        jobsScraped: result.totalReceived,
        newJobsIngested: result.newIngested,
        duplicatesSkipped: result.duplicatesCount
      });
    } catch (err: any) {
      return res.status(500).json({ 
        error: err.message || 'The Apify job scraper could not be reached.',
        fallbackNotice: 'Your existing demo jobs are still available.'
      });
    }
  });

  // -------------------------------------------------------------
  // 3B. NEW INTEGRATION: PUBLIC ATS JOB API (GREENHOUSE / LEVER / ASHBY)
  // -------------------------------------------------------------

  app.get('/api/v1/admin/integrations/ats', (req, res) => {
    res.json(dbStore.getAtsConfig());
  });

  app.patch('/api/v1/admin/integrations/ats', (req, res) => {
    const actor = getActorFromRequest(req);
    const updated = dbStore.updateAtsConfig(req.body, actor);
    res.json(updated);
  });

  /**
   * Get ATS API Connection & Target Status
   */
  app.get('/api/v1/admin/integrations/ats/status', async (req, res) => {
    try {
      const status = await AtsJobApiService.testConnection();
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * Test Public ATS API Connectivity
   */
  app.post('/api/v1/admin/integrations/ats/test', async (req, res) => {
    try {
      const status = await AtsJobApiService.testConnection();
      return res.json({
        success: status.connected,
        status,
        message: status.connected
          ? `Successfully connected to Public ATS APIs. Active endpoints: ${status.activeConnectors.join(', ')}.`
          : (status.error || 'Failed to connect to public ATS APIs')
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Fetch Real Technology Jobs from Public ATS API
   */
  app.post('/api/v1/admin/integrations/ats/fetch', async (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      const result = await AtsJobApiService.fetchAndIngestJobs(actor, req.body);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ 
        error: err.message || 'The ATS public job API could not be reached.',
        fallbackNotice: 'Existing jobs remain available.'
      });
    }
  });

  /**
   * Sync ATS Jobs (Alias for fetch)
   */
  app.post('/api/v1/admin/integrations/ats/sync', async (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      const result = await AtsJobApiService.fetchAndIngestJobs(actor, req.body);
      return res.json({
        ...result,
        ingestedCount: result.newIngested,
        skippedDuplicatesCount: result.duplicatesCount,
        jobsScraped: result.totalReceived,
        newJobsIngested: result.newIngested,
        duplicatesSkipped: result.duplicatesCount
      });
    } catch (err: any) {
      return res.status(500).json({ 
        error: err.message || 'The ATS public job API could not be reached.',
        fallbackNotice: 'Existing jobs remain available.'
      });
    }
  });

  // -------------------------------------------------------------
  // 4. MENTOR / SSHO WORKSPACE MODULE
  // -------------------------------------------------------------

  app.get('/api/v1/mentor/students', (req, res) => {
    const mentorId = req.query.mentorId as string;
    if (mentorId) {
      return res.json({ students: dbStore.getStudentsByMentor(mentorId) });
    }
    return res.json({ students: dbStore.getAllStudents() });
  });

  /**
   * Dedicated Mentor "Eligible for Placement" Toggle
   */
  app.patch('/api/v1/mentor/students/:id/eligibility', (req, res) => {
    const actor = getActorFromRequest(req);
    const { isEligible, evaluationNotes } = req.body;

    if (typeof isEligible !== 'boolean') {
      return res.status(400).json({ error: 'isEligible boolean is required.' });
    }

    try {
      const student = dbStore.toggleMentorEligibility(
        req.params.id, 
        isEligible, 
        evaluationNotes || (isEligible ? 'Approved for placement by Main Admin' : 'Marked not eligible by Main Admin'), 
        actor
      );
      return res.json({ student, message: `Student status updated to ${student.eligibilityStatus}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Main Admin Student Placement Eligibility Management (Testing Phase Workflow)
   */
  app.patch('/api/v1/admin/students/:id/eligibility', (req, res) => {
    const actor = getActorFromRequest(req);
    const { isEligible, evaluationNotes } = req.body;

    if (typeof isEligible !== 'boolean') {
      return res.status(400).json({ error: 'isEligible boolean is required.' });
    }

    try {
      const student = dbStore.toggleMentorEligibility(
        req.params.id, 
        isEligible, 
        evaluationNotes || (isEligible ? 'Approved for placement by Main Admin (Testing Phase)' : 'Marked not eligible by Main Admin'), 
        actor
      );
      return res.json({ student, message: `Student status updated to ${student.eligibilityStatus}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 5. STUDENT PORTAL MODULE
  // -------------------------------------------------------------

  app.get('/api/v1/students/:id', (req, res) => {
    let student = dbStore.getStudentById(req.params.id);
    if (!student) {
      const all = dbStore.getAllStudents();
      student = all.find(s => s.id === req.params.id || s.email === req.params.id) || all[0];
    }
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    return res.json({ student });
  });

  app.patch('/api/v1/students/:id', (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      let targetId = req.params.id;
      if (!dbStore.getStudentById(targetId)) {
        const all = dbStore.getAllStudents();
        const found = all.find(s => s.id === targetId || s.email === targetId) || all[0];
        if (found) targetId = found.id;
      }
      const updated = dbStore.updateStudentProfile(targetId, req.body, actor);
      return res.json({ student: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Upload CV / Resume file for student
   */
  app.post('/api/v1/students/:id/resume', (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      let targetId = req.params.id;
      if (!dbStore.getStudentById(targetId)) {
        const all = dbStore.getAllStudents();
        const found = all.find(s => s.id === targetId || s.email === targetId) || all[0];
        if (found) targetId = found.id;
      }

      const { fileName, fileSize, fileType, dataUrl } = req.body;
      if (!fileName || !dataUrl) {
        return res.status(400).json({ error: 'File name and file content data are required.' });
      }

      const now = new Date().toISOString();
      const updated = dbStore.updateStudentProfile(targetId, {
        resumeFileName: fileName,
        resumeFileSize: fileSize || 0,
        resumeFileType: fileType || 'application/pdf',
        resumeFileUploadedAt: now,
        resumeDataUrl: dataUrl,
        resumeUrl: dataUrl
      }, actor);

      return res.json({ 
        student: updated, 
        message: `Resume document "${fileName}" successfully uploaded and attached to placement profile.` 
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Remove CV / Resume file for student
   */
  app.delete('/api/v1/students/:id/resume', (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      let targetId = req.params.id;
      if (!dbStore.getStudentById(targetId)) {
        const all = dbStore.getAllStudents();
        const found = all.find(s => s.id === targetId || s.email === targetId) || all[0];
        if (found) targetId = found.id;
      }

      const updated = dbStore.updateStudentProfile(targetId, {
        resumeFileName: undefined,
        resumeFileSize: undefined,
        resumeFileType: undefined,
        resumeFileUploadedAt: undefined,
        resumeDataUrl: undefined,
        resumeUrl: ''
      }, actor);

      return res.json({ 
        student: updated, 
        message: 'Resume document has been removed.' 
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Rule-Based Recommended Jobs for Student
   */
  app.get('/api/v1/students/:id/recommendations', (req, res) => {
    let student = dbStore.getStudentById(req.params.id);
    if (!student) {
      const all = dbStore.getAllStudents();
      student = all.find(s => s.id === req.params.id || s.email === req.params.id) || all[0];
    }
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Gate check
    const isEligible = student.eligibilityStatus === 'ELIGIBLE' || student.eligibilityStatus === 'ADMIN_OVERRIDE';
    if (!isEligible) {
      return res.status(403).json({
        error: 'ACCESS GATED: You must be approved for placement before accessing recommended jobs.',
        eligibilityStatus: student.eligibilityStatus
      });
    }

    const allJobs = dbStore.getAllJobs();
    const recommendations = RuleBasedMatchingEngine.getRecommendedJobsForStudent(student, allJobs);
    return res.json({ recommendations });
  });

  // -------------------------------------------------------------
  // 6. JOB MANAGEMENT & SOURCING MODULE
  // -------------------------------------------------------------

  app.get('/api/v1/jobs', async (req, res) => {
    const { sourceChannel, school, search, category, designation, includeAll } = req.query;
    let jobs = dbStore.getAllJobs();

    // --- HARD INDIA-ONLY BACKEND FILTER ---
    jobs = jobs.filter(j => {
      if (j.countryCode === 'IN') return true;
      return IndiaLocationFilter.evaluateLocation({ location: j.location, countryCode: j.countryCode }).isIndia;
    });

    // --- 30-day active filter (applied unless includeAll=true) ---
    if (includeAll !== 'true') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      jobs = jobs.filter(j => {
        // Filter out non-active jobs for all sources
        if (j.status !== 'ACTIVE') return false;

        // For external/API jobs: apply 30-day recency filter
        if (j.sourceChannel === 'AI_JOB_SCRAPER' || j.sourceChannel === 'ATS_JOB_API') {
          const jobDateStr = j.postedDate || j.discoveredAt || j.createdAt;
          if (!jobDateStr) return false; // No date = can't verify recency
          const jobDate = new Date(jobDateStr);
          if (isNaN(jobDate.getTime())) return false; // Invalid date
          return jobDate >= thirtyDaysAgo;
        }

        // For Placement Team / Staff Referral jobs: keep all active ones
        return true;
      });
    }

    if (sourceChannel) {
      jobs = jobs.filter(j => j.sourceChannel === sourceChannel);
    }
    if (school) {
      jobs = jobs.filter(j => j.eligibleSchools.includes(school as string));
    }
    if (category && category !== 'ALL') {
      jobs = jobs.filter(j => j.category === category || (j as any).dominantCategory === category);
    }
    if (designation && designation !== 'ALL') {
      jobs = jobs.filter(j => (j.normalizedDesignation || '').toLowerCase().includes((designation as string).toLowerCase()));
    }
    if (search) {
      const q = (search as string).toLowerCase().trim();
      jobs = jobs.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.category && j.category.toLowerCase().includes(q)) ||
        (j.normalizedDesignation && j.normalizedDesignation.toLowerCase().includes(q)) ||
        j.requiredSkills.some(s => s.toLowerCase().includes(q))
      );

      console.log('----------------------------------------------------');
      console.log('JOB SEARCH');
      console.log(`QUERY: "${search}"`);
      console.log(`INDIA JOBS MATCHED: ${jobs.length}`);
      console.log('----------------------------------------------------');
    }

    // Sort by posting date: newest first
    jobs.sort((a, b) => {
      const dateA = new Date(a.postedDate || a.discoveredAt || a.createdAt).getTime();
      const dateB = new Date(b.postedDate || b.discoveredAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    return res.json({ jobs, totalCount: jobs.length });
  });

  app.post('/api/v1/jobs', (req, res) => {
    const actor = getActorFromRequest(req);
    const {
      title,
      company,
      location,
      employmentType,
      experienceRequirement,
      minExperienceYears,
      salaryRange,
      description,
      requiredSkills,
      preferredSkills,
      educationRequirements,
      eligibleSchools,
      eligiblePrograms,
      sourceChannel,
      referralSourceName,
      externalUrl,
      deadline
    } = req.body;

    if (!title || !company || !sourceChannel || !requiredSkills) {
      return res.status(400).json({ error: 'Title, company, sourceChannel, and requiredSkills are mandatory.' });
    }

    // Enforce India location validation
    const locCheck = IndiaLocationFilter.evaluateLocation({ location: location || '' });
    if (!locCheck.isIndia) {
      return res.status(400).json({ 
        error: `Job creation rejected: Location "${location || 'Empty'}" is outside India. The HACA Placement Platform strictly requires all jobs to be located in India.` 
      });
    }

    try {
      const normalizedDesignation = req.body.normalizedDesignation || DesignationNormalizer.normalize(title);
      const classification = TechJobClassifier.classify({ title, description, skills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills] });
      const category = req.body.category || (classification.isTechJob ? classification.category : 'Software Development');

      const job = dbStore.createJob({
        title,
        company,
        location: locCheck.normalizedLocation,
        countryCode: 'IN',
        employmentType: employmentType || 'FULL_TIME',
        experienceRequirement: experienceRequirement || '0-1 years',
        minExperienceYears: Number(minExperienceYears) || 0,
        salaryRange: salaryRange || 'Market Competitive',
        description: description || '',
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills],
        preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
        educationRequirements: educationRequirements || ['HACA Certificate'],
        eligibleSchools: eligibleSchools || ['School of Tech'],
        eligiblePrograms: eligiblePrograms || ['Full Stack Web Development'],
        category,
        normalizedDesignation,
        sourceChannel,
        referralSourceName,
        externalUrl,
        deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
        discoveredAt: new Date().toISOString()
      }, actor);

      return res.status(201).json({ job, message: 'Job created and tagged successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Delete a manually-created job (Placement Team / Staff Referral only).
   * Backend enforces: only MAIN_ADMIN or PLACEMENT_OFFICER can delete,
   * and only non-API jobs can be deleted.
   */
  app.delete('/api/v1/jobs/:id', (req, res) => {
    const actor = getActorFromRequest(req);
    if (actor.role !== 'MAIN_ADMIN' && actor.role !== 'PLACEMENT_OFFICER') {
      return res.status(403).json({ error: 'Only the Main Admin or Placement Officer can delete job posts.' });
    }

    try {
      dbStore.deleteJob(req.params.id, actor);
      return res.json({ success: true, message: 'Job post successfully deleted.' });
    } catch (err: any) {
      const status = err.message.includes('PERMISSION DENIED') ? 403 : 400;
      return res.status(status).json({ error: err.message });
    }
  });

  /**
   * Candidate Matching: Rank eligible candidates for a specific job
   */
  app.get('/api/v1/jobs/:id/candidates', (req, res) => {
    const job = dbStore.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const students = dbStore.getAllStudents();
    const rankedCandidates = RuleBasedMatchingEngine.rankCandidatesForJob(job, students);
    return res.json({ job, candidates: rankedCandidates });
  });

  // -------------------------------------------------------------
  // 7. APPLICATION & INTERVIEW TRACKER MODULE
  // -------------------------------------------------------------

  app.get('/api/v1/applications', (req, res) => {
    const { studentId, jobId, school, program, batch, status } = req.query;
    let apps = dbStore.getAllApplications();

    if (studentId) apps = apps.filter(a => a.studentId === studentId);
    if (jobId) apps = apps.filter(a => a.jobId === jobId);
    if (school) apps = apps.filter(a => a.school === school);
    if (program) apps = apps.filter(a => a.program === program);
    if (batch) apps = apps.filter(a => a.batch === batch);
    if (status) apps = apps.filter(a => a.status === status);

    return res.json({ applications: apps });
  });

  app.post('/api/v1/applications', (req, res) => {
    const actor = getActorFromRequest(req);
    const { jobId, studentId } = req.body;

    const targetStudentId = studentId || actor.id;

    try {
      const { application, isNew } = dbStore.createApplication(jobId, targetStudentId, actor);
      const statusCode = isNew ? 201 : 200;
      return res.status(statusCode).json({
        application,
        applicationUrl: application.applicationUrl,
        isNew,
        message: isNew
          ? 'Application tracking started. Please complete the external application.'
          : 'Existing application record returned.'
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Student confirms they completed the external application.
   * Sets status = APPLIED.
   */
  app.post('/api/v1/applications/:id/confirm', (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      const application = dbStore.confirmApplication(req.params.id, actor);
      return res.json({ application, message: 'Application confirmed as submitted. Status set to Applied.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Student reports they did NOT complete the external application.
   * Sets status = NOT_APPLIED with reason and optional help flag.
   */
  app.post('/api/v1/applications/:id/decline', (req, res) => {
    const actor = getActorFromRequest(req);
    const { declineReason, studentComment, needsHelp } = req.body;
    if (!declineReason) {
      return res.status(400).json({ error: 'declineReason is required.' });
    }
    try {
      const application = dbStore.declineApplication(
        req.params.id,
        declineReason,
        studentComment || '',
        Boolean(needsHelp),
        actor
      );
      return res.json({ application, message: 'Application status set to Not Applied.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Placement Officer updates help status for a student application.
   * Does NOT change the application status.
   */
  app.patch('/api/v1/applications/:id/help-status', (req, res) => {
    const actor = getActorFromRequest(req);
    const { helpStatus } = req.body;
    if (!helpStatus) {
      return res.status(400).json({ error: 'helpStatus is required.' });
    }
    try {
      const application = dbStore.updateHelpStatus(req.params.id, helpStatus, actor);
      return res.json({ application, message: `Help status updated to ${helpStatus}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/v1/applications/:id/status', (req, res) => {
    const actor = getActorFromRequest(req);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    try {
      const application = dbStore.updateApplicationStatus(req.params.id, status as ApplicationStatus, actor);
      return res.json({ application, message: `Application status updated to ${status}.` });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/v1/applications/:id', (req, res) => {
    const actor = getActorFromRequest(req);
    try {
      dbStore.withdrawApplication(req.params.id, actor);
      return res.json({ success: true, message: 'Application successfully withdrawn.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/v1/applications/:id/interviews', (req, res) => {
    const actor = getActorFromRequest(req);
    const { roundTitle, date } = req.body;

    if (!roundTitle || !date) {
      return res.status(400).json({ error: 'roundTitle and date are required.' });
    }

    try {
      const application = dbStore.recordInterviewSchedule(req.params.id, roundTitle, date, actor);
      return res.status(201).json({ application, message: 'Interview scheduled successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 8. MANDATORY REJECTION FEEDBACK LOOP
  // -------------------------------------------------------------

  app.get('/api/v1/feedback/rejection', (req, res) => {
    res.json({ feedbackRecords: dbStore.getAllRejectionFeedback() });
  });

  app.post('/api/v1/feedback/rejection', (req, res) => {
    const actor = getActorFromRequest(req);
    const { applicationId, category, details, remedialActionNeeded } = req.body;

    if (!applicationId || !category || !details) {
      return res.status(400).json({ error: 'applicationId, category, and details are required.' });
    }

    try {
      const record = dbStore.submitRejectionFeedback(
        applicationId, 
        category as RejectionCategory, 
        details, 
        remedialActionNeeded || '', 
        actor
      );
      return res.status(201).json({ feedback: record, message: 'Mandatory rejection feedback recorded.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 9. MANAGEMENT KPI & ANALYTICS MODULE
  // -------------------------------------------------------------

  app.get('/api/v1/analytics/overview', (req, res) => {
    const kpis = AnalyticsService.getManagementKPIs();
    res.json(kpis);
  });

  app.delete('/api/v1/jobs/demo', (req, res) => {
    dbStore.removeAllDemoJobs();
    res.json({ message: 'All demo and dummy jobs have been removed.', remainingJobs: dbStore.getAllJobs().length });
  });

  app.post('/api/v1/system/reset', async (req, res) => {
    dbStore.resetToSeed();
    dbStore.removeAllDemoJobs();
    try {
      await ApifyScraperService.fetchAndIngestJobs(
        { id: 'user-root-admin', name: 'System Administrator', role: 'MAIN_ADMIN' },
        { limit: 50 }
      );
    } catch (err: any) {
      console.warn('Apify fetch warning on reset:', err.message);
    }
    res.json({ message: 'System state reset to clean Apify jobs state.', totalJobs: dbStore.getAllJobs().length });
  });

  // -------------------------------------------------------------
  // AUTOMATED DAILY 2:00 AM SYNCHRONIZATION SCHEDULER
  // -------------------------------------------------------------
  const scheduleDailySyncAt2AM = () => {
    const runScheduledSync = async () => {
      const adminActor = { id: 'user-root-admin', name: 'System Automated Scheduler', role: 'MAIN_ADMIN' as const };
      console.log(`[Scheduled Sync 2:00 AM] Triggering automated daily synchronization at ${new Date().toISOString()}...`);

      // 1. Academic LMS Synchronization
      try {
        const lmsRes = LmsSyncService.syncFromLms(adminActor);
        console.log(`[Scheduled Sync 2:00 AM] LMS synced: ${lmsRes.syncedCount} student records updated.`);
      } catch (err: any) {
        console.error(`[Scheduled Sync 2:00 AM] LMS sync error:`, err.message);
      }

      // 2. Apify LinkedIn Job Scraper Ingestion
      try {
        const apifyRes = await ApifyScraperService.fetchAndIngestJobs(adminActor, { limit: 50 });
        console.log(`[Scheduled Sync 2:00 AM] Apify fetch completed: +${apifyRes.newIngested} new technology jobs.`);
      } catch (err: any) {
        console.warn(`[Scheduled Sync 2:00 AM] Apify fetch warning:`, err.message);
      }

      // 3. Public ATS Job APIs Ingestion (Greenhouse / Lever / Ashby)
      try {
        const atsRes = await AtsJobApiService.fetchAndIngestJobs(adminActor, { limit: 50 });
        console.log(`[Scheduled Sync 2:00 AM] Public ATS fetch completed: +${atsRes.newIngested} new technology jobs.`);
      } catch (err: any) {
        console.warn(`[Scheduled Sync 2:00 AM] Public ATS fetch warning:`, err.message);
      }
    };

    const getMsUntil2AM = (): { delayMs: number; nextDate: Date } => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(2, 0, 0, 0);
      if (now.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      return { delayMs: target.getTime() - now.getTime(), nextDate: target };
    };

    const scheduleNext = () => {
      const { delayMs, nextDate } = getMsUntil2AM();
      console.log(`[Scheduler] Automated daily sync scheduled for 2:00 AM (${nextDate.toLocaleString()}). Delay: ${(delayMs / 1000 / 60).toFixed(1)} minutes.`);
      setTimeout(async () => {
        try {
          await runScheduledSync();
        } catch (e: any) {
          console.error(`[Scheduler Execution Error]`, e);
        }
        scheduleNext();
      }, delayMs);
    };

    scheduleNext();
  };

  // Schedule automated sync every day at 2:00 AM
  scheduleDailySyncAt2AM();

  // Integration schedule status endpoint
  app.get('/api/v1/admin/integrations/schedule', (req, res) => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(2, 0, 0, 0);
    if (now.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    res.json({
      status: 'ACTIVE',
      schedule: 'Daily at 2:00 AM',
      nextScheduledRun: target.toISOString(),
      services: [
        'Academic LMS Synchronization',
        'Apify LinkedIn Job Scraper',
        'Public ATS APIs (Greenhouse, Lever, Ashby)'
      ]
    });
  });

  // Auto-ingest Apify jobs on boot if Apify scraper is configured
  ApifyScraperService.fetchAndIngestJobs(
    { id: 'user-root-admin', name: 'System Administrator', role: 'MAIN_ADMIN' },
    { limit: 50 }
  ).then(res => {
    console.log(`Boot: Ingested ${res.newIngested} real IT/Tech jobs from Apify API.`);
  }).catch(err => {
    console.warn('Boot Apify fetch warning:', err.message);
  });

  // Auto-ingest Public ATS jobs on boot (Greenhouse / Lever / Ashby)
  AtsJobApiService.fetchAndIngestJobs(
    { id: 'user-root-admin', name: 'System Administrator', role: 'MAIN_ADMIN' },
    { limit: 50 }
  ).then(res => {
    console.log(`Boot: Ingested ${res.newIngested} real IT/Tech jobs from Public ATS API.`);
  }).catch(err => {
    console.warn('Boot ATS fetch warning:', err.message);
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE SETUP
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HACA Placement Platform Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
