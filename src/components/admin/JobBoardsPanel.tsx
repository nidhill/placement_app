import React, { useEffect, useState } from 'react';
import { Briefcase, Loader2, Play, Save, CheckCircle2, AlertTriangle, CalendarClock, Wallet, KeyRound } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { ApifyScraperConfig, ApifyFetchResult, ApifyUsage } from '../../types.ts';

// Which boards to scrape through Apify, for which roles and cities, how
// often, within what budget, and from which Apify account. The scheduled run
// and the "Run now" button both use these settings. Only the Main Admin can
// change them; placement officers see them and can run now.
const BOARDS: Array<{ key: string; label: string; note: string }> = [
  { key: 'linkedin', label: 'LinkedIn', note: 'Jobs search, India' },
  { key: 'indeed', label: 'Indeed', note: 'in.indeed.com' },
  { key: 'glassdoor', label: 'Glassdoor', note: 'via job-board scraper' },
  { key: 'naukri', label: 'Naukri', note: 'naukri.com, freshers' },
];

const toList = (s: string) => s.split(/[,\n]/).map(x => x.trim()).filter(Boolean);

const hourLabel = (h: number) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;
const EVERY: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Every day' }, { value: 2, label: 'Every 2 days' }, { value: 3, label: 'Every 3 days' },
  { value: 7, label: 'Once a week' }, { value: 14, label: 'Every 2 weeks' },
];
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');

