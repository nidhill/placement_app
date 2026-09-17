import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types.ts';
import { api } from './lib/api.ts';
import { Sidebar, NavItemId } from './components/common/Sidebar.tsx';
import { Header } from './components/common/Header.tsx';
import { PersonaModal } from './components/common/PersonaModal.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';

// Modern 4-Role Dashboards
import { MainAdminDashboard } from './components/dashboard/MainAdminDashboard.tsx';
import { PlacementOfficerDashboard } from './components/dashboard/PlacementOfficerDashboard.tsx';
import { ManagementDashboard } from './components/dashboard/ManagementDashboard.tsx';
import { CandidateMatchingView } from './components/matching/CandidateMatchingView.tsx';

// Functional Views
import { StudentsList } from './components/students/StudentsList.tsx';
import { JobsDirectory } from './components/jobs/JobsDirectory.tsx';
import { ApplicationsTracker } from './components/applications/ApplicationsTracker.tsx';
import { InterviewsSchedule } from './components/interviews/InterviewsSchedule.tsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.tsx';
import { AdminUsersView } from './components/admin/AdminUsersView.tsx';
import { IntegrationsView } from './components/admin/IntegrationsView.tsx';
import { AuditLogsView } from './components/admin/AuditLogsView.tsx';
import { EmergencyOverrideView } from './components/admin/EmergencyOverrideView.tsx';
import { StudentPortalView } from './components/student/StudentPortalView.tsx';

