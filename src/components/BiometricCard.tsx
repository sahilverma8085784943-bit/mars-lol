import React from 'react';
import { EnrolledUser } from '../types';
import { CheckCircle2, UserX, Eye, UserCheck, ShieldAlert, Cpu, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BiometricCardProps {
  user: EnrolledUser;
  index: number;
  onSelect: (user: EnrolledUser) => void;
  onQuickAttendance?: (user: EnrolledUser) => void;
  onRequestLockToggle?: (user: EnrolledUser) => void;
  compact?: boolean;
  mini?: boolean;
}

export const BiometricCard: React.FC<BiometricCardProps> = ({
  user,
  index,
  onSelect,
  onQuickAttendance,
  onRequestLockToggle,
  compact = true,
  mini = false,
}) => {
  const { isStaff, isAdmin } = useAuth();
  const delay = (index % 16) * 35;

  const isLocked = Boolean(user.is_locked);

  const formattedDate = new Date(user.consent_at || user.created_at).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div
      id={`card-user-${user.id}`}
      data-locked-profile={isLocked ? 'true' : 'false'}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(user);
        }
      }}
      onClick={() => onSelect(user)}
      className={`group rounded-xl border biometric-card-hover cursor-pointer relative overflow-hidden focus:outline-none focus:ring-1 focus:ring-accent ${
        mini ? 'p-1.5' : compact ? 'p-2 sm:p-2.5' : 'p-4'
      } ${isLocked ? 'border-amber-500/35 bg-amber-500/[0.04]' : ''}`}
      style={{
        background: isLocked ? undefined : 'var(--panel)',
        borderColor: isLocked ? 'rgba(245, 158, 11, 0.4)' : 'var(--line)',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Top Status & Role Badge */}
      <div className={`flex items-center justify-between ${mini ? 'mb-1' : compact ? 'mb-1.5' : 'mb-3'}`}>
        <span
          className="text-[8px] uppercase mono px-1 py-0.2 rounded font-medium border"
          style={{
            borderColor: 'var(--line)',
            color: 'var(--text-dim)',
            background: 'var(--bg)',
          }}
        >
          {user.user_role}
        </span>
        <div className="flex items-center space-x-1">
          {isLocked ? (
            <span className="flex items-center text-[8px] mono text-amber-300 font-bold bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/30">
              <Lock className="w-2 h-2 mr-0.5 text-amber-400" />
              Locked
            </span>
          ) : user.is_active ? (
            <span className="flex items-center text-[8px] mono" style={{ color: 'var(--accent)' }}>
              <span className="w-1 h-1 rounded-full mr-1 animate-pulse" style={{ background: 'var(--accent)' }} />
              Active
            </span>
          ) : (
            <span className="flex items-center text-[8px] mono text-slate-400">
              <UserX className="w-2 h-2 mr-0.5" />
              Off
            </span>
          )}
        </div>
      </div>

      {/* Biometric Frame with Corner Brackets (Minimized / Compact height) */}
      <div
        className={`relative rounded-lg overflow-hidden border ${
          mini ? 'h-20 sm:h-22 w-full mb-1.5' : compact ? 'h-24 sm:h-28 w-full mb-2' : 'aspect-square mb-3.5'
        }`}
        style={{
          background: 'var(--bg-grid)',
          borderColor: isLocked ? 'rgba(245, 158, 11, 0.35)' : 'var(--line)',
        }}
      >
        {user.photo_url ? (
          <img
            src={user.photo_url}
            alt={user.full_name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isLocked ? 'grayscale-[25%] contrast-110' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-dim)' }}>
            <ShieldAlert className="w-5 h-5 mb-0.5 opacity-60" />
            <span className="text-[9px] mono">No Photo</span>
          </div>
        )}

        {/* Locked Profile Stamp Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-amber-300 p-1 text-center pointer-events-none">
            <Lock className="w-4 h-4 mb-0.5 text-amber-400 drop-shadow-md animate-pulse" />
            <span className="text-[7px] font-bold uppercase tracking-wider mono bg-black/80 px-1 py-0.2 rounded border border-amber-500/40 text-amber-300">
              LOCKED
            </span>
          </div>
        )}

        {/* 4 Corner Targeting Brackets */}
        <div className={`bracket b-tl !w-2 !h-2 ${isLocked ? '!border-amber-400' : ''}`} />
        <div className={`bracket b-tr !w-2 !h-2 ${isLocked ? '!border-amber-400' : ''}`} />
        <div className={`bracket b-bl !w-2 !h-2 ${isLocked ? '!border-amber-400' : ''}`} />
        <div className={`bracket b-br !w-2 !h-2 ${isLocked ? '!border-amber-400' : ''}`} />

        {/* 128-D Vector Watermark */}
        <div 
          className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[7px] mono border backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: isLocked ? '#fbbf24' : user.face_descriptor?.length === 128 ? 'var(--accent)' : '#eab308',
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          {isLocked ? 'LOCK' : user.face_descriptor?.length === 128 ? '128-D' : 'NO VEC'}
        </div>
      </div>

      {/* User Info (Compact & Clean) */}
      <h3 className={`font-semibold leading-tight truncate mb-0.5 ${mini ? 'text-[11px]' : 'text-xs'}`} style={{ color: 'var(--text)' }}>
        {user.full_name}
      </h3>

      <div className={`space-y-0.5 ${mini ? 'text-[9px] mb-1.5' : 'text-[10px] mb-2'}`} style={{ color: 'var(--text-dim)' }}>
        <p className="mono font-medium truncate" style={{ color: isLocked ? '#fbbf24' : 'var(--accent)' }}>
          {user.roll_number || 'NO ROLL'}
        </p>
        <p className="truncate text-[8px]">
          {isLocked ? (
            <span className="text-amber-300/90">Security Hold</span>
          ) : (
            user.department || 'Enrolled'
          )}
        </p>
      </div>

      {/* Quick Action Footer Buttons */}
      <div className="pt-1 border-t flex items-center justify-between gap-1" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(user);
          }}
          className="flex-1 py-0.5 px-1 rounded text-[9px] font-semibold border flex items-center justify-center space-x-1 hover:opacity-90 transition-colors"
          style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
          title="Inspect full biometric vectors"
        >
          <Eye className="w-2.5 h-2.5" />
          <span>View</span>
        </button>

        {/* Lock / Unlock Toggle Button */}
        {onRequestLockToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestLockToggle(user);
            }}
            className={`py-0.5 px-1 rounded text-[9px] font-medium border flex items-center space-x-0.5 transition-colors ${
              isLocked
                ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25'
                : 'border-gray-500/30 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title={isLocked ? 'Unlock Profile (requires Master Passkey)' : 'Lock Profile (requires Master Passkey)'}
          >
            {isLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5" />}
          </button>
        )}

        {isStaff && user.is_active && onQuickAttendance && !isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAttendance(user);
            }}
            className="py-0.5 px-1 rounded text-[9px] font-bold flex items-center space-x-0.5 transition-colors text-black"
            style={{ background: 'var(--accent)' }}
            title="Mark attendance check-in"
          >
            <UserCheck className="w-2.5 h-2.5" />
            <span className="hidden xs:inline">In</span>
          </button>
        )}
      </div>
    </div>
  );
};
