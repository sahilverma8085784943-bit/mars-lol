import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GoogleDriveProvider } from './context/GoogleDriveContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { RecognitionView } from './views/RecognitionView';
import { UsersGalleryView } from './views/UsersGalleryView';
import { AttendanceView } from './views/AttendanceView';
import { AuditView } from './views/AuditView';
import { GoogleDriveView } from './views/GoogleDriveView';
import { UserEnrollmentModal } from './components/UserEnrollmentModal';
import { UserDetailModal } from './components/UserDetailModal';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { LoginModal } from './components/LoginModal';
import { MasterPasswordModal } from './components/MasterPasswordModal';
import { DailyReportModal } from './components/DailyReportModal';
import { ProjectPresentationModal } from './components/ProjectPresentationModal';
import { VoiceConversationModal } from './components/VoiceConversationModal';
import { CursorGlow } from './components/CursorGlow';
import { CyberBackgroundMesh } from './components/CyberBackgroundMesh';
import { EnrolledUser, AttendanceRecord } from './types';
import { dataService, isSupabaseConfigured } from './lib/supabase';
import { useAuth } from './context/AuthContext';
import { Shield, BookOpen, Terminal, Sparkles, CheckCircle2, HardDrive, Presentation, Mic } from 'lucide-react';

