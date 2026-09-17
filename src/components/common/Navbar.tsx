import React from 'react';
import { User, UserRole } from '../../types.ts';
import { RoleBadge } from './StatusBadge.tsx';
import { 
  Building2, 
  RotateCcw, 
  ShieldCheck, 
  ChevronDown,
  Lock
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onResetSystem: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onResetSystem,
  activeTab,
  setActiveTab
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Group personas for convenient testing (Exactly 4 roles)
  const mainAdmin = allUsers.find(u => u.role === 'MAIN_ADMIN');
  const placementOfficers = allUsers.filter(u => u.role === 'PLACEMENT_OFFICER');
  const management = allUsers.filter(u => u.role === 'MANAGEMENT');
  const students = allUsers.filter(u => u.role === 'STUDENT');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Institute Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">HACA</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Placement Platform</span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-amber-600" /> Single Main Admin Model
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Connecting LMS Student Data with Career Operations & Governance</p>
            </div>
          </div>

          {/* Persona Switcher & Controls */}
          <div className="flex items-center gap-3">
            
            {/* System Reset Button */}
            <button
              onClick={onResetSystem}
              title="Reset data store back to initial seed state"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Reset Seed Data</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-300 font-bold flex items-center justify-center text-xs">
                  {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    {currentUser?.fullName || 'User'}
                    {currentUser?.role && <RoleBadge role={currentUser.role} />}
                  </div>
                  <div className="text-[10px] text-slate-500">{currentUser?.email}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 divide-y divide-slate-100 text-xs">
                  <div className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    Switch Test Persona / Stakeholder
                  </div>

                  {/* Root Admin */}
                  {mainAdmin && (
                    <div className="p-1">
                      <button
                        onClick={() => {
                          onSelectUser(mainAdmin);
                          setActiveTab('admin');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 flex items-center justify-between ${currentUser.id === mainAdmin.id ? 'bg-amber-50 font-semibold text-slate-900' : 'text-slate-700'}`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">{mainAdmin.fullName}</div>
                          <div className="text-[10px] text-slate-500">Sole Platform Super User</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-bold">ROOT ADMIN</span>
                      </button>
                    </div>
                  )}

                  {/* Placement Officers */}
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase">Placement Team</div>
                    {placementOfficers.map(po => (
                      <button
                        key={po.id}
                        onClick={() => {
                          onSelectUser(po);
                          setActiveTab('placement');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-100 flex items-center justify-between ${currentUser.id === po.id ? 'bg-teal-50 font-semibold' : 'text-slate-700'}`}
                      >
                        <span>{po.fullName}</span>
                        <span className="text-[10px] text-teal-700 font-medium">{po.department}</span>
                      </button>
                    ))}
                  </div>

                  {/* Management */}
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase">Executive Management</div>
                    {management.map(mgmt => (
                      <button
                        key={mgmt.id}
                        onClick={() => {
                          onSelectUser(mgmt);
                          setActiveTab('management');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-100 flex items-center justify-between ${currentUser.id === mgmt.id ? 'bg-indigo-50 font-semibold' : 'text-slate-700'}`}
                      >
                        <span>{mgmt.fullName}</span>
                        <span className="text-[10px] text-indigo-700 font-medium">Executive Board</span>
                      </button>
                    ))}
                  </div>

                  {/* Students (Eligible & Gated) */}
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase flex items-center justify-between">
                      <span>Students (Candidates)</span>
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded">Test Gated Access</span>
                    </div>
                    {students.map(st => {
                      const isHamza = st.email.includes('hamza');
                      const isOmar = st.email.includes('omar');
                      return (
                        <button
                          key={st.id}
                          onClick={() => {
                            onSelectUser(st);
                            setActiveTab('student');
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-100 flex items-center justify-between ${currentUser.id === st.id ? 'bg-emerald-50 font-semibold' : 'text-slate-700'}`}
                        >
                          <div>
                            <div>{st.fullName}</div>
                            <div className="text-[10px] text-slate-400">{st.department}</div>
                          </div>
                          {isHamza ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> GATED
                            </span>
                          ) : isOmar ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> INELIGIBLE
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              ELIGIBLE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
