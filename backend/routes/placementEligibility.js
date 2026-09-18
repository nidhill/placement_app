// ─── Placement Eligibility ───────────────────────────────────────────────────
// Mentors decide which students are ready for placement, from the SHO App.
// The placement tool only ever imports students marked 'eligible' here
// (routes/integrations.js, ?placementEligible=true).
//
//   GET   /api/placement-eligibility/batches         — batches the caller may review
//   GET   /api/placement-eligibility?batch=<id>      — students with live metrics + current decision
//   PATCH /api/placement-eligibility/:studentId      — { status: 'eligible'|'not_eligible'|'pending', notes }
//   PATCH /api/placement-eligibility/bulk            — { studentIds: [], status, notes }
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const AuditLog = require('../models/AuditLog');
const { verifyToken } = require('../middleware/auth');
const { roleCan } = require('../services/permissions');
const { buildBatchFilter } = require('./batches');
const { buildProfiles } = require('./integrations');
const { syncStudents } = require('../placement/sync');

const STATUSES = ['pending', 'eligible', 'not_eligible'];

async function allowedBatchIds(user) {
    const filter = await buildBatchFilter(user, { isActive: true });
    return (await Batch.find(filter).select('_id').lean()).map(b => b._id);
}

// GET /batches — the caller's batches with an eligibility tally
router.get('/batches', verifyToken, async (req, res) => {
    try {
        if (!(await roleCan(req.user.role, 'placement-eligibility'))) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const filter = await buildBatchFilter(req.user, { isActive: true });
        const batches = await Batch.find(filter).populate('school', 'name').select('name code courseType school status startDate').sort({ startDate: -1 }).lean();
        const tallies = await Student.aggregate([
            { $match: { batch: { $in: batches.map(b => b._id) }, isActive: true } },
            { $group: { _id: { batch: '$batch', status: { $ifNull: ['$placement.status', 'pending'] } }, n: { $sum: 1 } } },
        ]);
        const byBatch = {};
        for (const t of tallies) {
            const k = String(t._id.batch);
            byBatch[k] = byBatch[k] || { pending: 0, eligible: 0, not_eligible: 0, total: 0 };
            byBatch[k][t._id.status] = t.n; byBatch[k].total += t.n;
        }
        res.json({
            success: true,
            batches: batches.map(b => ({
                _id: b._id, name: b.name, code: b.code, course: b.courseType || null, school: b.school?.name || null,
                status: b.status, startDate: b.startDate,
                tally: byBatch[String(b._id)] || { pending: 0, eligible: 0, not_eligible: 0, total: 0 },
            })),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /?batch=<id> — students of one batch with live metrics
router.get('/', verifyToken, async (req, res) => {
    try {
        if (!(await roleCan(req.user.role, 'placement-eligibility'))) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const allowed = await allowedBatchIds(req.user);
        const batchId = String(req.query.batch || '');
        if (!batchId || !allowed.some(id => String(id) === batchId)) {
            return res.status(403).json({ success: false, message: 'Not your batch' });
        }
        const students = await Student.find({ batch: batchId, isActive: true }).sort({ name: 1 }).lean();
        const profiles = await buildProfiles(students);
        const byId = new Map(students.map(s => [String(s._id), s]));
        res.json({
            success: true,
            students: profiles.map(p => {
                const s = byId.get(p.id);
                return {
                    ...p,
                    placement: {
                        status: s.placement?.status || 'pending',
                        notes: s.placement?.notes || '',
                        markedAt: s.placement?.markedAt || null,
                        markedBy: s.placement?.markedBy || null,
                    },
                };
            }),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

async function applyDecision(req, studentIds, status, notes) {
    const allowed = await allowedBatchIds(req.user);
    const students = await Student.find({ _id: { $in: studentIds }, batch: { $in: allowed } }).select('name batch placement').lean();
    if (students.length === 0) return { updated: 0 };
    const update = {
        'placement.status': status,
        'placement.notes': String(notes || '').slice(0, 1000),
        'placement.markedBy': req.userId,
        'placement.markedAt': new Date(),
    };
    await Student.updateMany({ _id: { $in: students.map(s => s._id) } }, { $set: update });

    // Push the decision straight into the placement tool. A failure there
    // must never fail the mentor's save — the tool's Sync button catches up.
    let placement = null;
    try {
        placement = await syncStudents(students.map(s => s._id), { id: req.userId, name: req.user.name, role: req.user.role });
    } catch (e) {
        console.warn('[placement-eligibility] instant sync failed:', e.message);
    }

    const label = status === 'eligible' ? 'placement-eligible' : status === 'not_eligible' ? 'not placement-eligible' : 'placement status reset to pending';
    AuditLog.create({
        userId: req.userId, userName: req.user.name, userRole: req.user.role,
        action: 'PLACEMENT_ELIGIBILITY',
        details: students.length === 1
            ? `Marked ${students[0].name} ${label}${notes ? ` — ${String(notes).slice(0, 80)}` : ''}`
            : `Marked ${students.length} students ${label}`,
        target: students.length === 1 ? String(students[0]._id) : undefined,
        ip: req.ip, device: req.headers['user-agent'], source: 'sho',
    }).catch(() => {});
    return { updated: students.length, placement };
}

// PATCH /bulk — before /:studentId so 'bulk' is never read as an id
router.patch('/bulk', verifyToken, async (req, res) => {
    try {
        if (!(await roleCan(req.user.role, 'placement-eligibility.manage'))) {
            return res.status(403).json({ success: false, message: 'Not authorized to decide eligibility' });
        }
        const { studentIds, status, notes } = req.body || {};
        if (!Array.isArray(studentIds) || studentIds.length === 0 || !STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: 'studentIds[] and a valid status are required' });
        }
        req.skipAudit = true;
        const r = await applyDecision(req, studentIds, status, notes);
        res.json({ success: true, ...r });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /:studentId
router.patch('/:studentId', verifyToken, async (req, res) => {
    try {
        if (!(await roleCan(req.user.role, 'placement-eligibility.manage'))) {
            return res.status(403).json({ success: false, message: 'Not authorized to decide eligibility' });
        }
        const { status, notes } = req.body || {};
        if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
        req.skipAudit = true;
        const r = await applyDecision(req, [req.params.studentId], status, notes);
        if (r.updated === 0) return res.status(404).json({ success: false, message: 'Student not found in your batches' });
        res.json({ success: true, ...r });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
