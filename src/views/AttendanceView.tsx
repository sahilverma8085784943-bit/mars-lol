import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  Search, 
  Download, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  User, 
  Eye, 
  HardDrive,
  FileText
} from 'lucide-react';
import { AttendanceRecord, EnrolledUser } from '../types';
import { exportAttendanceToCsv } from '../lib/exportCsv';
import { useAuth } from '../context/AuthContext';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { dataService } from '../lib/supabase';
import { AttendanceTimeline } from '../components/AttendanceTimeline';

interface AttendanceViewProps {
  attendanceRecords: AttendanceRecord[];
  enrolledUsers: EnrolledUser[];
  onRefreshAttendance: () => void;
  onSelectUser: (user: EnrolledUser) => void;
  onOpenDailyReport?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendanceRecords,
  enrolledUsers,
  onRefreshAttendance,
  onSelectUser,
  onOpenDailyReport,
}) => {
  const { isAdmin, isStaff, currentProfile } = useAuth();
  const { isConnected: isDriveConnected, syncAttendance, signIn: signInDrive, isSyncing: isDriveSyncing } = useGoogleDrive();
  const [driveSyncMsg, setDriveSyncMsg] = useState<string | null>(null);

  // Mode: Timeline (visual stream) or Table (raw audit logs)
  const [activeMode, setActiveMode] = useState<'timeline' | 'table'>('timeline');

  // Search & Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterAllDates, setFilterAllDates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Manual Check-in Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualFeedback, setManualFeedback] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    enrolledUsers.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [enrolledUsers]);

  // Filtered attendance list
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter(rec => {
      // Date Filter
      if (!filterAllDates && rec.attendance_date !== selectedDate) {
        return false;
      }

      // Department Filter
      if (selectedDepartment !== 'all' && rec.department !== selectedDepartment) {
        return false;
      }

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = rec.user_name?.toLowerCase().includes(q);
        const matchesRoll = rec.user_roll?.toLowerCase().includes(q);
        const matchesDept = rec.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesDept) return false;
      }

      return true;
    });
  }, [attendanceRecords, selectedDate, filterAllDates, selectedDepartment, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredAttendance.length / pageSize) || 1;
  const paginatedAttendance = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendance.slice(start, start + pageSize);
  }, [filteredAttendance, currentPage, pageSize]);

  const handleExport = () => {
    exportAttendanceToCsv(filteredAttendance);
  };

  const handleDriveSync = async () => {
    if (!isDriveConnected) {
      try {
        await signInDrive();
      } catch {
        return;
      }
    }
    try {
      const file = await syncAttendance(filteredAttendance);
      setDriveSyncMsg(`Saved ${file.name} to Google Drive!`);
      setTimeout(() => setDriveSyncMsg(null), 4000);
    } catch (err: any) {
      setDriveSyncMsg(`Sync error: ${err.message}`);
      setTimeout(() => setDriveSyncMsg(null), 4000);
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualUserId) {
      setManualFeedback('Please select a user to check in.');
      return;
    }

    const res = await dataService.markAttendance(
      manualUserId,
      1.0,
      'manual',
      currentProfile,
      true // allow override
    );

    if (res.success) {
      setManualFeedback(res.message);
      onRefreshAttendance();
      setTimeout(() => {
        setShowManualModal(false);
        setManualFeedback(null);
        setManualUserId('');
      }, 1200);
    } else {
      setManualFeedback(res.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <ClipboardCheck className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              <span>Attendance Verification Logs</span>
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Real-time audit records, confidence scores, verification methods, and check-in times
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {/* View Mode Toggle: Timeline vs Table */}
            <div className="flex items-center space-x-1 border rounded-xl p-1" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
              <button
                id="btn-attendance-mode-timeline"
                onClick={() => setActiveMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  activeMode === 'timeline' ? 'shadow-md text-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: activeMode === 'timeline' ? 'var(--accent)' : 'transparent',
                  color: activeMode === 'timeline' ? '#090608' : 'var(--text)',
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline Stream</span>
              </button>

              <button
                id="btn-attendance-mode-table"
                onClick={() => setActiveMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  activeMode === 'table' ? 'shadow-md text-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: activeMode === 'table' ? 'var(--accent)' : 'transparent',
                  color: activeMode === 'table' ? '#090608' : 'var(--text)',
                }}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Tabular Logs</span>
              </button>
            </div>

            {/* Daily Shift & Attendance Report */}
            {onOpenDailyReport && (
              <button
                id="btn-open-daily-report"
                onClick={onOpenDailyReport}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 hover:opacity-80 transition-colors"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                title="View shift analytics and printable daily summary report"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Daily Report</span>
              </button>
            )}

            {/* Manual Check-in Button (Staff / Admin) */}
            {isStaff && (
              <button
                id="btn-open-manual-attendance"
                onClick={() => setShowManualModal(true)}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 hover:opacity-80 transition-colors"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)' }}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>
            )}

            {/* Export CSV (Admin only) */}
            {isAdmin && (
              <button
                id="btn-export-attendance-csv"
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 hover:opacity-80 transition-colors"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            {/* Sync to Google Drive */}
            <button
              id="btn-sync-attendance-drive"
              onClick={handleDriveSync}
              disabled={isDriveSyncing}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 hover:bg-emerald-500/10 transition-colors"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              title="Sync current attendance to Google Drive"
            >
              <HardDrive className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isDriveSyncing ? 'Syncing...' : isDriveConnected ? 'Sync Drive' : 'Drive'}</span>
            </button>
          </div>
        </div>

        {driveSyncMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{driveSyncMsg}</span>
          </div>
        )}

        {/* Filter Controls Bar (Visible in Table View) */}
        {activeMode === 'table' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-dim)' }} />
              <input
                id="input-attendance-search"
                type="text"
                placeholder="Search user or roll..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border bg-transparent text-xs"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
              />
            </div>

            {/* Date Picker & All Dates Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={selectedDate}
                disabled={filterAllDates}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 rounded-xl border bg-transparent text-xs disabled:opacity-40"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
              />
              <button
                onClick={() => {
                  setFilterAllDates(!filterAllDates);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 rounded-xl border text-xs whitespace-nowrap mono hover:opacity-80"
                style={{
                  borderColor: 'var(--line)',
                  background: filterAllDates ? 'var(--accent-soft)' : 'transparent',
                  color: filterAllDates ? 'var(--accent)' : 'var(--text-dim)',
                }}
                title="Toggle view of all dates or just selected date"
              >
                All Dates
              </button>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 rounded-xl border bg-transparent text-xs"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Records Summary Pill */}
            <div className="flex items-center justify-end px-3 text-xs mono" style={{ color: 'var(--text-dim)' }}>
              <span>{filteredAttendance.length} records matching</span>
            </div>
          </div>
        )}
      </div>

      {/* Main View Area: Interactive Timeline Stream vs Tabular Logs */}
      {activeMode === 'timeline' ? (
        <AttendanceTimeline
          attendanceRecords={attendanceRecords}
          enrolledUsers={enrolledUsers}
          onRefresh={onRefreshAttendance}
          onSelectUser={onSelectUser}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          filterAllDates={filterAllDates}
          onToggleFilterAllDates={setFilterAllDates}
        />
      ) : (
        <>
          {/* Attendance Table */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b uppercase mono text-[11px]" style={{ borderColor: 'var(--line)', color: 'var(--text-dim)', background: 'var(--bg)' }}>
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Confidence Score</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                  {paginatedAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs" style={{ color: 'var(--text-dim)' }}>
                        No attendance records found for this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendance.map((record) => {
                      const userObj = enrolledUsers.find(u => u.id === record.user_id);
                      return (
                        <tr key={record.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--accent)' }}>
                              {record.user_photo ? (
                                <img src={record.user_photo} alt={record.user_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span 
                                onClick={() => userObj && onSelectUser(userObj)}
                                className="font-semibold block hover:underline cursor-pointer" 
                                style={{ color: 'var(--text)' }}
                              >
                                {record.user_name || 'Unknown User'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 mono font-medium" style={{ color: 'var(--accent)' }}>
                            {record.user_roll || '—'}
                          </td>
                          <td className="py-3 px-4">{record.department || 'General'}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium block">{record.attendance_date}</span>
                            <span className="text-[11px] mono" style={{ color: 'var(--text-dim)' }}>
                              {new Date(record.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-3 px-4 mono font-bold" style={{ color: 'var(--accent)' }}>
                            {(record.confidence_score * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] mono uppercase ${
                              record.method === 'face' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {record.method === 'face' ? 'Biometric Face' : 'Manual Entry'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] mono" style={{ color: 'var(--text-dim)' }}>
                            {record.verified_by_name || 'Face Auto-Match'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-xl border text-xs" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <span style={{ color: 'var(--text-dim)' }}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAttendance.length)} of {filteredAttendance.length} logs
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="mono font-bold px-2">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Manual Check-in Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4 animate-in fade-in zoom-in-95" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <h3 className="font-bold text-base flex items-center space-x-2">
              <UserCheck className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <span>Manual Staff Attendance Entry</span>
            </h3>

            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Log attendance for a registered user manually or override previous entries with staff audit logging.
            </p>

            {manualFeedback && (
              <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-500">
                {manualFeedback}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">Select Enrolled User</label>
              <select
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                className="w-full p-2.5 rounded-lg border bg-transparent text-xs"
                style={{ borderColor: 'var(--line)' }}
              >
                <option value="">-- Choose User --</option>
                {enrolledUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.roll_number || 'No Roll'}) &bull; {u.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-lg text-xs border"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleManualCheckIn}
                className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ background: 'var(--accent)', color: '#0a0e13' }}
              >
                Confirm Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
