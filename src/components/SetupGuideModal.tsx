import React, { useState } from 'react';
import { Terminal, Database, Cloud, X, Copy, Check, ShieldCheck } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envSample = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;

  const installCmd = `npm install
npm run dev`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center border"
              style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              <Database className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold">Setup, Supabase & Deployment Guide</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Instructions to run locally and connect Supabase database
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

        <div className="p-6 space-y-5 text-xs max-h-[500px] overflow-y-auto" style={{ color: 'var(--text)' }}>
          
          {/* Section 1: Supabase Configuration */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm flex items-center space-x-2">
              <Database className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>1. Supabase Database & Auth Setup</span>
            </h3>
            <p style={{ color: 'var(--text-dim)' }}>
              1. Create a free project at <span className="mono font-semibold">https://supabase.com</span>.<br />
              2. Navigate to SQL Editor and run the SQL script located in <span className="mono font-bold">/supabase/schema.sql</span> (creates <span className="mono">profiles</span>, <span className="mono">users</span>, <span className="mono">attendance</span>, <span className="mono">audit_logs</span>, RLS policies, and private storage).<br />
              3. Run <span className="mono font-bold">/supabase/seed.sql</span> to seed the legacy enrolled faces.<br />
              4. Copy your project URL and Anon public key into your environment variables.
            </p>

            <div className="relative rounded-lg p-3 bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-400">
              <pre>{envSample}</pre>
              <button
                onClick={() => copyText(envSample, 'env')}
                className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                title="Copy Env"
              >
                {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Section 2: Local Development */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm flex items-center space-x-2">
              <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>2. Local Development Execution</span>
            </h3>
            <p style={{ color: 'var(--text-dim)' }}>
              Clone the project, install dependencies and launch Vite dev server:
            </p>

            <div className="relative rounded-lg p-3 bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-400">
              <pre>{installCmd}</pre>
              <button
                onClick={() => copyText(installCmd, 'cmd')}
                className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                title="Copy command"
              >
                {copiedSection === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Section 3: Cloud Deployment */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm flex items-center space-x-2">
              <Cloud className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>3. Production Cloud Deployment</span>
            </h3>
            <p style={{ color: 'var(--text-dim)' }}>
              Build production static files using <span className="mono font-semibold">npm run build</span>. Deploy <span className="mono">/dist</span> to Vercel, Netlify, Cloudflare Pages, or Google Cloud Run. Set <span className="mono">VITE_SUPABASE_URL</span> and <span className="mono">VITE_SUPABASE_ANON_KEY</span> in your deployment environment variables.
            </p>
          </div>

          <div className="pt-3 border-t text-right" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'var(--accent)', color: '#0a0e13' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
