import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Eye, EyeOff, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { verifyMasterPassword, MASTER_SECURITY_PASSWORD } from '../lib/security';
import { biometricAudio } from '../lib/audioFeedback';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserName?: string;
  isCurrentlyLocked?: boolean;
  onConfirm?: (reason?: string) => void;
  onSuccess?: (reason?: string) => void;
  bulkAction?: 'lock_all' | 'unlock_all' | null;
  title?: string;
  description?: string;
  actionLabel?: string;
  lockTargetName?: string;
  isLockAction?: boolean;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUserName,
  isCurrentlyLocked = false,
  onConfirm,
  onSuccess,
  bulkAction,
  title,
  description,
  actionLabel,
  lockTargetName,
  isLockAction,
}) => {
  const effectiveTargetName = lockTargetName || targetUserName;
  const isLockingAction = isLockAction !== undefined 
    ? isLockAction 
    : bulkAction 
      ? bulkAction === 'lock_all' 
      : !isCurrentlyLocked;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState(
    isLockingAction ? 'Security Review & Identity Verification Hold' : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerifyAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verifyMasterPassword(password)) {
      setError('Access Denied: Incorrect Master Passkey.');
      biometricAudio.playAlert();
      return;
    }

    setIsSuccess(true);
    biometricAudio.playLockSound(isLockingAction);

    setTimeout(() => {
      if (onSuccess) onSuccess(reason);
      if (onConfirm) onConfirm(reason);
      handleClose();
    }, 400);
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200"
        style={{
          background: 'var(--panel)',
          borderColor: isLockingAction ? 'rgba(245, 158, 11, 0.45)' : 'var(--accent-line)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                borderColor: isLockingAction ? '#f59e0b' : 'var(--accent)',
                background: isLockingAction ? 'rgba(245, 158, 11, 0.15)' : 'var(--accent-soft)',
              }}
            >
              {isLockingAction ? (
                <Lock className="w-5 h-5 text-amber-400" />
              ) : (
                <Unlock className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center space-x-1.5">
                <span>
                  {title || (bulkAction === 'lock_all'
                    ? 'Lock Repository & All Profiles'
                    : bulkAction === 'unlock_all'
                    ? 'Unlock Repository & All Profiles'
                    : isLockingAction
                    ? 'Lock Biometric Profile'
                    : 'Unlock Biometric Profile')}
                </span>
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {description || (effectiveTargetName ? `Target: ${effectiveTargetName}` : 'Master Repository Security Access Control')}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-lg border hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--line)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Warning Notice */}
        <div
          className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
            isLockingAction
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            {isLockingAction ? (
              <span>
                <strong>Profile Lock Condition:</strong> When locked, the user will be blocked from
                punching attendance in the live biometric scanner, and modifications to their vector
                descriptors are restricted until unlocked.
              </span>
            ) : (
              <span>
                <strong>Profile Unlocked:</strong> Once unlocked, the user will regain normal
                camera attendance check-in rights and active roster privileges.
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
          {/* Reason Field (if locking) */}
          {isLockingAction && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                Lock Condition / Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Identity Verification Hold, Leave of Absence, Disciplinary Hold"
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
              />
            </div>
          )}

          {/* Master Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold flex items-center space-x-1" style={{ color: 'var(--text-dim)' }}>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Enter Master Passkey</span>
              </label>
              <span className="text-[11px] mono opacity-80" style={{ color: 'var(--text-dim)' }}>
                Confidential Passkey
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter master passkey"
                autoFocus
                required
                className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl border focus:outline-none mono transition-colors"
                style={{
                  background: 'var(--bg)',
                  borderColor: error ? '#ef4444' : 'var(--line)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-xs opacity-60 hover:opacity-100"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg border text-xs flex items-center space-x-2 bg-red-500/10 border-red-500/30 text-red-400 animate-in shake duration-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-2.5 rounded-lg border text-xs flex items-center space-x-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Master passkey verified. Applying profile condition...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 rounded-xl border text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--line)' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!password || isSuccess}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md ${
                isLockingAction
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isLockingAction ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{actionLabel || 'Confirm Lock'}</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{actionLabel || 'Confirm Unlock'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
