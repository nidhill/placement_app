import React, { useState } from 'react';
import { User } from '../../types.ts';
import { api } from '../../lib/api.ts';
import { Lock, Mail, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // One form for everyone. The SHO server accepts any active account
  // (staff or student); /api/placement/me then says what they are here —
  // Admin, Placement Team, Management or Student — and the app routes
  // them. A student the mentor hasn't approved yet gets that message back.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setLoading(true);
    setError(null);
    try {
      await api.loginStaff(email.trim(), password);
      const me = await api.me();
      onLoginSuccess(me.user);
    } catch (err: any) {
      api.logout();
      setError(err?.message || 'Sign-in failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

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

          <div className="max-w-[440px] animate-fade-up">
            <h2 className="font-extrabold text-[32px] tracking-tight">Welcome back</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">Staff sign in with their SHO App account, students with their LMS account.</p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-[18px]">
              {error && (
                <div className="rounded-[13px] px-4 py-3 text-sm text-red-600" style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)' }}>
                  {error}
                </div>
              )}

              <label className="flex flex-col gap-[7px]">
                <span className="text-[13px] font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email</span>
                <input
                  type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
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

            <p className="mt-5 text-xs text-muted-foreground">
              Students: the placement portal opens once your mentor has marked you placement-eligible in the SHO App. Forgot your password? Reset it from the SHO App or LMS login page.
            </p>
          </div>

          <p className="mt-10 text-center lg:text-left text-xs text-muted-foreground">HACA Placement · 2026</p>
        </div>
      </div>
    </div>
  );
};
