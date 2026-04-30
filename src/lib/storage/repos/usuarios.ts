// ============================================================================
// REPOS: usuarios — User/auth local profile (localStorage)
// ============================================================================
// Uses the same localStorage keys as local-access.ts:
//   `pigec_local_specialist_profile` — specialist profile JSON
//   `pigec_local_access_granted`     — 'true' | absent
// ============================================================================

import type { LocalSpecialistProfile } from '../types';
import {
  readSingleFromLocalStorage,
  writeSingleToLocalStorage,
  removeFromLocalStorage,
} from '../db';

const PROFILE_KEY = 'pigec_local_specialist_profile';
const ACCESS_KEY = 'pigec_local_access_granted';

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Get the locally-stored specialist profile, or `null` if none exists.
 * Mirrors `getLocalSpecialistProfile()` from local-access.ts.
 */
export function getLocalProfile(): LocalSpecialistProfile | null {
  const profile = readSingleFromLocalStorage<LocalSpecialistProfile>(PROFILE_KEY);
  if (!profile?.fullName || !profile?.email) return null;
  return profile;
}

/**
 * Check whether the user has been granted local access.
 */
export function hasAccess(): boolean {
  if (!getLocalProfile()) return false;
  return readSingleFromLocalStorage<string>(ACCESS_KEY) === 'true';
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Save (upsert) the local specialist profile and grant access.
 */
export function saveLocalProfile(
  profile: LocalSpecialistProfile,
): void {
  writeSingleToLocalStorage(PROFILE_KEY, profile);
  writeSingleToLocalStorage(ACCESS_KEY, 'true');
}

// ─── Delete ─────────────────────────────────────────────────────────────────

/**
 * Clear the local profile and revoke access.
 */
export function clearLocalProfile(): void {
  removeFromLocalStorage(PROFILE_KEY);
  removeFromLocalStorage(ACCESS_KEY);
}
