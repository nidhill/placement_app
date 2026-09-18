// ─── Placement tool API ──────────────────────────────────────────────────────
// Mounted at /api/placement. The placement frontend (placement/) talks only
// to this server; these are the tool's original routes (its server.ts)
// ported onto placement/store.js (MongoDB) with real authentication:
// SHO App staff tokens and LMS student tokens (placement/auth.js).
const express = require('express');
const router = express.Router();
const { dbStore } = require('../placement/store');
const { placementAuth, requireRole } = require('../placement/auth');
const { syncEligibleStudents } = require('../placement/sync');
const { RuleBasedMatchingEngine } = require('../placement/services/matchingEngine');
const { DesignationNormalizer } = require('../placement/services/designationNormalizer');
const { TechJobClassifier } = require('../placement/services/techClassifier');
const { AnalyticsService } = require('../placement/services/analyticsService');
const { ApifyScraperService } = require('../placement/services/scraperService');
const { AtsJobApiService } = require('../placement/services/atsJobApiService');
const { IndiaLocationFilter } = require('../placement/services/indiaLocationFilter');

const STAFF = ['MAIN_ADMIN', 'PLACEMENT_OFFICER', 'MANAGEMENT'];   // may view
const OPS = ['MAIN_ADMIN', 'PLACEMENT_OFFICER'];                    // day-to-day placement work
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch(err => {
  const status = err.status || (String(err.message).includes('PERMISSION DENIED') || String(err.message).includes('Unauthorized') ? 403 : 400);
  res.status(status).json({ error: err.message });
});

// Students may only touch their own profile; staff may touch any.
async function resolveStudentId(req, idParam) {
  if (req.actor.role === 'STUDENT') {
    if (!req.actor.studentProfileId) { const e = new Error('Your mentor has not marked you placement-eligible yet.'); e.status = 403; throw e; }
    return req.actor.studentProfileId;
  }
  if (await dbStore.getStudentById(idParam)) return idParam;
  const byEmail = await dbStore.getStudentByEmail(idParam);
  if (byEmail) return byEmail.id;
  const e = new Error('Student not found.'); e.status = 404; throw e;
}

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'HACA Placement (SHO server)', version: '2.0' }));

router.use(placementAuth);

// ── 1. Session ───────────────────────────────────────────────────────────────
// Who am I, in placement terms. Students get 403 until a mentor approved them.
router.get('/me', wrap(async (req, res) => {
  const a = req.actor;
  const user = { id: a.id, email: a.email, fullName: a.name, role: a.role, department: 'HACA', isActive: true, createdAt: new Date(0).toISOString() };
  if (a.role === 'STUDENT') {
    const p = a.studentProfile;
    const ok = p && (p.eligibilityStatus === 'ELIGIBLE' || p.eligibilityStatus === 'ADMIN_OVERRIDE');
    if (!ok) return res.status(403).json({ error: 'Your mentor has not marked you placement-eligible yet. Please check with your mentor.' });
    return res.json({ user: { ...user, id: p.id }, studentProfile: p });
  }
  res.json({ user, studentProfile: undefined });
}));

router.get('/auth/users', requireRole('MAIN_ADMIN'), wrap(async (req, res) => res.json({ users: await dbStore.getAllUsers() })));

// ── 2. Admin governance ──────────────────────────────────────────────────────
router.post('/admin/users/provision', requireRole('MAIN_ADMIN'), wrap(async (req, res) => {
  const { email, fullName, role, department } = req.body;
  if (!email || !fullName || !role) return res.status(400).json({ error: 'Email, fullName, and role are required.' });
  const newUser = await dbStore.provisionUser({ email, fullName, role, department: department || 'HACA Staff', isActive: true }, req.actor);
  // Let them set a password through the SHO App's reset flow.
  try {
    const { sendPasswordResetEmail } = require('../services/email');
    const User = require('../models/User');
    const u = await User.findById(newUser.id);
    const token = u.getResetPasswordToken();          // hashed on the doc, raw in the email
    u.resetPasswordExpire = Date.now() + 24 * 3600 * 1000;   // a day, not 10 min — it's an invite
    await u.save();
    await sendPasswordResetEmail(u.email, u.name, token);
  } catch (e) { console.warn('[placement] provision: reset email not sent —', e.message); }
  res.status(201).json({ user: newUser, message: 'User provisioned. A set-password email has been sent.' });
}));

