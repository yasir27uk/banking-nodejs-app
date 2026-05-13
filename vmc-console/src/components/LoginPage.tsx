'use client';

import { useState, FormEvent } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

type View = 'signin' | 'signup';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [view, setView] = useState<View>('signin');

  // Sign-in state
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);
  const [siError, setSiError] = useState('');
  const [siLoading, setSiLoading] = useState(false);

  // Sign-up state
  const [suEmail, setSuEmail] = useState('');
  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suRole, setSuRole] = useState<UserRole>('developer');
  const [suShowPw, setSuShowPw] = useState(false);
  const [suError, setSuError] = useState('');
  const [suLoading, setSuLoading] = useState(false);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSiError('');
    setSiLoading(true);
    const result = await login(siEmail, siPassword);
    setSiLoading(false);
    if (!result.success) setSiError(result.error || 'Sign in failed.');
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSuError('');
    if (suPassword !== suConfirm) { setSuError('Passwords do not match.'); return; }
    if (suPassword.length < 8) { setSuError('Password must be at least 8 characters.'); return; }
    setSuLoading(true);
    const result = await signup(suEmail, suUsername, suPassword, suRole);
    setSuLoading(false);
    if (!result.success) setSuError(result.error || 'Sign up failed.');
  };

  return (
    <div className="min-h-screen bg-[#f2f3f3] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#232f3e] h-[54px] flex items-center px-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-[#232f3e] font-bold text-xs">VMC</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">VMware Cloud</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          {view === 'signin' ? (
            <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-sm">
              <div className="px-8 pt-8 pb-6">
                <h1 className="text-[22px] font-normal text-[#16191f] mb-6">Sign in</h1>

                <form onSubmit={handleSignIn} noValidate>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-[#16191f] mb-1">
                      Email or username
                    </label>
                    <input
                      type="text"
                      value={siEmail}
                      onChange={e => setSiEmail(e.target.value)}
                      required
                      autoComplete="username"
                      className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm text-sm focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                      placeholder="e.g. admin@vmc-corp.com"
                    />
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-bold text-[#16191f]">Password</label>
                      <button type="button" className="text-xs text-[#0073bb] hover:text-[#005276] hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={siShowPw ? 'text' : 'password'}
                        value={siPassword}
                        onChange={e => setSiPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full px-3 py-2 pr-10 border border-[#aab7b8] rounded-sm text-sm focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                      />
                      <button
                        type="button"
                        onClick={() => setSiShowPw(!siShowPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#545b64] hover:text-[#16191f]"
                      >
                        {siShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {siError && (
                    <div className="mt-3 flex items-start text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      {siError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={siLoading || !siEmail || !siPassword}
                    className="mt-5 w-full py-2.5 bg-[#ec7211] hover:bg-[#cf6010] disabled:bg-[#ec7211]/50 text-white text-sm font-medium rounded-sm transition-colors flex items-center justify-center"
                  >
                    {siLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
                  </button>
                </form>
              </div>

              <div className="border-t border-[#eaeded] px-8 py-5">
                <p className="text-sm text-[#545b64]">
                  New to VMware Cloud?{' '}
                  <button
                    onClick={() => { setView('signup'); setSiError(''); }}
                    className="text-[#0073bb] hover:text-[#005276] hover:underline font-medium"
                  >
                    Create a new account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-sm">
              <div className="px-8 pt-8 pb-6">
                <h1 className="text-[22px] font-normal text-[#16191f] mb-1">Create your account</h1>
                <p className="text-sm text-[#545b64] mb-6">Get started with VMware Cloud Management Console</p>

                <form onSubmit={handleSignUp} noValidate>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-[#16191f] mb-1">Email address</label>
                    <input
                      type="email"
                      value={suEmail}
                      onChange={e => setSuEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm text-sm focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold text-[#16191f] mb-1">Username</label>
                    <input
                      type="text"
                      value={suUsername}
                      onChange={e => setSuUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm text-sm focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                      placeholder="e.g. john-doe"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold text-[#16191f] mb-1">Role</label>
                    <select
                      value={suRole}
                      onChange={e => setSuRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm text-sm focus:outline-none focus:border-[#0073bb] bg-white"
                    >
                      <option value="developer">Developer</option>
                      <option value="admin">Administrator</option>
                      <option value="readonly">Read Only</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold text-[#16191f] mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={suShowPw ? 'text' : 'password'}
                        value={suPassword}
                        onChange={e => setSuPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 pr-10 border border-[#aab7b8] rounded-sm text-sm focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                        placeholder="Min 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setSuShowPw(!suShowPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#545b64] hover:text-[#16191f]"
                      >
                        {suShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-bold text-[#16191f] mb-1">Confirm password</label>
                    <input
                      type={suShowPw ? 'text' : 'password'}
                      value={suConfirm}
                      onChange={e => setSuConfirm(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm text-sm focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                    />
                  </div>

                  {suError && (
                    <div className="mt-3 flex items-start text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      {suError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={suLoading || !suEmail || !suUsername || !suPassword || !suConfirm}
                    className="mt-5 w-full py-2.5 bg-[#ec7211] hover:bg-[#cf6010] disabled:bg-[#ec7211]/50 text-white text-sm font-medium rounded-sm transition-colors flex items-center justify-center"
                  >
                    {suLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
                  </button>
                </form>
              </div>

              <div className="border-t border-[#eaeded] px-8 py-5">
                <p className="text-sm text-[#545b64]">
                  Already have an account?{' '}
                  <button
                    onClick={() => { setView('signin'); setSuError(''); }}
                    className="text-[#0073bb] hover:text-[#005276] hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Demo credentials hint */}
          <div className="mt-6 bg-[#fff8e6] border border-[#f0ad4e] rounded-sm p-4 text-xs text-[#545b64]">
            <p className="font-semibold text-[#16191f] mb-2">Demo credentials</p>
            <div className="space-y-1 font-mono">
              <p><span className="text-[#0073bb]">admin@vmc-corp.com</span> / Admin123!</p>
              <p><span className="text-[#0073bb]">developer@vmc-corp.com</span> / Dev123!</p>
              <p><span className="text-[#0073bb]">readonly@vmc-corp.com</span> / Readonly123!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#d5dbdb] py-4 px-8 text-center">
        <div className="flex items-center justify-center space-x-6 text-xs text-[#545b64]">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms of Use</a>
          <a href="#" className="hover:underline">Cookie Preferences</a>
          <span>&copy; 2025 VMware by Broadcom. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
