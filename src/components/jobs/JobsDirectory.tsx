import React, { useState, useEffect } from 'react';
import { JobListing, JobMatchResult, StudentProfile, JobSourceChannel } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { plainText } from '../../lib/text.ts';
import { SourceChannelBadge, MatchVerdictBadge } from '../common/StatusBadge.tsx';
import { 
  Search, 
  Plus, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  X, 
  ChevronDown, 
  CheckCircle2, 
  Building2,
  Users,
  Sparkles,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Clock
} from 'lucide-react';

const JOB_ROLE_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'UI/UX Designer',
  'Data Analyst',
  'Data Scientist',
  'Data Engineer',
  'AI/ML Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cybersecurity',
  'QA / Software Tester',
  'Database Developer',
  'IT Support',
  'Business Analyst',
  'Other'
];

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

interface JobsDirectoryProps {
  onRefreshData?: () => void;
}

export const JobsDirectory: React.FC<JobsDirectoryProps> = ({ onRefreshData }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [designationFilter, setDesignationFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  
  // Job Fetch states
  const [fetchingApify, setFetchingApify] = useState(false);
  const [fetchingAts, setFetchingAts] = useState(false);
  const [fetchNotice, setFetchNotice] = useState<{
    type: 'success' | 'error';
    title: string;
    details?: string;
    stats?: { 
      received: number; 
      techJobs: number; 
      nonTechFiltered: number; 
      newJobs: number; 
      duplicates: number; 
      invalid: number 
    };
  } | null>(null);

  // Job Match Candidate state
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'matching'>('details');

  // New Job Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newApplyUrl, setNewApplyUrl] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newChannel, setNewChannel] = useState<JobSourceChannel>('PLACEMENT_DIRECT');
  const [newJobRole, setNewJobRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<JobListing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs();
      setJobs(res.jobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleFetchApifyJobs = async () => {
    setFetchingApify(true);
    setFetchNotice(null);
    try {
      const res = await api.fetchApifyJobs();
      const techJobsCount = res.techJobsCount ?? (res.totalReceived - (res.nonTechFilteredCount ?? 0));
      const nonTechFilteredCount = res.nonTechFilteredCount ?? 0;

      setFetchNotice({
        type: 'success',
        title: '✓ Real Apify Tech Job Fetch Completed',
        details: `${res.newIngested} new technology jobs added. Rejected ${nonTechFilteredCount} non-technical listings.`,
        stats: {
          received: res.totalReceived,
          techJobs: techJobsCount,
          nonTechFiltered: nonTechFilteredCount,
          newJobs: res.newIngested,
          duplicates: res.duplicatesCount,
          invalid: res.invalidCount
        }
      });
      await loadJobs();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setFetchNotice({
        type: 'error',
        title: 'Unable to fetch jobs',
        details: `${err.message || 'The Apify job scraper could not be reached.'} Please check connection and try again.`
      });
    } finally {
      setFetchingApify(false);
    }
  };

  const handleFetchAtsJobs = async () => {
    setFetchingAts(true);
    setFetchNotice(null);
    try {
      const res = await api.fetchAtsJobs();
      setFetchNotice({
        type: 'success',
        title: '✓ Public ATS Tech Jobs Sync Completed',
        details: `${res.newIngested} new technology jobs added from Greenhouse, Lever & Ashby. Filtered ${res.nonTechFilteredCount} non-technical listings.`,
        stats: {
          received: res.totalReceived,
          techJobs: res.techJobsCount,
          nonTechFiltered: res.nonTechFilteredCount,
          newJobs: res.newIngested,
          duplicates: res.duplicatesCount,
          invalid: res.invalidCount
        }
      });
      await loadJobs();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setFetchNotice({
        type: 'error',
        title: 'Unable to sync ATS jobs',
        details: `${err.message || 'The public ATS job API could not be reached.'} Please check connection and try again.`
      });
    } finally {
      setFetchingAts(false);
    }
  };

  const handleSelectJob = async (job: JobListing) => {
    setSelectedJob(job);
    setActiveTab('details');
    setLoadingMatches(true);
    try {
      const res = await api.getJobMatches(job.id);
      const candidatesList = (res.candidates || []).map(c => ({
        ...c.match,
        student: c.student
      }));
      setMatchingCandidates(candidatesList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim() || !newJobRole || !/^https?:\/\/\S+$/i.test(newApplyUrl.trim())) return;
    setSubmitting(true);
    try {
      const skillsArray = newSkills.split(',').map(s => s.trim()).filter(Boolean);
      const loc = newLocation.trim() || 'Kochi, Kerala, India';
      const finalLoc = /india/i.test(loc) ? loc : `${loc}, India`;

      await api.createJob({
        title: newTitle.trim(),
        company: newCompany.trim(),
        location: finalLoc,
        countryCode: 'IN',
        employmentType: 'FULL_TIME',
        experienceRequirement: '0-1 Years (Entry Level)',
        minExperienceYears: 0,
        salaryRange: newSalary.trim() || '₹6,00,000 - ₹10,00,000 / annum',
        description: newDescription.trim() || 'Exciting career opportunity for HACA graduates in India.',
        requiredSkills: skillsArray.length > 0 ? skillsArray : ['Communication', 'Problem Solving'],
        preferredSkills: ['Git', 'Agile'],
        educationRequirements: ['Bachelor in Computer Science or Equivalent Bootcamp'],
        eligibleSchools: ['School of Tech'],
        eligiblePrograms: ['Full Stack Web Development'],
        sourceChannel: newChannel,
        applicationUrl: newApplyUrl.trim(),
        normalizedDesignation: newJobRole,
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      });
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewCompany('');
      setNewLocation('');
      setNewSalary('');
      setNewApplyUrl('');
      setNewSkills('');
      setNewDescription('');
      setNewJobRole('');
      loadJobs();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to post job: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (job: JobListing) => {
    setDeleting(true);
    try {
      await api.deleteJob(job.id);
      setDeleteConfirmJob(null);
      setSelectedJob(null);
      await loadJobs();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Failed to delete job: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Comprehensive multi-criteria filtering
  const filteredJobs = jobs.filter(j => {
    // 1. Source filter
    if (sourceFilter === 'HACA') {
      if (j.sourceChannel === 'AI_JOB_SCRAPER' || j.sourceChannel === 'ATS_JOB_API') return false;
    } else if (sourceFilter !== 'ALL' && j.sourceChannel !== sourceFilter) {
      return false;
    }
    
    // 2. Status filter
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;

    // 3. Employment type filter
    if (typeFilter !== 'ALL' && j.employmentType !== typeFilter) return false;

    // 4. Location filter
    if (locationFilter.trim()) {
      if (!j.location.toLowerCase().includes(locationFilter.toLowerCase().trim())) return false;
    }

    // 5. Skill filter
    if (skillFilter.trim()) {
      const sf = skillFilter.toLowerCase().trim();
      const hasSkill = j.requiredSkills.some(s => s.toLowerCase().includes(sf)) ||
                        (j.preferredSkills && j.preferredSkills.some(s => s.toLowerCase().includes(sf)));
      if (!hasSkill) return false;
    }

    // 6. Category filter
    if (categoryFilter !== 'ALL' && j.category !== categoryFilter) return false;

    // 7. Role / Designation filter
    if (designationFilter.trim()) {
      const df = designationFilter.toLowerCase().trim();
      const desigMatch = (j.normalizedDesignation || '').toLowerCase().includes(df) ||
                         j.title.toLowerCase().includes(df);
      if (!desigMatch) return false;
    }

    // 8. Experience filter
    if (experienceFilter !== 'ALL') {
      const expText = (j.experienceRequirement || '').toLowerCase();
      if (experienceFilter === 'ENTRY' && !expText.includes('0') && !expText.includes('fresh') && !expText.includes('entry') && !expText.includes('graduate')) {
        return false;
      }
      if (experienceFilter === 'EXPERIENCED' && (expText.includes('0-1') || expText.includes('fresh') || expText.includes('entry'))) {
        return false;
      }
    }

    // 9. General search query (title, company, description, category, designation)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = j.title.toLowerCase().includes(q);
      const matchComp = j.company.toLowerCase().includes(q);
      const matchLoc = j.location.toLowerCase().includes(q);
      const matchCat = (j.category || '').toLowerCase().includes(q);
      const matchDesig = (j.normalizedDesignation || '').toLowerCase().includes(q);
      const matchSkill = j.requiredSkills.some(sk => sk.toLowerCase().includes(q));
      if (!matchTitle && !matchComp && !matchLoc && !matchCat && !matchDesig && !matchSkill) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Job Opportunities</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
              <span>🇮🇳</span> India Only
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({filteredJobs.length} jobs found)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active verified IT & technology employer requisitions in India across software, cloud, data, and design
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Automated Daily Sync Status Badge */}
          <div 
            className="px-3 py-1.5 bg-muted border border-border text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            title="Technology jobs are automatically ingested from Apify & Public ATS daily at 2:00 AM"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Auto-Syncs Daily at 2:00 AM</span>
          </div>

          {/* Post Job Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-white border border-border text-slate-700 rounded-lg text-xs font-semibold hover:bg-muted transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Job</span>
          </button>
        </div>
      </div>

      {/* Fetch Notice Banner (Live results or Error Handling) */}
      {fetchNotice && (
        <div className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
          fetchNotice.type === 'success' 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              {fetchNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{fetchNotice.title}</span>
            </div>
            <button 
              onClick={() => setFetchNotice(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {fetchNotice.details && (
            <p className="text-[11px] text-slate-600 leading-relaxed">{fetchNotice.details}</p>
          )}

          {fetchNotice.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
              <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">Total scraped:</span>
                <strong className="text-foreground text-xs">{fetchNotice.stats.received}</strong>
              </div>
              <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">Tech jobs:</span>
                <strong className="text-emerald-700 text-xs">{fetchNotice.stats.techJobs}</strong>
              </div>
              <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">Non-tech rejected:</span>
                <strong className="text-amber-700 text-xs">{fetchNotice.stats.nonTechFiltered}</strong>
              </div>
              <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">Duplicates:</span>
                <strong className="text-slate-700 text-xs">{fetchNotice.stats.duplicates}</strong>
              </div>
              <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">New ingested:</span>
                <strong className="text-emerald-700 text-xs">+{fetchNotice.stats.newJobs}</strong>
              </div>
            </div>
          )}

          {fetchNotice.type === 'error' && (
            <div className="pt-2 flex items-center gap-3">
              <span className="text-[11px] text-slate-500">
                Scheduled automated sync will retry tonight at 2:00 AM. Existing active jobs remain fully available.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-border shadow-sm flex flex-wrap items-center gap-2.5 text-xs">
        
        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
          />
        </div>

        {/* Source Filter */}
        <div className="relative">
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="appearance-none bg-muted border border-border text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            <option value="ALL">All Technology Jobs</option>
            <option value="HACA">HACA Jobs</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Tech Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="appearance-none bg-muted border border-border text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer font-medium"
          >
            <option value="ALL">Category: All Tech</option>
            <option value="Software Development">Software Development</option>
            <option value="Full Stack Development">Full Stack Development</option>
            <option value="Frontend Development">Frontend Development</option>
            <option value="Backend Development">Backend Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Data Analytics">Data Analytics</option>
            <option value="Data Engineering">Data Engineering</option>
            <option value="AI / Machine Learning">AI / Machine Learning</option>
            <option value="Cloud / DevOps">Cloud / DevOps</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="QA / Testing">QA / Testing</option>
            <option value="UI/UX / Product Design">UI/UX / Product Design</option>
            <option value="IT Support">IT Support</option>
            <option value="Systems / Infrastructure">Systems / Infrastructure</option>
            <option value="Database">Database</option>
            <option value="Technical Business Analysis">Technical Business Analysis</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Role / Designation Filter */}
        <div className="relative w-36">
          <input
            type="text"
            placeholder="Role / Designation..."
            value={designationFilter}
            onChange={e => setDesignationFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
          />
        </div>

        {/* Location Filter */}
        <div className="relative w-36">
          <MapPin className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter location..."
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
          />
        </div>

        {/* Employment Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="appearance-none bg-muted border border-border text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            <option value="ALL">Type: All</option>
            <option value="FULL_TIME">Full-Time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
            <option value="PART_TIME">Part-Time</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Skill Filter */}
        <div className="relative w-32">
          <input
            type="text"
            placeholder="Skill (e.g. React)..."
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
          />
        </div>

        {/* Experience Filter */}
        <div className="relative">
          <select
            value={experienceFilter}
            onChange={e => setExperienceFilter(e.target.value)}
            className="appearance-none bg-muted border border-border text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            <option value="ALL">Experience: All</option>
            <option value="ENTRY">Entry / Fresh</option>
            <option value="EXPERIENCED">Experienced</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {(searchQuery || sourceFilter !== 'ALL' || categoryFilter !== 'ALL' || designationFilter || locationFilter || typeFilter !== 'ALL' || skillFilter || experienceFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSourceFilter('ALL');
              setCategoryFilter('ALL');
              setDesignationFilter('');
              setLocationFilter('');
              setTypeFilter('ALL');
              setSkillFilter('');
              setExperienceFilter('ALL');
            }}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 border-b border-border text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Opportunity</th>
                <th className="py-3 px-4">Location & Type</th>
                <th className="py-3 px-4">Required Skills</th>
                <th className="py-3 px-4">Posted</th>
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Loading job listings...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No job listings match your current filters.
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr 
                    key={job.id} 
                    onClick={() => handleSelectJob(job)}
                    className="hover:bg-muted/60 transition-colors cursor-pointer group"
                  >
                    {/* Job Title & Company */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground group-hover:text-blue-600 transition-colors flex items-center gap-1.5 flex-wrap">
                            <span>{job.title}</span>
                            {job.category && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                {job.category}
                              </span>
                            )}
                            {job.sourceChannel === 'AI_JOB_SCRAPER' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold uppercase tracking-wider">
                                Scraped
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{job.company}</span>
                            {job.normalizedDesignation && (
                              <>
                                <span>·</span>
                                <span className="text-slate-600 font-medium">Role: {job.normalizedDesignation}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location & Type */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{job.location}</div>
                      <div className="text-[11px] text-slate-400">
                        {job.employmentType.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Skills */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {job.requiredSkills.slice(0, 3).map(sk => (
                          <span key={sk} className="px-2 py-0.5 rounded bg-muted text-slate-700 text-[10px] font-medium">
                            {sk}
                          </span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{job.requiredSkills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Posted Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] font-medium">
                          {job.postedDate ? timeAgo(job.postedDate) : `Found ${timeAgo(job.discoveredAt || job.createdAt)}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {job.salaryRange}
                      </div>
                    </td>

                    {/* Source Channel Badge */}
                    <td className="py-3.5 px-4">
                      <SourceChannelBadge channel={job.sourceChannel} />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(job.applicationUrl || job.externalUrl) && (
                          <a
                            href={job.applicationUrl || job.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>OG Portal ↗</span>
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectJob(job);
                          }}
                          className="px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-muted rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                        {job.sourceChannel !== 'AI_JOB_SCRAPER' && job.sourceChannel !== 'ATS_JOB_API' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmJob(job);
                            }}
                            className="px-2 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Job Drawer / Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-border/70 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground text-base">{selectedJob.title}</h3>
                  <SourceChannelBadge channel={selectedJob.sourceChannel} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{selectedJob.company}</span>
                  <span>·</span>
                  <span>{selectedJob.location}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border/70 px-5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2.5 border-b-2 font-semibold transition-colors mr-4 ${
                  activeTab === 'details'
                    ? 'border-slate-900 text-foreground'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Job Specifications
              </button>
              <button
                onClick={() => setActiveTab('matching')}
                className={`py-2.5 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'matching'
                    ? 'border-slate-900 text-foreground'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Matching Candidates ({matchingCandidates.length})</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              
              {activeTab === 'details' ? (
                <>
                  {/* Compensation & Type */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg border border-border/70">
                      <span className="text-[11px] text-slate-400 block">Compensation</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 block">{selectedJob.salaryRange}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border border-border/70">
                      <span className="text-[11px] text-slate-400 block">Experience</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 block">{selectedJob.experienceRequirement}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border border-border/70">
                      <span className="text-[11px] text-slate-400 block">Deadline</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 block">
                        {new Date(selectedJob.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <h4 className="font-semibold uppercase tracking-wider text-[11px] mb-2 text-slate-400">
                      Required Technical Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.requiredSkills.map(sk => (
                        <span key={sk} className="px-2.5 py-1 rounded bg-muted text-slate-800 text-xs font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Skills */}
                  {selectedJob.preferredSkills && selectedJob.preferredSkills.length > 0 && (
                    <div>
                      <h4 className="font-semibold uppercase tracking-wider text-[11px] mb-2 text-slate-400">
                        Preferred Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.preferredSkills.map(sk => (
                          <span key={sk} className="px-2.5 py-1 rounded bg-muted border border-border text-slate-700 text-xs">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h4 className="font-semibold uppercase tracking-wider text-[11px] mb-2 text-slate-400">
                      About the Role
                    </h4>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                      {plainText(selectedJob.description)}
                    </p>
                  </div>
                </>
              ) : (
                /* Matching Candidates View */
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Rule-based matching against eligible candidates based on school alignment, required skills, and GPA.
                  </div>

                  {loadingMatches ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Calculating deterministic candidate match scores...
                    </div>
                  ) : matchingCandidates.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No eligible candidates currently match this opportunity criteria.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {matchingCandidates.map((m: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/60 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-xs sm:text-sm">
                                {m.student?.fullName || m.studentName || 'Candidate'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-slate-700 font-medium">
                                {m.student?.designation || 'Designation not available'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                m.matchScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                m.matchScore >= 65 ? 'bg-blue-100 text-blue-800' :
                                m.matchScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-muted text-slate-700'
                              }`}>
                                {m.matchLevel || `${m.matchScore}% Match`}
                              </span>
                            </div>

                            <span className="text-sm font-black text-foreground shrink-0">
                              {m.matchScore}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] pt-1 border-t border-border/70">
                            <div className="p-1.5 bg-white rounded border border-border/70">
                              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Role ({m.designationScore || 0}/40)</span>
                              <span className="font-medium text-slate-800 truncate block">{m.designationExplanation || 'Compatible'}</span>
                            </div>
                            <div className="p-1.5 bg-white rounded border border-border/70">
                              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Skills ({m.skillsScore || 0}/35)</span>
                              <span className="font-medium text-emerald-700 truncate block">✓ {(m.matchedSkills || []).slice(0, 2).join(', ') || 'Aligned'}</span>
                            </div>
                            <div className="p-1.5 bg-white rounded border border-border/70">
                              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Program ({m.programScore || 0}/15)</span>
                              <span className="font-medium text-slate-800 truncate block">{m.programExplanation || m.student?.program || 'Verified'}</span>
                            </div>
                            <div className="p-1.5 bg-white rounded border border-border/70">
                              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Experience ({m.experienceScore || 0}/10)</span>
                              <span className="font-medium text-slate-800 truncate block">{m.experienceExplanation || 'Compatible'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 border-t border-border/70 bg-muted/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">
                  Source: <strong className="text-slate-800">
                    {selectedJob.sourceChannel === 'AI_JOB_SCRAPER' 
                      ? 'AI Job Scraper' 
                      : selectedJob.sourceChannel === 'ATS_JOB_API'
                      ? 'ATS Public API'
                      : selectedJob.sourceChannel.replace('_', ' ')}
                  </strong>
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedJob.postedDate ? `Posted ${timeAgo(selectedJob.postedDate)}` : `Found ${timeAgo(selectedJob.discoveredAt || selectedJob.createdAt)}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedJob.sourceChannel !== 'AI_JOB_SCRAPER' && selectedJob.sourceChannel !== 'ATS_JOB_API' && (
                  <button
                    onClick={() => setDeleteConfirmJob(selectedJob)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 rounded-lg font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                {(selectedJob.applicationUrl || selectedJob.externalUrl) && (
                  <a
                    href={selectedJob.applicationUrl || selectedJob.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 border border-blue-700 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Go to OG Job Portal ↗</span>
                  </a>
                )}

                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Manual Job Posting Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-border shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border/70 flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">Post New Job Opportunity</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Junior Frontend Engineer"
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="e.g. NetSol Technologies"
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Country</label>
                  <div className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-slate-700 font-medium flex items-center gap-1.5">
                    <span>🇮🇳</span>
                    <span>India (Market Default)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">City / State / Remote *</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="e.g. Kochi, Kerala / Bangalore / Remote - India"
                    className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Salary Range (INR)</label>
                <input
                  type="text"
                  value={newSalary}
                  onChange={e => setNewSalary(e.target.value)}
                  placeholder="e.g. ₹6,00,000 - ₹10,00,000 / annum"
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={e => setNewSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Sourcing Channel</label>
                <select
                  value={newChannel}
                  onChange={e => setNewChannel(e.target.value as JobSourceChannel)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs cursor-pointer"
                >
                  <option value="PLACEMENT_DIRECT">Placement Team Direct</option>
                  <option value="STAFF_REFERRAL">Staff Referral</option>
                  <option value="INBOUND">Inbound</option>
                  <option value="OUTREACH">Outreach</option>
                  <option value="REPEATED_PARTNER">Repeated Partner</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Application link *</label>
                <input
                  type="url"
                  required
                  value={newApplyUrl}
                  onChange={e => setNewApplyUrl(e.target.value)}
                  placeholder="https://company.com/careers/… or the LinkedIn / Naukri posting"
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">Students are sent here when they press Apply.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Job Role *</label>
                <select
                  required
                  value={newJobRole}
                  onChange={e => setNewJobRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs cursor-pointer"
                >
                  <option value="" disabled>Select Job Role...</option>
                  {JOB_ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Job duties, requirements, expectations..."
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-slate-600 hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmJob && (
        <div className="fixed inset-0 bg-navy/50 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-border shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border/70">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                Delete this job post?
              </h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to delete:
              </p>

              <div className="p-3 bg-muted rounded-lg border border-border/70">
                <div className="font-bold text-foreground">{deleteConfirmJob.title}</div>
                <div className="text-slate-500 mt-0.5">{deleteConfirmJob.company}</div>
                {deleteConfirmJob.normalizedDesignation && (
                  <div className="text-slate-500 mt-0.5">Role: {deleteConfirmJob.normalizedDesignation}</div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                This job was posted by the Placement Team. This action cannot be undone.
              </p>
            </div>

            <div className="p-4 px-5 border-t border-border/70 bg-muted/60 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setDeleteConfirmJob(null)}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-lg border border-border text-slate-600 hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(deleteConfirmJob)}
                disabled={deleting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete Job'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