router.post('/admin/users/:id/revoke', requireRole('MAIN_ADMIN'), wrap(async (req, res) => {
  const user = await dbStore.revokeUser(req.params.id, req.actor);
  res.json({ user, message: 'User revoked successfully.' });
}));
router.post('/admin/users/:id/restore', requireRole('MAIN_ADMIN'), wrap(async (req, res) => {
  const user = await dbStore.restoreUser(req.params.id, req.actor);
  res.json({ user, message: 'User restored.' });
}));
router.patch('/admin/users/:id/role', requireRole('MAIN_ADMIN'), wrap(async (req, res) => {
  const user = await dbStore.changeUserRole(req.params.id, req.body?.role, req.actor);
  res.json({ user, message: 'Role updated.' });
}));
router.delete('/admin/users/:id', requireRole('MAIN_ADMIN'), wrap(async (req, res) => {
  const user = await dbStore.deleteUser(req.params.id, req.actor);
  res.json({ user, message: 'User deleted.' });
}));

router.post('/admin/override-eligibility', requireRole('MAIN_ADMIN'), wrap(async (req, res) => {
  const { studentId, newStatus, reason } = req.body;
  if (!studentId || !newStatus || !reason) return res.status(400).json({ error: 'studentId, newStatus, and reason are required.' });
  const student = await dbStore.adminEmergencyOverride(studentId, newStatus, reason, req.actor);
  res.json({ student, message: 'Emergency eligibility override applied and logged.' });
}));

router.get('/admin/audit-logs', requireRole(...STAFF), wrap(async (req, res) => res.json({ auditLogs: await dbStore.getAuditLogs() })));

// ── 3. Integrations: student sync (in-process), Apify, ATS ──────────────────
router.get('/admin/integrations/lms', requireRole(...STAFF), wrap(async (req, res) => res.json(await dbStore.getLmsConfig())));
router.patch('/admin/integrations/lms', requireRole('MAIN_ADMIN'), wrap(async (req, res) => res.json(await dbStore.updateLmsConfig(req.body, req.actor))));
router.post('/admin/integrations/lms/sync', requireRole(...OPS), wrap(async (req, res) => res.json(await syncEligibleStudents(req.actor))));

router.get('/admin/integrations/apify', requireRole(...STAFF), wrap(async (req, res) => res.json(await dbStore.getApifyConfig())));
router.patch('/admin/integrations/apify', requireRole('MAIN_ADMIN'), wrap(async (req, res) => res.json(await dbStore.updateApifyConfig(req.body, req.actor))));
router.get('/admin/integrations/apify/status', requireRole(...STAFF), wrap(async (req, res) => res.json(await ApifyScraperService.testConnection())));
router.post('/admin/integrations/apify/test', requireRole(...OPS), wrap(async (req, res) => {
  const status = await ApifyScraperService.testConnection();
  res.json({ success: status.connected, status, message: status.connected ? `Successfully connected to Apify (Account: ${status.username}). Actor: ${status.actorTitle || 'Configured'}.` : (status.error || 'Failed to connect to Apify') });
}));
const apifyFetch = wrap(async (req, res) => {
  try {
    const result = await ApifyScraperService.fetchAndIngestJobs(req.actor, req.body || {});
    res.json({ ...result, ingestedCount: result.newIngested, skippedDuplicatesCount: result.duplicatesCount, jobsScraped: result.totalReceived, newJobsIngested: result.newIngested, duplicatesSkipped: result.duplicatesCount });
  } catch (err) {
    res.status(500).json({ error: err.message || 'The Apify job scraper could not be reached.', fallbackNotice: 'Existing jobs remain available.' });
  }
});
router.post('/admin/integrations/apify/fetch', requireRole(...OPS), apifyFetch);
router.post('/admin/integrations/apify/run', requireRole(...OPS), apifyFetch);

