// Placement auth: one Bearer token, two issuers.
//   SHO App staff token  { userId, role }  → admin / placement_team
//   LMS student token    { id, role: 'student', sessionId? } → the student's placement profile
// Produces req.actor = { id, name, email, role: MAIN_ADMIN|PLACEMENT_OFFICER|MANAGEMENT|STUDENT, studentProfileId? }
// — the shape the ported placement routes expect.
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt');
const User = require('../models/User');
const { getForceLogoutAt } = require('../middleware/auth');
const { dbStore, ROLE_MAP } = require('./store');

async function resolveActor(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  const forceLogoutAt = await getForceLogoutAt();
  if (forceLogoutAt && decoded.iat && decoded.iat < Math.floor(forceLogoutAt.getTime() / 1000)) {
    const e = new Error('Session expired. Please log in again.'); e.status = 401; throw e;
  }
  const userId = decoded.userId || decoded.id;
  const user = await User.findById(userId).select('name email role isActive activeSessions').lean();
  if (!user || user.isActive === false) { const e = new Error('User not found or inactive'); e.status = 401; throw e; }
  if (decoded.sessionId && !(user.activeSessions || []).some(s => s.sessionId === decoded.sessionId)) {
    const e = new Error('You have been logged out on this device.'); e.status = 401; throw e;
  }
  const role = ROLE_MAP[user.role];
  if (!role) { const e = new Error('Your role has no access to the placement tool.'); e.status = 403; throw e; }

  const actor = { id: String(user._id), name: user.name, email: user.email, role, shoRole: user.role };
  if (role === 'STUDENT') {
    const profile = await dbStore.getStudentByEmail(user.email);
    actor.studentProfileId = profile?.id || null;
    actor.studentProfile = profile || null;
  }
  return actor;
}

function placementAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  resolveActor(auth.slice(7))
    .then(actor => { req.actor = actor; req.userId = actor.id; req.user = { _id: actor.id, name: actor.name, role: actor.shoRole }; next(); })
    .catch(err => res.status(err.status || 401).json({ error: err.status ? err.message : 'Invalid or expired token' }));
}

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.actor.role)) return res.status(403).json({ error: `Only ${roles.join(' / ')} can do this.` });
  next();
};

module.exports = { placementAuth, requireRole, resolveActor };
