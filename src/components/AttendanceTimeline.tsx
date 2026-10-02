import React, { useState, useMemo } from 'react';
import { AttendanceRecord, EnrolledUser } from '../types';
import { 
  Clock, 
  User, 
  Calendar, 
  Filter, 
  Edit3, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus
} from 'lucide-react';
import { EditTimelineModal } from './EditTimelineModal';
import { useAuth } from '../context/AuthContext';

interface AttendanceTimelineProps {
  attendanceRecords: AttendanceRecord[];
  enrolledUsers: EnrolledUser[];
  onRefresh: () => void;
  onSelectUser: (user: EnrolledUser) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  filterAllDates: boolean;
  onToggleFilterAllDates: (all: boolean) => void;
}

export const AttendanceTimeline: React.FC<AttendanceTimelineProps> = ({
  attendanceRecords,
  enrolledUsers,
  onRefresh,
  onSelectUser,
  selectedDate,
  onDateChange,
  filterAllDates,
  onToggleFilterAllDates,
}) => {
  const { isAdmin } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'late' | 'ontime'>('all');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Filter records chronologically (ascending or descending)
  const timelineRecords = useMemo(() => {
    let list = attendanceRecords.filter(r => {
      if (!filterAllDates && r.attendance_date !== selectedDate) return false;
      if (filterType === 'in') return r.punch_type === 'in' || !r.punch_type;
      if (filterType === 'out') return r.punch_type === 'out';
      if (filterType === 'late') return r.status === 'late';
      if (filterType === 'ontime') return r.status === 'on-time';
      return true;
    });

    // Sort chronologically (earliest to latest or latest to earliest)
    return list.sort((a, b) => new Date(b.check_in_at).getTime() - new Date(a.check_in_at).getTime());
  }, [attendanceRecords, selectedDate, filterAllDates, filterType]);

  // Statistics for this timeline
  const stats = useMemo(() => {
    const dayRecords = attendanceRecords.filter(r => filterAllDates || r.attendance_date === selectedDate);
    const inCount = dayRecords.filter(r => r.punch_type === 'in' || !r.punch_type).length;
    const outCount = dayRecords.filter(r => r.punch_type === 'out').length;
    const lateCount = dayRecords.filter(r => r.status === 'late').length;
    const onTimeCount = dayRecords.filter(r => r.status === 'on-time').length;

    let firstCheckIn: string | null = null;
    let lastCheckOut: string | null = null;

    if (dayRecords.length > 0) {
      const sortedAsc = [...dayRecords].sort((a, b) => new Date(a.check_in_at).getTime() - new Date(b.check_in_at).getTime());
      firstCheckIn = new Date(sortedAsc[0].check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      lastCheckOut = new Date(sortedAsc[sortedAsc.length - 1].check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    return { total: dayRecords.length, inCount, outCount, lateCount, onTimeCount, firstCheckIn, lastCheckOut };
  }, [attendanceRecords, selectedDate, filterAllDates]);

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'on-time':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            On-Time
          </span>
        );
      case 'late':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Late Arrival
          </span>
        );
      case 'early':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Early Departure
          </span>
        );
      case 'flagged':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase mono bg-red-500/10 text-red-400 border border-red-500/30">
            Flagged Review
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase mono bg-slate-500/10 text-slate-400 border border-slate-500/30">
            Present
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Controls & Filter Bar */}
      <div 
        className="p-4 sm:p-5 rounded-2xl border space-y-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Clock className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <span>Biometric Attendance Timeline</span>
              <span className="text-xs mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                {timelineRecords.length} Events
              </span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Chronological punch stream. Only authorized administrators with Master Passkey can edit timeline timestamps.
            </p>
          </div>

          {/* Quick Date Switcher & Add Punch */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button
              onClick={() => {
                const blank: AttendanceRecord = {
                  id: '',
                  user_id: enrolledUsers[0]?.id || '',
                  user_name: enrolledUsers[0]?.full_name || '',
                  user_roll: enrolledUsers[0]?.roll_number || '',
                  department: enrolledUsers[0]?.department || '',
                  attendance_date: selectedDate,
                  check_in_at: new Date().toISOString(),
                  check_out_at: null,
                  confidence_score: 1.0,
                  method: 'manual',
                  verified_by: null,
                  created_at: new Date().toISOString(),
                  punch_type: 'in',
                  status: 'on-time',
                };
                setEditingRecord(blank);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-all shadow-sm hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#090608' }}
              title="Add a manual attendance entry to the timeline (Requires Master Passkey)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Punch</span>
            </button>

            <input
              type="date"
              value={selectedDate}
              disabled={filterAllDates}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border focus:outline-none mono"
              style={{
                background: 'var(--bg)',
                borderColor: 'var(--line)',
                color: 'var(--text)',
                opacity: filterAllDates ? 0.4 : 1,
              }}
            />

            <button
              onClick={() => onToggleFilterAllDates(!filterAllDates)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterAllDates
                  ? 'border-transparent text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                background: filterAllDates ? 'var(--accent)' : 'var(--bg)',
                borderColor: filterAllDates ? 'var(--accent)' : 'var(--line)',
                color: filterAllDates ? '#ffffff' : 'var(--text)',
              }}
            >
              {filterAllDates ? 'All Dates Active' : 'Filter by Date'}
            </button>
          </div>
        </div>

        {/* Timeline Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] uppercase font-bold mono block" style={{ color: 'var(--text-dim)' }}>Punches In</span>
            <span className="text-base font-bold text-emerald-400">{stats.inCount}</span>
          </div>

          <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] uppercase font-bold mono block" style={{ color: 'var(--text-dim)' }}>Punches Out</span>
            <span className="text-base font-bold text-blue-400">{stats.outCount}</span>
          </div>

          <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] uppercase font-bold mono block" style={{ color: 'var(--text-dim)' }}>Late Entries</span>
            <span className="text-base font-bold text-amber-400">{stats.lateCount}</span>
          </div>

          <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] uppercase font-bold mono block" style={{ color: 'var(--text-dim)' }}>First Check-in</span>
            <span className="text-base font-bold mono" style={{ color: 'var(--text)' }}>
              {stats.firstCheckIn || '--:--'}
            </span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-1 pt-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterType === 'all' ? 'text-white' : 'hover:opacity-80'
            }`}
            style={{
              background: filterType === 'all' ? 'var(--accent)' : 'var(--bg)',
              color: filterType === 'all' ? '#ffffff' : 'var(--text-dim)',
            }}
          >
            All Events ({stats.total})
          </button>

          <button
            onClick={() => setFilterType('in')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterType === 'in' ? 'text-white' : 'hover:opacity-80'
            }`}
            style={{
              background: filterType === 'in' ? 'var(--accent)' : 'var(--bg)',
              color: filterType === 'in' ? '#ffffff' : 'var(--text-dim)',
            }}
          >
            Punch IN ({stats.inCount})
          </button>

          <button
            onClick={() => setFilterType('out')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterType === 'out' ? 'text-white' : 'hover:opacity-80'
            }`}
            style={{
              background: filterType === 'out' ? 'var(--accent)' : 'var(--bg)',
              color: filterType === 'out' ? '#ffffff' : 'var(--text-dim)',
            }}
          >
            Punch OUT ({stats.outCount})
          </button>

          <button
            onClick={() => setFilterType('late')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterType === 'late' ? 'text-white' : 'hover:opacity-80'
            }`}
            style={{
              background: filterType === 'late' ? 'var(--accent)' : 'var(--bg)',
              color: filterType === 'late' ? '#ffffff' : 'var(--text-dim)',
            }}
          >
            Late Arrivals ({stats.lateCount})
          </button>

          <button
            onClick={() => setFilterType('ontime')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterType === 'ontime' ? 'text-white' : 'hover:opacity-80'
            }`}
            style={{
              background: filterType === 'ontime' ? 'var(--accent)' : 'var(--bg)',
              color: filterType === 'ontime' ? '#ffffff' : 'var(--text-dim)',
            }}
          >
            Punctual ({stats.onTimeCount})
          </button>
        </div>
      </div>

      {/* Main Timeline Spine Stream */}
      {timelineRecords.length === 0 ? (
        <div 
          className="p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-3"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <Clock className="w-10 h-10 opacity-30" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-semibold">No attendance timeline punches found</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Switch dates or run live face recognition to start populating this timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-8 sm:pl-12 space-y-6">
          {/* Vertical Glowing Timeline Guide Wire */}
          <div className="timeline-spine" />

          {timelineRecords.map((record, idx) => {
            const isPunchIn = record.punch_type === 'in' || !record.punch_type;
            const correspondingUser = enrolledUsers.find(u => u.id === record.user_id);

            return (
              <div 
                key={record.id}
                className="relative group animate-in slide-in-from-left-2 fade-in duration-200"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Node Dot with Glow */}
                <div 
                  className="absolute -left-[30px] sm:-left-[38px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-125"
                  style={{
                    background: isPunchIn ? '#064e3b' : '#1e1b4b',
                    borderColor: isPunchIn ? '#10b981' : '#38bdf8',
                  }}
                >
                  <span className={`w-2 h-2 rounded-full ${isPunchIn ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
                </div>

                {/* Timeline Card */}
                <div 
                  className="p-4 sm:p-5 rounded-2xl border transition-all duration-200 group-hover:shadow-xl relative"
                  style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* User and Punch Info */}
                    <div className="flex items-center space-x-3.5">
                      {/* Avatar */}
                      <div 
                        onClick={() => correspondingUser && onSelectUser(correspondingUser)}
                        className="w-11 h-11 rounded-xl overflow-hidden border flex-shrink-0 cursor-pointer hover:opacity-90 relative"
                        style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
                        title="Click to view biometric profile"
                      >
                        {record.user_photo ? (
                          <img src={record.user_photo} alt={record.user_name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs mono">
                            {record.user_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span 
                            onClick={() => correspondingUser && onSelectUser(correspondingUser)}
                            className="font-bold text-sm cursor-pointer hover:underline"
                            style={{ color: 'var(--text)' }}
                          >
                            {record.user_name || 'Unknown Attendee'}
                          </span>

                          {/* Punch Type Badge */}
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase mono border ${
                            isPunchIn 
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                              : 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                          }`}>
                            {isPunchIn ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                            <span>{isPunchIn ? 'Punch IN' : 'Punch OUT'}</span>
                          </span>

                          {/* Status Badge */}
                          {getStatusBadge(record.status)}
                        </div>

                        <div className="flex items-center space-x-2 text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                          <span className="mono">{record.user_roll || 'No Roll'}</span>
                          <span>&bull;</span>
                          <span>{record.department || 'Department General'}</span>
                          <span>&bull;</span>
                          <span className="mono font-semibold" style={{ color: 'var(--accent)' }}>
                            {(record.confidence_score * 100).toFixed(1)}% Match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp & Protected Edit Action */}
                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: 'var(--line)' }}>
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-bold mono flex items-center sm:justify-end space-x-1.5" style={{ color: 'var(--text)' }}>
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span>{formatTime(record.check_in_at)}</span>
                        </div>
                        <div className="text-[11px] mono mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          {record.attendance_date} &bull; {record.method === 'face' ? 'Live Camera' : 'Manual Entry'}
                        </div>
                      </div>

                      {/* Protected Timeline Edit Button (Requires Password) */}
                      <button
                        onClick={() => setEditingRecord(record)}
                        className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all hover:bg-white/5"
                        style={{
                          borderColor: 'var(--accent-line)',
                          color: 'var(--accent)',
                        }}
                        title="Edit timestamp, status or punch notes (Requires Master Passkey)"
                      >
                        <Lock className="w-3 h-3" />
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Punch</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes / Shift Details */}
                  {(record.notes || record.shift_name) && (
                    <div 
                      className="mt-3 p-2.5 rounded-xl text-xs flex items-center justify-between border"
                      style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
                    >
                      <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                        {record.notes ? `Note: ${record.notes}` : `Shift: ${record.shift_name}`}
                      </span>
                      {record.verified_by_name && (
                        <span className="text-[10px] mono" style={{ color: 'var(--text-dim)' }}>
                          Verified: {record.verified_by_name.replace(/\s*\(Password:\s*mars\)/gi, '').replace(/\s*\(-?\s*mars\)/gi, '')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Timeline Modal (Master Passkey Protected) */}
      <EditTimelineModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onRecordUpdated={() => {
          onRefresh();
          setEditingRecord(null);
        }}
        enrolledUsers={enrolledUsers}
      />
    </div>
  );
};
