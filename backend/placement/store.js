// Placement data store on MongoDB — the same method surface as the placement
// tool's original in-memory DatabaseStore (server/db/store.ts), made async.
// Every rule that lived there (India-only jobs, eligibility gate, idempotent
// applications, rejection-feedback loop, audit on every mutation) lives here
// unchanged; only the persistence moved.
//
// Users are SHO App users (models/User) — no separate placement accounts.
// Students are SHO students marked placement-eligible, mirrored into
// placement_students by placement/sync.js.
const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { PlacementStudent, PlacementJob, PlacementApplication, PlacementRejectionFeedback, PlacementSettings } = require('./models');
const { TechJobClassifier } = require('./services/techClassifier');
const { DesignationNormalizer } = require('./services/designationNormalizer');
const { IndiaLocationFilter } = require('./services/indiaLocationFilter');

// SHO role → placement role.
//   admin           → MAIN_ADMIN        governance: users, overrides, settings
//   placement_team  → PLACEMENT_OFFICER day-to-day: jobs, applications, interviews, feedback, syncs
//   leadership/ceo  → MANAGEMENT        read-only dashboards & analytics
//   student         → STUDENT           own portal, once a mentor approved them
// Mentors are not placement users: they decide eligibility in the SHO App.
const ROLE_MAP = {
  admin: 'MAIN_ADMIN',
  placement_team: 'PLACEMENT_OFFICER',
  leadership: 'MANAGEMENT',
  ceo_haca: 'MANAGEMENT',
  student: 'STUDENT',
};
const REVERSE_ROLE_MAP = { MAIN_ADMIN: 'admin', PLACEMENT_OFFICER: 'placement_team', MANAGEMENT: 'leadership', STUDENT: 'student' };

const DEFAULT_APIFY = {
  actorId: process.env.APIFY_ACTOR_ID || '',
  apiKey: '',
  targetBoards: ['LinkedIn Jobs India', 'Naukri', 'Indeed India', 'Instahyre'],
  scheduleCron: '0 4 * * *',
  isEnabled: true,
  lastRunTimestamp: null,
  leadsProcessedTotal: 0,
};
const DEFAULT_LMS = { endpoint: 'in-process (SHO App)', apiKey: '', autoSyncIntervalMinutes: 60, lastSyncTimestamp: null, totalRecordsSynced: 0, status: 'CONNECTED' };
const DEFAULT_ATS = {
  isEnabled: true,
  greenhouseBoards: ['postman', 'inmobi', 'groww', 'cloudflare', 'stripe', 'figma', 'github', 'reddit'],
  leverCompanies: ['meesho', 'cred', 'netflix', 'spotify', 'palantir'],
  ashbyCompanies: ['linear', 'ramp', 'notion', 'retool'],
  lastRunTimestamp: null,
  leadsProcessedTotal: 0,
};

const strip = (doc) => {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o._id; delete o.__v;
  return o;
};
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

function toPlacementUser(u) {
  return {
    id: String(u._id),
    email: u.email,
    fullName: u.name,
    role: ROLE_MAP[u.role] || 'MANAGEMENT',
    department: u.school || u.department || 'HACA',
    isActive: u.isActive !== false,
    createdAt: u.createdAt,
  };
}

class PlacementStore {
  // ==========================================
  // 1. USERS (SHO App accounts)
  // ==========================================
  async getAllUsers() {
    const users = await User.find({ role: { $in: Object.keys(ROLE_MAP).filter(r => r !== 'student') } })
      .select('name email role school isActive createdAt').lean();
    return users.map(toPlacementUser);
  }
  async getUserById(id) {
    if (!mongoose.isValidObjectId(id)) return undefined;
    const u = await User.findById(id).select('name email role school isActive createdAt').lean();
    return u && ROLE_MAP[u.role] ? toPlacementUser(u) : undefined;
  }
  async getUserByEmail(email) {
    const u = await User.findOne({ email: String(email).trim().toLowerCase() }).select('name email role school isActive createdAt').lean();
    return u && ROLE_MAP[u.role] ? toPlacementUser(u) : undefined;
  }
  async getMainAdminCount() {
    return User.countDocuments({ role: 'admin', isActive: true });
  }

