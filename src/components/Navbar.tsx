import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  Scan, 
  Users, 
  ClipboardCheck, 
  History, 
  Shield, 
  Sun, 
  Moon, 
  UserCheck, 
  Lock,
  Unlock,
  Database,
  Info,
  HardDrive,
  LogIn,
  LogOut,
  ChevronDown,
  User,
  ShieldCheck,
  KeyRound,
  Check,
  Palette as PaletteIcon,
  Sparkles,
  Presentation,
  Radio,
  Mic,
} from 'lucide-react';
import { AppRole } from '../types';
import { Palette } from '../context/ThemeContext';

interface NavbarProps {
  currentView: 'dashboard' | 'scanner' | 'users' | 'attendance' | 'audit' | 'drive';
  onNavigate: (view: 'dashboard' | 'scanner' | 'users' | 'attendance' | 'audit' | 'drive') => void;
  onOpenPrivacy: () => void;
  onOpenEnroll: () => void;
  onOpenPresentation?: () => void;
  onOpenVoiceAssistant?: () => void;
  isRepositoryLocked?: boolean;
  onRequestRepositoryToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenPrivacy,
  onOpenEnroll,
  onOpenPresentation,
  onOpenVoiceAssistant,
  isRepositoryLocked = true,
  onRequestRepositoryToggle,
}) => {
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const { 
    role, 
    switchRole, 
    currentProfile, 
    isAdmin, 
    isAuthenticated, 
    logout, 
    openLoginModal 
  } = useAuth();
  const { isConnected: isDriveConnected } = useGoogleDrive();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPaletteMenuOpen, setIsPaletteMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const paletteMenuRef = useRef<HTMLDivElement>(null);

  const palettesList: { id: Palette; name: string; hex: string; desc: string; gradient?: string }[] = [
    { 
      id: 'corporate', 
      name: 'Corporate High-Tech', 
      hex: '#22d3ee', 
      desc: 'Trustworthy Gradient (#0f2027, #203a43, #2c5364)',
      gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
    },
    { id: 'mars', name: 'Royal Amethyst', hex: '#8b5cf6', desc: 'Attractive & Sleek Executive' },
    { id: 'cyan', name: 'Cyber Cyan', hex: '#00f0ff', desc: 'Futuristic Neon' },
    { id: 'emerald', name: 'Matrix Emerald', hex: '#10b981', desc: 'Biometric Scan' },
    { id: 'cobalt', name: 'Electric Cobalt', hex: '#38bdf8', desc: 'Deep Space' },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (paletteMenuRef.current && !paletteMenuRef.current.contains(event.target as Node)) {
        setIsPaletteMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'scanner', label: 'Face Scanner', icon: Scan },
    { id: 'users', label: 'Biometric Repository', icon: Users },
    { id: 'attendance', label: 'Attendance Logs', icon: ClipboardCheck },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'drive', label: 'Google Drive', icon: HardDrive, isSpecial: true },
  ] as const;

  const getRoleBadgeStyle = (r: AppRole) => {
    switch (r) {
      case 'admin':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'staff':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'viewer':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <header className="border-b sticky top-0 z-30 backdrop-blur-md" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center relative border overflow-hidden shadow-sm"
              style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              <Scan className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <div className="bracket b-tl !w-2 !h-2" />
              <div className="bracket b-br !w-2 !h-2" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight block leading-tight">
                  BioScan<span style={{ color: 'var(--accent)' }}>.AI</span>
                </span>
                <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] mono font-semibold tracking-wider uppercase border text-cyan-300 bg-cyan-950/40 border-cyan-500/30">
                  <ShieldCheck className="w-2.5 h-2.5 mr-1 text-cyan-400" />
                  Enterprise Trust
                </span>
              </div>
              <span className="text-xs mono block" style={{ color: 'var(--text-dim)' }}>
                Corporate Biometric Terminal
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                    isActive ? 'shadow-sm' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    color: isActive ? 'var(--text)' : 'var(--text-dim)',
                    background: isActive ? 'var(--accent-soft)' : 'transparent',
                    border: isActive ? '1px solid var(--accent-line)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                  <span>{item.label}</span>
                  {item.id === 'drive' && isDriveConnected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Google Drive Connected" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Repository Lock Indicator & Controller */}
            {onRequestRepositoryToggle && (
              <button
                id="btn-nav-repo-lock"
                onClick={onRequestRepositoryToggle}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs mono font-bold border transition-colors ${
                  isRepositoryLocked
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                }`}
                title={
                  isRepositoryLocked
                    ? 'Repository is LOCKED. Click to unlock with Master Passkey.'
                    : 'Repository is UNLOCKED. Click to lock with Master Passkey.'
                }
              >
                {isRepositoryLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="hidden xs:inline">Repo Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden xs:inline">Repo Unlocked</span>
                  </>
                )}
              </button>
            )}

            {/* Project Presentation Deck (PPT & PDF) */}
            {onOpenPresentation && (
              <button
                id="btn-nav-presentation"
                onClick={onOpenPresentation}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400"
                title="Open Project Presentation Deck (PPT) & Download PDF"
              >
                <Presentation className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Project PPT / PDF</span>
              </button>
            )}

            {/* Gemini Live Real-time Voice Conversation */}
            {onOpenVoiceAssistant && (
              <button
                id="btn-nav-live-voice"
                onClick={onOpenVoiceAssistant}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:border-cyan-300 hover:scale-105 group"
                title="Start Real-time Voice Conversation with Gemini Live API (gemini-3.8-live)"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <Mic className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">AI Voice Live</span>
                <span className="hidden md:inline px-1 py-0.2 rounded text-[9px] mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  gemini-3.8-live
                </span>
              </button>
            )}

            {/* Quick Action: Enroll Face (Admin only) */}
            {isAdmin && (
              <button
                id="btn-nav-enroll"
                onClick={onOpenEnroll}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                style={{
                  background: 'var(--accent)',
                  color: theme === 'dark' ? '#0a0e13' : '#ffffff',
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Enroll Face</span>
              </button>
            )}

            {/* Database indicator */}
            <div 
              className="hidden lg:flex items-center space-x-1.5 px-2 py-1 rounded text-xs mono border"
              style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
              title={isSupabaseConfigured ? 'Connected to live Supabase backend' : 'Running in Local Demo Mode with migrated enrolled dataset'}
            >
              <Database className="w-3 h-3" style={{ color: isSupabaseConfigured ? 'var(--accent)' : '#eab308' }} />
              <span>{isSupabaseConfigured ? 'Supabase DB' : 'Local Demo Store'}</span>
            </div>

            {/* User Authentication & Profile Menu */}
            {isAuthenticated && currentProfile ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  id="btn-user-account-menu"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border hover:opacity-90 transition-all"
                  style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="true"
                  title={`Signed in as ${currentProfile.full_name} (${role})`}
                >
                  {/* User Avatar */}
                  <div 
                    className="w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {currentProfile.avatar_url ? (
                      <img src={currentProfile.avatar_url} alt={currentProfile.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentProfile.full_name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Name and Role Pill (Desktop) */}
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="text-xs font-semibold max-w-[100px] truncate" style={{ color: 'var(--text)' }}>
                      {currentProfile.full_name}
                    </span>
                    <span className={`text-[9px] uppercase font-bold mono mt-0.5 px-1 rounded inline-block w-fit border ${getRoleBadgeStyle(role)}`}>
                      {role}
                    </span>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-dim)' }} />
                </button>

                {/* Dropdown Menu */}
                {isAccountMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
                  >
                    {/* Header Details */}
                    <div className="flex items-start space-x-3 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
                      <div 
                        className="w-11 h-11 rounded-xl overflow-hidden border flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {currentProfile.avatar_url ? (
                          <img src={currentProfile.avatar_url} alt={currentProfile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{currentProfile.full_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                          {currentProfile.full_name}
                        </div>
                        <div className="text-xs truncate mono" style={{ color: 'var(--text-dim)' }}>
                          {currentProfile.email}
                        </div>
                        <div className="mt-1 flex items-center space-x-1.5">
                          <span className={`text-[10px] uppercase font-bold mono px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(role)}`}>
                            {role}
                          </span>
                          <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-white/5 border" style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}>
                            {currentProfile.provider === 'google' ? 'Google Auth' : currentProfile.provider === 'email' ? 'Email Auth' : 'Demo Session'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role Switcher Matrix */}
                    <div className="py-3 border-b space-y-2" style={{ borderColor: 'var(--line)' }}>
                      <div className="text-[11px] font-semibold uppercase tracking-wider mono" style={{ color: 'var(--text-dim)' }}>
                        Switch Active Role
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['admin', 'staff', 'viewer'] as AppRole[]).map((r) => {
                          const active = role === r;
                          return (
                            <button
                              key={r}
                              id={`role-switch-${r}`}
                              onClick={() => {
                                switchRole(r);
                                setIsAccountMenuOpen(false);
                              }}
                              className="py-1 px-2 text-xs uppercase mono rounded-lg font-medium transition-all flex items-center justify-center space-x-1 border"
                              style={{
                                background: active ? 'var(--accent-soft)' : 'var(--bg)',
                                borderColor: active ? 'var(--accent)' : 'var(--line)',
                                color: active ? 'var(--accent)' : 'var(--text-dim)',
                                fontWeight: active ? 'bold' : 'normal',
                              }}
                              title={`Switch role to ${r}`}
                            >
                              <span>{r}</span>
                              {active && <Check className="w-3 h-3 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions List */}
                    <div className="pt-3 space-y-1">
                      <button
                        id="btn-account-switch-login"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openLoginModal();
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-emerald-500/10 transition-colors text-left"
                        style={{ color: 'var(--text)' }}
                      >
                        <KeyRound className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span>Switch Account / Sign In</span>
                      </button>

                      <button
                        id="btn-navbar-logout"
                        onClick={async () => {
                          setIsAccountMenuOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Signed Out State: Prominent Log In Button */
              <button
                id="btn-navbar-login"
                onClick={() => openLoginModal('Please sign in to access security controls.')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:opacity-90"
                style={{
                  background: 'var(--accent)',
                  color: theme === 'dark' ? '#0a0e13' : '#ffffff',
                }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Color Palette Switcher */}
            <div className="relative" ref={paletteMenuRef}>
              <button
                id="btn-color-palette-toggle"
                onClick={() => setIsPaletteMenuOpen(!isPaletteMenuOpen)}
                className="p-2 rounded-lg border hover:opacity-80 transition-all flex items-center space-x-1.5"
                style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
                title="Change Color Theme (Royal Amethyst, Cyber Cyan, Matrix Emerald, Cobalt Blue)"
                aria-label="Color Palette"
              >
                <span 
                  className="w-3.5 h-3.5 rounded-full border shadow-sm animate-pulse" 
                  style={{ background: 'var(--accent)', borderColor: 'var(--accent-line)' }}
                />
                <PaletteIcon className="w-3.5 h-3.5" style={{ color: 'var(--text)' }} />
              </button>

              {isPaletteMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-2"
                  style={{ background: 'var(--panel)', borderColor: 'var(--accent-line)' }}
                >
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[11px] font-bold uppercase mono tracking-wider" style={{ color: 'var(--text)' }}>
                      Color Theme
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>

                  <div className="space-y-1">
                    {palettesList.map((p) => {
                      const isActive = palette === p.id;
                      return (
                        <button
                          key={p.id}
                          id={`palette-select-${p.id}`}
                          onClick={() => {
                            setPalette(p.id);
                            setIsPaletteMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all hover:bg-white/5"
                          style={{
                            background: isActive ? 'var(--accent-soft)' : 'transparent',
                            border: isActive ? '1px solid var(--accent-line)' : '1px solid transparent',
                            color: isActive ? 'var(--accent)' : 'var(--text)',
                          }}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                              style={{ background: p.gradient || p.hex, borderColor: 'rgba(255,255,255,0.4)' }}
                            />
                            <div className="text-left">
                              <div className="font-bold text-xs">{p.name}</div>
                              <div className="text-[10px] opacity-70 mono">{p.desc}</div>
                            </div>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Notice Modal Trigger */}
            <button
              id="btn-privacy-notice"
              onClick={onOpenPrivacy}
              className="p-2 rounded-lg border hover:opacity-80 transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
              title="Biometric Privacy & Compliance Notice"
              aria-label="Biometric Privacy"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-lg border hover:opacity-80 transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <div className="md:hidden border-t px-2 py-2 flex justify-around" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center p-1 text-xs"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)' }}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
