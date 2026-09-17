import React from 'react';
import { User, UserRole } from '../../types.ts';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileCheck2, 
  Calendar, 
  BarChart3, 
  FileSpreadsheet, 
  UserCog, 
  Sliders, 
  History, 
  Settings, 
  GraduationCap,
  UserCheck,
  Building,
  Layers,
  FolderTree,
  Share2,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  RefreshCw
} from 'lucide-react';

export type NavigationItem = 
  // Shared / General
  | 'dashboard'
  | 'students'
  | 'jobs'
  | 'applications'
  | 'interviews'
  | 'analytics'
  | 'reports'
  | 'profile'
  // Main Admin Administration
  | 'users'
  | 'integrations'
  | 'audit_logs'
  | 'settings'
  // Placement Officer specific
  | 'candidate_matching'
  | 'job_sources'
  | 'follow_ups'
  // Management specific
  | 'mgmt_schools'
  | 'mgmt_programs'
  | 'mgmt_batches'
  | 'mgmt_sources'
  // Student Portal specific
  | 'student_dashboard'
  | 'student_profile'
  | 'student_jobs'
  | 'student_applications'
  | 'student_interviews'
  | 'student_notifications';

export type NavItemId = NavigationItem;

interface NavLinkConfig {
  id: NavigationItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  currentTab?: NavigationItem;
  activeNav?: NavigationItem;
  onSelectTab?: (tab: NavigationItem) => void;
  onSelectNav?: (tab: NavigationItem) => void;
  currentUser: User | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenPersonaModal: () => void;
  onSignOut?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeNav,
  onSelectTab,
  onSelectNav,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  onOpenPersonaModal,
  onSignOut,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const selected = activeNav || currentTab || 'dashboard';
  const handleNav = onSelectNav || onSelectTab || (() => {});

