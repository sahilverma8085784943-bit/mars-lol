import React from 'react';
import { Shield, Lock, X, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center border"
              style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold">Biometric Privacy & Compliance</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Authorized Attendance & Enrollment Notice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:opacity-80 transition-colors"
            style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            This biometric system is strictly restricted for authorized educational and organizational attendance verification.
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2.5">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <div>
                <strong className="block">1. Mathematical Descriptors vs. Raw Biometrics</strong>
                <p style={{ color: 'var(--text-dim)' }}>
                  Facial images are converted into an irreversible 128-dimensional mathematical floating-point embedding vector. The raw face image cannot be reverse-engineered from this vector.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <div>
                <strong className="block">2. Informed Subject Consent</strong>
                <p style={{ color: 'var(--text-dim)' }}>
                  Enrollment requires explicit consent checkbox confirmation with timestamp recording. Unconsented registration is prohibited.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <EyeOff className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <div>
                <strong className="block">3. Right to Erasure (Delete Biometrics)</strong>
                <p style={{ color: 'var(--text-dim)' }}>
                  Enrolled individuals have the right to request deletion of their biometric templates at any time. Administrators have a one-click &quot;Delete Biometric Data&quot; function to expunge vectors immediately while preserving attendance logs.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <div>
                <strong className="block">4. Access Control & Row Level Security</strong>
                <p style={{ color: 'var(--text-dim)' }}>
                  Supabase database policies enforce strict role-based access. Only authorized administrators can enroll, edit, delete, or export biometric data.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t text-right" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'var(--accent)', color: '#0a0e13' }}
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
