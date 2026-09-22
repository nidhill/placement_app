import React from 'react';
import { User, UserRole } from '../../types.ts';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileCheck2, 
  Calendar, 
  BarChart3, 
  UserCog, 
  Sliders, 
  History, 
  Settings, 
  GraduationCap,
  FileText,
  UserCheck,
  Building,
  Layers,
  FolderTree,
  Share2,
  Clock,
  User as UserIcon,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
} from 'lucide-react';

export type NavigationItem = 
  // Shared / General
  | 'dashboard'
  | 'students'
  | 'jobs'
  | 'applications'
  | 'interviews'
  | 'analytics'
  | 'profile'
  // Main Admin Administration
  | 'users'
  | 'integrations'
  | 'audit_logs'
  | 'settings'
  // Placement Team specific
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
  | 'student_notifications'
  | 'student_resume_builder';

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
    if (item === 'student_resume_builder' && selected === 'student_resume_builder') return true;
    return false;
  };

  const getRoleDisplayName = (r: UserRole) => {
    switch (r) {
      case 'MAIN_ADMIN': return 'Admin';
      case 'PLACEMENT_OFFICER': return 'Placement Team';
      case 'MANAGEMENT': return 'Management';
      case 'STUDENT': return 'Student';
      default: return 'User';
    }
  };

  // Define role navigation sets per user intent
  const adminOverviewNav: NavLinkConfig[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: FileCheck2 },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'analytics', label: 'Placement Analytics', icon: BarChart3 },
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
    { id: 'analytics', label: 'Placement Analytics', icon: BarChart3 },
  ];

  const managementNav: NavLinkConfig[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Placement Analytics', icon: BarChart3 },
    { id: 'mgmt_schools', label: 'Schools', icon: Building },
    { id: 'mgmt_programs', label: 'Programs', icon: Layers },
    { id: 'mgmt_batches', label: 'Batches', icon: FolderTree },
    { id: 'mgmt_sources', label: 'Job Sources', icon: Share2 },
  ];

  const studentNav: NavLinkConfig[] = [
    { id: 'student_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student_profile', label: 'My Profile', icon: UserIcon },
    { id: 'student_resume_builder', label: 'AI Resume Agent', icon: FileText },
    { id: 'student_jobs', label: 'Find Jobs', icon: Briefcase },
    { id: 'student_applications', label: 'My Applications', icon: FileCheck2 },
    { id: 'student_interviews', label: 'Interviews', icon: Calendar },
    { id: 'student_notifications', label: 'Notifications', icon: Bell },
  ];

  const navItems: NavLinkConfig[] =
    role === 'MAIN_ADMIN' ? [...adminOverviewNav, ...adminAdminNav]
    : role === 'PLACEMENT_OFFICER' ? placementOfficerNav
    : role === 'MANAGEMENT' ? managementNav
    : studentNav;
  const homeId: NavigationItem = role === 'STUDENT' ? 'student_dashboard' : 'dashboard';
  const initials = (currentUser?.fullName || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // Same shell as the LMS sidebar: an icon rail on the canvas by default
  // (round buttons, the active one blue), an expanded variant with labels,
  // both grouped into white pills; logout in its own pill at the bottom.
  const wide = !isCollapsed;
  const railItem = (active: boolean) =>
    `relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
      active ? 'bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_rgba(30,80,255,0.6)]' : 'text-foreground/55 hover:text-foreground hover:bg-black/[0.05]'
    }`;
  const rowItem = (active: boolean) =>
    `relative flex w-full shrink-0 items-center gap-3 rounded-full py-2.5 pl-3 pr-4 text-sm font-semibold transition-all duration-200 ${
      active ? 'bg-primary text-primary-foreground' : 'text-foreground/65 hover:text-foreground hover:bg-black/[0.05]'
    }`;
  const drawerItem = (active: boolean) =>
    `relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-black/[0.05] hover:text-foreground'
    }`;
  const item = (active: boolean) => (wide ? rowItem(active) : railItem(active));
  const Glyph = ({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) => (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center"><Icon className="h-[19px] w-[19px]" /></span>
  );
  // The admin's second group (Users/Integrations/…) gets a hairline in the pill.
  const firstAdminId = adminAdminNav[0].id;

  return (
    <>
      {isOpenMobile && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onCloseMobile} />}

      {/* ── Desktop rail / expanded sidebar ─────────────────────────── */}
      <aside className={`hidden md:flex h-full min-h-0 shrink-0 flex-col py-5 gap-4 transition-[width] duration-300 ${wide ? 'w-[248px] px-4 items-stretch' : 'w-[92px] items-center'}`}>
        <div className={`mb-1 flex items-center ${wide ? 'justify-between px-1' : 'flex-col gap-2'}`}>
          <button onClick={() => handleNav(homeId)} className="flex items-center gap-2" title="HACA Placement">
            <img src="/haca-logo.png" alt="HACA" className={`w-auto object-contain ${wide ? 'h-8' : 'h-6 max-w-[64px]'}`} />
            {wide && <span className="text-[9px] font-extrabold tracking-[0.2em] text-foreground/60">PLACEMENT</span>}
          </button>
          <button
            onClick={onToggleCollapse}
            title={wide ? 'Collapse sidebar' : 'Expand sidebar'}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground/60 shadow-sm hover:text-foreground"
          >
            {wide ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <nav className={`flex min-h-0 flex-col gap-1.5 overflow-y-auto rounded-[28px] bg-card p-2 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${!wide ? 'items-center' : ''}`}>
          {navItems.map(({ id, icon, label }) => (
            <React.Fragment key={id}>
              {role === 'MAIN_ADMIN' && id === firstAdminId && <div className={`my-1 h-px bg-border ${wide ? 'mx-3' : 'w-6'}`} />}
              <button id={`nav-${id}`} onClick={() => handleNavClick(id)} title={wide ? undefined : label} className={item(isItemActive(id))}>
                <Glyph icon={icon} />
                {wide && <span className="flex-1 truncate text-left">{label}</span>}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className={`mt-auto flex shrink-0 flex-col gap-1.5 rounded-[28px] bg-card p-2 shadow-sm ${!wide ? 'items-center' : ''}`}>
          {onSignOut && (
            <button onClick={onSignOut} title={wide ? undefined : 'Logout'} className={`${item(false)} hover:text-coral`}>
              <Glyph icon={LogOut} />{wide && <span className="flex-1 text-left">Logout</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      <aside className={`md:hidden fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-card transition-transform duration-300 rounded-r-[28px] shadow-2xl ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <img src="/haca-logo.png" alt="HACA" className="h-7 w-auto object-contain" />
            <span className="text-[10px] font-extrabold tracking-[0.2em] text-foreground/60">PLACEMENT</span>
          </div>
          <button onClick={onCloseMobile} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => handleNavClick(id)} className={drawerItem(isItemActive(id))}>
              <Icon className="h-[18px] w-[18px] shrink-0" /><span className="flex-1 text-left">{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-3 space-y-1 border-t border-border">
          {onSignOut && (
            <button onClick={onSignOut} className={`${drawerItem(false)} hover:text-coral`}>
              <LogOut className="h-[18px] w-[18px] shrink-0" />Logout
            </button>
          )}
        </div>

        {currentUser && (
          <div className="px-4 pb-5">
            <div className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-primary">{initials}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-none">{currentUser.fullName}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-1">{getRoleDisplayName(role)}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
