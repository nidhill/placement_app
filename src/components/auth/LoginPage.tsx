import React, { useState } from 'react';
import { User, UserRole } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { 
  Shield, 
  Briefcase, 
  BarChart3, 
  GraduationCap,
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Mail, 
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
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
  // Two separate staff roles: the SHO App admin governs the tool (users,
  // overrides, settings); the Placement Team runs it day to day.
  {
    role: 'MAIN_ADMIN',
    title: 'Admin',
    subtitle: 'Administration',
    description: 'SHO App admin account. Manage placement team users, settings, compliance logs & eligibility overrides.',
    icon: Shield,
    defaultEmail: '',
    sampleName: ''
  },
  {
    role: 'PLACEMENT_OFFICER',
    title: 'Placement Team',
    subtitle: 'Placement Operations',
    description: 'Jobs, applications, interview scheduling, feedback and student syncs. Sign in with your SHO App Placement Team account.',
    icon: Briefcase,
    defaultEmail: '',
    sampleName: ''
  },
  {
    role: 'MANAGEMENT',
    title: 'Management',
    subtitle: 'Analytics & Reports',
    description: 'Executive placement intelligence, school/program benchmarks, cohort conversion & recruiter metrics.',
    icon: BarChart3,
    defaultEmail: '',
    sampleName: ''
  },
  {
    role: 'STUDENT',
    title: 'Student',
    subtitle: 'Career & Opportunities',
    description: 'Sign in with your LMS account. Your profile, CV, job applications & interviews — available once your mentor has marked you placement-eligible.',
    icon: GraduationCap,
    defaultEmail: '',
    sampleName: ''
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeConfig = selectedRole ? ROLE_CONFIGS.find(r => r.role === selectedRole) : null;

  const handleSelectRole = (roleConfig: RoleConfig) => {
    setSelectedRole(roleConfig.role);
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setError(null);
  };

  // Staff (admin / placement team / management) sign in with their
  // SHO App account; students with their LMS account. The server then tells
  // us who we are in placement terms — a student who isn't approved yet gets
  // a clear message instead of an empty portal.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setLoading(true);
    setError(null);
    try {
      if (selectedRole === 'STUDENT') await api.loginStudent(email.trim(), password);
      else await api.loginStaff(email.trim(), password);
      const me = await api.me();
      if (me.user.role !== selectedRole) {
        api.logout();
        setError(`This account is ${me.user.role.replace('_', ' ').toLowerCase()} — choose that role to sign in.`);
        return;
      }
      onLoginSuccess(me.user);
    } catch (err: any) {
      api.logout();
      setError(err?.message || 'Sign-in failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Same split layout as the LMS login: blue brand panel on the left, white
  // form on the right. Step 1 picks the role, step 2 signs in with the SHO
  // App (staff) or LMS (student) account.
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-foreground">

      {/* BRAND PANEL */}
      <div
        className="hidden lg:flex relative flex-col overflow-hidden text-white px-[46px] py-11"
        style={{ flex: '1 1 44%', background: 'linear-gradient(158deg,#1e50ff 0%,#1637c9 52%,#0f1f6b 100%)' }}
      >
        <div className="pointer-events-none absolute -top-[120px] -right-[120px] w-[340px] h-[340px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.20), transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-[160px] -left-[100px] w-[360px] h-[360px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(90,124,255,.5), transparent 70%)' }} />

        <div className="relative flex items-center gap-3">
          <img src="/haca-logo.png" alt="HACA" className="h-[52px] w-auto block brightness-0 invert" />
          <span className="text-[11px] font-extrabold tracking-[0.25em] text-white/70">PLACEMENT</span>
        </div>

        <div className="relative flex-1 flex flex-col justify-center items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-[22px]" style={{ background: 'rgba(255,255,255,.14)', letterSpacing: '.4px' }}>
            <span className="w-[7px] h-[7px] rounded-full inline-block" style={{ background: '#7dff9f' }} />
            Placement Cycle 2026
          </div>
          <h1 className="font-extrabold text-[48px] leading-[1.08] tracking-tight">From classroom<br />to career.</h1>
          <p className="mt-4 mx-auto text-[17px] leading-[1.6] max-w-[440px]" style={{ color: 'rgba(255,255,255,.82)' }}>
            Jobs, applications and interviews for every placement-ready HACA student, in one place.
          </p>
        </div>

        <div className="relative flex gap-[26px] flex-wrap justify-center">
          {[['Jobs', 'curated & scraped'], ['Matching', 'skills-based'], ['Interviews', 'tracked end-to-end']].map(([n, l]) => (
            <div key={n} className="text-center">
              <div className="font-bold text-[22px]">{n}</div>
              <div className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,.72)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-[60px] sm:py-14" style={{ flex: '1 1 56%' }}>
        <div className="w-full max-w-[560px] mx-auto">

          <div className="flex lg:hidden flex-col items-center mb-8 gap-2">
            <img src="/haca-logo.png" alt="HACA" className="h-12 w-auto object-contain" />
            <span className="text-[10px] font-extrabold tracking-[0.25em] text-foreground/60">PLACEMENT</span>
          </div>

          {/* STEP 1: ROLE SELECTION */}
          {!selectedRole && (
            <div className="space-y-7 animate-fade-up">
              <div>
                <h2 className="font-extrabold text-[32px] tracking-tight">Welcome back</h2>
                <p className="mt-2 text-[15px] text-muted-foreground">Choose how you want to sign in.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ROLE_CONFIGS.map((rc) => {
                  const Icon = rc.icon;
                  return (
                    <button
                      type="button"
                      key={rc.role}
                      id={`role-card-${rc.role.toLowerCase()}`}
                      onClick={() => handleSelectRole(rc)}
                      className="group text-left bg-card rounded-[22px] p-5 border border-border hover:border-primary/50 hover:shadow-[0_12px_30px_-14px_rgba(30,80,255,0.45)] transition-all duration-200 flex flex-col gap-4 cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-secondary text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors duration-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{rc.subtitle}</div>
                        <h3 className="text-base font-bold">{rc.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{rc.description}</p>
                      </div>
                      <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-primary">
                        Continue <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Staff sign in with their SHO App account, students with their LMS account.
              </p>
            </div>
          )}

          {/* STEP 2: SIGN IN */}
          {selectedRole && activeConfig && (
            <div className="max-w-[440px] animate-fade-up">
              <button
                type="button"
                onClick={handleBackToRoles}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to role selection
              </button>

              <div className="mt-5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(30,80,255,0.6)]">
                  <activeConfig.icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[28px] tracking-tight leading-tight">{activeConfig.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedRole === 'STUDENT' ? 'Sign in with your LMS account' : 'Sign in with your SHO App account'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-[18px]">
                {error && (
                  <div className="rounded-[13px] px-4 py-3 text-sm text-red-600" style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)' }}>
                    {error}
                  </div>
                )}

                <label className="flex flex-col gap-[7px]">
                  <span className="text-[13px] font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email</span>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-[15px] py-[13px] rounded-[13px] text-[15px] bg-white border border-border outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <label className="flex flex-col gap-[7px]">
                  <span className="text-[13px] font-semibold flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-muted-foreground" /> Password</span>
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-[15px] py-[13px] rounded-[13px] text-[15px] bg-white border border-border outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <button
                  type="submit" disabled={loading}
                  className="mt-0.5 w-full py-[14px] rounded-[13px] bg-primary hover:bg-primary/90 text-white font-semibold text-[15px] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_10px_24px_-10px_rgba(30,80,255,0.7)]"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock className="w-4 h-4" /> Sign in</>}
                </button>
              </form>
            </div>
          )}

          <p className="mt-10 text-center lg:text-left text-xs text-muted-foreground">HACA Placement · 2026</p>
        </div>
      </div>
    </div>
  );
};