export const JobBoardsPanel: React.FC<{ canRun: boolean; canEdit?: boolean }> = ({ canRun, canEdit = false }) => {
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
  const [enabled, setEnabled] = useState(true);
  const [everyDays, setEveryDays] = useState(1);
  const [runHourIst, setRunHourIst] = useState(2);
  const [budget, setBudget] = useState('');
  const [newToken, setNewToken] = useState('');
  const [usage, setUsage] = useState<ApifyUsage | null>(null);

  const loadUsage = () => api.getApifyUsage().then(setUsage).catch(() => {});

  useEffect(() => {
    loadUsage();
    api.getApifyConfig().then(c => {
      setEnabled(c.isEnabled !== false);
      setEveryDays(c.everyDays || 1);
      setRunHourIst(Number.isInteger(c.runHourIst) ? (c.runHourIst as number) : 2);
      setBudget(c.monthlyBudgetUsd ? String(c.monthlyBudgetUsd) : '');
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
      const c = await api.updateApifyConfig({
        boards, searchTerms: toList(terms), locations: toList(locations), maxPerSource, hoursOld,
        isEnabled: enabled, everyDays, runHourIst, monthlyBudgetUsd: Number(budget) || 0,
        ...(newToken.trim() ? { apiToken: newToken.trim() } : {}),
      });
      setCfg(c); setSavedAt(Date.now()); setNewToken('');
      loadUsage();
    } catch (e: any) { setError(e?.message || 'Could not save'); }
    finally { setSaving(false); }
  };

  const runNow = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      if (canEdit) await save();
      const r = await api.fetchApifyJobs();
      setResult(r);
      loadUsage();
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
            <p className="text-[11px] text-slate-500">Scraped through Apify on the schedule below. India jobs only; duplicates skipped. Apify charges about $0.005 per job scraped — keep "posted within" short so only fresh listings are fetched.</p>
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
                <input type="checkbox" checked={boards.includes(b.key)} disabled={!canEdit} onChange={() => toggle(b.key)} className="accent-[#1E50FF]" />
                <span className="text-xs"><span className="font-semibold text-foreground">{b.label}</span><span className="block text-[10px] text-slate-400">{b.note}</span></span>
              </label>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max jobs per board</label>
              <input id="apify-max" type="number" min={1} max={100} value={maxPerSource} disabled={!canEdit} onChange={e => setMaxPerSource(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Posted within</label>
              <select value={hoursOld} disabled={!canEdit} onChange={e => setHoursOld(Number(e.target.value))} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs disabled:opacity-60">
                <option value={24}>24 hours</option><option value={72}>3 days</option><option value={168}>7 days</option><option value={360}>15 days</option>
              </select>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Search terms <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <textarea value={terms} disabled={!canEdit} onChange={e => setTerms(e.target.value)} rows={3} className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs resize-none disabled:opacity-60" placeholder="Frontend Developer, Data Analyst, UI UX Designer…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Locations</label>
            <input value={locations} disabled={!canEdit} onChange={e => setLocations(e.target.value)} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs disabled:opacity-60" placeholder="Kochi, Bangalore, Chennai…" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-border/70">
        <div className="space-y-3">
          <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-primary" /><span className="text-xs font-semibold text-foreground">Schedule</span></div>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input id="apify-enabled" type="checkbox" checked={enabled} disabled={!canEdit} onChange={e => setEnabled(e.target.checked)} className="accent-[#1E50FF]" />
            Scrape automatically
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="apify-every" className="block text-xs font-medium text-slate-700 mb-1">How often</label>
              <select id="apify-every" value={everyDays} disabled={!canEdit || !enabled} onChange={e => setEveryDays(Number(e.target.value))} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs disabled:opacity-60">
                {EVERY.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="apify-hour" className="block text-xs font-medium text-slate-700 mb-1">At (India time)</label>
              <select id="apify-hour" value={runHourIst} disabled={!canEdit || !enabled} onChange={e => setRunHourIst(Number(e.target.value))} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs disabled:opacity-60">
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {enabled ? <>Next run: <span className="font-semibold text-foreground">{fmtDate(usage?.nextRun)}</span>. Run now counts as a run.</> : 'Automatic scraping is off. Run now still works.'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /><span className="text-xs font-semibold text-foreground">Apify account & budget</span></div>
          {usage?.connected ? (
            <div className="rounded-xl border border-border px-3 py-2 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground truncate">{usage.account}{usage.username ? <span className="font-normal text-slate-400"> · {usage.username}</span> : null}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{usage.tokenSource === 'settings' ? 'token set here' : 'server token'}</span>
              </div>
              {usage.limitUsd ? (
                <>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${(usage.usedUsd || 0) >= usage.limitUsd ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, ((usage.usedUsd || 0) / usage.limitUsd) * 100)}%` }} />
                  </div>
                  <div className="text-slate-500">${usage.usedUsd} of ${usage.limitUsd} used this cycle{usage.cycleEnd ? ` · resets ${new Date(usage.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</div>
                </>
              ) : <div className="text-slate-500">${usage.usedUsd} used this cycle</div>}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{usage?.error || 'Checking the Apify account…'}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="apify-budget" className="block text-xs font-medium text-slate-700 mb-1">Monthly budget ($)</label>
              <input id="apify-budget" type="number" min={0} step="0.5" value={budget} disabled={!canEdit} onChange={e => setBudget(e.target.value)} placeholder="No limit" className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs disabled:opacity-60" />
            </div>
            {canEdit && (
              <div>
                <label htmlFor="apify-token" className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><KeyRound className="w-3 h-3" />Apify token</label>
                <input id="apify-token" type="password" autoComplete="off" value={newToken} onChange={e => setNewToken(e.target.value)} placeholder={cfg?.apiTokenSet ? `Set here · ends ${cfg.apiTokenLast4}` : 'Using the server token'} className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            When this Apify account has spent the budget this cycle, no run starts until it resets.
            {canEdit && cfg?.apiTokenSet && <> <button type="button" className="text-primary underline" onClick={async () => { const c = await api.updateApifyConfig({ clearApiToken: true }); setCfg(c); loadUsage(); }}>Use the server token instead</button></>}
          </p>
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
          {(() => { const runs = Math.max(1, Math.ceil(toList(terms).length / 5)) * Math.max(1, toList(locations).length); const cap = runs * boards.length * maxPerSource; const perMonth = enabled ? Math.ceil(30 / everyDays) : 0; return `Up to ${cap.toLocaleString()} jobs per run (${runs} Apify run${runs > 1 ? 's' : ''}) ≈ $${(cap * 0.005).toFixed(2)} max${perMonth ? `, ${perMonth} scheduled runs a month ≈ $${(cap * 0.005 * perMonth).toFixed(2)} max` : ''} — usually far less with a short "posted within".`; })()}
          {savedAt ? ' · Saved' : ''}
        </span>
        <div className="flex items-center gap-2">
          {canEdit && <button onClick={save} disabled={saving || running} className="px-3 py-1.5 rounded-lg border border-border bg-white text-slate-700 hover:bg-muted text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
          </button>}
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
