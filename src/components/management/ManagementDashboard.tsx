import React, { useState, useEffect } from 'react';
import { ManagementKPIs } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { HealthStatusBadge, SourceChannelBadge } from '../common/StatusBadge.tsx';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Briefcase, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  GraduationCap, 
  ArrowUpRight,
  ShieldCheck,
  Bot
} from 'lucide-react';

interface ManagementDashboardProps {
  onRefreshData?: () => void;
}

export const ManagementDashboard: React.FC<ManagementDashboardProps> = () => {
  const [kpis, setKpis] = useState<ManagementKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKpis = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setKpis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Computing institute placement metrics and evaluating strict health thresholds...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Executive Header */}
      <div className="bg-primary text-white rounded-2xl p-6 shadow-md border border-primary/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Executive Governance & KPIs
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Institutional Placement Intelligence</h1>
            <p className="text-slate-300 text-xs max-w-2xl mt-0.5">
              Executive performance indicators across schools, programs, cohorts, and candidate acquisition channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-primary/85/90 border border-slate-700 rounded-xl p-3 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Institutional Placement Rate</span>
              <div className="text-2xl font-extrabold text-white flex items-center justify-end gap-2">
                {kpis.overallPlacementRate}%
                <HealthStatusBadge status={kpis.healthStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strict Color Legend Rule Banner */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
        <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-700" /> PRD Section 3.6 Non-Negotiable Health Thresholds
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> RED (&lt; 50%)
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Critical attention required; urgent intervention needed for the batch.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> YELLOW (50% – 59%)
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Warning phase; needs active push from placement officers.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> GREEN (≥ 60%)
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Healthy batch state; moving toward 100% target.
            </p>
          </div>
        </div>
      </div>

      {/* High-Level Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Total Eligible Candidates</span>
          <div className="text-2xl font-bold text-foreground mt-1">{kpis.totalEligible}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{kpis.totalStudents} total registered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Successfully Placed</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{kpis.totalPlaced}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Joined or Offer Accepted</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Active Applications</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">{kpis.totalActiveApplications}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">In active recruitment funnel</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Interviews Conducted</span>
          <div className="text-2xl font-bold text-purple-700 mt-1">{kpis.totalInterviews}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{kpis.totalOffers} Total Offers</span>
        </div>
      </div>

      {/* SOURCING CHANNEL PERFORMANCE & ROI EVALUATION */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div>
          <h3 className="font-bold text-foreground text-base">Job Source Channel Performance & Conversion ROI</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates conversion efficacy across AI Job Scraper (Apify), Staff Referrals, and Direct Placement Outreach. Flags low-converting channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.channelMetrics.map(cm => (
            <div key={cm.channel} className="p-4 rounded-xl border border-border bg-muted/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{cm.label}</span>
                {cm.isLowPerforming && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Low Conversion
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-foreground">{cm.conversionRate}%</span>
                <span className="text-xs text-slate-500">Placement Conversion Rate</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border">
                <div>
                  <span className="text-slate-400 block">Jobs Sourced:</span>
                  <span className="font-semibold text-slate-800">{cm.jobsDiscovered}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Applications:</span>
                  <span className="font-semibold text-slate-800">{cm.applications}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Interviews:</span>
                  <span className="font-semibold text-slate-800">{cm.interviews}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Confirmed Hires:</span>
                  <span className="font-semibold text-emerald-700">{cm.placements}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BATCH & PROGRAM-WISE BREAKDOWN TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* School-Wise & Program-Wise Breakdown */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">School & Program Placement Rate</h3>
            <span className="text-xs text-slate-400">Strict Threshold Evaluation</span>
          </div>

          <div className="divide-y divide-border text-xs">
            {kpis.programMetrics.map(pm => (
              <div key={pm.program} className="p-3.5 hover:bg-muted flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground">{pm.program}</div>
                  <div className="text-[11px] text-slate-500">{pm.school}</div>
                  <div className="text-[10px] text-slate-400">
                    {pm.placed} placed out of {pm.totalEligible} eligible candidates
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <HealthStatusBadge status={pm.healthStatus} rate={pm.rate} />
                  <div className="w-24 bg-secondary h-1.5 rounded-full overflow-hidden ml-auto">
                    <div
                      className={`h-full ${pm.healthStatus === 'GREEN' ? 'bg-emerald-500' : pm.healthStatus === 'YELLOW' ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(pm.rate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batch-Wise Cohort Breakdown */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">Batch & Cohort Health Breakdown</h3>
            <span className="text-xs text-slate-400">Action Triggers</span>
          </div>

          <div className="divide-y divide-border text-xs">
            {kpis.batchMetrics.map(bm => (
              <div key={bm.batch} className="p-3.5 hover:bg-muted flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground">{bm.batch}</div>
                  <div className="text-[11px] text-slate-500">{bm.program}</div>
                  <div className="text-[10px] text-slate-400">
                    {bm.placed} / {bm.totalEligible} Candidates Placed
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <HealthStatusBadge status={bm.healthStatus} rate={bm.rate} />
                  <div className="w-24 bg-secondary h-1.5 rounded-full overflow-hidden ml-auto">
                    <div
                      className={`h-full ${bm.healthStatus === 'GREEN' ? 'bg-emerald-500' : bm.healthStatus === 'YELLOW' ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(bm.rate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