router.get('/admin/integrations/ats', requireRole(...STAFF), wrap(async (req, res) => res.json(await dbStore.getAtsConfig())));
router.patch('/admin/integrations/ats', requireRole('MAIN_ADMIN'), wrap(async (req, res) => res.json(await dbStore.updateAtsConfig(req.body, req.actor))));
router.get('/admin/integrations/ats/status', requireRole(...STAFF), wrap(async (req, res) => res.json(await AtsJobApiService.testConnection())));
router.post('/admin/integrations/ats/test', requireRole(...OPS), wrap(async (req, res) => {
  const status = await AtsJobApiService.testConnection();
  res.json({ success: status.connected, status, message: status.connected ? `Successfully connected to Public ATS APIs. Active endpoints: ${status.activeConnectors.join(', ')}.` : (status.error || 'Failed to connect to public ATS APIs') });
}));
const atsFetch = wrap(async (req, res) => {
  try {
    const result = await AtsJobApiService.fetchAndIngestJobs(req.actor, req.body || {});
    res.json({ ...result, ingestedCount: result.newIngested, skippedDuplicatesCount: result.duplicatesCount, jobsScraped: result.totalReceived, newJobsIngested: result.newIngested, duplicatesSkipped: result.duplicatesCount });
  } catch (err) {
    res.status(500).json({ error: err.message || 'The ATS public job API could not be reached.', fallbackNotice: 'Existing jobs remain available.' });
  }
});
router.post('/admin/integrations/ats/fetch', requireRole(...OPS), atsFetch);

// The UI shows when the automated run happens instead of manual buttons.
router.get('/admin/integrations/schedule', requireRole(...STAFF), (req, res) => {
  const { nextRun } = require('../placement/scheduler');
  res.json({ status: 'ACTIVE', schedule: 'Daily at 2:00 AM IST', nextScheduledRun: nextRun().toISOString(), services: ['SHO student sync', 'Apify LinkedIn Job Scraper', 'Public ATS APIs (Greenhouse, Lever, Ashby)'] });
});
router.post('/admin/integrations/ats/sync', requireRole(...OPS), atsFetch);

// ── 4. Roster + admin eligibility toggle ────────────────────────────────────
// (The gate is the SHO App's Placement Eligibility page, where mentors decide;
// the tool keeps an admin-only toggle and the emergency override.)
router.get('/mentor/students', requireRole(...STAFF), wrap(async (req, res) => {
  const mentorId = req.query.mentorId;
  res.json({ students: mentorId ? await dbStore.getStudentsByMentor(String(mentorId)) : await dbStore.getAllStudents() });
}));
const toggle = wrap(async (req, res) => {
  const { isEligible, evaluationNotes } = req.body;
  if (typeof isEligible !== 'boolean') return res.status(400).json({ error: 'isEligible boolean is required.' });
  const student = await dbStore.toggleMentorEligibility(req.params.id, isEligible, evaluationNotes || (isEligible ? 'Approved for placement' : 'Marked not eligible'), req.actor);
  res.json({ student, message: `Student status updated to ${student.eligibilityStatus}.` });
});
router.patch('/mentor/students/:id/eligibility', requireRole(...OPS), toggle);
router.patch('/admin/students/:id/eligibility', requireRole('MAIN_ADMIN'), toggle);

