import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Edit, 
  UserX, 
  UserCheck, 
  Cpu, 
  History, 
  Fingerprint,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound
} from 'lucide-react';
import { EnrolledUser, AttendanceRecord, AuditLog } from '../types';
import { dataService } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MasterPasswordModal } from './MasterPasswordModal';

interface UserDetailModalProps {
  user: EnrolledUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: EnrolledUser) => void;
  onUserDeleted: (userId: string) => void;
  onRequestLockToggle?: (user: EnrolledUser) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  onUserDeleted,
  onRequestLockToggle,
}) => {
  const { currentProfile, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'vector' | 'attendance' | 'audit'>('profile');
  const [userAttendance, setUserAttendance] = useState<AttendanceRecord[]>([]);
  const [userAudit, setUserAudit] = useState<AuditLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Lock Modal state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // Confirmation dialogs
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);
  const [confirmDeleteBiometrics, setConfirmDeleteBiometrics] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setEditFullName(user.full_name);
      setEditRoll(user.roll_number || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
      setEditDepartment(user.department || '');
      setEditNotes(user.notes || '');
      setIsEditing(false);
      setConfirmDeleteUser(false);
      setConfirmDeleteBiometrics(false);

      // Fetch user history
      setLoadingHistory(true);
      Promise.all([
        dataService.getAttendance(),
        dataService.getAuditLogs(),
      ]).then(([allAttendance, allAudit]) => {
        setUserAttendance(allAttendance.filter(a => a.user_id === user.id));
        setUserAudit(allAudit.filter(l => l.entity_id === user.id || l.metadata?.userId === user.id));
        setLoadingHistory(false);
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isLocked = Boolean(user.is_locked);

  const handleSaveEdit = async () => {
    const updated = await dataService.updateUser(
      user.id,
      {
        full_name: editFullName.trim(),
        roll_number: editRoll.trim() || null,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        department: editDepartment.trim() || null,
        notes: editNotes.trim() || null,
      },
      currentProfile
    );
    setIsEditing(false);
    onUserUpdated(updated);
  };

  const handleToggleLockConfirm = async (reason?: string) => {
    const newLockState = !isLocked;
    const updated = await dataService.toggleUserLock(
      user.id,
      newLockState,
      reason || (newLockState ? 'Master Administrative Hold' : undefined),
      currentProfile
    );
    onUserUpdated(updated);
  };

  const handleToggleActive = async () => {
    const updated = await dataService.updateUser(
      user.id,
      { is_active: !user.is_active },
      currentProfile
    );
    onUserUpdated(updated);
  };

  const handleDeleteBiometrics = async () => {
    const updated = await dataService.deleteBiometricData(user.id, currentProfile);
    onUserUpdated(updated);
    setConfirmDeleteBiometrics(false);
  };

  const handleDeleteUser = async () => {
    await dataService.deleteUser(user.id, currentProfile);
    onUserDeleted(user.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Header */}
        <div className="p-6 border-b flex items-start justify-between" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--accent)' }}>
              {user.photo_url ? (
                <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                  <Fingerprint className="w-8 h-8" />
                </div>
              )}
              <div className="bracket b-tl !w-2 !h-2" />
              <div className="bracket b-br !w-2 !h-2" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">{user.full_name}</h2>
                {isLocked && (
                  <span className="text-xs px-2 py-0.5 rounded mono uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                    <Lock className="w-3 h-3 mr-0.5" />
                    Locked (Hold)
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded mono uppercase ${
                  user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {user.is_active ? 'Active Record' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs mono" style={{ color: 'var(--accent)' }}>
                {user.roll_number || 'NO ROLL ASSIGNED'} &bull; {user.department}
              </p>
              <p className="text-[11px] mono mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Enrolled: {new Date(user.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLockModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-colors ${
                isLocked
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isLocked ? 'Unlock Profile' : 'Lock Profile'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border hover:opacity-80 transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Lock Condition Banner */}
        {isLocked && (
          <div className="mx-6 mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 bg-amber-500/10 border-amber-500/30 text-amber-300">
            <div className="flex items-start space-x-2.5">
              <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block">Profile Locked &bull; Security Hold Active</span>
                <span className="text-xs">Reason: {user.locked_reason || 'Repository Security Lockdown'}. Attendance cannot be marked.</span>
              </div>
            </div>
            <button
              onClick={() => setIsLockModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 flex items-center space-x-1.5 shadow-sm transition-colors flex-shrink-0"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Profile</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b px-6 space-x-4 text-xs font-semibold" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'profile' ? 'border-emerald-500 text-emerald-500' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-dim)' }}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Bio</span>
          </button>

          <button
            onClick={() => setActiveTab('vector')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'vector' ? 'border-emerald-500 text-emerald-500' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'vector' ? 'var(--accent)' : 'var(--text-dim)' }}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>128-D Vector</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'attendance' ? 'border-emerald-500 text-emerald-500' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'attendance' ? 'var(--accent)' : 'var(--text-dim)' }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance ({userAttendance.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'audit' ? 'border-emerald-500 text-emerald-500' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'audit' ? 'var(--accent)' : 'var(--text-dim)' }}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({userAudit.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[440px] overflow-y-auto">
          
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6 text-xs">
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                    <span className="text-[11px] block mono" style={{ color: 'var(--text-dim)' }}>Full Name</span>
                    <span className="font-semibold text-sm">{user.full_name}</span>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                    <span className="text-[11px] block mono" style={{ color: 'var(--text-dim)' }}>Roll / ID</span>
                    <span className="font-semibold text-sm mono" style={{ color: 'var(--accent)' }}>{user.roll_number || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                    <span className="text-[11px] block mono" style={{ color: 'var(--text-dim)' }}>Email</span>
                    <span className="font-semibold">{user.email || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                    <span className="text-[11px] block mono" style={{ color: 'var(--text-dim)' }}>Phone</span>
                    <span className="font-semibold mono">{user.phone || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                    <span className="text-[11px] block mono" style={{ color: 'var(--text-dim)' }}>Department</span>
                    <span className="font-semibold">{user.department || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                    <span className="text-[11px] block mono" style={{ color: 'var(--text-dim)' }}>Role</span>
                    <span className="font-semibold uppercase mono">{user.user_role}</span>
                  </div>

                  <div className="sm:col-span-2 p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                    <span className="text-[11px] block mono" style={{ color: 'var(--text-dim)' }}>Notes</span>
                    <span className="font-medium">{user.notes || 'No custom notes recorded.'}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-transparent font-medium"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Roll Number</label>
                    <input
                      type="text"
                      value={editRoll}
                      onChange={(e) => setEditRoll(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-transparent mono"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-transparent"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Phone</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-transparent mono"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Department</label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-transparent"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-transparent"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded border"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 rounded font-bold"
                      style={{ background: 'var(--accent)', color: '#0a0e13' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Actions Bar */}
              {isAdmin && !isEditing && (
                <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[11px] mono uppercase font-bold" style={{ color: 'var(--text-dim)' }}>
                    Admin Controls
                  </span>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 rounded border flex items-center space-x-1.5 hover:opacity-80"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Info</span>
                    </button>

                    <button
                      onClick={handleToggleActive}
                      className="px-3 py-1.5 rounded border flex items-center space-x-1.5 hover:opacity-80"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-yellow-500" />
                          <span>Deactivate User</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Reactivate User</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setConfirmDeleteBiometrics(true)}
                      className="px-3 py-1.5 rounded border border-orange-500/40 text-orange-500 hover:bg-orange-500/10 flex items-center space-x-1.5"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Delete Biometric Data</span>
                    </button>

                    <button
                      onClick={() => setConfirmDeleteUser(true)}
                      className="px-3 py-1.5 rounded border border-red-500/40 text-red-500 hover:bg-red-500/10 flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete User Permanently</span>
                    </button>
                  </div>

                  {/* Confirmation: Delete Biometrics */}
                  {confirmDeleteBiometrics && (
                    <div className="p-3 rounded-lg border border-orange-500/40 bg-orange-500/10 space-y-2">
                      <p className="font-bold text-orange-500">
                        Confirm: Permanently erase biometric template?
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text)' }}>
                        This will delete the 128-dimensional facial descriptor and photo URL. The user profile will remain for historical attendance records, but face recognition will no longer match this person.
                      </p>
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => setConfirmDeleteBiometrics(false)}
                          className="px-3 py-1 rounded border text-xs"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteBiometrics}
                          className="px-3 py-1 rounded text-xs font-bold bg-orange-500 text-white"
                        >
                          Erase Biometrics
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirmation: Delete User Completely */}
                  {confirmDeleteUser && (
                    <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 space-y-2">
                      <p className="font-bold text-red-500">
                        Confirm: Delete entire user account?
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text)' }}>
                        This will permanently remove {user.full_name}, their roll number, photo, and biometric credentials. This action cannot be undone.
                      </p>
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => setConfirmDeleteUser(false)}
                          className="px-3 py-1 rounded border text-xs"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteUser}
                          className="px-3 py-1 rounded text-xs font-bold bg-red-600 text-white"
                        >
                          Confirm Complete Deletion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 128-D Vector Inspector */}
          {activeTab === 'vector' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs mono font-bold" style={{ color: 'var(--text)' }}>
                  128-Dimensional Biometric Embedding Array
                </span>
                <span className="text-xs mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  L2 Norm: 1.0000
                </span>
              </div>

              {user.face_descriptor && user.face_descriptor.length === 128 ? (
                <>
                  <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    Calculated via localized gradient & luminance variance across 16x8 spatial cells. Used for instant Euclidean distance comparison on scan.
                  </p>

                  <div 
                    className="p-3 rounded-xl border font-mono text-[10px] leading-relaxed max-h-56 overflow-y-auto"
                    style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
                  >
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                      {user.face_descriptor.map((val, idx) => (
                        <span key={idx} className="p-1 rounded bg-black/20 text-center" style={{ color: val >= 0 ? 'var(--accent)' : '#eab308' }}>
                          [{idx}]: {val.toFixed(3)}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
                  No active 128-d descriptor vector present for this user.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Attendance History */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              {loadingHistory ? (
                <p className="text-xs text-center py-6">Loading attendance history...</p>
              ) : userAttendance.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--text-dim)' }}>
                  No attendance records logged for this user yet.
                </p>
              ) : (
                <div className="divide-y text-xs" style={{ borderColor: 'var(--line)' }}>
                  {userAttendance.map((rec) => (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold block">{rec.attendance_date}</span>
                        <span className="text-[11px] mono" style={{ color: 'var(--text-dim)' }}>
                          Check-in: {new Date(rec.check_in_at).toLocaleTimeString()} &bull; Method: {rec.method}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs mono font-bold" style={{ color: 'var(--accent)' }}>
                          {(rec.confidence_score * 100).toFixed(1)}% Match
                        </span>
                        <span className="block text-[10px] mono" style={{ color: 'var(--text-dim)' }}>
                          {rec.verified_by_name || 'Face Auto-Match'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {loadingHistory ? (
                <p className="text-xs text-center py-6">Loading audit events...</p>
              ) : userAudit.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--text-dim)' }}>
                  No recorded audit events for this user.
                </p>
              ) : (
                <div className="divide-y text-xs" style={{ borderColor: 'var(--line)' }}>
                  {userAudit.map((log) => (
                    <div key={log.id} className="py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold mono" style={{ color: 'var(--accent)' }}>{log.action}</span>
                        <span className="text-[11px] mono" style={{ color: 'var(--text-dim)' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        Actor: {log.actor_name || 'System'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Master Password Verification Modal for Lock / Unlock */}
      <MasterPasswordModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onSuccess={handleToggleLockConfirm}
        title={isLocked ? `Unlock Profile for ${user.full_name}` : `Lock Profile for ${user.full_name}`}
        description={
          isLocked
            ? `Enter the Master Passkey to lift security hold and restore biometric attendance marking.`
            : `Enter the Master Passkey to place profile on security hold. Locked users are rejected at scanner kiosks.`
        }
        actionLabel={isLocked ? 'Confirm & Unlock' : 'Lock Profile'}
        lockTargetName={user.full_name}
        isLockAction={!isLocked}
      />
    </div>
  );
};
