// ──────────────────────────────────────────────────────────────────────────────
// Personal Information Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumePersonalInfo } from '../types';
import { ChevronDown, ChevronRight, User, MapPin, Globe, Linkedin, Github } from 'lucide-react';

interface Props {
  data: ResumePersonalInfo;
  onChange: (data: ResumePersonalInfo) => void;
}

export const PersonalInfoSection: React.FC<Props> = ({ data, onChange }) => {
  const [expanded, setExpanded] = useState(true);

  const update = (field: keyof ResumePersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">Personal Information</span>
          {(!data.fullName || !data.email || !data.targetRole) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">Required</span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
              <input type="text" className={inputClass} value={data.fullName} onChange={e => update('fullName', e.target.value)} placeholder="e.g. Alex Thomas" />
            </div>
            <div>
              <label className={labelClass}>Target Role <span className="text-red-500">*</span></label>
              <input type="text" className={inputClass} value={data.targetRole} onChange={e => update('targetRole', e.target.value)} placeholder="e.g. Full Stack Developer" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input type="email" className={inputClass} value={data.email} onChange={e => update('email', e.target.value)} placeholder="alex@example.com" />
            </div>
            <div>
              <label className={labelClass}>Phone <span className="text-red-500">*</span></label>
              <input type="tel" className={inputClass} value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 9876543210" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input type="text" className={inputClass} value={data.city} onChange={e => update('city', e.target.value)} placeholder="e.g. Bangalore" />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input type="text" className={inputClass} value={data.state} onChange={e => update('state', e.target.value)} placeholder="e.g. Karnataka" />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" className={inputClass} value={data.country} onChange={e => update('country', e.target.value)} placeholder="e.g. India" />
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Professional Links
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}><Linkedin className="w-3 h-3 inline -mt-0.5 mr-1" />LinkedIn</label>
                <input type="url" className={inputClass} value={data.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className={labelClass}><Github className="w-3 h-3 inline -mt-0.5 mr-1" />GitHub</label>
                <input type="url" className={inputClass} value={data.github} onChange={e => update('github', e.target.value)} placeholder="https://github.com/..." />
              </div>
              <div>
                <label className={labelClass}>Portfolio</label>
                <input type="url" className={inputClass} value={data.portfolio} onChange={e => update('portfolio', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Other Link</label>
                <input type="url" className={inputClass} value={data.otherLink} onChange={e => update('otherLink', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
