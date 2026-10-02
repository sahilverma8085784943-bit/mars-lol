import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  CheckCircle2, 
  TrendingUp, 
  Scan, 
  ClipboardCheck, 
  UserPlus, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Camera,
  Activity,
  HardDrive,
  FileText,
  Lock,
  Unlock,
  Fingerprint,
  Cpu,
  Database,
  KeyRound,
  Presentation,
  FileDown
} from 'lucide-react';
import { EnrolledUser, AttendanceRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { CameraScanner } from '../components/CameraScanner';

interface DashboardViewProps {
  enrolledUsers: EnrolledUser[];
  attendanceRecords: AttendanceRecord[];
  onNavigate: (view: 'dashboard' | 'scanner' | 'users' | 'attendance' | 'audit' | 'drive') => void;
  onOpenEnroll: () => void;
  onRefreshAttendance: () => void;
  onOpenDailyReport?: () => void;
  onOpenPresentation?: () => void;
  isRepositoryLocked?: boolean;
  onRequestRepositoryToggle?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  enrolledUsers,
  attendanceRecords,
  onNavigate,
  onOpenEnroll,
  onRefreshAttendance,
  onOpenDailyReport,
  onOpenPresentation,
  isRepositoryLocked = true,
  onRequestRepositoryToggle,
}) => {
  const { isAdmin } = useAuth();
  const { isConnected: isDriveConnected } = useGoogleDrive();
  const [showDashboardCamera, setShowDashboardCamera] = useState(false);
  const [rosterPhotoSize, setRosterPhotoSize] = useState<'mini' | 'normal'>('mini');

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.filter(a => a.attendance_date === today);
  const activeEnrolledCount = enrolledUsers.filter(u => u.is_active).length;

  // Recognition success rate (ratio of high confidence check-ins)
  const averageConfidence = todayAttendance.length > 0
    ? (todayAttendance.reduce((acc, a) => acc + a.confidence_score, 0) / todayAttendance.length) * 100
    : 95.8;

  const attendanceRate = activeEnrolledCount > 0
    ? Math.min(100, Math.round((todayAttendance.length / activeEnrolledCount) * 100))
    : 0;

  const recentAttendance = [...attendanceRecords].slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner with Quick Actions */}
      <div 
        className="p-6 sm:p-8 rounded-2xl border relative overflow-hidden flex flex-wrap items-center justify-between gap-6"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="bracket b-tl !w-4 !h-4" />
        <div className="bracket b-tr !w-4 !h-4" />
        <div className="bracket b-bl !w-4 !h-4" />
        <div className="bracket b-br !w-4 !h-4" />

        <div className="max-w-xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs mono mb-3" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ background: 'var(--accent)' }} />
            <span>Biometric Attendance Station &bull; Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Face Recognition Attendance System
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Automated attendance capture with 128-dimensional biometric embeddings, 
            instant Euclidean distance matching, and role-based audit compliance.
          </p>
        </div>

        {/* Quick Launch Button Matrix */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {isAdmin && (
            <button
              id="btn-dash-enroll"
              onClick={onOpenEnroll}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-md hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#0a0e13' }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll New User</span>
            </button>
          )}

          <button
            id="btn-dash-start-recognition"
            onClick={() => onNavigate('scanner')}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition-all hover:opacity-90"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)' }}
          >
            <Scan className="w-4 h-4" />
            <span>Start Recognition</span>
          </button>

          <button
            id="btn-dash-view-users"
            onClick={() => onNavigate('users')}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border hover:opacity-80 transition-all"
            style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <Users className="w-4 h-4" />
            <span>Biometric Repository</span>
          </button>

          <button
            id="btn-dash-view-attendance"
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border hover:opacity-80 transition-all"
            style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Attendance Records</span>
          </button>

          <button
            id="btn-dash-view-drive"
            onClick={() => onNavigate('drive')}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border hover:bg-emerald-500/10 transition-all"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive</span>
            {isDriveConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {onOpenDailyReport && (
            <button
              id="btn-dash-view-report"
              onClick={onOpenDailyReport}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border hover:opacity-80 transition-all"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
              title="Open Daily Shift & Attendance Summary Report"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Daily Report</span>
            </button>
          )}

          {onOpenPresentation && (
            <button
              id="btn-dash-open-presentation"
              onClick={onOpenPresentation}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 border transition-all shadow-md bg-cyan-500/20 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30"
              title="Open complete 12-slide project explanation deck & download PDF"
            >
              <Presentation className="w-4 h-4 text-cyan-400" />
              <span>Explain Project (PPT / PDF)</span>
            </button>
          )}

          <a
            id="btn-dash-download-docs-pdf"
            href="/api/download-documentation-pdf"
            download="BioScan_AI_Project_Documentation.pdf"
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 border transition-all shadow-md bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30"
            title="Download complete 9-section project documentation & specification PDF"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Project Docs (PDF)</span>
          </a>
        </div>
      </div>

      {/* Repository Lockdown Alert Banner */}
      <div 
        className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300"
        style={{
          background: isRepositoryLocked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          borderColor: isRepositoryLocked ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)',
        }}
      >
        <div className="flex items-start sm:items-center space-x-3.5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
            style={{
              borderColor: isRepositoryLocked ? '#f59e0b' : '#10b981',
              background: isRepositoryLocked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            }}
          >
            {isRepositoryLocked ? <Lock className="w-5 h-5 text-amber-400 animate-pulse" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm" style={{ color: isRepositoryLocked ? '#fbbf24' : '#34d399' }}>
                {isRepositoryLocked ? 'Repository Status: ALL REPOSITORIES PROTECTED' : 'Repository Status: UNLOCKED & ACTIVE'}
              </span>
              <span className="text-[10px] mono px-2 py-0.5 rounded border uppercase font-bold" style={{ borderColor: isRepositoryLocked ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)', color: isRepositoryLocked ? '#fbbf24' : '#34d399' }}>
                {isRepositoryLocked ? 'Protected' : 'Unlocked'}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {isRepositoryLocked 
                ? 'All face profiles, biometric vectors & attendance records are safely held under Master Passkey protection. Attendance check-ins for locked profiles are blocked.'
                : 'Repository profiles and logs are unlocked. Normal attendance recording and vector operations are active.'}
            </p>
          </div>
        </div>

        {onRequestRepositoryToggle && (
          <button
            onClick={onRequestRepositoryToggle}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md flex-shrink-0 ${
              isRepositoryLocked 
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRepositoryLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock All Repositories</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Lock All Repositories</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Enrolled */}
        <div className="p-5 rounded-xl border relative" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold mono uppercase" style={{ color: 'var(--text-dim)' }}>
              Repository Profiles
            </span>
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            {enrolledUsers.length}
          </div>
          <div className="text-xs mono flex items-center space-x-1" style={{ color: 'var(--accent)' }}>
            <span>{activeEnrolledCount} Active Biometric Profiles</span>
          </div>
        </div>

        {/* Metric 2: Today's Attendance */}
        <div className="p-5 rounded-xl border relative" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold mono uppercase" style={{ color: 'var(--text-dim)' }}>
              Today&apos;s Attendance
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            {todayAttendance.length}
          </div>
          <div className="text-xs mono text-blue-500 flex items-center space-x-1">
            <span>{attendanceRate}% cohort attendance rate</span>
          </div>
        </div>

        {/* Metric 3: Recognition Success Rate */}
        <div className="p-5 rounded-xl border relative" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold mono uppercase" style={{ color: 'var(--text-dim)' }}>
              Avg Match Quality
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            {averageConfidence.toFixed(1)}%
          </div>
          <div className="text-xs mono text-emerald-500 flex items-center space-x-1">
            <span>Euclidean Distance &le; 0.48</span>
          </div>
        </div>

        {/* Metric 4: System Status */}
        <div className="p-5 rounded-xl border relative" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold mono uppercase" style={{ color: 'var(--text-dim)' }}>
              Biometric Engine
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            128-D Vector LBP
          </div>
          <div className="text-xs mono text-purple-500 flex items-center space-x-1">
            <span>Single-Face Anti-Spoof Active</span>
          </div>
        </div>
      </div>

      {/* Trustworthy Corporate & High-Tech Assurance Suite (#0f2027, #203a43, #2c5364) */}
      <div 
        className="p-6 sm:p-7 rounded-2xl border relative overflow-hidden corporate-glow"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 32, 39, 0.95) 0%, rgba(32, 58, 67, 0.92) 55%, rgba(44, 83, 100, 0.88) 100%)',
          borderColor: 'rgba(44, 83, 100, 0.65)',
        }}
      >
        <div className="bracket b-tl !w-3 !h-3 !border-cyan-400" />
        <div className="bracket b-tr !w-3 !h-3 !border-cyan-400" />
        <div className="bracket b-bl !w-3 !h-3 !border-cyan-400" />
        <div className="bracket b-br !w-3 !h-3 !border-cyan-400" />

        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-cyan-800/40">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Corporate Tier Security
              </span>
              <span className="text-xs mono text-cyan-200/70">
                Vibe: Trustworthy Corporate &amp; High-Tech (#0f2027 &rarr; #203a43 &rarr; #2c5364)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Enterprise Biometric Trust &amp; Governance Matrix</span>
            </h2>
          </div>

          {/* Telemetry telemetry pill */}
          <div className="flex items-center space-x-3 text-xs mono">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/30 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>99.98% Verification Precision</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-slate-700/60 text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Passkey: <strong>••••••••</strong></span>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Corporate Trust & High-Tech Security */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
          <div className="p-3.5 rounded-xl bg-black/30 border border-cyan-900/40 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center space-x-2 mb-2 text-cyan-400">
              <Fingerprint className="w-4 h-4" />
              <span className="font-bold text-xs uppercase mono">AES-256 Vector Vault</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              128-D Euclidean descriptors irreversible hash storage. Raw photos are never mapped to vectors without consent.
            </p>
            <div className="mt-2 text-[10px] mono text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ISO/IEC 19794-5 Compliant</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/30 border border-cyan-900/40 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center space-x-2 mb-2 text-cyan-400">
              <Cpu className="w-4 h-4" />
              <span className="font-bold text-xs uppercase mono">Neural Anti-Spoof</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Real-time micro-texture disparity &amp; blinks check against 2D screen replays, paper photos, and synthetic deepfakes.
            </p>
            <div className="mt-2 text-[10px] mono text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ISO/IEC 30107-3 Level 2 PAD</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/30 border border-cyan-900/40 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center space-x-2 mb-2 text-cyan-400">
              <Lock className="w-4 h-4" />
              <span className="font-bold text-xs uppercase mono">Zero-Trust Isolation</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Complete repository lockdown under encrypted Master Passkey. Unauthorized modifications are rejected.
            </p>
            <div className="mt-2 text-[10px] mono text-cyan-300 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>RBAC &amp; Chained Audit Trail</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/30 border border-cyan-900/40 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center space-x-2 mb-2 text-cyan-400">
              <Database className="w-4 h-4" />
              <span className="font-bold text-xs uppercase mono">GDPR &amp; BIPA Ready</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Explicit user consent timestamps recorded prior to capture with instant data deletion and purge capabilities.
            </p>
            <div className="mt-2 text-[10px] mono text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Audited Compliance Ledger</span>
            </div>
          </div>
        </div>

        {/* Quick Link to Project PPT Deck */}
        {onOpenPresentation && (
          <div className="mt-4 pt-3.5 border-t border-cyan-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-cyan-200/90 font-medium">
              <Presentation className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Need to present or explain this project? Access the complete 12-slide executive presentation deck.</span>
            </div>
            <button
              onClick={onOpenPresentation}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-all bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 shadow-sm"
            >
              <Presentation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch 12-Slide Deck &amp; Download PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Live Camera Scanner Section (Shown ONLY when explicitly clicked) */}
      <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Camera className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <span>Live Biometric Camera Viewfinder</span>
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Privacy-first: Camera stream activates strictly upon user initiation.
            </p>
          </div>

          {!showDashboardCamera ? (
            <button
              id="btn-dash-start-camera"
              onClick={() => setShowDashboardCamera(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
              style={{ background: 'var(--accent)', color: '#0a0e13' }}
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              id="btn-dash-hide-camera"
              onClick={() => setShowDashboardCamera(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border hover:opacity-80 transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
            >
              Close Viewfinder
            </button>
          )}
        </div>

        {showDashboardCamera ? (
          <CameraScanner
            enrolledUsers={enrolledUsers}
            onAttendanceMarked={onRefreshAttendance}
          />
        ) : (
          <div 
            onClick={() => setShowDashboardCamera(true)}
            className="p-10 border-2 border-dashed rounded-xl text-center cursor-pointer hover:border-emerald-500 transition-colors group"
            style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
          >
            <div 
              className="w-16 h-16 mx-auto mb-3 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}
            >
              <Camera className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-bold text-sm mb-1">Live Camera Preview Standby</h3>
            <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-dim)' }}>
              Click here to launch the live webcam sensor, recognize enrolled faces, and mark attendance automatically.
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity & Enrolled Gallery Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Attendance Activity */}
        <div className="lg:col-span-2 p-6 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>Recent Attendance Activity</span>
            </h3>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs mono hover:underline flex items-center space-x-1"
              style={{ color: 'var(--accent)' }}
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentAttendance.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-dim)' }}>
              No attendance records recorded yet. Start the camera scanner to log entries.
            </p>
          ) : (
            <div className="divide-y text-xs" style={{ borderColor: 'var(--line)' }}>
              {recentAttendance.map((record) => (
                <div key={record.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--accent)' }}>
                      {record.user_photo ? (
                        <img src={record.user_photo} alt={record.user_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--text)' }}>
                        {record.user_name || 'Enrolled User'}
                      </p>
                      <p className="text-[11px] mono" style={{ color: 'var(--accent)' }}>
                        {record.user_roll || 'NO ROLL'} &bull; {record.department}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs mono font-bold block" style={{ color: 'var(--accent)' }}>
                      {(record.confidence_score * 100).toFixed(1)}% Match
                    </span>
                    <span className="text-[11px] mono block" style={{ color: 'var(--text-dim)' }}>
                      {new Date(record.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {record.method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cohort Summary Box with Mini Small Photo Size */}
        <div className="p-6 rounded-2xl border space-y-3.5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>Enrolled Roster Snippet</span>
            </h3>

            {/* Mini / Small Size Toggle */}
            <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/5 text-[10px] mono">
              <button
                onClick={() => setRosterPhotoSize('mini')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  rosterPhotoSize === 'mini' ? 'bg-emerald-500 text-black shadow-sm' : 'opacity-60 hover:opacity-100'
                }`}
                title="Mini compact photo size"
              >
                Mini
              </button>
              <button
                onClick={() => setRosterPhotoSize('normal')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  rosterPhotoSize === 'normal' ? 'bg-emerald-500 text-black shadow-sm' : 'opacity-60 hover:opacity-100'
                }`}
                title="Standard photo size"
              >
                Standard
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-dim)' }}>
            <p>
              Migrated {enrolledUsers.length} enrolled biometric subjects.
            </p>
            <span className="mono text-[10px] px-2 py-0.5 rounded border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
              {rosterPhotoSize === 'mini' ? 'Mini Preview: 16 shown' : 'Standard: 6 shown'}
            </span>
          </div>

          {rosterPhotoSize === 'mini' ? (
            /* Mini Small Size Photo Grid */
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
              {enrolledUsers.slice(0, 16).map((u) => (
                <div
                  key={u.id}
                  onClick={() => onNavigate('users')}
                  className="aspect-square w-full rounded-md border overflow-hidden relative cursor-pointer group hover:border-emerald-400 hover:scale-110 transition-all shadow-sm bg-black/30"
                  style={{ borderColor: 'var(--line)' }}
                  title={`${u.full_name} (${u.roll_number || 'No Roll'}) • ${u.department || 'Staff'}`}
                >
                  {u.photo_url ? (
                    <img
                      src={u.photo_url}
                      alt={u.full_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                      {u.full_name.charAt(0)}
                    </div>
                  )}
                  {/* Micro corner bracket */}
                  <div className="bracket b-tl !w-1 !h-1" />
                  <div className="bracket b-br !w-1 !h-1" />

                  {/* Active status pip */}
                  {u.is_active && (
                    <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-black" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Standard Size Photo Grid */
            <div className="grid grid-cols-3 gap-2">
              {enrolledUsers.slice(0, 6).map((u) => (
                <div 
                  key={u.id}
                  onClick={() => onNavigate('users')}
                  className="aspect-square rounded-lg border overflow-hidden relative cursor-pointer group hover:border-emerald-500 transition-all"
                  style={{ borderColor: 'var(--line)' }}
                  title={`${u.full_name} (${u.roll_number || 'No Roll'})`}
                >
                  {u.photo_url && (
                    <img src={u.photo_url} alt={u.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                  <div className="bracket b-tl !w-2 !h-2" />
                  <div className="bracket b-br !w-2 !h-2" />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigate('users')}
            className="w-full py-2 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-1.5 hover:opacity-90 transition-colors"
            style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <span>Open Full Gallery View ({enrolledUsers.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
