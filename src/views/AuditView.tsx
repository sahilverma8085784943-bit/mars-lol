import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw, Filter, Clock, User } from 'lucide-react';
import { AuditLog } from '../types';
import { dataService } from '../lib/supabase';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    const res = await dataService.getAuditLogs();
    setLogs(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <History className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              <span>Biometric Security Audit Trail</span>
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Cryptographic and behavioral log of enrollment, updates, attendance, and biometric deletions
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 hover:opacity-80"
            style={{ borderColor: 'var(--line)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Stream</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="mono" style={{ color: 'var(--text-dim)' }}>Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border bg-transparent text-xs"
            style={{ borderColor: 'var(--line)' }}
          >
            <option value="all">All Actions</option>
            <option value="USER_ENROLLED">USER_ENROLLED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="USER_DELETED">USER_DELETED</option>
            <option value="ATTENDANCE_RECORDED">ATTENDANCE_RECORDED</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        {loading ? (
          <div className="p-12 text-center text-xs">Loading audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
            No audit records recorded.
          </div>
        ) : (
          <div className="divide-y text-xs" style={{ borderColor: 'var(--line)' }}>
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] mono font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      {log.action}
                    </span>
                    <span className="text-[11px] mono font-semibold" style={{ color: 'var(--text)' }}>
                      Entity: {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 14)}...)` : ''}
                    </span>
                  </div>

                  <p className="text-[11px] mono" style={{ color: 'var(--text-dim)' }}>
                    Actor: {log.actor_name || 'System Auto-Processor'}
                  </p>

                  {log.metadata && (
                    <div className="p-2 rounded bg-black/10 dark:bg-black/40 font-mono text-[10px] text-gray-400 mt-1 max-w-xl truncate">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] mono block" style={{ color: 'var(--text-dim)' }}>
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs mono font-bold block" style={{ color: 'var(--text)' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
