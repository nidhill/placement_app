// ──────────────────────────────────────────────────────────────────────────────
// Skills Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeSkills, SKILL_CATEGORY_LABELS } from '../types';
import { normalizeSkill } from '../resumeStore';
import { ChevronDown, ChevronRight, Code2, Plus, X } from 'lucide-react';

interface Props {
  skills: ResumeSkills;
  onChange: (skills: ResumeSkills) => void;
}

export const SkillsSection: React.FC<Props> = ({ skills, onChange }) => {
  const [expanded, setExpanded] = useState(true);
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});

  const totalSkills = Object.values(skills).flat().length;

  const addSkill = (category: keyof ResumeSkills) => {
    const raw = (newSkillInputs[category] || '').trim();
    if (!raw) return;

    // Check for duplicates across all categories
    const normalized = normalizeSkill(raw);
    const allSkills = Object.values(skills).flat();
    if (allSkills.some(s => normalizeSkill(s) === normalized)) return;

    const updated = { ...skills, [category]: [...skills[category], raw] };
    onChange(updated);
    setNewSkillInputs(prev => ({ ...prev, [category]: '' }));
  };

  const removeSkill = (category: keyof ResumeSkills, index: number) => {
    const updated = { ...skills, [category]: skills[category].filter((_, i) => i !== index) };
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: keyof ResumeSkills) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(category);
    }
  };

  const categoryColors: Record<string, string> = {
    programming: 'bg-blue-50 text-blue-700 border-blue-200',
    frameworks: 'bg-violet-50 text-violet-700 border-violet-200',
    ai_ml: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    generative_ai: 'bg-purple-50 text-purple-700 border-purple-200',
    databases: 'bg-amber-50 text-amber-700 border-amber-200',
    cloud: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    devops: 'bg-orange-50 text-orange-700 border-orange-200',
    tools: 'bg-slate-50 text-slate-700 border-slate-200',
    web_technologies: 'bg-rose-50 text-rose-700 border-rose-200',
    other: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">Skills</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{totalSkills}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {(Object.keys(SKILL_CATEGORY_LABELS) as (keyof ResumeSkills)[]).map(category => (
            <div key={category}>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {SKILL_CATEGORY_LABELS[category]}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills[category].map((skill, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md border ${categoryColors[category] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {skill}
                    <button type="button" onClick={() => removeSkill(category, i)} className="hover:text-red-600 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  value={newSkillInputs[category] || ''}
                  onChange={e => setNewSkillInputs(prev => ({ ...prev, [category]: e.target.value }))}
                  onKeyDown={e => handleKeyDown(e, category)}
                  placeholder={`Add ${SKILL_CATEGORY_LABELS[category].toLowerCase()} skill...`}
                />
                <button
                  type="button"
                  onClick={() => addSkill(category)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
