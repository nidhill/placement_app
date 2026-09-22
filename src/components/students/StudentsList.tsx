import React, { useState, useEffect } from 'react';
import { StudentProfile, EligibilityStatus, ApplicationStatus, JobApplication } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { EligibilityBadge, ApplicationStatusBadge } from '../common/StatusBadge.tsx';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Briefcase,
  User as UserIcon
} from 'lucide-react';

interface StudentsListProps {
  onRefreshData?: () => void;
  initialSelectedStudent?: StudentProfile | null;
}

export const StudentsList: React.FC<StudentsListProps> = ({
  onRefreshData,
  initialSelectedStudent
}) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL');
  const [placementStatusFilter, setPlacementStatusFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(initialSelectedStudent || null);
  const [extractedResume, setExtractedResume] = useState<any>(null);

  useEffect(() => {
    if (initialSelectedStudent) {
      setSelectedStudent(initialSelectedStudent);
    }
  }, [initialSelectedStudent]);

  useEffect(() => {
    if (selectedStudent) {
      try {
        const data = localStorage.getItem(`extracted_resume_${selectedStudent.id}`);
        if (data) {
          setExtractedResume(JSON.parse(data));
        } else {
          setExtractedResume(null);
        }
      } catch {
        setExtractedResume(null);
      }
    } else {
      setExtractedResume(null);
    }
  }, [selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studRes, appRes] = await Promise.all([
        api.getStudents(),
        api.getApplications()
      ]);
      setStudents(studRes.students);
      setApplications(appRes.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute student stats helper
  const getStudentPlacementData = (studentId: string) => {
    const studentApps = applications.filter(a => a.studentId === studentId);
    const interviewCount = studentApps.filter(a => a.status === 'INTERVIEW' || (a.interviewRounds && a.interviewRounds.length > 0)).length;
    
    let statusLabel = 'Seeking';
    let statusBadgeColor = 'bg-muted text-slate-700 border-border';

    if (studentApps.some(a => a.status === 'JOINED')) {
      statusLabel = 'Placed';
      statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (studentApps.some(a => a.status === 'OFFER')) {
      statusLabel = 'Offered';
      statusBadgeColor = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (studentApps.some(a => a.status === 'INTERVIEW')) {
      statusLabel = 'Interviewing';
      statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (studentApps.some(a => a.status === 'SHORTLISTED' || a.status === 'APPLIED')) {
      statusLabel = 'In Pipeline';
      statusBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return {
      appCount: studentApps.length,
      interviewCount,
      statusLabel,
      statusBadgeColor
    };
  };

  const programs = Array.from(new Set(students.map(s => s.program).filter(Boolean)));
  const batches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));

  const filteredStudents = students.filter(s => {
    const pData = getStudentPlacementData(s.id);

    if (schoolFilter !== 'ALL' && s.school !== schoolFilter) return false;
    if (programFilter !== 'ALL' && s.program !== programFilter) return false;
    if (batchFilter !== 'ALL' && s.batch !== batchFilter) return false;
    if (eligibilityFilter !== 'ALL' && s.eligibilityStatus !== eligibilityFilter) return false;
    if (placementStatusFilter !== 'ALL' && pData.statusLabel !== placementStatusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchReg = s.registrationNo.toLowerCase().includes(q);
      const matchProg = s.program.toLowerCase().includes(q);
      const matchSkill = s.academic.skills.some(sk => sk.toLowerCase().includes(q));
      if (!matchName && !matchReg && !matchProg && !matchSkill) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Students</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {students.length} total students enrolled · {students.filter(s => s.eligibilityStatus === 'ELIGIBLE' || s.eligibilityStatus === 'ADMIN_OVERRIDE').length} eligible for placement
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students, skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
            />
          </div>

          {/* School Filter */}
          <div className="relative">
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="appearance-none bg-white border border-border text-slate-700 text-xs py-1.5 pl-2.5 pr-6 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="ALL">All Schools</option>
              <option value="School of Tech">School of Tech</option>
              <option value="School of Design">School of Design</option>
              <option value="School of Marketing">School of Marketing</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Program Filter */}
          <div className="relative">
            <select
              value={programFilter}
              onChange={e => setProgramFilter(e.target.value)}
              className="appearance-none bg-white border border-border text-slate-700 text-xs py-1.5 pl-2.5 pr-6 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer max-w-[130px] truncate"
            >
              <option value="ALL">All Programs</option>
              {programs.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Batch Filter */}
          <div className="relative">
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="appearance-none bg-white border border-border text-slate-700 text-xs py-1.5 pl-2.5 pr-6 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {batches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Eligibility Filter */}
          <div className="relative">
            <select
              value={eligibilityFilter}
              onChange={e => setEligibilityFilter(e.target.value)}
              className="appearance-none bg-white border border-border text-slate-700 text-xs py-1.5 pl-2.5 pr-6 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="ALL">All Eligibility</option>
              <option value="ELIGIBLE">Eligible</option>
              <option value="PENDING_MENTOR_APPROVAL">Pending Review</option>
              <option value="NOT_ELIGIBLE">Not Ready</option>
              <option value="ADMIN_OVERRIDE">Admin Override</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Placement Status Filter */}
          <div className="relative">
            <select
              value={placementStatusFilter}
              onChange={e => setPlacementStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-border text-slate-700 text-xs py-1.5 pl-2.5 pr-6 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="ALL">All Placement Status</option>
              <option value="Placed">Placed</option>
              <option value="Offered">Offered</option>
              <option value="Interviewing">Interviewing</option>
              <option value="In Pipeline">In Pipeline</option>
              <option value="Seeking">Seeking</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Clean Spacious Students Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 border-b border-border text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Eligibility</th>
                <th className="py-3 px-4 text-center">Applications</th>
                <th className="py-3 px-4 text-center">Interviews</th>
                <th className="py-3 px-4">Placement Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const pData = getStudentPlacementData(student.id);
                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => setSelectedStudent(student)}
                      className="hover:bg-muted/60 transition-colors cursor-pointer group"
                    >
                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-semibold text-slate-700 text-xs shrink-0">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                              {student.fullName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {student.registrationNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{student.program}</div>
                        <div className="text-[11px] text-slate-400">{student.school}</div>
                      </td>

                      {/* Batch */}
                      <td className="py-3 px-4 text-slate-600">
                        {student.batch}
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${student.academic.attendancePercentage >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {student.academic.attendancePercentage}%
                          </span>
                        </div>
                      </td>

                      {/* Eligibility status */}
                      <td className="py-3 px-4">
                        <EligibilityBadge status={student.eligibilityStatus} />
                      </td>

                      {/* Applications count */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          pData.appCount > 0 ? 'bg-muted text-slate-800' : 'text-slate-400'
                        }`}>
                          {pData.appCount}
                        </span>
                      </td>

                      {/* Interviews count */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          pData.interviewCount > 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-400'
                        }`}>
                          {pData.interviewCount}
                        </span>
                      </td>

                      {/* Placement Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${pData.statusBadgeColor}`}>
                          {pData.statusLabel}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-foreground bg-muted hover:bg-secondary rounded-md transition-colors inline-flex items-center gap-1.5"
                          title="Open Student Profile"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>Student Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT PROFILE ACADEMIC RECORD MODAL / DRAWER */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-border/70 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-slate-800 text-sm">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Student Profile Record</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-base font-bold text-foreground">{selectedStudent.fullName}</h3>
                    <EligibilityBadge status={selectedStudent.eligibilityStatus} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedStudent.program} · {selectedStudent.batch} · {selectedStudent.school}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      {selectedStudent.registrationNo}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {selectedStudent.email}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedStudent.phone}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              
              {/* 1. Academic Overview */}
              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3 text-slate-400">
                  Academic Overview
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted rounded-lg border border-border/70">
                    <span className="text-[11px] text-slate-400 block">Academic Progress</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudent.academic.scores.gpaOrPercentage}%
                    </span>
                  </div>

                  <div className="p-3 bg-muted rounded-lg border border-border/70">
                    <span className="text-[11px] text-slate-400 block">Attendance</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudent.academic.attendancePercentage}%
                    </span>
                  </div>

                  <div className="p-3 bg-muted rounded-lg border border-border/70">
                    <span className="text-[11px] text-slate-400 block">Assignments</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudent.academic.scores.assignmentsCompleted} / {selectedStudent.academic.scores.totalAssignments}
                    </span>
                  </div>

                  <div className="p-3 bg-muted rounded-lg border border-border/70">
                    <span className="text-[11px] text-slate-400 block">Capstone Project</span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {selectedStudent.academic.scores.capstoneScore ? `${selectedStudent.academic.scores.capstoneScore}%` : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Skills pills */}
                <div className="mt-3">
                  <span className="text-[11px] text-slate-400 block mb-1.5">Acquired Technical Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.academic.skills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-muted text-slate-700 text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Placement Checklist */}
              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3 text-slate-400">
                  Placement Checklist
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/60">
                    <div className="flex items-center gap-2 text-slate-800">
                      {(selectedStudent.resumeUrl || selectedStudent.resumeDataUrl || selectedStudent.resumeFileName) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span>Verified Resume & Portfolio</span>
                    </div>
                    {(selectedStudent.resumeUrl || selectedStudent.resumeDataUrl) && (
                      <a 
                        href={selectedStudent.resumeDataUrl || selectedStudent.resumeUrl} 
                        download={selectedStudent.resumeFileName || `${selectedStudent.fullName.replace(/\s+/g, '_')}_CV.pdf`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        {selectedStudent.resumeFileName ? `CV: ${selectedStudent.resumeFileName}` : 'View Resume'} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/60">
                    <div className="flex items-center gap-2 text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Required Curriculum Competencies</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">Met</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/60">
                    <div className="flex items-center gap-2 text-slate-800">
                      {selectedStudent.academic.projects.length > 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span>Capstone Projects Portfolio</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {selectedStudent.academic.projects.filter(p => p.status === 'COMPLETED').length} Completed
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/60">
                    <div className="flex items-center gap-2 text-slate-800">
                      {selectedStudent.eligibilityStatus === 'ELIGIBLE' || selectedStudent.eligibilityStatus === 'ADMIN_OVERRIDE' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span>Placement Eligibility Clearance</span>
                    </div>
                    <span className="text-slate-700 text-[11px] font-semibold">
                      {selectedStudent.eligibilityStatus === 'ELIGIBLE' || selectedStudent.eligibilityStatus === 'ADMIN_OVERRIDE' ? 'Approved for Placement' : 'Pending Evaluation'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Project Submissions */}
              <div>
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3 text-slate-400">
                  Projects
                </h4>
                <div className="space-y-2">
                  {selectedStudent.academic.projects.map(proj => (
                    <div key={proj.id} className="p-3 rounded-lg border border-border/70 bg-muted/60 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{proj.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{proj.description}</div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          proj.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CV Document Preview */}
              {(selectedStudent.resumeDataUrl || selectedStudent.resumeUrl) && (
                <div>
                  <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] mb-3 text-slate-400">
                    Uploaded Resume Document
                  </h4>
                  <div className="p-2 rounded-xl border border-border/70 bg-muted/30 shadow-sm h-[500px]">
                    <iframe
                      src={selectedStudent.resumeDataUrl || selectedStudent.resumeUrl}
                      className="w-full h-full rounded-lg bg-white"
                      title="CV Preview"
                    />
                  </div>
                </div>
              )}

              {/* Evaluation remarks */}
              {selectedStudent.evaluationNotes && (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-amber-900">
                  <span className="font-semibold block text-[11px]">Evaluation Remarks:</span>
                  <p className="mt-0.5 text-xs text-amber-800">{selectedStudent.evaluationNotes}</p>
                </div>
              )}

              {/* Admin Direct Action for Testing Phase */}
              <div className="p-3 rounded-xl border border-border bg-muted text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Admin Eligibility Review:</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-medium">Testing Phase Workflow</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={async () => {
                      await api.setAdminStudentEligibility(selectedStudent.id, true, 'Approved by Admin');
                      await loadData();
                      setSelectedStudent(prev => prev ? { ...prev, eligibilityStatus: 'ELIGIBLE' as any } : null);
                      if (onRefreshData) onRefreshData();
                    }}
                    className="flex-1 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Approve Placement Eligibility
                  </button>
                  <button
                    onClick={async () => {
                      await api.setAdminStudentEligibility(selectedStudent.id, false, 'Marked not eligible by Admin');
                      await loadData();
                      setSelectedStudent(prev => prev ? { ...prev, eligibilityStatus: 'NOT_ELIGIBLE' as any } : null);
                      if (onRefreshData) onRefreshData();
                    }}
                    className="py-1.5 px-3 bg-white border border-rose-200 text-rose-700 rounded-lg font-medium hover:bg-rose-50 transition-colors"
                  >
                    Mark Not Eligible
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 border-t border-border/70 bg-muted/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Evaluation Authority: <strong className="text-slate-700">Main Admin</strong>
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Close Record
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
