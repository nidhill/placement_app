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
  AlertCircle 
} from 'lucide-react';

interface AdminUsersViewProps {
  onRefreshData?: () => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onRefreshData }) => {
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
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">User Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          System administration and role-based staff provisioning
        </p>
      </div>

      {/* Security Info Card & Role Counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Security Info Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
              Main Administrator
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">Single Root Account</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active (HACA Root)
            </div>
          </div>
          <ShieldCheck className="w-8 h-8 text-slate-400 shrink-0" />
        </div>

        {/* Placement Officers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
            Placement Officers
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{officersCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Employer sourcing & matching</span>
        </div>

        {/* Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
            Active Students
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{studentsCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Student placement accounts</span>
        </div>

        {/* Management */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block uppercase tracking-wider">
            Executive Management
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{managementCount}</div>
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
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="MAIN_ADMIN">Administrator</option>
              <option value="PLACEMENT_OFFICER">Placement Officer</option>
              <option value="MANAGEMENT">Management</option>
              <option value="STUDENT">Student</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Add User Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Clean Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-700 text-xs">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.fullName}</div>
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
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                    Today
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleCreateUser}>
              <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Provision Staff Account</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. farah.naz@haca.edu.pk"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="PLACEMENT_OFFICER">Placement Officer</option>
                    <option value="MANAGEMENT">Executive Management</option>
                    <option value="STUDENT">Student</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Single Main Admin rule enforced: System strictly forbids secondary Main Admin creation.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department / Division</label>
                  <input
                    type="text"
                    placeholder="e.g. Career & Industry Relations"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="p-4 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
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
