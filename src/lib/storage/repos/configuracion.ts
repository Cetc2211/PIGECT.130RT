// ============================================================================
// REPOS: configuración — App settings, groups, partials data (IDB + localStorage)
// ============================================================================
// Core use-data.tsx data stores:
//   IDB keys:   app_groups, app_settings, app_partialsData, app_specialNotes
//   IDB key:    activeGroupId_v1 (single string value)
// ============================================================================

import type {
  Group,
  AppSettings,
  AllPartialsData,
  SpecialNote,
} from '@/lib/placeholder-data';
import {
  readFromDb,
  writeToDb,
  removeFromDb,
} from '../db';

// ─── Settings ──────────────────────────────────────────────────────────────

/**
 * Get app settings from IndexedDB.  Returns a sensible default when
 * nothing has been stored yet.
 */
export async function getSettings(): Promise<AppSettings> {
  const envelope = await readFromDb<AppSettings>('app_settings');
  if (envelope?.value) return envelope.value;
  return {
    institutionName: 'Mi Institución',
    logo: '',
    theme: 'default',
    apiKey: '',
    signature: '',
    facilitatorName: '',
    scheduleImageUrl: '',
    teacherPhoto: '',
  };
}

/**
 * Save app settings to IndexedDB.
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await writeToDb('app_settings', settings);
}

// ─── Groups ─────────────────────────────────────────────────────────────────

/**
 * Get all groups from IndexedDB.
 */
export async function getGroups(): Promise<Group[]> {
  const envelope = await readFromDb<Group[]>('app_groups');
  return envelope?.value ?? [];
}

/**
 * Save (replace) all groups in IndexedDB.
 */
export async function saveGroups(groups: Group[]): Promise<void> {
  await writeToDb('app_groups', groups);
}

// ─── Partials Data ──────────────────────────────────────────────────────────

/**
 * Get the full partials data map from IndexedDB.
 */
export async function getPartialsData(): Promise<AllPartialsData> {
  const envelope = await readFromDb<AllPartialsData>('app_partialsData');
  return envelope?.value ?? {};
}

/**
 * Save the full partials data map to IndexedDB.
 */
export async function savePartialsData(data: AllPartialsData): Promise<void> {
  await writeToDb('app_partialsData', data);
}

// ─── Special Notes ──────────────────────────────────────────────────────────

/**
 * Get special notes from IndexedDB.
 */
export async function getSpecialNotes(): Promise<SpecialNote[]> {
  const envelope = await readFromDb<SpecialNote[]>('app_specialNotes');
  return envelope?.value ?? [];
}

/**
 * Save special notes to IndexedDB.
 */
export async function saveSpecialNotes(notes: SpecialNote[]): Promise<void> {
  await writeToDb('app_specialNotes', notes);
}

// ─── Active Group ID ────────────────────────────────────────────────────────

/**
 * Get the currently selected group ID from IndexedDB.
 * Key: `activeGroupId_v1` (matches use-data.tsx).
 */
export async function getActiveGroupId(): Promise<string | null> {
  const envelope = await readFromDb<string>('activeGroupId_v1');
  const val = envelope?.value;
  if (typeof val === 'string' && val) return val;
  return null;
}

/**
 * Set the currently selected group ID in IndexedDB.
 * Pass `null` to clear the selection.
 */
export async function setActiveGroupId(id: string | null): Promise<void> {
  if (id) {
    await writeToDb('activeGroupId_v1', id);
  } else {
    await removeFromDb('activeGroupId_v1');
  }
}
