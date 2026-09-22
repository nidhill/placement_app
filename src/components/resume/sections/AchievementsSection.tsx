// ──────────────────────────────────────────────────────────────────────────────
// Achievements Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeAchievement, generateId } from '../types';
import { ChevronDown, ChevronRight, Trophy, Plus, Trash2, Edit3 } from 'lucide-react';

interface Props {
  achievements: ResumeAchievement[];
  onChange: (achievements: ResumeAchievement[]) => void;
}

export const AchievementsSection: React.FC<Props> = ({ achievements, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1";

  const add = () => {
    const a: ResumeAchievement = { id: generateId('ach'), title: '', description: '', date: '', organization: '' };
    onChange([...achievements, a]);
    setEditingId(a.id);
    setExpanded(true);
  };

  const update = (id: string, field: keyof ResumeAchievement, value: string) => {
    onChange(achievements.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const remove = (id: string) => {
    onChange(achievements.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center"><Trophy className="w-3.5 h-3.5 text-yellow-600" /></div>
          <span className="text-sm font-bold text-slate-800">Achievements</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{achievements.length}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {achievements.map(ach => (
            <div key={ach.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 truncate">{ach.title || 'New Achievement'}</h4>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditingId(editingId === ach.id ? null : ach.id)} className="p-1 text-slate-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => remove(ach.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {editingId === ach.id && (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><label className={labelClass}>Title</label><input type="text" className={inputClass} value={ach.title} onChange={e => update(ach.id, 'title', e.target.value)} placeholder="e.g. Hackathon Winner" /></div>
                    <div><label className={labelClass}>Organization</label><input type="text" className={inputClass} value={ach.organization} onChange={e => update(ach.id, 'organization', e.target.value)} placeholder="e.g. HACA" /></div>
                  </div>
                  <div><label className={labelClass}>Description</label><input type="text" className={inputClass} value={ach.description} onChange={e => update(ach.id, 'description', e.target.value)} placeholder="Brief description..." /></div>
                  <div><label className={labelClass}>Date</label><input type="month" className={inputClass} value={ach.date} onChange={e => update(ach.id, 'date', e.target.value)} /></div>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={add} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Achievement
          </button>
        </div>
      )}
    </div>
  );
};
