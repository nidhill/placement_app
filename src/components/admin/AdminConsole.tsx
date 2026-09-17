import React, { useState, useEffect } from 'react';
import { 
  User, 
  StudentProfile, 
  AuditLog, 
  LmsSyncConfig, 
  ApifyScraperConfig, 
  EligibilityStatus, 
  UserRole 
} from '../../types.ts';
import { api } from '../../lib/api.ts';
import { EligibilityBadge, RoleBadge } from '../common/StatusBadge.tsx';
import { 
  ShieldAlert, 
  UserPlus, 
  RefreshCw, 
  Bot, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  Sparkles,
  Search,
  ExternalLink,
  Ban,
  Clock
} from 'lucide-react';

interface AdminConsoleProps {
  onRefreshData?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onRefreshData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'override' | 'lms' | 'apify' | 'audit'>('users');
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [lmsConfig, setLmsConfig] = useState<LmsSyncConfig | null>(null);
  const [apifyConfig, setApifyConfig] = useState<ApifyScraperConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states: User Provisioning
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('PLACEMENT_OFFICER');
  const [newDepartment, setNewDepartment] = useState('');

  // Form states: Emergency Override
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<EligibilityStatus>('ADMIN_OVERRIDE');
  const [overrideReason, setOverrideReason] = useState('');

