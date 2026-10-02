import React from 'react';
import { CameraScanner } from '../components/CameraScanner';
import { EnrolledUser } from '../types';
import { Scan, ShieldAlert, Cpu, Eye, CheckCircle2, Volume2, Mic } from 'lucide-react';

interface RecognitionViewProps {
  enrolledUsers: EnrolledUser[];
  onAttendanceMarked: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const RecognitionView: React.FC<RecognitionViewProps> = ({
  enrolledUsers,
  onAttendanceMarked,
  onOpenVoiceAssistant,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Scanner Kiosk Instructions */}
      <div className="p-6 rounded-2xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              <Scan className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Live Biometric Attendance Kiosk</h1>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Real-time facial descriptor extraction, sonar target acquisition, &amp; Euclidean attendance verification
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs mono">
            {onOpenVoiceAssistant && (
              <button
                id="btn-kiosk-live-voice"
                onClick={onOpenVoiceAssistant}
                className="px-3 py-1.5 rounded-lg border flex items-center space-x-2 text-xs font-bold transition-all shadow-sm bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:border-cyan-300 hover:scale-105"
                title="Talk with Gemini Live Voice Assistant"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Talk with AI &bull; Gemini Live</span>
              </button>
            )}
            <span className="px-3 py-1.5 rounded-lg border flex items-center space-x-1.5" style={{ borderColor: 'var(--line)' }}>
              <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>Sonar Active</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg border flex items-center space-x-1.5" style={{ borderColor: 'var(--line)' }}>
              <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>{enrolledUsers.filter(u => u.is_active).length} Target Descriptors</span>
            </span>
          </div>
        </div>

        {/* 3 Step Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
            <span className="mono font-bold block mb-1" style={{ color: 'var(--accent)' }}>01 / START CAMERA</span>
            <p style={{ color: 'var(--text-dim)' }}>Click &quot;Start Camera&quot; to initialize video sensors and prepare the real-time targeting reticle.</p>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
            <span className="mono font-bold block mb-1" style={{ color: 'var(--accent)' }}>02 / TARGET &amp; SONAR LOCK</span>
            <p style={{ color: 'var(--text-dim)' }}>Center face in frame. A high-tech sonar beep confirms biometric detection.</p>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
            <span className="mono font-bold block mb-1" style={{ color: 'var(--accent)' }}>03 / INSTANT CHIME LOG</span>
            <p style={{ color: 'var(--text-dim)' }}>Matching vector &le; 0.48 marks attendance automatically with celebratory confirmation chime.</p>
          </div>
        </div>
      </div>

      {/* Camera Scanner Component */}
      <CameraScanner
        enrolledUsers={enrolledUsers}
        onAttendanceMarked={onAttendanceMarked}
      />
    </div>
  );
};
