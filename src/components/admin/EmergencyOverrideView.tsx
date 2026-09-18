import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { EligibilityBadge } from '../common/StatusBadge.tsx';
import { ShieldAlert, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

interface EmergencyOverrideViewProps {
  onRefreshData?: () => void;
}

export const EmergencyOverrideView: React.FC<EmergencyOverrideViewProps> = ({ onRefreshData }) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents();
      setStudents(res.students);
      if (res.students.length > 0) {
        setSelectedStudentId(res.students[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !reason.trim()) return;
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await api.emergencyEligibilityOverride(selectedStudentId, {
        overrideReason: reason.trim()
      });
      setSuccessMessage(res.message);
      setReason('');
      loadStudents();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentSelectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Emergency Overrides & Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Admin authority to grant placement portal access under verified extenuating circumstances
        </p>
      </div>

      {/* Override Tool */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 max-w-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Student Placement Clearance Override</h3>
            <p className="text-xs text-slate-500">Every override is logged permanently in the system audit trail.</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleApplyOverride} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Select Student</label>
            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground appearance-none pr-8 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.registrationNo}) · {s.program} · Status: {s.eligibilityStatus}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {currentSelectedStudent && (
            <div className="p-3 bg-muted rounded-lg border border-border/70 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Current Status</span>
                <div className="mt-1">
                  <EligibilityBadge status={currentSelectedStudent.eligibilityStatus} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Attendance & Progress</span>
                <span className="font-semibold text-slate-800 text-xs mt-1 block">
                  {currentSelectedStudent.academic.attendancePercentage}% att. · {currentSelectedStudent.academic.scores.gpaOrPercentage}% GPA
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Mandatory Override Justification</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Approved by Academic Board due to industry freelance portfolio and medical attendance waiver."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-xs"
            >
              {submitting ? 'Applying Override...' : 'Execute Admin Override'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
