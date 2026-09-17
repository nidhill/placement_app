import React, { useState, useEffect } from 'react';
import { ManagementKPIs, StudentProfile, JobListing, JobApplication, User } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { NavigationItem } from '../common/Sidebar.tsx';
import { EligibilityBadge } from '../common/StatusBadge.tsx';
import { 
  Users, 
  Briefcase, 
  FileCheck2, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  FileCheck, 
  ShieldCheck, 
  AlertCircle,
  X,
  Search,
  Check,
  Ban,
  User as UserIcon,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';

interface MainAdminDashboardProps {
  currentUser?: User;
  onNavigate: (tab: NavigationItem) => void;
  onRefreshData?: () => void;
}

export const MainAdminDashboard: React.FC<MainAdminDashboardProps> = ({
  currentUser,
  onNavigate,
  onRefreshData
}) => {
  const [kpis, setKpis] = useState<ManagementKPIs | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Student Eligibility Management Modal
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
      console.error('Failed to load Main Admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStudentEligibility = async (student: StudentProfile, makeEligible: boolean) => {
    setUpdatingId(student.id);
    setStatusMessage(null);
    try {
      await api.setAdminStudentEligibility(
        student.id,
        makeEligible,
        makeEligible ? 'Approved for placement by Main Admin (Testing Phase)' : 'Marked not eligible by Main Admin'
      );
      setStatusMessage(`Updated ${student.fullName}'s status to ${makeEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE'}`);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || !kpis) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading Main Admin placement control dashboard...
      </div>
    );
  }

  // Exact KPIs required for Main Admin:
  // Total Students, Eligible Students, Active Jobs, Applications, Interviews, Students Placed, Overall Placement Rate
  const totalStudents = students.length;
  const eligibleStudents = students.filter(s => s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE').length;
  const pendingEligibilityCount = students.filter(s => s.eligibilityStatus === 'PENDING_MENTOR_APPROVAL' || s.eligibilityStatus === 'NOT_ELIGIBLE').length;
  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
  const totalApplications = applications.length;
  const totalInterviews = applications.filter(a => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEWED' || (a.interviewDates && a.interviewDates.length > 0)).length;
  const studentsPlaced = applications.filter(a => a.status === 'JOINED' || a.status === 'SELECTED').length;
  const placementRate = eligibleStudents > 0 ? Math.round((studentsPlaced / eligibleStudents) * 100) : (kpis.overallPlacementRate ?? 0);

  // Trend data points for clean SVG
  const trendPoints = [
    { month: 'Jan', rate: 28 },
    { month: 'Feb', rate: 38 },
    { month: 'Mar', rate: 46 },
    { month: 'Apr', rate: 54 },
    { month: 'May', rate: 62 },
    { month: 'Jun', rate: placementRate },
  ];

  const filteredModalStudents = students.filter(s => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.registrationNo.toLowerCase().includes(q) || s.program.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header & Temporary Testing Workflow Banner */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Main Admin Placement Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Executive authority & institutional placement control
            </p>
          </div>

          {/* Important Action: Student Eligibility */}
          <button
            onClick={() => setIsEligibilityModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Manage Student Eligibility</span>
            {pendingEligibilityCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold">
                {pendingEligibilityCount}
              </span>
            )}
          </button>
        </div>

        {/* Notice Banner: Testing Phase Workflow */}
        <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Placement Eligibility Review:</span>{' '}
            Student placement eligibility is directly reviewed and administered by Main Admin during this testing phase.
          </div>
        </div>
      </div>

      {/* 2. Seven Core KPIs for Main Admin */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        
        {/* 1. Total Students */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Students</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{totalStudents}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" /> All Schools
          </div>
        </div>

        {/* 2. Eligible Students */}
        <div 
          onClick={() => setIsEligibilityModalOpen(true)}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Eligible Students</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{eligibleStudents}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {Math.round((eligibleStudents / (totalStudents || 1)) * 100)}% of cohort
          </div>
        </div>

        {/* 3. Active Jobs */}
        <div 
          onClick={() => onNavigate('jobs')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Jobs</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{activeJobs}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">
            Open postings
          </div>
        </div>

        {/* 4. Applications */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Applications</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{totalApplications}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            Total candidate submissions
          </div>
        </div>

        {/* 5. Interviews */}
        <div 
          onClick={() => onNavigate('interviews')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Interviews</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{totalInterviews}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-1">
            Scheduled rounds
          </div>
        </div>

        {/* 6. Students Placed */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Placed</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{studentsPlaced}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            Confirmed offers
          </div>
        </div>

        {/* 7. Overall Placement Rate */}
        <div 
          onClick={() => onNavigate('analytics')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Placement Rate</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{placementRate}%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Target ≥ 60%
          </div>
        </div>

      </div>

      {/* 3. Performance Trend & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Placement Performance Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Placement Performance Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Progress toward the 60% institutional target</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Institutional Status: Healthy ({placementRate}%)
            </span>
          </div>

          <div className="h-44 w-full relative flex items-end pt-6 pb-2">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="10" x2="500" y2="10" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* Target 60% Line */}
              <line x1="0" y1="48" x2="500" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
              <text x="6" y="44" fill="#94a3b8" fontSize="9" fontWeight="600">60% Target</text>

              <polyline
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                points={trendPoints.map((p, i) => `${(i / (trendPoints.length - 1)) * 480 + 10},${120 - (p.rate * 1.2)}`).join(' ')}
              />

              {trendPoints.map((p, i) => {
                const x = (i / (trendPoints.length - 1)) * 480 + 10;
                const y = 120 - (p.rate * 1.2);
                return (
                  <g key={p.month}>
                    <circle cx={x} cy={y} r="3.5" fill="#0f172a" />
                    <text x={x} y={y - 8} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">
                      {p.rate}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 px-2">
            {trendPoints.map(p => (
              <span key={p.month}>{p.month}</span>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Key Administrative Actions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Administrative Actions</h3>
            <p className="text-xs text-slate-400 mt-0.5">High-priority operational workflows</p>
          </div>

          <div className="divide-y divide-slate-100 mt-3 text-xs">
            
            {/* Student Eligibility */}
            <div 
              onClick={() => setIsEligibilityModalOpen(true)}
              className="py-3 flex items-center justify-between group hover:bg-slate-50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Student Eligibility Review</div>
                  <div className="text-[11px] text-slate-400">{pendingEligibilityCount} students pending access</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Inactive Eligible Candidates */}
            <div 
              onClick={() => onNavigate('students')}
              className="py-3 flex items-center justify-between group hover:bg-slate-50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Eligible But Inactive Students</div>
                  <div className="text-[11px] text-slate-400">12 students have not applied yet</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Interview Updates */}
            <div 
              onClick={() => onNavigate('interviews')}
              className="py-3 flex items-center justify-between group hover:bg-slate-50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Interview Outcomes Pending</div>
                  <div className="text-[11px] text-slate-400">7 rounds awaiting final verdict</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Rejection Feedback Required */}
            <div 
              onClick={() => onNavigate('applications')}
              className="py-3 flex items-center justify-between group hover:bg-slate-50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Rejection Feedback Tracking</div>
                  <div className="text-[11px] text-slate-400">4 cases requiring skill gap logging</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('reports')}
              className="w-full py-1.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              View Full Academic Audit Report →
            </button>
          </div>
        </div>

      </div>

      {/* 4. Student Placement Eligibility Modal (Main Admin Testing Workflow) */}
      {isEligibilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Student Placement Eligibility</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    Testing Phase Direct Control
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Main Admin can grant or revoke placement portal access directly.
                </p>
              </div>
              <button
                onClick={() => setIsEligibilityModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Toast */}
            {statusMessage && (
              <div className="px-5 py-2 bg-emerald-50 text-emerald-800 text-xs border-b border-emerald-100 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Search Bar */}
            <div className="p-3 px-5 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students by name, reg #, or program..."
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 text-xs">
              {filteredModalStudents.map(student => {
                const isEligible = student.eligibilityStatus === 'ELIGIBLE' || student.eligibilityStatus === 'ADMIN_OVERRIDE';
                const isUpdating = updatingId === student.id;

                return (
                  <div key={student.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{student.fullName}</span>
                        <span className="text-[11px] text-slate-400">({student.registrationNo})</span>
                        <EligibilityBadge status={student.eligibilityStatus} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {student.school} · {student.program} · {student.batch}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Attendance: <span className="font-medium text-slate-700">{student.academic.attendancePercentage}%</span> · 
                        GPA: <span className="font-medium text-slate-700">{student.academic.scores.gpaOrPercentage}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors"
                        title="View Full Student Profile"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Profile</span>
                      </button>

                      {isEligible ? (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggleStudentEligibility(student, false)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Mark Not Eligible</span>
                        </button>
                      ) : (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggleStudentEligibility(student, true)}
                          className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approve for Placement</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 px-5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{filteredModalStudents.length} candidate profiles available</span>
              <button
                onClick={() => setIsEligibilityModalOpen(false)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 font-medium"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STUDENT PROFILE MODAL FOR ADMIN */}
      {selectedStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Student Profile Record</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-base font-bold text-slate-900">{selectedStudent.fullName}</h3>
                    <EligibilityBadge status={selectedStudent.eligibilityStatus} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedStudent.program} · {selectedStudent.batch} · {selectedStudent.school}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="font-mono">{selectedStudent.registrationNo}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedStudent.email}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedStudent.phone}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              
              {/* Academic Performance Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Attendance</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">{selectedStudent.academic.attendancePercentage}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Academic GPA</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">{selectedStudent.academic.scores.gpaOrPercentage}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Assignments</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                    {selectedStudent.academic.scores.assignmentsCompleted}/{selectedStudent.academic.scores.totalAssignments}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Capstone Score</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">{selectedStudent.academic.scores.capstoneScore || 88}%</span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Verified Technical Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.skills.map(skill => (
                    <span key={skill} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects */}
              {selectedStudent.academic.projects && selectedStudent.academic.projects.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Academic Projects</h4>
                  <div className="space-y-2">
                    {selectedStudent.academic.projects.map(proj => (
                      <div key={proj.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{proj.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-semibold text-slate-900">Portfolio & External Profiles</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                  {selectedStudent.resumeUrl ? (
                    <a href={selectedStudent.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Resume PDF
                    </a>
                  ) : <span className="text-slate-400">Resume: Not uploaded</span>}
                  {selectedStudent.portfolioUrl ? (
                    <a href={selectedStudent.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Portfolio
                    </a>
                  ) : <span className="text-slate-400">Portfolio: Not linked</span>}
                  {selectedStudent.linkedinUrl ? (
                    <a href={selectedStudent.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                  ) : <span className="text-slate-400">LinkedIn: Not linked</span>}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Main Admin Placement Evaluation</span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