// ── 5. Student portal ────────────────────────────────────────────────────────
router.get('/students/:id', wrap(async (req, res) => {
  const id = await resolveStudentId(req, req.params.id);
  const student = await dbStore.getStudentById(id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  res.json({ student });
}));

router.patch('/students/:id', wrap(async (req, res) => {
  const id = await resolveStudentId(req, req.params.id);
  res.json({ student: await dbStore.updateStudentProfile(id, req.body, req.actor) });
}));

router.post('/students/:id/resume', wrap(async (req, res) => {
  const id = await resolveStudentId(req, req.params.id);
  const { fileName, fileSize, fileType, dataUrl } = req.body;
  if (!fileName || !dataUrl) return res.status(400).json({ error: 'File name and file content data are required.' });
  if (String(dataUrl).length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Resume is too large (max ~6 MB).' });
  const now = new Date().toISOString();
  const student = await dbStore.updateStudentProfile(id, { resumeFileName: fileName, resumeFileSize: fileSize || 0, resumeFileType: fileType || 'application/pdf', resumeFileUploadedAt: now, resumeDataUrl: dataUrl, resumeUrl: dataUrl }, req.actor);
  res.json({ student, message: `Resume document "${fileName}" successfully uploaded and attached to placement profile.` });
}));

router.delete('/students/:id/resume', wrap(async (req, res) => {
  const id = await resolveStudentId(req, req.params.id);
  const student = await dbStore.updateStudentProfile(id, { resumeFileName: undefined, resumeFileSize: undefined, resumeFileType: undefined, resumeFileUploadedAt: undefined, resumeDataUrl: undefined, resumeUrl: '' }, req.actor);
  res.json({ student, message: 'Resume document has been removed.' });
}));

router.get('/students/:id/recommendations', wrap(async (req, res) => {
  const id = await resolveStudentId(req, req.params.id);
  const student = await dbStore.getStudentById(id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  const isEligible = student.eligibilityStatus === 'ELIGIBLE' || student.eligibilityStatus === 'ADMIN_OVERRIDE';
  if (!isEligible) return res.status(403).json({ error: 'ACCESS GATED: You must be approved for placement before accessing recommended jobs.', eligibilityStatus: student.eligibilityStatus });
  const allJobs = await dbStore.getAllJobs();
  res.json({ recommendations: RuleBasedMatchingEngine.getRecommendedJobsForStudent(student, allJobs) });
}));

// ── 6. Jobs ─────────────────────────────────────────────────────────────────
router.get('/jobs', wrap(async (req, res) => {
  const { sourceChannel, school, search, category, designation, includeAll } = req.query;
  let jobs = await dbStore.getAllJobs();
  jobs = jobs.filter(j => j.countryCode === 'IN' || IndiaLocationFilter.evaluateLocation({ location: j.location, countryCode: j.countryCode }).isIndia);
  if (includeAll !== 'true') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    jobs = jobs.filter(j => {
      if (j.status !== 'ACTIVE') return false;
      if (j.sourceChannel === 'AI_JOB_SCRAPER' || j.sourceChannel === 'ATS_JOB_API') {
        const d = new Date(j.postedDate || j.discoveredAt || j.createdAt);
        return !Number.isNaN(d.getTime()) && d >= thirtyDaysAgo;
      }
      return true;
    });
  }
  if (sourceChannel) jobs = jobs.filter(j => j.sourceChannel === sourceChannel);
  if (school) jobs = jobs.filter(j => (j.eligibleSchools || []).includes(String(school)));
  if (category && category !== 'ALL') jobs = jobs.filter(j => j.category === category || j.dominantCategory === category);
  if (designation && designation !== 'ALL') jobs = jobs.filter(j => (j.normalizedDesignation || '').toLowerCase().includes(String(designation).toLowerCase()));
  if (search) {
    const q = String(search).toLowerCase().trim();
    jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.location && j.location.toLowerCase().includes(q)) || (j.category && j.category.toLowerCase().includes(q)) || (j.normalizedDesignation && j.normalizedDesignation.toLowerCase().includes(q)) || (j.requiredSkills || []).some(s => s.toLowerCase().includes(q)));
  }
  jobs.sort((a, b) => new Date(b.postedDate || b.discoveredAt || b.createdAt).getTime() - new Date(a.postedDate || a.discoveredAt || a.createdAt).getTime());
  res.json({ jobs, totalCount: jobs.length });
}));

