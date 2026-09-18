import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types.ts';
import { 
  Search, 
  Menu, 
  Shield,
  Briefcase,
  BarChart3,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
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
      case 'MAIN_ADMIN': return 'Admin';
      case 'PLACEMENT_OFFICER': return 'Placement Team';
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

  const initials = (currentUser?.fullName || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const isOverview = currentTab === 'dashboard' || currentTab === 'student_dashboard';
  const firstName = (currentUser?.fullName || 'there').split(' ')[0];

  // Same bar as the LMS Navbar: greeting on the overview, the page title
  // elsewhere; round search / bell / avatar pills on the right.
  return (
    <header className="sticky top-0 z-30 flex min-h-14 md:min-h-16 items-center justify-between gap-2 md:gap-4 bg-background/80 px-4 pt-3 pb-2 backdrop-blur md:px-8 md:pt-5">

      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onOpenMobileMenu} aria-label="Open navigation" className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-sm">
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          {isOverview ? (
            <>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-tight truncate">Hi, {firstName}!</h1>
              <p className="hidden sm:block text-sm text-muted-foreground">{pageSubtitle || "Here's what's happening in placements today"}</p>
            </>
          ) : (
            // Every other view renders its own heading right below, so the
            // bar only keeps the slot (as the LMS does) to hold the controls.
            <span className="sr-only">{pageTitle || getTabTitle(currentTab)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        {onSearchChange && (
          <div className="relative hidden md:block w-64 lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search students, jobs..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-full border border-transparent bg-card shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        )}

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}

        <button className="relative flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-muted transition-colors" title="Notifications">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="relative" ref={profileMenuRef}>
          <button
            id="user-profile-button"
            onClick={() => setIsProfileMenuOpen(prev => !prev)}
            className="flex items-center gap-2.5 rounded-full bg-card p-0.5 md:p-1 md:pr-2 shadow-sm hover:bg-muted/60 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[11px] font-extrabold text-primary">{initials}</div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-foreground leading-none">{firstName}</p>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{getRoleLabel(currentUser?.role)}</p>
            </div>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-11 w-56 rounded-2xl bg-popover border border-border shadow-xl z-50 overflow-hidden animate-fade-up">
              <div className="px-4 py-3">
                <p className="text-sm font-semibold truncate">{currentUser?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  <RoleIcon className="h-3 w-3" />{getRoleLabel(currentUser?.role)}
                </span>
              </div>
              {onSignOut && (
                <div className="border-t border-border p-1.5">
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); onSignOut(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-coral hover:bg-muted rounded-xl transition-colors"
                  >
                    <LogOut className="h-4 w-4" /><span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
