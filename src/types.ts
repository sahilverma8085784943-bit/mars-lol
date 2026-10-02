/**
 * Types & Data Models for Biometric Face Recognition Attendance & Enrollment
 */

export type AppRole = 'admin' | 'staff' | 'viewer';
export type UserRole = 'student' | 'staff' | 'admin';
export type AttendanceMethod = 'face' | 'manual';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  avatar_url?: string | null;
  provider?: 'google' | 'email' | 'demo' | 'supabase';
  last_sign_in_at?: string;
  created_at: string;
}

export interface EnrolledUser {
  id: string;
  full_name: string;
  roll_number: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  user_role: UserRole;
  notes?: string | null;
  photo_url: string | null;
  face_descriptor: number[]; // 128-dimensional vector
  consent_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Security Profile Lock Condition (Master passkey protected)
  is_locked?: boolean;
  locked_reason?: string | null;
  locked_at?: string | null;
  locked_by?: string | null;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name?: string;
  user_roll?: string | null;
  user_photo?: string | null;
  department?: string | null;
  attendance_date: string; // YYYY-MM-DD
  check_in_at: string; // ISO string
  check_out_at: string | null;
  confidence_score: number; // 0.000 to 1.000
  method: AttendanceMethod;
  verified_by: string | null;
  verified_by_name?: string | null;
  created_at: string;
  // Shift & Attendance Management Enhancement
  punch_type?: 'in' | 'out';
  status?: 'on-time' | 'late' | 'early' | 'flagged' | 'present';
  shift_name?: string;
  notes?: string;
}

export interface ShiftConfig {
  name: string;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  lateGraceMinutes: number; // 15
  autoPunchDetection: boolean;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type ScannerStatus =
  | 'idle'
  | 'initializing'
  | 'camera_unavailable'
  | 'permission_denied'
  | 'searching'
  | 'no_face'
  | 'multiple_faces'
  | 'unknown_face'
  | 'low_confidence'
  | 'recognized';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  isPrimary?: boolean;
  label?: string;
}

export interface RecognitionResult {
  user: EnrolledUser | null;
  distance: number;
  confidence: number;
  faceBox?: FaceBoundingBox;
  backgroundFaceBoxes?: FaceBoundingBox[];
  status: 'recognized' | 'low_confidence' | 'unknown' | 'no_face' | 'multiple_faces';
  message: string;
  ignoredBackgroundCount?: number;
}

export interface ScannerSettings {
  confidenceThreshold: number; // default 0.48
  autoMarkAttendance: boolean; // default true
  soundEnabled: boolean;
  minFaceSizeRatio: number; // 0.15
  singleFaceIsolation: boolean; // default true: only scan one foreground face while ignoring background faces
}
