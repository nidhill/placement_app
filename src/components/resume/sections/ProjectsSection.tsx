// ──────────────────────────────────────────────────────────────────────────────
// Projects Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeProject, generateId } from '../types';
import { improveProjectDescription, isAIConfigured } from '../aiService';
import { ChevronDown, ChevronRight, FolderGit2, Plus, Trash2, Edit3, Wand2, Loader2, X } from 'lucide-react';

interface Props {
  projects: ResumeProject[];
  onChange: (projects: ResumeProject[]) => void;
}

const emptyProject = (): ResumeProject => ({
  id: generateId('proj'),
  name: '',
  description: '',
  technologies: [],
  role: '',
  githubUrl: '',
  liveDemoUrl: '',
  startDate: '',
  endDate: '',
  highlights: [],
});

export const ProjectsSection: React.FC<Props> = ({ projects, onChange }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const [newTech, setNewTech] = useState<Record<string, string>>({});

  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1";

  const addProject = () => {
    const p = emptyProject();
    onChange([...projects, p]);
    setEditingId(p.id);
  };

  const updateProj = (id: string, field: keyof ResumeProject, value: any) => {
    onChange(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deleteProj = (id: string) => {
    onChange(projects.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addTech = (projId: string) => {
    const val = (newTech[projId] || '').trim();
    if (!val) return;
    const proj = projects.find(p => p.id === projId);
    if (!proj || proj.technologies.includes(val)) return;
    updateProj(projId, 'technologies', [...proj.technologies, val]);
    setNewTech(prev => ({ ...prev, [projId]: '' }));
  };

  const removeTech = (projId: string, index: number) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    updateProj(projId, 'technologies', proj.technologies.filter((_, i) => i !== index));
  };

  const handleImproveDescription = async (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj || !proj.description.trim()) return;
    setImprovingId(projId);
    try {
      const improved = await improveProjectDescription(proj.description, { name: proj.name, technologies: proj.technologies });
      if (improved) updateProj(projId, 'description', improved);
    } catch { /* silent */ }
    finally { setImprovingId(null); }
  };

  const addHighlight = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    updateProj(projId, 'highlights', [...proj.highlights, '']);
  };

  const updateHighlight = (projId: string, index: number, value: string) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    const h = [...proj.highlights];
    h[index] = value;
    updateProj(projId, 'highlights', h);
  };

  const removeHighlight = (projId: string, index: number) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    updateProj(projId, 'highlights', proj.highlights.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <FolderGit2 className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">Projects</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{projects.length}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {projects.map(proj => (
            <div key={proj.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 truncate">{proj.name || 'New Project'}</h4>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditingId(editingId === proj.id ? null : proj.id)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteProj(proj.id)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingId === proj.id && (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Project Name</label>
                      <input type="text" className={inputClass} value={proj.name} onChange={e => updateProj(proj.id, 'name', e.target.value)} placeholder="e.g. RAG Chatbot" />
                    </div>
                    <div>
                      <label className={labelClass}>Your Role</label>
                      <input type="text" className={inputClass} value={proj.role} onChange={e => updateProj(proj.id, 'role', e.target.value)} placeholder="e.g. Lead Developer" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={3}
                      value={proj.description}
                      onChange={e => updateProj(proj.id, 'description', e.target.value)}
                      placeholder="Describe the project..."
                    />
                    {isAIConfigured() && (
                      <button
                        type="button"
                        onClick={() => handleImproveDescription(proj.id)}
                        disabled={improvingId === proj.id || !proj.description.trim()}
                        className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-40 transition-all"
                      >
                        {improvingId === proj.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        AI Improve Description
                      </button>
                    )}
                  </div>

                  {/* Technologies */}
                  <div>
                    <label className={labelClass}>Technologies</label>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {proj.technologies.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-700 rounded border border-teal-200">
                          {t}
                          <button type="button" onClick={() => removeTech(proj.id, i)}><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Add technology..."
                        value={newTech[proj.id] || ''}
                        onChange={e => setNewTech(prev => ({ ...prev, [proj.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(proj.id); } }}
                      />
                      <button type="button" onClick={() => addTech(proj.id)} className="px-2 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/5">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>GitHub URL</label>
                      <input type="url" className={inputClass} value={proj.githubUrl} onChange={e => updateProj(proj.id, 'githubUrl', e.target.value)} placeholder="https://github.com/..." />
                    </div>
                    <div>
                      <label className={labelClass}>Live Demo URL</label>
                      <input type="url" className={inputClass} value={proj.liveDemoUrl} onChange={e => updateProj(proj.id, 'liveDemoUrl', e.target.value)} placeholder="https://..." />
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <label className={labelClass}>Key Highlights</label>
                    {proj.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5 mb-1.5">
                        <span className="mt-2.5 text-slate-400 text-[10px]">•</span>
                        <input
                          type="text"
                          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                          value={h}
                          onChange={e => updateHighlight(proj.id, i, e.target.value)}
                          placeholder="Key achievement or highlight..."
                        />
                        <button type="button" onClick={() => removeHighlight(proj.id, i)} className="p-1 text-slate-400 hover:text-red-500 mt-0.5">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addHighlight(proj.id)} className="text-[11px] text-primary font-semibold hover:underline mt-1">
                      + Add Highlight
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addProject}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>
      )}
    </div>
  );
};
