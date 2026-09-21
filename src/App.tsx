import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types.ts';
import { api, getToken, setToken } from './lib/api.ts';
import { Sidebar, NavItemId } from './components/common/Sidebar.tsx';
import { Header } from './components/common/Header.tsx';
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


export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Rail (collapsed) is the default, like the LMS; the choice sticks per browser.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('placement_sidebar_collapsed') !== 'false');
  const toggleSidebar = () => setIsSidebarCollapsed(prev => { localStorage.setItem('placement_sidebar_collapsed', String(!prev)); return !prev; });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [activeNav, setActiveNav] = useState<NavItemId>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  // Session comes from the stored JWT (issued by the SHO App or the LMS).
  const loadSession = async () => {
    if (!getToken()) { setInitialLoading(false); return; }
    try {
      const res = await api.me();
      setCurrentUser(res.user);
      setIsLoggedIn(true);
      // Only the first load picks the landing view; a data refresh after an
      // action (apply, confirm…) must keep the user where they are.
      setActiveNav(prev => (isLoggedIn ? prev : res.user.role === 'STUDENT' ? 'student_dashboard' : 'dashboard'));
    } catch (err: any) {
      // Expired token, or a student not yet approved — back to login.
      if (err?.status === 401 || err?.status === 403) setToken(null);
      console.error('Session check failed:', err?.message);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [refreshTrigger]);

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);

    // Set initial view according to role
    if (user.role === 'STUDENT') {
      setActiveNav('student_dashboard');
    } else {
      setActiveNav('dashboard');
    }
  };

  // Sign out handler (returns to login / role selection page)
  const handleSignOut = () => {
    api.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  // Initial spinner while checking the session
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

  // Requirement 4: Separate Login / Role Selection Page before entering application
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginPage onLoginSuccess={handleLoginSuccess} />
    );
  }

  // Determine section title and subtitle for header
  const getHeaderTitles = (): { title: string; subtitle?: string } => {
    switch (activeNav) {
      case 'dashboard':
        if (currentUser.role === 'MAIN_ADMIN') return { title: 'Admin Overview', subtitle: 'Users, integrations and placement health at a glance' };
        if (currentUser.role === 'PLACEMENT_OFFICER') return { title: 'Placement Operations', subtitle: 'Your pipelines, matches and follow-ups for today' };
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      
      {/* 1. Left Sidebar Navigation - Flex item that never covers the dashboard */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
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
          onToggleSidebar={toggleSidebar}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Global Toast if system reset */}

        {/* Main Dashboard / View Area - Natural scrolling and responsive container */}
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden px-5 pt-3 pb-8 md:px-8 md:pt-4">
          {currentUser.role === 'STUDENT' ? (
            // The portal reloads its own data and keeps modals (confirm /
            // decline) open across a refresh, so it is never remounted.
            <StudentPortalView 
              currentStudentId={currentUser.id}
              activeTab={activeNav}
              onNavigate={setActiveNav}
              onRefreshData={() => setRefreshTrigger(prev => prev + 1)}
            />
          ) : (
            // Staff views still remount on refresh (the old app's way of
            // re-fetching everything).
            <React.Fragment key={refreshTrigger}>
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

              {/* Placement Team Specific Views */}
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

              {activeNav === 'analytics' && (
                <AnalyticsView onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
              )}

              {/* Main Admin Only Views */}
              {activeNav === 'users' && (
                <AdminUsersView currentUserId={currentUser.id} onRefreshData={() => setRefreshTrigger(prev => prev + 1)} />
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
            </React.Fragment>
          )}
        </main>

      </div>


    </div>
  );
}