router.post('/jobs', requireRole(...OPS), wrap(async (req, res) => {
  const b = req.body;
  if (!b.title || !b.company || !b.sourceChannel || !b.requiredSkills) return res.status(400).json({ error: 'Title, company, sourceChannel, and requiredSkills are mandatory.' });
  const locCheck = IndiaLocationFilter.evaluateLocation({ location: b.location || '' });
  if (!locCheck.isIndia) return res.status(400).json({ error: `Job creation rejected: Location "${b.location || 'Empty'}" is outside India. The HACA Placement Platform strictly requires all jobs to be located in India.` });
  const requiredSkills = Array.isArray(b.requiredSkills) ? b.requiredSkills : [b.requiredSkills];
  const applicationUrl = String(b.applicationUrl || b.externalUrl || '').trim();
  if (!/^https?:\/\/\S+$/i.test(applicationUrl)) return res.status(400).json({ error: 'An application link (https://…) is required so students know where to apply.' });
  const classification = TechJobClassifier.classify({ title: b.title, description: b.description, skills: requiredSkills });
  const job = await dbStore.createJob({
    title: b.title, company: b.company, location: locCheck.normalizedLocation, countryCode: 'IN',
    employmentType: b.employmentType || 'FULL_TIME', experienceRequirement: b.experienceRequirement || '0-1 years',
    minExperienceYears: Number(b.minExperienceYears) || 0, salaryRange: b.salaryRange || 'Market Competitive', description: b.description || '',
    requiredSkills, preferredSkills: Array.isArray(b.preferredSkills) ? b.preferredSkills : [],
    educationRequirements: b.educationRequirements || ['HACA Certificate'], eligibleSchools: b.eligibleSchools || [], eligiblePrograms: b.eligiblePrograms || [],
    category: b.category || (classification.isTechJob ? classification.category : 'Software Development'),
    normalizedDesignation: b.normalizedDesignation || DesignationNormalizer.normalize(b.title),
    sourceChannel: b.sourceChannel, referralSourceName: b.referralSourceName, externalUrl: applicationUrl, applicationUrl,
    deadline: b.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'ACTIVE', discoveredAt: new Date().toISOString(),
  }, req.actor);
  res.status(201).json({ job, message: 'Job created and tagged successfully.' });
}));

router.delete('/jobs/demo', requireRole(...OPS), wrap(async (req, res) => {
  await dbStore.removeAllDemoJobs();
  res.json({ message: 'All demo and dummy jobs have been removed.', remainingJobs: (await dbStore.getAllJobs()).length });
}));

router.delete('/jobs/:id', requireRole(...OPS), wrap(async (req, res) => {
  await dbStore.deleteJob(req.params.id, req.actor);
  res.json({ success: true, message: 'Job post successfully deleted.' });
}));

router.get('/jobs/:id/candidates', requireRole(...STAFF), wrap(async (req, res) => {
  const job = await dbStore.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  res.json({ job, candidates: RuleBasedMatchingEngine.rankCandidatesForJob(job, await dbStore.getAllStudents()) });
}));

// ── 7. Applications & interviews ─────────────────────────────────────────────
router.get('/applications', wrap(async (req, res) => {
  const { studentId, jobId, school, program, batch, status } = req.query;
  let apps = await dbStore.getAllApplications();
  // Students only ever see their own.
  if (req.actor.role === 'STUDENT') apps = apps.filter(a => a.studentId === req.actor.studentProfileId);
  else if (studentId) apps = apps.filter(a => a.studentId === studentId);
  if (jobId) apps = apps.filter(a => a.jobId === jobId);
  if (school) apps = apps.filter(a => a.school === school);
  if (program) apps = apps.filter(a => a.program === program);
  if (batch) apps = apps.filter(a => a.batch === batch);
  if (status) apps = apps.filter(a => a.status === status);
  res.json({ applications: apps });
}));

