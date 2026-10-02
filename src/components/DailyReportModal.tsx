import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Building2, 
  Calendar,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { AttendanceRecord, EnrolledUser } from '../types';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecords: AttendanceRecord[];
  enrolledUsers: EnrolledUser[];
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  attendanceRecords,
  enrolledUsers,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  if (!isOpen) return null;

  // Filter records for selected date
  const dateRecords = attendanceRecords.filter((r) => r.attendance_date === selectedDate);

  // Present user IDs
  const presentUserIds = new Set(dateRecords.map((r) => r.user_id));

  // Enrolled users for this department
  const filteredUsers = departmentFilter === 'all'
    ? enrolledUsers
    : enrolledUsers.filter((u) => u.department === departmentFilter);

  // Department list
  const departments = Array.from(
    new Set(enrolledUsers.map((u) => u.department).filter(Boolean))
  ) as string[];

  // Metrics calculation
  const totalEnrolled = filteredUsers.length;
  const presentCount = filteredUsers.filter((u) => presentUserIds.has(u.id)).length;
  const absentCount = Math.max(0, totalEnrolled - presentCount);
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  // Late calculation (e.g. check-in after 09:15 AM)
  const lateRecords = dateRecords.filter((r) => {
    const time = new Date(r.check_in_at);
    const hour = time.getHours();
    const min = time.getMinutes();
    return hour > 9 || (hour === 9 && min > 15);
  });
  const lateCount = lateRecords.length;
  const onTimeCount = Math.max(0, presentCount - lateCount);

  const lockedUsersCount = filteredUsers.filter((u) => u.is_locked).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Modal Controls (Hidden when printing) */}
        <div
          className="p-5 border-b flex flex-wrap items-center justify-between gap-4 print:hidden"
          style={{ borderColor: 'var(--line)' }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold">Daily Biometric Attendance Ledger &amp; Report</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Official attendance register sheet for auditing, management, and records
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border focus:outline-none mono"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
            />

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border focus:outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--line)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Body */}
        <div id="printable-attendance-sheet" className="p-8 space-y-6 print:p-0 print:space-y-4">
          
          {/* Institutional Header */}
          <div className="border-b pb-4 flex items-start justify-between" style={{ borderColor: 'var(--line)' }}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                <span className="text-xl font-bold tracking-tight uppercase">
                  Biometric Attendance Management System
                </span>
              </div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                Official Automated Facial Recognition Daily Roll Ledger
              </p>
            </div>

            <div className="text-right text-xs mono">
              <div className="font-bold">Date: {selectedDate}</div>
              <div style={{ color: 'var(--text-dim)' }}>
                Shift: 09:00 - 17:00 (Grace: 15m)
              </div>
              <div style={{ color: 'var(--text-dim)' }}>
                Security: Repository Lockdown (Enforced)
              </div>
            </div>
          </div>

          {/* Key Executive Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl border text-center" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
              <span className="text-[11px] block mono uppercase" style={{ color: 'var(--text-dim)' }}>Total Roster</span>
              <span className="text-xl font-bold">{totalEnrolled}</span>
            </div>

            <div className="p-3 rounded-xl border text-center bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <span className="text-[11px] block mono uppercase">Present Today</span>
              <span className="text-xl font-bold">{presentCount}</span>
            </div>

            <div className="p-3 rounded-xl border text-center bg-blue-500/10 border-blue-500/30 text-blue-400">
              <span className="text-[11px] block mono uppercase">On-Time</span>
              <span className="text-xl font-bold">{onTimeCount}</span>
            </div>

            <div className="p-3 rounded-xl border text-center bg-amber-500/10 border-amber-500/30 text-amber-400">
              <span className="text-[11px] block mono uppercase">Late Punches</span>
              <span className="text-xl font-bold">{lateCount}</span>
            </div>

            <div className="p-3 rounded-xl border text-center bg-rose-500/10 border-rose-500/30 text-rose-400">
              <span className="text-[11px] block mono uppercase">Absent Rate</span>
              <span className="text-xl font-bold">{100 - attendanceRate}%</span>
            </div>
          </div>

          {/* Roster & Punch Table */}
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                  <th className="p-3 mono font-semibold">#</th>
                  <th className="p-3 font-semibold">Full Name / ID</th>
                  <th className="p-3 font-semibold">Roll Number</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Check-In Time</th>
                  <th className="p-3 font-semibold">Confidence</th>
                  <th className="p-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {filteredUsers.map((user, idx) => {
                  const record = dateRecords.find((r) => r.user_id === user.id);
                  const isPresent = Boolean(record);
                  const isLocked = Boolean(user.is_locked);

                  let statusText = 'ABSENT';
                  let statusClass = 'text-rose-400 font-semibold';

                  if (isLocked) {
                    statusText = 'LOCKED (HOLD)';
                    statusClass = 'text-amber-400 font-bold';
                  } else if (isPresent && record) {
                    const checkInTime = new Date(record.check_in_at);
                    const hour = checkInTime.getHours();
                    const min = checkInTime.getMinutes();
                    const isLate = hour > 9 || (hour === 9 && min > 15);

                    if (isLate) {
                      statusText = `LATE (${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                      statusClass = 'text-amber-400 font-bold';
                    } else {
                      statusText = 'ON-TIME';
                      statusClass = 'text-emerald-400 font-bold';
                    }
                  }

                  return (
                    <tr
                      key={user.id}
                      className={isLocked ? 'bg-amber-500/[0.04]' : undefined}
                    >
                      <td className="p-3 mono text-dim">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="p-3">
                        <div className="font-semibold flex items-center space-x-1.5">
                          {isLocked && <Lock className="w-3 h-3 text-amber-400 inline" />}
                          <span>{user.full_name}</span>
                        </div>
                        <div className="text-[10px] mono" style={{ color: 'var(--text-dim)' }}>
                          {user.email || user.id}
                        </div>
                      </td>
                      <td className="p-3 mono">{user.roll_number || 'N/A'}</td>
                      <td className="p-3">{user.department || 'General'}</td>
                      <td className="p-3 mono">
                        {record ? (
                          new Date(record.check_in_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        ) : (
                          <span className="opacity-40">-</span>
                        )}
                      </td>
                      <td className="p-3 mono">
                        {record ? (
                          `${(record.confidence_score * 100).toFixed(1)}%`
                        ) : (
                          <span className="opacity-40">-</span>
                        )}
                      </td>
                      <td className={`p-3 text-right ${statusClass}`}>
                        {statusText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Institutional Sign-off Block (Visible on print & PDF) */}
          <div className="pt-8 border-t grid grid-cols-3 gap-6 text-center text-xs" style={{ borderColor: 'var(--line)' }}>
            <div className="space-y-8">
              <div className="h-10 border-b border-dashed" style={{ borderColor: 'var(--line)' }} />
              <div className="font-bold">Prepared by (Security Operator)</div>
            </div>

            <div className="space-y-8">
              <div className="h-10 border-b border-dashed" style={{ borderColor: 'var(--line)' }} />
              <div className="font-bold">Verified by (Shift Supervisor)</div>
            </div>

            <div className="space-y-8">
              <div className="h-10 border-b border-dashed" style={{ borderColor: 'var(--line)' }} />
              <div className="font-bold">Approved by (Repository Security Admin)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
