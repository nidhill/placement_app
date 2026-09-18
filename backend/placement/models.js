// Placement collections. Documents keep the placement tool's own shapes
// (StudentProfile, JobListing, JobApplication, RejectionFeedbackRecord —
// see placement/src/types.ts) with a string `id` the frontend already
// uses; schemas are non-strict so those shapes are stored as-is.
const mongoose = require('mongoose');

const loose = (fields, collection) => {
  const schema = new mongoose.Schema({ id: { type: String, required: true, unique: true }, ...fields }, { strict: false, timestamps: true, collection });
  return schema;
};

const PlacementStudent = mongoose.models.PlacementStudent || mongoose.model('PlacementStudent', loose({
  shoStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true },
  email: { type: String, index: true },
  eligibilityStatus: { type: String, index: true },
  mentorId: { type: String, index: true },
}, 'placement_students'));

const PlacementJob = mongoose.models.PlacementJob || mongoose.model('PlacementJob', loose({
  sourceChannel: { type: String, index: true },
  status: { type: String, index: true },
  externalId: { type: String, index: true },
}, 'placement_jobs'));

const PlacementApplication = mongoose.models.PlacementApplication || mongoose.model('PlacementApplication', loose({
  jobId: { type: String, index: true },
  studentId: { type: String, index: true },
  status: { type: String, index: true },
}, 'placement_applications'));

const PlacementRejectionFeedback = mongoose.models.PlacementRejectionFeedback || mongoose.model('PlacementRejectionFeedback', loose({
  applicationId: { type: String, index: true },
  studentId: { type: String, index: true },
}, 'placement_rejection_feedback'));

// One document: { key: 'singleton', apify: {...}, lms: {...}, ats: {...} }
const PlacementSettings = mongoose.models.PlacementSettings || mongoose.model('PlacementSettings', new mongoose.Schema({
  key: { type: String, default: 'singleton', unique: true },
  apify: { type: mongoose.Schema.Types.Mixed, default: {} },
  lms: { type: mongoose.Schema.Types.Mixed, default: {} },
  ats: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { collection: 'placement_settings', timestamps: true }));

module.exports = { PlacementStudent, PlacementJob, PlacementApplication, PlacementRejectionFeedback, PlacementSettings };