  const handleNavClick = (tab: NavigationItem) => {
    handleNav(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const role: UserRole = currentUser?.role || 'MAIN_ADMIN';

  const isItemActive = (item: NavigationItem) => {
    if (selected === item) return true;
    if ((item === 'student_profile' || item === 'profile') && (selected === 'student_profile' || selected === 'profile')) return true;
    if ((item === 'student_jobs' || item === 'jobs') && (selected === 'student_jobs' || selected === 'jobs')) return true;
    if ((item === 'student_applications' || item === 'applications') && (selected === 'student_applications' || selected === 'applications')) return true;
    if ((item === 'student_dashboard' || item === 'dashboard') && (selected === 'student_dashboard' || selected === 'dashboard')) return true;
    return false;
  };

  const getRoleDisplayName = (r: UserRole) => {
    switch (r) {
      case 'MAIN_ADMIN': return 'Main Admin';
      case 'PLACEMENT_OFFICER': return 'Placement Officer';
      case 'MANAGEMENT': return 'Management';
      case 'STUDENT': return 'Student';
      default: return 'User';
    }
  };

  // Nav item renderer
  const renderNavItem = (item: NavLinkConfig) => {
    const active = isItemActive(item.id);
    const Icon = item.icon;

    if (isCollapsed) {
      return (
        <button
          key={item.id}
          id={`nav-${item.id}`}
          onClick={() => handleNavClick(item.id)}
          title={item.label}
          className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 relative group ${
            active
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          
          {/* Tooltip on hover in collapsed mode */}
          <span className="sr-only">{item.label}</span>
          <div className="hidden md:group-hover:flex absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap z-50 pointer-events-none shadow-md">
            {item.label}
          </div>
        </button>
      );
    }

    return (
      <button
        key={item.id}
        id={`nav-${item.id}`}
        onClick={() => handleNavClick(item.id)}
        className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
          active
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Icon className={`w-4 h-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  // Define role navigation sets per user intent
  const adminOverviewNav: NavLinkConfig[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: FileCheck2 },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'analytics', label: 'Placement Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const adminAdminNav: NavLinkConfig[] = [
    { id: 'users', label: 'Users', icon: UserCog },
    { id: 'integrations', label: 'Integrations', icon: Sliders },
    { id: 'audit_logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const placementOfficerNav: NavLinkConfig[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: FileCheck2 },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'candidate_matching', label: 'Candidate Matching', icon: UserCheck },
    { id: 'job_sources', label: 'Job Sources', icon: Share2 },
    { id: 'follow_ups', label: 'Follow-ups', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const managementNav: NavLinkConfig[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Placement Analytics', icon: BarChart3 },
    { id: 'mgmt_schools', label: 'Schools', icon: Building },
    { id: 'mgmt_programs', label: 'Programs', icon: Layers },
    { id: 'mgmt_batches', label: 'Batches', icon: FolderTree },
    { id: 'mgmt_sources', label: 'Job Sources', icon: Share2 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const studentNav: NavLinkConfig[] = [
    { id: 'student_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student_profile', label: 'My Profile', icon: UserIcon },
    { id: 'student_jobs', label: 'Find Jobs', icon: Briefcase },
    { id: 'student_applications', label: 'My Applications', icon: FileCheck2 },
    { id: 'student_interviews', label: 'Interviews', icon: Calendar },
    { id: 'student_notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Element */}
      <aside 
        id="app-left-sidebar"
        className={`
          bg-white border-r border-slate-200/90 flex flex-col shrink-0 h-full select-none
          transition-[width,transform] duration-200 ease-in-out
          fixed md:relative top-0 bottom-0 left-0 z-50 md:z-20
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-[68px]' : 'w-64'}
        `}
      >
        {/* Brand Header & Collapse Toggle */}
        <div className={`h-16 border-b border-slate-100 flex items-center px-3.5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div 
              onClick={isCollapsed ? onToggleCollapse : undefined}
              className={`w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xs ${isCollapsed ? 'cursor-pointer hover:bg-slate-800' : ''}`}
              title="HACA Placement Platform"
            >
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <div className="font-bold text-slate-900 text-sm tracking-tight leading-tight">HACA</div>
                <div className="text-[11px] text-slate-400 font-medium truncate">Placement Management</div>
              </div>
            )}
          </div>

          {/* Expand/Collapse Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Quick Button Under Header */}
        {isCollapsed && (
          <div className="pt-2 px-2 flex justify-center">
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Role-Based Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          
          {/* ===================================================
              ROLE 1: MAIN ADMIN
              =================================================== */}
          {role === 'MAIN_ADMIN' && (
            <>
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Overview
                  </div>
                )}
                {adminOverviewNav.map(renderNavItem)}
              </div>

              <div className="space-y-1 pt-2">
                {!isCollapsed ? (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-3">
                    Administration
                  </div>
                ) : (
                  <div className="w-6 h-[1px] bg-slate-200 mx-auto my-1.5" />
                )}
                {adminAdminNav.map(renderNavItem)}
              </div>
            </>
          )}

          {/* ===================================================
              ROLE 2: PLACEMENT OFFICER
              =================================================== */}
          {role === 'PLACEMENT_OFFICER' && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Overview
                </div>
              )}
              {placementOfficerNav.map(renderNavItem)}
            </div>
          )}

          {/* ===================================================
              ROLE 3: MANAGEMENT
              =================================================== */}
          {role === 'MANAGEMENT' && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Overview
                </div>
              )}
              {managementNav.map(renderNavItem)}
            </div>
          )}

          {/* ===================================================
              ROLE 4: STUDENT
              =================================================== */}
          {role === 'STUDENT' && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Student Portal
                </div>
              )}
              {studentNav.map(renderNavItem)}
            </div>
          )}

        </div>

        {/* Footer: User Role Card & Actions */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenPersonaModal}
                title={`Active: ${getRoleDisplayName(role)} · Click to switch`}
                className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-800 font-bold text-xs flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'}
              </button>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign Out to Login Page"
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              
              {/* Active Role Indicator */}
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Role
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-semibold">
                  {getRoleDisplayName(role)}
                </span>
              </div>

              {/* Persona Switcher Quick Button */}
              <button
                onClick={onOpenPersonaModal}
                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">Switch Demo Role</span>
                </div>
              </button>

              {/* Sign Out Button */}
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-colors"
                >
                  <span className="font-medium">Sign Out</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </div>

      </aside>
    </>
  );
};
