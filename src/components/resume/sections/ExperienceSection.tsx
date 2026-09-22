// ──────────────────────────────────────────────────────────────────────────────
// Experience Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeExperience, generateId } from '../types';
import { improveBullet, isAIConfigured } from '../aiService';
import { ChevronDown, ChevronRight, Briefcase, Plus, Trash2, Edit3, Wand2, Loader2, X } from 'lucide-react';

interface Props {
  experience: ResumeExperience[];
  onChange: (experience: ResumeExperience[]) => void;
}

const emptyExp = (): ResumeExperience => ({
  id: generateId('exp'),
  jobTitle: '',
  company: '',
  location: '',
  employmentType: 'Full-time',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  responsibilities: [''],
  achievements: [],
  technologies: [],
});

export const ExperienceSection: React.FC<Props> = ({ experience, onChange }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [improvingBullet, setImprovingBullet] = useState<string | null>(null);
  const [newTech, setNewTech] = useState<Record<string, string>>({});

  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1";

  const addExperience = () => {
    const newExp = emptyExp();
    onChange([...experience, newExp]);
    setEditingId(newExp.id);
  };

  const updateExp = (id: string, field: keyof ResumeExperience, value: any) => {
    onChange(experience.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const deleteExp = (id: string) => {
    onChange(experience.filter(e => e.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    const exp = experience.find(e => e.id === expId);
    if (!exp) return;
    const bullets = [...exp.responsibilities];
    bullets[bulletIndex] = value;
    updateExp(expId, 'responsibilities', bullets);
  };

  const addBullet = (expId: string) => {
    const exp = experience.find(e => e.id === expId);
    if (!exp) return;
    updateExp(expId, 'responsibilities', [...exp.responsibilities, '']);
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    const exp = experience.find(e => e.id === expId);
    if (!exp) return;
    updateExp(expId, 'responsibilities', exp.responsibilities.filter((_, i) => i !== bulletIndex));
  };

  const handleImproveBullet = async (expId: string, bulletIndex: number) => {
    const exp = experience.find(e => e.id === expId);
    if (!exp || !exp.responsibilities[bulletIndex]?.trim()) return;
    const bulletKey = `${expId}-${bulletIndex}`;
    setImprovingBullet(bulletKey);
    try {
      const improved = await improveBullet(exp.responsibilities[bulletIndex], {
        jobTitle: exp.jobTitle,
        company: exp.company,
        technologies: exp.technologies,
      });
      if (improved) updateBullet(expId, bulletIndex, improved);
    } catch { /* silent */ }
    finally { setImprovingBullet(null); }
  };

  const addTech = (expId: string) => {
    const val = (newTech[expId] || '').trim();
    if (!val) return;
    const exp = experience.find(e => e.id === expId);
    if (!exp || exp.technologies.includes(val)) return;
    updateExp(expId, 'technologies', [...exp.technologies, val]);
    setNewTech(prev => ({ ...prev, [expId]: '' }));
  };

  const removeTech = (expId: string, index: number) => {
    const exp = experience.find(e => e.id === expId);
    if (!exp) return;
    updateExp(expId, 'technologies', exp.technologies.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">Experience</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{experience.length}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {experience.map(exp => (
            <div key={exp.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 truncate">
                  {exp.jobTitle || 'New Experience'}{exp.company ? ` — ${exp.company}` : ''}
                </h4>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditingId(editingId === exp.id ? null : exp.id)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteExp(exp.id)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingId === exp.id && (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Job Title</label>
                      <input type="text" className={inputClass} value={exp.jobTitle} onChange={e => updateExp(exp.id, 'jobTitle', e.target.value)} placeholder="e.g. Software Engineer Intern" />
                    </div>
                    <div>
                      <label className={labelClass}>Company</label>
                      <input type="text" className={inputClass} value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} placeholder="e.g. TechCorp" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>Location</label>
                      <input type="text" className={inputClass} value={exp.location} onChange={e => updateExp(exp.id, 'location', e.target.value)} placeholder="e.g. Remote" />
                    </div>
                    <div>
                      <label className={labelClass}>Employment Type</label>
                      <select className={inputClass} value={exp.employmentType} onChange={e => updateExp(exp.id, 'employmentType', e.target.value)}>
                        <option>Full-time</option>
                        <option>Internship</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Freelance</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={exp.currentlyWorking} onChange={e => updateExp(exp.id, 'currentlyWorking', e.target.checked)} className="rounded" />
                        Currently Working
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input type="month" className={inputClass} value={exp.startDate} onChange={e => updateExp(exp.id, 'startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>End Date</label>
                      <input type="month" className={inputClass} value={exp.endDate} onChange={e => updateExp(exp.id, 'endDate', e.target.value)} disabled={exp.currentlyWorking} />
                    </div>
                  </div>

                  {/* Technologies */}
                  <div>
                    <label className={labelClass}>Technologies</label>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {exp.technologies.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded border border-blue-200">
                          {t}
                          <button type="button" onClick={() => removeTech(exp.id, i)}><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Add technology..."
                        value={newTech[exp.id] || ''}
                        onChange={e => setNewTech(prev => ({ ...prev, [exp.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(exp.id); } }}
                      />
                      <button type="button" onClick={() => addTech(exp.id)} className="px-2 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/5">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Responsibility Bullets */}
                  <div>
                    <label className={labelClass}>Responsibilities / Achievements</label>
                    {exp.responsibilities.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-1.5 mb-1.5">
                        <span className="mt-2.5 text-slate-400 text-[10px]">•</span>
                        <textarea
                          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          rows={2}
                          value={bullet}
                          onChange={e => updateBullet(exp.id, i, e.target.value)}
                          placeholder="Describe what you did..."
                        />
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {isAIConfigured() && (
                            <button
                              type="button"
                              onClick={() => handleImproveBullet(exp.id, i)}
                              disabled={improvingBullet === `${exp.id}-${i}` || !bullet.trim()}
                              className="p-1 text-violet-500 hover:text-violet-700 disabled:opacity-30 rounded"
                              title="AI Improve"
                            >
                              {improvingBullet === `${exp.id}-${i}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button type="button" onClick={() => removeBullet(exp.id, i)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => addBullet(exp.id)} className="text-[11px] text-primary font-semibold hover:underline mt-1">
                      + Add Bullet Point
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addExperience}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        </div>
      )}
    </div>
  );
};
