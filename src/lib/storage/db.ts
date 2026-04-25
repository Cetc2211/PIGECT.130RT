// ============================================================================
// DB — Typed wrapper over idb-keyval (IndexedDB) and localStorage
// ============================================================================
// This module provides the low-level read/write primitives used by all
// repository modules.  It intentionally does NOT import any domain types
// so it stays framework-agnostic and easily testable.
// ============================================================================

import { get, set, del, clear } from 'idb-keyval';
import type { DbKey, StorageEnvelope } from './types';

// ─── Environment guard ──────────────────────────────────────────────────────

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// ─── IDB helpers (async, via idb-keyval) ────────────────────────────────────

/**
 * Read a value from IndexedDB.  Returns `undefined` when the key does not
 * exist or when running outside the browser (SSR).
 *
 * Handles two storage shapes:
 *  1. `StorageEnvelope<T>` — the canonical shape written by `writeToDb`.
 *  2. Bare `T` — legacy data that was stored without an envelope.
 */
export async function readFromDb<T>(
  key: DbKey | string,
): Promise<StorageEnvelope<T> | undefined> {
  if (!isBrowser()) return undefined;
  try {
    const raw = await get(key);
    if (raw && typeof raw === 'object' && 'value' in raw) {
      return raw as StorageEnvelope<T>;
    }
    if (raw) {
      // Legacy: bare value without envelope wrapper
      return { value: raw as T, lastUpdated: 0 };
    }
  } catch (e) {
    console.warn(`[storage/db] Error reading "${key}":`, e);
  }
  return undefined;
}

/**
 * Write a value to IndexedDB wrapped in a StorageEnvelope.
 */
export async function writeToDb<T>(key: DbKey | string, value: T): Promise<void> {
  if (!isBrowser()) return;
  const payload: StorageEnvelope<T> = { value, lastUpdated: Date.now() };
  await set(key, payload);
}

/**
 * Remove a single key from IndexedDB.
 */
export async function removeFromDb(key: DbKey | string): Promise<void> {
  if (!isBrowser()) return;
  await del(key);
}

/**
 * Clear the entire IndexedDB store used by idb-keyval.
 */
export async function clearDb(): Promise<void> {
  if (!isBrowser()) return;
  await clear();
}

// ─── localStorage helpers (synchronous) ────────────────────────────────────

/**
 * Read an array from localStorage.  Returns `[]` on missing/invalid data.
 */
export function readFromLocalStorage<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Write an array to localStorage (replaces the entire list).
 */
export function writeToLocalStorage<T>(key: string, data: T[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Read a single object value from localStorage.
 * Returns `null` on missing/invalid data.
 */
export function readSingleFromLocalStorage<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a single object value to localStorage.
 */
export function writeSingleToLocalStorage<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Remove a key from localStorage.
 */
export function removeFromLocalStorage(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}

// ─── ID generation utility ──────────────────────────────────────────────────

/**
 * Generate a unique ID.  Uses `crypto.randomUUID()` when available (modern
 * browsers), otherwise falls back to a timestamp + random-string approach.
 */
export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
