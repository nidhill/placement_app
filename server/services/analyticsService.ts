import { 
  ManagementKPIs, 
  HealthStatus, 
  JobSourceChannel 
} from '../../src/types.ts';
import { dbStore } from '../db/store.ts';

export class AnalyticsService {
  /**
   * Evaluates placement rate strictly against PRD section 3.6 thresholds:
   * - RED: < 50%
   * - YELLOW: 50% – 59%
   * - GREEN: >= 60%
   */
  public static calculateHealthStatus(ratePercentage: number): HealthStatus {
    if (ratePercentage < 50) {
      return 'RED';
    } else if (ratePercentage < 60) {
      return 'YELLOW';
    } else {
      return 'GREEN';
    }
  }

  public static getManagementKPIs(): ManagementKPIs {
    const students = dbStore.getAllStudents();
    const applications = dbStore.getAllApplications();
    const jobs = dbStore.getAllJobs();

    // Eligible candidates pool
    const eligibleStudents = students.filter(
      s => s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE'
    );

    // Placed candidates (JOINED or SELECTED or OFFER_RECEIVED)
    const placedStudentIds = new Set<string>();
    applications.forEach(app => {
      if (app.status === 'JOINED' || app.status === 'SELECTED' || app.status === 'OFFER_RECEIVED') {
        placedStudentIds.add(app.studentId);
      }
    });

    const totalEligible = eligibleStudents.length;
    const totalPlaced = placedStudentIds.size;
    const overallPlacementRate = totalEligible > 0 
      ? Math.round((totalPlaced / totalEligible) * 1000) / 10 
      : 0;

    const overallHealth = this.calculateHealthStatus(overallPlacementRate);

    // Application funnel stats
    const totalActiveApplications = applications.filter(
      a => a.status !== 'REJECTED' && a.status !== 'JOINED'
    ).length;

    let totalInterviews = 0;
    applications.forEach(a => {
      totalInterviews += a.interviewDates.length;
      if (a.status === 'INTERVIEWED' || a.status === 'INTERVIEW_SCHEDULED') {
        if (a.interviewDates.length === 0) totalInterviews += 1;
      }
    });

    const totalOffers = applications.filter(
      a => a.status === 'SELECTED' || a.status === 'OFFER_RECEIVED' || a.status === 'JOINED'
    ).length;

    const totalRejections = applications.filter(a => a.status === 'REJECTED').length;

    // School metrics
    const schoolMap = new Map<string, { totalEligible: number; placed: number }>();
    eligibleStudents.forEach(st => {
      const entry = schoolMap.get(st.school) || { totalEligible: 0, placed: 0 };
      entry.totalEligible += 1;
      if (placedStudentIds.has(st.id)) {
        entry.placed += 1;
      }
      schoolMap.set(st.school, entry);
    });

    const schoolMetrics = Array.from(schoolMap.entries()).map(([school, data]) => {
      const rate = data.totalEligible > 0 ? Math.round((data.placed / data.totalEligible) * 1000) / 10 : 0;
      return {
        school,
        totalEligible: data.totalEligible,
        placed: data.placed,
        rate,
        healthStatus: this.calculateHealthStatus(rate)
      };
    });

    // Program metrics
    const programMap = new Map<string, { school: string; totalEligible: number; placed: number }>();
    eligibleStudents.forEach(st => {
      const entry = programMap.get(st.program) || { school: st.school, totalEligible: 0, placed: 0 };
      entry.totalEligible += 1;
      if (placedStudentIds.has(st.id)) {
        entry.placed += 1;
      }
      programMap.set(st.program, entry);
    });

    const programMetrics = Array.from(programMap.entries()).map(([program, data]) => {
      const rate = data.totalEligible > 0 ? Math.round((data.placed / data.totalEligible) * 1000) / 10 : 0;
      return {
        program,
        school: data.school,
        totalEligible: data.totalEligible,
        placed: data.placed,
        rate,
        healthStatus: this.calculateHealthStatus(rate)
      };
    });

    // Batch metrics
    const batchMap = new Map<string, { program: string; totalEligible: number; placed: number }>();
    eligibleStudents.forEach(st => {
      const key = `${st.batch} - ${st.program}`;
      const entry = batchMap.get(key) || { program: st.program, totalEligible: 0, placed: 0 };
      entry.totalEligible += 1;
      if (placedStudentIds.has(st.id)) {
        entry.placed += 1;
      }
      batchMap.set(key, entry);
    });

    const batchMetrics = Array.from(batchMap.entries()).map(([batchKey, data]) => {
      const rate = data.totalEligible > 0 ? Math.round((data.placed / data.totalEligible) * 1000) / 10 : 0;
      return {
        batch: batchKey,
        program: data.program,
        totalEligible: data.totalEligible,
        placed: data.placed,
        rate,
        healthStatus: this.calculateHealthStatus(rate)
      };
    });

    // Channel metrics
    const channels: { key: JobSourceChannel; label: string }[] = [
      { key: 'PLACEMENT_DIRECT', label: 'Placement Team Direct Outreach' },
      { key: 'STAFF_REFERRAL', label: 'Staff & Faculty Referrals' },
      { key: 'AI_JOB_SCRAPER', label: 'AI Job Scraper Agent (Apify)' },
    ];

    const channelMetrics = channels.map(c => {
      const channelJobs = jobs.filter(j => j.sourceChannel === c.key);
      const channelApps = applications.filter(a => a.sourceChannel === c.key);
      const channelInterviews = channelApps.filter(
        a => a.status === 'INTERVIEWED' || a.status === 'INTERVIEW_SCHEDULED' || a.status === 'SELECTED' || a.status === 'JOINED'
      ).length;
      const channelPlacements = channelApps.filter(
        a => a.status === 'SELECTED' || a.status === 'JOINED' || a.status === 'OFFER_RECEIVED'
      ).length;

      const conversionRate = channelApps.length > 0 
        ? Math.round((channelPlacements / channelApps.length) * 1000) / 10 
        : 0;

      // Dead/low-converting channel flag if conversion < 15% with >= 5 applications
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
