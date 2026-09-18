// Mirrors mentor-approved SHO students into placement_students — in-process,
// no HTTP hop: the placement tool now shares this server. Same mapping the
// placement tool's lmsService used against the integration API.
const Student = require('../models/Student');
const { buildProfiles } = require('../routes/integrations');
const { dbStore } = require('./store');

// 0–100 from what the SHO App actually tracks: attendance, exam average,
// assignment completion, and whether a project was ever submitted.
function readinessScore(s) {
  const clamp = v => Math.max(0, Math.min(100, Number(v) || 0));
  const attendance = clamp(s.attendance.percent);
  const exams = s.exams.avgPercent != null ? clamp(s.exams.avgPercent) : null;
  const assignments = s.assignments.assigned > 0 ? clamp((s.assignments.approved / s.assignments.assigned) * 100) : null;
  const projects = s.projects.completed > 0 ? 100 : s.projects.total > 0 ? 50 : 0;
  const parts = [[attendance, 0.35], [exams, 0.3], [assignments, 0.25], [projects, 0.1]].filter(([v]) => v != null);
  const weight = parts.reduce((a, [, w]) => a + w, 0) || 1;
  return Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / weight);
}

function toAcademic(s, existingSkills = []) {
  const gpa = s.exams.avgPercent ?? s.assignments.avgScore ?? s.assignments.completionPercent;
  return {
    course: s.batch?.course || s.batch?.name || 'Unknown course',
    scores: {
      gpaOrPercentage: Math.round((gpa || 0) * 10) / 10,
      assignmentsCompleted: s.assignments.approved,
      totalAssignments: s.assignments.assigned,
      capstoneScore: s.projects.completed > 0 ? Math.round((s.projects.completed / Math.max(1, s.projects.total)) * 100) : undefined,
    },
    attendancePercentage: s.attendance.percent,
    skills: existingSkills,
    projects: s.projects.names.map((name, idx) => ({
      id: `sho-proj-${s.id}-${idx + 1}`, title: name,
      description: `Submitted in ${s.batch?.code || 'batch'} on the SHO App`,
      status: idx < s.projects.completed ? 'COMPLETED' : 'PENDING_REVIEW',
    })),
    readinessGaps: { missingSkills: [], missingProjects: s.projects.total === 0 ? ['No project submitted yet'] : [], attendanceWarning: s.attendance.percent < 85 },
    shoMetrics: {
      shoStudentId: s.id, batchCode: s.batch?.code || null, batchStatus: s.batch?.status || null, studentStatus: s.status,
      examsTaken: s.exams.taken, examsPassed: s.exams.passed, examAvgPercent: s.exams.avgPercent,
      assignmentsSubmitted: s.assignments.submitted, assignmentsLate: s.assignments.late, assignmentAvgScore: s.assignments.avgScore,
      curriculumPercent: s.curriculum.percent, agreementSigned: s.agreement.signed, lmsLastLogin: s.lms.lastLogin,
      mentorRating: s.mentorFeedback?.overall ?? null, needsPlacement: s.profile.needsPlacement,
      employmentStatus: s.profile.employmentStatus, laptopAvailable: s.profile.laptopAvailable, syncedAt: new Date().toISOString(),
    },
  };
}

