import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, RejectionCategory, HelpStatus } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { ApplicationStatusBadge, SourceChannelBadge, HelpStatusBadge } from '../common/StatusBadge.tsx';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  ChevronDown,
  UserCheck,
  FileText,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  Check
} from 'lucide-react';

interface ApplicationsTrackerProps {
  onRefreshData?: () => void;
}

export const ApplicationsTracker: React.FC<ApplicationsTrackerProps> = ({ onRefreshData }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [helpFilter, setHelpFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail modal
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<JobApplication | null>(null);

  // Interview modal
  const [selectedAppForInterview, setSelectedAppForInterview] = useState<JobApplication | null>(null);
  const [interviewRoundTitle, setInterviewRoundTitle] = useState('Technical Screening Round 1');
  const [interviewDate, setInterviewDate] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Rejection modal
  const [selectedAppForRejection, setSelectedAppForRejection] = useState<JobApplication | null>(null);
  const [rejectionCategory, setRejectionCategory] = useState<RejectionCategory>('TECHNICAL_SKILL_GAP');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [remedialAction, setRemedialAction] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.getApplications();
      setApplications(res.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleUpdateHelpStatus = async (appId: string, helpStatus: HelpStatus) => {
    try {
      await api.updateHelpStatus(appId, helpStatus);
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to update help status: ${err.message}`);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForInterview || !interviewDate) return;
    setScheduling(true);
    try {
      await api.scheduleInterview(selectedAppForInterview.id, {
        round: (selectedAppForInterview.interviewDates?.length || 0) + 1,
        title: interviewRoundTitle,
        date: new Date(interviewDate).toISOString()
      });
      setSelectedAppForInterview(null);
      setInterviewDate('');
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to schedule interview: ${err.message}`);
    } finally {
      setScheduling(false);
    }
  };

  const handleSubmitRejectionFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForRejection) return;
    setSubmittingFeedback(true);
    try {
      await api.submitRejectionFeedback(selectedAppForRejection.id, {
        category: rejectionCategory,
        details: rejectionNotes || 'Feedback noted during debrief.',
        remedialActionNeeded: remedialAction || 'Follow-up remedial coaching session.'
      });
      setSelectedAppForRejection(null);
      setRejectionNotes('');
      setRemedialAction('');
      loadApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to submit feedback: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Pipeline counts
  const countStarted = applications.filter(a => a.status === 'APPLICATION_STARTED').length;
  const countApplied = applications.filter(a => a.status === 'APPLIED').length;
  const countNotApplied = applications.filter(a => a.status === 'NOT_APPLIED').length;
  const countShortlisted = applications.filter(a => a.status === 'SHORTLISTED').length;
  const countInterview = applications.filter(a => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEWED').length;
  const countOffer = applications.filter(a => a.status === 'OFFER_RECEIVED' || a.status === 'SELECTED').length;
  const countPlaced = applications.filter(a => a.status === 'JOINED').length;
  const countHelpRequested = applications.filter(a => a.needsHelp || (a.helpStatus && a.helpStatus !== 'NONE' && a.helpStatus !== 'RESOLVED')).length;

  const filteredApps = applications.filter(a => {
    if (stageFilter !== 'ALL') {
      if (stageFilter === 'APPLICATION_STARTED' && a.status !== 'APPLICATION_STARTED') return false;
      if (stageFilter === 'APPLIED' && a.status !== 'APPLIED') return false;
      if (stageFilter === 'NOT_APPLIED' && a.status !== 'NOT_APPLIED') return false;
      if (stageFilter === 'SHORTLISTED' && a.status !== 'SHORTLISTED') return false;
      if (stageFilter === 'INTERVIEW' && a.status !== 'INTERVIEW_SCHEDULED' && a.status !== 'INTERVIEWED') return false;
      if (stageFilter === 'OFFER' && a.status !== 'OFFER_RECEIVED' && a.status !== 'SELECTED') return false;
      if (stageFilter === 'JOINED' && a.status !== 'JOINED') return false;
    }

    if (helpFilter !== 'ALL') {
      if (helpFilter === 'HELP_REQUESTED' && a.helpStatus !== 'HELP_REQUESTED' && (!a.needsHelp || a.helpStatus === 'RESOLVED')) return false;
      if (helpFilter === 'IN_PROGRESS' && a.helpStatus !== 'IN_PROGRESS') return false;
      if (helpFilter === 'RESOLVED' && a.helpStatus !== 'RESOLVED') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.studentName.toLowerCase().includes(q);
      const matchJob = a.jobTitle.toLowerCase().includes(q);
      const matchComp = a.company.toLowerCase().includes(q);
      const matchReason = a.declineReason ? a.declineReason.toLowerCase().includes(q) : false;
      if (!matchName && !matchJob && !matchComp && !matchReason) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Application Pipeline & External Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor student external job application progress, decline feedback, and assist students needing placement support.
          </p>
        </div>
      </div>

      {/* Action Required Banner for Help Requests */}
      {countHelpRequested > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-xs">
                {countHelpRequested} Student Placement Help Request{countHelpRequested > 1 ? 's' : ''} Pending
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Students flagged that they need assistance with eligibility, resume, or portal issues while applying.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setHelpFilter('HELP_REQUESTED');
              setStageFilter('ALL');
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
          >
            View Pending Help Requests
          </button>
        </div>
      )}

      {/* Pipeline Stage Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <button
          onClick={() => setStageFilter(stageFilter === 'APPLICATION_STARTED' ? 'ALL' : 'APPLICATION_STARTED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stageFilter === 'APPLICATION_STARTED' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'APPLICATION_STARTED' ? 'text-amber-400' : 'text-slate-500'}`}>
            Started
          </span>
          <span className="text-xl font-black mt-1 block">
            {countStarted}
          </span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'APPLIED' ? 'ALL' : 'APPLIED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stageFilter === 'APPLIED' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'APPLIED' ? 'text-blue-400' : 'text-slate-500'}`}>
            Applied
          </span>
          <span className="text-xl font-black mt-1 block">
            {countApplied}
          </span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'NOT_APPLIED' ? 'ALL' : 'NOT_APPLIED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stageFilter === 'NOT_APPLIED' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'NOT_APPLIED' ? 'text-rose-400' : 'text-slate-500'}`}>
            Not Applied
          </span>
          <span className="text-xl font-black mt-1 block text-rose-600">
            {countNotApplied}
          </span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'SHORTLISTED' ? 'ALL' : 'SHORTLISTED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stageFilter === 'SHORTLISTED' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'SHORTLISTED' ? 'text-indigo-400' : 'text-slate-500'}`}>
            Shortlisted
          </span>
          <span className="text-xl font-black mt-1 block">
            {countShortlisted}
          </span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'INTERVIEW' ? 'ALL' : 'INTERVIEW')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stageFilter === 'INTERVIEW' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'INTERVIEW' ? 'text-purple-400' : 'text-slate-500'}`}>
            Interview
          </span>
          <span className="text-xl font-black mt-1 block">
            {countInterview}
          </span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'OFFER' ? 'ALL' : 'OFFER')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stageFilter === 'OFFER' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'OFFER' ? 'text-emerald-400' : 'text-slate-500'}`}>
            Offer
          </span>
          <span className="text-xl font-black mt-1 block text-emerald-600">
            {countOffer}
          </span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'JOINED' ? 'ALL' : 'JOINED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stageFilter === 'JOINED' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] uppercase font-bold block ${stageFilter === 'JOINED' ? 'text-emerald-400' : 'text-slate-500'}`}>
            Placed
          </span>
          <span className="text-xl font-black mt-1 block text-emerald-700">
            {countPlaced}
          </span>
        </button>
      </div>

      {/* Filters Bar: Search, Stage Filter, Help Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, job, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
            />
          </div>

          <select
            value={helpFilter}
            onChange={e => setHelpFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Help Statuses</option>
            <option value="HELP_REQUESTED">⚠ Help Requested</option>
            <option value="IN_PROGRESS">🔄 Help In Progress</option>
            <option value="RESOLVED">✅ Help Resolved</option>
          </select>
        </div>

        {(stageFilter !== 'ALL' || helpFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setStageFilter('ALL');
              setHelpFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Job Opportunity</th>
                <th className="py-3 px-4">Status & Help State</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No applications match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Candidate */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.studentName}</div>
                      <div className="text-[11px] text-slate-400">{app.program} · {app.batch}</div>
                    </td>

                    {/* Job */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-bold">{app.jobTitle}</div>
                      <div className="text-[11px] text-slate-500">{app.company}</div>
                    </td>

                    {/* Status dropdown & Help badge */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          value={app.status}
                          onChange={e => handleUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                        >
                          <option value="APPLICATION_STARTED">Application Started</option>
                          <option value="APPLIED">Applied</option>
                          <option value="NOT_APPLIED">Not Applied</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                          <option value="INTERVIEWED">Interviewed</option>
                          <option value="OFFER_RECEIVED">Offer Received</option>
                          <option value="JOINED">Placed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>

                      {app.helpStatus && app.helpStatus !== 'NONE' && (
                        <div className="pt-0.5">
                          <HelpStatusBadge status={app.helpStatus} />
                        </div>
                      )}
                    </td>

                    {/* Reason / Notes */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.declineReason ? (
                        <div className="space-y-0.5 max-w-xs">
                          <span className="font-semibold text-rose-900 block text-[11px]">
                            {app.declineReason.replace(/_/g, ' ')}
                          </span>
                          {app.studentComment && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                              "{app.studentComment}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {app.status === 'APPLIED' ? `Applied ${new Date(app.appliedAt).toLocaleDateString()}` : '—'}
                        </span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4">
                      <SourceChannelBadge channel={app.sourceChannel} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSelectedAppForDetail(app)}
                          title="View application audit details"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Help status management buttons */}
                        {app.needsHelp && app.helpStatus === 'HELP_REQUESTED' && (
                          <button
                            onClick={() => handleUpdateHelpStatus(app.id, 'IN_PROGRESS')}
                            className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer"
                          >
                            In Progress
                          </button>
                        )}

                        {app.needsHelp && app.helpStatus === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateHelpStatus(app.id, 'RESOLVED')}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAppForInterview(app)}
                          title="Schedule interview round"
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          Interview
                        </button>

                        {app.status === 'REJECTED' && (
                          <button
                            onClick={() => setSelectedAppForRejection(app)}
                            title="Submit rejection diagnostic feedback"
                            className="px-2 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                          >
                            Feedback
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedAppForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Audit Details</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedAppForDetail.jobTitle}</h3>
                <p className="text-xs text-slate-500">{selectedAppForDetail.company} · Candidate: <strong>{selectedAppForDetail.studentName}</strong></p>
              </div>
              <button
                onClick={() => setSelectedAppForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Status</span>
                  <div className="mt-1">
                    <ApplicationStatusBadge status={selectedAppForDetail.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Placement Support</span>
                  <div className="mt-1">
                    {selectedAppForDetail.helpStatus && selectedAppForDetail.helpStatus !== 'NONE' ? (
                      <HelpStatusBadge status={selectedAppForDetail.helpStatus} />
                    ) : (
                      <span className="text-slate-500 text-[11px]">No help requested</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedAppForDetail.declineReason && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-bold text-rose-950 block text-xs">Decline Reason:</span>
                  <p className="text-rose-900 font-semibold">{selectedAppForDetail.declineReason.replace(/_/g, ' ')}</p>
                  {selectedAppForDetail.studentComment && (
                    <p className="text-slate-700 italic text-[11px] pt-1">
                      "{selectedAppForDetail.studentComment}"
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                {selectedAppForDetail.startedAt && (
                  <div>• Application Started: <strong>{new Date(selectedAppForDetail.startedAt).toLocaleString()}</strong></div>
                )}
                {selectedAppForDetail.confirmedAt && (
                  <div>• Candidate Confirmed Applied: <strong>{new Date(selectedAppForDetail.confirmedAt).toLocaleString()}</strong></div>
                )}
                <div>• Initial Record Date: <strong>{new Date(selectedAppForDetail.appliedAt).toLocaleString()}</strong></div>
                {selectedAppForDetail.applicationUrl && (
                  <div className="pt-1">
                    • External Apply Link: {' '}
                    <a
                      href={selectedAppForDetail.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline font-semibold hover:text-blue-900"
                    >
                      View Job Portal ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedAppForDetail.needsHelp && selectedAppForDetail.helpStatus !== 'RESOLVED' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleUpdateHelpStatus(selectedAppForDetail.id, selectedAppForDetail.helpStatus === 'IN_PROGRESS' ? 'RESOLVED' : 'IN_PROGRESS');
                      setSelectedAppForDetail(null);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {selectedAppForDetail.helpStatus === 'IN_PROGRESS' ? 'Mark Resolved' : 'Take Request (In Progress)'}
                  </button>
                </div>
              ) : <div></div>}

              <button
                onClick={() => setSelectedAppForDetail(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {selectedAppForInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleScheduleInterview}>
              <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Schedule Interview Round</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAppForInterview(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="font-semibold text-slate-900">{selectedAppForInterview.studentName}</div>
                  <div className="text-slate-500 mt-0.5">{selectedAppForInterview.jobTitle} · {selectedAppForInterview.company}</div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Interview Round Title</label>
                  <input
                    type="text"
                    required
                    value={interviewRoundTitle}
                    onChange={e => setInterviewRoundTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={interviewDate}
                    onChange={e => setInterviewDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="p-4 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAppForInterview(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION FEEDBACK MODAL */}
      {selectedAppForRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSubmitRejectionFeedback}>
              <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Mandatory Rejection Feedback</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAppForRejection(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100 text-rose-900">
                  <div className="font-semibold">{selectedAppForRejection.studentName}</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">{selectedAppForRejection.jobTitle} at {selectedAppForRejection.company}</div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reason Category</label>
                  <select
                    value={rejectionCategory}
                    onChange={e => setRejectionCategory(e.target.value as RejectionCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="TECHNICAL_SKILL_GAP">Technical Skill Gap</option>
                    <option value="COMMUNICATION_GAP">Communication Gap</option>
                    <option value="PROJECT_GAP">Project Gap</option>
                    <option value="EXPERIENCE_GAP">Experience Gap</option>
                    <option value="EXPECTATION_MISMATCH">Expectation Mismatch</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Interview Debrief Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate struggled with system design questions..."
                    value={rejectionNotes}
                    onChange={e => setRejectionNotes(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Recommended Remedial Action</label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule mock technical interview or coding workshop"
                    value={remedialAction}
                    onChange={e => setRemedialAction(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="p-4 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAppForRejection(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-1.5 rounded-lg bg-rose-700 text-white font-medium hover:bg-rose-800 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
