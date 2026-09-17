import React from 'react';
import { 
  EligibilityStatus, 
  ApplicationStatus, 
  JobSourceChannel, 
  HealthStatus, 
  MatchVerdict,
  UserRole,
  HelpStatus 
} from '../../types.ts';

interface BadgeProps {
  id?: string;
  className?: string;
}

export const EligibilityBadge: React.FC<{ status: EligibilityStatus } & BadgeProps> = ({ status, className = '', id }) => {
  switch (status) {
    case 'ELIGIBLE':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Eligible
        </span>
      );
    case 'PENDING_MENTOR_APPROVAL':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pending Review
        </span>
      );
    case 'NOT_ELIGIBLE':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Not Eligible
        </span>
      );
    case 'ADMIN_OVERRIDE':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Admin Override
        </span>
      );
    default:
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Not Evaluated
        </span>
      );
  }
};

export const SourceChannelBadge: React.FC<{ channel: JobSourceChannel } & BadgeProps> = ({ channel, className = '', id }) => {
  switch (channel) {
    case 'AI_JOB_SCRAPER':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100 whitespace-nowrap ${className}`}>
          AI Job Scraper
        </span>
      );
    case 'ATS_JOB_API':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200/60 whitespace-nowrap ${className}`}>
          ATS Public API
        </span>
      );
    case 'STAFF_REFERRAL':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-100 whitespace-nowrap ${className}`}>
          Staff Referral
        </span>
      );
    case 'PLACEMENT_DIRECT':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 whitespace-nowrap ${className}`}>
          Placement Team Direct
        </span>
      );
    case 'INBOUND':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap ${className}`}>
          Inbound
        </span>
      );
    case 'OUTREACH':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 whitespace-nowrap ${className}`}>
          Outreach
        </span>
      );
    case 'REPEATED_PARTNER':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap ${className}`}>
          Repeated Partner
        </span>
      );
    case 'SOCIAL_MEDIA':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 whitespace-nowrap ${className}`}>
          Social Media
        </span>
      );
    default:
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 whitespace-nowrap ${className}`}>
          {String(channel).replace('_', ' ')}
        </span>
      );
  }
};

export const ApplicationStatusBadge: React.FC<{ status: ApplicationStatus } & BadgeProps> = ({ status, className = '', id }) => {
  switch (status) {
    case 'APPLICATION_STARTED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Application Started
        </span>
      );
    case 'NOT_APPLIED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Not Applied
        </span>
      );
    case 'APPLIED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Applied
        </span>
      );
    case 'SHORTLISTED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Shortlisted
        </span>
      );
    case 'INTERVIEW_SCHEDULED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Interview Scheduled
        </span>
      );
    case 'INTERVIEWED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
          Interviewed
        </span>
      );
    case 'SELECTED':
    case 'OFFER_RECEIVED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Offer Received
        </span>
      );
    case 'JOINED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-900 font-semibold whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
          Placed
        </span>
      );
    case 'REJECTED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          Rejected
        </span>
      );
  }
};

export const HelpStatusBadge: React.FC<{ status?: HelpStatus } & BadgeProps> = ({ status = 'NONE', className = '', id }) => {
  switch (status) {
    case 'HELP_REQUESTED':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
          Help Requested
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Help In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Help Resolved
        </span>
      );
    default:
      return null;
  }
};

export const HealthStatusBadge: React.FC<{ status: HealthStatus; rate?: number } & BadgeProps> = ({ status, rate, className = '', id }) => {
  switch (status) {
    case 'GREEN':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Healthy {rate !== undefined ? `${rate}%` : '(≥ 60%)'}
        </span>
      );
    case 'YELLOW':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Needs Attention {rate !== undefined ? `${rate}%` : '(50-59%)'}
        </span>
      );
    case 'RED':
      return (
        <span id={id} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/60 whitespace-nowrap ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Critical {rate !== undefined ? `${rate}%` : '(< 50%)'}
        </span>
      );
  }
};

export const MatchVerdictBadge: React.FC<{ verdict: MatchVerdict; score: number } & BadgeProps> = ({ verdict, score, className = '', id }) => {
  switch (verdict) {
    case 'MATCHED':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 whitespace-nowrap ${className}`}>
          {score}% Match
        </span>
      );
    case 'PARTIALLY_MATCHED':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50 whitespace-nowrap ${className}`}>
          {score}% Match
        </span>
      );
    case 'NOT_MATCHED':
      return (
        <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap ${className}`}>
          {score}% Match
        </span>
      );
  }
};

export const RoleBadge: React.FC<{ role: UserRole } & BadgeProps> = ({ role, className = '', id }) => {
  switch (role) {
    case 'MAIN_ADMIN':
      return (
        <span id={id} className={`px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap ${className}`}>
          Administrator
        </span>
      );
    case 'PLACEMENT_OFFICER':
      return (
        <span id={id} className={`px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap ${className}`}>
          Placement Officer
        </span>
      );
    case 'MANAGEMENT':
      return (
        <span id={id} className={`px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100 whitespace-nowrap ${className}`}>
          Management
        </span>
      );
    case 'STUDENT':
      return (
        <span id={id} className={`px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap ${className}`}>
          Candidate
        </span>
      );
  }
};