  // Search filter for audit logs
  const [auditSearch, setAuditSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, stRes, aRes, lRes, apRes] = await Promise.all([
        api.getUsers(),
        api.getStudents(), // fetch all students
        api.getAuditLogs(),
        api.getLmsConfig(),
        api.getApifyConfig()
      ]);
      setUsers(uRes.users);
      setStudents(stRes.students);
      setAuditLogs(aRes.auditLogs);
      setLmsConfig(lRes);
      setApifyConfig(apRes);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newFullName) return;

    // Strict front-end check as well
    if (newRole === 'MAIN_ADMIN') {
      setActionMessage({
        type: 'error',
        text: 'ARCHITECTURAL RULE: There can only be ONE Main Admin in the entire system. Creating a second Main Admin is strictly forbidden.'
      });
      return;
    }

    try {
      const res = await api.provisionUser({
        email: newEmail,
        fullName: newFullName,
        role: newRole,
        department: newDepartment || 'HACA Career Operations'
      });
      setActionMessage({ type: 'success', text: `Provisioned account for ${res.user.fullName} (${res.user.role}).` });
      setNewEmail('');
      setNewFullName('');
      setNewDepartment('');
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleRevokeUser = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke this user account?')) return;
    try {
      const res = await api.revokeUser(userId);
      setActionMessage({ type: 'success', text: `Revoked access for ${res.user.fullName}.` });
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleExecuteEmergencyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !overrideReason) {
      setActionMessage({ type: 'error', text: 'Please select a student and provide a documented reason.' });
      return;
    }

    try {
      const res = await api.overrideEligibility(selectedStudentId, overrideStatus, overrideReason);
      setActionMessage({ 
        type: 'success', 
        text: `Emergency override executed! Student ${res.student.fullName} status updated to ${res.student.eligibilityStatus}.` 
      });
      setSelectedStudentId('');
      setOverrideReason('');
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleTriggerLmsSync = async () => {
    setLoading(true);
    try {
      const res = await api.syncLms();
      setActionMessage({
        type: 'success',
        text: `LMS Sync Complete! Ingested ${res.syncedCount} new student records, updated ${res.updatedCount} academic profiles.`
      });
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRunApifyScraper = async () => {
    setLoading(true);
    try {
      const res = await api.runApifyScraper();
      setActionMessage({
        type: 'success',
        text: `Apify Scraper Ingestion Complete! Added ${res.ingestedCount} new leads tagged with "AI Job Scraper Agent", skipped ${res.skippedDuplicatesCount} duplicates.`
      });
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Root Admin Authority Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Root Governance Authority
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Main Admin Control Center</h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Sole root platform authority for HACA. Manages secondary account provisioning, LMS integration, Apify scraping rules, and emergency student eligibility overrides.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              1/1
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Root Admin Constraint</div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exactly ONE Root Active
              </div>
              <div className="text-[11px] text-slate-400">Creation of second Main Admin blocked at DB level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm flex items-start justify-between gap-3 ${actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs underline hover:opacity-80">Dismiss</button>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <UserPlus className="w-4 h-4" /> User Provisioning & RBAC ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('override')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'override' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Emergency Eligibility Override
        </button>
        <button
          onClick={() => setActiveSubTab('lms')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'lms' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <RefreshCw className="w-4 h-4" /> Academic LMS Synchronization
        </button>
        <button
          onClick={() => setActiveSubTab('apify')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'apify' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Bot className="w-4 h-4" /> Apify Job Scraper Rules
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <FileText className="w-4 h-4" /> System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* 1. USER PROVISIONING & RBAC TAB */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Provision New Account Form */}
          <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Provision Staff Account</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Main Admin creates accounts for Placement Officers and Management.
              </p>
            </div>

            <form onSubmit={handleProvisionUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Asad Rizvi"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  placeholder="e.g. asad@haca.edu"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="PLACEMENT_OFFICER">Placement Officer</option>
                  <option value="MANAGEMENT">Executive Management</option>
                  <option value="MAIN_ADMIN" disabled>Main Admin (Disabled - Max 1 Allowed)</option>
                </select>
                <p className="text-[11px] text-amber-700 mt-1 font-medium">
                  * Note: "Main Admin" role cannot be selected. Only 1 root admin account can exist.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Division</label>
                <input
                  type="text"
                  placeholder="e.g. Tech Placements, Academic Faculty"
                  value={newDepartment}
                  onChange={e => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
              >
                Provision Account
              </button>
            </form>
          </div>

          {/* Active Users Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">System Users & Accounts</h3>
                <p className="text-xs text-slate-500">All registered stakeholders across the HACA ecosystem</p>
              </div>
              <span className="text-xs text-slate-500 font-medium">{users.length} Total Registered</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">User</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {u.department || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'MAIN_ADMIN' && u.isActive && (
                          <button
                            onClick={() => handleRevokeUser(u.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline inline-flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" /> Revoke
                          </button>
                        )}
                        {u.role === 'MAIN_ADMIN' && (
                          <span className="text-[10px] text-slate-400 italic">Protected Root</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. EMERGENCY OVERRIDE TAB */}
      {activeSubTab === 'override' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Single Main Admin Exclusive Power
            </div>
            <h3 className="text-lg font-bold text-slate-900">Emergency Student Eligibility Override</h3>
            <p className="text-xs text-slate-600 mt-1">
              Main Admin directly manages and overrides student eligibility states. All overrides are permanently recorded in the system audit log.
            </p>
          </div>

          <form onSubmit={handleExecuteEmergencyOverride} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student Candidate</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              >
                <option value="">-- Select Candidate --</option>
                {students.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.school} - {st.program}) | Current Status: {st.eligibilityStatus}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Eligibility State</label>
              <select
                value={overrideStatus}
                onChange={e => setOverrideStatus(e.target.value as EligibilityStatus)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ADMIN_OVERRIDE">ADMIN_OVERRIDE (Force-activate student placement access)</option>
                <option value="ELIGIBLE">ELIGIBLE (Mark as standard eligible)</option>
                <option value="NOT_ELIGIBLE">NOT_ELIGIBLE (Revoke placement access)</option>
                <option value="PENDING_MENTOR_APPROVAL">PENDING_REVIEW (Return to eligibility review)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Formal Override Justification (Mandatory for Audit Trail)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Academic Dean waiver granted; validated 2 years prior industry experience; special corporate partner fast-track request."
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" /> Apply Emergency Override & Record Audit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. LMS INTEGRATION TAB */}
      {activeSubTab === 'lms' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Academic LMS Synchronization Architecture</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Ingests student demographics, academic milestones, attendance records, and project evaluations.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Automated Daily Sync · 2:00 AM</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Integration Status</div>
              <div className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {lmsConfig?.status || 'CONNECTED'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Direct Database / REST Sync Layer</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Last Synchronized</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {lmsConfig?.lastSyncTimestamp ? new Date(lmsConfig.lastSyncTimestamp).toLocaleString() : 'Just now'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Automated 60-min interval configured</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Total Records Ingested</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {lmsConfig?.totalRecordsSynced || 128} Student Records
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Duplicate detection enabled</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-800">LMS Integration Configuration</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">LMS REST API Endpoint:</span>
                <code className="text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 text-[11px] block mt-0.5">
                  {lmsConfig?.endpoint || 'https://lms.haca.edu/api/v1/sync'}
                </code>
              </div>
              <div>
                <span className="text-slate-500 block">API Key / Bearer:</span>
                <code className="text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 text-[11px] block mt-0.5">
                  lms_bearer_live_••••••••••••••••
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. APIFY JOB SCRAPER TAB */}
      {activeSubTab === 'apify' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Job Scraper Agent (Apify Integration)</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Automated external job board scraper feeding leads tagged with "AI Job Scraper Agent" into the matching engine.
              </p>
            </div>

            <button
              onClick={handleRunApifyScraper}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Bot className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Execute Scraper Agent Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200">
              <div className="text-xs text-purple-700 font-medium">Actor Status</div>
              <div className="text-base font-bold text-purple-900 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                ACTIVE (Apify Cloud)
              </div>
              <div className="text-[11px] text-purple-600 mt-0.5">Actor: {apifyConfig?.actorId}</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Target Job Boards</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {apifyConfig?.targetBoards.map(b => (
                  <span key={b} className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Processed Leads Total</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {apifyConfig?.leadsProcessedTotal || 48} Leads
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Duplicate detection active</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-800">Scraper Architecture Pipeline</div>
            <p className="text-slate-600 text-[11px]">
              Apify Actor → Scraped Job Data → Validation / Normalization → Duplicate Detection → Job Database (Source Tag: AI Job Scraper) → Matching Engine
            </p>
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS TAB */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Immutable System Audit Trail</h3>
              <p className="text-xs text-slate-500">Every administrative action, eligibility change, and override is permanently logged</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Audit Record Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs
                  .filter(l => 
                    !auditSearch || 
                    l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
                    l.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
                    l.action.toLowerCase().includes(auditSearch.toLowerCase())
                  )
                  .map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{log.actorName}</div>
                        <RoleBadge role={log.actorRole} className="mt-0.5" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">
                        {log.entityType} ({log.entityId})
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
