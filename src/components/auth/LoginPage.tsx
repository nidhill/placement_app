import React, { useState } from 'react';
import { User, UserRole } from '../../types.ts';
import { 
  Shield, 
  Briefcase, 
  BarChart3, 
  GraduationCap, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Mail, 
  KeyRound,
  CheckCircle2,
  Building2
} from 'lucide-react';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

interface RoleConfig {
  role: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultEmail: string;
  sampleName: string;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: 'MAIN_ADMIN',
    title: 'Main Admin',
    subtitle: 'System Administration',
    description: 'Central governance, user accounts, system configuration, compliance logs & eligibility overrides.',
    icon: Shield,
    defaultEmail: 'admin@haca.edu',
    sampleName: 'Executive Administrator'
  },
  {
    role: 'PLACEMENT_OFFICER',
    title: 'Placement Officer',
    subtitle: 'Placement Operations',
    description: 'Recruiter partnerships, corporate job drives, candidate matching, interview schedules & offer tracking.',
    icon: Briefcase,
    defaultEmail: 'placement.asad@haca.edu',
    sampleName: 'Asad Rizvi'
  },
  {
    role: 'MANAGEMENT',
    title: 'Management',
    subtitle: 'Analytics & Reports',
    description: 'Executive placement intelligence, school/program benchmarks, cohort conversion & recruiter metrics.',
    icon: BarChart3,
    defaultEmail: 'director.vance@haca.edu',
    sampleName: 'Dr. Kamran Vance'
  },
  {
    role: 'STUDENT',
    title: 'Student',
    subtitle: 'Career & Opportunities',
    description: 'Personal placement portal, verified profile & CV, technical skills, job applications & interviews.',
    icon: GraduationCap,
    defaultEmail: 'ali.raza@student.haca.edu',
    sampleName: 'Ali Raza'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeConfig = selectedRole ? ROLE_CONFIGS.find(r => r.role === selectedRole) : null;

  const handleSelectRole = (roleConfig: RoleConfig) => {
    setSelectedRole(roleConfig.role);
    setEmail(roleConfig.defaultEmail);
    setPassword('••••••••••••');
    setError(null);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    setError(null);

    setTimeout(() => {
      // Find matching user from seed users or create mock user
      let matchedUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      if (!matchedUser) {
        // Fall back to first user of that role
        matchedUser = users.find(u => u.role === selectedRole);
      }

      if (matchedUser) {
        setLoading(false);
        onLoginSuccess(matchedUser);
      } else {
        // Construct fallback user for that role
        const fallbackUser: User = {
          id: selectedRole === 'STUDENT' ? 'student-tech-1' : `user-${selectedRole.toLowerCase()}-demo`,
          email: email.trim() || activeConfig?.defaultEmail || 'user@haca.edu',
          fullName: activeConfig?.sampleName || 'HACA User',
          role: selectedRole,
          department: selectedRole === 'STUDENT' ? 'School of Tech' : 'Central Administration',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        setLoading(false);
        onLoginSuccess(fallbackUser);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      
      {/* Top Academic Brand Bar */}
      <header className="py-6 px-6 sm:px-10 border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">HACA</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200/60">
                  Institutional Placement
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Higher Academic Career & Advancement</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Campus Portal · Cycle 2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl mx-auto">
          
          {/* STEP 1: ROLE SELECTION VIEW */}
          {!selectedRole && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* Header Texts */}
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Role-Based Institutional Access
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Welcome to HACA Placement Platform
                </h1>
                <p className="text-sm text-slate-500 font-normal">
                  Choose how you want to continue to access your personalized workspace.
                </p>
              </div>

              {/* Four Clean Role Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {ROLE_CONFIGS.map((rc) => {
                  const Icon = rc.icon;
                  return (
                    <div
                      key={rc.role}
                      id={`role-card-${rc.role.toLowerCase()}`}
                      onClick={() => handleSelectRole(rc)}
                      className="group bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-slate-400 hover:shadow-md transition-all duration-150 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden"
                    >
                      {/* Top Role Indicator */}
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-800 flex items-center justify-center transition-colors duration-150">
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            {rc.subtitle}
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 group-hover:text-slate-950">
                            {rc.title}
                          </h2>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                            {rc.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action */}
                      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="text-center text-xs text-slate-400 pt-4">
                Authorized institutional access only · Multi-role placement intelligence & student progression
              </div>
            </div>
          )}

          {/* STEP 2: ROLE SPECIFIC LOGIN FORM */}
          {selectedRole && activeConfig && (
            <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-150">
              
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-7 sm:p-8 space-y-6">
                
                {/* Back Button & Role Badge */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToRoles}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to role selection</span>
                  </button>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {activeConfig.subtitle}
                  </span>
                </div>

                {/* Role Header */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                      <activeConfig.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {activeConfig.title} Login
                      </h2>
                      <p className="text-xs text-slate-500">
                        Sign in to manage {activeConfig.subtitle.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demo Credentials Reminder Banner */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Demo Account Configured</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between pt-0.5">
                    <span>User: <strong className="text-slate-700">{activeConfig.sampleName}</strong></span>
                    <span className="font-mono text-slate-600">{activeConfig.defaultEmail}</span>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Institutional Email</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={activeConfig.defaultEmail}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium text-slate-900 placeholder-slate-400 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>Password</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Demo active</span>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium text-slate-900 placeholder-slate-400 shadow-2xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign In as {activeConfig.title}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Instant Quick Login Shortcut */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(activeConfig.defaultEmail);
                      handleSubmit({ preventDefault: () => {} } as any);
                    }}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4 transition-colors"
                  >
                    Quick Demo One-Click Sign In →
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        HACA Institutional Placement Platform · Version 2026.1 · All rights reserved
      </footer>

    </div>
  );
};
