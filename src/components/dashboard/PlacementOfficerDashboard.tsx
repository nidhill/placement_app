import React, { useState, useEffect } from 'react';
import { ManagementKPIs, StudentProfile, JobListing, JobApplication, User } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { NavigationItem } from '../common/Sidebar.tsx';
import { 
  Users, 
  Briefcase, 
  FileCheck2, 
  Calendar, 
  CheckCircle2, 
  Award, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Globe,
  Sparkles,
  Share2
} from 'lucide-react';

interface PlacementOfficerDashboardProps {
  currentUser?: User;
  onNavigate: (tab: NavigationItem) => void;
  onRefreshData?: () => void;
}

export const PlacementOfficerDashboard: React.FC<PlacementOfficerDashboardProps> = ({
  currentUser,
  onNavigate,
  onRefreshData
}) => {
  const [kpis, setKpis] = useState<ManagementKPIs | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, studentRes, jobRes, appRes] = await Promise.all([
        api.getAnalytics(),
        api.getStudents(),
        api.getJobs(),
        api.getApplications()
      ]);
      setKpis(kpiRes);
      setStudents(studentRes.students);
      setJobs(jobRes.jobs);
      setApplications(appRes.applications);
    } catch (err) {
      console.error('Failed to load Placement Team dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading Placement Operations workspace...
      </div>
    );
  }

  // Exact 6 KPIs required for Placement Team:
  // - Eligible Students
  // - Active Jobs
  // - Applications
  // - Interviews
  // - Offers
  // - Placements
  const eligibleStudents = students.filter(s => s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE').length;
  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
  const totalApplications = applications.length;
  const scheduledInterviews = applications.filter(a => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEWED').length;
  const activeOffers = applications.filter(a => a.status === 'OFFER_RECEIVED' || a.status === 'SELECTED').length;
  const confirmedPlacements = applications.filter(a => a.status === 'JOINED').length;

  // Pipeline counts
  const pipelineStages = [
    { label: 'Applied', count: applications.filter(a => a.status === 'APPLIED').length, color: 'bg-secondary text-slate-700' },
    { label: 'Shortlisted', count: applications.filter(a => a.status === 'SHORTLISTED').length, color: 'bg-blue-100 text-blue-800' },
    { label: 'Interview', count: scheduledInterviews, color: 'bg-purple-100 text-purple-800' },
    { label: 'Selected', count: applications.filter(a => a.status === 'SELECTED').length, color: 'bg-teal-100 text-teal-800' },
    { label: 'Offer', count: activeOffers, color: 'bg-amber-100 text-amber-800' },
    { label: 'Joined', count: confirmedPlacements, color: 'bg-emerald-100 text-emerald-800' },
  ];

  // Students requiring follow-up
  const studentsNeedingFollowUp = students.filter(s => 
    (s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE') &&
    (s.inactivityFlags?.hasNotApplied || s.inactivityFlags?.repeatedRejectionsCount)
  ).slice(0, 5);

  // Open Job Opportunities
  const recentActiveJobs = jobs.filter(j => j.status === 'ACTIVE').slice(0, 5);

  // Upcoming Interviews
  const upcomingInterviews = applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').slice(0, 5);

  // Job Source Performance (derived dynamically from actual jobs and applications)
  const jobSources = (kpis.channelMetrics && kpis.channelMetrics.length > 0)
    ? kpis.channelMetrics.map(cm => ({
        name: cm.label,
        count: cm.jobsDiscovered,
        hires: cm.placements,
        conversion: `${cm.conversionRate}%`
      }))
    : [
        { name: 'AI Job Scraper (Apify)', count: jobs.filter(j => j.sourceChannel === 'AI_JOB_SCRAPER').length, hires: applications.filter(a => a.sourceChannel === 'AI_JOB_SCRAPER' && (a.status === 'JOINED' || a.status === 'SELECTED')).length, conversion: '0%' },
        { name: 'Staff & Faculty Referrals', count: jobs.filter(j => j.sourceChannel === 'STAFF_REFERRAL').length, hires: applications.filter(a => a.sourceChannel === 'STAFF_REFERRAL' && (a.status === 'JOINED' || a.status === 'SELECTED')).length, conversion: '0%' },
        { name: 'Placement Team Direct Outreach', count: jobs.filter(j => j.sourceChannel === 'PLACEMENT_DIRECT').length, hires: applications.filter(a => a.sourceChannel === 'PLACEMENT_DIRECT' && (a.status === 'JOINED' || a.status === 'SELECTED')).length, conversion: '0%' },
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Placement Operations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active candidate matching, employer pipelines, and recruitment tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('candidate_matching')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Match Candidates</span>
          </button>
          <button
            onClick={() => onNavigate('jobs')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-border text-slate-700 rounded-2xl text-xs font-semibold hover:bg-muted transition-colors"
          >
            <Briefcase className="w-4 h-4 text-slate-500" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* 6 Key Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. Eligible Students */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Eligible Students</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{eligibleStudents}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Ready for dispatch</div>
        </div>

        {/* 2. Active Jobs */}
        <div 
          onClick={() => onNavigate('jobs')}
          className="bg-white p-4 rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Jobs</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{activeJobs}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">Accepting applications</div>
        </div>

        {/* 3. Applications */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white p-4 rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Applications</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{totalApplications}</div>
          <div className="text-[10px] text-slate-500 mt-1">In active pipelines</div>
        </div>

        {/* 4. Interviews */}
        <div 
          onClick={() => onNavigate('interviews')}
          className="bg-white p-4 rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Interviews</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{scheduledInterviews}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-1">Scheduled rounds</div>
        </div>

        {/* 5. Offers */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white p-4 rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Offers</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{activeOffers}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Pending student reply</div>
        </div>

        {/* 6. Placements */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white p-4 rounded-2xl border border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Placements</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{confirmedPlacements}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Verified joined</div>
        </div>

      </div>

      {/* Application Pipeline Overview Bar */}
      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Active Application Pipeline</h3>
          <span className="text-xs text-slate-400">Total Active: {totalApplications} Candidates</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.label} className="p-3 bg-muted border border-border/70 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {idx + 1}. {stage.label}
              </span>
              <div className="text-lg font-bold text-foreground mt-1">{stage.count}</div>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${stage.color}`}>
                Pipeline Stage
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Students Requiring Follow-up + Open Job Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 1: Students Requiring Follow-up */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Students Requiring Follow-up</h3>
                <p className="text-xs text-slate-400 mt-0.5">Eligible candidates needing direct counselor intervention</p>
              </div>
              <button 
                onClick={() => onNavigate('follow_ups')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-border/70">
              {studentsNeedingFollowUp.map(student => (
                <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{student.fullName}</div>
                    <div className="text-[11px] text-slate-500">
                      {student.program} · {student.batch}
                    </div>
                  </div>

                  <div className="text-right">
                    {student.inactivityFlags?.hasNotApplied ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200">
                        Has Not Applied Yet
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-medium border border-rose-200">
                        {student.inactivityFlags?.repeatedRejectionsCount || 2} Rejections
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border/70">
            <button
              onClick={() => onNavigate('candidate_matching')}
              className="w-full py-2 bg-muted hover:bg-muted border border-border rounded-lg text-xs font-semibold text-slate-700 transition-colors text-center"
            >
              Run Candidate Auto-Match for Follow-up Students
            </button>
          </div>
        </div>

        {/* Section 2: Open Job Opportunities */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Open Job Opportunities</h3>
                <p className="text-xs text-slate-400 mt-0.5">High-priority positions accepting candidates</p>
              </div>
              <button 
                onClick={() => onNavigate('jobs')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                All Jobs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-border/70">
              {recentActiveJobs.map(job => (
                <div key={job.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{job.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {job.company} · {job.location} · {job.workplaceType}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-slate-700 font-medium">
                      {job.targetSchool}
                    </span>
                    <button
                      onClick={() => onNavigate('candidate_matching')}
                      className="px-2.5 py-1 bg-primary text-white text-[10px] font-semibold rounded hover:bg-primary/90 transition-colors"
                    >
                      Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border/70">
            <button
              onClick={() => onNavigate('jobs')}
              className="w-full py-2 bg-muted hover:bg-muted border border-border rounded-lg text-xs font-semibold text-slate-700 transition-colors text-center"
            >
              Manage & Edit Job Openings ({activeJobs} active)
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Row: Upcoming Interviews + Job Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Interviews */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Interviews</h3>
            <button 
              onClick={() => onNavigate('interviews')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Full Calendar <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-border/70">
            {upcomingInterviews.map((app, idx) => (
              <div key={app.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[11px]">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{app.studentName}</div>
                    <div className="text-[11px] text-slate-500">
                      {app.jobTitle} @ {app.companyName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-medium text-purple-700 block">
                    {app.interviewRound || 'Technical Round 1'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : 'Tomorrow, 2:00 PM'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Source Performance */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Job Source Performance</h3>
            <button 
              onClick={() => onNavigate('job_sources')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Source Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-2 text-xs">
            {jobSources.map(source => (
              <div key={source.name} className="p-3 bg-muted rounded-xl border border-border/70">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{source.name}</span>
                  <span className="text-emerald-700 font-bold">{source.conversion} hire rate</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{source.count} Active Job Postings</span>
                  <span>{source.hires} Students Placed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
