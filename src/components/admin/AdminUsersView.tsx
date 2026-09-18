import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { RoleBadge } from '../common/StatusBadge.tsx';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  Plus, 
  X, 
  ChevronDown, 
  UserPlus, 
  AlertCircle,
  Trash2,
  UserX,
  UserCheck,
  ArrowLeftRight,
  Loader2
} from 'lucide-react';

interface AdminUsersViewProps {
  onRefreshData?: () => void;
  currentUserId?: string;
}

// What the admin is about to do to a row; rendered as one confirm dialog.
type PendingAction =
  | { kind: 'role'; user: User; role: UserRole }
  | { kind: 'revoke'; user: User }
  | { kind: 'restore'; user: User }
  | { kind: 'delete'; user: User };

const ROLE_LABEL: Record<string, string> = { MAIN_ADMIN: 'Admin', PLACEMENT_OFFICER: 'Placement Team', MANAGEMENT: 'Management', STUDENT: 'Student' };

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onRefreshData, currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('PLACEMENT_OFFICER');
  const [newDept, setNewDept] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Row actions
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Leadership / CEO / Admin rows are SHO App staff accounts; the tool only
  // manages the accounts it created (Placement Team). Role change is also
  // open to Management rows so a leader can be moved onto the team.
  const isSelf = (u: User) => u.id === currentUserId;
  const canManage = (u: User) => u.role === 'PLACEMENT_OFFICER' && !isSelf(u);
  const canChangeRole = (u: User) => (u.role === 'PLACEMENT_OFFICER' || u.role === 'MANAGEMENT') && !isSelf(u);

  const runPending = async () => {
    if (!pending) return;
    setActing(true); setActionError(null);
    try {
      let msg = '';
      if (pending.kind === 'role') msg = (await api.changeUserRole(pending.user.id, pending.role)).message;
      else if (pending.kind === 'revoke') msg = (await api.revokeUser(pending.user.id)).message;
      else if (pending.kind === 'restore') msg = (await api.restoreUser(pending.user.id)).message;
      else msg = (await api.deleteUser(pending.user.id)).message;
      setPending(null);
      setToast(msg);
      setTimeout(() => setToast(null), 3500);
      loadUsers();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionError(err?.message || 'Action failed.');
    } finally {
      setActing(false);
    }
  };

  const pendingCopy = (a: PendingAction) => {
    const name = a.user.fullName;
    switch (a.kind) {
      case 'role': return {
        title: `Change ${name} to ${ROLE_LABEL[a.role]}?`,
        body: a.role === 'MANAGEMENT'
          ? `${name} will get read-only dashboards and analytics here, and their SHO App role becomes Leadership. They will be signed out and must log in again.`
          : `${name} will be able to manage jobs, applications, interviews and syncs, and their SHO App role becomes Placement Team. They will be signed out and must log in again.`,
        cta: 'Change role', danger: false };
      case 'revoke': return { title: `Revoke access for ${name}?`, body: 'They will be signed out immediately and cannot log in to the placement tool or the SHO App until restored.', cta: 'Revoke access', danger: true };
      case 'restore': return { title: `Restore access for ${name}?`, body: 'They will be able to log in again with their existing password.', cta: 'Restore access', danger: false };
      case 'delete': return { title: `Delete ${name}?`, body: `This permanently removes ${a.user.email} from the SHO App. Their audit history stays. This cannot be undone.`, cta: 'Delete user', danger: true };
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await api.provisionUser({
        fullName: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        department: newDept.trim() || 'Placement Directorate'
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewDept('');
      loadUsers();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const officersCount = users.filter(u => u.role === 'PLACEMENT_OFFICER').length;
  const studentsCount = users.filter(u => u.role === 'STUDENT').length;
  const managementCount = users.filter(u => u.role === 'MANAGEMENT').length;

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">User Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          System administration and role-based staff provisioning
        </p>
      </div>

      {/* Security Info Card & Role Counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Security Info Card */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
              Administrator
            </span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{users.filter(u => u.role === 'MAIN_ADMIN').length}</div>
            <div className="text-[11px] text-slate-400 mt-1">SHO App admins</div>
          </div>
          <ShieldCheck className="w-8 h-8 text-slate-400 shrink-0" />
        </div>

        {/* Placement Teams */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
            Placement Teams
          </span>
          <div className="text-2xl font-bold text-foreground mt-0.5">{officersCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Employer sourcing & matching</span>
        </div>

        {/* Students */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
            Active Students
          </span>
          <div className="text-2xl font-bold text-foreground mt-0.5">{studentsCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Student placement accounts</span>
        </div>

        {/* Management */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
            Executive Management
          </span>
          <div className="text-2xl font-bold text-foreground mt-0.5">{managementCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Audit & KPI governance</span>
        </div>
      </div>

      {/* Table Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-slate-800"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-border text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="MAIN_ADMIN">Administrator</option>
              <option value="PLACEMENT_OFFICER">Placement Team</option>
              <option value="MANAGEMENT">Management</option>
              <option value="STUDENT">Student</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Add User Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Clean Users Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 border-b border-border text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-muted/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center font-semibold text-slate-700 text-xs">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{user.fullName}</div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <RoleBadge role={user.role} />
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {user.department || 'Academic Affairs'}
                  </td>

                  <td className="py-3 px-4">
                    {user.isActive !== false ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Revoked
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {canChangeRole(user) && (
                        <button
                          onClick={() => setPending({ kind: 'role', user, role: user.role === 'PLACEMENT_OFFICER' ? 'MANAGEMENT' : 'PLACEMENT_OFFICER' })}
                          title={`Change to ${user.role === 'PLACEMENT_OFFICER' ? 'Management' : 'Placement Team'}`}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">{user.role === 'PLACEMENT_OFFICER' ? 'Make Management' : 'Make Placement Team'}</span>
                        </button>
                      )}
                      {canManage(user) && (user.isActive !== false ? (
                        <button onClick={() => setPending({ kind: 'revoke', user })} title="Revoke access" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-muted hover:text-amber-600 transition-colors">
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => setPending({ kind: 'restore', user })} title="Restore access" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-muted hover:text-emerald-600 transition-colors">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ))}
                      {canManage(user) && (
                        <button onClick={() => setPending({ kind: 'delete', user })} title="Delete user" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {!canManage(user) && !canChangeRole(user) && (
                        <span className="text-[11px] text-slate-400" title="Managed in SHO App → Users">{isSelf(user) ? 'You' : 'SHO App'}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM ROW ACTION */}
      {pending && (() => { const c = pendingCopy(pending); return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/30 backdrop-blur-xs" onClick={() => !acting && setPending(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-sm p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${c.danger ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
              {pending.kind === 'delete' ? <Trash2 className="w-5 h-5" /> : pending.kind === 'revoke' ? <UserX className="w-5 h-5" /> : pending.kind === 'restore' ? <UserCheck className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
            </div>
            <h3 className="text-base font-bold text-foreground">{c.title}</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{c.body}</p>
            {actionError && (
              <div className="mt-3 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{actionError}</span>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPending(null)} disabled={acting} className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-muted transition-colors">Cancel</button>
              <button onClick={runPending} disabled={acting} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-60 ${c.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}>
                {acting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{c.cta}
              </button>
            </div>
          </div>
        </div>
      ); })()}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-navy text-white text-xs font-semibold shadow-xl animate-fade-up">{toast}</div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleCreateUser}>
              <div className="p-4 px-5 border-b border-border/70 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Provision Staff Account</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Farah Naz"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@harisandcoacademy.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="PLACEMENT_OFFICER">Placement Team</option>
                    <option value="MANAGEMENT">Executive Management</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Admins are created in the SHO App. Students join automatically once a mentor marks them placement-eligible.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department / Division</label>
                  <input
                    type="text"
                    placeholder="e.g. Career & Industry Relations"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full p-2 bg-muted border border-border rounded-lg text-foreground focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="p-4 px-5 border-t border-border/70 bg-muted flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border text-slate-600 hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
