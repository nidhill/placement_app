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
  const totalApplications = kpis.totalApplications ?? 0;

  // Placement Health Threshold:
  // RED < 50%, YELLOW 50%-59%, GREEN >= 60%
  const healthStatus = placementRate >= 60 ? 'GREEN' : placementRate >= 50 ? 'YELLOW' : 'RED';

  // Placement by School data
  const schoolPerformance = [
    { school: 'School of Technology', rate: 74, placed: 142, total: 192 },
    { school: 'School of Design', rate: 68, placed: 78, total: 115 },
    { school: 'School of Business', rate: 62, placed: 73, total: 118 },
  ];

  // Placement by Program data
  const programPerformance = [
    { program: 'B.Tech Computer Science', school: 'Tech', rate: 82, placed: 82, total: 100 },
    { program: 'B.Des Interaction Design', school: 'Design', rate: 71, placed: 46, total: 65 },
    { program: 'MBA Marketing & Analytics', school: 'Business', rate: 65, placed: 52, total: 80 },
    { program: 'B.Tech AI & Data Science', school: 'Tech', rate: 78, placed: 60, total: 77 },
  ];

  // Placement by Batch data
  const batchPerformance = [
    { batch: 'Batch 2026 (Graduating)', rate: placementRate, placed: studentsPlaced, total: 428 },
    { batch: 'Batch 2025 (Alumni Benchmark)', rate: 84, placed: 378, total: 450 },
  ];

  // Job Source Performance
  const sourcePerformance = [
    { source: 'AI Scraper (Apify Sourcing)', offers: 112, share: '38%' },
    { source: 'Staff & Leadership Referrals', offers: 94, share: '32%' },
    { source: 'Direct Corporate Partnerships', offers: 87, share: '30%' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header with Institutional Placement Health Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
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
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Board Report</span>
          </button>
        </div>
      </div>

      {/* 6 Key Management Executive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. Overall Placement Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Placement Rate</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{placementRate}%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target ≥ 60%
          </div>
        </div>

        {/* 2. Students Placed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Students Placed</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{studentsPlaced}</div>
          <div className="text-[10px] text-slate-500 mt-1">Confirmed offers</div>
        </div>

        {/* 3. Students Seeking Placement */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Seeking Placement</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{studentsSeeking}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Active in pipeline</div>
        </div>

        {/* 4. Offers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Offers</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalOffers}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">Under review</div>
        </div>

        {/* 5. Interviews */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Interviews</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalInterviews}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-1">Completed rounds</div>
        </div>

        {/* 6. Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Applications</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalApplications}</div>
          <div className="text-[10px] text-slate-500 mt-1">Candidate volume</div>
        </div>

      </div>

      {/* Row 1: Placement Trend Chart + Placement Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Placement Trend (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Placement Trajectory</h3>
              <p className="text-xs text-slate-400 mt-0.5">Month-by-month cumulative conversion curve</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
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
                stroke="#0f172a"
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
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#0f172a" />
                  <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">
                    {p.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 px-2">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Placement Health Threshold Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Placement Health Bands</h3>
            <p className="text-xs text-slate-400 mt-0.5">Accreditation regulatory guidelines</p>

            <div className="space-y-3 mt-4 text-xs">
              
              {/* Green */}
              <div className={`p-3 rounded-xl border ${
                healthStatus === 'GREEN' ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
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
                healthStatus === 'YELLOW' ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'
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
                healthStatus === 'RED' ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300' : 'bg-slate-50 border-slate-200 opacity-60'
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
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Placement by School</h3>
            <span className="text-xs text-slate-400">3 Academic Units</span>
          </div>

          <div className="space-y-4">
            {schoolPerformance.map(item => (
              <div key={item.school} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.school}</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 mr-2">{item.rate}%</span>
                    <span className="text-slate-400">({item.placed}/{item.total} placed)</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 rounded-full" 
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placement by Program */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Placement by Program</h3>
            <span className="text-xs text-slate-400">Top Degree Tracks</span>
          </div>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            {programPerformance.map(prog => (
              <div key={prog.program} className="pt-3 first:pt-0 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{prog.program}</div>
                  <div className="text-[11px] text-slate-400">{prog.placed} placed of {prog.total} registered</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{prog.rate}%</span>
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
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Placement by Batch</h3>
            <span className="text-xs text-slate-400">Graduation Cohorts</span>
          </div>

          <div className="space-y-3 text-xs">
            {batchPerformance.map(b => (
              <div key={b.batch} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{b.batch}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{b.placed} placed out of {b.total} candidates</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900">{b.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Source Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Job Source Performance</h3>
            <span className="text-xs text-slate-400">Offer Contribution</span>
          </div>

          <div className="space-y-3 text-xs">
            {sourcePerformance.map(src => (
              <div key={src.source} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{src.source}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{src.offers} verified offers generated</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{src.share}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
