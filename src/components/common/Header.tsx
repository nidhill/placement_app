import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types.ts';
import { 
  Search, 
  Menu, 
  RotateCcw, 
  CalendarDays,
  Shield,
  Briefcase,
  BarChart3,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  RefreshCw,
  User as UserIcon,
  Bell
} from 'lucide-react';
import { NavigationItem } from './Sidebar.tsx';

interface HeaderProps {
  currentTab?: NavigationItem;
  pageTitle?: string;
  pageSubtitle?: string;
  currentUser?: User | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenPersonaModal: () => void;
  onResetSystem?: () => void;
  isResetting?: boolean;
  onSignOut?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'dashboard',
  pageTitle,
  pageSubtitle,
  currentUser,
  isSidebarCollapsed = true,
  onToggleSidebar,
  onOpenMobileMenu,
  onOpenPersonaModal,
  onResetSystem,
  isResetting = false,
  onSignOut,
  searchQuery = '',
  onSearchChange
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabTitle = (tab?: string) => {
    switch (tab) {
      case 'dashboard': return 'Overview';
      case 'students': return 'Students';
      case 'jobs': return 'Job Directory';
      case 'applications': return 'Applications';
      case 'interviews': return 'Scheduled Interviews';
      case 'candidate_matching': return 'Candidate Matching';
      case 'job_sources': return 'Job Sources';
      case 'follow_ups': return 'Follow-ups & Interventions';
      case 'mgmt_schools': return 'School Analysis';
      case 'mgmt_programs': return 'Program Conversion';
      case 'mgmt_batches': return 'Batch Trajectory';
      case 'mgmt_sources': return 'Corporate Acquisition';
      case 'analytics': return 'Placement Analytics';
      case 'reports': return 'Executive Reports';
      case 'users': return 'User Management';
      case 'integrations': return 'System Integrations';
      case 'audit_logs': return 'Audit Logs';
      case 'settings': return 'Emergency Overrides & Settings';
      case 'student_dashboard': return 'Student Dashboard';
      case 'student_profile':
      case 'profile': return 'Student Profile';
      case 'student_jobs': return 'Find Jobs';
      case 'student_applications': return 'My Applications';
      case 'student_interviews': return 'My Interviews';
      case 'student_notifications': return 'Notifications';
      default: return 'Placement Management';
    }
  };

  const getRoleLabel = (r?: UserRole) => {
    switch (r) {
      case 'MAIN_ADMIN': return 'Main Admin';
      case 'PLACEMENT_OFFICER': return 'Placement Officer';
      case 'MANAGEMENT': return 'Management';
      case 'STUDENT': return 'Student';
      default: return 'Institutional Staff';
    }
  };

  const getRoleIcon = (r?: UserRole) => {
    switch (r) {
      case 'MAIN_ADMIN': return Shield;
      case 'PLACEMENT_OFFICER': return Briefcase;
      case 'MANAGEMENT': return BarChart3;
      case 'STUDENT': return GraduationCap;
      default: return UserIcon;
    }
  };

  const RoleIcon = getRoleIcon(currentUser?.role);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none">
      
      {/* Left: Sidebar Toggle & Page Titles */}
      <div className="flex items-center gap-3">
        
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse / Expand Toggle Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="border-l border-slate-200/60 pl-3 hidden sm:block">
          {pageSubtitle && (
            <div className="text-[11px] font-medium text-slate-400 leading-none mb-0.5">
              {pageSubtitle}
            </div>
          )}
          <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            {pageTitle || getTabTitle(currentTab)}
          </h1>
        </div>

        {/* Fallback for small screens */}
        <div className="sm:hidden">
          <h1 className="text-sm font-bold text-slate-900 leading-tight">
            {pageTitle || getTabTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Right: Search, Academic Cycle, Notifications & Role Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Search Bar */}
        <div className="relative hidden lg:block w-52 xl:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students, jobs..."
            value={searchQuery}
            onChange={e => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white text-slate-800 placeholder-slate-400 shadow-2xs"
          />
        </div>

        {/* Academic Year Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-xs font-medium border border-slate-200/50">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span>Academic Cycle: 2026</span>
        </div>

        {/* Reset Seed Data Button */}
        {onResetSystem && (
          <button
            id="btn-reset-seed-data"
            onClick={onResetSystem}
            disabled={isResetting}
            title={isResetting ? "Resetting database..." : "Reset database to initial HACA seed state"}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors hidden sm:inline-flex disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}

        {/* Notifications Icon (Subtle) */}
        <div className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute top-2 right-2" />
        </div>

        {/* User Profile & Role Indicator Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(prev => !prev)}
            id="user-profile-button"
            className="flex items-center gap-2.5 pl-2 pr-2.5 py-1 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-all text-left shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'}
            </div>
            
            <div className="hidden sm:block text-left leading-tight">
              <span className="text-xs font-semibold text-slate-900 block truncate max-w-[130px]">
                {currentUser?.fullName || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <RoleIcon className="w-3 h-3 text-slate-400" />
                <span>{getRoleLabel(currentUser?.role)}</span>
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              
              {/* User Details */}
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.fullName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {currentUser?.email}
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 text-[10px] font-semibold text-slate-700">
                  <RoleIcon className="w-3 h-3 text-slate-500" />
                  <span>{getRoleLabel(currentUser?.role)}</span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenPersonaModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Switch Demo Role</span>
                </button>

                {onResetSystem && (
                  <button
                    id="menu-reset-seed-data"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onResetSystem();
                    }}
                    disabled={isResetting}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
                    <span>{isResetting ? 'Resetting Seed Data...' : 'Reset Seed Data'}</span>
                  </button>
                )}

                {onSignOut && (
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};