// One SHO student → the placement_students row. Returns 'new' | 'updated'.
async function upsertProfile(p, src, existing) {
  const id = `student-sho-${p.id}`;
  const marked = src.placement?.markedAt ? new Date(src.placement.markedAt).toISOString() : new Date().toISOString();
  const base = {
    id, shoStudentId: src._id, email: p.email.toLowerCase(),
    fullName: p.name, phone: p.mobile || '',
    school: p.batch?.school || 'HACA', program: p.batch?.course || p.batch?.name || 'Unknown', batch: p.batch?.code || 'NA',
    academic: toAcademic(p, existing?.academic?.skills || []),
    placementReadinessScore: readinessScore(p),
  };
  if (existing) {
    const keepOverride = existing.eligibilityStatus === 'ADMIN_OVERRIDE';
    await dbStore.upsertStudent({
      ...base,
      ...(keepOverride ? {} : { eligibilityStatus: 'ELIGIBLE', eligibilityUpdatedAt: marked, eligibilityUpdatedBy: 'SHO App mentor', evaluationNotes: src.placement?.notes || existing.evaluationNotes }),
    });
    return 'updated';
  }
  await dbStore.upsertStudent({
    ...base,
    registrationNo: `HACA-${p.batch?.code || 'NA'}-${p.id.slice(-6).toUpperCase()}`,
    mentorId: '', mentorName: 'Batch mentor',
    eligibilityStatus: 'ELIGIBLE', eligibilityUpdatedAt: marked, eligibilityUpdatedBy: 'SHO App mentor',
    evaluationNotes: src.placement?.notes || `Marked placement-eligible by mentor in the SHO App (${p.batch?.code || 'no batch'}).`,
    inactivityFlags: { hasNotApplied: true, consecutiveRejections: 0, noInterviewFollowUp: false },
    createdAt: new Date().toISOString(),
  });
  return 'new';
}

// actor: placement-shaped { id, name, role }
async function syncEligibleStudents(actor, { removeRevoked = true } = {}) {
  const students = await Student.find({ isActive: true, 'placement.status': 'eligible' }).lean();
  const profiles = await buildProfiles(students);
  const byId = new Map(students.map(s => [String(s._id), s]));

  let syncedCount = 0, updatedCount = 0, skippedCount = 0;
  const newStudents = [];
  const keptIds = [];

  for (const p of profiles) {
    if (!p.email) { skippedCount++; continue; }
    const id = `student-sho-${p.id}`;
    keptIds.push(id);
    const r = await upsertProfile(p, byId.get(p.id), await dbStore.getStudentById(id));
    if (r === 'new') { newStudents.push(p.name); syncedCount++; } else updatedCount++;
  }

  // A student a mentor moved back to pending / not eligible loses access.
  let removedCount = 0;
  if (removeRevoked) removedCount = await dbStore.removeStudentsNotIn(keptIds);

  const cfg = await dbStore.getLmsConfig();
  await dbStore.updateLmsConfig({ lastSyncTimestamp: new Date().toISOString(), totalRecordsSynced: (cfg.totalRecordsSynced || 0) + syncedCount + updatedCount, status: 'CONNECTED' }, actor);
  await dbStore.logAudit({
    actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: 'LMS_DATA_SYNC', entityType: 'LMS_SYNC', entityId: 'BATCH',
    details: `SHO student sync: ${syncedCount} new, ${updatedCount} refreshed, ${removedCount} removed (no longer eligible), ${skippedCount} skipped (no email).`,
  });
  return { syncedCount, updatedCount, removedCount, skippedCount, newStudents };
}

// Called the moment a mentor decides in the SHO App, so the placement tool
// reflects it without anyone pressing "Sync": eligible students are
// upserted, everyone else in the list is removed (admin overrides stay).
async function syncStudents(studentIds, actor) {
  const students = await Student.find({ _id: { $in: studentIds } }).lean();
  const eligible = students.filter(s => s.isActive !== false && s.placement?.status === 'eligible');
  const profiles = eligible.length ? await buildProfiles(eligible) : [];
  const byId = new Map(eligible.map(s => [String(s._id), s]));
  let added = 0, refreshed = 0, skipped = 0;
  for (const p of profiles) {
    if (!p.email) { skipped++; continue; }
    const r = await upsertProfile(p, byId.get(p.id), await dbStore.getStudentById(`student-sho-${p.id}`));
    if (r === 'new') added++; else refreshed++;
  }
  const dropIds = students.filter(s => !byId.has(String(s._id))).map(s => `student-sho-${s._id}`);
  const removed = dropIds.length ? await dbStore.removeStudentsIn(dropIds) : 0;
  if (added + refreshed + removed > 0) {
    await dbStore.logAudit({
      actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: 'LMS_DATA_SYNC', entityType: 'LMS_SYNC', entityId: 'MENTOR_DECISION',
      details: `Mentor decision synced: ${added} added, ${refreshed} refreshed, ${removed} removed.`,
    });
  }
  return { added, refreshed, removed, skipped };
}

module.exports = { syncEligibleStudents, syncStudents };
