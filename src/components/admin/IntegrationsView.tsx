import React, { useState, useEffect } from 'react';
import { LmsSyncConfig, ApifyScraperConfig, ApifyConnectionStatus, AtsSyncConfig, AtsConnectionStatus } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { 
  Database, 
  Bot, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Check, 
  AlertTriangle,
  Globe2
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [lmsConfig, setLmsConfig] = useState<LmsSyncConfig | null>(null);
  const [scraperConfig, setScraperConfig] = useState<ApifyScraperConfig | null>(null);
  const [apifyStatus, setApifyStatus] = useState<ApifyConnectionStatus | null>(null);
  const [atsConfig, setAtsConfig] = useState<AtsSyncConfig | null>(null);
  const [atsStatus, setAtsStatus] = useState<AtsConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Actions state
  const [syncingLms, setSyncingLms] = useState(false);
  const [testingApify, setTestingApify] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [testingAts, setTestingAts] = useState(false);
  const [syncingAts, setSyncingAts] = useState(false);

  // Feedback notifications
  const [lmsMessage, setLmsMessage] = useState<string | null>(null);
  const [apifyNotice, setApifyNotice] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    details?: string;
    stats?: { received: number; newJobs: number; duplicates: number; invalid: number };
  } | null>(null);
  const [atsNotice, setAtsNotice] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    details?: string;
    stats?: { received: number; newJobs: number; duplicates: number; invalid: number };
  } | null>(null);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [lmsRes, scraperRes, statusRes, atsCfgRes, atsStatRes] = await Promise.all([
        api.getLmsConfig(),
        api.getScraperConfig(),
        api.getApifyStatus().catch(() => null),
        api.getAtsConfig().catch(() => null),
        api.getAtsStatus().catch(() => null)
      ]);
      setLmsConfig(lmsRes);
      setScraperConfig(scraperRes.config);
      setApifyStatus(statusRes);
      setAtsConfig(atsCfgRes);
      setAtsStatus(atsStatRes);
    } catch (err) {
      console.error('Failed to load integration configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleSyncLms = async () => {
    setSyncingLms(true);
    setLmsMessage(null);
    try {
      const res = await api.triggerLmsSync();
      setLmsMessage(`Synced ${res.recordsProcessed} student records. New: ${res.newStudentsAdded}, Updated: ${res.studentsUpdated}`);
      loadConfigs();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncingLms(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingApify(true);
    setApifyNotice(null);
    try {
      const res = await api.testApifyConnection();
      if (res.success) {
        setApifyNotice({
          type: 'success',
          title: 'Connection Successful',
          details: `Connected to Apify (${res.status?.username || 'Authenticated'}). Actor: ${res.status?.actorTitle || 'LinkedIn Jobs Scraper'} is active.`
        });
        setApifyStatus(res.status);
      } else {
        setApifyNotice({
          type: 'error',
          title: 'Connection Check Failed',
          details: res.message || res.status?.error || 'Unable to establish connection with Apify.'
        });
      }
    } catch (err: any) {
      setApifyNotice({
        type: 'error',
        title: 'Connection Check Failed',
        details: err.message || 'Network error communicating with Apify service.'
      });
    } finally {
      setTestingApify(false);
    }
  };

  const handleFetchJobs = async () => {
    setFetchingJobs(true);
    setApifyNotice(null);
    try {
      const res = await api.fetchApifyJobs();
      setApifyNotice({
        type: 'success',
        title: '✓ Job fetch completed',
        details: `${res.newIngested} new job opportunities successfully added to directory.`,
        stats: {
          received: res.totalReceived,
          newJobs: res.newIngested,
          duplicates: res.duplicatesCount,
          invalid: res.invalidCount
        }
      });
      loadConfigs();
    } catch (err: any) {
      setApifyNotice({
        type: 'error',
        title: 'Unable to fetch jobs',
        details: `${err.message || 'The Apify job scraper could not be reached.'} Please verify connection.`
      });
    } finally {
      setFetchingJobs(false);
    }
  };

  const handleTestAts = async () => {
    setTestingAts(true);
    setAtsNotice(null);
    try {
      const res = await api.testAtsConnection();
      if (res.success) {
        setAtsNotice({
          type: 'success',
          title: 'ATS Endpoints Accessible',
          details: `Connected to public ATS endpoints. Active: ${res.status?.activeConnectors?.join(', ') || 'Greenhouse, Lever, Ashby'}.`
        });
        setAtsStatus(res.status);
      } else {
        setAtsNotice({
          type: 'error',
          title: 'Connection Check Failed',
          details: res.message || res.status?.error || 'Unable to establish connection with ATS endpoints.'
        });
      }
    } catch (err: any) {
      setAtsNotice({
        type: 'error',
        title: 'Connection Check Failed',
        details: err.message || 'Network error communicating with ATS endpoints.'
      });
    } finally {
      setTestingAts(false);
    }
  };

  const handleSyncAts = async () => {
    setSyncingAts(true);
    setAtsNotice(null);
    try {
      const res = await api.fetchAtsJobs();
      setAtsNotice({
        type: 'success',
        title: '✓ Public ATS sync completed',
        details: `${res.newIngested} new verified technology jobs added from Greenhouse, Lever & Ashby.`,
        stats: {
          received: res.totalReceived,
          newJobs: res.newIngested,
          duplicates: res.duplicatesCount,
          invalid: res.invalidCount
        }
      });
      loadConfigs();
    } catch (err: any) {
      setAtsNotice({
        type: 'error',
        title: 'Unable to sync ATS jobs',
        details: `${err.message || 'The public ATS job API could not be reached.'} Please verify connection.`
      });
    } finally {
      setSyncingAts(false);
    }
  };

  if (loading || !lmsConfig || !scraperConfig || !atsConfig) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading integration services status...
      </div>
    );
  }

  // Format timestamps
  const lastFetchDisplay = scraperConfig.lastRunTimestamp
    ? new Date(scraperConfig.lastRunTimestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Not yet fetched';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">System Integrations</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage automated synchronization with the Academic LMS, Apify LinkedIn Scraper, and Public ATS Job APIs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* =========================================================
            1. ACADEMIC LMS INTEGRATION CARD
            ========================================================= */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Academic LMS Adapter</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {lmsConfig.status}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Synchronizes student demographics, attendance percentage, verified skills, and project submissions into the candidate roster.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 block">Total Synced</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{lmsConfig.totalRecordsSynced} Records</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 block">Auto-Sync Interval</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">Every {lmsConfig.autoSyncIntervalMinutes} mins</span>
              </div>
            </div>

            {lmsMessage && (
              <div className="mt-3 p-2.5 bg-blue-50 border border-blue-100 text-blue-800 text-[11px] rounded-lg">
                {lmsMessage}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Last sync: {new Date(lmsConfig.lastSyncTimestamp || Date.now()).toLocaleTimeString()}
            </span>
            <button
              onClick={handleSyncLms}
              disabled={syncingLms}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingLms ? 'animate-spin' : ''}`} />
              <span>{syncingLms ? 'Syncing...' : 'Sync LMS Now'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            2. APIFY JOB SCRAPER INTEGRATION CARD (Standardized)
            ========================================================= */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Job Scraper</h3>
                  <p className="text-[11px] text-slate-500">Real-time employer Requisition Scraper</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                AI Job Scraper
              </span>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Provider:</span>
                <span className="font-semibold text-slate-900">Apify</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Connection:</span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                  {apifyStatus?.connected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-700 font-bold">Connected</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-amber-700 font-medium">Testing Required</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Actor:</span>
                <span className="font-medium text-slate-800">
                  {apifyStatus?.actorConfigured !== false ? (
                    <span className="text-slate-900 font-semibold">Configured ({apifyStatus?.actorTitle || 'LinkedIn Scraper'})</span>
                  ) : (
                    <span className="text-amber-600">Not Configured</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Fetch:</span>
                <span className="font-medium text-slate-800">{lastFetchDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jobs Fetched:</span>
                <span className="font-bold text-slate-900">{scraperConfig.leadsProcessedTotal} Opportunities</span>
              </div>
            </div>

            {/* Notification / Feedback Banner */}
            {apifyNotice && (
              <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1.5 ${
                apifyNotice.type === 'success' 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {apifyNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{apifyNotice.title}</span>
                </div>
                {apifyNotice.details && (
                  <p className="text-[11px] leading-relaxed text-slate-600">{apifyNotice.details}</p>
                )}
                {apifyNotice.stats && (
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                    <div><span className="text-slate-500 block">Received:</span> <strong>{apifyNotice.stats.received}</strong></div>
                    <div><span className="text-slate-500 block">New Jobs:</span> <strong className="text-emerald-700">{apifyNotice.stats.newJobs}</strong></div>
                    <div><span className="text-slate-500 block">Duplicates:</span> <strong>{apifyNotice.stats.duplicates}</strong></div>
                    <div><span className="text-slate-500 block">Invalid:</span> <strong>{apifyNotice.stats.invalid}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: [ Test Connection ] and [ Fetch Jobs ] */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              onClick={handleTestConnection}
              disabled={testingApify || fetchingJobs}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Activity className={`w-3.5 h-3.5 text-slate-500 ${testingApify ? 'animate-pulse text-purple-600' : ''}`} />
              <span>{testingApify ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleFetchJobs}
              disabled={testingApify || fetchingJobs}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Play className={`w-3.5 h-3.5 ${fetchingJobs ? 'animate-spin text-purple-400' : ''}`} />
              <span>{fetchingJobs ? 'Fetching jobs from Apify...' : 'Fetch Jobs'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            3. PUBLIC ATS JOB API INTEGRATION CARD (New Source)
            ========================================================= */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Public ATS API</h3>
                  <p className="text-[11px] text-slate-500">Greenhouse, Lever & Ashby Direct Feeds</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                ATS Job API
              </span>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Connectors:</span>
                <span className="font-semibold text-slate-900">Greenhouse · Lever · Ashby</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Connection:</span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                  {atsStatus?.connected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-700 font-bold">Active & Accessible</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                      <span className="text-teal-700 font-medium">Ready to Sync</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Companies:</span>
                <span className="font-medium text-slate-800">
                  {((atsConfig?.greenhouseBoards?.length || 5) + (atsConfig?.leverCompanies?.length || 3) + (atsConfig?.ashbyCompanies?.length || 4))} Tech Boards
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Fetch:</span>
                <span className="font-medium text-slate-800">
                  {atsConfig?.lastRunTimestamp 
                    ? new Date(atsConfig.lastRunTimestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                    : 'Not yet fetched'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jobs Ingested:</span>
                <span className="font-bold text-slate-900">{atsConfig?.leadsProcessedTotal || 0} Opportunities</span>
              </div>
            </div>

            {/* Notification / Feedback Banner */}
            {atsNotice && (
              <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1.5 ${
                atsNotice.type === 'success' 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {atsNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{atsNotice.title}</span>
                </div>
                {atsNotice.details && (
                  <p className="text-[11px] leading-relaxed text-slate-600">{atsNotice.details}</p>
                )}
                {atsNotice.stats && (
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                    <div><span className="text-slate-500 block">Received:</span> <strong>{atsNotice.stats.received}</strong></div>
                    <div><span className="text-slate-500 block">New Jobs:</span> <strong className="text-emerald-700">{atsNotice.stats.newJobs}</strong></div>
                    <div><span className="text-slate-500 block">Duplicates:</span> <strong>{atsNotice.stats.duplicates}</strong></div>
                    <div><span className="text-slate-500 block">Invalid:</span> <strong>{atsNotice.stats.invalid}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: [ Test Connection ] and [ Sync ATS Jobs ] */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              onClick={handleTestAts}
              disabled={testingAts || syncingAts}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Activity className={`w-3.5 h-3.5 text-slate-500 ${testingAts ? 'animate-pulse text-teal-600' : ''}`} />
              <span>{testingAts ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSyncAts}
              disabled={testingAts || syncingAts}
              className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Play className={`w-3.5 h-3.5 ${syncingAts ? 'animate-spin text-teal-300' : ''}`} />
              <span>{syncingAts ? 'Syncing Public ATS...' : 'Sync ATS Jobs'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
