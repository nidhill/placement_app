import React, { useState, useEffect } from 'react';
import { JobApplication } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Building2, 
  User, 
  Search,
  ExternalLink
} from 'lucide-react';

interface InterviewsScheduleProps {
  onRefreshData?: () => void;
}

export const InterviewsSchedule: React.FC<InterviewsScheduleProps> = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
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
    loadData();
  }, []);

  // Collect all interview rounds
  const allInterviews: Array<{
    appId: string;
    studentName: string;
    program: string;
    batch: string;
    jobTitle: string;
    company: string;
    round: number;
    title: string;
    date: string;
    completed: boolean;
  }> = [];

  applications.forEach(app => {
    if (app.interviewDates && app.interviewDates.length > 0) {
      app.interviewDates.forEach(iv => {
        allInterviews.push({
          appId: app.id,
          studentName: app.studentName,
          program: app.program,
          batch: app.batch,
          jobTitle: app.jobTitle,
          company: app.company,
          round: iv.round,
          title: iv.title,
          date: iv.date,
          completed: iv.completed
        });
      });
    }
  });

  const filteredInterviews = allInterviews.filter(iv => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        iv.studentName.toLowerCase().includes(q) ||
        iv.company.toLowerCase().includes(q) ||
        iv.jobTitle.toLowerCase().includes(q) ||
        iv.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Interview Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active recruiter evaluations, technical assessments, and interview rounds
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search interviews..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Grid of interview cards or list */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Employer & Role</th>
                <th className="py-3 px-4">Interview Round</th>
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No scheduled interviews found.
                  </td>
                </tr>
              ) : (
                filteredInterviews.map((iv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{iv.studentName}</div>
                      <div className="text-[11px] text-slate-400">{iv.program} · {iv.batch}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium">{iv.jobTitle}</div>
                      <div className="text-[11px] text-slate-500">{iv.company}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {iv.title} (Round {iv.round})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(iv.date).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {iv.completed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded">
                          Scheduled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
