// ──────────────────────────────────────────────────────────────────────────────
// Certifications Section — Resume Editor
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { ResumeCertification, generateId } from '../types';
import { ChevronDown, ChevronRight, Award, Plus, Trash2, Edit3 } from 'lucide-react';

interface Props {
  certifications: ResumeCertification[];
  onChange: (certifications: ResumeCertification[]) => void;
}

export const CertificationsSection: React.FC<Props> = ({ certifications, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1";

  const add = () => {
    const c: ResumeCertification = { id: generateId('cert'), name: '', issuingOrganization: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' };
    onChange([...certifications, c]);
    setEditingId(c.id);
    setExpanded(true);
  };

  const update = (id: string, field: keyof ResumeCertification, value: string) => {
    onChange(certifications.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const remove = (id: string) => {
    onChange(certifications.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><Award className="w-3.5 h-3.5 text-rose-600" /></div>
          <span className="text-sm font-bold text-slate-800">Certifications</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{certifications.length}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {certifications.map(cert => (
            <div key={cert.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 truncate">{cert.name || 'New Certification'}</h4>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditingId(editingId === cert.id ? null : cert.id)} className="p-1 text-slate-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => remove(cert.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {editingId === cert.id && (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><label className={labelClass}>Certification Name</label><input type="text" className={inputClass} value={cert.name} onChange={e => update(cert.id, 'name', e.target.value)} placeholder="e.g. AWS Cloud Practitioner" /></div>
                    <div><label className={labelClass}>Issuing Organization</label><input type="text" className={inputClass} value={cert.issuingOrganization} onChange={e => update(cert.id, 'issuingOrganization', e.target.value)} placeholder="e.g. Amazon Web Services" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><label className={labelClass}>Issue Date</label><input type="month" className={inputClass} value={cert.issueDate} onChange={e => update(cert.id, 'issueDate', e.target.value)} /></div>
                    <div><label className={labelClass}>Credential URL</label><input type="url" className={inputClass} value={cert.credentialUrl} onChange={e => update(cert.id, 'credentialUrl', e.target.value)} placeholder="https://..." /></div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={add} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Certification
          </button>
        </div>
      )}
    </div>
  );
};
