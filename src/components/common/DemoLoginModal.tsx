import React from 'react';
import { UserRole } from '../../types.ts';
import { Shield, Briefcase, BarChart3, GraduationCap } from 'lucide-react';

interface DemoLoginModalProps {
  isOpen: boolean;
  onSelectRole: (role: UserRole) => void;
  onClose?: () => void;
}

export const DemoLoginModal: React.FC<DemoLoginModalProps> = ({
  isOpen,
  onSelectRole,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-7 text-center">
        
        {/* Institute Crest & Title */}
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4 shadow-xs">
          <GraduationCap className="w-6 h-6" />
        </div>

        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          HACA Placement Platform
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Choose a demo role
        </p>

        {/* 4 Demo Roles Exact List */}
        <div className="space-y-2.5">
          <button
            onClick={() => onSelectRole('MAIN_ADMIN')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-900 group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-sm">Main Admin</span>
            </div>
            <span className="text-[11px] font-normal text-slate-400 group-hover:text-slate-600">Full System Access</span>
          </button>

          <button
            onClick={() => onSelectRole('PLACEMENT_OFFICER')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-900 group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-sm">Placement Officer</span>
            </div>
            <span className="text-[11px] font-normal text-slate-400 group-hover:text-slate-600">Operations & Matching</span>
          </button>

          <button
            onClick={() => onSelectRole('MANAGEMENT')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-900 group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-sm">Management</span>
            </div>
            <span className="text-[11px] font-normal text-slate-400 group-hover:text-slate-600">Executive Analytics</span>
          </button>

          <button
            onClick={() => onSelectRole('STUDENT')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-900 group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-sm">Student</span>
            </div>
            <span className="text-[11px] font-normal text-slate-400 group-hover:text-slate-600">Candidate Portal</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="mt-5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        )}

      </div>
    </div>
  );
};