router.post('/applications', wrap(async (req, res) => {
  const { jobId, studentId } = req.body;
  const targetStudentId = req.actor.role === 'STUDENT' ? req.actor.studentProfileId : (studentId || null);
  if (!targetStudentId) return res.status(400).json({ error: 'studentId is required.' });
  const { application, isNew } = await dbStore.createApplication(jobId, targetStudentId, req.actor);
  res.status(isNew ? 201 : 200).json({ application, applicationUrl: application.applicationUrl, isNew, message: isNew ? 'Application tracking started. Please complete the external application.' : 'Existing application record returned.' });
}));

const ownOrStaff = async (req, id) => {
  if (req.actor.role !== 'STUDENT') return;
  const a = await dbStore.getApplicationById(id);
  if (!a || a.studentId !== req.actor.studentProfileId) { const e = new Error('Not your application.'); e.status = 403; throw e; }
};

router.post('/applications/:id/confirm', wrap(async (req, res) => {
  await ownOrStaff(req, req.params.id);
  res.json({ application: await dbStore.confirmApplication(req.params.id, req.actor), message: 'Application confirmed as submitted. Status set to Applied.' });
}));

router.post('/applications/:id/decline', wrap(async (req, res) => {
  await ownOrStaff(req, req.params.id);
  const { declineReason, studentComment, needsHelp } = req.body;
  if (!declineReason) return res.status(400).json({ error: 'declineReason is required.' });
  res.json({ application: await dbStore.declineApplication(req.params.id, declineReason, studentComment || '', Boolean(needsHelp), req.actor), message: 'Application status set to Not Applied.' });
}));

router.patch('/applications/:id/help-status', requireRole(...OPS), wrap(async (req, res) => {
  const { helpStatus } = req.body;
  if (!helpStatus) return res.status(400).json({ error: 'helpStatus is required.' });
  res.json({ application: await dbStore.updateHelpStatus(req.params.id, helpStatus, req.actor), message: `Help status updated to ${helpStatus}.` });
}));

router.patch('/applications/:id/status', requireRole(...OPS), wrap(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  res.json({ application: await dbStore.updateApplicationStatus(req.params.id, status, req.actor), message: `Application status updated to ${status}.` });
}));

router.delete('/applications/:id', wrap(async (req, res) => {
  await ownOrStaff(req, req.params.id);
  await dbStore.withdrawApplication(req.params.id, req.actor);
  res.json({ success: true, message: 'Application successfully withdrawn.' });
}));

router.post('/applications/:id/interviews', requireRole(...OPS), wrap(async (req, res) => {
  const { roundTitle, date } = req.body;
  if (!roundTitle || !date) return res.status(400).json({ error: 'roundTitle and date are required.' });
  res.status(201).json({ application: await dbStore.recordInterviewSchedule(req.params.id, roundTitle, date, req.actor), message: 'Interview scheduled successfully.' });
}));

// ── 8. Rejection feedback ────────────────────────────────────────────────────
router.get('/feedback/rejection', requireRole(...STAFF), wrap(async (req, res) => res.json({ feedbackRecords: await dbStore.getAllRejectionFeedback() })));
router.post('/feedback/rejection', requireRole(...OPS), wrap(async (req, res) => {
  const { applicationId, category, details, remedialActionNeeded } = req.body;
  if (!applicationId || !category || !details) return res.status(400).json({ error: 'applicationId, category, and details are required.' });
  res.status(201).json({ feedback: await dbStore.submitRejectionFeedback(applicationId, category, details, remedialActionNeeded || '', req.actor), message: 'Mandatory rejection feedback recorded.' });
}));

// ── 9. Analytics ─────────────────────────────────────────────────────────────
router.get('/analytics/overview', requireRole(...STAFF), wrap(async (req, res) => res.json(await AnalyticsService.getManagementKPIs())));

module.exports = router;
