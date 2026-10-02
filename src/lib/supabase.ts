import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnrolledUser, AttendanceRecord, AuditLog, Profile } from '../types';
import { INITIAL_ENROLLED_USERS, INITIAL_ATTENDANCE, INITIAL_AUDIT_LOGS } from './initialData';
import { isRepositoryGloballyLocked, setRepositoryGloballyLocked, MASTER_SECURITY_PASSWORD } from './security';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Keys for Demo/Fallback Mode
const STORAGE_USERS_KEY = 'bio_attendance_users_v2';
const STORAGE_ATTENDANCE_KEY = 'bio_attendance_logs_v2';
const STORAGE_AUDIT_KEY = 'bio_attendance_audit_v2';

/**
 * Data Service API - Transparently switches between Supabase and Local Storage Demo Store
 */
export const dataService = {
  /**
   * Fetch all enrolled users
   */
  async getUsers(): Promise<EnrolledUser[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as EnrolledUser[];
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local store:', err);
      }
    }

    // Local Storage fallback
    const isRepoLocked = isRepositoryGloballyLocked();
    const stored = localStorage.getItem(STORAGE_USERS_KEY);
    let usersList: EnrolledUser[] = INITIAL_ENROLLED_USERS;
    if (stored) {
      try {
        usersList = JSON.parse(stored);
      } catch {
        usersList = INITIAL_ENROLLED_USERS;
      }
    }

    // Sanitize any legacy stored reason/by string that leaked password
    usersList = usersList.map(u => ({
      ...u,
      locked_reason: u.locked_reason ? u.locked_reason.replace(/\s*\(Password:\s*mars\)/gi, '').replace(/\s*\(-?\s*mars\)/gi, '') : null,
      locked_by: u.locked_by ? u.locked_by.replace(/\s*\(Password:\s*mars\)/gi, '').replace(/\s*\(-?\s*mars\)/gi, '') : null,
    }));

    // When repository is globally locked, ensure all enrolled profiles have is_locked = true
    if (isRepoLocked) {
      let changed = false;
      usersList = usersList.map(u => {
        if (!u.is_locked) {
          changed = true;
          return {
            ...u,
            is_locked: true,
            locked_reason: u.locked_reason || 'Repository Security Lockdown',
            locked_at: u.locked_at || new Date().toISOString(),
            locked_by: u.locked_by || 'Repository Security Admin',
          };
        }
        return u;
      });
      if (changed || !stored) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usersList));
      }
    } else if (!stored) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usersList));
    }
    return usersList;
  },

  /**
   * Get single user by ID
   */
  async getUserById(id: string): Promise<EnrolledUser | null> {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  /**
   * Enroll a new user with face descriptor
   */
  async enrollUser(
    userData: Omit<EnrolledUser, 'id' | 'created_at' | 'updated_at'>,
    actorProfile?: Profile | null
  ): Promise<EnrolledUser> {
    const newUser: EnrolledUser = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();
        if (error) throw error;
        
        await this.logAudit({
          actor_id: actorProfile?.id || null,
          actor_name: actorProfile?.full_name || 'Admin',
          action: 'USER_ENROLLED',
          entity_type: 'USER',
          entity_id: data.id,
          metadata: {
            name: data.full_name,
            roll_number: data.roll_number,
            department: data.department,
          }
        });

        return data as EnrolledUser;
      } catch (err) {
        console.warn('Supabase insert failed, saving locally:', err);
      }
    }

    // Local storage persistence
    const users = await this.getUsers();
    const updated = [newUser, ...users];
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorProfile?.full_name || 'Admin',
      action: 'USER_ENROLLED',
      entity_type: 'USER',
      entity_id: newUser.id,
      metadata: {
        name: newUser.full_name,
        roll_number: newUser.roll_number,
        department: newUser.department,
      }
    });

    return newUser;
  },

  /**
   * Update enrolled user details
   */
  async updateUser(
    id: string,
    updates: Partial<EnrolledUser>,
    actorProfile?: Profile | null
  ): Promise<EnrolledUser> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;

        await this.logAudit({
          actor_id: actorProfile?.id || null,
          actor_name: actorProfile?.full_name || 'Admin',
          action: 'USER_UPDATED',
          entity_type: 'USER',
          entity_id: id,
          metadata: updates
        });

        return data as EnrolledUser;
      } catch (err) {
        console.warn('Supabase update failed, updating locally:', err);
      }
    }

    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    const updatedUser: EnrolledUser = {
      ...users[index],
      ...updates,
      updated_at: now
    };
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorProfile?.full_name || 'Admin',
      action: 'USER_UPDATED',
      entity_type: 'USER',
      entity_id: id,
      metadata: updates
    });

    return updatedUser;
  },

  /**
   * Delete an enrolled user completely
   */
  async deleteUser(id: string, actorProfile?: Profile | null): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        await this.logAudit({
          actor_id: actorProfile?.id || null,
          actor_name: actorProfile?.full_name || 'Admin',
          action: 'USER_DELETED',
          entity_type: 'USER',
          entity_id: id,
          metadata: { userId: id }
        });
        return true;
      } catch (err) {
        console.warn('Supabase delete failed, deleting locally:', err);
      }
    }

    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(filtered));

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorProfile?.full_name || 'Admin',
      action: 'USER_DELETED',
      entity_type: 'USER',
      entity_id: id,
      metadata: { userId: id }
    });

    return true;
  },

  /**
   * Delete biometric data only (keeps user record but clears vector and photo)
   */
  async deleteBiometricData(id: string, actorProfile?: Profile | null): Promise<EnrolledUser> {
    return this.updateUser(
      id,
      {
        face_descriptor: [],
        photo_url: null,
        is_active: false,
        notes: 'Biometric descriptor deleted by Admin request.'
      },
      actorProfile
    );
  },

  /**
   * Fetch attendance records
   */
  async getAttendance(dateFilter?: string): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('attendance')
          .select('*, users(full_name, roll_number, photo_url, department)')
          .order('check_in_at', { ascending: false });

        if (dateFilter) {
          query = query.eq('attendance_date', dateFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((item: any) => ({
          ...item,
          user_name: item.users?.full_name,
          user_roll: item.users?.roll_number,
          user_photo: item.users?.photo_url,
          department: item.users?.department,
        })) as AttendanceRecord[];
      } catch (err) {
        console.warn('Supabase attendance fetch failed, falling back to local store:', err);
      }
    }

    // Local storage fallback
    const stored = localStorage.getItem(STORAGE_ATTENDANCE_KEY);
    let records: AttendanceRecord[] = INITIAL_ATTENDANCE;
    if (stored) {
      try {
        records = JSON.parse(stored);
      } catch {
        records = INITIAL_ATTENDANCE;
      }
    } else {
      localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
    }

    if (dateFilter) {
      return records.filter(r => r.attendance_date === dateFilter);
    }
    return records;
  },

  /**
   * Record a check-in
   */
  async markAttendance(
    userId: string,
    confidenceScore: number,
    method: 'face' | 'manual' = 'face',
    actorProfile?: Profile | null,
    allowOverride = false,
    punchType: 'in' | 'out' = 'in'
  ): Promise<{ success: boolean; record?: AttendanceRecord; message: string }> {
    const today = new Date().toISOString().split('T')[0];
    const user = await this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found in registry.' };
    }

    // Security Profile Lock Enforcement
    if (user.is_locked) {
      await this.logAudit({
        actor_id: actorProfile?.id || null,
        actor_name: actorProfile?.full_name || 'System Biometric Kiosk',
        action: 'ATTENDANCE_BLOCKED_LOCKED_PROFILE',
        entity_type: 'USER',
        entity_id: user.id,
        metadata: {
          userName: user.full_name,
          reason: user.locked_reason ? user.locked_reason.replace(/\s*\(Password:\s*mars\)/gi, '') : 'Repository Security Lockdown',
          requiredPasskey: 'Master Passkey',
        },
      });

      return {
        success: false,
        message: `SECURITY HOLD: Profile for "${user.full_name}" is LOCKED (${user.locked_reason ? user.locked_reason.replace(/\s*\(Password:\s*mars\)/gi, '') : 'Repository Security Lockdown'}). Attendance cannot be logged. Enter Master Passkey to unlock.`,
      };
    }

    const currentRecords = await this.getAttendance(today);
    const existing = currentRecords.find(r => r.user_id === userId);

    if (existing && !allowOverride && punchType === 'in') {
      return {
        success: false,
        record: existing,
        message: `${user.full_name} has already checked in today at ${new Date(existing.check_in_at).toLocaleTimeString()}. Admin override is required to log duplicate entries.`,
      };
    }

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 15);
    const calculatedStatus: 'on-time' | 'late' = isLate ? 'late' : 'on-time';

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      user_name: user.full_name,
      user_roll: user.roll_number,
      user_photo: user.photo_url,
      department: user.department,
      attendance_date: today,
      check_in_at: new Date().toISOString(),
      check_out_at: punchType === 'out' ? new Date().toISOString() : null,
      confidence_score: confidenceScore,
      method,
      verified_by: actorProfile?.id || null,
      verified_by_name: actorProfile?.full_name || (method === 'face' ? 'Auto-Face-Match' : 'Admin'),
      created_at: new Date().toISOString(),
      punch_type: punchType,
      status: calculatedStatus,
      shift_name: 'General Shift (09:00 - 17:00)',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert([
            {
              id: newRecord.id,
              user_id: userId,
              attendance_date: today,
              check_in_at: newRecord.check_in_at,
              confidence_score: confidenceScore,
              method,
              verified_by: actorProfile?.id || null,
            }
          ])
          .select()
          .single();
        if (error) throw error;
        
        await this.logAudit({
          actor_id: actorProfile?.id || null,
          actor_name: actorProfile?.full_name || 'System',
          action: 'ATTENDANCE_RECORDED',
          entity_type: 'ATTENDANCE',
          entity_id: data.id,
          metadata: {
            userName: user.full_name,
            roll: user.roll_number,
            confidence: confidenceScore,
            method,
            status: calculatedStatus,
          }
        });

        return {
          success: true,
          record: { ...newRecord, id: data.id },
          message: `Attendance marked successfully for ${user.full_name} (${(confidenceScore * 100).toFixed(1)}% match - ${calculatedStatus.toUpperCase()})`,
        };
      } catch (err) {
        console.warn('Supabase attendance insert failed, storing locally:', err);
      }
    }

    const allRecords = await this.getAttendance();
    const updated = [newRecord, ...allRecords];
    localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(updated));

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorProfile?.full_name || 'System',
      action: 'ATTENDANCE_RECORDED',
      entity_type: 'ATTENDANCE',
      entity_id: newRecord.id,
      metadata: {
        userName: user.full_name,
        roll: user.roll_number,
        confidence: confidenceScore,
        method,
        status: calculatedStatus,
      }
    });

    return {
      success: true,
      record: newRecord,
      message: `Attendance marked successfully for ${user.full_name} (${(confidenceScore * 100).toFixed(1)}% match - ${calculatedStatus.toUpperCase()})`,
    };
  },

  /**
   * Update an attendance record on the timeline
   */
  async updateAttendanceRecord(
    id: string,
    updates: Partial<AttendanceRecord>,
    actorProfile?: Profile | null,
    actorName = 'Repository Security Admin'
  ): Promise<AttendanceRecord | null> {
    const allRecords = await this.getAttendance();
    const index = allRecords.findIndex(r => r.id === id);
    if (index === -1) return null;

    const existing = allRecords[index];
    const updated: AttendanceRecord = {
      ...existing,
      ...updates,
    };

    allRecords[index] = updated;
    localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(allRecords));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('attendance')
          .update(updates)
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update failed:', err);
      }
    }

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorName,
      action: 'ATTENDANCE_TIMELINE_EDITED',
      entity_type: 'ATTENDANCE',
      entity_id: id,
      metadata: {
        userName: updated.user_name,
        changes: updates,
        verifiedWithKey: 'Authorized Master Passkey',
      }
    });

    return updated;
  },

  /**
   * Delete an attendance record from the timeline
   */
  async deleteAttendanceRecord(
    id: string,
    actorProfile?: Profile | null,
    actorName = 'Repository Security Admin'
  ): Promise<boolean> {
    const allRecords = await this.getAttendance();
    const existing = allRecords.find(r => r.id === id);
    const filtered = allRecords.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(filtered));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('attendance')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorName,
      action: 'ATTENDANCE_TIMELINE_DELETED',
      entity_type: 'ATTENDANCE',
      entity_id: id,
      metadata: {
        deletedUser: existing?.user_name,
        date: existing?.attendance_date,
        verifiedWithKey: 'Authorized Master Passkey',
      }
    });

    return true;
  },

  /**
   * Check if the entire repository is currently locked
   */
  isRepositoryLocked(): boolean {
    return isRepositoryGloballyLocked();
  },

  /**
   * Set entire repository lock state (locks/unlocks all profiles & repository)
   */
  async setRepositoryLock(
    isLocked: boolean,
    reason = isLocked ? 'Repository Security Lockdown' : 'Repository Lockdown Released',
    actorProfile?: Profile | null
  ): Promise<EnrolledUser[]> {
    setRepositoryGloballyLocked(isLocked);
    return this.lockAllUsers(isLocked, reason, actorProfile);
  },

  /**
   * Toggle Security Profile Lock Condition
   */
  async toggleUserLock(
    id: string,
    isLocked: boolean,
    reason = 'Repository Administrative Lock',
    actorProfile?: Profile | null
  ): Promise<EnrolledUser> {
    const lockUpdate: Partial<EnrolledUser> = isLocked
      ? {
          is_locked: true,
          locked_reason: reason,
          locked_at: new Date().toISOString(),
          locked_by: actorProfile?.full_name || 'Repository Security Admin',
        }
      : {
          is_locked: false,
          locked_reason: null,
          locked_at: null,
          locked_by: null,
        };

    const updated = await this.updateUser(id, lockUpdate, actorProfile);

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorProfile?.full_name || 'Repository Security Admin',
      action: isLocked ? 'PROFILE_LOCKED' : 'PROFILE_UNLOCKED',
      entity_type: 'USER',
      entity_id: id,
      metadata: {
        userName: updated.full_name,
        isLocked,
        reason,
        verifiedWithMasterKey: 'Authorized Master Passkey',
      },
    });

    return updated;
  },

  /**
   * Emergency Bulk Lockdown or Unlock of All Profiles in the Repository
   */
  async lockAllUsers(
    isLocked: boolean,
    reason = 'Repository Security Lockdown',
    actorProfile?: Profile | null
  ): Promise<EnrolledUser[]> {
    setRepositoryGloballyLocked(isLocked);
    const users = await this.getUsers();
    const updatedUsers: EnrolledUser[] = [];

    for (const u of users) {
      const lockData: Partial<EnrolledUser> = isLocked
        ? {
            is_locked: true,
            locked_reason: reason,
            locked_at: new Date().toISOString(),
            locked_by: actorProfile?.full_name || 'Repository Security Admin',
          }
        : {
            is_locked: false,
            locked_reason: null,
            locked_at: null,
            locked_by: null,
          };
      const updated = await this.updateUser(u.id, lockData, actorProfile);
      updatedUsers.push(updated);
    }

    await this.logAudit({
      actor_id: actorProfile?.id || null,
      actor_name: actorProfile?.full_name || 'Repository Security Admin',
      action: isLocked ? 'REPOSITORY_LOCKDOWN_ALL' : 'REPOSITORY_RELEASE_LOCKDOWN_ALL',
      entity_type: 'SYSTEM',
      entity_id: null,
      metadata: {
        totalProfilesAffected: users.length,
        isLocked,
        reason,
        verifiedWithMasterKey: 'Authorized Master Passkey',
      },
    });

    return updatedUsers;
  },

  /**
   * Log audit action
   */
  async logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').insert([newLog]);
        return;
      } catch (err) {
        console.warn('Supabase audit log failed:', err);
      }
    }

    const stored = localStorage.getItem(STORAGE_AUDIT_KEY);
    let logs: AuditLog[] = INITIAL_AUDIT_LOGS;
    if (stored) {
      try {
        logs = JSON.parse(stored);
      } catch {
        logs = INITIAL_AUDIT_LOGS;
      }
    }
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify([newLog, ...logs]));
  },

  /**
   * Fetch audit logs
   */
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return data as AuditLog[];
      } catch (err) {
        console.warn('Supabase audit fetch failed, reading locally:', err);
      }
    }

    const stored = localStorage.getItem(STORAGE_AUDIT_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  /**
   * Reset local demo data back to original migration state
   */
  resetToOriginalMigration(): void {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_ENROLLED_USERS));
    localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
};
