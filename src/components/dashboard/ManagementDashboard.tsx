import React, { useState, useEffect } from 'react';
import { ManagementKPIs, StudentProfile } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { NavigationItem } from '../common/Sidebar.tsx';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Users, 
  Briefcase, 
  Building, 
  Layers, 
  FolderTree, 
  Share2, 
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';

interface ManagementDashboardProps {
  onNavigate: (tab: NavigationItem) => void;
}

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<ManagementKPIs | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [kpiRes, studentRes] = await Promise.all([
          api.getAnalytics(),
          api.getStudents()
        ]);
        setKpis(kpiRes);
        setStudents(studentRes.students);
      } catch (err) {
        console.error('Failed to load Management KPIs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Compiling institutional placement telemetry...
      </div>
    );
  }

  // 6 Exact KPIs for Management:
  // - Overall Placement Rate
  // - Students Placed
  // - Students Seeking Placement
  // - Offers
  // - Interviews
  // - Applications
  const placementRate = kpis.overallPlacementRate ?? 0;
  const studentsPlaced = kpis.totalPlaced ?? 0;
  const studentsSeeking = (kpis.totalStudents ?? 0) - studentsPlaced;
  const totalOffers = kpis.totalOffers ?? 0;
  const totalInterviews = kpis.totalInterviews ?? 0;
  const totalApplications = kpis.totalActiveApplications ?? 0;

  // Placement Health Threshold:
  // RED < 50%, YELLOW 50%-59%, GREEN >= 60%
  const healthStatus = placementRate >= 60 ? 'GREEN' : placementRate >= 50 ? 'YELLOW' : 'RED';

  // All from the analytics service (real students, applications, jobs).
  const schoolPerformance = (kpis.schoolMetrics || []).map(m => ({ school: m.school, rate: m.rate, placed: m.placed, total: m.totalEligible }));
  const programPerformance = (kpis.programMetrics || []).map(m => ({ program: m.program, school: m.school, rate: m.rate, placed: m.placed, total: m.totalEligible }));
  const batchPerformance = (kpis.batchMetrics || []).map(m => ({ batch: m.batch, rate: m.rate, placed: m.placed, total: m.totalEligible }));
  const totalChannelPlacements = (kpis.channelMetrics || []).reduce((t, c) => t + (c.placements || 0), 0);
  const sourcePerformance = (kpis.channelMetrics || []).map(c => ({
    source: c.label,
    offers: c.placements || 0,
    share: totalChannelPlacements > 0 ? `${Math.round(((c.placements || 0) / totalChannelPlacements) * 100)}%` : '0%',
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header with Institutional Placement Health Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Institutional Placement Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive oversight, accreditation metrics, and multi-school outcome analytics
          </p>
        </div>

        {/* Health Status Pill (Red < 50%, Yellow 50-59%, Green >= 60%) */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
            healthStatus === 'GREEN' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : healthStatus === 'YELLOW' 
              ? 'bg-amber-50 border-amber-200 text-amber-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              healthStatus === 'GREEN' ? 'bg-emerald-500' : healthStatus === 'YELLOW' ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            <span>
              Health: {healthStatus === 'GREEN' ? 'Healthy (≥60%)' : healthStatus === 'YELLOW' ? 'Attention (50-59%)' : 'Critical (<50%)'}
            </span>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="px-3 py-1.5 bg-white border border-border text-slate-700 hover:bg-muted rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Board Report</span>
          </button>
        </div>
      </div>

      {/* 6 Key Management Executive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. Overall Placement Rate */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Placement Rate</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{placementRate}%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target ≥ 60%
          </div>
        </div>

        {/* 2. Students Placed */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Students Placed</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{studentsPlaced}</div>
          <div className="text-[10px] text-slate-500 mt-1">Confirmed offers</div>
        </div>

        {/* 3. Students Seeking Placement */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Seeking Placement</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{studentsSeeking}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Active in pipeline</div>
        </div>

        {/* 4. Offers */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Offers</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{totalOffers}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">Under review</div>
        </div>

        {/* 5. Interviews */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Interviews</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{totalInterviews}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-1">Completed rounds</div>
        </div>

        {/* 6. Applications */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Applications</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{totalApplications}</div>
          <div className="text-[10px] text-slate-500 mt-1">Candidate volume</div>
        </div>

      </div>

      {/* Row 1: Placement Trend Chart + Placement Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Placement Trend (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Placement Trajectory</h3>
              <p className="text-xs text-slate-400 mt-0.5">Month-by-month cumulative conversion curve</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-muted px-2.5 py-1 rounded">
              Academic Year 2026
            </span>
          </div>

          <div className="h-44 w-full relative flex items-end pt-6 pb-2">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="10" x2="500" y2="10" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* Target 60% line */}
              <line x1="0" y1="48" x2="500" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
              <text x="6" y="44" fill="#94a3b8" fontSize="9" fontWeight="600">60% Accreditation Target</text>

              <polyline
                fill="none"
                stroke="#1E50FF"
                strokeWidth="2.5"
                points="10,86 100,74 200,64 300,55 400,45 490,38"
              />

              {[
                { x: 10, y: 86, val: '28%' },
                { x: 100, y: 74, val: '38%' },
                { x: 200, y: 64, val: '46%' },
                { x: 300, y: 55, val: '54%' },
                { x: 400, y: 45, val: '62%' },
                { x: 490, y: 38, val: `${placementRate}%` },
              ].map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#1E50FF" />
                  <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">
                    {p.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 border-t border-border/70 pt-2 px-2">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Placement Health Threshold Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Placement Health Bands</h3>
            <p className="text-xs text-slate-400 mt-0.5">Accreditation regulatory guidelines</p>

            <div className="space-y-3 mt-4 text-xs">
              
              {/* Green */}
              <div className={`p-3 rounded-xl border ${
                healthStatus === 'GREEN' ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' : 'bg-muted border-border opacity-60'
              }`}>
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Green Band (≥ 60%)
                  </span>
                  <span>Healthy</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Exceeds institutional placement standards. Eligible for autonomous academic accreditation.
                </p>
              </div>

              {/* Yellow */}
              <div className={`p-3 rounded-xl border ${
                healthStatus === 'YELLOW' ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300' : 'bg-muted border-border opacity-60'
              }`}>
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Yellow Band (50% - 59%)
                  </span>
                  <span>Attention</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Requires intensified corporate outreach and remediation coaching for stalled candidates.
                </p>
              </div>

              {/* Red */}
              <div className={`p-3 rounded-xl border ${
                healthStatus === 'RED' ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300' : 'bg-muted border-border opacity-60'
              }`}>
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Red Band (&lt; 50%)
                  </span>
                  <span>Critical</span>
                </div>
                <p className="text-[11px] text-rose-700 mt-1">
                  Critical shortfall requiring immediate dean-level intervention and emergency drive allocations.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Placement by School + Placement by Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Placement by School */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Placement by School</h3>
            <span className="text-xs text-slate-400">3 Academic Units</span>
          </div>

          <div className="space-y-4">
            {schoolPerformance.map(item => (
              <div key={item.school} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.school}</span>
                  <div className="text-right">
                    <span className="font-bold text-foreground mr-2">{item.rate}%</span>
                    <span className="text-slate-400">({item.placed}/{item.total} placed)</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placement by Program */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Placement by Program</h3>
            <span className="text-xs text-slate-400">Top Degree Tracks</span>
          </div>

          <div className="space-y-3 divide-y divide-border/70 text-xs">
            {programPerformance.map(prog => (
              <div key={prog.program} className="pt-3 first:pt-0 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{prog.program}</div>
                  <div className="text-[11px] text-slate-400">{prog.placed} placed of {prog.total} registered</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{prog.rate}%</span>
                  <span className="text-[10px] text-emerald-600 block">≥ Target</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Placement by Batch + Job Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Placement by Batch */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Placement by Batch</h3>
            <span className="text-xs text-slate-400">Graduation Cohorts</span>
          </div>

          <div className="space-y-3 text-xs">
            {batchPerformance.map(b => (
              <div key={b.batch} className="p-3 bg-muted rounded-xl border border-border/70 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{b.batch}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{b.placed} placed out of {b.total} candidates</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-foreground">{b.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Source Performance */}
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Job Source Performance</h3>
            <span className="text-xs text-slate-400">Offer Contribution</span>
          </div>

          <div className="space-y-3 text-xs">
            {sourcePerformance.map(src => (
              <div key={src.source} className="p-3 bg-muted rounded-xl border border-border/70 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{src.source}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{src.offers} verified offers generated</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{src.share}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
