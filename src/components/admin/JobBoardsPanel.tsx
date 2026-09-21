import React, { useEffect, useState } from 'react';
import { Briefcase, Loader2, Play, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { ApifyScraperConfig, ApifyFetchResult } from '../../types.ts';

// Which boards to scrape through Apify, for which roles and cities. The
// nightly 2 AM run and the "Run now" button both use these settings.
const BOARDS: Array<{ key: string; label: string; note: string }> = [
  { key: 'linkedin', label: 'LinkedIn', note: 'Jobs search, India' },
  { key: 'indeed', label: 'Indeed', note: 'in.indeed.com' },
  { key: 'glassdoor', label: 'Glassdoor', note: 'via job-board scraper' },
  { key: 'naukri', label: 'Naukri', note: 'naukri.com, freshers' },
];

const toList = (s: string) => s.split(/[,\n]/).map(x => x.trim()).filter(Boolean);

export const JobBoardsPanel: React.FC<{ canRun: boolean }> = ({ canRun }) => {
  const [cfg, setCfg] = useState<ApifyScraperConfig | null>(null);
  const [boards, setBoards] = useState<string[]>([]);
  const [terms, setTerms] = useState('');
  const [locations, setLocations] = useState('');
  const [maxPerSource, setMaxPerSource] = useState(50);
  const [hoursOld, setHoursOld] = useState(168);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApifyFetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    api.getApifyConfig().then(c => {
      setCfg(c);
      setBoards(c.boards || ['linkedin', 'indeed', 'glassdoor', 'naukri']);
      setTerms((c.searchTerms || []).join(', '));
      setLocations((c.locations || []).join(', '));
      setMaxPerSource(c.maxPerSource || 50);
      setHoursOld(c.hoursOld || 168);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const c = await api.updateApifyConfig({ boards, searchTerms: toList(terms), locations: toList(locations), maxPerSource, hoursOld });
      setCfg(c); setSavedAt(Date.now());
    } catch (e: any) { setError(e?.message || 'Could not save'); }
    finally { setSaving(false); }
  };

  const runNow = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      await save();
      const r = await api.fetchApifyJobs({ limit: maxPerSource });
      setResult(r);
    } catch (e: any) { setError(e?.message || 'Run failed'); }
    finally { setRunning(false); }
  };

  const toggle = (k: string) => setBoards(b => (b.includes(k) ? b.filter(x => x !== k) : [...b, k]));

  return (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Job boards to scrape</h3>
            <p className="text-[11px] text-slate-500">Runs every night at 2:00 AM through Apify. India jobs only; duplicates skipped. Apify charges about $0.005 per job scraped — keep "posted within" at 24 hours for the nightly run so only fresh listings are fetched.</p>
          </div>
        </div>
        {cfg?.lastRunTimestamp && <span className="text-[11px] text-slate-400">Last run {new Date(cfg.lastRunTimestamp).toLocaleString('en-IN')}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Boards</label>
          <div className="grid grid-cols-2 gap-2">
            {BOARDS.map(b => (
              <label key={b.key} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${boards.includes(b.key) ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted'}`}>
                <input type="checkbox" checked={boards.includes(b.key)} onChange={() => toggle(b.key)} className="accent-[#1E50FF]" />
                <span className="text-xs"><span className="font-semibold text-foreground">{b.label}</span><span className="block text-[10px] text-slate-400">{b.note}</span></span>
              </label>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max jobs per board</label>
              <input type="number" min={10} max={100} value={maxPerSource} onChange={e => setMaxPerSource(Math.min(100, Number(e.target.value) || 50))} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Posted within</label>
              <select value={hoursOld} onChange={e => setHoursOld(Number(e.target.value))} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs">
                <option value={24}>24 hours</option><option value={72}>3 days</option><option value={168}>7 days</option><option value={360}>15 days</option>
              </select>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Search terms <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3} className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs resize-none" placeholder="Frontend Developer, Data Analyst, UI UX Designer…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Locations</label>
            <input value={locations} onChange={e => setLocations(e.target.value)} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs" placeholder="Kochi, Bangalore, Chennai…" />
          </div>
        </div>
      </div>

      {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{error}</div>}
      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
          <div className="flex items-center gap-1.5 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Run finished — {result.newIngested} new jobs added, {result.duplicatesCount} already known, {result.totalReceived} received</div>
          {Array.isArray((result as any).sources) && (
            <ul className="mt-1.5 space-y-0.5">
              {(result as any).sources.map((s: any, i: number) => <li key={i}>{s.ok ? '✓' : '✗'} {s.label}: {s.ok ? `${s.usable} jobs${s.stale ? `, ${s.stale} older than 30 days skipped` : ''} (${Math.round(s.ms / 1000)}s)` : s.error}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/70">
        <span className="text-[11px] text-slate-400">
          {(() => { const runs = Math.max(1, Math.ceil(toList(terms).length / 5)) * Math.max(1, toList(locations).length); const cap = runs * boards.length * maxPerSource; return `Up to ${cap.toLocaleString()} jobs per run (${runs} Apify run${runs > 1 ? 's' : ''}) ≈ $${(cap * 0.005).toFixed(2)} max — usually far less with a short "posted within".`; })()}
          {savedAt ? ' · Saved' : ''}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving || running} className="px-3 py-1.5 rounded-lg border border-border bg-white text-slate-700 hover:bg-muted text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
          </button>
          {canRun && (
            <button onClick={runNow} disabled={running || saving || boards.length === 0} className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50" title="Runs the scrapers now (takes 1–4 minutes)">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}{running ? 'Scraping…' : 'Run now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
