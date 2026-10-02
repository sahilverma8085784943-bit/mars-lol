/**
 * Biometric Security & Master Password System
 * Master Administrator Passkey: "mars"
 * (Also accepts legacy passkey "sahil" for backwards compatibility)
 */

import { EnrolledUser } from '../types';

export const MASTER_SECURITY_PASSWORD = 'mars';
export const REPOSITORY_SECURITY_PASSWORD = 'mars';

// Local storage key for global repository lockdown
export const STORAGE_REPOSITORY_LOCK_KEY = 'bio_repository_lockdown_v2';

/**
 * Verify if the input password matches the Master Passkey ("mars")
 */
export function verifyMasterPassword(password: string): boolean {
  if (!password) return false;
  const p = password.trim().toLowerCase();
  return p === 'mars' || p === 'sahil';
}

/**
 * Verify if the input password matches the Repository Security Passkey ("mars")
 */
export function verifyRepositoryPassword(password: string): boolean {
  return verifyMasterPassword(password);
}

/**
 * Check if the entire repository is globally locked
 */
export function isRepositoryGloballyLocked(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_REPOSITORY_LOCK_KEY);
    // If not set yet, default to true as requested ("lock all the repositry")
    if (val === null) {
      localStorage.setItem(STORAGE_REPOSITORY_LOCK_KEY, 'true');
      return true;
    }
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Set global repository lockdown state
 */
export function setRepositoryGloballyLocked(locked: boolean): void {
  try {
    localStorage.setItem(STORAGE_REPOSITORY_LOCK_KEY, locked ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set repository lock flag:', err);
  }
}

/**
 * Check if a user's biometric profile is currently locked
 */
export function isProfileLocked(user: EnrolledUser | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.is_locked);
}

/**
 * Generate a security lock state for a user profile
 */
export function createLockState(
  lock: boolean,
  reason = 'Repository Security Lockdown',
  actor = 'Repository Security Admin'
) {
  if (lock) {
    return {
      is_locked: true,
      locked_reason: reason,
      locked_at: new Date().toISOString(),
      locked_by: actor,
    };
  } else {
    return {
      is_locked: false,
      locked_reason: null,
      locked_at: null,
      locked_by: null,
    };
  }
}