import { RotateCcw } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Requirement 1: DEFAULT STATE: The sidebar should be COLLAPSED.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [activeNav, setActiveNav] = useState<NavItemId>('dashboard');
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load system seed users
  const loadInitialUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.users);

      // Check if there was a saved session
      const savedUserId = sessionStorage.getItem('haca_active_user_id');
      if (savedUserId) {
        const found = res.users.find(u => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
          api.setActiveUser(found);
          setIsLoggedIn(true);
          setActiveNav(found.role === 'STUDENT' ? 'student_dashboard' : 'dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to load system users:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialUsers();
  }, [refreshTrigger]);

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    api.setActiveUser(user);
    setIsLoggedIn(true);
    sessionStorage.setItem('haca_active_user_id', user.id);

    // Set initial view according to role
    if (user.role === 'STUDENT') {
      setActiveNav('student_dashboard');
    } else {
      setActiveNav('dashboard');
    }
  };

  // Sign out handler (returns to login / role selection page)
  const handleSignOut = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('haca_active_user_id');
  };

  // Switch role via demo switcher modal
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    api.setActiveUser(user);
    sessionStorage.setItem('haca_active_user_id', user.id);
    setIsPersonaModalOpen(false);

    // Auto navigate to role context
    switch (user.role) {
      case 'STUDENT':
        setActiveNav('student_dashboard');
        break;
      case 'PLACEMENT_OFFICER':
      case 'MANAGEMENT':
      case 'MAIN_ADMIN':
      default:
        setActiveNav('dashboard');
        break;
    }
  };

  const handleResetSystem = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setResetMessage('Resetting system data to clean seed state...');
    try {
      const res = await api.resetSystem();
      
      // Reload users to ensure fresh user state
      const usersRes = await api.getUsers();
      setUsers(usersRes.users);

      const savedUserId = sessionStorage.getItem('haca_active_user_id');
      if (savedUserId) {
        const found = usersRes.users.find(u => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
          api.setActiveUser(found);
        }
      }

      // Remount and refresh all dashboard views
      setRefreshTrigger(prev => prev + 1);
      setResetMessage(res.message || 'System state reset to clean seed state.');
      setTimeout(() => setResetMessage(null), 3500);
    } catch (err: any) {
      console.error('Reset error:', err);
      setResetMessage(`Reset failed: ${err.message || 'Unknown error'}`);
      setTimeout(() => setResetMessage(null), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  // Initial spinner while fetching seed users
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-slate-600">Initializing HACA Placement Platform...</p>
        </div>
      </div>
    );
  }

  // Requirement 4: Separate Login / Role Selection Page before entering application
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginPage 
        users={users} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  // Determine section title and subtitle for header
  const getHeaderTitles = (): { title: string; subtitle?: string } => {
    switch (activeNav) {
      case 'dashboard':
        if (currentUser.role === 'MAIN_ADMIN') return { title: 'Admin Overview', subtitle: 'HACA Institutional Operations & Control' };
        if (currentUser.role === 'PLACEMENT_OFFICER') return { title: 'Placement Operations', subtitle: 'Student Pipelines & Matching' };
        if (currentUser.role === 'MANAGEMENT') return { title: 'Executive Overview', subtitle: 'Institutional Conversion & Health Benchmarks' };
        return { title: 'Overview', subtitle: 'HACA Institutional Placement Dashboard' };
      case 'candidate_matching':
        return { title: 'Candidate Matching', subtitle: 'Criteria-Based Shortlisting Engine' };
      case 'job_sources':
        return { title: 'Job Sources', subtitle: 'Scraped Job Leads & ATS Integrations' };
      case 'follow_ups':
        return { title: 'Follow-ups & Interventions', subtitle: 'Student Support & Remedial Pipeline' };
      case 'mgmt_schools':
        return { title: 'School Analysis', subtitle: 'Departmental Conversion Benchmarks' };
      case 'mgmt_programs':
        return { title: 'Program Performance', subtitle: 'Cohort Progression & Offer Ratios' };
      case 'mgmt_batches':
        return { title: 'Batch Trajectory', subtitle: 'Year-over-Year Placement Conversion' };
      case 'mgmt_sources':
        return { title: 'Corporate Partners', subtitle: 'Recruiter Acquisition Channels' };
      case 'students':
        return { title: 'Students', subtitle: 'Academic Student Roster & Eligibility' };
      case 'jobs':
        return { title: 'Job Directory', subtitle: 'Corporate Opportunities & Requisitions' };
      case 'applications':
        return { title: 'Applications', subtitle: 'Student Progression & Pipeline' };
      case 'interviews':
        return { title: 'Interviews', subtitle: 'Scheduled Evaluation Rounds' };
      case 'analytics':
        return { title: 'Analytics', subtitle: 'Institutional KPIs & Placement Intelligence' };
      case 'reports':
        return { title: 'Reports', subtitle: 'Executive Placement Briefings' };
      case 'users':
        return { title: 'User Management', subtitle: 'Staff Accounts & Role Privileges' };
      case 'integrations':
        return { title: 'Integrations', subtitle: 'LMS Adapter & AI Job Scraper' };
      case 'audit_logs':
        return { title: 'Audit Logs', subtitle: 'Compliance & System Activity History' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'Emergency Overrides & Configurations' };
      case 'student_dashboard':
        return { title: 'Student Dashboard', subtitle: 'Placement Status & Quick Actions' };
      case 'student_profile':
      case 'profile':
        return { title: 'Student Profile', subtitle: 'Academic Records & Portfolio Links' };
      case 'student_readiness':
        return { title: 'Placement Readiness', subtitle: 'Evaluation Scorecard & Benchmarks' };
      case 'student_jobs':
        return { title: 'Find Jobs', subtitle: 'Explore Open Corporate Vacancies' };
      case 'student_applications':
        return { title: 'My Applications', subtitle: 'Stage Tracking & Feedback' };
      case 'student_interviews':
        return { title: 'My Interviews', subtitle: 'Upcoming Direct Recruiter Rounds' };
      case 'student_notifications':
        return { title: 'Notifications', subtitle: 'Recruitment Alerts & Announcements' };
      default:
        return { title: 'Placement Management' };
    }
  };

  const { title, subtitle } = getHeaderTitles();

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex font-sans antialiased overflow-hidden">
      
      {/* 1. Left Sidebar Navigation - Flex item that never covers the dashboard */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onSignOut={handleSignOut}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Layout Column: Header + Dashboard Content (Resizes naturally with sidebar width) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header */}
        <Header
          currentTab={activeNav}
          pageTitle={title}
          pageSubtitle={subtitle}
          currentUser={currentUser}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
          onResetSystem={handleResetSystem}
          isResetting={isResetting}
          onSignOut={handleSignOut}
        />

        {/* Global Toast if system reset */}
        {resetMessage && (
          <div className="bg-slate-900 text-white text-xs py-2.5 px-4 text-center font-medium shadow-xs flex items-center justify-center gap-2 shrink-0 border-b border-slate-800 animate-in fade-in slide-in-from-top duration-200">
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-400' : 'text-emerald-400'}`} />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* Main Dashboard / View Area - Natural scrolling and responsive container */}
        <main key={refreshTrigger} className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {currentUser.role === 'STUDENT' ? (
            <StudentPortalView 
              currentStudentId={currentUser.id}
              activeTab={activeNav}
              onNavigate={setActiveNav}
              onRefreshData={() => setRefreshTrigger(prev => prev + 1)}
            />
          ) : (
            <>
              {/* Dashboard Routing by Role */}
              {activeNav === 'dashboard' && (
                <>
                  {currentUser.role === 'MAIN_ADMIN' && (
                    <MainAdminDashboard 
                      currentUser={currentUser} 
                      onNavigate={setActiveNav}
                      onRefreshData={() => setRefreshTrigger(prev => prev + 1)} 
                    />
                  )}
                  {currentUser.role === 'PLACEMENT_OFFICER' && (
                    <PlacementOfficerDashboard 
                      currentUser={currentUser} 
                      onNavigate={setActiveNav}
                      onRefreshData={() => setRefreshTrigger(prev => prev + 1)} 
                    />
                  )}
                  {currentUser.role === 'MANAGEMENT' && (
                    <ManagementDashboard 
                      onNavigate={setActiveNav}
                    />
                  )}
                </>
              )}

              {/* Placement Officer Specific Views */}
              {activeNav === 'candidate_matching' && (
                <CandidateMatchingView onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}
              {activeNav === 'job_sources' && (
                <IntegrationsView />
              )}
              {activeNav === 'follow_ups' && (
                <StudentsList onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {/* Management Specific Drilldowns */}
              {(activeNav === 'mgmt_schools' || activeNav === 'mgmt_programs' || activeNav === 'mgmt_batches' || activeNav === 'mgmt_sources') && (
                <ManagementDashboard onNavigate={setActiveNav} />
              )}

              {/* Shared Administrative Views */}
              {(activeNav === 'students' || activeNav === 'student_profile' || activeNav === 'profile') && (
                <StudentsList onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {activeNav === 'jobs' && (
                <JobsDirectory onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {activeNav === 'applications' && (
                <ApplicationsTracker onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {activeNav === 'interviews' && (
                <InterviewsSchedule onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {(activeNav === 'analytics' || activeNav === 'reports') && (
                <AnalyticsView onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {/* Main Admin Only Views */}
              {activeNav === 'users' && (
                <AdminUsersView onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {activeNav === 'integrations' && (
                <IntegrationsView />
              )}

              {activeNav === 'audit_logs' && (
                <AuditLogsView />
              )}

              {activeNav === 'settings' && (
                <EmergencyOverrideView onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}
            </>
          )}
        </main>

      </div>

      {/* 4-Role Persona Switching Modal for testing */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
      />

    </div>
  );
}
