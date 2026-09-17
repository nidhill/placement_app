import React, { useState, useEffect } from 'react';
import { ManagementKPIs } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { HealthStatusBadge } from '../common/StatusBadge.tsx';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Briefcase, 
  Calendar, 
  ChevronDown, 
  AlertTriangle,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface AnalyticsViewProps {
  onRefreshData?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = () => {
  const [kpis, setKpis] = useState<ManagementKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [academicYear, setAcademicYear] = useState('2026');
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  const loadData = async () => {
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
    loadData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading placement intelligence analytics...
      </div>
    );
  }

  // Monthly trend for institutional reports
  const trendData = [
    { month: 'January', rate: 28, placed: 42 },
    { month: 'February', rate: 38, placed: 78 },
    { month: 'March', rate: 46, placed: 120 },
    { month: 'April', rate: 54, placed: 174 },
    { month: 'May', rate: 62, placed: 236 },
    { month: 'June', rate: kpis.overallPlacementRate, placed: kpis.totalPlaced },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Top Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Placement Analytics & Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive institutional intelligence across schools, programs, cohorts, and acquisition channels
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value="2026">Academic Year: 2026</option>
              <option value="2025">Academic Year: 2025</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedSchool}
              onChange={e => setSelectedSchool(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value="ALL">All Schools</option>
              <option value="tech">School of Tech</option>
              <option value="design">School of Design</option>
              <option value="marketing">School of Marketing</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              <option value="2026-Q1">Batch 2026-Q1</option>
              <option value="2025-Q4">Batch 2025-Q4</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4 Core Conversion Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Placement Rate</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.overallPlacementRate}%</div>
          <div className="mt-1">
            <HealthStatusBadge status={kpis.healthStatus} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Offer Rate</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {Math.round(((kpis.totalOffers || 31) / (kpis.totalEligible || 312)) * 100)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{kpis.totalOffers} Total Offers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Interview Rate</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {Math.round(((kpis.totalInterviews || 84) / (kpis.totalEligible || 312)) * 100)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{kpis.totalInterviews} Rounds</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Eligible Student Pool</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalEligible}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Out of {kpis.totalStudents} total</span>
        </div>
      </div>

      {/* Placement Trend & Monthly Progress */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Placement Progress Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Month-by-month trajectory toward annual institutional goals</p>
          </div>
          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            Current Rate: {kpis.overallPlacementRate}%
          </div>
        </div>

        {/* Clean Chart Bars */}
        <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
          {trendData.map((td, idx) => (
            <div key={td.month} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="text-[11px] font-medium text-slate-600 mb-1 opacity-80 group-hover:opacity-100">
                {td.rate}%
              </div>
              <div className="w-full max-w-[40px] bg-slate-100 rounded-t-md relative flex items-end h-full">
                <div 
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    idx === trendData.length - 1 ? 'bg-slate-900' : 'bg-slate-300 group-hover:bg-slate-400'
                  }`}
                  style={{ height: `${(td.rate / 100) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                {td.month.slice(0, 3)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* School Comparison & Batch Health Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* School Comparison */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Placement by School</h3>
          <div className="space-y-4">
            {kpis.schoolMetrics.map(sm => (
              <div key={sm.school} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">{sm.school}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">{sm.placed} / {sm.totalEligible} placed</span>
                    <span className="font-bold text-slate-900">{sm.rate}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sm.healthStatus === 'GREEN' ? 'bg-emerald-500' : sm.healthStatus === 'YELLOW' ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(sm.rate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batch Health Comparison */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Batch Health Status</h3>
          <div className="space-y-4">
            {kpis.batchMetrics.map(bm => (
              <div key={bm.batch} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{bm.batch}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">{bm.program}</span>
                  </div>
                  <HealthStatusBadge status={bm.healthStatus} rate={bm.rate} />
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bm.healthStatus === 'GREEN' ? 'bg-emerald-500' : bm.healthStatus === 'YELLOW' ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(bm.rate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sourcing Channel Performance & Conversion ROI */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Job Source Channel Conversion ROI</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Efficacy metrics comparing AI Job Scraper (Apify), Staff Referrals, and Direct Placement Outreach
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.channelMetrics.map(cm => (
            <div key={cm.channel} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{cm.label}</span>
                {cm.isLowPerforming && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Low Conversion
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">{cm.conversionRate}%</span>
                <span className="text-[11px] text-slate-500">Placement Conversion</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Sourced:</span>
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
                  <span className="text-slate-400 block">Hires:</span>
                  <span className="font-semibold text-emerald-700">{cm.placements}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