  // Creates a SHO App account. A random password is set; the person gets
  // in through "Forgot password" (the caller emails the reset link).
  async provisionUser(userData, actor) {
    const email = String(userData.email).trim().toLowerCase();
    if (await User.findOne({ email })) throw new Error(`User with email "${userData.email}" already exists.`);
    if (userData.role === 'MAIN_ADMIN') throw new Error('Admins are created in the SHO App, not here.');
    const shoRole = REVERSE_ROLE_MAP[userData.role] || 'placement_team';
    const bcrypt = require('bcryptjs');
    const password = await bcrypt.hash(require('crypto').randomBytes(18).toString('hex'), 10);
    const u = await User.create({ name: userData.fullName, email, role: shoRole, password, isActive: true, school: userData.department || 'HACA' });
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'USER_PROVISIONED', entityType: 'USER', entityId: String(u._id),
      details: `Provisioned user "${u.name}" (${u.email}) with role ${userData.role} (SHO role ${shoRole}).`,
    });
    return toPlacementUser(u);
  }

  // Only accounts that exist for the placement tool (SHO role placement_team)
  // may be revoked, restored, deleted or re-roled here. Leadership / CEO /
  // admin rows are SHO App staff accounts — touching them would change their
  // SHO App login, so those are managed in SHO App → Users.
  async _placementOwnedUser(id, actor, verb) {
    if (!mongoose.isValidObjectId(id)) throw new Error('User not found');
    const u = await User.findById(id);
    if (!u || !ROLE_MAP[u.role]) throw new Error('User not found');
    if (String(u._id) === String(actor.id)) throw new Error(`You cannot ${verb} your own account.`);
    if (u.role !== 'placement_team') {
      const label = u.role === 'admin' ? 'an Admin' : u.role === 'ceo_haca' ? 'the CEO' : 'a Leadership';
      throw new Error(`This is ${label} account from the SHO App. To ${verb} it, use SHO App → Users.`);
    }
    return u;
  }

  async revokeUser(id, actor) {
    const u = await this._placementOwnedUser(id, actor, 'revoke');
    u.isActive = false;
    u.activeSessions = [];
    await u.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'USER_REVOKED', entityType: 'USER', entityId: String(u._id),
      details: `Revoked access for user "${u.name}" (${u.email}).`,
    });
    return toPlacementUser(u);
  }

  async restoreUser(id, actor) {
    const u = await this._placementOwnedUser(id, actor, 'restore');
    u.isActive = true;
    await u.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'USER_RESTORED', entityType: 'USER', entityId: String(u._id),
      details: `Restored access for user "${u.name}" (${u.email}).`,
    });
    return toPlacementUser(u);
  }

  // Placement Team ⇄ Management. The target maps to a SHO role, so a
  // Management user becomes SHO "leadership" — the admin confirms that in the UI.
  async changeUserRole(id, role, actor) {
    if (!['PLACEMENT_OFFICER', 'MANAGEMENT'].includes(role)) throw new Error('Role must be PLACEMENT_OFFICER or MANAGEMENT.');
    if (!mongoose.isValidObjectId(id)) throw new Error('User not found');
    const u = await User.findById(id);
    if (!u || !ROLE_MAP[u.role]) throw new Error('User not found');
    if (String(u._id) === String(actor.id)) throw new Error('You cannot change your own role.');
    if (u.role === 'admin' || u.role === 'ceo_haca') throw new Error(`This ${u.role === 'admin' ? 'Admin' : 'CEO'} account's role is managed in SHO App → Users.`);
    const from = ROLE_MAP[u.role];
    const shoRole = REVERSE_ROLE_MAP[role];
    if (u.role === shoRole) return toPlacementUser(u);
    u.role = shoRole;
    u.activeSessions = [];   // forces a fresh login so the new role takes effect everywhere
    await u.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'USER_ROLE_CHANGED', entityType: 'USER', entityId: String(u._id),
      details: `Changed role of "${u.name}" (${u.email}) from ${from} to ${role} (SHO role ${shoRole}).`,
    });
    return toPlacementUser(u);
  }

  // Hard delete, same bookkeeping as SHO App → Users → Delete (tombstone so
  // background syncs never recreate the person).
  async deleteUser(id, actor) {
    const u = await this._placementOwnedUser(id, actor, 'delete');
    const snapshot = toPlacementUser(u);
    await User.deleteOne({ _id: u._id });
    if (u.email) {
      const DeletedUserEmail = require('../models/DeletedUserEmail');
      await DeletedUserEmail.findOneAndUpdate({ email: u.email.toLowerCase() }, { deletedAt: new Date() }, { upsert: true });
    }
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'USER_DELETED', entityType: 'USER', entityId: snapshot.id,
      details: `Deleted user "${snapshot.fullName}" (${snapshot.email}, ${snapshot.role}).`,
    });
    return snapshot;
  }

  // ==========================================
  // 2. STUDENTS & ELIGIBILITY GATE
  // ==========================================
  async getAllStudents() {
    return (await PlacementStudent.find().lean()).map(strip);
  }
  async getStudentById(id) {
    const s = await PlacementStudent.findOne({ id }).lean();
    return s ? strip(s) : undefined;
  }
  async getStudentByEmail(email) {
    const s = await PlacementStudent.findOne({ email: String(email).toLowerCase() }).lean();
    return s ? strip(s) : undefined;
  }
  async getStudentsByMentor(mentorId) {
    return (await PlacementStudent.find({ mentorId }).lean()).map(strip);
  }
  async isStudentEligible(studentId) {
    const s = await PlacementStudent.findOne({ id: studentId }).select('eligibilityStatus').lean();
    return !!s && (s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE');
  }

  // The SHO App's Student.placement is the source of truth for eligibility
  // (mentors decide there, and every sync re-reads it). Any decision taken
  // inside the tool is written back so the two never disagree.
  async _mirrorEligibilityToSho(placementStudent, status, notes, actor) {
    const shoId = placementStudent.get ? placementStudent.get('shoStudentId') : placementStudent.shoStudentId;
    if (!shoId || !mongoose.isValidObjectId(String(shoId))) return;
    const Student = require('../models/Student');
    const mapped = status === 'ELIGIBLE' || status === 'ADMIN_OVERRIDE' ? 'eligible' : status === 'NOT_ELIGIBLE' ? 'not_eligible' : 'pending';
    await Student.updateOne({ _id: shoId }, { $set: {
      'placement.status': mapped, 'placement.notes': String(notes || '').slice(0, 1000),
      'placement.markedBy': mongoose.isValidObjectId(actor.id) ? actor.id : null, 'placement.markedAt': new Date(),
    } });
  }

  async toggleMentorEligibility(studentId, isEligible, notes, actor) {
    const s = await PlacementStudent.findOne({ id: studentId });
    if (!s) throw new Error('Student not found');
    const previousStatus = s.get('eligibilityStatus');
    const newStatus = isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
    s.set({ eligibilityStatus: newStatus, eligibilityUpdatedAt: new Date().toISOString(), eligibilityUpdatedBy: actor.name, evaluationNotes: notes });
    await s.save();
    await this._mirrorEligibilityToSho(s, newStatus, notes, actor);
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'MENTOR_ELIGIBILITY_TOGGLE', entityType: 'STUDENT', entityId: studentId,
      details: `Changed status of ${s.get('fullName')} from ${previousStatus} to ${newStatus}. Notes: ${notes}`,
    });
    return strip(s);
  }

  async adminEmergencyOverride(studentId, newStatus, reason, actor) {
    if (actor.role !== 'MAIN_ADMIN') throw new Error('Unauthorized: Only the Main Admin can execute emergency student eligibility overrides.');
    const s = await PlacementStudent.findOne({ id: studentId });
    if (!s) throw new Error('Student not found');
    const previousStatus = s.get('eligibilityStatus');
    s.set({ eligibilityStatus: newStatus, overrideReason: reason, eligibilityUpdatedAt: new Date().toISOString(), eligibilityUpdatedBy: `${actor.name} (Admin Override)` });
    await s.save();
    await this._mirrorEligibilityToSho(s, newStatus, reason, actor);
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'ADMIN_EMERGENCY_OVERRIDE', entityType: 'STUDENT', entityId: studentId,
      details: `Emergency override executed by Main Admin for ${s.get('fullName')}. Status changed from ${previousStatus} to ${newStatus}. Reason: ${reason}`,
    });
    return strip(s);
  }

  async updateStudentProfile(studentId, updateData, actor) {
    const s = await PlacementStudent.findOne({ id: studentId });
    if (!s) throw new Error('Student not found');
    const data = { ...updateData };
    if (data.eligibilityStatus && actor.role === 'STUDENT') delete data.eligibilityStatus;
    delete data.id; delete data._id;
    // Undefined values mean "remove" (resume removal sends them).
    const unset = {};
    for (const [k, v] of Object.entries(data)) { if (v === undefined) { unset[k] = 1; delete data[k]; } }
    s.set(data);
    for (const k of Object.keys(unset)) s.set(k, undefined);
    await s.save();
    return strip(s);
  }

  // Used by sync.js: create or refresh a mirrored student.
  async upsertStudent(profile) {
    const s = await PlacementStudent.findOneAndUpdate({ id: profile.id }, { $set: profile }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return strip(s);
  }
  async removeStudentsNotIn(ids) {
    const r = await PlacementStudent.deleteMany({ id: { $nin: ids }, eligibilityStatus: { $ne: 'ADMIN_OVERRIDE' } });
    return r.deletedCount;
  }
  async removeStudentsIn(ids) {
    const r = await PlacementStudent.deleteMany({ id: { $in: ids }, eligibilityStatus: { $ne: 'ADMIN_OVERRIDE' } });
    return r.deletedCount;
  }

  // ==========================================
  // 3. JOBS
  // ==========================================
  // A job with no real link is returned with no link — the UI then says so
  // instead of sending the student to a web search.
  ensureJobUrls(job) {
    const real = u => (u && !/google\.com\/search/i.test(u) ? u : undefined);
    const externalUrl = real(job.externalUrl) || real(job.applicationUrl) || real(job.sourceUrl) || real(job.url);
    return { ...job, externalUrl, applicationUrl: real(job.applicationUrl) || externalUrl };
  }
  async getAllJobs() {
    const jobs = (await PlacementJob.find().lean()).map(strip);
    return jobs
      .filter(job => job.countryCode === 'IN' || IndiaLocationFilter.evaluateLocation({ location: job.location, countryCode: job.countryCode }).isIndia)
      .map(j => this.ensureJobUrls(j))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getJobById(id) {
    const job = await PlacementJob.findOne({ id }).lean();
    if (!job) return undefined;
    const locCheck = IndiaLocationFilter.evaluateLocation({ location: job.location, countryCode: job.countryCode });
    if (!locCheck.isIndia && job.countryCode !== 'IN') return undefined;
    return this.ensureJobUrls(strip(job));
  }
  async removeAllDemoJobs() {
    const r = await PlacementJob.deleteMany({ $or: [{ sourceChannel: { $nin: ['AI_JOB_SCRAPER', 'ATS_JOB_API'] } }, { id: /^job-haca-/ }] });
    return r.deletedCount;
  }
  async createJob(jobData, actor) {
    const locCheck = IndiaLocationFilter.evaluateLocation({ location: jobData.location, countryCode: jobData.countryCode });
    if (!locCheck.isIndia) {
      throw new Error(`JOB CREATION REJECTED: Location "${jobData.location || 'Unknown'}" is outside India. The HACA Placement Platform strictly accepts only jobs located in India.`);
    }
    const id = uid('job-haca');
    const codeNumber = (await PlacementJob.countDocuments()) + 1;
    const now = new Date().toISOString();
    const externalUrl = jobData.externalUrl || jobData.applicationUrl || jobData.sourceUrl || undefined;
    const newJob = {
      ...jobData,
      location: locCheck.normalizedLocation, countryCode: 'IN',
      externalUrl, applicationUrl: jobData.applicationUrl || externalUrl,
      id, jobCode: `JOB-${new Date().getFullYear()}-${String(codeNumber).padStart(3, '0')}`,
      createdAt: now, updatedAt: now, discoveredAt: jobData.discoveredAt || now,
    };
    await PlacementJob.create(newJob);
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'JOB_CREATED', entityType: 'JOB', entityId: id,
      details: `Created job listing "${newJob.title}" at "${newJob.company}" via channel "${newJob.sourceChannel}".`,
    });
    return newJob;
  }
  async updateJob(id, updates, actor) {
    const job = await PlacementJob.findOne({ id });
    if (!job) throw new Error('Job not found');
    const data = { ...updates }; delete data.id; delete data._id;
    job.set({ ...data, updatedAt: new Date().toISOString() });
    await job.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'JOB_UPDATED', entityType: 'JOB', entityId: id, details: `Updated job "${job.get('title')}".`,
    });
    return strip(job);
  }
  async deleteJob(id, actor) {
    const job = await PlacementJob.findOne({ id }).lean();
    if (!job) throw new Error('Job not found');
    if (job.sourceChannel === 'AI_JOB_SCRAPER' || job.sourceChannel === 'ATS_JOB_API') {
      throw new Error('PERMISSION DENIED: External API-sourced jobs cannot be deleted. Only manually-created Placement Team or Staff Referral jobs can be removed.');
    }
    await PlacementJob.deleteOne({ id });
    await PlacementApplication.deleteMany({ jobId: id });
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'JOB_DELETED', entityType: 'JOB', entityId: id,
      details: `Deleted manually-created job "${job.title}" at "${job.company}" (source: ${job.sourceChannel}).`,
    });
    return true;
  }

  // ==========================================
  // 4. APPLICATIONS & INTERVIEWS
  // ==========================================
  async getAllApplications() { return (await PlacementApplication.find().lean()).map(strip); }
  async getApplicationById(id) { const a = await PlacementApplication.findOne({ id }).lean(); return a ? strip(a) : undefined; }
  async getApplicationsByStudent(studentId) { return (await PlacementApplication.find({ studentId }).lean()).map(strip); }

  async createApplication(jobId, studentId, actor) {
    const student = await PlacementStudent.findOne({ id: studentId });
    if (!student) throw new Error('Student record not found');
    if (!(await this.isStudentEligible(studentId))) throw new Error('ACCESS DENIED: Student is not marked as Eligible for Placement by Mentor or Admin.');
    const job = await PlacementJob.findOne({ id: jobId }).lean();
    if (!job) throw new Error('Job listing not found');

    const existing = await PlacementApplication.findOne({ jobId, studentId }).lean();
    if (existing) return { application: strip(existing), isNew: false };

    const id = uid('app');
    const now = new Date().toISOString();
    const SOURCE_LABELS = { AI_JOB_SCRAPER: 'AI Job Scraper (Apify)', STAFF_REFERRAL: 'Staff & Faculty Referral', ATS_JOB_API: 'Public ATS API', INBOUND: 'Inbound', OUTREACH: 'Outreach', REPEATED_PARTNER: 'Repeated Partner', SOCIAL_MEDIA: 'Social Media' };
    const sourceLabel = SOURCE_LABELS[job.sourceChannel] || 'Placement Team Direct';
    const application = {
      id, jobId: job.id, jobTitle: job.title, company: job.company, location: job.location,
      studentId: student.get('id'), studentName: student.get('fullName'), studentEmail: student.get('email'),
      school: student.get('school'), program: student.get('program'), batch: student.get('batch'),
      sourceChannel: job.sourceChannel, jobSource: sourceLabel,
      applicationUrl: job.applicationUrl || job.externalUrl || job.sourceUrl || undefined,
      status: 'APPLICATION_STARTED', startedAt: now, appliedAt: now, createdAt: now, updatedAt: now, interviewDates: [],
    };
    await PlacementApplication.create(application);
    student.set('inactivityFlags.hasNotApplied', false);
    await student.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'APPLICATION_STARTED', entityType: 'APPLICATION', entityId: id,
      details: `${application.studentName} started external application for "${job.title}" at "${job.company}".`,
    });
    return { application, isNew: true };
  }

  async confirmApplication(id, actor) {
    const a = await PlacementApplication.findOne({ id });
    if (!a) throw new Error('Application not found');
    if (a.get('status') === 'APPLIED') return strip(a);
    const now = new Date().toISOString();
    a.set({ status: 'APPLIED', confirmedAt: now, updatedAt: now });
    await a.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'APPLICATION_CONFIRMED', entityType: 'APPLICATION', entityId: id,
      details: `${a.get('studentName')} confirmed completed application for "${a.get('jobTitle')}" at "${a.get('company')}".`,
    });
    return strip(a);
  }

  async declineApplication(id, declineReason, studentComment, needsHelp, actor) {
    const a = await PlacementApplication.findOne({ id });
    if (!a) throw new Error('Application not found');
    const now = new Date().toISOString();
    a.set({ status: 'NOT_APPLIED', declineReason, studentComment: studentComment || undefined, needsHelp, helpStatus: needsHelp ? 'HELP_REQUESTED' : 'NONE', updatedAt: now });
    if (needsHelp) a.set('helpUpdatedAt', now);
    await a.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'APPLICATION_DECLINED', entityType: 'APPLICATION', entityId: id,
      details: `${a.get('studentName')} reported NOT applying for "${a.get('jobTitle')}" at "${a.get('company')}". Reason: ${declineReason}. Needs help: ${needsHelp}.`,
    });
    return strip(a);
  }

  async updateHelpStatus(id, helpStatus, actor) {
    const a = await PlacementApplication.findOne({ id });
    if (!a) throw new Error('Application not found');
    const now = new Date().toISOString();
    a.set({ helpStatus, helpUpdatedAt: now, helpUpdatedBy: actor.name, updatedAt: now });
    await a.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'HELP_STATUS_UPDATED', entityType: 'APPLICATION', entityId: id,
      details: `Help status for ${a.get('studentName')}'s application to "${a.get('jobTitle')}" updated to ${helpStatus} by ${actor.name}.`,
    });
    return strip(a);
  }

  async withdrawApplication(id, actor) {
    const a = await PlacementApplication.findOne({ id }).lean();
    if (!a) throw new Error('Application not found');
    await PlacementApplication.deleteOne({ id });
    const remaining = await PlacementApplication.countDocuments({ studentId: a.studentId });
    if (remaining === 0) await PlacementStudent.updateOne({ id: a.studentId }, { $set: { 'inactivityFlags.hasNotApplied': true } });
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'APPLICATION_WITHDRAWN', entityType: 'APPLICATION', entityId: id,
      details: `${actor.name} withdrew application for "${a.jobTitle}" at "${a.company}".`,
    });
    return true;
  }

  async updateApplicationStatus(id, newStatus, actor) {
    const a = await PlacementApplication.findOne({ id });
    if (!a) throw new Error('Application not found');
    const previousStatus = a.get('status');
    a.set({ status: newStatus, updatedAt: new Date().toISOString() });
    await a.save();
    if (newStatus === 'REJECTED') await PlacementStudent.updateOne({ id: a.get('studentId') }, { $inc: { 'inactivityFlags.consecutiveRejections': 1 } });
    else if (newStatus === 'SELECTED' || newStatus === 'JOINED') await PlacementStudent.updateOne({ id: a.get('studentId') }, { $set: { 'inactivityFlags.consecutiveRejections': 0 } });
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'APPLICATION_STATUS_CHANGE', entityType: 'APPLICATION', entityId: id,
      details: `Status of application for ${a.get('studentName')} at ${a.get('company')} changed from ${previousStatus} to ${newStatus}.`,
    });
    return strip(a);
  }

  async recordInterviewSchedule(applicationId, roundTitle, dateString, actor) {
    const a = await PlacementApplication.findOne({ id: applicationId });
    if (!a) throw new Error('Application not found');
    const dates = [...(a.get('interviewDates') || [])];
    const roundNum = dates.length + 1;
    dates.push({ round: roundNum, title: roundTitle, date: dateString, completed: false });
    a.set({ interviewDates: dates, status: 'INTERVIEW_SCHEDULED', updatedAt: new Date().toISOString() });
    await a.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'INTERVIEW_SCHEDULED', entityType: 'APPLICATION', entityId: applicationId,
      details: `Round ${roundNum} (${roundTitle}) scheduled for ${a.get('studentName')} on ${dateString}.`,
    });
    return strip(a);
  }

  // ==========================================
  // 5. REJECTION FEEDBACK
  // ==========================================
  async getAllRejectionFeedback() {
    return (await PlacementRejectionFeedback.find().sort({ submittedAt: -1 }).lean()).map(strip);
  }
  async submitRejectionFeedback(applicationId, category, details, remedialActionNeeded, actor) {
    const a = await PlacementApplication.findOne({ id: applicationId });
    if (!a) throw new Error('Application not found');
    const id = uid('fb');
    const now = new Date().toISOString();
    const record = {
      id, applicationId, jobId: a.get('jobId'), jobTitle: a.get('jobTitle'), company: a.get('company'),
      studentId: a.get('studentId'), studentName: a.get('studentName'), school: a.get('school'), program: a.get('program'), batch: a.get('batch'),
      category, details, remedialActionNeeded: remedialActionNeeded || 'Mentor review scheduled for remedial intervention', submittedAt: now,
    };
    await PlacementRejectionFeedback.create(record);
    a.set('rejectionFeedback', { id, category, details, remedialActionNeeded: record.remedialActionNeeded, submittedAt: now });
    await a.save();
    await this.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: 'REJECTION_FEEDBACK_SUBMITTED', entityType: 'FEEDBACK', entityId: id,
      details: `Mandatory feedback logged for ${a.get('studentName')} on ${a.get('company')} application: ${category}.`,
    });
    return record;
  }

  // ==========================================
  // 6. AUDIT — SHO App auditlogs, source 'placement'
  // ==========================================
  async getAuditLogs(limit = 500) {
    const rows = await AuditLog.find({ source: 'placement' }).sort({ createdAt: -1 }).limit(limit).lean();
    return rows.map(r => ({
      id: String(r._id), actorId: r.userId ? String(r.userId) : 'system', actorName: r.userName, actorRole: r.userRole,
      action: r.action, entityType: r.entityType || 'SYSTEM', entityId: r.target || '', details: r.details, timestamp: r.createdAt,
    }));
  }
  async logAudit(logData) {
    const validId = mongoose.isValidObjectId(logData.actorId) ? logData.actorId : undefined;
    return AuditLog.create({
      userId: validId, userName: logData.actorName || 'System', userRole: validId ? String(logData.actorRole || 'placement').toLowerCase() : 'system',
      action: logData.action, target: logData.entityId ? String(logData.entityId) : undefined, details: logData.details,
      entityType: logData.entityType, source: 'placement',
    }).catch(() => null);
  }

  // ==========================================
  // 7. SETTINGS (Apify / LMS / ATS)
  // ==========================================
  async settings() {
    let doc = await PlacementSettings.findOne({ key: 'singleton' });
    if (!doc) doc = await PlacementSettings.create({ key: 'singleton', apify: DEFAULT_APIFY, lms: DEFAULT_LMS, ats: DEFAULT_ATS });
    return doc;
  }
  async getApifyConfig() { const d = await this.settings(); return { ...DEFAULT_APIFY, ...(d.apify || {}) }; }
  async updateApifyConfig(updates, actor) {
    const d = await this.settings(); d.apify = { ...DEFAULT_APIFY, ...(d.apify || {}), ...updates }; d.markModified('apify'); await d.save();
    await this.logAudit({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: 'APIFY_CONFIG_UPDATED', entityType: 'INTEGRATION', entityId: 'APIFY', details: 'Apify scraper settings updated.' });
    return d.apify;
  }
  async getLmsConfig() { const d = await this.settings(); return { ...DEFAULT_LMS, ...(d.lms || {}) }; }
  async updateLmsConfig(updates, actor) {
    const d = await this.settings(); d.lms = { ...DEFAULT_LMS, ...(d.lms || {}), ...updates }; d.markModified('lms'); await d.save();
    await this.logAudit({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: 'LMS_CONFIG_UPDATED', entityType: 'INTEGRATION', entityId: 'LMS', details: 'Student sync configuration updated.' });
    return d.lms;
  }
  async getAtsConfig() { const d = await this.settings(); return { ...DEFAULT_ATS, ...(d.ats || {}) }; }
  async updateAtsConfig(updates, actor) {
    const d = await this.settings(); d.ats = { ...DEFAULT_ATS, ...(d.ats || {}), ...updates }; d.markModified('ats'); await d.save();
    await this.logAudit({ actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: 'ATS_CONFIG_UPDATED', entityType: 'INTEGRATION', entityId: 'ATS', details: 'Public ATS integration settings updated.' });
    return d.ats;
  }
}

const dbStore = new PlacementStore();
module.exports = { dbStore, ROLE_MAP, REVERSE_ROLE_MAP, toPlacementUser };
