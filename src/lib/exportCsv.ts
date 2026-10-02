import { EnrolledUser, AttendanceRecord } from '../types';

/**
 * Exports enrolled users to CSV
 */
export function exportUsersToCsv(users: EnrolledUser[]): void {
  const headers = [
    'ID',
    'Full Name',
    'Roll Number',
    'Email',
    'Phone',
    'Department',
    'Role',
    'Status',
    'Consent Date',
    'Enrolled Date',
  ];

  const rows = users.map(u => [
    `"${u.id}"`,
    `"${u.full_name}"`,
    `"${u.roll_number || ''}"`,
    `"${u.email || ''}"`,
    `"${u.phone || ''}"`,
    `"${u.department || ''}"`,
    `"${u.user_role}"`,
    `"${u.is_active ? 'Active' : 'Inactive'}"`,
    `"${u.consent_at}"`,
    `"${u.created_at}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `biometric_enrolled_users_${getTimestampString()}.csv`, 'text/csv');
}

/**
 * Exports attendance records to CSV
 */
export function exportAttendanceToCsv(attendance: AttendanceRecord[]): void {
  const headers = [
    'Attendance ID',
    'User ID',
    'Full Name',
    'Roll Number',
    'Department',
    'Date',
    'Check-in Time',
    'Check-out Time',
    'Confidence Score',
    'Method',
    'Verified By',
  ];

  const rows = attendance.map(a => [
    `"${a.id}"`,
    `"${a.user_id}"`,
    `"${a.user_name || ''}"`,
    `"${a.user_roll || ''}"`,
    `"${a.department || ''}"`,
    `"${a.attendance_date}"`,
    `"${a.check_in_at}"`,
    `"${a.check_out_at || ''}"`,
    `"${(a.confidence_score * 100).toFixed(1)}%"`,
    `"${a.method}"`,
    `"${a.verified_by_name || a.verified_by || 'Auto-Verified'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `biometric_attendance_${getTimestampString()}.csv`, 'text/csv');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTimestampString(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
}
