// ──────────────────────────────────────────────────────────────────────────────
// Education Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeEducation, generateId } from '../types';
import { ChevronDown, ChevronRight, GraduationCap, Plus, Trash2, Edit3 } from 'lucide-react';

interface Props {
  education: ResumeEducation[];
  onChange: (education: ResumeEducation[]) => void;
}

const emptyEdu = (): ResumeEducation => ({
  id: generateId('edu'),
  degree: '',
  fieldOfStudy: '',
  institution: '',
  location: '',
  startDate: '',
  endDate: '',
  gpa: '',
  relevantCoursework: '',
  additionalDetails: '',
});

export const EducationSection: React.FC<Props> = ({ education, onChange }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1";

  const addEducation = () => {
    const newEdu = emptyEdu();
    onChange([...education, newEdu]);
    setEditingId(newEdu.id);
  };

  const updateEdu = (id: string, field: keyof ResumeEducation, value: string) => {
    onChange(education.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const deleteEdu = (id: string) => {
    onChange(education.filter(e => e.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">Education</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{education.length}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {education.map(edu => (
            <div key={edu.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 truncate">
                  {edu.degree || edu.fieldOfStudy || edu.institution || 'New Education'}
                  {edu.institution && edu.fieldOfStudy && ` — ${edu.institution}`}
                </h4>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditingId(editingId === edu.id ? null : edu.id)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteEdu(edu.id)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingId === edu.id && (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Degree</label>
                      <input type="text" className={inputClass} value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="e.g. B.Tech" />
                    </div>
                    <div>
                      <label className={labelClass}>Field of Study</label>
                      <input type="text" className={inputClass} value={edu.fieldOfStudy} onChange={e => updateEdu(edu.id, 'fieldOfStudy', e.target.value)} placeholder="e.g. Computer Science" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Institution</label>
                      <input type="text" className={inputClass} value={edu.institution} onChange={e => updateEdu(edu.id, 'institution', e.target.value)} placeholder="e.g. HACA" />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input type="text" className={inputClass} value={edu.location} onChange={e => updateEdu(edu.id, 'location', e.target.value)} placeholder="e.g. Bangalore, India" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input type="month" className={inputClass} value={edu.startDate} onChange={e => updateEdu(edu.id, 'startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>End Date</label>
                      <input type="month" className={inputClass} value={edu.endDate} onChange={e => updateEdu(edu.id, 'endDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>GPA / CGPA</label>
                      <input type="text" className={inputClass} value={edu.gpa} onChange={e => updateEdu(edu.id, 'gpa', e.target.value)} placeholder="e.g. 8.5" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Relevant Coursework</label>
                    <input type="text" className={inputClass} value={edu.relevantCoursework} onChange={e => updateEdu(edu.id, 'relevantCoursework', e.target.value)} placeholder="e.g. Data Structures, Machine Learning, Web Development" />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addEducation}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Education
          </button>
        </div>
      )}
    </div>
  );
};
