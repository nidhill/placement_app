// ──────────────────────────────────────────────────────────────────────────────
// Languages Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeLanguage, generateId } from '../types';
import { ChevronDown, ChevronRight, Languages, Plus, Trash2 } from 'lucide-react';

interface Props {
  languages: ResumeLanguage[];
  onChange: (languages: ResumeLanguage[]) => void;
}

const PROFICIENCY_OPTIONS = ['Native', 'Professional', 'Conversational', 'Basic'];

export const LanguagesSection: React.FC<Props> = ({ languages, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  const add = () => {
    onChange([...languages, { id: generateId('lang'), language: '', proficiency: 'Professional' }]);
    setExpanded(true);
  };

  const update = (id: string, field: keyof ResumeLanguage, value: string) => {
    onChange(languages.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const remove = (id: string) => {
    onChange(languages.filter(l => l.id !== id));
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center"><Languages className="w-3.5 h-3.5 text-sky-600" /></div>
          <span className="text-sm font-bold text-slate-800">Languages</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{languages.length}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
          {languages.map(lang => (
            <div key={lang.id} className="flex items-center gap-2">
              <input type="text" className={`${inputClass} flex-1`} value={lang.language} onChange={e => update(lang.id, 'language', e.target.value)} placeholder="e.g. English" />
              <select className={`${inputClass} w-40`} value={lang.proficiency} onChange={e => update(lang.id, 'proficiency', e.target.value)}>
                {PROFICIENCY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="button" onClick={() => remove(lang.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={add} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Language
          </button>
        </div>
      )}
    </div>
  );
};