function AppContent() {
  const { isAdmin, currentProfile, openLoginModal } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner' | 'users' | 'attendance' | 'audit' | 'drive'>('dashboard');
  const [users, setUsers] = useState<EnrolledUser[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnrolledUser | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Repository Lock State Management (Master Passkey Protected)
  const [isRepositoryLocked, setIsRepositoryLocked] = useState<boolean>(() => dataService.isRepositoryLocked());
  const [lockTargetUser, setLockTargetUser] = useState<EnrolledUser | null>(null);
  const [isEmergencyLockModalOpen, setIsEmergencyLockModalOpen] = useState(false);
  const [emergencyLockAction, setEmergencyLockAction] = useState<boolean>(true);

  // Global Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedAttendance] = await Promise.all([
        dataService.getUsers(),
        dataService.getAttendance(),
      ]);
      setUsers(fetchedUsers);
      setAttendance(fetchedAttendance);
      setIsRepositoryLocked(dataService.isRepositoryLocked());
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEnroll = () => {
    if (!isAdmin) {
      openLoginModal('Administrator privileges required to enroll new biometric faces.');
      return;
    }
    setIsEnrollModalOpen(true);
  };

  const handleUserEnrolled = (newUser: EnrolledUser) => {
    setUsers(prev => [newUser, ...prev]);
    showToast(`Successfully enrolled ${newUser.full_name} into biometric repository`);
  };

  const handleUserUpdated = (updatedUser: EnrolledUser) => {
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    setSelectedUser(updatedUser);
    showToast(`Updated ${updatedUser.full_name}'s profile details`);
  };

  const handleUserDeleted = (deletedId: string) => {
    setUsers(prev => prev.filter(u => u.id !== deletedId));
    showToast('User record permanently removed');
  };

  const handleQuickAttendance = async (user: EnrolledUser) => {
    if (user.is_locked) {
      showToast(`🚨 Profile for ${user.full_name} is LOCKED. Unlock with Master Passkey first.`);
      return;
    }
    const res = await dataService.markAttendance(user.id, 1.0, 'manual', null, false);
    if (res.success) {
      loadData();
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  // Lock target single user
  const handleRequestLockToggle = (user: EnrolledUser) => {
    setLockTargetUser(user);
  };

  const handleConfirmLockToggle = async (reason?: string) => {
    if (!lockTargetUser) return;
    const newLock = !lockTargetUser.is_locked;
    const updated = await dataService.toggleUserLock(
      lockTargetUser.id,
      newLock,
      reason || (newLock ? 'Repository Security Hold' : undefined),
      currentProfile
    );
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    if (selectedUser?.id === updated.id) setSelectedUser(updated);
    showToast(newLock ? `🔒 Locked profile for ${updated.full_name}` : `🔓 Unlocked profile for ${updated.full_name}`);
    setLockTargetUser(null);
  };

  // Repository lockdown / release toggle
  const handleRequestRepositoryToggle = () => {
    setEmergencyLockAction(!isRepositoryLocked);
    setIsEmergencyLockModalOpen(true);
  };

  const handleEmergencyLockdownTrigger = (lockAll: boolean) => {
    setEmergencyLockAction(lockAll);
    setIsEmergencyLockModalOpen(true);
  };

  const handleConfirmEmergencyLockdown = async () => {
    const updatedList = await dataService.setRepositoryLock(
      emergencyLockAction,
      emergencyLockAction ? 'Repository Security Lockdown' : undefined,
      currentProfile
    );
    setUsers(updatedList);
    setIsRepositoryLocked(emergencyLockAction);
    showToast(
      emergencyLockAction 
        ? '🚨 Repository Lockdown Active: All Profiles Protected' 
        : '✅ Repository Lockdown Released: All Profiles Unlocked'
    );
    setIsEmergencyLockModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      {/* Top Ambient Cyber Aurora Glow */}
      <div className="top-ambient-aurora" />

      {/* Interactive Biometric Constellation Mesh Canvas */}
      <CyberBackgroundMesh />

      {/* High-Tech Reactive Cursor Glow */}
      <CursorGlow enabled={true} />
      
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenEnroll={handleOpenEnroll}
        onOpenPresentation={() => setIsPresentationModalOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
        isRepositoryLocked={isRepositoryLocked}
        onRequestRepositoryToggle={handleRequestRepositoryToggle}
      />

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div 
            className="px-4 py-3 rounded-xl border shadow-2xl flex items-center space-x-2.5 text-xs font-semibold"
            style={{ background: 'var(--panel)', borderColor: 'var(--accent)', color: 'var(--text)' }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs mono" style={{ color: 'var(--text-dim)' }}>
              Loading Biometric Dataset & Recognition Model...
            </p>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <DashboardView
                enrolledUsers={users}
                attendanceRecords={attendance}
                onNavigate={setCurrentView}
                onOpenEnroll={handleOpenEnroll}
                onRefreshAttendance={loadData}
                onOpenDailyReport={() => setIsDailyReportOpen(true)}
                onOpenPresentation={() => setIsPresentationModalOpen(true)}
                isRepositoryLocked={isRepositoryLocked}
                onRequestRepositoryToggle={handleRequestRepositoryToggle}
              />
            )}

            {currentView === 'scanner' && (
              <RecognitionView
                enrolledUsers={users}
                onAttendanceMarked={loadData}
                onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
              />
            )}

            {currentView === 'users' && (
              <UsersGalleryView
                users={users}
                onSelectUser={setSelectedUser}
                onOpenEnroll={handleOpenEnroll}
                onQuickAttendance={handleQuickAttendance}
                onRequestLockToggle={handleRequestLockToggle}
                onEmergencyLockdown={handleEmergencyLockdownTrigger}
              />
            )}

            {currentView === 'attendance' && (
              <AttendanceView
                attendanceRecords={attendance}
                enrolledUsers={users}
                onRefreshAttendance={loadData}
                onSelectUser={setSelectedUser}
                onOpenDailyReport={() => setIsDailyReportOpen(true)}
              />
            )}

            {currentView === 'audit' && (
              <AuditView />
            )}

            {currentView === 'drive' && (
              <GoogleDriveView
                attendanceRecords={attendance}
                enrolledUsers={users}
                onShowToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-dim)' }}>
          <div className="flex items-center space-x-2">
            <span className="font-bold" style={{ color: 'var(--text)' }}>BioScan.AI</span>
            <span>&bull;</span>
            <span className="mono">Preserved biometric visual styling with 128-d Euclidean matching</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDailyReportOpen(true)}
              className="hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Shift Attendance Report</span>
            </button>

            <span>&bull;</span>

            <button
              onClick={() => setCurrentView('drive')}
              className="hover:underline flex items-center space-x-1"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Google Drive Sync</span>
            </button>

            <span>&bull;</span>

            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="hover:underline flex items-center space-x-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Setup &amp; Supabase Guide</span>
            </button>

            <span>&bull;</span>

            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:underline flex items-center space-x-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Biometric Privacy Notice</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UserEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        existingUsers={users}
        onUserEnrolled={handleUserEnrolled}
      />

      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
      />

      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />

      <LoginModal />

      {/* Daily Shift & Attendance Management Report Modal */}
      <DailyReportModal
        isOpen={isDailyReportOpen}
        onClose={() => setIsDailyReportOpen(false)}
        attendanceRecords={attendance}
        enrolledUsers={users}
      />

      {/* Master Password Verification Modal for Single Profile Lock / Unlock */}
      {lockTargetUser && (
        <MasterPasswordModal
          isOpen={!!lockTargetUser}
          onClose={() => setLockTargetUser(null)}
          onSuccess={handleConfirmLockToggle}
          title={lockTargetUser.is_locked ? `Unlock Profile for ${lockTargetUser.full_name}` : `Lock Profile for ${lockTargetUser.full_name}`}
          description={
            lockTargetUser.is_locked
              ? 'Enter the Master Passkey to lift the security hold and re-enable attendance check-ins.'
              : 'Enter the Master Passkey to lock this profile. Blocked profiles cannot mark attendance at camera kiosks.'
          }
          actionLabel={lockTargetUser.is_locked ? 'Unlock Profile' : 'Lock Profile'}
          lockTargetName={lockTargetUser.full_name}
          isLockAction={!lockTargetUser.is_locked}
        />
      )}

      {/* Master Password Verification Modal for Emergency Repository Lockdown / Release */}
      <MasterPasswordModal
        isOpen={isEmergencyLockModalOpen}
        onClose={() => setIsEmergencyLockModalOpen(false)}
        onSuccess={handleConfirmEmergencyLockdown}
        title={emergencyLockAction ? 'Lock All Repositories' : 'Unlock All Repositories'}
        description={
          emergencyLockAction
            ? 'Enter Master Passkey to place ALL facial profiles, biometric embeddings, and attendance repositories on security lockdown.'
            : 'Enter Master Passkey to restore normal biometric access and check-in privileges for all repository profiles.'
        }
        actionLabel={emergencyLockAction ? 'Lock All Repositories' : 'Unlock All Repositories'}
        isLockAction={emergencyLockAction}
      />

      {/* Project Presentation Deck (PPT & PDF Viewer) */}
      <ProjectPresentationModal
        isOpen={isPresentationModalOpen}
        onClose={() => setIsPresentationModalOpen(false)}
      />

      {/* Gemini Live Voice Conversation Modal (gemini-3.8-live) */}
      <VoiceConversationModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Persistent Floating Presentation Deck Launcher (Bottom Left) */}
      <button
        id="btn-floating-presentation"
        onClick={() => setIsPresentationModalOpen(true)}
        className="fixed bottom-6 left-6 z-40 px-3.5 py-2 rounded-xl border shadow-xl flex items-center space-x-2 text-xs font-bold transition-all hover:scale-105 group bg-slate-950/90 border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/80"
        title="Open Project Presentation Deck (12 Slides) & Download PDF"
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <Presentation className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
        <span>Project Deck &bull; PPT / PDF</span>
      </button>

      {/* Persistent Floating Gemini Live Voice Assistant Launcher (Bottom Right) */}
      <button
        id="btn-floating-live-voice"
        onClick={() => setIsVoiceModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-3.5 py-2.5 rounded-2xl border shadow-2xl flex items-center space-x-2 text-xs font-bold transition-all hover:scale-105 group bg-slate-950/90 border-cyan-400/60 text-cyan-300 hover:bg-cyan-950/80 hover:shadow-cyan-500/25 cursor-pointer"
        title="Start Real-time Voice Conversation with Gemini Live API (gemini-3.8-live)"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="absolute w-2 h-2 rounded-full bg-cyan-400" />
        </div>
        <Mic className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="font-bold tracking-tight">AI Voice Live</span>
        <span className="px-1.5 py-0.5 rounded text-[9px] mono bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 uppercase">
          Live API
        </span>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GoogleDriveProvider>
          <AppContent />
        </GoogleDriveProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
