import React, { useState } from 'react';
import { AttendanceRecord, EnrolledUser } from '../types';
import { 
  X, 
  Clock, 
  User, 
  Calendar, 
  Save, 
  Trash2, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { verifyMasterPassword, MASTER_SECURITY_PASSWORD } from '../lib/security';
import { dataService } from '../lib/supabase';

interface EditTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onRecordUpdated: () => void;
  enrolledUsers: EnrolledUser[];
}

export const EditTimelineModal: React.FC<EditTimelineModalProps> = ({
  isOpen,
  onClose,
  record,
  onRecordUpdated,
  enrolledUsers,
}) => {
  if (!isOpen || !record) return null;

  const isNewRecord = !record.id;
  const [selectedUserId, setSelectedUserId] = useState(record.user_id || enrolledUsers[0]?.id || '');

  // Form states
  const [punchType, setPunchType] = useState<'in' | 'out'>(record.punch_type || 'in');
  const [status, setStatus] = useState<'on-time' | 'late' | 'early' | 'flagged' | 'present'>(record.status || 'present');
  
  // Format check_in_at to HH:mm for time input
  const checkInDate = record.check_in_at ? new Date(record.check_in_at) : new Date();
  const initialTimeStr = `${String(checkInDate.getHours()).padStart(2, '0')}:${String(checkInDate.getMinutes()).padStart(2, '0')}`;
  const [timeStr, setTimeStr] = useState(initialTimeStr);
  const [attendanceDate, setAttendanceDate] = useState(record.attendance_date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(record.notes || '');
  const [shiftName, setShiftName] = useState(record.shift_name || 'General Shift (09:00 - 17:00)');

  // Security passkey state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strictly enforce password requirement: only the one who has master passkey can edit timeline
    if (!verifyMasterPassword(password)) {
      setError(`Access Denied: Master Passkey is required to authorize timeline modifications.`);
      return;
    }

    setLoading(true);
    try {
      // Calculate updated ISO timestamp
      const [hours, minutes] = timeStr.split(':').map(Number);
      const updatedDate = new Date(attendanceDate);
      updatedDate.setHours(hours || 0, minutes || 0, 0, 0);

      if (isNewRecord) {
        const chosenUser = enrolledUsers.find(u => u.id === selectedUserId);
        const newRecordItem: AttendanceRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          user_id: selectedUserId,
          user_name: chosenUser?.full_name || 'Attendee',
          user_roll: chosenUser?.roll_number,
          user_photo: chosenUser?.photo_url,
          department: chosenUser?.department,
          attendance_date: attendanceDate,
          check_in_at: updatedDate.toISOString(),
          check_out_at: punchType === 'out' ? updatedDate.toISOString() : null,
          confidence_score: 1.0,
          method: 'manual',
          verified_by: null,
          verified_by_name: `Timeline Manual (Authorized)`,
          created_at: new Date().toISOString(),
          punch_type: punchType,
          status: status,
          notes: notes,
          shift_name: shiftName,
        };

        const allRecords = await dataService.getAttendance();
        localStorage.setItem('bio_attendance_records', JSON.stringify([newRecordItem, ...allRecords]));
        await dataService.logAudit({
          actor_id: null,
          actor_name: 'Repository Security Admin',
          action: 'ATTENDANCE_TIMELINE_ADDED',
          entity_type: 'ATTENDANCE',
          entity_id: newRecordItem.id,
          metadata: {
            userName: newRecordItem.user_name,
            verifiedWithKey: 'Authorized Master Passkey',
          }
        });
      } else {
        const updates: Partial<AttendanceRecord> = {
          punch_type: punchType,
          status: status,
          attendance_date: attendanceDate,
          check_in_at: updatedDate.toISOString(),
          notes: notes,
          shift_name: shiftName,
          verified_by_name: `Timeline Edit (Authorized Admin)`,
        };

        await dataService.updateAttendanceRecord(record.id, updates);
      }

      onRecordUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update timeline record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    if (!verifyMasterPassword(password)) {
      setError(`Access Denied: Master Passkey is required to delete timeline records.`);
      return;
    }

    setLoading(true);
    try {
      await dataService.deleteAttendanceRecord(record.id);
      onRecordUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--panel)', borderColor: 'var(--accent-line)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center space-x-2">
                <span>{isNewRecord ? 'Add New Timeline Punch' : 'Edit Attendance Timeline Punch'}</span>
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {isNewRecord 
                  ? 'Authorized administrator punch creation (Master Passkey Required)' 
                  : <>Target Attendee: <strong>{record.user_name || record.user_id}</strong></>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg border hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--line)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice: Master Passkey required */}
        <div className="p-3 rounded-xl border text-xs flex items-start space-x-2.5 bg-amber-500/10 border-amber-500/30 text-amber-300">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Restricted Timeline Action:</strong> Only authorized administrators with the Master Passkey can add, modify, or remove timestamps on the attendance timeline.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Attendee Selector for New Punch */}
          {isNewRecord && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                Select Enrolled Subject / Attendee
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
              >
                {enrolledUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.roll_number || 'No Roll'}) &bull; {u.department || 'Enrolled'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Punch Type */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                Punch Direction
              </label>
              <select
                value={punchType}
                onChange={(e) => setPunchType(e.target.value as 'in' | 'out')}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
              >
                <option value="in">Punch IN (Arrival / Check-in)</option>
                <option value="out">Punch OUT (Departure / Check-out)</option>
              </select>
            </div>

            {/* Attendance Status */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                Status Categorization
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
              >
                <option value="on-time">On-Time (Punctual)</option>
                <option value="late">Late Arrival</option>
                <option value="early">Early Departure</option>
                <option value="present">Present (Standard)</option>
                <option value="flagged">Flagged / Under Review</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                Attendance Date
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none mono"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
                Punch Timestamp (Time)
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none mono"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {/* Shift Details */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
              Assigned Shift
            </label>
            <input
              type="text"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              placeholder="e.g. General Shift (09:00 - 17:00), Night Shift"
              className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
            />
          </div>

          {/* Timeline Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>
              Administrative Notes &amp; Adjustment Reason
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Adjusted arrival time due to transportation delay approved by coordinator"
              className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
            />
          </div>

          {/* Mandatory Password Verification */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold flex items-center space-x-1.5" style={{ color: 'var(--accent)' }}>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Enter Password to Authorize Timeline Edit</span>
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
            <div className="p-2.5 rounded-lg border text-xs flex items-center space-x-2 bg-red-500/10 border-red-500/30 text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 gap-3">
            {!isNewRecord ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                  isDeleting
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-500'
                    : 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                }`}
                title="Delete this timeline entry permanently (requires Master Passkey)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Confirm Delete Punch' : 'Delete'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl border text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!password || loading}
                className="py-2 px-4 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md hover:opacity-90 transition-all text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isNewRecord ? 'Create Timeline Punch' : 'Save Timeline Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
