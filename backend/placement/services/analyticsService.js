var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var analyticsService_exports = {};
__export(analyticsService_exports, {
  AnalyticsService: () => AnalyticsService
});
module.exports = __toCommonJS(analyticsService_exports);
var import_store = require('../store');
class AnalyticsService {
  /**
   * Evaluates placement rate strictly against PRD section 3.6 thresholds:
   * - RED: < 50%
   * - YELLOW: 50% – 59%
   * - GREEN: >= 60%
   */
  static calculateHealthStatus(ratePercentage) {
    if (ratePercentage < 50) {
      return "RED";
    } else if (ratePercentage < 60) {
      return "YELLOW";
    } else {
      return "GREEN";
    }
  }
  static async getManagementKPIs() {
    const students = await import_store.dbStore.getAllStudents();
    const applications = await import_store.dbStore.getAllApplications();
    const jobs = await import_store.dbStore.getAllJobs();
    const eligibleStudents = students.filter(
      (s) => s.eligibilityStatus === "ELIGIBLE" || s.eligibilityStatus === "ADMIN_OVERRIDE"
    );
    const placedStudentIds = /* @__PURE__ */ new Set();
    applications.forEach((app) => {
      if (app.status === "JOINED" || app.status === "SELECTED" || app.status === "OFFER_RECEIVED") {
        placedStudentIds.add(app.studentId);
      }
    });
    const totalEligible = eligibleStudents.length;
    const totalPlaced = placedStudentIds.size;
    const overallPlacementRate = totalEligible > 0 ? Math.round(totalPlaced / totalEligible * 1e3) / 10 : 0;
    const overallHealth = this.calculateHealthStatus(overallPlacementRate);
    const totalActiveApplications = applications.filter(
      (a) => a.status !== "REJECTED" && a.status !== "JOINED"
    ).length;
    let totalInterviews = 0;
    applications.forEach((a) => {
      totalInterviews += a.interviewDates.length;
      if (a.status === "INTERVIEWED" || a.status === "INTERVIEW_SCHEDULED") {
        if (a.interviewDates.length === 0) totalInterviews += 1;
      }
    });
    const totalOffers = applications.filter(
      (a) => a.status === "SELECTED" || a.status === "OFFER_RECEIVED" || a.status === "JOINED"
    ).length;
    const totalRejections = applications.filter((a) => a.status === "REJECTED").length;
    const schoolMap = /* @__PURE__ */ new Map();
    eligibleStudents.forEach((st) => {
      const entry = schoolMap.get(st.school) || { totalEligible: 0, placed: 0 };
      entry.totalEligible += 1;
      if (placedStudentIds.has(st.id)) {
        entry.placed += 1;
      }
      schoolMap.set(st.school, entry);
    });
    const schoolMetrics = Array.from(schoolMap.entries()).map(([school, data]) => {
      const rate = data.totalEligible > 0 ? Math.round(data.placed / data.totalEligible * 1e3) / 10 : 0;
      return {
        school,
        totalEligible: data.totalEligible,
        placed: data.placed,
        rate,
        healthStatus: this.calculateHealthStatus(rate)
      };
    });
    const programMap = /* @__PURE__ */ new Map();
    eligibleStudents.forEach((st) => {
      const entry = programMap.get(st.program) || { school: st.school, totalEligible: 0, placed: 0 };
      entry.totalEligible += 1;
      if (placedStudentIds.has(st.id)) {
        entry.placed += 1;
      }
      programMap.set(st.program, entry);
    });
    const programMetrics = Array.from(programMap.entries()).map(([program, data]) => {
      const rate = data.totalEligible > 0 ? Math.round(data.placed / data.totalEligible * 1e3) / 10 : 0;
      return {
        program,
        school: data.school,
        totalEligible: data.totalEligible,
        placed: data.placed,
        rate,
        healthStatus: this.calculateHealthStatus(rate)
      };
    });
    const batchMap = /* @__PURE__ */ new Map();
    eligibleStudents.forEach((st) => {
      const key = `${st.batch} - ${st.program}`;
      const entry = batchMap.get(key) || { program: st.program, totalEligible: 0, placed: 0 };
      entry.totalEligible += 1;
      if (placedStudentIds.has(st.id)) {
        entry.placed += 1;
      }
      batchMap.set(key, entry);
    });
    const batchMetrics = Array.from(batchMap.entries()).map(([batchKey, data]) => {
      const rate = data.totalEligible > 0 ? Math.round(data.placed / data.totalEligible * 1e3) / 10 : 0;
      return {
        batch: batchKey,
        program: data.program,
        totalEligible: data.totalEligible,
        placed: data.placed,
        rate,
        healthStatus: this.calculateHealthStatus(rate)
      };
    });
    const channels = [
      { key: "PLACEMENT_DIRECT", label: "Placement Team Direct Outreach" },
      { key: "STAFF_REFERRAL", label: "Staff & Faculty Referrals" },
      { key: "AI_JOB_SCRAPER", label: "AI Job Scraper Agent (Apify)" },
      { key: "INBOUND", label: "Inbound" },
      { key: "OUTREACH", label: "Outreach" },
      { key: "REPEATED_PARTNER", label: "Repeated Partner" },
      { key: "SOCIAL_MEDIA", label: "Social Media" },
      { key: "ATS_JOB_API", label: "ATS Public API" }
    ];
    const channelMetrics = channels.map((c) => {
      const channelJobs = jobs.filter((j) => j.sourceChannel === c.key);
      const channelApps = applications.filter((a) => a.sourceChannel === c.key);
      const channelInterviews = channelApps.filter(
        (a) => a.status === "INTERVIEWED" || a.status === "INTERVIEW_SCHEDULED" || a.status === "SELECTED" || a.status === "JOINED"
      ).length;
      const channelPlacements = channelApps.filter(
        (a) => a.status === "SELECTED" || a.status === "JOINED" || a.status === "OFFER_RECEIVED"
      ).length;
      const conversionRate = channelApps.length > 0 ? Math.round(channelPlacements / channelApps.length * 1e3) / 10 : 0;
      const isLowPerforming = channelApps.length >= 3 && conversionRate < 20;
      return {
        channel: c.key,
        label: c.label,
        jobsDiscovered: channelJobs.length,
        applications: channelApps.length,
        interviews: channelInterviews,
        placements: channelPlacements,
        conversionRate,
        isLowPerforming
      };
    });
    return {
      overallPlacementRate,
      healthStatus: overallHealth,
      totalStudents: students.length,
      totalEligible,
      totalPlaced,
      totalActiveApplications,
      totalInterviews,
      totalOffers,
      totalRejections,
      schoolMetrics,
      programMetrics,
      batchMetrics,
      channelMetrics
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnalyticsService
});
