import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService, DEMO_ACCOUNTS } from '../lib/authService';
import { AppRole } from '../types';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  X, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  UserCheck,
  Building
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { 
    isLoginModalOpen, 
    closeLoginModal, 
    loginPromptReason,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsDemo
  } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'demo'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<AppRole>('staff');

  // Forgot password mode
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError('Please provide your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(signInEmail, signInPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      setError('Please fill in all registration fields.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await registerWithEmail(regFullName, regEmail, regPassword, regRole);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle('admin');
    } catch (err: any) {
      setError(err.message || 'Google authentication was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (role: AppRole) => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemo(role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email to receive recovery instructions.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const msg = await authService.resetPassword(resetEmail);
      setResetMessage(msg);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl border shadow-2xl relative overflow-hidden flex flex-col"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
      >
        {/* Biometric Corner Brackets */}
        <div className="bracket b-tl !w-3 !h-3" />
        <div className="bracket b-tr !w-3 !h-3" />
        <div className="bracket b-bl !w-3 !h-3" />
        <div className="bracket b-br !w-3 !h-3" />

        {/* Modal Header */}
        <div className="p-6 border-b relative" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight leading-tight">
                  Biometric Access Portal
                </h2>
                <span className="text-xs mono" style={{ color: 'var(--text-dim)' }}>
                  Secure Authentication &amp; Role Identity
                </span>
              </div>
            </div>

            <button
              id="btn-close-login-modal"
              onClick={closeLoginModal}
              className="p-1.5 rounded-lg border hover:opacity-80 transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Permission Prompt Reason Banner */}
          {loginPromptReason && (
            <div className="mt-3 p-2.5 rounded-lg border text-xs flex items-center space-x-2 bg-amber-500/10 border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{loginPromptReason}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          {!showForgotPassword && (
            <div className="flex border rounded-lg p-1 mt-4" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
              <button
                id="tab-auth-signin"
                onClick={() => { setActiveTab('signin'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'signin' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: activeTab === 'signin' ? 'var(--panel)' : 'transparent',
                  color: activeTab === 'signin' ? 'var(--accent)' : 'var(--text-dim)',
                  border: activeTab === 'signin' ? '1px solid var(--accent-line)' : 'none',
                }}
              >
                Sign In
              </button>
              <button
                id="tab-auth-register"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'register' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: activeTab === 'register' ? 'var(--panel)' : 'transparent',
                  color: activeTab === 'register' ? 'var(--accent)' : 'var(--text-dim)',
                  border: activeTab === 'register' ? '1px solid var(--accent-line)' : 'none',
                }}
              >
                Register
              </button>
              <button
                id="tab-auth-demo"
                onClick={() => { setActiveTab('demo'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'demo' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: activeTab === 'demo' ? 'var(--panel)' : 'transparent',
                  color: activeTab === 'demo' ? 'var(--accent)' : 'var(--text-dim)',
                  border: activeTab === 'demo' ? '1px solid var(--accent-line)' : 'none',
                }}
              >
                Demo Roles
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg border text-xs flex flex-col space-y-2 bg-red-500/10 border-red-500/30 text-red-400">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-1 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('admin')}
                  className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-[11px] font-semibold text-white transition-colors"
                >
                  Quick Sign In as Admin
                </button>
              </div>
            </div>
          )}

          {/* Reset Message */}
          {resetMessage && (
            <div className="p-3 rounded-lg border text-xs flex items-start space-x-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {activeTab === 'signin' && !showForgotPassword && (
            <form onSubmit={handleSignIn} className="space-y-4">
              
              {/* Google Sign In Option */}
              <button
                type="button"
                id="btn-login-google"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all hover:bg-emerald-500/10"
                style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google Identity</span>
              </button>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t" style={{ borderColor: 'var(--line)' }} />
                <span className="px-3 text-xs mono uppercase" style={{ color: 'var(--text-dim)' }}>
                  Or Email Credentials
                </span>
                <div className="flex-1 border-t" style={{ borderColor: 'var(--line)' }} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
                  <input
                    id="input-login-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="admin.security@system.edu"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none transition-colors"
                    style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setError(null); }}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2 rounded-lg border text-sm focus:outline-none transition-colors"
                    style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-xs opacity-70 hover:opacity-100"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition-all hover:opacity-90"
                style={{ background: 'var(--accent)', color: theme === 'dark' ? '#0a0e13' : '#ffffff' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate &amp; Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. FORGOT PASSWORD VIEW */}
          {showForgotPassword && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Enter your account email address. We will verify your credentials and dispatch recovery instructions.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your.email@system.edu"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setError(null); setResetMessage(null); }}
                  className="flex-1 py-2 rounded-lg border text-xs font-semibold"
                  style={{ borderColor: 'var(--line)' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--accent)', color: '#0a0e13' }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          {/* 3. REGISTER FORM */}
          {activeTab === 'register' && !showForgotPassword && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
                  <input
                    id="input-reg-name"
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Prof. Alex Mercer"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
                  <input
                    id="input-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="alex.mercer@institution.edu"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
                  <input
                    id="input-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-9 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-xs opacity-70 hover:opacity-100"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  Initial Assigned Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'staff', 'viewer'] as AppRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegRole(r)}
                      className={`p-2 rounded-lg border text-xs font-medium uppercase mono transition-all ${
                        regRole === r ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        background: regRole === r ? 'var(--accent-soft)' : 'var(--bg)',
                        borderColor: regRole === r ? 'var(--accent)' : 'var(--line)',
                        color: regRole === r ? 'var(--accent)' : 'var(--text)',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition-all hover:opacity-90"
                style={{ background: 'var(--accent)', color: theme === 'dark' ? '#0a0e13' : '#ffffff' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 4. DEMO ROLES QUICK ACCESS */}
          {activeTab === 'demo' && !showForgotPassword && (
            <div className="space-y-2.5">
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Select an pre-configured security persona for instant system access without entering passwords:
              </p>

              {/* Admin Card */}
              <div
                id="demo-card-admin"
                onClick={() => handleDemoSelect('admin')}
                className="p-3 rounded-xl border cursor-pointer hover:border-emerald-500/80 transition-all flex items-center justify-between"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--accent)' }}>
                    <img src={DEMO_ACCOUNTS.admin.avatar_url!} alt="Admin" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs sm:text-sm">{DEMO_ACCOUNTS.admin.full_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mono bg-emerald-500/20 text-emerald-400">
                        Admin
                      </span>
                    </div>
                    <span className="text-xs mono block" style={{ color: 'var(--text-dim)' }}>
                      Full Face Enrollment &amp; Security Controls
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
              </div>

              {/* Staff Card */}
              <div
                id="demo-card-staff"
                onClick={() => handleDemoSelect('staff')}
                className="p-3 rounded-xl border cursor-pointer hover:border-blue-500/80 transition-all flex items-center justify-between"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0 border-blue-500">
                    <img src={DEMO_ACCOUNTS.staff.avatar_url!} alt="Staff" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs sm:text-sm">{DEMO_ACCOUNTS.staff.full_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mono bg-blue-500/20 text-blue-400">
                        Staff
                      </span>
                    </div>
                    <span className="text-xs mono block" style={{ color: 'var(--text-dim)' }}>
                      Face Scanner &amp; Manual Verification
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />
              </div>

              {/* Viewer Card */}
              <div
                id="demo-card-viewer"
                onClick={() => handleDemoSelect('viewer')}
                className="p-3 rounded-xl border cursor-pointer hover:border-purple-500/80 transition-all flex items-center justify-between"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0 border-purple-500">
                    <img src={DEMO_ACCOUNTS.viewer.avatar_url!} alt="Viewer" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs sm:text-sm">{DEMO_ACCOUNTS.viewer.full_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mono bg-purple-500/20 text-purple-400">
                        Viewer
                      </span>
                    </div>
                    <span className="text-xs mono block" style={{ color: 'var(--text-dim)' }}>
                      Read-Only Dashboard &amp; Audit Logs
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0 ml-2" />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t text-center text-xs mono" style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}>
          <span>Protected by BioScan.AI &bull; End-to-End Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};
